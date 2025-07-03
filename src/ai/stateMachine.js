export class State {
    enter(agent, data) {}
    execute(agent, context) {}
    exit(agent, data) {}
}

export class IdleState extends State {
    execute(agent, context) {
        const { enemies } = context;
        if (!Array.isArray(enemies)) return;
        const vision = agent.visionRange || 0;
        const target = enemies.find(e => Math.hypot(e.x - agent.x, e.y - agent.y) < vision);
        if (target) {
            agent.stateMachine.change('chase', { target });
        }
    }
}

export class ChasingState extends State {
    enter(agent, data) { this.target = data?.target || null; }
    execute(agent, context) {
        if (!this.target || this.target.hp <= 0) {
            agent.stateMachine.change('idle');
            return;
        }
        const dist = Math.hypot(this.target.x - agent.x, this.target.y - agent.y);
        if (dist <= (agent.attackRange || 0)) {
            agent.stateMachine.change('attack', { target: this.target });
            return;
        }
        const stepX = Math.sign(this.target.x - agent.x) * (agent.speed || 1);
        const stepY = Math.sign(this.target.y - agent.y) * (agent.speed || 1);
        agent.x += stepX;
        agent.y += stepY;
    }
}

export class AttackingState extends State {
    enter(agent, data) { this.target = data?.target || null; }
    execute(agent, context) {
        if (!this.target || this.target.hp <= 0) {
            agent.stateMachine.change('idle');
            return;
        }
        const dist = Math.hypot(this.target.x - agent.x, this.target.y - agent.y);
        if (dist > (agent.attackRange || 0)) {
            agent.stateMachine.change('chase', { target: this.target });
            return;
        }
        if (agent.attackCooldown && agent.attackCooldown > 0) {
            agent.attackCooldown--;
            return;
        }
        context.eventManager?.publish('entity_attack', { attacker: agent, defender: this.target });
        agent.attackCooldown = 60;
    }
}

export class StateMachine {
    constructor(agent) {
        this.agent = agent;
        this.states = {};
        this.current = null;
    }
    add(name, state) { this.states[name] = state; }
    change(name, data) {
        if (this.current && this.current.exit) this.current.exit(this.agent, data);
        this.current = this.states[name];
        if (this.current && this.current.enter) this.current.enter(this.agent, data);
    }
    update(context) {
        if (this.current && this.current.execute) this.current.execute(this.agent, context);
    }
}
