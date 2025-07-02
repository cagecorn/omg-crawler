// src/events/aquariumLoopAuto.js
// Runs repeated 12 vs 12 battles on the Aquarium Loop map.

import { startAquariumLoopTest } from './aquariumLoopTest.js';

export function startAquariumBattleLoop(game, { rounds = Infinity, onRoundComplete } = {}) {
    let currentRound = 0;
    let running = false;

    const { eventManager, mercenaryManager, monsterManager, entityManager, itemManager } = game;

    function resetEntities() {
        // Remove all previous entities from managers
        mercenaryManager.mercenaries.forEach(m => entityManager.entities.delete(m.id));
        monsterManager.monsters.forEach(m => entityManager.entities.delete(m.id));
        mercenaryManager.mercenaries = [];
        monsterManager.monsters = [];
        if (itemManager) itemManager.items = [];
        if (game.aquariumManager) game.aquariumManager.features = [];
        if (game.metaAIManager) {
            const groups = game.metaAIManager.groups;
            if (groups['dungeon_monsters']) groups['dungeon_monsters'].members = [];
            if (groups['player_party']) groups['player_party'].members = [];
        }
    }

    function startRound() {
        resetEntities();
        startAquariumLoopTest(game);
        running = true;
        currentRound++;
    }

    function handleEndCheck() {
        if (!running) return;
        const alliesAlive = mercenaryManager.mercenaries.filter(m => m.hp > 0);
        const enemiesAlive = monsterManager.monsters.filter(m => m.hp > 0);
        if (alliesAlive.length === 0 || enemiesAlive.length === 0) {
            running = false;
            const winner = alliesAlive.length > 0 ? 'player' : 'enemy';
            const survivors = (alliesAlive.length > 0 ? alliesAlive : enemiesAlive).length;
            if (typeof onRoundComplete === 'function') {
                onRoundComplete({ round: currentRound, winner, survivors });
            }
            eventManager.publish('battle_round_complete', { round: currentRound, winner, survivors });
            if (currentRound < rounds) {
                // next round after small delay to avoid recursive event handling
                setTimeout(startRound, 0);
            }
        }
    }

    eventManager.subscribe('entity_death', handleEndCheck);
    startRound();
}
