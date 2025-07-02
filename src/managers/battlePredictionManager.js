import { RLManager } from './rlManager.js';

export class BattlePredictionManager {
    constructor(rlManager = null) {
        this.rlManager = rlManager || new RLManager(null);
    }

    async init(featureLength = 3) {
        if (this.rlManager && typeof this.rlManager.init === 'function') {
            await this.rlManager.init(featureLength);
        }
    }

    buildFeatures(teamA, teamB) {
        const sumStat = (units, stat) => units.reduce((acc, u) => {
            if (u.stats && typeof u.stats.get === 'function') {
                return acc + (u.stats.get(stat) || 0);
            }
            return acc + (u[stat] || 0);
        }, 0);
        const atkA = sumStat(teamA, 'attackPower');
        const atkB = sumStat(teamB, 'attackPower');
        const defA = sumStat(teamA, 'defense');
        const defB = sumStat(teamB, 'defense');
        const hpA = sumStat(teamA, 'maxHp');
        const hpB = sumStat(teamB, 'maxHp');
        return [atkA - atkB, defA - defB, hpA - hpB];
    }

    async predict(teamA, teamB) {
        const features = this.buildFeatures(teamA, teamB);
        let prediction = null;
        if (this.rlManager && typeof this.rlManager.predict === 'function') {
            try {
                const res = await this.rlManager.predict(features);
                if (Array.isArray(res) && res.length >= 2) {
                    prediction = res[0] > res[1] ? 'player' : 'enemy';
                }
            } catch (err) {
                console.warn('[BattlePredictionManager] prediction failed:', err);
            }
        }
        return { prediction, features };
    }
}

export default BattlePredictionManager;
