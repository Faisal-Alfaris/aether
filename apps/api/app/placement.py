from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Literal

CLASSIFICATION_LEVEL = {
    "Public": 0,
    "Internal": 1,
    "Confidential": 2,
    "Restricted": 3,
}


@dataclass(frozen=True)
class WorkloadRequirements:
    name: str
    owner_department: str
    classification: str
    residency: str
    network_zone: str
    cpu: float
    memory_gb: float
    gpu: float
    storage_gb: float
    runtime: str = "kubernetes"
    gpu_architecture: str | None = None
    encryption_required: bool = True


@dataclass(frozen=True)
class EnvironmentCandidate:
    id: str
    name: str
    cluster: str
    owner_department: str
    location_country: str
    max_classification: str
    allowed_departments: tuple[str, ...]
    network_zones: tuple[str, ...]
    supported_runtimes: tuple[str, ...]
    gpu_architectures: tuple[str, ...]
    encryption_supported: bool
    approval_required: bool
    total_cpu: float
    used_cpu: float
    total_memory_gb: float
    used_memory_gb: float
    total_gpu: float
    used_gpu: float
    total_storage_gb: float
    used_storage_gb: float
    reserved_percent: float
    capacity_quality: float
    technical_quality: float
    policy_quality: float
    efficiency_quality: float
    latency_quality: float
    online: bool = True


@dataclass(frozen=True)
class ConstraintCheck:
    key: str
    label: str
    passed: bool
    detail: str
    reason_code: str | None = None


@dataclass(frozen=True)
class PlacementDecision:
    environment_id: str
    environment_name: str
    cluster: str
    status: Literal["ELIGIBLE", "BLOCKED"]
    eligible: bool
    score: int | None
    checks: tuple[ConstraintCheck, ...]
    score_components: dict[str, int] = field(default_factory=dict)
    reasons: tuple[str, ...] = ()

    def to_dict(self) -> dict:
        value = asdict(self)
        value["checks"] = [asdict(check) for check in self.checks]
        return value


def _available(total: float, used: float, reserved_percent: float) -> float:
    """Capacity available after preserving the owner's reserved floor."""
    return max(0.0, total * (1 - reserved_percent / 100) - used)


def _capacity_checks(
    workload: WorkloadRequirements, environment: EnvironmentCandidate
) -> list[ConstraintCheck]:
    resources = (
        ("cpu", "CPU", workload.cpu, environment.total_cpu, environment.used_cpu, "vCPU"),
        ("memory", "Memory", workload.memory_gb, environment.total_memory_gb, environment.used_memory_gb, "GB"),
        ("gpu", "GPU", workload.gpu, environment.total_gpu, environment.used_gpu, "GPU"),
        ("storage", "Storage", workload.storage_gb, environment.total_storage_gb, environment.used_storage_gb, "GB"),
    )
    checks: list[ConstraintCheck] = []
    for key, label, requested, total, used, unit in resources:
        available = _available(total, used, environment.reserved_percent)
        passed = available >= requested
        checks.append(
            ConstraintCheck(
                key=f"capacity_{key}",
                label=f"{label} capacity",
                passed=passed,
                detail=(
                    f"{available:.1f} {unit} shareable after {environment.reserved_percent:.0f}% reserve; "
                    f"{requested:g} {unit} requested"
                ),
                reason_code=None if passed else "RESERVED_CAPACITY_THRESHOLD_REACHED",
            )
        )
    return checks


