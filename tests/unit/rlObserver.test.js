import { EventManager } from '../../src/managers/eventManager.js';
import RLObserver from '../../src/managers/rlObserver.js';
import { describe, test, assert } from '../helpers.js';

describe('RLObserver', () => {
    test('tracks prediction accuracy', async () => {
        const ev = new EventManager();
        const observer = new RLObserver(ev);
        await observer.init();
        observer.rlManager.requestPrediction = async () => [0.7, 0.3];
        ev.publish('battle_round_start', { round: 1, playerInfo: [{}], enemyInfo: [{}] });
        ev.publish('battle_round_complete', { round: 1, winner: 'player' });
        assert.strictEqual(observer.stats.correct, 1);
        assert.strictEqual(observer.stats.total, 1);
        assert.strictEqual(observer.stats.score, 50);
    });
});
