from __future__ import annotations

import os
import re
import uuid
from abc import ABC, abstractmethod

from .placement import WorkloadRequirements


class InfrastructureConnector(ABC):
    @abstractmethod
    def discover(self) -> dict:
        raise NotImplementedError

    @abstractmethod
    def deploy(self, workload: WorkloadRequirements, namespace: str, image: str) -> dict:
        raise NotImplementedError


class DemoConnector(InfrastructureConnector):
    def discover(self) -> dict:
        return {
            "mode": "demo",
            "connected": True,
            "clusters": 5,
            "nodes": 38,
            "pods": 612,
            "message": "Deterministic demo inventory is active",
        }

    def deploy(self, workload: WorkloadRequirements, namespace: str, image: str) -> dict:
        return {
            "id": f"dep-{uuid.uuid4().hex[:8]}",
            "mode": "demo",
            "simulated": True,
            "status": "running",
            "namespace": namespace,
            "deployment": slugify(workload.name),
            "pod_ready": "1/1",
            "image": image,
            "labels": aether_labels(workload, "PL-2026-0148"),
        }


class KubernetesConnector(InfrastructureConnector):
    """Official-client Kubernetes adapter with separated execution privileges."""

    def __init__(self) -> None:
        try:
            from kubernetes import client, config
        except ImportError as exc:
            raise RuntimeError("Install the official kubernetes Python package") from exc

        self.client = client
        try:
            config.load_incluster_config()
        except config.ConfigException:
            config.load_kube_config(config_file=os.getenv("KUBECONFIG") or None)
        self.core = client.CoreV1Api()
        self.apps = client.AppsV1Api()

    def discover(self) -> dict:
        nodes = self.core.list_node().items
        pods = self.core.list_pod_for_all_namespaces().items
        return {
            "mode": "real",
            "connected": True,
            "nodes": [
                {
                    "name": node.metadata.name,
                    "capacity": dict(node.status.capacity or {}),
                    "allocatable": dict(node.status.allocatable or {}),
                    "labels": {
                        key: value for key, value in (node.metadata.labels or {}).items()
                        if key.startswith("topology.kubernetes.io/") or key.startswith("nvidia.com/")
                    },
                }
                for node in nodes
            ],
            "pods": len(pods),
        }

    def deploy(self, workload: WorkloadRequirements, namespace: str, image: str) -> dict:
        client = self.client
        name = slugify(workload.name)
        labels = aether_labels(workload, "PL-2026-0148")

        namespace_body = client.V1Namespace(
            metadata=client.V1ObjectMeta(name=namespace, labels=labels)
        )
        try:
            self.core.create_namespace(namespace_body)
        except client.ApiException as exc:
            if exc.status != 409:
                raise

        quota = client.V1ResourceQuota(
            metadata=client.V1ObjectMeta(name="aether-placement-quota", namespace=namespace, labels=labels),
            spec=client.V1ResourceQuotaSpec(hard={
                "requests.cpu": str(workload.cpu),
                "limits.cpu": str(workload.cpu),
                "requests.memory": f"{workload.memory_gb:g}Gi",
                "limits.memory": f"{workload.memory_gb:g}Gi",
                "requests.storage": f"{workload.storage_gb:g}Gi",
                "requests.nvidia.com/gpu": str(int(workload.gpu)),
                "limits.nvidia.com/gpu": str(int(workload.gpu)),
            }),
        )
        try:
            self.core.create_namespaced_resource_quota(namespace, quota)
        except client.ApiException as exc:
            if exc.status != 409:
                raise

        resources = {
            "cpu": str(workload.cpu),
            "memory": f"{workload.memory_gb:g}Gi",
        }
        if workload.gpu:
            resources["nvidia.com/gpu"] = str(int(workload.gpu))
        container = client.V1Container(
            name=name,
            image=image,
            resources=client.V1ResourceRequirements(requests=resources, limits=resources),
        )
        deployment = client.V1Deployment(
            metadata=client.V1ObjectMeta(name=name, namespace=namespace, labels=labels),
            spec=client.V1DeploymentSpec(
                replicas=1,
                selector=client.V1LabelSelector(match_labels={"aether.io/workload": name}),
                template=client.V1PodTemplateSpec(
                    metadata=client.V1ObjectMeta(labels=labels),
                    spec=client.V1PodSpec(containers=[container]),
                ),
            ),
        )
        try:
            self.apps.create_namespaced_deployment(namespace, deployment)
        except client.ApiException as exc:
            if exc.status == 409:
                self.apps.replace_namespaced_deployment(name, namespace, deployment)
            else:
                raise
        return {
            "id": f"dep-{uuid.uuid4().hex[:8]}",
            "mode": "real",
            "simulated": False,
            "status": "deploying",
            "namespace": namespace,
            "deployment": name,
            "image": image,
            "labels": labels,
        }


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:63]


def aether_labels(workload: WorkloadRequirements, placement_id: str) -> dict[str, str]:
    return {
        "aether.io/owner": slugify(workload.owner_department),
        "aether.io/classification": workload.classification.lower(),
        "aether.io/residency": slugify(workload.residency),
        "aether.io/workload": slugify(workload.name),
        "aether.io/placement-id": placement_id.lower(),
    }


def connector_from_environment() -> InfrastructureConnector:
    if os.getenv("DEMO_MODE", "true").lower() in {"1", "true", "yes"}:
        return DemoConnector()
    return KubernetesConnector()
