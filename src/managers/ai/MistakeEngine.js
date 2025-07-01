export class MistakeEngine {
    static getFinalAction(entity, optimalAction, context, mbtiEngine) {
        const enabled = context?.settings?.ENABLE_MISTAKE_ENGINE !== false;
        if (!enabled) return optimalAction;

        let mistakeProbability = entity.properties?.mistakeChance ?? 0;

        if (mbtiEngine?.model && mbtiEngine.tf && typeof mbtiEngine.buildInput === 'function') {
            try {
                const inputTensor = mbtiEngine.buildInput(entity, optimalAction, context.game);
                const outputTensor = mbtiEngine.model.predict(inputTensor);
                mistakeProbability = outputTensor.dataSync()[0];
                mbtiEngine.tf.dispose([inputTensor, outputTensor]);
            } catch (err) {
                console.warn('[MistakeEngine] Failed to run model:', err);
            }
        }

        if (mistakeProbability <= 0) return optimalAction;
        if (Math.random() >= mistakeProbability) return optimalAction;
        console.log(`[MistakeEngine] ${entity.name} makes a mistake`);
        const types = ['bad_target','bad_position','waste_action'];
        const mistakeType = types[Math.floor(Math.random() * types.length)];
        let mistake = null;
        switch (mistakeType) {
            case 'bad_target':
                mistake = this.generateBadTargetAction(entity, optimalAction, context);
                break;
            case 'bad_position':
                mistake = this.generateBadPositionAction(entity, optimalAction, context);
                break;
            case 'waste_action':
                mistake = this.generateWasteAction(entity, optimalAction, context);
                break;
        }
        if (mistake) {
            mistake.isMistake = true;
            mistake.mistakeDescription = this.getMistakeDescription(mistake);
            return mistake;
        }
        return optimalAction;
    }

    static generateBadTargetAction(entity, optimalAction, context) {
        const enemies = context.enemies || context.monsterManager?.monsters || [];
        const allies = context.allies || context.mercenaryManager?.mercenaries || [];
        if (entity.equipment?.weapon?.type === 'whip' && optimalAction.skill?.effect === 'pull') {
            let strongest = null;
            for (const e of enemies) {
                if (!strongest || (e.attackPower || 0) > (strongest.attackPower || 0)) {
                    strongest = e;
                }
            }
            if (strongest) return { ...optimalAction, target: strongest };
        }
        if (entity.equipment?.weapon?.type === 'bow' && optimalAction.skill?.effect === 'knockback') {
            const healer = allies.find(a => a.jobId === 'healer');
            if (healer) {
                const farEnemies = enemies.filter(e => Math.hypot(e.x - healer.x, e.y - healer.y) > 5);
                if (farEnemies.length) {
                    const rand = farEnemies[Math.floor(Math.random() * farEnemies.length)];
                    return { ...optimalAction, target: rand };
                }
            }
        }
        return null;
    }

    static generateBadPositionAction(entity, optimalAction, context) {
        if (optimalAction.type !== 'move' || !context.allies) return null;
        const allies = context.allies.filter(a => a.id !== entity.id);
        if (allies.length === 0) return null;
        const avgX = allies.reduce((sum,a)=>sum+a.x,0)/allies.length;
        const avgY = allies.reduce((sum,a)=>sum+a.y,0)/allies.length;
        const vectorX = entity.x - avgX;
        const vectorY = entity.y - avgY;
        const targetX = entity.x + vectorX * 5;
        const targetY = entity.y + vectorY * 5;
        return { type: 'move', target: { x: targetX, y: targetY } };
    }

    static generateWasteAction(entity, optimalAction, context) {
        if (optimalAction.type === 'skill' && optimalAction.skill?.effect === 'heal') {
            const allies = context.allies || [];
            const fullHpAlly = allies.find(a => a.hp >= a.maxHp);
            if (fullHpAlly) return { ...optimalAction, target: fullHpAlly };
        }
        return null;
    }

    static getMistakeDescription(action) {
        if (action.type === 'move') return '진형을 이탈하여 혼자 움직였습니다.';
        if (action.type === 'skill' && action.skill?.effect === 'heal') return '엉뚱한 대상에게 치유를 사용했습니다.';
        return '이해할 수 없는 행동으로 실수를 저질렀습니다.';
    }
}

if (!Array.prototype.getRandom) {
    Object.defineProperty(Array.prototype, 'getRandom', {
        value: function() {
            return this[Math.floor(Math.random() * this.length)];
        },
        enumerable: false
    });
}
