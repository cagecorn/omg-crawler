export class RLInputManager {
    /**
     * @param {import('./rlManager.js').RLManager} rlManager
     */
    constructor(rlManager) {
        this.rlManager = rlManager;
    }

    buildFeatures(entity, context) {
        const nearest = context.enemies && context.enemies[0];
        const dist = nearest ? Math.hypot(nearest.x - entity.x, nearest.y - entity.y) : 0;
        return [
            entity.hp / (entity.maxHp || 1),
            dist,
            (context.enemies ? context.enemies.length : 0)
        ];
    }

    async getAction(entity, context) {
        if (!this.rlManager) return null;
        const features = this.buildFeatures(entity, context);
        const prediction = await this.rlManager.requestPrediction(features);
        return this.mapPrediction(prediction, context);
    }

    mapPrediction(prediction, context) {
        if (!Array.isArray(prediction)) return null;
        const [moveScore, attackScore] = prediction;
        if (attackScore > moveScore && context.enemies && context.enemies.length) {
            return { type: 'attack', target: context.enemies[0] };
        }
        if (context.player) {
            return { type: 'move', target: context.player };
        }
        return null;
    }
}
