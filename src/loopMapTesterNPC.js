// src/loopMapTesterNPC.js
// Helper to create and register the loop-map testing NPC.

import { Npc } from './entities.js';
import { startAquariumLoopTest } from './events/aquariumLoopTest.js';

// 플레이어 근처에 배치할 수 있도록 위치와 이미지를 인자로 받는다
// 위치와 이미지를 포함해 크기까지 지정할 수 있게 확장한다
export function registerLoopMapTester(npcManager, game, options = {}) {
    const npc = new Npc({
        x: options.x ?? 250,
        y: options.y ?? 300,
        width: options.width ?? options.tileSize ?? 192,
        height: options.height ?? options.tileSize ?? 192,
        image: options.image ?? null,
        action: () => startAquariumLoopTest(game),
    });
    npcManager.addNpc(npc);
}
