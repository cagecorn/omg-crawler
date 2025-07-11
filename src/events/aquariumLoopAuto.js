// src/events/aquariumLoopAuto.js
// Runs repeated 12 vs 12 battles on the Aquarium Loop map.

import { startAquariumLoopTest } from './aquariumLoopTest.js';
import { BattleRecorder } from '../managers/battleRecorder.js';
import { FACTIONS } from '../constants/factions.js';
import { serializeUnits } from '../utils/aiSerializer.js';

export function startAquariumBattleLoop(game, { rounds = Infinity, onRoundComplete } = {}) {
    let currentRound = 0;
    let running = false;

    if (!game.battleRecorder) {
        game.battleRecorder = new BattleRecorder(game.eventManager);
    }

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
        const info = startAquariumLoopTest(game);
        eventManager.publish('battle_round_start', { round: currentRound + 1, playerInfo: info.playerInfo, enemyInfo: info.enemyInfo });
        // Pass actual entity instances so damage와 kill 기록이 반영됩니다.
        game.battleRecorder.startBattle(
            mercenaryManager.mercenaries,
            monsterManager.monsters
        );
        running = true;
        currentRound++;
    }

    function handleEndCheck() {
        if (!running) return;
        const alliesAlive = mercenaryManager.mercenaries.filter(m => m.hp > 0);
        const enemiesAlive = monsterManager.monsters.filter(m => m.hp > 0);
        if (alliesAlive.length === 0 || enemiesAlive.length === 0) {
            running = false;
            const winner = alliesAlive.length > 0 ? FACTIONS.PLAYER : FACTIONS.ENEMY;
            const survivors = (alliesAlive.length > 0 ? alliesAlive : enemiesAlive).length;
            const report = game.battleRecorder.endBattle({ winner, survivors });
            report.round = currentRound;
            if (typeof onRoundComplete === 'function') {
                onRoundComplete(report);
            }
            eventManager.publish('battle_round_complete', report);
            if (currentRound < rounds) {
                // next round after small delay to avoid recursive event handling
                setTimeout(startRound, 0);
            }
        }
    }

    eventManager.subscribe('entity_death', handleEndCheck);
    startRound();
}

export function setupAquariumLoopAuto(scene, rlManager) {
    const { eventManager } = scene;
    eventManager.subscribe('battle_round_complete', (data) => {
        console.log(`Aquarium-Loop: Battle ended. Winner: ${data.winner}`);
        const battleResultForAI = {
            winner: data.winner,
            playerInfo: serializeUnits(data.playerUnits),
            enemyInfo: serializeUnits(data.enemyUnits)
        };
        rlManager?.record(battleResultForAI);
        setTimeout(() => {
            if (typeof scene.prepareNextBattle === 'function') {
                scene.prepareNextBattle();
            }
        }, 1000);
    });
}
