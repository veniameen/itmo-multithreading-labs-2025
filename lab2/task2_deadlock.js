const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

function lock(locks, i) {
  while (Atomics.compareExchange(locks, i, 0, 1) !== 0) {
    Atomics.wait(locks, i, 1, 50);
  }
}

if (isMainThread) {
  const sab = new SharedArrayBuffer(8);
  const locks = new Int32Array(sab);
  locks[0] = 0; locks[1] = 0;

  const a = new Worker(__filename, { workerData: { sab, first: 0, second: 1, name: "A" } });
  const b = new Worker(__filename, { workerData: { sab, first: 1, second: 0, name: "B" } });

  a.on("message", console.log);
  b.on("message", console.log);

  setTimeout(async () => {
    console.log("Deadlock detected -> terminate workers");
    await a.terminate();
    await b.terminate();
  }, 2000);
} else {
  const locks = new Int32Array(workerData.sab);

  parentPort.postMessage(`${workerData.name}: lock ${workerData.first}`);
  lock(locks, workerData.first);

  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);

  parentPort.postMessage(`${workerData.name}: lock ${workerData.second} (will deadlock)`);
  lock(locks, workerData.second);
}