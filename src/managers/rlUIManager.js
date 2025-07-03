export class RLUIManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.panel = document.getElementById('rl-panel');
        if (!this.panel) return;
        this.accuracyEl = document.createElement('div');
        this.scoreEl = document.createElement('div');
        this.historyEl = document.createElement('div');
        this.panel.appendChild(this.accuracyEl);
        this.panel.appendChild(this.scoreEl);
        this.panel.appendChild(this.historyEl);

        if (this.eventManager) {
            this.eventManager.subscribe('rl_prediction_result', (data) => this.update(data));
            this.eventManager.subscribe('rl_prediction_made', (data) => this.showPrediction(data));
        }
    }

    showPrediction({ round, prediction }) {
        if (!this.panel) return;
        const div = document.createElement('div');
        div.textContent = `라운드 ${round} 예측: ${prediction}`;
        this.historyEl.prepend(div);
    }

    update({ round, prediction, actual, correct, accuracy, score, bestName, worstName }) {
        if (!this.panel) return;
        this.accuracyEl.textContent = `적중률: ${accuracy.toFixed(1)}%`;
        this.scoreEl.textContent = `잘했어요 점수: ${score}`;
        const div = document.createElement('div');
        let text = `라운드 ${round} 결과: ${prediction}→${actual} ${correct ? '✅' : '❌'}`;
        if (bestName) text += ` | ⭐ ${bestName}`;
        if (worstName) text += ` | 😞 ${worstName}`;
        div.textContent = text;
        this.historyEl.prepend(div);
    }
}
