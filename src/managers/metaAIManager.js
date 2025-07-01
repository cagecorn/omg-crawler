import { MetaAIManager as BaseMetaAI, STRATEGY } from './ai-managers.js';
import { FearAI, ConfusionAI, BerserkAI, CharmAI } from '../ai.js';
import { MistakeEngine } from './ai/MistakeEngine.js';
import { SETTINGS } from '../../config/gameSettings.js';

export class MetaAIManager extends BaseMetaAI {
    constructor(eventManager, squadManager = null) {
        super(eventManager);
        this.squadManager = squadManager;
    }

    executeAction(entity, action, context) {
        if (!action) return;
        const { player, mapManager, onPlayerAttack, onMonsterAttacked } = context;

        switch (action.type) {
            case 'attack':
                if (entity.attackCooldown === 0) {
                    if (entity.isFriendly) {
                        onMonsterAttacked(action.target.id, entity.attackPower);
                    } else {
                        onPlayerAttack(entity.attackPower);
                    }
                    const baseCd = 60;
                    entity.attackCooldown = Math.max(1, Math.round(baseCd / (entity.attackSpeed || 1)));
                }
                break;
            case 'move':
                const dx = action.target.x - entity.x;
                const dy = action.target.y - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= entity.speed) {
                    if (!mapManager.isWallAt(action.target.x, action.target.y, entity.width, entity.height)) {
                        entity.x = action.target.x;
                        entity.y = action.target.y;
                    }
                } else {
                    let moveX = (dx / distance) * entity.speed;
                    let moveY = (dy / distance) * entity.speed;
                    const newX = entity.x + moveX;
                    const newY = entity.y + moveY;
                    if (!mapManager.isWallAt(newX, newY, entity.width, entity.height)) {
                        entity.x = newX;
                        entity.y = newY;
                    }
                }
                break;
            default:
                // 나머지 행동 유형은 기본 메서드에 위임한다
                super.executeAction(entity, action, context);
                break;
        }
        context.eventManager?.publish('action_performed', { entity, action, context });
    }

    update(context) {
        const currentContext = { ...context, metaAIManager: this, settings: SETTINGS };
        if (this.squadManager) {
            this.updateCombatStrategy(currentContext);
        }
        for (const groupId in this.groups) {
            const group = this.groups[groupId];
            const membersSorted = [...group.members].sort((a,b)=>(b.attackSpeed||1)-(a.attackSpeed||1));
            for (const member of membersSorted) {
                if (member.hp <= 0 || member.possessedBy) continue;

                if (typeof member.update === 'function') {
                    member.update(currentContext);
                } else if (member.attackCooldown > 0) {
                    member.attackCooldown--;
                }

                const overrideEffect = member.effects.find(e => e.type === 'ai_override');
                if (overrideEffect) {
                    let overrideAI;
                    switch (overrideEffect.id) {
                        case 'fear': overrideAI = new FearAI(); break;
                        case 'confusion': overrideAI = new ConfusionAI(); break;
                        case 'berserk': overrideAI = new BerserkAI(); break;
                        case 'charm': overrideAI = new CharmAI(); break;
                    }
                    if (overrideAI) {
                        const action = overrideAI.decideAction(member, currentContext);
                        this.executeAction(member, action, currentContext);
                        continue;
                    }
                }

                const isCCd = member.effects && member.effects.some(e => e.tags && e.tags.includes('cc'));
                if (isCCd) continue;
                if (member.statusEffects && member.statusEffects.isTwisted) continue;

                if (!member.update) {
                    if (member.attackCooldown > 0) member.attackCooldown--;
                }

                if (member.ai) {
                    let action = { type: 'idle' };
                    let ctx = currentContext;
                    if (this.squadManager) {
                        const squad = this.squadManager.getSquadForMerc(member.id);
                        const strategy = squad ? squad.strategy : STRATEGY.AGGRESSIVE;
                        if (strategy === STRATEGY.DEFENSIVE) {
                            const player = currentContext.player;
                            const map = currentContext.mapManager;
                            const defensiveRadius = (map?.tileSize || 16) * 3;
                            const dist = Math.hypot(member.x - player.x, member.y - player.y);
                            if (dist > defensiveRadius) {
                                action = { type: 'move', target: { x: player.x, y: player.y } };
                            } else {
                                ctx = {
                                    ...currentContext,
                                    enemies: currentContext.enemies.filter(e => Math.hypot(e.x - player.x, e.y - player.y) <= defensiveRadius)
                                };
                            }
                        }
                    }

                    if (action.type === 'idle') {
                        action = member.ai.decideAction(member, ctx);
                    }

                    const finalAction = MistakeEngine.getFinalAction(member, action, ctx, this.mbtiEngine);
                    this.executeAction(member, finalAction, ctx);
                }
            }
        }
    }

    updateCombatStrategy(context) {
        const player = context.player;
        const enemies = context.enemies || [];
        const mercs = this.squadManager?.mercenaryManager.getMercenaries() || [];
        if (enemies.length === 0) return;
        for (const merc of mercs) {
            const squad = this.squadManager.getSquadForMerc(merc.id);
            const strategy = squad ? squad.strategy : STRATEGY.DEFENSIVE;
            merc.squadStrategy = strategy;
            this.assignGoalToUnit(merc, strategy, player, enemies);
        }
    }

    assignGoalToUnit(merc, strategy, player, enemies) {
        if (!merc.ai) return;
        switch (strategy) {
            case STRATEGY.AGGRESSIVE: {
                const target = this.findNearestTarget(merc, enemies);
                if (target && merc.ai.setGoal) {
                    merc.ai.setGoal('ATTACK', { target });
                }
                break;
            }
            case STRATEGY.DEFENSIVE:
            default: {
                if (merc.ai.setGoal) {
                    merc.ai.setGoal('GUARD_AREA', { position: { x: player.x, y: player.y }, radius: 5 });
                }
                break;
            }
        }
    }

    findNearestTarget(unit, targets) {
        let closest = null;
        let minD = Infinity;
        for (const t of targets) {
            const d = Math.hypot(unit.x - t.x, unit.y - t.y);
            if (d < minD) { minD = d; closest = t; }
        }
        return closest;
    }
}
