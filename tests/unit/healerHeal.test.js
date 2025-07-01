import { HealerAI } from '../../src/ai.js';
import { CharacterFactory } from '../../src/factory.js';
import { SKILLS } from '../../src/data/skills.js';
import { SETTINGS } from '../config/gameSettings.js';
import { describe, test, assert } from '../helpers.js';

const assets = { player:{}, mercenary:{} };
SETTINGS.ENABLE_MISTAKE_ENGINE = false;

describe('Healing', () => {
  test('healer skill restores ally hp', () => {
    const factory = new CharacterFactory(assets);
    const healer = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:'g', jobId:'healer' });
    const supportEngine = { 
      findHealTarget(_s, allies){ return allies[1]; },
      findPurifyTarget(){ return null; }
    };
    healer.ai = new HealerAI({ supportEngine });
    healer.mp = healer.maxMp; // 충분한 마나 확보
    const ally = factory.create('mercenary', { x:5, y:0, tileSize:1, groupId:'g', jobId:'warrior' });
    ally.hp = ally.maxHp - 5; // 부상 입힘
    const context = { player:{}, allies:[healer, ally], enemies:[], mapManager:{ tileSize:1, isWallAt:() => false } };

    const action = healer.ai.decideAction(healer, context);
    assert.strictEqual(action.type, 'skill');
    assert.strictEqual(action.target, ally);
    assert.strictEqual(action.skillId, 'heal');

    const prev = ally.hp;
    const amount = SKILLS.heal.healAmount;
    ally.hp = Math.min(ally.maxHp, ally.hp + amount);
    assert.ok(ally.hp > prev);
  });
});
