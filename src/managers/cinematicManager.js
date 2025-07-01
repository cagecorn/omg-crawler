export class CinematicManager {
    constructor(game) {
        this.game = game;
        this.eventManager = game.eventManager;
        this.isPlaying = false;
        this.targetEntity = null;
        this.targetZoom = 1;
        this.originalZoom = 1;
        this.originalTimeScale = 1;

        this.init();
    }

    init() {
        this.eventManager.subscribe('weapon_disarmed', (data) => {
            const target = data.owner || data.defender;
            if (target) {
                this.triggerMicroWorldJudgement(target);
                this.eventManager.publish('micro_world_event', { type: 'disarm', entity: target });
            }
        });
        this.eventManager.subscribe('armor_broken', (data) => {
            const target = data.owner || data.defender;
            if (target) {
                this.triggerMicroWorldJudgement(target);
                this.eventManager.publish('micro_world_event', { type: 'armor_break', entity: target });
            }
        });
    }

    triggerMicroWorldJudgement(target) {
        this.triggerCinematic(target, 'MICROWORLD JUDGEMENT!', 2000);
    }

    triggerCinematic(target, text, duration) {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.targetEntity = target;

        // Save the game's current zoom and time scale so we can restore them
        // precisely once the cinematic ends.
        this.originalZoom = this.game.gameState.zoomLevel;
        this.originalTimeScale = this.game.gameLoop.timeScale;

        this.targetZoom = this.originalZoom * 1.8;
        console.log('계산된 카메라 줌 레벨:', this.targetZoom);
        this.targetZoom = Math.min(this.targetZoom, 10);
        this.game.gameLoop.timeScale = 0.2;

        this.game.vfxManager.addCinematicText(text, duration);

        setTimeout(() => {
            this.reset();
        }, duration);
    }

    playItemCloseup(item) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.targetEntity = item;

        this.originalZoom = this.game.gameState.zoomLevel;
        this.originalTimeScale = this.game.gameLoop.timeScale;
        this.targetZoom = this.originalZoom * 2.2;
        console.log('계산된 카메라 줌 레벨:', this.targetZoom);
        this.targetZoom = Math.min(this.targetZoom, 10);
        this.game.gameLoop.timeScale = 0.1;

        // actual highlight will be drawn in render()

        setTimeout(() => {
            this.reset();
            this.eventManager.publish('cinematic_complete', { id: item.id });
        }, 1500);
    }

    render(ctx) {
        if (!this.isPlaying || !this.targetEntity || !this.targetEntity.image) return;

        const canvas = ctx.canvas;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const scale = 2;
        const w = this.targetEntity.width * scale;
        const h = this.targetEntity.height * scale;
        const x = canvas.width / 2 - w / 2;
        const y = canvas.height / 2 - h / 2;
        ctx.drawImage(this.targetEntity.image, x, y, w, h);
        ctx.restore();
    }

    reset() {
        this.targetZoom = this.originalZoom;
        this.game.gameLoop.timeScale = this.originalTimeScale;
        this.targetEntity = null;
        setTimeout(() => {
            this.isPlaying = false;
            this.eventManager.publish('cinematic_complete');
        }, 500);
    }
}
