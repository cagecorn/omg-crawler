export class GameLoop {
    constructor(update, render) {
        this.update = update;
        this.render = render;
        this.isRunning = false;
        this.lastTime = 0;
        this.timeScale = 1.0;
    }

    start() {
        this.isRunning = true;
        this.loop(0);
    }

    stop() {
        this.isRunning = false;
    }

    loop = (currentTime) => {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime * this.timeScale);
        this.render();

        requestAnimationFrame(this.loop);
    }
}
