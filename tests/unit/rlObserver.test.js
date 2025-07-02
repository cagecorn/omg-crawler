import { EventManager } from '../../src/managers/eventManager.js';
import RLObserver from '../../src/managers/rlObserver.js';
import { FACTIONS } from '../../src/constants/factions.js';
import { describe, test, assert } from '../helpers.js';

describe('RLObserver', () => {
    test('tracks prediction accuracy and emits events', async () => {
        const ev = new EventManager();
        const mapStub = { width: 8, height: 6, tileSize: 1 };
        const observer = new RLObserver(ev, mapStub);
        await observer.init();
        observer.rlManager.predict = async () => [0.7, 0.3];
        observer.rlManager.record = () => {};

        const made = [];
        const results = [];
        ev.subscribe('rl_prediction_made', (d) => made.push(d));
        ev.subscribe('rl_prediction_result', (d) => results.push(d));

        ev.publish('battle_round_start', { round: 1, playerInfo: [{}], enemyInfo: [{}] });
        await observer.predictionPromise;
        ev.publish('battle_round_complete', { round: 1, winner: FACTIONS.PLAYER, playerUnits: [{}], enemyUnits: [{}] });
        await observer.roundCompletePromise;

        assert.strictEqual(observer.stats.correct, 1);
        assert.strictEqual(observer.stats.total, 1);
        assert.strictEqual(observer.stats.score, 50);
        assert.strictEqual(made.length, 1);
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].correct, true);
    });
});
