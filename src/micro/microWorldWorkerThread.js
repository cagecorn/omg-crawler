import { MicroCombatManager } from './MicroCombatManager.js';
import { MicroTurnManager } from './MicroTurnManager.js';
import { EventManager } from '../managers/eventManager.js';
import { AspirationEngine } from './AspirationEngine.js';

const port = self;
const microEventManager = new EventManager();
const combatManager = new MicroCombatManager(microEventManager);
const turnManager = new MicroTurnManager();
let aspirationEngine = null;

microEventManager.subscribe('aspiration_state_changed_from_micro', (data) => {
    port.postMessage({ type: 'aspiration_state_changed_from_micro', payload: data });
});
port.onmessage = (event) => {
    const msg = event.data;
    const { type, payload, module } = msg;
    switch (type) {
        case 'init_module':
            if (module === 'AspirationEngine' && !aspirationEngine) {
                aspirationEngine = new AspirationEngine(microEventManager);
            }
            break;
        case 'macro_event':
            microEventManager.publish('macro_event_forwarded', payload);
            break;
        case 'resolveAttack':
            combatManager.resolveAttack(msg.attacker, msg.defender);
            port.postMessage({ type: 'resolveAttackComplete', attacker: msg.attacker, defender: msg.defender });
            break;
        case 'update':
            turnManager.update(msg.items);
            port.postMessage({ type: 'updateComplete' });
            break;
    }
};
