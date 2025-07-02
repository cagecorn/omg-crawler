import { EventManager } from '../../src/managers/eventManager.js';
import { BattleRecorder } from '../../src/managers/battleRecorder.js';
import { describe, test, assert } from '../helpers.js';

describe('BattleRecorder', () => {
    test('records kills and summarizes battle', () => {
        const ev = new EventManager();
        const recorder = new BattleRecorder(ev);
        const allies = [{ id: 1, job: 'warrior', skills: [], equipment: [], consumables: [], position: {} }];
        const enemies = [{ id: 10, job: 'warrior', skills: [], equipment: [], consumables: [], position: {} }];
        recorder.startBattle(allies, enemies);
        ev.publish('entity_death', { attacker: { id: 1 }, victim: { id: 10 } });
        const report = recorder.endBattle({ winner: 'player', survivors: 1 });
        assert.strictEqual(report.winner, 'player');
        assert.strictEqual(report.killCounts[1], 1);
        assert.strictEqual(report.bestUnitId, 1);
    });
});
