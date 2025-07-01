import tfLoader from '../../utils/tf-loader.js';

export class CombatDecisionEngine {
    constructor() {
        this.tf = null;
        this.model = null;
        tfLoader.init().then(() => { this.tf = tfLoader.getTf(); this._init(); }).catch(() => {});
    }

    _init() {
        if (this.tf && !this.model) {
            const tf = this.tf;
            this.model = tf.sequential();
            this.model.add(tf.layers.dense({ units: 1, inputShape: [4], useBias: false }));
            // 단순 가중치 모델 (시연용)
            this.model.setWeights([tf.tensor2d([[1],[1],[0.5],[0.5]])]);
        }
    }

    shouldPickup(slotEmpty, distance, weight, hpRatio) {
        if (!this.model) return slotEmpty && distance <= 64;
        const tf = this.tf;
        const t = tf.tensor2d([[slotEmpty ? 1 : 0, distance / 100, weight / 10, hpRatio]]);
        const out = this.model.predict(t).dataSync()[0];
        tf.dispose(t);
        return out > 0.5;
    }

    shouldThrowWeapon(hpRatio, distance, weight) {
        if (!this.model) return hpRatio < 0.3 && distance <= 96;
        const tf = this.tf;
        const t = tf.tensor2d([[1 - hpRatio, distance / 100, weight / 10, 0]]);
        const out = this.model.predict(t).dataSync()[0];
        tf.dispose(t);
        return out > 0.5;
    }
}
