function standardDeviation(arr, avg) {
  return Math.sqrt(
    arr.reduce(
      (a, b) => a + Math.pow(
        b - avg, 2
      ), 0) / arr.length,
  );
}

function percentile(sortedArr, perc) {
  const rank = perc * (sortedArr.length + 1);
  const frac = rank % 1;
  if (frac === 0) {
    return sortedArr[rank - 1];
  } else {
    const diff = sortedArr[Math.floor(rank)] - sortedArr[Math.floor(rank) - 1];
    const interpolated = (frac * diff) + sortedArr[Math.floor(rank) - 1];
    return interpolated;
  }
}

const expectation = (
  () => {
    const results = new Map()
    return (debug = false) => {
      return [
        (
          actual, 
          expected, 
          label = crypto.randomUUUID()
        ) => {
          if(!results.has(label)){
            results.set(label, {
              successes: 0,
              failures: 0
            })
          }
          if (actual !== expected) {
            results.get(label).failures++
            if(debug) console.error(
              `${
                label
              } failed: ${
                actual
              } !== ${
                expected
              }`
            )
            return false;
          } else {
            results.get(label).successes++
            return true;
          }
        },
        (onlyFails = false) => {
          [...results.entries()].forEach(
            ([l, s]) => {
              if(!onlyFails || s.failures) console.log(
                `failures: ${
                  s.failures
                }, successes: ${
                  s.successes
                }, label: ${
                  l
                }`
              )
            }
          )
        }
      ]
    }
  }
)()

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
}

export {
  shuffleArray,
  expectation,
  percentile,
  standardDeviation
}