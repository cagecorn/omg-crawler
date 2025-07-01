export class EntityManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.entities = new Map();
        this.player = null;
        this.mercenaries = [];
        this.monsters = [];
    }

    init(player, mercenaries = [], monsters = []) {
        this.player = player;
        if (player) this.entities.set(player.id, player);

        this.mercenaries = mercenaries;
        for (const m of mercenaries) {
            this.entities.set(m.id, m);
        }

        this.monsters = monsters;
        for (const m of monsters) {
            this.entities.set(m.id, m);
        }
    }

    addEntity(entity) {
        if (!entity) return;
        this.entities.set(entity.id, entity);
    }

    getEntityById(id) {
        return this.entities.get(id) || null;
    }

    findEntityByWeaponId(weaponId) {
        for (const ent of this.entities.values()) {
            if (ent.equipment?.weapon?.id === weaponId) {
                return ent;
            }
        }
        return null;
    }

    getPlayer() {
        return this.player;
    }

    getMercenaries() {
        return this.mercenaries;
    }

    getMonsters() {
        return this.monsters;
    }
}
