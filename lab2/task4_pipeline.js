const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

if (isMainThread) {
  const inputs = ["5", "10", "7"]; // "задачи"
  let ptr = 0;

  const s1 = new Worker(__filename, { workerData: { stage: 1 } });
  const s2 = new Worker(__filename, { workerData: { stage: 2 } });
  const s3 = new Worker(__filename, { workerData: { stage: 3 } });

  s1.on("message", (m) => s2.postMessage(m));
  s2.on("message", (m) => s3.postMessage(m));

  s3.on("message", (m) => {
    console.log(`final for #${m.id}:`, m.data);
    ptr++;
    if (ptr < inputs.length) {
      s1.postMessage({ id: ptr + 1, data: inputs[ptr] });
    } else {
      s1.terminate(); s2.terminate(); s3.terminate();
    }
  });

  // стартуем первую задачу
  s1.postMessage({ id: 1, data: inputs[0] });
} else {
  const stage = workerData.stage;

  parentPort.on("message", ({ id, data }) => {
    if (stage === 1) {
      // подзадача1: строка -> число, *2
      parentPort.postMessage({ id, data: Number(data) * 2 });
    }
    if (stage === 2) {
      // подзадача2: квадрат
      parentPort.postMessage({ id, data: data * data });
    }
    if (stage === 3) {
      // подзадача3: финальная упаковка
      parentPort.postMessage({ id, data: `Result = ${data}` });
    }
  });
}