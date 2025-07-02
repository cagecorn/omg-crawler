// src/managers/rlManager.js
// Sends real-time combat events to a TensorFlow Web Worker
// and retrieves predictions for battle outcomes.

export class RLManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.worker = null;
        this.ready = false;
    }

    async init(featLength = 3) {
        if (typeof Worker === 'undefined') return;
        try {
            const url = new URL('../workers/rlWorker.js', import.meta.url);
            this.worker = new Worker(url);
            this.worker.postMessage({ type: 'init', featLength });
            this.ready = true;
        } catch (err) {
            console.warn('[RLManager] Worker init failed:', err);
        }
    }

    _send(type, data) {
        if (this.ready && this.worker) {
            this.worker.postMessage({ type, data });
        }
    }

    predict(features) {
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

    // backward compatibility
    requestPrediction(features) {
        return this.predict(features);
    }

    record(data) {
        if (!this.ready || !this.worker) return;
        this.worker.postMessage({ type: 'record', data });
    }


    saveDataset() {
        this._send('save');
    }
}
