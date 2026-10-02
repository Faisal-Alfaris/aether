import unittest

from app.placement import WorkloadRequirements, evaluate_environment, rank_environments
from app.seed import DEMO_ENVIRONMENTS, DEMO_WORKLOAD, candidate


class PlacementEngineTests(unittest.TestCase):
    def test_internal_saudi_workload_is_eligible(self):
        workload = WorkloadRequirements(
            name="Portal", owner_department="Central IT", classification="Internal",
            residency="Saudi Arabia", network_zone="Internal", cpu=4,
            memory_gb=8, gpu=0, storage_gb=20, runtime="kubernetes",
        )
        decision = evaluate_environment(workload, candidate(allowed_departments=("Central IT",)))
        self.assertTrue(decision.eligible)
        self.assertEqual("ELIGIBLE", decision.status)

    def test_restricted_workload_is_blocked_by_classification(self):
        workload = WorkloadRequirements(
            name="Restricted research", owner_department="Central IT", classification="Restricted",
            residency="Saudi Arabia", network_zone="Internal", cpu=4,
            memory_gb=8, gpu=0, storage_gb=20, runtime="kubernetes",
        )
        decision = evaluate_environment(workload, candidate(max_classification="Internal"))
        self.assertFalse(decision.eligible)
        self.assertIn("CLASSIFICATION_POLICY_VIOLATION", {check.reason_code for check in decision.checks})

    def test_reserved_gpu_floor_cannot_be_consumed(self):
        environment = candidate(
            total_gpu=2, used_gpu=1, reserved_percent=50,
            allowed_departments=("College of Computer Science",),
        )
        decision = evaluate_environment(DEMO_WORKLOAD, environment)
        self.assertFalse(decision.eligible)
        gpu_check = next(check for check in decision.checks if check.key == "capacity_gpu")
        self.assertEqual("RESERVED_CAPACITY_THRESHOLD_REACHED", gpu_check.reason_code)

    def test_hard_constraint_cannot_be_overridden_by_high_score(self):
        environment = candidate(
            location_country="Germany", capacity_quality=1, technical_quality=1,
            policy_quality=1, efficiency_quality=1, latency_quality=1,
        )
        decision = evaluate_environment(DEMO_WORKLOAD, environment)
        self.assertFalse(decision.eligible)
        self.assertIsNone(decision.score)

    def test_seeded_demo_recommends_psi_at_94(self):
        decisions = rank_environments(DEMO_WORKLOAD, DEMO_ENVIRONMENTS)
        self.assertEqual("PSI-GPU-01", decisions[0].cluster)
        self.assertEqual(94, decisions[0].score)
        self.assertEqual(3, len([item for item in decisions if item.eligible]))


if __name__ == "__main__":
    unittest.main()
