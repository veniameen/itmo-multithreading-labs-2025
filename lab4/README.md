# Лабораторная работа 4 — Параллельная обработка изображений (Node.js)

<video width="100%" controls>
  <source src="./lab4.mp4" type="video/mp4">
  Ваш браузер не поддерживает видео тег.
</video>

Цель: превратить "белое" изображение (RGB=255,255,255) в "шахматное" (черный/белый пиксель по (row+col)%2),
сначала **в одном потоке**, затем **параллельно** (Worker Threads) и сравнить время.

## Представление изображения
Храним изображение как линейный массив `RGB`:
- на каждый пиксель 3 байта: `R,G,B`
- индекс пикселя `(row, col)` в массиве: `base = (row * width + col) * 3`

## Код `lab4.js`

```js
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const os = require("os");

const width = 2000;
const height = 2000;
const workersCount = Math.min(os.cpus().length, height);

const pixelBytes = 3;
const totalBytes = width * height * pixelBytes;

function nowNs() {
  return process.hrtime.bigint();
}
function toMs(ns) {
  return Number(ns) / 1e6;
}

if (!isMainThread) {
  const { sharedBuffer, width, startRow, endRow } = workerData;
  const image = new Uint8Array(sharedBuffer);

  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < width; col++) {
      const value = (row + col) % 2 === 0 ? 0 : 255;
      const base = (row * width + col) * 3;
      image[base] = value;
      image[base + 1] = value;
      image[base + 2] = value;
    }
  }

  parentPort.postMessage("done");
  return;
}

function makeWhiteImage() {
  const image = new Uint8Array(totalBytes);
  image.fill(255);
  return image;
}

function fillCheckerboardSingleThread(image) {
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = (row + col) % 2 === 0 ? 0 : 255;
      const base = (row * width + col) * 3;
      image[base] = value;
      image[base + 1] = value;
      image[base + 2] = value;
    }
  }
}

async function fillCheckerboardParallel(sharedBuffer) {
  const rowsPerWorker = Math.ceil(height / workersCount);
  const workerPromises = [];

  for (let workerIndex = 0; workerIndex < workersCount; workerIndex++) {
    const startRow = workerIndex * rowsPerWorker;
    const endRow = Math.min(height, startRow + rowsPerWorker);
    if (startRow >= height) break;

    workerPromises.push(
      new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { sharedBuffer, width, startRow, endRow },
        });
        worker.on("message", resolve);
        worker.on("error", reject);
      })
    );
  }

  await Promise.all(workerPromises);
}

// --- 1) Single-thread timing ---
const singleThreadImage = makeWhiteImage();
let t1 = nowNs();
fillCheckerboardSingleThread(singleThreadImage);
let t2 = nowNs();
const singleMs = toMs(t2 - t1);

// --- 2) Parallel timing (SharedArrayBuffer) ---
const sharedBuffer = new SharedArrayBuffer(totalBytes);
const parallelImage = new Uint8Array(sharedBuffer);
parallelImage.fill(255);

t1 = nowNs();
fillCheckerboardParallel(sharedBuffer).then(() => {
  t2 = nowNs();
  const parallelMs = toMs(t2 - t1);

  console.log(`Image: ${width}x${height}, workers: ${workersCount}`);
  console.log(`Single-thread: ${singleMs.toFixed(2)} ms`);
  console.log(`Parallel     : ${parallelMs.toFixed(2)} ms`);
  console.log(`Speedup      : ${(singleMs / parallelMs).toFixed(2)}x`);
});
```

## Запуск

```bash
node lab4.js
```