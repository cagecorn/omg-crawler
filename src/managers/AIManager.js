import { DecisionEngine } from '../ai/engines/DecisionEngine.js';

export class AIManager {
    constructor(eventManager, squadManager) {
        this.eventManager = eventManager;
        this.squadManager = squadManager;
        this.decisionEngine = new DecisionEngine(eventManager);
        this.aiEntities = new Set();
    }

    registerEntity(entity) {
        if (entity.ai) {
            this.aiEntities.add(entity);
        }
    }

    unregisterEntity(entity) {
        this.aiEntities.delete(entity);
    }

    update(context) {
        for (const entity of this.aiEntities) {
            if (entity.hp <= 0 || !entity.ai) continue;
            const squad = this.squadManager?.getSquadForMerc(entity.id);
            const strategy = squad ? squad.strategy : 'AGGRESSIVE';
            const action = this.decisionEngine.decideFinalAction(entity, context, strategy);
            this.executeAction(entity, action, context);
        }
    }

    executeAction(entity, action, context) {
        // placeholder for actual execution logic
        if (!action) return;
        this.eventManager?.publish('action_performed', { entity, action, context });
    }
}
