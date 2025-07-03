import { StateMachine, IdleState, ChasingState, AttackingState } from '../../src/ai/stateMachine.js';
import { describe, test, assert } from '../helpers.js';

describe('BasicStateMachine', () => {
    test('transitions from idle to chase to attack', () => {
        const agent = { x:0, y:0, visionRange:10, attackRange:2, speed:1, attackCooldown:0 };
        const enemy = { x:5, y:0, hp:10 };
        const context = { enemies:[enemy], eventManager:{ publish: () => {} } };
        const fsm = new StateMachine(agent);
        fsm.add('idle', new IdleState());
        fsm.add('chase', new ChasingState());
        fsm.add('attack', new AttackingState());
        agent.stateMachine = fsm;
        fsm.change('idle');

        fsm.update(context);
        assert.ok(fsm.current instanceof ChasingState);

        for(let i=0;i<5;i++) {
            fsm.update(context);
        }
        assert.ok(fsm.current instanceof AttackingState);
    });
});
