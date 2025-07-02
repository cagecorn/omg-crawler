// src/managers/rlManager.js
// Sends real-time combat events to a TensorFlow Web Worker
// and retrieves predictions for battle outcomes.

export class RLManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.worker = null;
        this.ready = false;
    }

    async init() {
        if (typeof Worker === 'undefined') return;
        try {
            const url = new URL('../workers/rlWorker.js', import.meta.url);
            this.worker = new Worker(url);
            this.worker.postMessage({ type: 'init' });
            this.ready = true;
        } catch (err) {
            console.warn('[RLManager] Worker init failed:', err);
        }

        if (!this.eventManager) return;
        this.eventManager.subscribe('action_performed', (data) => {
            this._send('record', data);
        });
        this.eventManager.subscribe('battle_record', (data) => {
            this._send('record', { battle: data });
        });
    }

    _send(type, data) {
        if (this.ready && this.worker) {
            this.worker.postMessage({ type, data });
        }
    }

    requestPrediction(features) {
        return new Promise((resolve) => {
            if (!this.ready || !this.worker) return resolve(null);
            const id = Math.random().toString(36).slice(2);
            const handler = (e) => {
                if (e.data.type === 'prediction' && e.data.id === id) {
                    this.worker.removeEventListener('message', handler);
                    resolve(e.data.prediction);
                }
            };
            this.worker.addEventListener('message', handler);
            this.worker.postMessage({ type: 'predict', id, data: features });
        });
    }


    saveDataset() {
        this._send('save');
    }
}
