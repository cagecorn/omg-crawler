// src/managers/dataRecorder.js

import { AI_ACTIONS } from "../data/ai-actions.js";

// Node 환경에서는 fs 모듈을 사용해 바로 파일로 기록할 수 있다.
let nodeFS = null;
if (typeof window === 'undefined') {
    try {
        nodeFS = await import('fs');
    } catch (e) {
        nodeFS = null;
    }
}

class DataRecorder {
    constructor(game, filePath = 'training_data.jsonl', format = 'json') {
        this.game = game;
        this.eventManager = game.eventManager;
        this.filePath = filePath;
        this.format = format;
        this.data = [];
        this.isRecording = true;
        this.fs = null;
    }

    async init() {
        // Node 환경이면 fs 모듈을 초기화하고 파일을 새로 만든다.
        if (nodeFS) {
            this.fs = nodeFS;
            this.fs.writeFileSync(this.filePath, '', { flag: 'w' });
        }

        // 플레이어가 행동할 때마다 기록
        this.eventManager.subscribe('player_action_recorded', ({ entity, action }) => {
            if (this.isRecording) {
                this.record(entity, action);
            }
        });

        console.log('[DataRecorder] Now recording player actions for AI training.');
    }

    record(entity, action) {
        const inputTensor = this.game.metaAIManager.mbtiEngine.buildInput(entity, action, this.game);
        const input = inputTensor.arraySync()[0];

        const output = Array(AI_ACTIONS.length).fill(0);
        let actionName = action.type.toUpperCase();
        if (action.type === 'pickup') {
            actionName = action.item.type === 'weapon' ? 'PICKUP_WEAPON' : 'PICKUP_CONSUMABLE';
        }

        const actionIndex = AI_ACTIONS.indexOf(actionName);
        if (actionIndex > -1) {
            output[actionIndex] = 1;
            const record = { input, output };
            this.data.push(record);

            if (this.fs) {
                const line = this.format === 'csv'
                    ? [...input, ...output].join(',')
                    : JSON.stringify(record);
                this.fs.appendFileSync(this.filePath, line + '\n');
            }

            console.log(`[DataRecorder] Recorded action: ${actionName}`, record);
        } else {
            console.warn(`[DataRecorder] Unknown action type for recording: ${action.type}`);
        }
    }

    downloadData() {
        if (this.data.length === 0) {
            console.warn('[DataRecorder] No data to download.');
            return;
        }

        const dataStr = JSON.stringify(this.data, null, 2);

        // Node 환경에서는 지정된 파일 경로로 저장한다.
        if (this.fs) {
            this.fs.writeFileSync(this.filePath, dataStr);
            console.log(`[DataRecorder] Data saved to ${this.filePath}.`);
            return;
        }

        // 브라우저 환경이라면 다운로드 링크를 생성한다.
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'training_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`[DataRecorder] Downloaded ${this.data.length} records.`);
    }
}

export default DataRecorder;
