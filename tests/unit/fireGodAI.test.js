import { FireGodAI } from '../../src/ai.js';
import { SKILLS } from '../../src/data/skills.js';
import { describe, test, assert } from '../helpers.js';

const mapStub = { tileSize: 1, isWallAt: () => false };

describe('FireGodAI', () => {
    test('uses fire nova when enemy nearby', () => {
        const ai = new FireGodAI();
        const self = {
            x: 0, y: 0, attackRange: 10, tileSize: 1,
            mp: 20, skills: [SKILLS.fire_nova.id],
            skillCooldowns: {}
        };
        const enemy = { x: 5, y: 0 };
        const ctx = { player: {}, allies: [self], enemies: [enemy], mapManager: mapStub };
        const action = ai.decideAction(self, ctx);
        assert.strictEqual(action.type, 'skill');
        assert.strictEqual(action.skillId, SKILLS.fire_nova.id);
    });
});
