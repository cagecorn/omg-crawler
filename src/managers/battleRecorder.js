export class BattleRecorder {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.current = null;
        this.eventManager.subscribe('entity_death', ({ attacker }) => {
            if (!this.current || !attacker || attacker.id == null) return;
            const counts = this.current.killCounts;
            counts[attacker.id] = (counts[attacker.id] || 0) + 1;
        });
    }

    startBattle(playerUnits = [], enemyUnits = []) {
        this.current = {
            startTime: Date.now(),
            playerUnits,
            enemyUnits,
            killCounts: {},
            winner: null,
            survivors: 0,
        };
    }

    endBattle({ winner, survivors } = {}) {
        if (!this.current) return null;
        this.current.winner = winner;
        this.current.survivors = survivors;
        this.current.endTime = Date.now();

        const entries = Object.entries(this.current.killCounts);
        if (entries.length) {
            entries.sort((a, b) => b[1] - a[1]);
            this.current.bestUnitId = parseInt(entries[0][0]);
            this.current.worstUnitId = parseInt(entries[entries.length - 1][0]);
        }

        const report = this.current;
        this.current = null;
        this.eventManager.publish('battle_record', report);
        return report;
    }
}
