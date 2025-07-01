// src/loopMapTesterNPC.js
// Helper to create and register the loop-map testing NPC.

import { Npc } from './entities.js';
import { startAquariumLoopTest } from './events/aquariumLoopTest.js';

export function registerLoopMapTester(npcManager) {
    const npc = new Npc({
        x: 250,
        y: 300,
        image: null, // image asset could be assigned by the game when available
        action: startAquariumLoopTest,
    });
    npcManager.addNpc(npc);
}
