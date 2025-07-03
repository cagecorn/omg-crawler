import { RLManager } from './rlManager.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../constants/mapDimensions.js';

export class BattlePredictionManager {
    constructor(rlManager = null) {
        this.rlManager = rlManager || new RLManager(null);
    }

    async init(featureLength = 12) {
        if (this.rlManager && typeof this.rlManager.init === 'function') {
            await this.rlManager.init(featureLength);
        }
    }

    buildFeatures(teamA, teamB) {
        const statsA = this.calculateTeamStats(teamA);
        const statsB = this.calculateTeamStats(teamB);

        const compA = this.getUnitComposition(teamA);
        const compB = this.getUnitComposition(teamB);

        const cohesionA = this.calculateTeamCohesion(teamA);
        const cohesionB = this.calculateTeamCohesion(teamB);

        const center = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
        const controlA = this.calculateCentralControl(teamA, center);
        const controlB = this.calculateCentralControl(teamB, center);

        return [
            this.normalize(statsA.totalPower - statsB.totalPower, -1000, 1000),
            this.normalize(statsA.totalHealth - statsB.totalHealth, -5000, 5000),
            compA.melee, compA.ranged, compA.support,
            compB.melee, compB.ranged, compB.support,
            this.normalize(cohesionA, 0, 500),
            this.normalize(cohesionB, 0, 500),
            controlA,
            controlB,
        ];
    }

    calculateTeamStats(units) {
        const sum = (stat) => units.reduce((acc, u) => acc + (u[stat] || 0), 0);
        return {
            totalPower: sum('attackPower') + sum('defense'),
            totalHealth: sum('maxHp')
        };
    }

    getUnitComposition(units) {
        const counts = { melee: 0, ranged: 0, support: 0 };
        for (const u of units) {
            if (u.isRanged && u.isRanged()) counts.ranged += 1;
            else if (u.isSupport && u.isSupport()) counts.support += 1;
            else counts.melee += 1;
        }
        const total = units.length || 1;
        return {
            melee: counts.melee / total,
            ranged: counts.ranged / total,
            support: counts.support / total,
        };
    }

    calculateTeamCohesion(units) {
        if (units.length <= 1) return 0;
        const center = this.calculateCenter(units);
        const dists = units.map(u => Math.hypot(u.x - center.x, u.y - center.y));
        const avg = dists.reduce((a, b) => a + b, 0) / dists.length;
        return avg;
    }

    calculateCentralControl(units, center) {
        if (units.length === 0) return 0;
        const radius = 100;
        const count = units.filter(u => Math.hypot(u.x - center.x, u.y - center.y) < radius).length;
        return count / units.length;
    }

    calculateCenter(units) {
        const sum = units.reduce((acc, u) => ({ x: acc.x + u.x, y: acc.y + u.y }), { x: 0, y: 0 });
        return { x: sum.x / units.length, y: sum.y / units.length };
    }

    normalize(value, min, max) {
        return (value - min) / (max - min);
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
