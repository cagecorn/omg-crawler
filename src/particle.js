export class Particle {
    constructor(x, y, color = 'yellow', options = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = options.type || null;

        this.text = options.text || null;

        const angle = options.angle !== undefined ? options.angle : Math.random() * Math.PI * 2;
        const speed = options.speed !== undefined ? options.speed : Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.gravity = options.gravity !== undefined ? options.gravity : 0.1;
        this.lifespan = options.lifespan !== undefined ? options.lifespan : 60 + Math.random() * 30;
        this.initialLifespan = this.lifespan;
        this.size = options.size !== undefined ? options.size : Math.random() * 3 + 1;

        this.homingTarget = options.homingTarget || null;
        this.homingStrength = options.homingStrength !== undefined ? options.homingStrength : 0.05;

        if (this.type === 'electric') {
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = 0.5 + Math.random() * 0.5;
        }
    }

    update() {
        this.lifespan--;

        if (this.homingTarget) {
            const dx = this.homingTarget.x - this.x;
            const dy = this.homingTarget.y - this.y;
            const dist = Math.hypot(dx, dy) || 1;
            this.vx += (dx / dist) * this.homingStrength;
            this.vy += (dy / dist) * this.homingStrength;
        }

        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.type === 'electric') {
            this.wobble += this.wobbleSpeed;
            this.x += Math.sin(this.wobble) * 0.5;
            this.y += Math.cos(this.wobble) * 0.5;
            this.vx *= 0.98;
            this.vy *= 0.98;
        }
    }

    render(ctx) {
        ctx.globalAlpha = this.lifespan / this.initialLifespan;

        if (this.text) {
            ctx.fillStyle = this.color;
            ctx.font = `${this.size * 5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.text, this.x, this.y);
        } else if (this.type === 'electric') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }

        ctx.globalAlpha = 1.0;
    }
}
