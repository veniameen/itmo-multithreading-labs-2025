const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

if (isMainThread) {
  const N = 10;
  const FROM = 0, TO = 100;

  const step = Math.ceil((TO - FROM + 1) / N);
  let got = 0;
  let total = 0;

  for (let i = 0; i < N; i++) {
    const a = FROM + i * step;
    const b = Math.min(TO, a + step - 1);
    if (a > TO) break;

    const w = new Worker(__filename, { workerData: { a, b } });
    w.on("message", (partial) => {
      total += partial;
      got++;
      w.terminate();

      if (got === Math.ceil((TO - FROM + 1) / step)) {
        console.log(`Sum ${FROM}..${TO} =`, total);
      }
    });
  }
} else {
  const { a, b } = workerData;
  let s = 0;
  for (let x = a; x <= b; x++) s += x;
  parentPort.postMessage(s);
}