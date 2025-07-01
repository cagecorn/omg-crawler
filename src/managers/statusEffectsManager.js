export class StatusEffectsManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    /**
     * 특정 엔티티에게 '트위스티드' 상태이상을 적용합니다.
     * @param {Entity} entity - 효과를 적용할 엔티티
     * @param {number} duration - 지속 시간 (밀리초 단위, e.g., 2000 = 2초)
     */
    applyTwisted(entity, duration) {
        // 이미 다른 행동 불가 상태이상에 걸려있다면 중첩하지 않음 (선택적)
        if (entity.statusEffects.isStunned || entity.statusEffects.isTwisted) {
            return;
        }

        entity.statusEffects.isTwisted = true;
        entity.statusEffects.twistedStartTime = performance.now();
        entity.statusEffects.twistedDuration = duration;

        this.eventManager.publish('log', { message: `${entity.name || '유닛'}이(가) 트위스티드 상태에 빠졌습니다!` });

        // 지정된 시간이 지나면 효과 해제
        setTimeout(() => {
            this.removeTwisted(entity);
        }, duration);
    }

    /**
     * 엔티티의 트위스티드 효과를 해제합니다.
     * @param {Entity} entity 
     */
    removeTwisted(entity) {
        entity.statusEffects.isTwisted = false;
        this.eventManager.publish('log', { message: `${entity.name || '유닛'}이(가) 트위스티드 상태에서 벗어났습니다.` });
    }
}
