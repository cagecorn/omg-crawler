// src/ai-managers.js
import { SKILLS } from '../data/skills.js';
import { WEAPON_SKILLS } from '../data/weapon-skills.js';
import { MbtiEngine } from './ai/MbtiEngine.js';
import { MistakeEngine } from './ai/MistakeEngine.js';
import { RLInputManager } from './rlInputManager.js';
import { SETTINGS } from '../../config/gameSettings.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../constants/mapDimensions.js';
import { serializeUnits } from '../utils/aiSerializer.js';

export const STRATEGY = {
    IDLE: 'idle',
    AGGRESSIVE: 'aggressive',
    DEFENSIVE: 'defensive',
};


class AIGroup {
    constructor(id, strategy = STRATEGY.AGGRESSIVE) {
        this.id = id;
        this.members = [];
        this.strategy = strategy;
    }
    addMember(entity) { this.members.push(entity); }
    removeMember(entityId) {
        this.members = this.members.filter(m => m.id !== entityId);
    }
}

export class MetaAIManager {
    constructor(eventManager, options = null) {
        this.groups = {};
        // 내부 엔진 생성
        this.mbtiEngine = new MbtiEngine(eventManager);
        let rlMgr = null;
        if (options) {
            if (options.predict) rlMgr = options;
            else if (options.rlManager) rlMgr = options.rlManager;
        }
        this.rlInputManager = rlMgr ? new RLInputManager(rlMgr) : null;
        // "몬스터 제거" 이벤트를 구독하여 그룹에서 멤버를 제거
        eventManager.subscribe('entity_removed', (data) => {
            for (const groupId in this.groups) {
                this.groups[groupId].removeMember(data.victimId);
            }
        });
    }

    processMbti(entity, action) {
        if (!this.mbtiEngine) return;
        this.mbtiEngine.process(entity, action, this.game);
    }

    createGroup(id, strategy) {
        if (!this.groups[id]) {
            this.groups[id] = new AIGroup(id, strategy);
        }
        return this.groups[id];
    }
    
    setGroupStrategy(id, strategy) {
        if (this.groups[id]) {
            this.groups[id].strategy = strategy;
        }
    }

    /**
     * 양 측면에서 적을 포위하는 집게 기동을 실행합니다.
     */
    executePincerManeuver() {
        const enemyUnits = this.groups['enemy']?.members || [];
        if (enemyUnits.length === 0) return;
        const target = this.getCenterOfMass(enemyUnits);
        const units = this.groups['player']?.members || [];
        const mid = Math.ceil(units.length / 2);
        const left = units.slice(0, mid);
        const right = units.slice(mid);
        this.moveGroupTo(left, { x: target.x - 150, y: target.y });
        this.moveGroupTo(right, { x: target.x + 150, y: target.y });
    }

    /**
     * 방패벽 대형을 형성합니다. 방패 유닛이 전방에서 적의 공격을 막습니다.
     */
    formShieldWall() {
        const units = this.groups['player']?.members || [];
        const shield = units.filter(u => u.hasShield && u.hasShield());
        const ranged = units.filter(u => u.isRanged && u.isRanged());
        const others = units.filter(u => !shield.includes(u) && !ranged.includes(u));
        const enemyCenter = this.getCenterOfMass(this.groups['enemy']?.members || []);
        this.formLine(shield, enemyCenter, 0);
        this.formLine(others, enemyCenter, -50);
        this.formLine(ranged, enemyCenter, -100);
    }

    /**
     * 가장 약한 적을 찾아 모든 유닛이 집중 공격하게 합니다.
     */
    focusFireWeakest() {
        const allies = this.groups['player']?.members || [];
        const enemies = this.groups['enemy']?.members || [];
        if (enemies.length === 0) return;
        let target = enemies[0];
        for (const e of enemies) {
            if (e.getHealth && e.getHealth() < target.getHealth()) target = e;
        }
        allies.forEach(u => u.setTarget && u.setTarget(target));
    }

