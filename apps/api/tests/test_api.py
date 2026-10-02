import unittest

from app.main import audit_events, decide_approval, deploy, evaluate_placement, placements
from app.schemas import ApprovalAction, DeploymentRequest, WorkloadRequest


class ApiWorkflowTests(unittest.TestCase):
    def setUp(self):
        placements.clear()
        audit_events.clear()

    def test_evaluate_approve_and_deploy_demo_workload(self):
        evaluation = evaluate_placement(WorkloadRequest())
        self.assertEqual("PSI-GPU-01", evaluation.recommendation["cluster"])
        self.assertEqual(94, evaluation.recommendation["score"])

        approval = decide_approval(
            evaluation.placement_id,
            ApprovalAction(
                actor="Omar Al-Rashid",
                role="infrastructure_owner",
                decision="approved",
            ),
        )
        self.assertEqual("approved", approval["status"])

        result = deploy(evaluation.placement_id, DeploymentRequest())
        self.assertTrue(result["simulated"])
        self.assertEqual("running", result["status"])
        self.assertEqual("internal", result["labels"]["aether.io/classification"])
        self.assertEqual(3, len(audit_events))


if __name__ == "__main__":
    unittest.main()
