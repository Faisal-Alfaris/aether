# Placement engine service

The production boundary for the pure deterministic engine in `apps/api/app/placement.py`. It accepts an immutable workload-requirement snapshot and environment metadata, evaluates hard constraints, and ranks eligible results. It has no execution credentials and performs no infrastructure mutation.
