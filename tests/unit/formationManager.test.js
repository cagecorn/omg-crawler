import { FormationManager } from '../../src/managers/formationManager.js';
import { describe, test, assert } from '../helpers.js';

describe('FormationManager', () => {
    test('assign and position', () => {
        const fm = new FormationManager(3,3,10);
        fm.assign(4, 'A');
        const pos = fm.getSlotPosition(4);
        assert.equal(pos.x, 0);
        assert.equal(pos.y, 0);
    });

    test('multiple entities in one slot', () => {
        const fm = new FormationManager(2,2,10);
        fm.assign(0, 'A');
        fm.assign(0, 'B');
        assert.deepEqual(Array.from(fm.slots[0]), ['A','B']);
        assert.equal(fm.findSlotIndex('B'), 0);
    });
});

