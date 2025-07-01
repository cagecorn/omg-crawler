export class AspirationEngine {
    constructor(microEventManager) {
        this.eventManager = microEventManager;
        // 거시세계(메인 게임)의 이벤트를 수신하여 정신력 변화를 처리
        this.eventManager.subscribe('macro_event_forwarded', this.handleMacroEvent.bind(this));
    }

    handleMacroEvent(event) {
        const { type, data } = event;
        const weapon = data.attacker?.equipment?.weapon;
        if (!weapon || !weapon.aspiration) return;

        let change = 0;
        const asp = weapon.aspiration;
        const personality = asp.personality;

        switch (type) {
            case 'entity_death':
                if (data.victim?.isFriendly === false) {
                    change = (personality === 'bloodthirsty') ? 15 : 10;
                }
                break;
            case 'entity_damaged':
                if (data.isPlayer) {
                    change = (personality === 'craven') ? -8 : -5;
                }
                break;
            case 'attack_missed':
                change = -3;
                break;
        }

        if (change !== 0) {
            this.updateAspiration(weapon, change);
        }
    }

    updateAspiration(weapon, change) {
        const asp = weapon.aspiration;
        asp.current = Math.max(0, Math.min(asp.max, asp.current + change));

        const oldState = asp.state;
        if (asp.current >= 85) {
            asp.state = 'inspired';
        } else if (asp.current <= 15) {
            asp.state = 'despairing';
        } else {
            asp.state = 'stable';
        }

        if (oldState !== asp.state) {
            this.eventManager.publish('aspiration_state_changed_from_micro', {
                weaponId: weapon.id,
                newState: asp.state
            });
        }
    }
}