def evaluate_environment(
    workload: WorkloadRequirements, environment: EnvironmentCandidate
) -> PlacementDecision:
    allowed_department = (
        "*" in environment.allowed_departments
        or workload.owner_department in environment.allowed_departments
    )
    classification_passed = (
        CLASSIFICATION_LEVEL[workload.classification]
        <= CLASSIFICATION_LEVEL[environment.max_classification]
    )
    residency_passed = (
        workload.residency == "Any"
        or workload.residency == environment.location_country
        or (workload.residency == "GCC" and environment.location_country in {"Saudi Arabia", "Bahrain", "Kuwait", "Oman", "Qatar", "UAE"})
    )
    runtime_passed = workload.runtime.lower() in {
        runtime.lower() for runtime in environment.supported_runtimes
    }
    gpu_passed = workload.gpu == 0 or (
        workload.gpu_architecture is not None
        and any(
            workload.gpu_architecture.lower() in architecture.lower()
            or architecture.lower() in workload.gpu_architecture.lower()
            for architecture in environment.gpu_architectures
        )
    )

    checks: list[ConstraintCheck] = [
        ConstraintCheck("online", "Environment status", environment.online, "Agent is online" if environment.online else "Discovery agent is offline", None if environment.online else "ENVIRONMENT_OFFLINE"),
        ConstraintCheck("classification", "Classification", classification_passed, f"{environment.max_classification} is the highest allowed classification", None if classification_passed else "CLASSIFICATION_POLICY_VIOLATION"),
        ConstraintCheck("residency", "Residency", residency_passed, f"Environment is located in {environment.location_country}", None if residency_passed else "RESIDENCY_POLICY_VIOLATION"),
        ConstraintCheck("owner_policy", "Resource owner policy", allowed_department, "Workload owner is explicitly allowed" if allowed_department else "External departments are not permitted by the resource owner", None if allowed_department else "RESOURCE_OWNER_DENIED"),
        ConstraintCheck("network", "Network zone", workload.network_zone in environment.network_zones, f"Available zones: {', '.join(environment.network_zones)}", None if workload.network_zone in environment.network_zones else "NETWORK_ZONE_MISMATCH"),
        ConstraintCheck("runtime", "Runtime compatibility", runtime_passed, f"Supported runtimes: {', '.join(environment.supported_runtimes)}", None if runtime_passed else "RUNTIME_INCOMPATIBLE"),
        ConstraintCheck("gpu_architecture", "GPU compatibility", gpu_passed, "Requested GPU architecture is available" if gpu_passed else "Requested GPU architecture is unavailable", None if gpu_passed else "GPU_ARCHITECTURE_MISMATCH"),
        ConstraintCheck("encryption", "Encryption", not workload.encryption_required or environment.encryption_supported, "Encryption at rest and in transit is supported" if environment.encryption_supported else "Required encryption controls are unavailable", None if (not workload.encryption_required or environment.encryption_supported) else "ENCRYPTION_REQUIRED"),
    ]
    checks.extend(_capacity_checks(workload, environment))

    failed = tuple(check for check in checks if not check.passed)
    if failed:
        return PlacementDecision(
            environment_id=environment.id,
            environment_name=environment.name,
            cluster=environment.cluster,
            status="BLOCKED",
            eligible=False,
            score=None,
            checks=tuple(checks),
            reasons=tuple(check.detail for check in failed),
        )

    weighted = {
        "capacity": round(environment.capacity_quality * 30),
        "technical_fit": round(environment.technical_quality * 25),
        "policy_fit": round(environment.policy_quality * 20),
        "resource_efficiency": round(environment.efficiency_quality * 15),
        "latency": round(environment.latency_quality * 10),
    }
    score = min(100, sum(weighted.values()))
    return PlacementDecision(
        environment_id=environment.id,
        environment_name=environment.name,
        cluster=environment.cluster,
        status="ELIGIBLE",
        eligible=True,
        score=score,
        checks=tuple(checks),
        score_components=weighted,
        reasons=(
            "All hard constraints passed",
            f"{environment.reserved_percent:.0f}% owner reserve remains protected",
        ),
    )


def rank_environments(
    workload: WorkloadRequirements, environments: list[EnvironmentCandidate]
) -> list[PlacementDecision]:
    decisions = [evaluate_environment(workload, environment) for environment in environments]
    return sorted(decisions, key=lambda item: (item.eligible, item.score or -1), reverse=True)
