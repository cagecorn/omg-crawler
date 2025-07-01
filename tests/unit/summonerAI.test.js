import { SummonerAI } from '../../src/ai.js';
import { describe, test, assert } from '../helpers.js';

const mapStub = { tileSize: 1, isWallAt: () => false };

describe('SummonerAI', () => {
    test('uses summon skill when enemy nearby and no minions', () => {
        const ai = new SummonerAI();
        const self = {
            x: 0, y: 0, visionRange: 50, attackRange: 10, speed: 5, tileSize: 1,
            mp: 30, skills: ['summon_skeleton'], skillCooldowns: {},
            properties: { maxMinions: 1 }
        };
        const enemy = { x: 5, y: 0 };
        const context = { player: {}, allies: [self], enemies: [enemy], mapManager: mapStub };
        const action = ai.decideAction(self, context);
        assert.strictEqual(action.type, 'skill');
        assert.strictEqual(action.skillId, 'summon_skeleton');
    });

    test('respects maxMinions limit', () => {
        const ai = new SummonerAI();
        const self = {
            id: 'summoner1',
            x: 0, y: 0, visionRange: 50, attackRange: 10, speed: 5, tileSize: 1,
            mp: 30, skills: ['summon_skeleton'], skillCooldowns: {},
            properties: { maxMinions: 2 },
            minions: [{}, {}]
        };
        const minion1 = { properties: { summonedBy: 'summoner1' } };
        const minion2 = { properties: { summonedBy: 'summoner1' } };
        const context = {
            player: {},
            allies: [self, minion1, minion2],
            enemies: [],
            mapManager: mapStub
        };
        const action = ai.decideAction(self, context);
        assert.notStrictEqual(action.type, 'skill');
    });
});
