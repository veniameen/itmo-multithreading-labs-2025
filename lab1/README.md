# Лабораторная работа 1 — Шедулер, часть 1 (JavaScript)

## Цель работы
Реализовать простую модель управления процессами:
- создать структуру (класс) `Process`,
- обеспечить выдачу уникальных идентификаторов процессам,
- реализовать имитацию работы процесса,
- реализовать переключение между несколькими процессами (scheduler).

## Реализация

```js
class Process {
  constructor(id) { this.id = id; }
  worker() { console.log(`Hello! I am process ${this.id}`); }
}

let nextId = 1;
const createProcess = () => new Process(nextId++);

const processes = [createProcess(), createProcess(), createProcess()];

let i = 0;
let runs = 0;

const timer = setInterval(() => {
  processes[i].worker();
  i = Math.floor(Math.random() * processes.length);
  if (++runs === 12) clearInterval(timer);
}, 600);
```

### Класс Process
Класс хранит идентификатор процесса и содержит метод `worker()`, который имитирует работу процесса через вывод в консоль.

### Генерация уникальных ID
Используется простой счётчик `nextId`, который увеличивается при каждом создании процесса:
- первый процесс получает `id = 1`,
- второй — `id = 2`, и т.д.

Это соответствует требованию “не использовать встроенные библиотеки” для генерации идентификаторов.

### Планировщик (scheduler)
Планировщик запускает процесс каждые `600 мс` с помощью `setInterval`.

Выбор следующего процесса происходит случайно.

## Пример вывода
Hello! I am process 2
Hello! I am process 2
Hello! I am process 3
Hello! I am process 3
Hello! I am process 1
Hello! I am process 1
Hello! I am process 2