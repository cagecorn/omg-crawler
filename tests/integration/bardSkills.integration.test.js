import { describe, test, assert } from '../helpers.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { MetaAIManager, STRATEGY } from '../../src/managers/ai-managers.js';
import { CharacterFactory } from '../../src/factory.js';
import { SKILLS } from '../../src/data/skills.js';

// Bard should sequentially use both hymns when available

describe('Integration', () => {
  test('bard mercenary uses guardian and courage hymns', () => {
    const assets = { player:{}, mercenary:{}, monster:{} };
    const factory = new CharacterFactory(assets);
    const eventManager = new EventManager();
    const aiManager = new MetaAIManager(eventManager);

    const playerGroup = aiManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
    const monsterGroup = aiManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

    const player = factory.create('player', { x:0, y:0, tileSize:1, groupId:playerGroup.id });
    player.ai = null;
    playerGroup.addMember(player);

    const bard = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:playerGroup.id, jobId:'bard' });
    bard.mp = 50;
    bard.skillCooldowns[SKILLS.guardian_hymn.id] = 0;
    bard.skillCooldowns[SKILLS.courage_hymn.id] = 0;
    playerGroup.addMember(bard);

    player.effects = [];
    bard.effects = [];

    const monster = factory.create('monster', { x:5, y:0, tileSize:1, groupId:monsterGroup.id });
    monsterGroup.addMember(monster);

    const mapStub = { tileSize:1, isWallAt: () => false };
    const context = {
      player,
      allies: [player, bard],
      enemies: [monster],
      mapManager: mapStub,
      pathfindingManager: { findPath: () => [] },
      eventManager,
      movementManager: { moveEntityTowards(){} },
      projectileManager: { create(){} },
      microItemAIManager: { getWeaponAI(){ return null; } },
      effectManager: { addEffect(){} },
      motionManager: { },
      vfxManager: { addTeleportEffect(_f,_t,cb){ if(cb) cb(); }, flashEntity(){}, addSpriteEffect(){}, addParticleBurst(){} },
      speechBubbleManager: { addBubble(){} },
    };

    const actions = [];
    aiManager.executeAction = (ent, action) => {
      if (ent === bard) actions.push(action);
    };

    // first update - expect guardian hymn
    aiManager.update(context);
    assert.strictEqual(actions[0].skillId, SKILLS.guardian_hymn.id, 'first action should be guardian hymn');

    // simulate shield effect so bard picks courage hymn next
    player.effects.push({ id: 'shield' });
    bard.effects.push({ id: 'shield' });

    actions.length = 0;
    aiManager.update(context);
    assert.strictEqual(actions[0].skillId, SKILLS.courage_hymn.id, 'second action should be courage hymn');
  });
});
