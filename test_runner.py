import copy
from exceptions import ImmutableRuleError


class TestRunner:
    """Run automated tests such as auto battles on a map."""

    def __init__(self, initial_units_data):
        self.initial_units_data = initial_units_data
        print("--- TestRunner initialized ---")
        print(f"Initial units: {self.initial_units_data}")

    def run_auto_battle(self):
        print("\n--- Running auto battle ---")
        if not self.initial_units_data:
            raise ImmutableRuleError("[Rule #2 Violation] No initial unit data!")
        units = copy.deepcopy(self.initial_units_data)
        print("✅ [Rule 2 Passed] Cloned clean units for testing")
        print(f"Units for this test: {units}")
        # Example mutation during test
        units[0]["hp"] -= 50
        print("...battle finished...")
        print(f"Post-test units: {units}")
        print("Original units remain:", self.initial_units_data)
