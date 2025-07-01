export class EquipmentManager {
    constructor(eventManager = null, entityManager = null) {
        this.eventManager = eventManager;
        this.entityManager = entityManager;
        this.tagManager = null;
        console.log('[EquipmentManager] Initialized');
    }

    setTagManager(tagManager) {
        this.tagManager = tagManager;
    }

    equip(entity, item, inventory) {
        const slot = this._getSlotForItem(item);
        if (!slot) return;

        const oldItem = entity.equipment[slot];
        if (oldItem?.tags.includes('emblem')) {
            this.eventManager?.publish('emblem_unequipped', { entity });
        }
        // 장착 해제되는 아이템을 지정된 인벤토리로 이동
        if (oldItem && inventory) {
            inventory.push(oldItem);
        }

        // 새 아이템 장착
        entity.equipment[slot] = item;

        // 인벤토리에서 새 아이템 제거
        if (inventory) {
            const idx = inventory.indexOf(item);
            if (idx > -1) inventory.splice(idx, 1);
        }

        if (entity.stats && typeof entity.stats.updateEquipmentStats === 'function') {
            entity.stats.updateEquipmentStats();
        }
        if (typeof entity.updateAI === 'function') {
            entity.updateAI();
        }
        if (this.tagManager && typeof this.tagManager.applyWeaponTags === 'function') {
            this.tagManager.applyWeaponTags(entity);
        }

        if (this.eventManager && item) {
            this.eventManager.publish('log', { message: `${entity.constructor.name}(이)가 ${item.name} (을)를 장착했습니다.` });
            this.eventManager.publish('equipment_changed', { entity });
            if (item.tags.includes('emblem')) {
                this.eventManager.publish('emblem_equipped', { entity, emblemItem: item });
            }
        }
    }

    /**
     * Remove an equipped item from the given slot.
     *
     * @param {Object} entity - The character losing the item.
     * @param {string} slot - 'weapon' or 'armor'.
     * @param {Array|null} inventory - Optional array to store the removed item.
     */
    unequip(entity, slot, inventory = null) {
        if (!entity || !entity.equipment || !slot || !entity.equipment[slot]) {
            return;
        }

        const oldItem = entity.equipment[slot];
        if (oldItem?.tags.includes('emblem')) {
            this.eventManager?.publish('emblem_unequipped', { entity });
        }
        if (oldItem && inventory) {
            inventory.push(oldItem);
        }

        entity.equipment[slot] = null;

        if (entity.stats && typeof entity.stats.updateEquipmentStats === 'function') {
            entity.stats.updateEquipmentStats();
        }
        if (typeof entity.updateAI === 'function') {
            entity.updateAI();
        }
        if (this.tagManager && slot === 'weapon' && typeof this.tagManager.applyWeaponTags === 'function') {
            this.tagManager.applyWeaponTags(entity);
        }

        if (this.eventManager) {
            this.eventManager.publish('log', { message: `${entity.constructor.name}(이)가 ${slot}을/를 해제했습니다.` });
            this.eventManager.publish('equipment_changed', { entity });
        }
    }

    handleEquipRequest(data) {
        const { itemId, from, to } = data;
        const fromChar = this.entityManager?.getEntityById ? this.entityManager.getEntityById(from.ownerId) : null;
        const toChar = this.entityManager?.getEntityById ? this.entityManager.getEntityById(to.ownerId) : null;
        if (!fromChar || !toChar) return;

        const itemToMove = this.findItem(fromChar, itemId, from);
        if (!itemToMove) return;
        if (!this.canEquip(itemToMove, to.type)) return;

        const targetItem = this.getItemFromSlot(toChar, to);

        this.setItemInSlot(fromChar, from, targetItem);
        this.setItemInSlot(toChar, to, itemToMove);

        this.recalculateStats(fromChar);
        if (toChar !== fromChar) this.recalculateStats(toChar);

        this.eventManager?.publish('character_equipment_changed', { characterId: from.ownerId });
        if (to.ownerId !== from.ownerId) {
            this.eventManager?.publish('character_equipment_changed', { characterId: to.ownerId });
        }
    }

    findItem(character, itemId, from) {
        if (from.type === 'inventory') {
            const item = character.inventory[from.index];
            if (item?.id === itemId) return item;
        } else if (character.equipment[from.type]?.id === itemId) {
            return character.equipment[from.type];
        }
        return null;
    }

    getItemFromSlot(character, slot) {
        if (slot.type === 'inventory') {
            return character.inventory[slot.index];
        }
        return character.equipment[slot.type];
    }

    setItemInSlot(character, slot, item) {
        if (slot.type === 'inventory') {
            character.inventory[slot.index] = item || null;
        } else {
            character.equipment[slot.type] = item || null;
        }
    }

    canEquip(item, slotType) {
        if (slotType === 'inventory') return true;
        return item.type === slotType || item.tags?.includes(slotType);
    }

    recalculateStats(character) {
        if (character.stats && typeof character.stats.updateEquipmentStats === 'function') {
            character.stats.updateEquipmentStats();
        }
        if (typeof character.updateAI === 'function') character.updateAI();
    }

    /**
     * Get the weapon currently equipped by the entity.
     *
     * @param {Object} entity - The character whose weapon is requested.
     * @returns {Object|null} The equipped weapon or null if none.
     */
    getWeapon(entity) {
        return entity?.equipment?.main_hand || entity?.equipment?.weapon || null;
    }

    _getSlotForItem(item) {
        if (!item) return null;
        // 1. 아이템 데이터에 명시된 slot을 최우선으로 사용합니다.
        if (item.slot) return item.slot;

        // 2. 기존 로직 (하위 호환용)
        if ((item.tags && item.tags.includes('weapon')) || item.type === 'weapon') return 'main_hand';
        if ((item.tags && item.tags.includes('helmet'))) return 'helmet';
        if ((item.tags && item.tags.includes('gloves'))) return 'gloves';
        if ((item.tags && item.tags.includes('boots'))) return 'boots';
        if ((item.tags && item.tags.includes('armor')) || item.type === 'armor') return 'armor';
        return null;
    }
}