    /** Helper: 그룹을 특정 위치로 이동시킵니다. */
    moveGroupTo(units, pos) {
        units.forEach(u => {
            if (u.ai && u.ai.setGoal) {
                u.ai.setGoal('MOVE', { target: pos });
            } else {
                u.x = pos.x;
                u.y = pos.y;
            }
        });
    }

    /** Helper: 주어진 방향으로 일렬 대형을 만듭니다. */
    formLine(units, faceTowards, offset = 0) {
        units.forEach((u, idx) => {
            const spacing = 20;
            const px = faceTowards.x + (idx - units.length / 2) * spacing;
            const py = faceTowards.y + offset;
            this.moveGroupTo([u], { x: px, y: py });
        });
    }

    /** Helper: 유닛들의 중심 좌표를 계산합니다. */
    getCenterOfMass(units) {
        if (!units.length) return { x: 0, y: 0 };
        const sum = units.reduce((acc, u) => ({ x: acc.x + u.x, y: acc.y + u.y }), { x: 0, y: 0 });
        return { x: sum.x / units.length, y: sum.y / units.length };
    }

    /**
     * AI 모델이 선택한 인덱스에 따라 전술을 실행합니다.
     */
    executeActionByIndex(index) {
        switch (index) {
            case 0:
                this.executePincerManeuver();
                break;
            case 1:
                this.formShieldWall();
                break;
            case 2:
                this.focusFireWeakest();
                break;
            default:
                break;
        }
    }

    async predictBattleOutcome(playerUnits, enemyUnits) {
        if (!this.rlInputManager) return null;
        const unitsA = serializeUnits(playerUnits);
        const unitsB = serializeUnits(enemyUnits);
        const gridW = 8;
        const gridH = 6;
        const grid = Array(gridW * gridH).fill(0);
        const cellW = (MAP_WIDTH) / gridW;
        const cellH = (MAP_HEIGHT) / gridH;
        for (const u of unitsA) {
            const gx = Math.floor(u.x / cellW);
            const gy = Math.floor(u.y / cellH);
            const idx = gy * gridW + gx;
            if (idx >= 0 && idx < grid.length) grid[idx] += 1;
        }
        for (const u of unitsB) {
            const gx = Math.floor(u.x / cellW);
            const gy = Math.floor(u.y / cellH);
            const idx = gy * gridW + gx;
            if (idx >= 0 && idx < grid.length) grid[idx] -= 1;
        }
        try {
            return await this.rlInputManager.rlManager.predict(grid);
        } catch (err) {
            console.warn('[MetaAIManager] prediction failed:', err);
            return null;
        }
    }

    resetRoleAI(entity) {
        if (entity && typeof entity.resetRoleAI === 'function') {
            entity.resetRoleAI();
        }
    }

