import { STRATEGY } from './ai-managers.js';

export class SquadManager {
    constructor(eventManager, mercenaryManager) {
        this.eventManager = eventManager;
        this.mercenaryManager = mercenaryManager;
        this.squads = {};
        for (let i = 1; i <= 9; i++) {
            this.squads[`squad_${i}`] = {
                name: `${i}\uBD84\uB300`,
                members: new Set(),
                strategy: i === 1 ? STRATEGY.AGGRESSIVE : STRATEGY.DEFENSIVE
            };
        }
        this.unassignedMercs = new Set(
            this.mercenaryManager.getMercenaries().map(m => m.id)
        );
        if (this.eventManager) {
            this.eventManager.subscribe('squad_assign_request', d => this.handleSquadAssignment(d));
            this.eventManager.subscribe('squad_strategy_change_request', d => this.setSquadStrategy(d));
            this.eventManager.subscribe('mercenary_hired', ({ mercenary }) => this.registerMercenary(mercenary));
        }
    }

    registerMercenary(merc) {
        if (!merc) return;
        this.unassignedMercs.add(merc.id);
        merc.squadId = null;
    }

    handleSquadAssignment({ mercId, toSquadId }) {
        for (const squad of Object.values(this.squads)) {
            squad.members.delete(mercId);
        }
        this.unassignedMercs.delete(mercId);
        if (toSquadId && this.squads[toSquadId]) {
            this.squads[toSquadId].members.add(mercId);
            const merc = this.mercenaryManager.getMercenaries().find(m => m.id === mercId);
            if (merc) merc.squadId = toSquadId;
            console.log(`용병 ${mercId}를 ${this.squads[toSquadId].name}에 편성했습니다.`);
        } else {
            this.unassignedMercs.add(mercId);
            const merc = this.mercenaryManager.getMercenaries().find(m => m.id === mercId);
            if (merc) merc.squadId = null;
            console.log(`용병 ${mercId}를 미편성 상태로 변경했습니다.`);
        }
        this.eventManager?.publish('squad_data_changed', { squads: this.squads });
    }

    setSquadStrategy(squadIdOrObj, maybeStrategy) {
        let squadId = squadIdOrObj;
        let strategy = maybeStrategy;
        if (typeof squadIdOrObj === 'object') {
            squadId = squadIdOrObj.squadId;
            strategy = squadIdOrObj.newStrategy;
        }
        if (this.squads[squadId] && (strategy === STRATEGY.AGGRESSIVE || strategy === STRATEGY.DEFENSIVE)) {
            this.squads[squadId].strategy = strategy;
            console.log(`${this.squads[squadId].name}\uC758 \uC804\uB825\uC744 ${strategy}(\uC73C)\uB85C \uBCC0\uACBD\uD588\uC2B5\uB2C8\uB2E4.`);
            this.eventManager?.publish('squad_data_changed', { squads: this.squads });
        }
    }

    getSquads() {
        return this.squads;
    }

    getSquadForMerc(mercId) {
        for (const squad of Object.values(this.squads)) {
            if (squad.members.has(mercId)) {
                return squad;
            }
        }
        return null;
    }

    /**
     * 특정 ID를 가진 분대 객체를 반환합니다.
     * @param {string} squadId - 조회할 분대의 ID
     * @returns {object|null} 분대 객체 또는 null
     */
    getSquad(squadId) {
        return this.squads[squadId] || null;
    }
}
