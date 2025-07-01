import { DiceBot } from '../../src/utils/diceBot.js';
import { describe, test, assert } from '../helpers.js';

describe('DiceBot', () => {
    test('불의 신 직업은 제외된다', () => {
        const bot = new DiceBot();
        assert.ok(!bot.jobs.includes('불의 신'));
    });

    test('랜덤 용병 생성', () => {
        const bot = new DiceBot();
        const area = [0, 0, 10, 10];
        const merc = bot.createRandomMercenary('테스트', area);
        assert.ok(merc.name.includes('테스트'));
        assert.ok(merc.position.x >= area[0] && merc.position.x <= area[2]);
        assert.ok(merc.position.y >= area[1] && merc.position.y <= area[3]);
        assert.ok(Array.isArray(merc.skills));
    });
});
