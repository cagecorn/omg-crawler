import { openDatabase, putSave, getSave } from '../persistence/indexedDbStorage.js';

export class SaveLoadManager {
    constructor() {
        this.dbPromise = openDatabase();
    }

    // 게임의 현재 상태를 하나의 객체로 수집 (스냅샷 찍기)
    gatherSaveData(gameState, monsterManager, mercenaryManager) {
        const saveData = {
            timestamp: new Date().toISOString(),
            player: gameState.player.getSaveState(),
            gold: gameState.gold,
            statPoints: gameState.statPoints,
            inventory: gameState.inventory.filter(it => it).map(item => item.name), // 아이템은 이름만 저장
            monsters: monsterManager.monsters.map(m => m.getSaveState()),
            mercenaries: mercenaryManager.mercenaries.map(m => m.getSaveState()),
        };
        return saveData;
    }

    // (미래를 위한 구멍) 저장된 데이터로 게임 상태를 복원하는 함수
    loadGameFromData(saveData, gameState, ...allManagers) {
        console.log("게임 불러오기 기능은 여기에 구현될 예정입니다.");
    }

    async saveToIndexedDB(slot, gameState, monsterManager, mercenaryManager) {
        const data = this.gatherSaveData(gameState, monsterManager, mercenaryManager);
        const db = await this.dbPromise;
        await putSave(db, slot, data);
        return data;
    }

    async loadFromIndexedDB(slot, gameState, ...allManagers) {
        const db = await this.dbPromise;
        const data = await getSave(db, slot);
        if (data) {
            this.loadGameFromData(data, gameState, ...allManagers);
        }
        return data;
    }
}
