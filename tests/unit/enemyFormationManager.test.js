import { EnemyFormationManager } from '../../src/managers/enemyFormationManager.js';
import { MeleeAI, RangedAI, HealerAI } from '../../src/ai.js';
import { describe, test, assert } from '../helpers.js';

describe('EnemyFormationManager', () => {
    test('arrange by ai type', () => {
        const fm = new EnemyFormationManager(3,3,10);
        const m1 = { id: 'm1', ai: new MeleeAI() };
        const m2 = { id: 'm2', ai: new RangedAI() };
        const m3 = { id: 'm3', ai: new HealerAI() };
        fm.arrange([m1, m2, m3]);
        const rowOf = id => Math.floor(fm.findSlotIndex(id) / fm.cols);
        assert.equal(rowOf(m1.id), 0);
        assert.equal(rowOf(m2.id), 1);
        assert.equal(rowOf(m3.id), 2);
    });
});
