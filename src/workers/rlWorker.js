importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');

let tf = self.tf;
let model = null;
let dataset = [];

async function initModel(featLength = 3) {
    if (!tf) {
        return;
    }
    model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, inputShape: [featLength], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
}

async function handleMessage(e) {
    const { type, data, id } = e.data;
    switch (type) {
        case 'init':
            await initModel(data && data.featLength);
            dataset = [];
            break;
        case 'record':
            dataset.push(data);
            break;
        case 'predict':
            if (model && tf) {
                const t = tf.tensor2d([data], [1, data.length]);
                const out = model.predict(t);
                const arr = await out.data();
                t.dispose();
                out.dispose();
                postMessage({ type: 'prediction', id, prediction: Array.from(arr) });
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
