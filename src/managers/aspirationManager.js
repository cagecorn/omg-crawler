export class AspirationManager {
    constructor(eventManager, microWorld, effectManager, vfxManager, entityManager) {
        this.eventManager = eventManager;
        this.microWorld = microWorld;
        this.effectManager = effectManager;
        this.vfxManager = vfxManager;
        this.entityManager = entityManager;

        this.microWorld.postMessage({ type: 'init_module', module: 'AspirationEngine' });
        this.setupEventListeners();
    }

    setupEventListeners() {
        const eventsToForward = ['entity_death', 'entity_damaged', 'attack_missed'];
        for (const eventType of eventsToForward) {
            this.eventManager.subscribe(eventType, (data) => {
                const payload = { type: eventType, data: this.sanitizeEventData(data) };
                this.microWorld.postMessage({ type: 'macro_event', payload });
            });
        }

        this.microWorld.subscribe('aspiration_state_changed_from_micro', (data) => {
            this.applyAspirationState(data.weaponId, data.newState);
        });
    }

    sanitizeEventData(data) {
        const sanitized = {};
        for (const key in data) {
            const value = data[key];
            if (typeof value === 'object' && value !== null && value.id) {
                sanitized[key] = {
                    id: value.id,
                    isFriendly: value.isFriendly,
                    isPlayer: value.isPlayer,
                    equipment: value.equipment ? { weapon: this.sanitizeItemData(value.equipment.weapon) } : undefined,
                };
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    sanitizeItemData(item) {
        if (!item) return undefined;
        return {
            id: item.id,
            baseId: item.baseId,
            type: item.type,
            tier: item.tier,
            weight: item.weight,
            toughness: item.toughness,
            durability: item.durability,
            aspiration: item.aspiration ? { ...item.aspiration } : undefined,
        };
    }

    applyAspirationState(weaponId, newState) {
        const wielder = this.entityManager.findEntityByWeaponId(weaponId);
        if (!wielder || !wielder.equipment.weapon) return;

        const weapon = wielder.equipment.weapon;
        this.effectManager.removeEffectBySource(wielder, `aspiration_${weapon.id}`);
        this.vfxManager.removeWeaponAspirationEffect(wielder);

        let effectId = null;
        let logMessage = `[열망] ${wielder.name}의 ${weapon.name}이(가) 안정을 되찾았습니다.`;
        let logColor = 'gray';

        if (newState === 'inspired') {
            effectId = 'inspired_weapon';
            logMessage = `[열망] ${wielder.name}의 ${weapon.name}이(가) 고양되었습니다!`;
            logColor = 'gold';
        } else if (newState === 'despairing') {
            effectId = 'despairing_weapon';
            logMessage = `[열망] ${wielder.name}의 ${weapon.name}이(가) 절망에 빠졌습니다...`;
            logColor = 'purple';
        }

        if (effectId) {
            this.effectManager.addEffect(wielder, effectId, `aspiration_${weapon.id}`);
        }
        this.vfxManager.applyWeaponAspirationEffect(wielder, newState);

        this.eventManager.publish('log', { message: logMessage, color: logColor });
    }
}
