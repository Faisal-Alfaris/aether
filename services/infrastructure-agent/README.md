# Infrastructure agent

Deploy this small service near each infrastructure domain with read-only discovery RBAC. It exposes capacity, allocatable resources, topology, and aggregate workload state. It does not expose database contents, secrets, logs, or tenant data. Execution uses a separate identity owned by the control plane.
