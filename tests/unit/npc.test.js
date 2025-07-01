import { Npc } from '../../src/entities.js';
import { NpcManager } from '../../src/managers/npcManager.js';
import { describe, test, assert } from '../helpers.js';

describe('NPC System', () => {
    test('action triggers on collision', () => {
        let called = false;
        const npc = new Npc({ x: 0, y: 0, width: 10, height: 10, action: () => { called = true; } });
        const manager = new NpcManager();
        manager.addNpc(npc);
        const player = { x: 0, y: 0, width: 10, height: 10 };
        manager.update(player);
        assert.ok(called);
    });
});
