import { MistakeEngine } from '../../src/managers/ai/MistakeEngine.js';
import { describe, test, assert } from '../helpers.js';

function createProbEngine(prob) {
    return {
        model: { predict: () => ({ dataSync: () => [prob] }) },
        tf: { dispose: () => {} },
        buildInput: () => ({})
    };
}

describe('MistakeEngine', () => {
    test('returns mistake when probability exceeds threshold', () => {
        const mbti = createProbEngine(0.8);
        const entity = { id: 1, name: 'Merc', x: 0, y: 0, properties: { mistakeChance: 0 } };
        const optimal = { type: 'move', target: { x: 1, y: 1 } };
        const context = { allies: [ { id: 2, x: 5, y: 5 } ], settings: {}, game: {} };
        const orig = Math.random;
        let call = 0;
        Math.random = () => { call++; return call === 1 ? 0.1 : 0.6; };
        const result = MistakeEngine.getFinalAction(entity, optimal, context, mbti);
        Math.random = orig;
        assert.notStrictEqual(result, optimal);
        assert.ok(result.isMistake);
    });

    test('returns optimal action when probability is low', () => {
        const mbti = createProbEngine(0.2);
        const entity = { id: 1, name: 'Merc', x: 0, y: 0, properties: { mistakeChance: 0 } };
        const optimal = { type: 'move', target: { x: 1, y: 1 } };
        const context = { allies: [ { id: 2, x: 5, y: 5 } ], settings: {}, game: {} };
        const orig = Math.random;
        Math.random = () => 0.6; // 0.6 >= 0.2
        const result = MistakeEngine.getFinalAction(entity, optimal, context, mbti);
        Math.random = orig;
        assert.strictEqual(result, optimal);
    });
});

