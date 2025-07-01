// src/managers/laneManager.js

/**
 * 3-Lane 맵의 경로(웨이포인트)를 관리합니다.
 * 이 데이터는 나중에 맵 파일에서 직접 불러오도록 확장할 수 있습니다.
 */
export class LaneManager {
    constructor(mapWidth, mapHeight, lanePositions = null) {
        // 맵 크기에 따라 동적으로 웨이포인트를 설정합니다.
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        const laneY = lanePositions ? {
            TOP: lanePositions[0],
            MID: lanePositions[1],
            BOTTOM: lanePositions[2],
        } : {
            TOP: mapHeight * 0.2,
            MID: mapHeight * 0.5,
            BOTTOM: mapHeight * 0.8,
        };
        // 외부에서 참조할 수 있도록 저장
        this.laneY = laneY;
        const startX = {
            LEFT: mapWidth * 0.1,
            RIGHT: mapWidth * 0.9,
        };
        const endX = {
            LEFT: mapWidth * 0.9,
            RIGHT: mapWidth * 0.1,
        };

        this.waypoints = {
            TOP: {
                LEFT: [
                    { x: startX.LEFT, y: laneY.TOP },
                    { x: endX.LEFT, y: laneY.TOP },
                ],
                RIGHT: [
                    { x: startX.RIGHT, y: laneY.TOP },
                    { x: endX.RIGHT, y: laneY.TOP },
                ],
            },
            MID: {
                LEFT: [
                    { x: startX.LEFT, y: laneY.MID },
                    { x: endX.LEFT, y: laneY.MID },
                ],
                RIGHT: [
                    { x: startX.RIGHT, y: laneY.MID },
                    { x: endX.RIGHT, y: laneY.MID },
                ],
            },
            BOTTOM: {
                LEFT: [
                    { x: startX.LEFT, y: laneY.BOTTOM },
                    { x: endX.LEFT, y: laneY.BOTTOM },
                ],
                RIGHT: [
                    { x: startX.RIGHT, y: laneY.BOTTOM },
                    { x: endX.RIGHT, y: laneY.BOTTOM },
                ],
            },
        };
        console.log('[LaneManager] Initialized with waypoints.');
    }

    /**
     * 특정 유닛의 다음 목표 웨이포인트를 반환합니다.
     * @param {object} entity - lane, team, currentWaypointIndex 속성을 가진 유닛
     * @returns {object|null} - {x, y} 좌표 또는 null
     */
    getNextWaypoint(entity) {
        if (!entity.lane || !entity.team || !this.waypoints[entity.lane]?.[entity.team]) {
            return null;
        }

        const path = this.waypoints[entity.lane][entity.team];
        const nextIndex = entity.currentWaypointIndex || 0;

        return path[nextIndex] || null;
    }
}
