from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class WorkloadRequest(BaseModel):
    name: str = "Vision Model Training"
    owner_department: str = "College of Computer Science"
    classification: Literal["Public", "Internal", "Confidential", "Restricted"] = "Internal"
    residency: Literal["Saudi Arabia", "GCC", "Any"] = "Saudi Arabia"
    network_zone: Literal["Public", "Internal", "Restricted"] = "Internal"
    cpu: float = Field(8, gt=0)
    memory_gb: float = Field(32, gt=0)
    gpu: float = Field(1, ge=0)
    storage_gb: float = Field(100, gt=0)
    runtime: Literal["kubernetes", "vm"] = "kubernetes"
    gpu_architecture: str | None = "NVIDIA"
    encryption_required: bool = True


class PlacementEvaluationResponse(BaseModel):
    placement_id: str
    recommendation: dict[str, Any] | None
    decisions: list[dict[str, Any]]
    evaluated_at: str


class ApprovalAction(BaseModel):
    actor: str
    role: Literal["data_owner", "infrastructure_owner"]
    decision: Literal["approved", "rejected"]
    comment: str | None = None


class DeploymentRequest(BaseModel):
    image: str = "nginx:1.27-alpine"
    namespace: str = "college-a"


class PolicyInput(BaseModel):
    name: str
    scope: Literal["organization", "environment", "security"]
    rule: dict[str, Any]
    enabled: bool = True
