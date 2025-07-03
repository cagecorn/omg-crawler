import { CharacterFactory, ItemFactory } from '../../src/factory.js';
import { ItemAIManager } from '../../src/managers/item-ai-manager.js';
import { ProjectileManager } from '../../src/managers/projectileManager.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { describe, test, assert } from '../helpers.js';

const assets = { potion:{}, arrow:{} };

describe('ItemAI', () => {
  test('healing potion used when hp low', () => {
    const factory = new CharacterFactory(assets);
    const itemFactory = new ItemFactory(assets);
    const eventManager = new EventManager();
    const projectileManager = new ProjectileManager(eventManager, assets, null, null, { addEffect(){} });
    const itemAI = new ItemAIManager(eventManager, projectileManager, null, { addEffect(){} });
    const merc = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:'g', jobId:'warrior' });
    merc.consumables = [];
    const potion = itemFactory.create('potion', 0,0,1);
    merc.consumables.push(potion);
    merc.hp = merc.maxHp * 0.4;

    const context = { player:merc, mercenaryManager:{ mercenaries:[merc] }, monsterManager:{ monsters:[] } };
    itemAI.update(context);
    assert.ok(merc.hp > merc.maxHp * 0.4, 'hp should increase');
    assert.strictEqual(merc.consumables.length, 0, 'potion consumed');
  });

  test('does not auto equip nearby weapon', () => {
    const factory = new CharacterFactory(assets);
    const itemFactory = new ItemFactory(assets);
    const eventManager = new EventManager();
    const projectileManager = new ProjectileManager(eventManager, assets, null, null, { addEffect(){} });
    const itemAI = new ItemAIManager(eventManager, projectileManager, null, { addEffect(){} });
    const merc = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:'g', jobId:'warrior' });
    merc.equipment.weapon = null;
    const sword = itemFactory.create('short_sword', 0,0,1);
    const itemManager = { items:[sword], removeItem(i){ this.items=this.items.filter(it=>it!==i); } };
    const context = { player:merc, mercenaryManager:{ mercenaries:[merc] }, monsterManager:{ monsters:[] }, itemManager, equipmentManager:{ equip(e,i){ e.equipment.weapon=i; } } };
    itemAI.update(context);
    assert.strictEqual(merc.equipment.weapon, null, 'weapon should not be equipped');
    assert.strictEqual(itemManager.items.length, 1, 'item should remain on ground');
  });

  test('attack item used on nearby enemy', () => {
    const factory = new CharacterFactory(assets);
    const itemFactory = new ItemFactory(assets);
    const eventManager = new EventManager();
    const projectileManager = new ProjectileManager(eventManager, assets, null, null, { addEffect(){} });
    const itemAI = new ItemAIManager(eventManager, projectileManager, null, { addEffect(){} });
    const merc = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:'g', jobId:'warrior' });
    const enemy = factory.create('monster', { x:1, y:0, tileSize:1, groupId:'m' });
    const grenade = itemFactory.create('shock_grenade', 0,0,1);
    merc.consumables = [grenade];
    const context = { player:merc, mercenaryManager:{ mercenaries:[merc] }, monsterManager:{ monsters:[enemy] } };
    itemAI.update(context);
    projectileManager.update([enemy]);
    assert.strictEqual(merc.consumables.length, 0, 'grenade consumed');
  });

  test('attack item not used on ally', () => {
    const factory = new CharacterFactory(assets);
    const itemFactory = new ItemFactory(assets);
    const itemAI = new ItemAIManager();
    itemAI.setEffectManager({ addEffect(){} });
    const m1 = factory.create('monster', { x:0, y:0, tileSize:1, groupId:'m' });
    const m2 = factory.create('monster', { x:1, y:0, tileSize:1, groupId:'m' });
    const grenade = itemFactory.create('shock_grenade', 0,0,1);
    m1.consumables = [grenade];
    const context = { player:m1, mercenaryManager:{mercenaries:[]}, monsterManager:{monsters:[m1,m2]} };
    itemAI.update(context);
    assert.strictEqual(m1.consumables.length, 1, 'grenade not used on ally');
  });

  test('aoe attack item affects multiple enemies', () => {
    const factory = new CharacterFactory(assets);
    const itemFactory = new ItemFactory(assets);
    const calls = [];
    const eventManager = new EventManager();
    const projectileManager = new ProjectileManager(eventManager, assets, null, null, { addEffect:(t)=>calls.push(t) });
    const itemAI = new ItemAIManager(eventManager, projectileManager, null, { addEffect:(t)=>calls.push(t) });
    const merc = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:'g', jobId:'warrior' });
    const e1 = factory.create('monster', { x:1, y:0, tileSize:1, groupId:'m' });
    const e2 = factory.create('monster', { x:2, y:0, tileSize:1, groupId:'m' });
    const grenade = itemFactory.create('shock_grenade', 0,0,1);
    merc.consumables = [grenade];
    const context = { player:merc, mercenaryManager:{mercenaries:[merc]}, monsterManager:{monsters:[e1,e2]} };
    itemAI.update(context);
    projectileManager.update([e1, e2]);
    assert.strictEqual(calls.length, 2, 'both enemies affected');
    assert.strictEqual(merc.consumables.length, 0, 'grenade consumed');
  });
});