    executeAction(entity, action, context) {
        if (!action || !action.type || action.type === 'idle') return;
        const { eventManager } = context;

        // 행동 결정 로그는 너무 잦은 호출이 성능 문제를 일으킬 수 있어
        // 간단한 쿨다운 메커니즘으로 빈도를 제한한다.
        if (!entity._aiLogCooldown) entity._aiLogCooldown = 0;
        if (entity._aiLogCooldown <= 0) {
            eventManager.publish('debug', {
                tag: 'AI',
                message: `${entity.constructor.name} (id: ${entity.id.substr(0,4)}) decided action: ${action.type}`
            });
            entity._aiLogCooldown = 30; // 약 0.5초(60fps 기준) 동안 로그 억제
        } else {
            entity._aiLogCooldown--;
        }

        switch (action.type) {
            case 'attack':
                if (entity.attackCooldown === 0) {
                    const weaponTags = entity.equipment?.weapon?.tags || [];
                    const isRanged = weaponTags.includes('ranged') || weaponTags.includes('bow');
                    eventManager.publish('entity_attack', { attacker: entity, defender: action.target });
                    if (isRanged && context.projectileManager) {
                        const projSkill = {
                            projectile: 'arrow',
                            damage: entity.attackPower,
                            knockbackStrength: 32
                        };
                        context.projectileManager.create(entity, action.target, projSkill);
                    }
                    const baseCd = 60;
                    entity.attackCooldown = Math.max(1, Math.round(baseCd / (entity.attackSpeed || 1)));
                }
                break;
            case 'skill':
                const isSilenced = entity.effects?.some(e => e.id === 'silence');
                if (isSilenced) {
                    eventManager.publish('log', { message: `[침묵] 상태라 스킬을 사용할 수 없습니다.`, color: 'grey' });
                    break;
                }
                const skill = SKILLS[action.skillId];
                if (
                    skill &&
                    entity.mp >= skill.manaCost &&
                    (entity.skillCooldowns[action.skillId] || 0) <= 0
                ) {
                    entity.mp -= skill.manaCost;
                    entity.skillCooldowns[action.skillId] = skill.cooldown;
                    eventManager.publish('skill_used', { caster: entity, skill, target: action.target });
                    if (context.speechBubbleManager) {
                        context.speechBubbleManager.addBubble(entity, skill.name);
                    }
                    const baseCd = 60;
                    entity.attackCooldown = Math.max(1, Math.round(baseCd / (entity.attackSpeed || 1)));
                }
                break;
            case 'backstab_teleport': {
                const { target } = action;
                const { mapManager, vfxManager } = context;
                if (!target || !mapManager || !vfxManager) break;

                const fromPos = { x: entity.x, y: entity.y };
                const behindX = target.x - (target.direction * (mapManager.tileSize * 0.8));
                const behindY = target.y;
                const toPos = { x: behindX, y: behindY };

                vfxManager.addTeleportEffect(entity, fromPos, toPos, () => {
                    this.executeAction(entity, { type: 'attack', target }, context);
                });
                break;
            }
            case 'weapon_skill': {
                const skillData = WEAPON_SKILLS[action.skillId];
                if (!skillData) break;
                const weapon = entity.equipment?.weapon;
                if (!weapon || !weapon.weaponStats?.canUseSkill(action.skillId)) break;

                eventManager.publish('log', {
                    message: `${entity.constructor.name}의 ${weapon.name}(이)가 [${skillData.name}] 스킬을 사용합니다!`,
                    color: 'yellow'
                });

                if (action.skillId === 'charge' && context.motionManager && action.target) {
                    context.motionManager.dashTowards(
                        entity,
                        action.target,
                        3,
                        context.enemies,
                        context.eventManager,
                        context.vfxManager,
                        context.assets['strike-effect']
                    );
                }

                if (action.skillId === 'pull' && context.motionManager && action.target) {
                    // vfxManager를 pullTargetTo에 전달합니다.
                    context.motionManager.pullTargetTo(action.target, entity, context.vfxManager);
                }

                if (action.skillId === 'charge_shot' && context.effectManager) {
                    context.effectManager.addEffect(action.target, 'charging_shot_effect');
                }

                if (action.skillId === 'parry_stance' && context.effectManager) {
                    context.effectManager.addEffect(entity, 'parry_ready');
                }
                if (action.skillId === "full_strike" && action.target) {
                    eventManager.publish("entity_attack", { attacker: entity, defender: action.target, skill: skillData });
                    context.statusEffectsManager?.applyTwisted(action.target, skillData.twistedDuration || 2000);
                    entity.attackCooldown = Math.max(1, Math.round(60 / (entity.attackSpeed || 1)));
                }
                if (action.skillId === 'thunder_strike' && context.effectManager && action.target) {
                    eventManager.publish('entity_attack', { attacker: entity, defender: action.target, skill: skillData });
                    context.effectManager.addEffect(action.target, 'shock');
                    entity.attackCooldown = Math.max(1, Math.round(60 / (entity.attackSpeed || 1)));
                }

                if (context.speechBubbleManager) {
                    context.speechBubbleManager.addBubble(entity, skillData.name);
                }

                weapon.weaponStats.setCooldown(skillData.cooldown);
                break; }
            case 'charge_attack': {
                const { motionManager, eventManager: ev, enemies, vfxManager, assets } = context;
                const { target, skill } = action;

                if (motionManager) {
                    motionManager.dashTowards(
                        entity,
                        target,
                        Math.floor(skill.chargeRange / context.mapManager.tileSize),
                        enemies,
                        ev,
                        vfxManager,
                        assets['strike-effect']
                    );
                } else {
                    const dx = target.x - entity.x;
                    const dy = target.y - entity.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    entity.x = target.x - (dx / dist) * entity.width;
                    entity.y = target.y - (dy / dist) * entity.height;
                    ev.publish('entity_attack', { attacker: entity, defender: target, skill });
                }

                entity.mp -= skill.manaCost;
                entity.skillCooldowns[skill.id] = skill.cooldown;
                entity.attackCooldown = Math.max(1, Math.round(60 / (entity.attackSpeed || 1)));
                break; }
            case 'move':
                const { movementManager } = context;
                if (movementManager) {
                    movementManager.moveEntityTowards(entity, action.target, context);
                }
                break;
        }
        eventManager.publish('action_performed', { entity, action, context });
    }

