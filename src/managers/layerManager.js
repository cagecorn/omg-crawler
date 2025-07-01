import { WebGLRenderer } from '../renderers/webglRenderer.js';

export class LayerManager {
    constructor(useWebGL = false) {
        this.layers = {
            mapBase: document.getElementById('map-base-canvas'),
            mapDecor: document.getElementById('map-decor-canvas'),
            groundFx: document.getElementById('ground-fx-canvas'),
            entity: document.getElementById('entity-canvas'),
            vfx: document.getElementById('vfx-canvas'),
            weather: document.getElementById('weather-canvas'),
        };
        this.contexts = {};
        this.glRenderers = {};
        for (const key in this.layers) {
            if (useWebGL && ['entity','vfx','weather'].includes(key)) {
                const renderer = new WebGLRenderer(this.layers[key]);
                this.glRenderers[key] = renderer;
                this.contexts[key] = renderer;
            } else {
                this.contexts[key] = this.layers[key].getContext('2d');
            }
        }

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        for (const key in this.layers) {
            this.layers[key].width = window.innerWidth;
            this.layers[key].height = window.innerHeight;
        }
    }

    clear(layerKey) {
        if (layerKey) {
            const layer = this.layers[layerKey];
            const ctx = this.contexts[layerKey];
            if (ctx && ctx.clear) {
                ctx.clear();
            } else {
                ctx.clearRect(0, 0, layer.width, layer.height);
            }
        } else {
            for (const key in this.contexts) {
                const layer = this.layers[key];
                const ctx = this.contexts[key];
                if (ctx && ctx.clear) {
                    ctx.clear();
                } else {
                    ctx.clearRect(0, 0, layer.width, layer.height);
                }
            }
        }
    }
}
