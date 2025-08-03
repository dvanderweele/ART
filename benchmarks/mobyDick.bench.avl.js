import fs from "fs/promises"
import path from "path"
import {fileURLToPath} from 'url'
import process from "node:process"
import os from "os"
import {AVL} from "../avl.js"

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

const mobydick_file = path.join(__dirname,"mobydick.stripped.txt")

;(async ()=>{
  const mobydick_raw = await fs.readFile(
    mobydick_file,
    {encoding: "utf8"}
  )
  const wordPattern = /(?:[\s"\/_—,.!;:*&()”“?]+)?([^\s"\/_—,.!;:*&()”“?]+)/g
  const words = [...mobydick_raw.matchAll(wordPattern)].map(w=>w[1])
  const deduped = new AVL()
  gc()
  const memoryBaseline = process.memoryUsage()
  performance.mark("start")
  for(let i=0;i<words.length;i++){
    const lword = words[i].toLocaleLowerCase("en-US")
    deduped.insert(lword)
  }
  performance.mark("end")
  const memoryUsed = process.memoryUsage()
  performance.mark("start2")
  deduped[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
  deduped.ITER_LB = "\x00"
  deduped.ITER_UB = "\uFFFF"
  for(let w of deduped){}
  performance.mark("end2")
  // iterate all words for each 6-letter prefix in the dataset
  const prefixes = JSON.parse(await fs.readFile(path.join(__dirname,"prefixes.mobyDick.json"),{encoding:"utf8"}))
  performance.mark("prefix.iter.before")
  for(let prefix of prefixes){
    const ps = prefix[0]
    deduped.ITER_LB = ps
    deduped.ITER_UB = ps + "\uFFFF"
    for(let w of deduped){}
  }
  performance.mark("prefix.iter.after")
  const result = {
    "testType": "JS AVL Tree",
    "ts": (new Date()).toISOString(),
    "osType": os.type(),
    "osPlatform": os.platform(),
    "osArch": os.arch(),
    "osAvailableParallelism": os.availableParallelism(),
    "nodeVersion": process.version,
    "wordCount": words.length,
    "distinctWordCount": deduped.size,
    "dedupeDurationMS": performance.measure("x","start","end").duration,
    "fastestIterationDurationMS": performance.measure("y","start2","end2").duration,
    "orderedIterationDurationMS": performance.measure("z","start2","end2").duration,
    "iterateAll6CharPrefixes": performance.measure("pxiter","prefix.iter.before","prefix.iter.after").duration,
    "baselineMemoryRSS": memoryBaseline.rss,
    "baselineMemoryHeapTotal": memoryBaseline.heapTotal,
    "baselineMemoryHeapUsed": memoryUsed.heapUsed,
    "testMemoryRSS": memoryUsed.rss,
    "testMemoryHeapTotal": memoryUsed.heapTotal,
    "testMemoryHeapUsed": memoryUsed.heapUsed,
    "deltaMemoryRSS": memoryUsed.rss-memoryBaseline.rss,
    "deltaMemoryHeapTotal": memoryUsed.heapTotal-memoryBaseline.heapTotal,
    "deltaMemoryHeapUsed": memoryUsed.heapUsed-memoryBaseline.heapUsed
  }
  console.log(result)
  //await fs.writeFile(path.join(__dirname,"mobyDickResults",`avl.result.${Date.now()}.json`),JSON.stringify(result),{encoding:"utf8"})
  /**
   * - Parse words list
   * - Take memory baseline
   * - Time insertions of all words into designated DS
   * - Record Memory Usage
   * - Time fullFwdRangeV of all words
   * - Record word count vs deduped word count
   * - Write stats into designated folder
   */
  /*
node --expose-gc
> process.memoryUsage();  // Initial usage
{ rss: 19853312, heapTotal: 9751808, heapUsed: 4535648 }
> gc();                   // Force a GC for the baseline.
undefined
> process.memoryUsage();  // Baseline memory usage.
{ rss: 22269952, heapTotal: 11803648, heapUsed: 4530208 }
> var a = new Array(1e7); // Allocate memory for 10m items in an array
undefined
> process.memoryUsage();  // Memory after allocating so many items
{ rss: 102535168, heapTotal: 91823104, heapUsed: 85246576 }
> a = null;               // Allow the array to be garbage-collected
null
> gc();                   // Force GC (requires node --expose-gc)
undefined
> process.memoryUsage();  // Memory usage after GC
{ rss: 23293952, heapTotal: 11803648, heapUsed: 4528072 }
> process.memoryUsage();  // Memory usage after idling
{ rss: 23293952, heapTotal: 11803648, heapUsed: 4753376 }
   */
})()
