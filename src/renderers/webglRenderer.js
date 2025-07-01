export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!this.gl) {
            console.warn('WebGL not supported');
        } else {
            this.gl.clearColor(0, 0, 0, 1);
        }
    }

    clear() {
        if (!this.gl) return;
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
}
