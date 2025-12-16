# Лаба 3 — Шедулер, часть 2 (минимальный вариант)

## Код `lab3.js`

```js
const readline = require("readline");

const input = readline.createInterface({ input: process.stdin, output: process.stdout });

const QUEUES_COUNT = 3;          // количество очередей (0 — самый высокий приоритет)
const QUANTUM_STEPS = 5;         // квант: сколько шагов i выполнить за раз
const DEMOTE_AFTER_QUANTA = 3;   // после скольких квантов понижать приоритет
const SCHEDULER_TICK_MS = 300;   // период шедулера
const BOOST_INTERVAL_MS = 4000;  // период boost (все задачи -> top очередь)

let nextTaskId = 1;
const queues = Array.from({ length: QUEUES_COUNT }, () => []);

function addTask(maxSteps = 30, priority = 0) {
  const p = Math.max(0, Math.min(QUEUES_COUNT - 1, priority | 0));
  queues[p].push({
    id: nextTaskId++,
    maxSteps,
    counter: 0,
    priority: p,
    quantaUsedHere: 0,
  });
  console.log(`added task#${nextTaskId - 1} max=${maxSteps} priority=${p}`);
}

function runQuantum(task) {
  const end = Math.min(task.counter + QUANTUM_STEPS, task.maxSteps);
  for (; task.counter < end; task.counter++) {
    console.log(`I am task ${task.id}. My counter = ${task.counter}`);
  }
  return task.counter >= task.maxSteps;
}

function schedulerTick() {
  const currentPriority = queues.findIndex((q) => q.length > 0);
  if (currentPriority < 0) return;

  let tasksInThisQueue = queues[currentPriority].length;

  while (tasksInThisQueue--) {
    const task = queues[currentPriority].shift();

    if (runQuantum(task)) {
      console.log(`task ${task.id} finished`);
      continue;
    }

    task.quantaUsedHere++;

    const shouldDemote =
      task.quantaUsedHere >= DEMOTE_AFTER_QUANTA && currentPriority < QUEUES_COUNT - 1;

    const nextPriority = shouldDemote ? (task.quantaUsedHere = 0, currentPriority + 1) : currentPriority;

    task.priority = nextPriority;
    queues[nextPriority].push(task);
  }
}

function boostAllToTop() {
  let moved = false;

  for (let priority = 1; priority < QUEUES_COUNT; priority++) {
    while (queues[priority].length) {
      const task = queues[priority].shift();
      task.priority = 0;
      task.quantaUsedHere = 0;
      queues[0].push(task);
      moved = true;
    }
  }

  if (moved) console.log("BOOST: all tasks -> Q0");
}

// демо-задачи
addTask(25, 0);
addTask(40, 1);
addTask(30, 0);

const schedulerTimer = setInterval(schedulerTick, SCHEDULER_TICK_MS);
const boostTimer = setInterval(boostAllToTop, BOOST_INTERVAL_MS);

console.log('commands: add <maxSteps> <priority> | show | exit');

input.on("line", (line) => {
  const [command, a, b] = line.trim().split(/\s+/);

  if (command === "add") addTask(Number(a) || 30, Number(b) || 0);
  else if (command === "show")
    console.log(queues.map((q, i) => `Q${i}=${q.length}`).join("  "));
  else if (command === "exit") {
    clearInterval(schedulerTimer);
    clearInterval(boostTimer);
    input.close();
  }
});
````

## Запуск

```bash
node scheduler_2.js
```

## Динамическое добавление задач (во время работы)

* `add 100 0` — задача на 100 шагов в очередь максимального приоритета
* `add 200 2` — задача на 200 шагов в низкий приоритет
* `show` — размеры очередей
* `exit` — выход

## Что реализовано по требованиям

* Несколько очередей (Q) и приоритеты (0 — самый высокий)
* Квант (QUANT) — сколько шагов `i` выполняется за раз
* Понижение после DEMOTE квантов в очереди
* Переход к следующей очереди: всегда берём первую непустую сверху
* Periodic boost: раз в BOOST все задачи возвращаются в Q0
* Состояние задачи: `i` сохраняется между квантами и продолжается с места остановки