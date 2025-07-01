import GuidelineLoader from '../../src/managers/guidelineLoader.js';
import { describe, test, assert } from '../helpers.js';

function mockFetch(responses) {
    const fetch = async (url) => {
        const key = Object.keys(responses).find(k => url.includes(k));
        const value = responses[key];
        if (Array.isArray(value)) {
            return { ok: true, json: async () => value };
        }
        return { ok: true, text: async () => value };
    };
    return fetch;
}

describe('GuidelineLoader', () => {
    test('loads and parses markdown', async () => {
        const list = [
            { name: 'guide.md', download_url: 'https://example.com/guide.md' }
        ];
        const md = '# Title\n- one\n- two';
        const loader = new GuidelineLoader('dummy/path');
        const origFetch = global.fetch;
        global.fetch = mockFetch({ 'api.github.com': list, 'example.com': md });
        const data = await loader.load();
        global.fetch = origFetch;
        assert.ok(data.guide);
        assert.strictEqual(data.guide[0].title, 'Title');
        assert.deepStrictEqual(data.guide[0].bullets, ['one', 'two']);
    });
});
