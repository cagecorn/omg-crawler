import { EventManager } from '../../src/managers/eventManager.js';
import { RLManager } from '../../src/managers/rlManager.js';
import { describe, test, assert } from '../helpers.js';

describe('RLManager', () => {
    test('initializes without error', async () => {
        const ev = new EventManager();
        const rl = new RLManager(ev);
        await rl.init();
        assert.ok(true);
    });
});
