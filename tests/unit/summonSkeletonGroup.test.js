import { CharacterFactory } from '../../src/factory.js';
import { MonsterManager } from '../../src/managers/monsterManager.js';
import { SkillManager } from '../../src/managers/skillManager.js';
import { MetaAIManager } from '../../src/managers/ai-managers.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { SKILLS } from '../../src/data/skills.js';
import { describe, test, assert } from '../helpers.js';

const assets = { skeleton:{} };

describe('Summon Skeleton Group', () => {
  test('summoned skeleton joins caster group and minion list', () => {
    const factory = new CharacterFactory(assets);
    const eventManager = new EventManager();
    const monsterManager = new MonsterManager(eventManager, assets, factory);
    const metaAI = new MetaAIManager(eventManager);
    monsterManager.setMetaAIManager(metaAI);
    const skillMgr = new SkillManager(eventManager);
    skillMgr.setManagers({addEffect(){}}, factory, metaAI, monsterManager);

    const caster = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:'g', jobId:'summoner', image:null });
    metaAI.createGroup('g');

    skillMgr.applySkillEffects(caster, SKILLS.summon_skeleton);

    assert.strictEqual(monsterManager.monsters.length, 1);
    const skeleton = monsterManager.monsters[0];
    assert.ok(metaAI.groups['g'].members.includes(skeleton));
    assert.ok(Array.isArray(caster.minions) && caster.minions.includes(skeleton));
  });
});
