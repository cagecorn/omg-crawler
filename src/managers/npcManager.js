export class NpcManager {
    constructor() {
        this.npcs = [];
    }

    addNpc(npc) {
        this.npcs.push(npc);
    }

    _checkCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    update(player, ctx = null) {
        for (const npc of this.npcs) {
            if (ctx && typeof npc.render === 'function') {
                npc.render(ctx);
            }
            if (player && this._checkCollision(player, npc)) {
                if (typeof npc.triggerAction === 'function') {
                    npc.triggerAction(player);
                }
            }
        }
    }
}
