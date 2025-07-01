import os
from exceptions import ImmutableRuleError


class MapLoader:
    """Load map resources while enforcing required tiles exist."""

    REQUIRED_TILES = ["wall.png", "floor.png"]

    def __init__(self, map_directory="maps"):
        self.map_directory = map_directory

    def load(self, map_name):
        """Load map data after verifying required tiles."""
        print(f"--- Loading map '{map_name}' ---")
        map_path = os.path.join(self.map_directory, map_name)
        for tile in self.REQUIRED_TILES:
            if not os.path.exists(os.path.join(map_path, tile)):
                raise ImmutableRuleError(
                    f"[Rule #1 Violation] Required tile '{tile}' missing in map '{map_name}'."
                )
        print("✅ [Rule 1 Passed] All required tiles present.")
        # Placeholder for real loading logic
        return {"name": map_name, "data": "Map loaded successfully"}
