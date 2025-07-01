import { SKILLS } from '../data/skills.js';
import * as Base from '../ai.js';

export const AIArchetype = Base.AIArchetype;
export const CompositeAI = Base.CompositeAI;
export const MeleeAI = Base.MeleeAI;
export const RangedAI = Base.RangedAI;
export const HealerAI = Base.HealerAI;
export const PurifierAI = Base.PurifierAI;
export const WizardAI = Base.WizardAI;
export const TankerGhostAI = Base.TankerGhostAI;
export const RangedGhostAI = Base.RangedGhostAI;
export const SupporterGhostAI = Base.SupporterGhostAI;
export const CCGhostAI = Base.CCGhostAI;
export const SummonerAI = Base.SummonerAI;
export const BardAI = Base.BardAI;
export const FearAI = Base.FearAI;
export const ConfusionAI = Base.ConfusionAI;
export const BerserkAI = Base.BerserkAI;
export const CharmAI = Base.CharmAI;
export const WarriorAI = Base.WarriorAI;
export const ArcherAI = Base.ArcherAI;
export const FireGodAI = Base.FireGodAI;

export class SupportAI extends AIArchetype {
    constructor(engine) {
        super();
        this.engine = engine;
    }

    decideAction(self, context) {
        const { allies } = context;
        const healTarget = this._findHealTarget(self, allies);
        if (healTarget) {
            const healSkill = this._findReadySkill(self, s => s.tags?.includes('healing'));
            if (healSkill) {
                return { type: 'skill', target: healTarget, skillId: healSkill.id };
            }
        }

        const purifyTarget = this._findPurifyTarget(self, allies);
        if (purifyTarget) {
            const purifySkill = this._findReadySkill(self, s => s.tags?.includes('purify'));
            if (purifySkill) {
                return { type: 'skill', target: purifyTarget, skillId: purifySkill.id };
            }
        }

        const potionTarget = this._findPotionTarget(self, allies);
        if (potionTarget && self.hasItem?.('healing_potion')) {
            return { type: 'use_item', target: potionTarget, itemId: 'healing_potion' };
        }

        return { type: 'idle' };
    }

    _findHealTarget(self, allies) {
        return this.engine?.findHealTarget ? this.engine.findHealTarget(self, allies) : null;
    }
    _findPurifyTarget(self, allies) {
        return this.engine?.findPurifyTarget ? this.engine.findPurifyTarget(self, allies) : null;
    }
    _findPotionTarget(self, allies) {
        return allies.find(a => a.hp < a.maxHp * 0.5) || null;
    }
    _findReadySkill(self, filter) {
        if (!Array.isArray(self.skills)) return null;
        for (const id of self.skills) {
            const skill = SKILLS[id];
            if (!skill || !filter(skill)) continue;
            if (self.mp >= skill.manaCost && (self.skillCooldowns[id] || 0) <= 0) {
                return { id, skill };
            }
        }
        return null;
    }
}

/**
 * 지정된 라인을 따라 웨이포인트를 향해 자동으로 전진하는 AI.
 * 도중에 적을 만나면 교전합니다.
 */
export class LanePusherAI extends AIArchetype {
    decideAction(self, context) {
        const { enemies, laneManager } = context;

        // 1. 시야 내의 가장 가까운 적을 찾습니다.
        const visibleEnemies = this._filterVisibleEnemies(self, enemies);
        const nearestEnemy = this._findNearestEnemy(self, visibleEnemies);

        // 2. 적이 공격 범위 내에 있으면, 교전을 우선합니다.
        if (nearestEnemy && this.isInAttackRange(self, nearestEnemy)) {
            return { type: 'attack', target: nearestEnemy };
        }

        // 3. 적이 없으면, 다음 웨이포인트를 향해 전진합니다.
        const nextWaypoint = laneManager.getNextWaypoint(self);
        if (nextWaypoint) {
            const distanceToWaypoint = Math.hypot(nextWaypoint.x - self.x, nextWaypoint.y - self.y);
            if (distanceToWaypoint < self.tileSize) {
                self.currentWaypointIndex = (self.currentWaypointIndex || 0) + 1;
            }
            return { type: 'move', target: nextWaypoint };
        }

        // 모든 웨이포인트에 도달했거나 경로가 없으면 대기합니다.
        return { type: 'idle' };
    }
}
