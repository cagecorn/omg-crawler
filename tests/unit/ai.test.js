import { MeleeAI, RangedAI, HealerAI, BardAI } from '../../src/ai.js';
import { SKILLS } from '../../src/data/skills.js';
import { describe, test, assert } from '../helpers.js';

describe('AI', () => {

const mapStub = { tileSize: 1, isWallAt: () => false };
const eventManagerStub = { publish: () => {} };

// 공격 범위 내 적을 공격하는지 확인

test('MeleeAI - 공격 결정', () => {
    const ai = new MeleeAI();
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1 };
    const context = { player: {}, allies: [], enemies: [{ x: 5, y: 0 }], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'attack');
});

// 사정거리 밖의 적에게 이동 명령을 내리는지 확인

test('MeleeAI - 이동 결정', () => {
    const ai = new MeleeAI();
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1 };
    const context = { player: {}, allies: [], enemies: [{ x: 20, y: 0 }], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'move');
});

// 아군이 플레이어를 따라가는지 확인

test('MeleeAI - 플레이어 추적', () => {
    const ai = new MeleeAI();
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1, isFriendly: true, isPlayer: false };
    const player = { x: 10, y: 0 };
    const context = { player, allies: [], enemies: [], mapManager: mapStub };
    const orig = Math.random;
    Math.random = () => 0;
    const action = ai.decideAction(self, context);
    Math.random = orig;
    assert.strictEqual(action.type, 'move');
    assert.deepStrictEqual(action.target, { x: 11, y: 0 });
});

// RangedAI specific behavior
test('RangedAI - 가까운 적에게서 거리 벌림', () => {
    const ai = new RangedAI();
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 20, speed: 5, tileSize: 1 };
    const enemy = { x: 5, y: 0 };
    const context = { player: {}, allies: [], enemies: [enemy], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'move');
    assert.ok(action.target.x < self.x);
});

test('RangedAI - 사정거리 밖 적에게 접근', () => {
    const ai = new RangedAI();
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 20, speed: 5, tileSize: 1 };
    const enemy = { x: 50, y: 0 };
    const context = { player: {}, allies: [], enemies: [enemy], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'move');
    assert.strictEqual(action.target, enemy);
});

test('HealerAI - injured ally gets healed', () => {
    const supportEngine = {
        findHealTarget(_s, allies) { return allies[1]; },
        findPurifyTarget(){ return null; }
    };
    const ai = new HealerAI({ supportEngine });
    const self = {
        x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1,
        mp: 20, skills: ['heal'], skillCooldowns: {}, properties: { mbti: 'ENFP' },
        isFriendly: true, isPlayer: false
    };
    const ally = { x: 5, y: 0, hp: 5, maxHp: 10 };
    const context = { player: {}, allies: [self, ally], enemies: [], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'skill');
    assert.strictEqual(action.target, ally);
    assert.strictEqual(action.skillId, 'heal');
});

test('HealerAI - follows player when everyone healthy', () => {
    const supportEngine = { findHealTarget(){ return null; }, findPurifyTarget(){ return null; } };
    const ai = new HealerAI({ supportEngine });
    const player = { x: 10, y: 0 };
    const self = {
        x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1,
        mp: 20, skills: ['heal'], skillCooldowns: {},
        isFriendly: true, isPlayer: false
    };
    const ally = { x: 5, y: 0, hp: 10, maxHp: 10 };
    const context = { player, allies: [self, ally], enemies: [], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'move');
    assert.strictEqual(action.target, player);
});


test('RangedAI - follows player when no line of sight to enemy', () => {
    const ai = new RangedAI();
    const mapWithWall = { tileSize: 1, isWallAt: (x, y) => x === 1 && y === 0 };
    const player = { x: 0, y: 2 };
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 20, speed: 5, tileSize: 1, isFriendly: true, isPlayer: false };
    const enemy = { x: 2, y: 0 };
    const context = { player, allies: [self], enemies: [enemy], mapManager: mapWithWall };
    const orig = Math.random;
    Math.random = () => 0;
    const action = ai.decideAction(self, context);
    Math.random = orig;
    assert.strictEqual(action.type, 'move');
    assert.deepStrictEqual(action.target, { x: 1, y: 2 });
});

test('MeleeAI - idle when enemy beyond vision range', () => {
    const ai = new MeleeAI();
    const self = { x: 0, y: 0, visionRange: 30, attackRange: 10, speed: 5, tileSize: 1 };
    const enemy = { x: 100, y: 0 };
    const context = { player: {}, allies: [], enemies: [enemy], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'idle');
});

test('HealerAI - idles when no ally needs healing and no weapon AI', () => {
    const supportEngine = { findHealTarget(){ return null; }, findPurifyTarget(){ return null; } };
    const ai = new HealerAI({ supportEngine });
    const self = {
        x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1,
        mp: 20, skills: ['heal'], skillCooldowns: {},
        isFriendly: true, isPlayer: false
    };
    const ally = { x: 5, y: 0, hp: 10, maxHp: 10 };
    const enemy = { x: 5, y: 0 };
    const context = { player: {}, allies: [self, ally], enemies: [enemy], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'idle');
});

test('BardAI - uses guardian hymn when available', () => {
    const supportEngine = {
        findBuffTarget(_self, allies, buff) {
            return buff === 'shield' ? allies[1] : null;
        }
    };
    const ai = new BardAI({ supportEngine });
    const self = {
        x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1,
        mp: 20,
        skills: [SKILLS.guardian_hymn.id],
        skillCooldowns: {},
        equipment: {},
        properties: {},
        isFriendly: true, isPlayer: false
    };
    const ally = { x: 5, y: 0 };
    const context = { player: {}, allies: [self, ally], enemies: [], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'skill');
    assert.strictEqual(action.target, ally);
    assert.strictEqual(action.skillId, SKILLS.guardian_hymn.id);
});


test('BardAI - attacks when songs unavailable', () => {
    const ai = new BardAI({});
    const self = {
        x: 0, y: 0, visionRange: 100, attackRange: 10, tileSize: 1,
        mp: 0,
        skills: ['guardian_hymn'],
        skillCooldowns: {},
        equipment: { weapon: { tags: ['song'] } },
        properties: {},
        isFriendly: true, isPlayer: false
    };
    const enemy = { x: 5, y: 0 };
    const ctx = { player: {}, allies: [self], enemies: [enemy], mapManager: mapStub };
    const action = ai.decideAction(self, ctx);
    assert.strictEqual(action.type, 'attack');
    assert.strictEqual(action.target, enemy);
});

});
