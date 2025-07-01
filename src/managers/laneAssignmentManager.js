// src/managers/laneAssignmentManager.js

import { LanePusherAI } from '../ai/archetypes.js';
import { SETTINGS } from '../../config/gameSettings.js';

export class LaneAssignmentManager {
    constructor({ laneManager, squadManager, eventManager }) {
        this.laneManager = laneManager;
        this.squadManager = squadManager;
        this.eventManager = eventManager;

        this.nextLaneIndex = 0;
        this.lanes = ['TOP', 'MID', 'BOTTOM'];
    }

    /**
     * 새로 고용된 용병을 다음 라인에 배정하고 필요한 설정을 수행합니다.
     * @param {Mercenary} mercenary - 새로 고용된 용병 객체
     */
    assignMercenaryToLane(mercenary) {
        if (!mercenary || !SETTINGS.ENABLE_AQUARIUM_LANES) return;

        // 1. 다음 라인을 순서대로 선택
        const lane = this.lanes[this.nextLaneIndex];
        const squadId = `squad_${this.nextLaneIndex + 1}`;
        this.nextLaneIndex = (this.nextLaneIndex + 1) % this.lanes.length; // 다음 인덱스로 순환

        // 2. 용병에게 라인, 팀, AI 정보 할당
        mercenary.lane = lane;
        mercenary.team = 'LEFT'; // 아군은 왼쪽 팀으로 가정
        mercenary.ai = new LanePusherAI();
        mercenary.currentWaypointIndex = 0;

        // 3. 용병을 해당 라인 분대에 편성
        this.squadManager.handleSquadAssignment({ mercId: mercenary.id, toSquadId: squadId });
        // 분대 UI 업데이트를 위해 분대 이름을 라인 이름으로 설정
        const squad = this.squadManager.getSquad(squadId);
        if (squad) {
            squad.name = lane;
        }

        // 4. 용병을 라인 시작점으로 이동
        const startWaypoint = this.laneManager.getNextWaypoint(mercenary);
        if (startWaypoint) {
            mercenary.x = startWaypoint.x;
            mercenary.y = startWaypoint.y;
        }

        // 5. 로그 이벤트 발행
        this.eventManager.publish('log', { message: `${mercenary.name || '용병'}을(를) [${lane}] 라인에 고용했습니다.` });
    }
}
