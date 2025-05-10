function formatMemory(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function measureMemory(fn) {
  global.gc(); // Force garbage collection (requires node to be run with --expose-gc)
  const start = process.memoryUsage().heapUsed;
  fn();
  global.gc();
  const end = process.memoryUsage().heapUsed;
  return end - start;
}

function createNumberArray(size) {
  const arr = [];
  for (let i = 0; i < size; i++) {
    arr.push(i);
  }
  return arr;
}

function createCharStringArray(size) {
  const arr = [];
  for (let i = 0; i < size; i++) {
    arr.push('a'); // All elements are 1-character strings
  }
  return arr;
}

const SIZE = 1_000_000;

console.log('Measuring memory for number array...');
const numberMem = measureMemory(() => createNumberArray(SIZE));
console.log(`Number array: ${formatMemory(numberMem)}`);

console.log('Measuring memory for character string array...');
const stringMem = measureMemory(() => createCharStringArray(SIZE));
console.log(`String array: ${formatMemory(stringMem)}`);

