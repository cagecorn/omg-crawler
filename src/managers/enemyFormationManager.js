import { FormationManager } from './formationManager.js';
import { MeleeAI, RangedAI, HealerAI } from '../ai.js';

/**
 * Specialized formation manager for enemy troops.
 * Default rules:
 *  - Melee units in row 1 (index 0)
 *  - Ranged units in row 2 (index 1)
 *  - Healers/Buffers in row 3 (index 2)
 * Orientation is fixed to RIGHT so that enemies face left.
 */
export class EnemyFormationManager extends FormationManager {
    constructor(rows = 3, cols = 3, tileSize = 192) {
        super(rows, cols, tileSize, 'RIGHT');
        this.rules = [];
        this._registerDefaultRules();
    }

    _registerDefaultRules() {
        this.addRule(m => m.ai instanceof MeleeAI, 0);
        this.addRule(m => m.ai instanceof RangedAI, 1);
        this.addRule(m => m.ai instanceof HealerAI, 2);
    }

    addRule(predicate, row) {
        this.rules.push({ predicate, row });
    }

    arrange(enemies) {
        const counts = Array(this.rows).fill(0);
        for (const enemy of enemies) {
            if (!enemy) continue;
            let row = 0;
            const rule = this.rules.find(r => r.predicate(enemy));
            if (rule) row = rule.row;
            const col = counts[row]++;
            if (col >= this.cols) {
                this.resize(this.rows, col + 1);
            }
            const slot = row * this.cols + col;
            this.assign(slot, enemy.id);
        }
    }
}
