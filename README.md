# itmo-multithreading-labs-2025

## Структура репозитория
- `lab1/`
  - `scheduler.js` — ЛР1: простой шедулер, задачи/процессы и переключение по таймеру/рандому
  - `README.md` — описание ЛР1
- `lab2/`
  - `task1_race.js` — race condition
  - `task2_deadlock.js` — deadlock
  - `task3_worker_pool.js` — worker pool (очередь задач + пул воркеров)
  - `task4_pipeline.js` — конвейер (pipeline) по стадиям
  - `task5_fanin_fanout.js` — fan-in / fan-out (параллельное вычисление + объединение)
  - `README.md` — описание ЛР2
- `lab3/`
  - `scheduler_2.js` — ЛР3: шедулер с несколькими очередями приоритетов, квантами, понижением и boost + динамическое добавление задач
  - `README.md` — описание ЛР3
- `lab4/`
  - `lab4.js` — ЛР4: "шахматная" обработка изображения: single-thread vs parallel (worker_threads) + сравнение времени
  - `README.md` — описание ЛР4
- `report/`
  - `report.md` — доклад: многопоточность и конкурентность в JavaScript (Node.js)
  - `Доклад.mp4` — видео доклада
  - `Доклад.pptx` — презентация доклада