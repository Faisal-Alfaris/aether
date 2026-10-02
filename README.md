# AETHER

**Policy-aware placement. Capacity without compromise.**

AETHER is an enterprise infrastructure orchestration and decision layer for fragmented data centers, Kubernetes clusters, GPU pools, VMs, cloud environments, and storage systems. It answers a question that schedulers alone do not: **which environment is both eligible and best for this workload?**

The governing principle is **share capacity, not data**. Resource owners publish only metadata and explicitly shareable capacity. Workload owners define technical and governance requirements. AETHER intersects both policy sets with organization guardrails before ranking eligible destinations.

## What the prototype demonstrates

- Federated infrastructure discovery and capacity visibility
- Hard policy constraints plus soft best-fit optimization
- Explainable eligible and blocked decisions
- Independent workload/data-owner and infrastructure-owner approval gates
- Demo-safe execution and real Kubernetes integration through the official Python client
- Namespace isolation, quotas, resource limits, and AETHER labels
- Append-only, hash-linked audit events
- A complete two-minute interactive product journey

## Repository

```text
app/                         Web control plane (Next-compatible TypeScript)
apps/api/                    FastAPI control plane and SQLAlchemy schema
services/placement-engine/   Placement service boundary
services/policy-engine/      Policy examples and service boundary
services/infrastructure-agent/ Metadata-only local agent
infra/docker/                Container builds
infra/kubernetes/            Raw Kubernetes resources
infra/helm/aether/           Helm chart
docs/                        API and data model documentation
tests/                       Web render/integration checks
.github/workflows/           CI for web, API, tests, and builds
```

## Open locally

Requirements: Node.js 22.13+ and Python 3.12+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the API in a second terminal:

```bash
python -m venv .venv
.venv/Scripts/pip install -r apps/api/requirements.txt
$env:DEMO_MODE="true"
.venv/Scripts/uvicorn app.main:app --app-dir apps/api --reload
```

The API is available at `http://localhost:8000`; interactive OpenAPI docs are at `/docs`.

## Demo and real modes

`DEMO_MODE=true` is the default and uses deterministic infrastructure plus simulated deployment, so a presentation never depends on cluster availability.

With `DEMO_MODE=false`, AETHER loads in-cluster credentials first and then falls back to `KUBECONFIG`. Discovery and execution credentials should be different service accounts. The included manifests model that separation.

## Validation

```bash
npm run lint
npm test
$env:PYTHONPATH="apps/api"
python -m unittest discover -s apps/api/tests -v
```

See [ARCHITECTURE.md](ARCHITECTURE.md), [DEMO.md](DEMO.md), [docs/API.md](docs/API.md), and [docs/DATABASE.md](docs/DATABASE.md).

## Product boundary

AETHER initially places portable containers, compatible Kubernetes workloads, and selected VM workloads. Legacy systems can be discovered and evaluated before a planned migration. AETHER enforces organization-approved policies; it does not claim automatic regulatory compliance or indiscriminate database migration.
