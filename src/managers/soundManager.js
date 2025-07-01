export class SoundManager {
    constructor(eventManager = null, assets = null) {
        this.eventManager = eventManager;
        this.sounds = {};

        if (typeof window !== 'undefined') {
            this._preload();
        }

        if (this.eventManager) {
            this._registerEvents();
        }

        console.log('[SoundManager] Initialized');
    }

    _preload() {
        const names = [
            'airial-1',
            'airial-2',
            // === Voice lines ===
            'player_kill_1',
            'player_kill_2',
            'warrior_hire', 'warrior_kill_1', 'warrior_kill_2', 'warrior_death',
            'archer_hire', 'archer_kill_1', 'archer_kill_2', 'archer_death',
            'healer_hire', 'healer_kill_1', 'healer_kill_2', 'healer_death',
            'wizard_hire', 'wizard_kill_1', 'wizard_kill_2', 'wizard_death',
            'bard_hire', 'bard_kill_1', 'bard_kill_2', 'bard_death',
            'courage-hymn',
            'crack-1',
            'crack-2',
            'crash-1',
            'crash-2',
            'explosive-1',
            'explosive-2',
            'explosive-3',
            'fallen-1',
            'freeze-1',
            'guardian-hymn',
            'hitting-1',
            'hitting-2',
            'hitting-3',
            'icy-2',
            'magic-hit-1',
            'metal-1',
            'micro-judgement-1',
            'rock-1',
            'simple-attack-1',
            'whiplash-1',
            'simple-attack-2',
            'simple-attack-3',
            'simple-attack-4',
            'slash-1',
            'slash-2',
            'sting-1',
            'thrust-1',
            'thrust-2',
            'thrust-3'
        ];
        names.forEach(name => {
            const audio = new Audio(`assets/soundeffect/${name}.mp3`);
            audio.preload = 'auto';
            audio.volume = 0.5;
            this.sounds[name] = audio;
        });
    }

    play(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }

    _registerEvents() {
        const ev = this.eventManager;

        ev.subscribe('mercenary_hired', ({ mercenary }) => {
            const job = mercenary?.jobId;
            if (job && job !== 'summoner') {
                this.play(`${job}_hire`);
            }
        });

        ev.subscribe('entity_attack', ({ attacker, skill }) => {
            const weapon = attacker?.equipment?.weapon;
            if (skill?.projectile === 'arrow' || weapon?.tags?.includes('bow')) {
                this.play('simple-attack-1');
            } else if (weapon?.tags?.includes('whip')) {
                this.play('whiplash-1');
            } else if (skill?.tags?.includes('magic')) {
                this.play('magic-hit-1');
            } else if (skill?.tags?.includes('ranged')) {
                this.play('thrust-1');
            } else {
                this.play('slash-1');
            }
        });

        ev.subscribe('attack_landed', () => this.play('hitting-2'));
        ev.subscribe('weapon_disarmed', () => this.play('crash-1'));
        ev.subscribe('armor_broken', () => this.play('crack-2'));
        ev.subscribe('entity_death', ({ attacker, victim }) => {
            this.play('fallen-1');
            if (victim?.isFriendly && !victim.isPlayer && victim.jobId && victim.jobId !== 'summoner') {
                this.play(`${victim.jobId}_death`);
            }
            if (attacker) {
                const key = attacker.isPlayer ? 'player' : attacker.jobId;
                if (key && key !== 'summoner') {
                    const idx = Math.random() < 0.5 ? 1 : 2;
                    this.play(`${key}_kill_${idx}`);
                }
            }
        });
        ev.subscribe('drop_loot', () => this.play('hitting-3'));
        ev.subscribe('charge_hit', () => this.play('airial-1'));
        ev.subscribe('knockback_success', () => this.play('rock-1'));
        ev.subscribe('level_up', () => this.play('micro-judgement-1'));
        ev.subscribe('skill_used', ({ skill }) => {
            if (!skill) return;
            if (skill.id === 'guardian_hymn') this.play('guardian-hymn');
            else if (skill.id === 'courage_hymn') this.play('courage-hymn');
            else if (skill.tags?.includes('ice')) this.play('freeze-1');
            else if (skill.tags?.includes('fire')) this.play('explosive-2');
        });
    }
}
