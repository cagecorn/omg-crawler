import { openDatabase, putItem, deleteItem } from '../persistence/indexedDbStorage.js';

export class ItemTracker {
    constructor() {
        this.dbPromise = openDatabase();
    }

    async register(item) {
        const db = await this.dbPromise;
        if (!db) return;
        await putItem(db, { id: item.id, baseId: item.baseId, name: item.name });
        if (typeof caches !== 'undefined') {
            const cache = await caches.open('item-cache');
            await cache.put(`/items/${item.id}`, new Response(JSON.stringify({ id: item.id, baseId: item.baseId, name: item.name }), { headers: { 'Content-Type': 'application/json' } }));
        }
    }

    async unregister(id) {
        const db = await this.dbPromise;
        if (!db) return;
        await deleteItem(db, id);
        if (typeof caches !== 'undefined') {
            const cache = await caches.open('item-cache');
            await cache.delete(`/items/${id}`);
        }
    }
}
