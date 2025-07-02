export class BattleMemoryManager {
    constructor(rlManager = null) {
        this.rlManager = rlManager;
        this.history = [];
    }

    init() {}

    record({ features, winner }) {
        this.history.push({ features, winner });
        if (this.rlManager && typeof this.rlManager.record === 'function') {
            this.rlManager.record({ features, winner });
        }
    }
}

export default BattleMemoryManager;
