from exceptions import ImmutableRuleError
from map_loader import MapLoader
from test_runner import TestRunner


class GuardianManager:
    """Oversees map loading and testing while enforcing rules."""

    def __init__(self, initial_units_data):
        print("🛡️ GuardianManager is now monitoring the system. 🛡️\n")
        self.map_loader = MapLoader()
        self.test_runner = TestRunner(initial_units_data)

    def start_map_test(self, map_name):
        try:
            map_data = self.map_loader.load(map_name)
            self.test_runner.run_auto_battle()
            print(f"\n🎉 All rules respected. '{map_name}' test complete.")
        except ImmutableRuleError as e:
            print("\n" + "=" * 50)
            print("🚨 Critical Error: Immutable rule broken! 🚨")
            print(f"Reason: {e}")
            print("Halting process until code is fixed.")
            print("=" * 50)
