import { MistakeEngine } from './MistakeEngine.js';
import { MbtiEngine } from './MbtiEngine.js';

export class DecisionEngine {
    constructor(eventManager = null, rlInputManager = null) {
        this.mbtiEngine = new MbtiEngine(eventManager);
        this.mistakeEngine = new MistakeEngine();
        this.rlInputManager = rlInputManager;
    }

    async decideFinalAction(entity, context, strategy = 'AGGRESSIVE') {
        let baseAction = entity.ai?.decideAction(entity, context) || { type: 'idle' };

        if (this.rlInputManager) {
            try {
                const rlAction = await this.rlInputManager.getAction(entity, context);
                if (rlAction) {
                    baseAction = rlAction;
                }
            } catch (err) {
                console.warn('[DecisionEngine] RLInputManager error:', err);
            }
        }

        if (strategy === 'DEFENSIVE') {
            const player = context.player;
            const defensiveRadius = 150;
            const dist = Math.hypot(entity.x - player.x, entity.y - player.y);
            if (dist > defensiveRadius) {
                return { type: 'move', target: player };
            }
        }

        const mbtiAction = this.mbtiEngine.influenceAction
            ? this.mbtiEngine.influenceAction(entity, baseAction, context)
            : baseAction;

        const finalAction = this.mistakeEngine.getFinalAction
            ? this.mistakeEngine.getFinalAction(entity, mbtiAction, context)
            : mbtiAction;

        return finalAction;
    }
}
