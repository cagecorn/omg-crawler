import { memoryDB } from '../persistence/MemoryDB.js';
import { MbtiEngine } from './ai/MbtiEngine.js';
import tfLoader from '../utils/tf-loader.js';

export class ReputationManager {
    constructor(eventManager, mercenaryManager, mbtiEngine) {
        this.eventManager = eventManager;
        this.mercenaryManager = mercenaryManager;
        this.mbtiEngine = mbtiEngine;
        this.model = null;
        this.tf = null;
        if (this.eventManager) {
            this.eventManager.subscribe('action_performed', (data) => this._onAction(data));
        }
    }

    async _onAction({ entity, action, context }) {
        if (!entity.isFriendly || entity.isPlayer) return;

        let change = 0;
        let desc = '';

        if (this.mbtiEngine && this.mbtiEngine.model && this.mbtiEngine.tf) {
            const tf = this.mbtiEngine.tf;
            const inputTensor = this.mbtiEngine.buildInput(entity, action, context.game);
            const prediction = this.mbtiEngine.model.predict(inputTensor);
            const predictedClass = prediction.argMax(-1).dataSync()[0];
            change = predictedClass - 2;
            desc = `${action.type} 행동 평가 결과 점수: ${predictedClass}`;
            tf.dispose([inputTensor, prediction]);
        }

        if (action.isMistake) {
            change -= 1;
            desc = action.mistakeDescription || '실수를 저질렀습니다.';
        }

        if (change === 0) return;

        if (!this.mercenaryManager || !Array.isArray(this.mercenaryManager.mercenaries)) {
            return;
        }

        const allies = this.mercenaryManager.mercenaries.filter(
            (m) => m.id !== entity.id && !m.isDead
        );
        for (const ally of allies) {
            memoryDB.addEvent({
                actorId: entity.id,
                actorName: entity.name,
                observerId: ally.id,
                description: desc,
                reputationChange: change,
                timestamp: new Date().toISOString()
            });
        }

        this.eventManager.publish('log', {
            message: `${entity.name}의 평판이 ${change > 0 ? '올라갔습니다' : '나빠졌습니다'}.`,
            color: change > 0 ? 'lightgreen' : 'salmon'
        });
    }

    async getHistory(actorId) {
        return memoryDB.getEventsFor(actorId);
    }

    async loadReputationModel() {
        await tfLoader.init();
        this.tf = tfLoader.getTf();
        if (!this.tf) return;
        try {
            this.model = await this.tf.loadLayersModel('assets/models/reputation/model.json');
        } catch (err) {
            console.warn('[ReputationManager] Failed to load model:', err);
            this.model = null;
        }
    }

    handleGameEvent(action) {
        if (!this.model || !this.tf) return;
        // TODO: convert action to meaningful input tensor
        const tensor = this.tf.tensor([[0]]);
        this.model.predict(tensor);
        this.tf.dispose(tensor);
    }
}
