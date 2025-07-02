// src/managers/rlObserver.js
// Observes battle rounds to track TensorFlow predictions and accuracy.
import { RLManager } from './rlManager.js';
import { memoryDB } from '../persistence/MemoryDB.js';
import { FACTIONS } from '../constants/factions.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../constants/mapDimensions.js';
import BattlePredictionManager from './battlePredictionManager.js';
import BattleMemoryManager from './battleMemoryManager.js';

export class RLObserver {
    constructor(eventManager, mapManager) {
        this.eventManager = eventManager;
        this.mapManager = mapManager;
        this.rlManager = new RLManager(eventManager);
        this.predictionManager = new BattlePredictionManager(this.rlManager);
        this.memoryManager = new BattleMemoryManager(this.rlManager);
        this.stats = { total: 0, correct: 0, score: 0 };
        this.prediction = null;
        this.roundFeatures = null;
        this.currentRound = 0;
        this.panel = null;
        this.content = null;
        this.predictionPromise = null;
        this.roundCompletePromise = null;
        // grid based feature configuration
        this.GRID_WIDTH = 8;
        this.GRID_HEIGHT = 6;
        this.FEATURE_LENGTH = this.GRID_WIDTH * this.GRID_HEIGHT;
    }

    async init() {
        await this.predictionManager.init(3);
        this.mapWidth = this.mapManager
            ? this.mapManager.width * this.mapManager.tileSize
            : MAP_WIDTH;
        this.mapHeight = this.mapManager
            ? this.mapManager.height * this.mapManager.tileSize
            : MAP_HEIGHT;
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
        return this.predictionManager.buildFeatures(playerInfo, enemyInfo);
    }

    onRoundStart({ round, playerInfo, enemyInfo }) {
        this.currentRound = round || 0;
        this.predictionPromise = this.predictionManager
            .predict(playerInfo, enemyInfo)
            .then(({ prediction, features }) => {
                this.prediction = prediction || (Math.random() < 0.5 ? FACTIONS.PLAYER : FACTIONS.ENEMY);
                this.roundFeatures = features;
            })
            .catch(() => {
                this.prediction = Math.random() < 0.5 ? FACTIONS.PLAYER : FACTIONS.ENEMY;
                this.roundFeatures = null;
            })
            .finally(() => {
                if (this.eventManager) {
                    this.eventManager.publish('rl_prediction_made', {
                        round: this.currentRound,
                        prediction: this.prediction,
                    });
                }
                this.render();
            });
    }

    onRoundComplete(report) {
        this.roundCompletePromise = (async () => {
            if (this.predictionPromise) {
                await this.predictionPromise;
            }
            if (!this.prediction) return;
            this.stats.total++;
            const correct = report.winner === this.prediction;
            if (correct) {
                this.stats.correct++;
                this.stats.score += 50;
            } else {
                this.stats.score -= 30;
            }
            if (report.playerUnits && report.enemyUnits && this.roundFeatures) {
                this.memoryManager.record({ features: this.roundFeatures, winner: report.winner });
            }
            const accuracy = this.stats.correct / this.stats.total;
            memoryDB.addEvent({ type: 'rl_accuracy', accuracy, timestamp: new Date().toISOString() });
            if (this.eventManager) {
                this.eventManager.publish('rl_prediction_result', {
                    round: this.currentRound,
                    prediction: this.prediction,
                    actual: report.winner,
                    correct,
                    accuracy: accuracy * 100,
                    score: this.stats.score,
                });
            }
            this.prediction = null;
            this.roundFeatures = null;
            this.render();
        })();
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
