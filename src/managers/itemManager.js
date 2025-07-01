import { Item } from '../entities.js';

export class ItemManager {
    constructor(count = 0, mapManager = null, assets = null, tracker = null) {
        this.items = [];
        this.mapManager = mapManager;
        this.assets = assets;
        this.tracker = tracker;
        console.log("[ItemManager] Initialized");

        if (count > 0 && this.mapManager && this.assets) {
            this._spawnItems(count);
        }
    }

    _spawnItems(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                if (Math.random() < 0.5) {
                    const item = new Item(pos.x, pos.y, this.mapManager.tileSize, 'gold', this.assets.gold);
                    this.items.push(item);
                    if (this.tracker) this.tracker.register(item);
                } else {
                    const item = new Item(pos.x, pos.y, this.mapManager.tileSize, 'potion', this.assets.potion);
                    this.items.push(item);
                    if (this.tracker) this.tracker.register(item);
                }
            }
        }
    }

    addItem(item) {
        this.items.push(item);
        if (this.tracker) {
            this.tracker.register(item);
        }
    }

    removeItem(item) {
        const idx = this.items.indexOf(item);
        if (idx !== -1) {
            this.items.splice(idx, 1);
            if (this.tracker) {
                this.tracker.unregister(item.id);
            }
        }
    }

    update() {
        for (const item of this.items) {
            if (typeof item.update === 'function') {
                item.update();
            }
        }
    }

    render(ctx) {
        for (const item of this.items) {
            item.render(ctx);
        }
    }
}
