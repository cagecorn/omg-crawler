import { AquariumMapManager } from '../../src/aquariumMap.js';
import { AquariumManager, AquariumInspector } from '../../src/managers/aquariumManager.js';
import { CharacterFactory } from '../../src/factory.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { MonsterManager } from '../../src/managers/monsterManager.js';
import { ItemManager } from '../../src/managers/itemManager.js';
import { VFXManager } from '../../src/managers/vfxManager.js';
import { adjustMonsterStatsForAquarium } from '../../src/utils/aquariumUtils.js';
import { StatManager } from '../../src/stats.js';
import { describe, test, assert } from '../helpers.js';

const assets = { monster:{} };

describe('Aquarium', () => {
    test('Aquarium map uses a maze layout', () => {
        const m = new AquariumMapManager(1);
        assert.ok(m.corridorWidth <= 8, 'corridor width should be maze-like');
        const wallCount = m.countTiles(m.tileTypes.WALL);
        assert.ok(wallCount > 0 && wallCount < m.width * m.height, 'maze should contain walls and floors');
    });

    test('Jungle corridors carved between lanes', () => {
        const m = new AquariumMapManager(2);
        const half = Math.floor(m.corridorWidth / 2);
        const topRegion = { start: m.lanes[0] + half + 1, end: m.lanes[1] - half - 1 };
        let floorTiles = 0;
        for (let y = topRegion.start; y <= topRegion.end; y++) {
            for (let x = m.openArea; x < m.width - m.openArea; x++) {
                if (m.map[y][x] === m.tileTypes.FLOOR) floorTiles++;
            }
        }
        assert.ok(floorTiles > 0, 'no jungle paths found between lanes');
    });

    test('Manager adds feature and inspector passes', () => {
        const eventManager = new EventManager();
        const monsterManager = new MonsterManager(0, new AquariumMapManager(), assets, eventManager, new CharacterFactory(assets));
        const itemManager = new ItemManager(0, monsterManager.mapManager, assets);
        const factory = new CharacterFactory(assets);
        const vfx = new VFXManager(eventManager);
        const aquariumManager = new AquariumManager(eventManager, monsterManager, itemManager, monsterManager.mapManager, factory, { create(){return null;} }, vfx, null);
        aquariumManager.addTestingFeature({ type:'monster', image:{} });
        const inspector = new AquariumInspector(aquariumManager);
        assert.ok(inspector.run(), 'inspection fails');
        assert.strictEqual(monsterManager.monsters.length, 1);
    });

    test('Bubble feature spawns emitter', () => {
        const eventManager = new EventManager();
        const monsterManager = new MonsterManager(0, new AquariumMapManager(), assets, eventManager, new CharacterFactory(assets));
        const itemManager = new ItemManager(0, monsterManager.mapManager, assets);
        const factory = new CharacterFactory(assets);
        const vfx = new VFXManager(eventManager);
        const aquariumManager = new AquariumManager(eventManager, monsterManager, itemManager, monsterManager.mapManager, factory, { create(){return null;} }, vfx, null);
        aquariumManager.addTestingFeature({ type: 'bubble' });
        assert.strictEqual(vfx.emitters.length, 1);
    });

    test('Monster stats adjusted for aquarium', () => {
        const base = { strength: 5, endurance: 3 };
        const adjusted = adjustMonsterStatsForAquarium(base);
        const dummy = { hp: 0, mp: 0 };
        const stats = new StatManager(dummy, adjusted);
        assert.strictEqual(stats.get('maxHp'), (10 + base.endurance * 5) * 2);
        assert.ok(Math.abs(stats.get('attackPower')) < 0.001);
    });

    test('Lanes have multiple jungle entrances', () => {
        const m = new AquariumMapManager(3);
        const half = Math.floor(m.corridorWidth / 2);
        for (let i = 0; i < m.lanes.length; i++) {
            const laneY = m.lanes[i];
            let entrances = 0;
            const sides = [];
            if (i > 0) sides.push(-1);
            if (i < m.lanes.length - 1) sides.push(1);
            for (const dir of sides) {
                const y = laneY + dir * (half + 1);
                const inside = y + dir;
                let lastWasWall = true;
                for (let x = m.openArea; x < m.width - m.openArea; x++) {
                    const wall = m.map[y][x] === m.tileTypes.WALL;
                    if (!wall && lastWasWall && m.map[inside][x] === m.tileTypes.FLOOR && m.map[y - dir][x] === m.tileTypes.FLOOR) {
                        entrances++;
                    }
                    lastWasWall = wall;
                }
            }
            assert.ok(entrances >= 3, `lane ${i} has too few entrances`);
        }
    });
});
