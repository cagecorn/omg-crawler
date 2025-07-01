const DB_NAME = 'UnitMemories';
const STORE_NAME = 'ReputationEvents';
const DB_VERSION = 1;

class MemoryDB {
    constructor() {
        this.db = null;
    }

    async open() {
        if (typeof indexedDB === 'undefined') {
            return null;
        }
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('actorIdIndex', 'actorId', { unique: false });
                }
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async addEvent(data) {
        const db = await this.open();
        if (!db) return;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.add(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async getEventsFor(actorId) {
        const db = await this.open();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('actorIdIndex');
            const req = index.getAll(actorId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }
}

export const memoryDB = new MemoryDB();
export default memoryDB;
