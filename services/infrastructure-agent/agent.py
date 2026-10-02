"""Metadata-only AETHER agent. This service never reads application data."""

from fastapi import FastAPI, HTTPException
from kubernetes import client, config

app = FastAPI(title="AETHER Infrastructure Agent", version="0.1.0")


def core_api() -> client.CoreV1Api:
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()
    return client.CoreV1Api()


@app.get("/v1/metadata")
def metadata() -> dict:
    try:
        core = core_api()
        nodes = core.list_node().items
        pods = core.list_pod_for_all_namespaces().items
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Cluster metadata is unavailable") from exc

    return {
        "nodes": [
            {
                "name": node.metadata.name,
                "capacity": node.status.capacity,
                "allocatable": node.status.allocatable,
                "topology": {
                    key: value
                    for key, value in (node.metadata.labels or {}).items()
                    if key.startswith("topology.kubernetes.io/")
                },
            }
            for node in nodes
        ],
        "workload_summary": {
            "pods_total": len(pods),
            "pods_running": sum(pod.status.phase == "Running" for pod in pods),
        },
        "data_accessed": False,
    }
