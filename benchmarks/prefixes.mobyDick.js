import fs from "fs/promises"
import path from "path"
import {fileURLToPath} from 'url'
import process from "node:process"
import os from "os"
import {ART} from "../art.js"
import Latin1 from "../collations/Latin1/Latin1.js"

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
  const deduped = new ART()
  const prefixSet = new Set()
  for(let i=0;i<words.length;i++){
    const lword = Latin1.getL2SortKey(words[i])
    if(words[i].length < 6) continue
    if(!(prefixSet.has(words[i].slice(0,6).toLocaleLowerCase("en-US")))) prefixSet.add(words[i].slice(0,6).toLocaleLowerCase("en-US"))
    deduped.insert(lword)
  }
  const pm = new Map()
  for(let p of prefixSet) pm.set(p, [...Latin1.getL2SortKey(p)].slice(0,6))
  console.log(JSON.stringify([...pm.entries()]))
  await fs.writeFile(path.join(__dirname,"prefixes.mobyDick.json"), JSON.stringify([...pm.entries()]), {encoding: "utf8"})
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
