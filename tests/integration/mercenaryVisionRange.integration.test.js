import { describe, test, assert } from '../helpers.js';
import { CharacterFactory } from '../../src/factory.js';

// verify all mercenaries share the same vision range

describe('Integration', () => {
  test('all mercenary jobs have the same vision range', () => {
    const assets = { mercenary:{} };
    const factory = new CharacterFactory(assets);
    const jobs = ['warrior','archer','healer','wizard','summoner','bard'];
    const ranges = jobs.map(job => factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:'g', jobId:job }).visionRange);
    const first = ranges[0];
    ranges.forEach(r => assert.strictEqual(r, first));
  });
});
