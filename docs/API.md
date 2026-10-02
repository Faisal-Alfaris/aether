# API design

Base path: `/api/v1`

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Liveness, mode, and connector readiness |
| `GET` | `/environments` | Federated inventory with current capacity |
| `GET` | `/kubernetes/clusters` | Cluster/node/pod discovery metadata |
| `POST` | `/placements/evaluate` | Evaluate hard constraints and rank eligible targets |
| `POST` | `/placements/{id}/request-approval` | Open both approval gates |
| `POST` | `/approvals/{id}` | Approve or reject one owner gate |
| `POST` | `/placements/{id}/deploy` | Enforce approvals and delegate execution |
| `GET` | `/deployments/{id}` | Current connector status |
| `GET` | `/audit-events` | Filtered append-only decision/action log |
| `GET/POST/PATCH` | `/policies` | List, create, edit, or enable policies |

Evaluation responses always include `eligible`, `score`, hard-constraint checks, optimization components, and explanations. Blocked results are retained alongside eligible results so the UI can explain alternatives.
