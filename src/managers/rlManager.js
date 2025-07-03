// src/managers/rlManager.js
// Sends real-time combat events to a TensorFlow Web Worker
// and retrieves predictions for battle outcomes.

export class RLManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.worker = null;
        this.ready = false;
        this.lastActionIndex = null;
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

    recordExperience(exp) {
        if (!this.ready || !this.worker) return;
        this.worker.postMessage({ type: 'train', experience: exp });
    }

    getLastAction() {
        return this.lastActionIndex;
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
        if (!this.ready || !this.worker) return Promise.resolve(null);
        return new Promise((resolve) => {
            const handler = (e) => {
                if (e.data.type === 'dataset') {
                    this.worker.removeEventListener('message', handler);
                    resolve(e.data.dataset);
                }
            };
            this.worker.addEventListener('message', handler);
            this.worker.postMessage({ type: 'save' });
        });
    }

    async downloadDataset(filename = 'rl-dataset.json') {
        const data = await this.saveDataset();
        if (!data) return null;
        if (typeof document !== 'undefined') {
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        }
        return data;
    }
}
