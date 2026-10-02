from .placement import EnvironmentCandidate, WorkloadRequirements

DEMO_WORKLOAD = WorkloadRequirements(
    name="Vision Model Training",
    owner_department="College of Computer Science",
    classification="Internal",
    residency="Saudi Arabia",
    network_zone="Internal",
    cpu=8,
    memory_gb=32,
    gpu=1,
    storage_gb=100,
    runtime="kubernetes",
    gpu_architecture="NVIDIA",
    encryption_required=True,
)


def candidate(**overrides) -> EnvironmentCandidate:
    values = dict(
        id="psi-gpu-01",
        name="Prince Sultan Institute",
        cluster="PSI-GPU-01",
        owner_department="Prince Sultan Institute",
        location_country="Saudi Arabia",
        max_classification="Internal",
        allowed_departments=("*",),
        network_zones=("Internal",),
        supported_runtimes=("kubernetes", "vm"),
        gpu_architectures=("NVIDIA A100",),
        encryption_supported=True,
        approval_required=True,
        total_cpu=64,
        used_cpu=27,
        total_memory_gb=512,
        used_memory_gb=246,
        total_gpu=8,
        used_gpu=3,
        total_storage_gb=5000,
        used_storage_gb=2300,
        reserved_percent=20,
        capacity_quality=1.0,
        technical_quality=0.96,
        policy_quality=1.0,
        efficiency_quality=0.80,
        latency_quality=0.80,
        online=True,
    )
    values.update(overrides)
    return EnvironmentCandidate(**values)


DEMO_ENVIRONMENTS = [
    candidate(),
    candidate(
        id="ksu-core-01", name="Central Data Center", cluster="KSU-CORE-01",
        owner_department="Central IT", used_cpu=37, used_memory_gb=343,
        used_gpu=4, max_classification="Confidential", reserved_percent=25,
        capacity_quality=.90, technical_quality=.92, policy_quality=1,
        efficiency_quality=.67, latency_quality=.70,
    ),
    candidate(
        id="ai-lab", name="AI Research Center", cluster="AI-LAB",
        owner_department="AI Research Center", total_gpu=6, used_gpu=3,
        gpu_architectures=("NVIDIA L40S",), max_classification="Confidential",
        reserved_percent=30, capacity_quality=.70, technical_quality=.72,
        policy_quality=.85, efficiency_quality=.65, latency_quality=.70,
    ),
    candidate(
        id="eng-compute", name="Engineering College", cluster="ENG-COMPUTE",
        owner_department="Engineering College", allowed_departments=("Engineering College",),
        capacity_quality=.82, technical_quality=.88, policy_quality=.40,
        efficiency_quality=.72, latency_quality=.90,
    ),
    candidate(
        id="ccis-cluster", name="College of Computer Science", cluster="CCIS-CLUSTER",
        owner_department="College of Computer Science", total_gpu=4, used_gpu=4,
        used_cpu=56.3, used_memory_gb=420, reserved_percent=15,
        allowed_departments=("College of Computer Science",),
    ),
    candidate(
        id="ksu-cloud-01", name="Cloud Environment", cluster="KSU-CLOUD-01",
        owner_department="Cloud Center of Excellence", gpu_architectures=(), total_gpu=0,
        used_gpu=0, reserved_percent=10, capacity_quality=.91,
    ),
]
