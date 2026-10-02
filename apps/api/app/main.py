from __future__ import annotations

import hashlib
import json
import os
import uuid
from dataclasses import asdict
from datetime import UTC, datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .connectors import connector_from_environment
from .placement import WorkloadRequirements, rank_environments
from .schemas import ApprovalAction, DeploymentRequest, PlacementEvaluationResponse, PolicyInput, WorkloadRequest
from .seed import DEMO_ENVIRONMENTS

app = FastAPI(
    title="AETHER Control Plane API",
    version="0.1.0",
    description="Policy-aware infrastructure placement and governed execution.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

placements: dict[str, dict] = {}
audit_events: list[dict] = []
policies: list[dict] = [
    {"id": "POL-001", "name": "Restricted Data Residency", "scope": "organization", "enabled": True, "rule": {"if": {"classification": "Restricted"}, "then": {"location": "Saudi Arabia"}}},
    {"id": "POL-002", "name": "Cross-Department GPU Sharing", "scope": "organization", "enabled": True, "rule": {"if": {"resource": "GPU", "classification_lte": "Internal"}, "allow": {"cross_department": True}}},
    {"id": "POL-003", "name": "Reserved Capacity", "scope": "environment", "enabled": True, "rule": {"retain_percent": 20}},
]


def audit(actor: str, action: str, target: str, outcome: str, evidence: dict | None = None) -> dict:
    previous_hash = audit_events[0]["event_hash"] if audit_events else "0" * 64
    payload = {
        "id": str(uuid.uuid4()), "occurred_at": datetime.now(UTC).isoformat(),
        "actor": actor, "action": action, "target": target, "outcome": outcome,
        "evidence": evidence or {}, "previous_hash": previous_hash,
    }
    payload["event_hash"] = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    audit_events.insert(0, payload)
    return payload


@app.get("/api/v1/health")
def health() -> dict:
    demo_mode = os.getenv("DEMO_MODE", "true").lower() in {"1", "true", "yes"}
    return {"status": "ok", "mode": "demo" if demo_mode else "real", "service": "aether-api"}


@app.get("/api/v1/environments")
def list_environments() -> list[dict]:
    return [asdict(environment) for environment in DEMO_ENVIRONMENTS]


@app.get("/api/v1/kubernetes/clusters")
def discover_kubernetes() -> dict:
    try:
        return connector_from_environment().discover()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Kubernetes discovery unavailable: {exc}") from exc


@app.post("/api/v1/placements/evaluate", response_model=PlacementEvaluationResponse)
def evaluate_placement(body: WorkloadRequest) -> PlacementEvaluationResponse:
    workload = WorkloadRequirements(**body.model_dump())
    decisions = rank_environments(workload, DEMO_ENVIRONMENTS)
    placement_id = f"PL-{datetime.now(UTC).year}-{uuid.uuid4().hex[:4].upper()}"
    recommendation = next((decision for decision in decisions if decision.eligible), None)
    placements[placement_id] = {
        "workload": workload,
        "decisions": decisions,
        "approvals": {"data_owner": "approved", "infrastructure_owner": "pending"},
        "status": "awaiting_approval",
    }
    audit("AETHER Engine", "placement.evaluated", placement_id, "eligible" if recommendation else "blocked", {"decisions": [decision.to_dict() for decision in decisions]})
    return PlacementEvaluationResponse(
        placement_id=placement_id,
        recommendation=recommendation.to_dict() if recommendation else None,
        decisions=[decision.to_dict() for decision in decisions],
        evaluated_at=datetime.now(UTC).isoformat(),
    )


@app.post("/api/v1/placements/{placement_id}/request-approval")
def request_approval(placement_id: str) -> dict:
    placement = placements.get(placement_id)
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found")
    placement["status"] = "awaiting_approval"
    audit("Workload Owner", "approval.requested", placement_id, "pending")
    return {"placement_id": placement_id, "approvals": placement["approvals"]}


@app.post("/api/v1/placements/{placement_id}/approvals")
def decide_approval(placement_id: str, body: ApprovalAction) -> dict:
    placement = placements.get(placement_id)
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found")
    placement["approvals"][body.role] = body.decision
    statuses = set(placement["approvals"].values())
    placement["status"] = "rejected" if "rejected" in statuses else "approved" if statuses == {"approved"} else "awaiting_approval"
    audit(body.actor, f"approval.{body.decision}", placement_id, placement["status"], {"role": body.role, "comment": body.comment})
    return {"placement_id": placement_id, "status": placement["status"], "approvals": placement["approvals"]}


@app.post("/api/v1/placements/{placement_id}/deploy")
def deploy(placement_id: str, body: DeploymentRequest) -> dict:
    placement = placements.get(placement_id)
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found")
    if set(placement["approvals"].values()) != {"approved"}:
        raise HTTPException(status_code=409, detail="Both owner approvals are required before deployment")
    try:
        result = connector_from_environment().deploy(placement["workload"], body.namespace, body.image)
    except Exception as exc:
        audit("Kubernetes Connector", "deployment.failed", placement_id, "failed", {"error": str(exc)})
        raise HTTPException(status_code=503, detail=f"Deployment failed: {exc}") from exc
    placement["status"] = result["status"]
    placement["deployment"] = result
    audit("Kubernetes Connector", "deployment.created", placement_id, result["status"], result)
    return result


@app.get("/api/v1/deployments/{placement_id}")
def deployment_status(placement_id: str) -> dict:
    placement = placements.get(placement_id)
    if not placement or "deployment" not in placement:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return placement["deployment"]


@app.get("/api/v1/audit-events")
def list_audit_events() -> list[dict]:
    return audit_events


@app.get("/api/v1/policies")
def list_policies() -> list[dict]:
    return policies


@app.post("/api/v1/policies", status_code=201)
def create_policy(body: PolicyInput) -> dict:
    policy = {"id": f"POL-{len(policies) + 1:03d}", **body.model_dump()}
    policies.append(policy)
    audit("Platform Administrator", "policy.created", policy["id"], "enabled" if policy["enabled"] else "disabled", policy["rule"])
    return policy
