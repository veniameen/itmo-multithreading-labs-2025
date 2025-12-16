# Лабораторная работа 2 — Конкурентность и паттерны

## Задача 1 — Race condition

📹 [Видео: lab2_task1_race.mp4](./lab2_task1_race.mp4)

Идея: несколько потоков увеличивают **общий счётчик** в `SharedArrayBuffer`, но делают это **не атомарно**
(`x = x + 1`), из-за чего часть инкрементов теряется.

### `task1_race.js`
```js
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
```

---

## Задача 2 — Deadlock

📹 [Видео: lab2_task2_deadlock.mp4](./lab2_task2_deadlock.mp4)

Идея: два потока берут “замки” в разном порядке:

* Поток A: lock1 → lock2
* Поток B: lock2 → lock1
  В итоге каждый держит один замок и бесконечно ждёт второй.

### `task2_deadlock.js`

```js
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
```
---

## Задача 3 — Worker Pool

📹 [Видео: lab2_task3_worker_pool.mp4](./lab2_task3_worker_pool.mp4)

Идея: есть очередь задач. Несколько воркеров берут задачи по мере освобождения.
“Первый свободный” = тот, кто прислал сообщение `ready`.

### `task3_worker_pool.js`

```js
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
```

Запуск:

```bash
node task3_worker_pool.js
```

---

## Задача 4 — Конвейер (Pipeline)

📹 [Видео: lab2_task4_pipeline.mp4](./lab2_task4_pipeline.mp4)

Идея: одна задача проходит **последовательно** 3 стадии, но каждая стадия — отдельный поток:
Stage1 → Stage2 → Stage3.

### `task4_pipeline.js`

```js
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
```
---

## Задача 5 — Fan-in / Fan-out

📹 [Видео: lab2_task5_fanin_fanout.mp4](./lab2_task5_fanin_fanout.mp4)

Идея: делим задачу на независимые куски (fan-out), считаем параллельно, затем объединяем (fan-in).
Пример: сумма чисел от 0 до 100, разбиваем на несколько диапазонов.

### `task5_fanin_fanout.js`

```js
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
```
---

## Итог

В лабораторной реализованы:

* Race condition на общем счётчике без атомарных операций.
* Deadlock на двух “замках” при разном порядке захвата.
* Worker Pool с очередью задач и набором воркеров.
* Pipeline (конвейер) с последовательными стадиями в отдельных потоках.
* Fan-in/Fan-out для параллельной обработки и последующего объединения результата.