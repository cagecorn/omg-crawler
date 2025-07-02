// src/managers/rlObserver.js
// Observes battle rounds to track TensorFlow predictions and accuracy.
import { RLManager } from './rlManager.js';
import { memoryDB } from '../persistence/MemoryDB.js';
import { FACTIONS } from '../constants/factions.js';

export class RLObserver {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.rlManager = new RLManager(eventManager);
        this.stats = { total: 0, correct: 0, score: 0 };
        this.prediction = null;
        this.panel = null;
        this.content = null;
    }

    async init() {
        await this.rlManager.init();
        if (typeof document !== 'undefined') {
            this.panel = document.getElementById('rl-panel');
            if (!this.panel) {
                this.panel = document.createElement('div');
                this.panel.id = 'rl-panel';
                this.panel.className = 'ui-frame';
                Object.assign(this.panel.style, {
                    bottom: '20px',
                    right: '20px',
                    width: '400px',
                    height: '150px',
                    position: 'fixed',
                    zIndex: 100,
                    padding: '10px'
                });
                document.body.appendChild(this.panel);
            }
            this.panel.innerHTML = '<div class="log-title">-- TensorFlow Stats --</div><div id="rl-content"></div>';
            this.content = this.panel.querySelector('#rl-content');
            this.render();
        }
        if (this.eventManager) {
            this.eventManager.subscribe('battle_round_start', (data) => this.onRoundStart(data));
            this.eventManager.subscribe('battle_round_complete', (data) => this.onRoundComplete(data));
        }
    }

    buildFeatures(playerInfo, enemyInfo) {
        const allyCount = playerInfo.length;
        const enemyCount = enemyInfo.length;
        return [allyCount, enemyCount, allyCount - enemyCount];
    }

    async onRoundStart({ playerInfo, enemyInfo }) {
        const features = this.buildFeatures(playerInfo, enemyInfo);
        const res = await this.rlManager.requestPrediction(features);
        if (Array.isArray(res) && res.length >= 2) {
            this.prediction = res[0] > res[1] ? FACTIONS.PLAYER : FACTIONS.ENEMY;
        } else {
            this.prediction = Math.random() < 0.5 ? FACTIONS.PLAYER : FACTIONS.ENEMY;
        }
        this.render();
    }

    async onRoundComplete(report) {
        if (!this.prediction) return;
        this.stats.total++;
        if (report.winner === this.prediction) {
            this.stats.correct++;
            this.stats.score += 50;
        } else {
            this.stats.score -= 30;
        }
        const accuracy = this.stats.correct / this.stats.total;
        memoryDB.addEvent({ type: 'rl_accuracy', accuracy, timestamp: new Date().toISOString() });
        this.prediction = null;
        this.render();
    }

    render() {
        if (!this.content) return;
        const acc = this.stats.total ? ((this.stats.correct / this.stats.total) * 100).toFixed(1) : '0';
        const pred = this.prediction ? (this.prediction === FACTIONS.ENEMY ? 'ENEMY' : this.prediction) : '-';
        this.content.innerHTML =
            `<div>예측 승자: ${pred}</div>` +
            `<div>적중률: ${acc}%</div>` +
            `<div>잘했어요 점수: ${this.stats.score}</div>`;
    }
}

export default RLObserver;
