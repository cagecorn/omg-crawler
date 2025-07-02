// src/utils/aquariumUtils.js
// Utility functions for the Aquarium map

/**
 * Adjusts base stats so monsters spawn with almost no attack power and
 * double the normal amount of health. This function reverses the formulas
 * in StatManager to calculate the minimal stat changes required.
 * @param {object} baseStats
 * @returns {object} adjusted copy of baseStats
 */
export function adjustMonsterStatsForAquarium(baseStats = {}) {
    const strength = baseStats.strength ?? 1;
    const endurance = baseStats.endurance ?? 1;
    const baseAP = baseStats.attackPower ?? 0;

    const adjusted = { ...baseStats };

    // StatManager derives attackPower as: baseAP + 1 + strength * 2
    // To end up with ~0 attack power we solve the formula for strength.
    adjusted.strength = (0 - baseAP - 1) / 2;

    // StatManager derives maxHp as: 10 + endurance * 5
    // Double the final value while keeping other bonuses intact.
    const originalHp = 10 + endurance * 5;
    const targetHp = originalHp * 2;

    adjusted.endurance = (targetHp - 10) / 5;

    // Restrict monster vision so they remain idle when far from the player
    const defaultVision = 192 * 2; // keep aquarium encounters manageable
    adjusted.visionRange = Math.min(baseStats.visionRange ?? 192 * 4, defaultVision);

    return adjusted;
}

// --- New Helper Functions for Aquarium Loop ---
import { ITEMS } from '../data/items.js';

// Precompute lists so random selection is fast
export const ALL_WEAPON_IDS = [
    'short_sword', 'long_bow', 'estoc', 'axe', 'mace', 'stun_baton', 'staff',
    'spear', 'scythe', 'whip', 'dagger', 'violin_bow'
];

export const CONSUMABLE_IDS = Object.keys(ITEMS).filter(
    id => ITEMS[id].type === 'consumable'
);

/**
 * Equip a character with a random weapon and optionally a shield.
 * @param {Entity} entity - Character receiving the weapon
 * @param {ItemFactory} itemFactory - Factory used to create items
 * @param {EquipmentManager} equipmentManager - Manager handling equipment slots
 */
export function equipRandomWeapon(entity, itemFactory, equipmentManager) {
    const id = ALL_WEAPON_IDS[Math.floor(Math.random() * ALL_WEAPON_IDS.length)];
    const weapon = itemFactory.create(id, 0, 0, 1);
    if (!weapon) return;
    equipmentManager.equip(entity, weapon, null);

    const tags = weapon.tags || [];
    const isMelee = tags.includes('melee') && !tags.includes('ranged');
    const excluded = tags.includes('spear') || tags.includes('scythe');
    if (isMelee && !excluded && Math.random() < 0.5) {
        const shield = itemFactory.create('shield_basic', 0, 0, 1);
        if (shield) equipmentManager.equip(entity, shield, null);
    }
}

/**
 * Fill a character's consumable inventory with random items.
 *
 * @param {Entity} entity - Character gaining consumables
 * @param {number} count - Number of consumables to add
 * @param {ItemFactory} itemFactory - Factory used to create items
 */
export function addRandomConsumables(entity, count, itemFactory) {
    for (let i = 0; i < count; i++) {
        const cId = CONSUMABLE_IDS[Math.floor(Math.random() * CONSUMABLE_IDS.length)];
        const item = itemFactory.create(cId, 0, 0, 1);
        if (item) entity.addConsumable(item);
    }
}
