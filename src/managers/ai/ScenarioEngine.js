// src/managers/ai/ScenarioEngine.js
import { calculateDistance } from '../../utils/geometry.js';

/**
 * ScenarioEngine은 게임 내 전술적 상황을 분석하여
 * 가장 적절한 MBTI 라벨을 결정하는 정적 클래스입니다.
 */
export class ScenarioEngine {
    static getLabelForScenario(entity, action, context) {
        // 무기 특화 시나리오가 가장 먼저 판단됩니다.
        const weaponLabel = this.getWeaponScenario(entity, action, context);
        if (weaponLabel) return weaponLabel;

        const feelingLabel = this.getFeelingScenario(entity, action, context);
        if (feelingLabel) return feelingLabel;

        const thinkingLabel = this.getThinkingScenario(entity, action, context);
        if (thinkingLabel) return thinkingLabel;

        const sensingLabel = this.getSensingScenario(entity, action, context);
        if (sensingLabel) return sensingLabel;

        const lifestyleLabel = this.getLifestyleScenario(entity, action, context);
        if (lifestyleLabel) return lifestyleLabel;

        return null;
    }

    /** 무기 타입에 따른 전술적 판단 */
    static getWeaponScenario(entity, action, context) {
        const weaponType = entity.equipment?.weapon?.type;
        if (!weaponType) return null;

        switch (weaponType) {
            case 'sword':
                if (action.type === 'attack') {
                    const enemies = context?.monsterManager?.monsters || [];
                    let strongest = null;
                    for (const e of enemies) {
                        if (e.isDead) continue;
                        if (!strongest || (e.attackPower || 0) > (strongest.attackPower || 0)) {
                            strongest = e;
                        }
                    }
                    if (strongest && action.target?.id === strongest.id) {
                        return 'T';
                    }
                }
                break;
            case 'whip':
                if (action.type === 'skill' && action.skill?.effect === 'pull') {
                    const t = action.target;
                    if (t && Array.isArray(t.tags) && (t.tags.includes('healer') || t.tags.includes('support'))) {
                        return 'J';
                    }
                }
                break;
            case 'spear':
            case 'estoc':
                if (action.type === 'skill' && action.skill?.effect === 'charge') {
                    const enemies = context?.monsterManager?.monsters || [];
                    const radius = action.skill.radius || entity.tileSize;
                    let count = 0;
                    for (const m of enemies) {
                        if (m.isDead) continue;
                        if (calculateDistance(action.target, m) <= radius) count++;
                    }
                    if (count >= 3) return 'T';
                }
                break;
            case 'bow':
            case 'violin_bow':
                if (action.type === 'skill' && action.skill?.effect === 'knockback') {
                    const allies = context?.mercenaryManager?.mercenaries || [];
                    for (const ally of allies) {
                        if (ally.jobId === 'healer' || ally.jobId === 'bard') {
                            if (calculateDistance(action.target, ally) <= (entity.tileSize || 1) * 3) {
                                return 'F';
                            }
                        }
                    }
                }
                break;
        }
        return null;
    }

    /** 아군 보호와 관련된 F 시나리오 */
    static getFeelingScenario(entity, action, context) {
        if (action.type === 'skill' && (action.skill?.effect === 'heal' || action.skill?.effect === 'buff')) {
            const targetAlly = action.target;
            if (targetAlly?.isFriendly && targetAlly.hp < targetAlly.maxHp * 0.3) {
                return 'F';
            }
        }

        if (action.type === 'attack') {
            const targetEnemy = action.target;
            const allies = context?.mercenaryManager?.mercenaries || [];
            const lowHpAlly = allies.find(m => m.hp < m.maxHp * 0.4 && !m.isDead);
            if (lowHpAlly && targetEnemy?.ai?.target?.id === lowHpAlly.id) {
                return 'F';
            }
        }
        return null;
    }

    /** 효율성을 중시하는 T 시나리오 */
    static getThinkingScenario(entity, action, context) {
        if (action.type === 'skill' && action.skill?.isAoE) {
            const enemies = context?.monsterManager?.monsters || [];
            const radius = action.skill.radius || entity.tileSize;
            let count = 0;
            for (const m of enemies) {
                if (m.isDead) continue;
                if (calculateDistance(action.target, m) <= radius) count++;
            }
            if (count >= 3) return 'T';
        }

        if (action.type === 'attack' || (action.type === 'skill' && action.skill?.damage > 0)) {
            const t = action.target;
            if (t && !t.isFriendly && t.hp < entity.attackPower) {
                return 'T';
            }
        }

        if (action.type === 'attack' && action.target?.properties?.isBoss) {
            return 'T';
        }
        return null;
    }

    /** 즉각적 대응을 중시하는 S 시나리오 */
    static getSensingScenario(entity, action, context) {
        if (action.type === 'attack') {
            const targetEnemy = action.target;
            if (targetEnemy && targetEnemy.ai?.target?.id === entity.id) {
                return 'S';
            }
        }
        if (action.type === 'attack') {
            const enemies = context?.monsterManager?.monsters || [];
            const nearest = this._getNearestEnemy(entity, enemies);
            if (nearest && action.target?.id === nearest.id) {
                return 'S';
            }
        }
        return null;
    }

    /** 행동 스타일을 나타내는 P/J 시나리오 */
    static getLifestyleScenario(entity, action) {
        if (action.type === 'move' && action.target) return 'J';
        if (action.type === 'move' && !action.target) return 'P';
        return null;
    }

    static _getNearestEnemy(entity, enemies) {
        let nearest = null;
        let minDist = Infinity;
        for (const e of enemies) {
            if (e.isDead) continue;
            const d = calculateDistance(entity, e);
            if (d < minDist) { minDist = d; nearest = e; }
        }
        return nearest;
    }
}
