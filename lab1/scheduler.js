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
