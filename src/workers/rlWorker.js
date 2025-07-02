importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');

let tf = self.tf;
let model = null;
let dataset = []; // 학습 데이터를 저장할 배열
let featureLength = 6; // 기본 특성 길이

/**
 * AI 모델을 초기화합니다.
 */
async function initModel() {
    if (!tf) return;
    model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, inputShape: [featureLength], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 2, activation: 'softmax' })); // [아군 승리 확률, 적군 승리 확률]
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
    console.log(`RL-Worker: 모델이 ${featureLength}개의 특성으로 초기화되었습니다.`);
}

/**
 * 수집된 데이터셋으로 모델을 훈련시킵니다.
 */
async function trainModel() {
    if (!model || dataset.length === 0) {
        console.log("RL-Worker: 훈련할 데이터가 없거나 모델이 초기화되지 않았습니다.");
        return;
    }
    console.log(`RL-Worker: ${dataset.length}개의 샘플로 훈련을 시작합니다...`);

    // 데이터셋을 텐서(Tensor)로 변환
    const inputs = tf.tensor2d(dataset.map(d => d.input));
    const labels = tf.tensor2d(dataset.map(d => d.output));

    // 모델 훈련
    await model.fit(inputs, labels, {
        epochs: 20, // 훈련 횟수 (적절히 조절 가능)
        batchSize: 32,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`에포크 ${epoch + 1}: 손실 = ${logs.loss.toFixed(4)}, 정확도 = ${logs.acc.toFixed(4)}`);
            }
        }
    });

    // 메모리 정리
    inputs.dispose();
    labels.dispose();
    console.log("RL-Worker: 훈련 완료.");
}

/**
 * 메인 스레드로부터 메시지를 받아 처리합니다.
 */
async function handleMessage(e) {
    const { type, data, id } = e.data;

    switch (type) {
        case 'init':
            featureLength = e.data.featLength || 6;
            await initModel();
            dataset = [];
            break;
        case 'record':
            if (data && data.features && data.winner) {
                const input = data.features;
                const output = data.winner === 'player' ? [1, 0] : [0, 1];
                dataset.push({ input, output });

                if (dataset.length > 0 && dataset.length % 10 === 0) {
                   await trainModel();
                }
            }
            break;
        case 'predict':
            if (model && tf) {
                const inputTensor = tf.tensor2d([data], [1, featureLength]);
                const predictionTensor = model.predict(inputTensor);
                const prediction = await predictionTensor.data();

                inputTensor.dispose();
                predictionTensor.dispose();

                postMessage({ type: 'prediction', id, prediction: Array.from(prediction) });
            } else {
                postMessage({ type: 'prediction', id, prediction: null });
            }
            break;
        case 'save':
            postMessage({ type: 'dataset', dataset });
            break;
    }
}

self.onmessage = handleMessage;
