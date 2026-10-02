from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class IdMixin:
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Organization(IdMixin, Base):
    __tablename__ = "organizations"
    name: Mapped[str] = mapped_column(String(180), unique=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)


class Department(IdMixin, Base):
    __tablename__ = "departments"
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    name: Mapped[str] = mapped_column(String(180))
    owner_email: Mapped[str] = mapped_column(String(255))


class Environment(IdMixin, Base):
    __tablename__ = "environments"
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    owner_department_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departments.id"), index=True)
    name: Mapped[str] = mapped_column(String(180))
    cluster: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    connector_type: Mapped[str] = mapped_column(String(40), default="kubernetes")
    location_country: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40), default="healthy")
    capabilities: Mapped[dict] = mapped_column(JSONB, default=dict)
    sharing_policy: Mapped[dict] = mapped_column(JSONB, default=dict)


class CapacitySnapshot(IdMixin, Base):
    __tablename__ = "capacity_snapshots"
    environment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("environments.id"), index=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    capacity: Mapped[dict] = mapped_column(JSONB)
    utilization: Mapped[dict] = mapped_column(JSONB)


class Workload(IdMixin, Base):
    __tablename__ = "workloads"
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    owner_department_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departments.id"), index=True)
    name: Mapped[str] = mapped_column(String(180))
    runtime: Mapped[str] = mapped_column(String(40))
    classification: Mapped[str] = mapped_column(String(40), index=True)
    status: Mapped[str] = mapped_column(String(40), default="draft")


class PlacementRequest(IdMixin, Base):
    __tablename__ = "placement_requests"
    workload_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workloads.id"), index=True)
    requirements: Mapped[dict] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(40), default="evaluating", index=True)
    requested_by: Mapped[str] = mapped_column(String(255))


class PlacementDecision(IdMixin, Base):
    __tablename__ = "placement_decisions"
    placement_request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("placement_requests.id"), index=True)
    environment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("environments.id"), index=True)
    eligible: Mapped[bool] = mapped_column(Boolean)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    evidence: Mapped[dict] = mapped_column(JSONB)


class Approval(IdMixin, Base):
    __tablename__ = "approvals"
    placement_request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("placement_requests.id"), index=True)
    gate: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(40), default="pending")
    actor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Deployment(IdMixin, Base):
    __tablename__ = "deployments"
    placement_request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("placement_requests.id"), index=True)
    environment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("environments.id"), nullable=True)
    namespace: Mapped[str] = mapped_column(String(120))
    workload_name: Mapped[str] = mapped_column(String(180))
    connector_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="deploying")
    details: Mapped[dict] = mapped_column(JSONB, default=dict)


class Policy(IdMixin, Base):
    __tablename__ = "policies"
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    environment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("environments.id"), nullable=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    name: Mapped[str] = mapped_column(String(180))
    scope: Mapped[str] = mapped_column(String(40))
    version: Mapped[int] = mapped_column(default=1)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    rule: Mapped[dict] = mapped_column(JSONB)


class AuditEvent(IdMixin, Base):
    __tablename__ = "audit_events"
    organization_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"), nullable=True, index=True)
    actor: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(120), index=True)
    target_type: Mapped[str] = mapped_column(String(80))
    target_id: Mapped[str] = mapped_column(String(120), index=True)
    outcome: Mapped[str] = mapped_column(String(80))
    evidence: Mapped[dict] = mapped_column(JSONB, default=dict)
    previous_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    event_hash: Mapped[str] = mapped_column(String(64), index=True)
