# Two-minute demo

1. Open Overview and point out 39% available capacity, SAR 2.7B potential recoverable capacity, and 12 connected environments.
2. Open Infrastructure, filter to Available, and inspect `PSI-GPU-01` at Prince Sultan Institute.
3. Choose New placement. The seeded Vision Model Training request asks for 8 CPU, 32 GB RAM, 1 NVIDIA GPU, 100 GB storage, Saudi residency, and Internal classification.
4. Run the engine. Show each hard-policy check and the 94% Prince Sultan Institute recommendation. Expand Engineering Cluster to show why it is blocked.
5. Request approval. Data owner is already approved; approve the infrastructure owner gate.
6. Deploy. In demo mode the state progresses from Deploying to Running. In real mode the API creates namespace `college-a` and an isolated Kubernetes deployment.
7. Open Audit to show the recorded evaluation, approvals, and deployment.

Set `DEMO_MODE=true` for presentation reliability. Set it to `false` and provide `KUBECONFIG` only when demonstrating a reachable cluster.
