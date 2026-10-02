# Database schema

The prototype uses PostgreSQL through SQLAlchemy. Identifiers are UUIDs and timestamps are UTC.

| Table | Purpose | Key relationships |
|---|---|---|
| `organizations` | Tenant boundary | has departments, environments, policies |
| `departments` | Workload/resource ownership | belongs to organization |
| `environments` | Discovered execution targets | owned by department |
| `capacity_snapshots` | Time-series capacity metadata | belongs to environment |
| `workloads` | Portable workload definition | owned by department |
| `placement_requests` | Immutable requirement snapshot | references workload |
| `placement_decisions` | Eligibility, score, and evidence | references request/environment |
| `approvals` | Data-owner and infrastructure-owner votes | references request |
| `deployments` | Connector execution state | references approved request |
| `policies` | Versioned organization/resource rules | scoped to organization/environment |
| `audit_events` | Append-only action history | references actor and aggregate |

JSONB is used for structured policy rules, requirement snapshots, capacity details, and decision evidence. It preserves explainability while stable query fields such as status, scope, timestamps, and ownership stay relational.
