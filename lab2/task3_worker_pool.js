const { Worker, isMainThread, parentPort } = require("worker_threads");

if (isMainThread) {
  const POOL = 3;

  const tasks = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    n: 3 + (i % 4),
  }));

  let done = 0;

  const workers = Array.from({ length: POOL }, () => new Worker(__filename));
  workers.forEach((w, idx) => {
    w.on("message", (msg) => {
      if (msg.type === "ready") {
        const task = tasks.shift();
        if (task) w.postMessage({ type: "task", task });
        else w.postMessage({ type: "stop" });
      }

      if (msg.type === "result") {
        console.log(`worker#${idx}: task#${msg.id} -> ${msg.result}`);
        done++;
        if (done === 10) workers.forEach(x => x.terminate());
      }
    });

    w.postMessage({ type: "ready" });
  });
} else {
  function heavy(n) {
    let x = 0;
    for (let i = 0; i < n * 1_000_000; i++) x = (x + i) % 1_000_000_007;
    return x;
  }

  parentPort.on("message", (msg) => {
    if (msg.type === "ready") parentPort.postMessage({ type: "ready" });

    if (msg.type === "task") {
      const { id, n } = msg.task;
      const result = heavy(n);
      parentPort.postMessage({ type: "result", id, result });
      parentPort.postMessage({ type: "ready" });
    }

    if (msg.type === "stop") process.exit(0);
  });
}