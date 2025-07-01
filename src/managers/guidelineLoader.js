// src/managers/guidelineLoader.js
import { SETTINGS } from '../../config/gameSettings.js';

export default class GuidelineLoader {
    constructor(url = SETTINGS.GUIDELINE_REPO_URL) {
        this.url = url;
        this.guidelines = {};
    }

    async fetchMarkdownList() {
        if (!this.url) {
            console.warn('[GuidelineLoader] No GUIDELINE_REPO_URL configured');
            return [];
        }
        const apiUrl = `https://api.github.com/repos/${this.url}`;
        const res = await fetch(apiUrl);
        if (!res.ok) {
            console.warn('[GuidelineLoader] Failed to fetch list:', res.status);
            return [];
        }
        const files = await res.json();
        return files.filter(f => f.name && f.name.endsWith('.md'));
    }

    async load() {
        const list = await this.fetchMarkdownList();
        const guidelines = {};
        for (const file of list) {
            try {
                const res = await fetch(file.download_url);
                if (!res.ok) {
                    console.warn('[GuidelineLoader] Failed to fetch', file.name);
                    continue;
                }
                const text = await res.text();
                const key = file.name.replace(/\.md$/, '');
                guidelines[key] = this.parseMarkdown(text);
            } catch (e) {
                console.warn('[GuidelineLoader] Error loading', file.name, e);
            }
        }
        this.guidelines = guidelines;
        console.log(`[GuidelineLoader] Loaded ${Object.keys(guidelines).length} guidelines`);
        return guidelines;
    }

    parseMarkdown(md) {
        const lines = md.split(/\r?\n/);
        const sections = [];
        let current = null;
        for (const line of lines) {
            const h = line.match(/^#\s+(.*)/);
            if (h) {
                if (current) sections.push(current);
                current = { title: h[1], bullets: [] };
            } else if (/^[-*]\s+/.test(line)) {
                if (!current) current = { title: 'General', bullets: [] };
                current.bullets.push(line.replace(/^[-*]\s+/, '').trim());
            }
        }
        if (current) sections.push(current);
        return sections;
    }

    getGuidelines() {
        return this.guidelines;
    }
}
