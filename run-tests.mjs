import { readdir } from 'fs/promises';
import { join } from 'path';

async function gather(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await gather(full));
        } else if (entry.name.endsWith('.test.js') || entry.name === 'test.js') {
            files.push(full);
        }
    }
    return files;
}

const files = (await gather('tests')).sort();
for (const file of files) {
    console.log(`--- Running ${file} ---`);
    await import(`./${file}`);
}
