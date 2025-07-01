import { LaneManager } from '../../src/managers/laneManager.js';
import { describe, test, assert } from '../helpers.js';

describe('LaneManager', () => {
    test('laneY positions stored', () => {
        const lm = new LaneManager(300, 300);
        assert.ok(lm.laneY.TOP > 0 && lm.laneY.BOTTOM > lm.laneY.TOP, 'laneY not set');
    });
});
