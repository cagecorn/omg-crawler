import { createGridInventory } from '../inventory.js';

/**
 * InventoryEngine은 인벤토리의 핵심 로직을 담당합니다.
 * 아이템 이동, 장착 가능 여부 확인 등 순수한 데이터 처리 로직을 포함합니다.
 */
class InventoryEngine {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    /**
     * 한 캐릭터의 인벤토리나 장비 슬롯에서 다른 곳으로 아이템을 옮깁니다.
     * @param {object} from - 아이템을 가져올 출처 { entity, slot, index }
     * @param {object} to - 아이템을 놓을 목적지 { entity, slot, index }
     * @returns {boolean} 이동 성공 여부
     */
    moveItem(from, to) {
        const itemToMove = this.getItem(from);
        if (!itemToMove) {
            console.warn("Move failed: No item at source", from);
            return false;
        }

        // 목적지에 아이템이 이미 있다면, 맞바꾸기(swap)를 시도합니다.
        const targetItem = this.getItem(to);

        // 장착 규칙 확인: 해당 슬롯에 장착 가능한 아이템인지 확인합니다.
        if (to.slot !== 'inventory' && !this.canEquip(itemToMove, to.slot)) {
            this.eventManager.publish('log', { message: `[${itemToMove.name}]은(는) 해당 슬롯에 장착할 수 없습니다.`, color: 'orange' });
            return false;
        }
        if (targetItem && from.slot !== 'inventory' && !this.canEquip(targetItem, from.slot)) {
            this.eventManager.publish('log', { message: `[${targetItem.name}]은(는) 해당 슬롯에 장착할 수 없습니다.`, color: 'orange' });
            return false;
        }
        
        this.setItem(to, itemToMove);
        this.setItem(from, targetItem); // targetItem이 null이면 빈 슬롯이 됩니다.

        this.eventManager.publish('inventory_updated', { entities: [from.entity, to.entity] });

        const equipChangeEntities = [];
        if (from.slot !== 'inventory') equipChangeEntities.push(from.entity);
        if (to.slot !== 'inventory') equipChangeEntities.push(to.entity);
        equipChangeEntities.forEach(ent => {
            this.eventManager.publish('equipment_changed', { entity: ent });
        });
        return true;
    }

    getItem({ entity, slot, index }) {
        if (slot === 'inventory') {
            if (index === undefined || index === null || Number.isNaN(index)) {
                return null;
            }
            return entity.inventory[index] || null;
        }
        return entity.equipment[slot] || null;
    }

    setItem({ entity, slot, index }, item) {
        if (slot === 'inventory') {
            if (index === undefined || index === null || Number.isNaN(index)) {
                entity.inventory.push(item);
            } else {
                entity.inventory[index] = item;
            }
        } else {
            entity.equipment[slot] = item;
        }
    }
    
    canEquip(item, slot) {
        if (!item || !slot) return false;
        const itemType = item.type;
        const itemTags = item.tags || [];

        // 아이템의 slot 속성이 명시되어 있다면 최우선으로 따릅니다.
        if (item.slot && item.slot === slot) return true;

        switch(slot) {
            case 'main_hand':
                return itemType === 'weapon' || itemTags.includes('weapon');
            case 'off_hand':
                return itemType === 'shield' || itemTags.includes('shield');
            case 'armor':
                 return itemType === 'armor' && (itemTags.includes('armor') || !itemTags.some(t => ['helmet', 'gloves', 'boots'].includes(t)));
            case 'helmet':
                return itemType === 'armor' && itemTags.includes('helmet');
            case 'gloves':
                return itemType === 'armor' && itemTags.includes('gloves');
            case 'boots':
                return itemType === 'armor' && itemTags.includes('boots');
            case 'accessory1':
            case 'accessory2':
                return itemType === 'accessory' || itemTags.includes('accessory');
            default:
                return false;
        }
    }

    getPreferredSlot(item) {
        if (!item) return null;
        if (item.slot) return item.slot;
        if ((item.tags && item.tags.includes('weapon')) || item.type === 'weapon') return 'main_hand';
        if (item.tags?.includes('helmet')) return 'helmet';
        if (item.tags?.includes('gloves')) return 'gloves';
        if (item.tags?.includes('boots')) return 'boots';
        if ((item.tags && item.tags.includes('armor')) || item.type === 'armor') return 'armor';
        if (item.type === 'shield' || item.tags?.includes('shield')) return 'off_hand';
        if (item.type === 'accessory' || item.tags?.includes('accessory')) return 'accessory1';
        return null;
    }
}


/**
 * InventoryManager는 모든 인벤토리 관련 UI 상호작용과 로직을 총괄합니다.
 */
export class InventoryManager {
    constructor({ eventManager, entityManager }) {
        this.eventManager = eventManager;
        this.entityManager = entityManager;
        this.engine = new InventoryEngine(eventManager);
        this.sharedInventory = createGridInventory(10, 8); // 10x8 크기

        this.eventManager.subscribe('ui_item_move_request', (data) => this.handleItemMove(data));
        console.log("[InventoryManager] Initialized");
    }
    
    /**
     * UI로부터 아이템 이동/장착 요청을 받았을 때 처리하는 핸들러입니다.
     * @param {object} data - { from: { entity, slot, index }, to: { entity, slot, index } }
     */
    handleItemMove({ from, to }) {
        const fromLocation = this.getLocation(from);
        const toLocation = this.getLocation(to);

        if (!fromLocation || !toLocation) {
            console.error('아이템 이동 실패: 유효하지 않은 위치입니다.', { from, to });
            return;
        }

        const itemFrom = fromLocation.getItem();
        const itemTo = toLocation.getItem();

        if (!this.canPlaceItem(itemFrom, to) || !this.canPlaceItem(itemTo, from)) {
            this.eventManager.publish('log', { message: '해당 슬롯에 아이템을 장착할 수 없습니다.', color: 'orange' });
            return;
        }

        fromLocation.setItem(itemTo);
        toLocation.setItem(itemFrom);

        console.log('[InventoryManager] Item moved from', from, 'to', to);

        this.eventManager.publish('inventory_updated', {
            involvedEntityIds: [from.entityId, to.entityId].filter(id => id !== 'shared')
        });
    }

    canPlaceItem(item, locationInfo) {
        if (!item) return true;
        if (locationInfo.slot === 'inventory') return true;
        return this.engine.canEquip(item, locationInfo.slot);
    }

    getLocation(info) {
        const entity = info.entityId === 'shared'
            ? this.sharedInventory
            : this.entityManager.getEntityById(info.entityId);

        if (!entity) return null;

        return {
            getItem: () => {
                if (info.slot === 'inventory') return entity.slots ? entity.slots[info.index] : entity.inventory?.[info.index];
                return entity.equipment[info.slot];
            },
            setItem: (item) => {
                if (info.slot === 'inventory') {
                    if (entity.slots) entity.slots[info.index] = item || null;
                    else entity.inventory[info.index] = item || null;
                } else {
                    entity.equipment[info.slot] = item || null;
                }
            }
        };
    }

    getSharedInventory() {
        return this.sharedInventory;
    }
}
