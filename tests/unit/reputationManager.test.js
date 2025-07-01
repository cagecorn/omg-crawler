import { ReputationManager } from '../../src/managers/ReputationManager.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { memoryDB } from '../../src/persistence/MemoryDB.js';
import { describe, test, assert } from '../helpers.js';
import tfLoader from '../../src/utils/tf-loader.js';

function createDummyEngine(predClass) {
    return {
        model: {
            predict: () => ({
                argMax: () => ({ dataSync: () => [predClass] })
            })
        },
        tf: { dispose: () => {} },
        buildInput: () => ({})
    };
}

describe('ReputationManager', () => {
    test('records positive reputation when prediction is high', async () => {
        const eventManager = new EventManager();
        const mercenaryManager = { mercenaries: [ { id: 2, name: 'Ally', isDead: false } ] };
        const dummy = createDummyEngine(4); // change = 2
        const manager = new ReputationManager(eventManager, mercenaryManager, dummy);

        const events = [];
        const originalAdd = memoryDB.addEvent;
        memoryDB.addEvent = async (data) => { events.push(data); };

        const entity = { id: 1, name: 'Merc', isFriendly: true, isPlayer: false };
        const action = { type: 'attack' };
        const context = { game: {} };
        await manager._onAction({ entity, action, context });

        memoryDB.addEvent = originalAdd;
        assert.strictEqual(events.length, 1);
        assert.ok(events[0].reputationChange > 0);
    });

    test('records negative reputation when prediction is low', async () => {
        const eventManager = new EventManager();
        const mercenaryManager = { mercenaries: [ { id: 3, name: 'Ally', isDead: false } ] };
        const dummy = createDummyEngine(0); // change = -2
        const manager = new ReputationManager(eventManager, mercenaryManager, dummy);

        const events = [];
        const originalAdd = memoryDB.addEvent;
        memoryDB.addEvent = async (data) => { events.push(data); };

        const entity = { id: 2, name: 'Merc', isFriendly: true, isPlayer: false };
        const action = { type: 'attack' };
        const context = { game: {} };
        await manager._onAction({ entity, action, context });

        memoryDB.addEvent = originalAdd;
        assert.strictEqual(events.length, 1);
        assert.ok(events[0].reputationChange < 0);
    });

    test('loadReputationModel handles failure gracefully', async () => {
        const eventManager = new EventManager();
        const manager = new ReputationManager(eventManager);

        const originalInit = tfLoader.init;
        const originalGet = tfLoader.getTf;
        let initCalled = false;
        tfLoader.init = async () => { initCalled = true; };
        tfLoader.getTf = () => ({
            loadLayersModel: () => Promise.reject(new Error('bad'))
        });

        await manager.loadReputationModel();

        tfLoader.init = originalInit;
        tfLoader.getTf = originalGet;

        assert.ok(initCalled);
        assert.strictEqual(manager.model, null);
    });
});

