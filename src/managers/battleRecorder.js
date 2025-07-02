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
        for (const u of [...playerUnits, ...enemyUnits]) {
            if (u) {
                u.kills = 0;
                u.damageDealt = 0;
                u.damageTaken = 0;
            }
        }
    }

    endBattle({ winner, survivors } = {}) {
        if (!this.current) return null;
        this.current.winner = winner;
        this.current.survivors = survivors;
        this.current.endTime = Date.now();

        const entries = Object.entries(this.current.killCounts);
        if (entries.length) {
            entries.sort((a, b) => b[1] - a[1]);
        }

        const allUnits = [...this.current.playerUnits, ...this.current.enemyUnits];
        const calcSynergy = (unit, team) => {
            const teammates = team.filter(t => t !== unit);
            const myKeys = [];
            for (const item of Object.values(unit.equipment || {})) {
                if (item?.synergies) myKeys.push(...item.synergies);
            }
            const unique = [...new Set(myKeys)];
            let score = 0;
            for (const key of unique) {
                if (teammates.some(t => Object.values(t.equipment || {}).some(it => it?.synergies?.includes(key)))) {
                    score++;
                }
            }
            return score;
        };

        let best = null;
        let worst = null;
        let bestScore = -Infinity;
        let worstScore = Infinity;
        for (const u of allUnits) {
            const team = this.current.playerUnits.includes(u) ? this.current.playerUnits : this.current.enemyUnits;
            const synergy = calcSynergy(u, team);
            const kills = this.current.killCounts[u.id] || 0;
            const dmgScore = (u.damageDealt || 0) - (u.damageTaken || 0) * 0.5;
            const score = kills * 10 + synergy + dmgScore / 5;
            if (score > bestScore) { bestScore = score; best = u; }
            if (score < worstScore) { worstScore = score; worst = u; }
        }

        if (best) {
            this.current.bestUnitId = best.id;
            const s = calcSynergy(best, this.current.playerUnits.includes(best) ? this.current.playerUnits : this.current.enemyUnits);
            this.current.bestReason = `kills:${this.current.killCounts[best.id] || 0}, synergy:${s}, dmg:${best.damageDealt}/${best.damageTaken}`;
        }
        if (worst) {
            this.current.worstUnitId = worst.id;
            const s = calcSynergy(worst, this.current.playerUnits.includes(worst) ? this.current.playerUnits : this.current.enemyUnits);
            this.current.worstReason = `kills:${this.current.killCounts[worst.id] || 0}, synergy:${s}, dmg:${worst.damageDealt}/${worst.damageTaken}`;
        }

        const report = this.current;
        this.current = null;
        this.eventManager.publish('battle_record', report);
        return report;
    }
}
