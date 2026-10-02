# AETHER Architecture

AETHER is a policy-aware placement control plane. It discovers infrastructure metadata, intersects workload-owner requirements with resource-owner and organization policy, ranks only eligible environments, and delegates execution to a connector.

## System boundaries

```text
Web console
    |
AETHER API ── Audit service
    |
    +── Placement engine ── Policy engine
    +── Approval service
    +── Infrastructure inventory
    |
Connector interface
    +── Kubernetes connector (official Python client)
    +── Demo connector (deterministic seeded state)
```

The control plane receives metadata only: allocatable CPU, memory, GPU, storage, capabilities, location, classification allowances, and sharing policy. It never inspects tenant data. Discovery uses read-only credentials; execution uses a separate, narrowly scoped service account.

## Placement decision

Hard constraints are evaluated before scoring: residency, classification, workload and resource-owner authorization, minimum resources after reserved capacity, security zone, runtime type, encryption support, and GPU architecture. Any failure produces `BLOCKED` with a stable reason code and human-readable explanation.

Eligible destinations are scored from 0–100:

| Signal | Weight |
|---|---:|
| Capacity headroom | 30% |
| Technical fit | 25% |
| Policy fit | 20% |
| Resource efficiency | 15% |
| Latency | 10% |

Scores never override a hard constraint. The API persists the complete decision trace so each recommendation can be reproduced and audited.

## Trust and tenancy

- Workload owners define classification, residency, security, and runtime requirements.
- Resource owners explicitly publish shareable capacity and allowed consumers.
- Organization policies establish non-bypassable guardrails.
- Both workload/data-owner and infrastructure-owner approvals are required before execution.
- Kubernetes execution creates an isolated namespace, quotas, labels, and a dedicated workload; it never inserts tenant data into another department's operational database.

## Deployment modes

- `DEMO_MODE=true`: deterministic seeded inventory and simulated execution; the full presentation works without a cluster.
- `DEMO_MODE=false`: reads the configured kubeconfig or in-cluster identity and uses the official Kubernetes Python client.

The web console is an edge-deployable Next-compatible application. The API is a containerized FastAPI service backed by PostgreSQL. Helm and raw Kubernetes resources are provided for cluster deployments.