    async update(context) {
        for (const groupId in this.groups) {
            const group = this.groups[groupId];
            const currentContext = {
                ...context,
                allies: group.members,
                enemies: Object.values(this.groups).filter(g => g.id !== groupId).flatMap(g => g.members),
                settings: SETTINGS
            };

            const membersSorted = [...group.members].sort((a,b) => (b.attackSpeed || 1) - (a.attackSpeed || 1));
            for (const member of membersSorted) {
                if (member.hp <= 0) continue;

                // 에어본 상태이면, 이번 턴 행동을 건너뜀
                if (Array.isArray(member.effects) && member.effects.some(e => e.id === 'airborne')) {
                    if (typeof member.update === 'function') member.update(currentContext);
                    continue;
                }

                // 1단계: 쿨다운 감소 등 상태 업데이트
                if (typeof member.update === 'function') {
                    member.update(currentContext);
                } else {
                    if (member.attackCooldown > 0) member.attackCooldown--;
                    if (typeof member.applyRegen === 'function') member.applyRegen();
                }

                // 2단계: 행동 결정
                let action = { type: 'idle' };

                // 2.1: 역할(Role) AI가 먼저 행동을 결정 (힐, 소환 등)
                if (member.roleAI) {
                    action = member.roleAI.decideAction(member, currentContext);
                }

                // 2.2: 역할 AI가 특별한 행동을 하지 않으면, 무기(Weapon) AI가 전투 행동을 결정
                if (action.type === 'idle') {
                    const weapon = member.equipment?.weapon;
                    const combatAI = context.microItemAIManager?.getWeaponAI(weapon);
                    if (combatAI) {
                        action = combatAI.decideAction(member, weapon, currentContext);
                    }
                }

                // 2.3: 무기 AI도 할 일이 없으면, 최후의 보루(Fallback) AI가 기본 행동 결정
                if (action.type === 'idle') {
                    if (member.fallbackAI) {
                        action = member.fallbackAI.decideAction(member, currentContext);
                    } else if (member.ai && !member.roleAI) {
                        action = member.ai.decideAction(member, currentContext);
                    }
                }

                if (this.rlInputManager) {
                    try {
                        const rlAct = await this.rlInputManager.getAction(member, currentContext);
                        if (rlAct) {
                            action = rlAct;
                        }
                    } catch (err) {
                        console.warn('[MetaAIManager] RLInput error:', err);
                    }
                }
                
                // 실수 엔진을 통해 최종 행동 결정
                const finalAction = MistakeEngine.getFinalAction(member, action, currentContext, this.mbtiEngine);

                // AI가 행동을 결정한 직후 MBTI 엔진 처리
                this.processMbti(member, { ...finalAction, context: currentContext });

                this.executeAction(member, finalAction, currentContext);
            }
        }
    }
}
