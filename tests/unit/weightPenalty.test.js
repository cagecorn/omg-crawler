import { StatManager } from '../../src/stats.js';
import { describe, test, assert } from '../helpers.js';

describe('Weight Penalty', () => {
  test('장비 무게가 용량을 초과하면 이동 속도가 감소한다', () => {
    const entity = { equipment: { weapon: { weight: 20 } } };
    const stats = new StatManager(entity, { movement: 5, carryCapacity: 10 });
    entity.stats = stats;
    stats.updateEquipmentStats();
    assert.strictEqual(stats.get('equipmentWeight'), 20);
    assert.strictEqual(stats.get('movementSpeed'), 4);
  });

  test('무게가 용량 이하이면 이동 속도가 유지된다', () => {
    const entity = { equipment: { armor: { weight: 5 } } };
    const stats = new StatManager(entity, { movement: 4, carryCapacity: 10 });
    entity.stats = stats;
    stats.updateEquipmentStats();
    assert.strictEqual(stats.get('movementSpeed'), 4);
  });
});
