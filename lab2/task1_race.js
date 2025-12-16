const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

if (isMainThread) {
  const WORKERS = 4;
  const ITER = 200000;

  const sab = new SharedArrayBuffer(4);
  const counter = new Int32Array(sab);
  counter[0] = 0;

  let done = 0;

  for (let i = 0; i < WORKERS; i++) {
    const w = new Worker(__filename, { workerData: { sab, ITER } });
    w.on("message", () => {
      done++;
      if (done === WORKERS) {
        console.log("Expected:", WORKERS * ITER);
        console.log("Actual  :", counter[0]);
      }
    });
  }
} else {
  const counter = new Int32Array(workerData.sab);
  for (let i = 0; i < workerData.ITER; i++) {
    const x = counter[0];
    counter[0] = x + 1;
  }
  parentPort.postMessage("done");
}