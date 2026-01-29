import fs from "fs/promises"
import path from "path"
import {fileURLToPath} from 'url'
import process from "node:process"
import os from "os"
import {ART} from "../art.js"
import Latin1 from "../collations/Latin1/Latin1.js"
import {RegexNFA} from "../../Rex256/RexNFA.js"

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

const mobydick_file = path.join(__dirname,"mobydick.stripped.txt")

;(async ()=>{
  const mobydick_raw = (await fs.readFile(
    mobydick_file,
    {encoding: "utf8"}
  )).replaceAll("’","'").replaceAll("‘","'").replaceAll("œ","oe")
  const wordPattern = /(?:[\s"\/_—,.!;:*&()”“?]+)?([^\s"\/_—,.!;:*&()”“?]+)/g
  const words = [...mobydick_raw.matchAll(wordPattern)].map(w=>w[1])
  const deduped = new ART() 
  for(let i=0;i<words.length;i++){
    const lword = Latin1.getL0SortKey(words[i].toLocaleLowerCase("en-US"))
    deduped.insert(lword)
  }
  performance.mark("pre-expression-compile")
  const rexpr = deduped.toRegex()
  performance.mark("post-expression-compile")
  performance.mark("pre-pattern-compile")
  const rexStr = rexpr.serialize()
  performance.mark("post-pattern-compile")
  await fs.writeFile(path.join(__dirname,"mobyDick.regex.txt"),deduped.toRegex().serialize(),{encoding:"utf8"})
  performance.mark("pre-RegExp-compile")
  //const rex = new RegExp("^"+rexStr+"$")
  const rex = new RegexNFA(rexStr)
  performance.mark("post-RegExp-compile")
  let matches = 0 
  let wc = 0
  const OOR = new Map()
  performance.mark("pre-regex-tests")
  for(let i=0;i<words.length;i++){
    const wrd = words[i].toLocaleLowerCase("en-US")
    for(let ch of wrd){
      const cp = ch.charCodeAt(0)
      if(cp>255){
        let e = OOR.get(cp)
        if(!e){
          e = new Set()
          OOR.set(cp, e)
        }
        e.add(wrd)
        break
      }
    }
    const sk = Latin1.getL0SortKey(wrd)
    const lword = String.fromCodePoint(...(sk.slice(0,sk.byteLength-1)))
    //console.log(i,"/",words.length, lword)
    wc++
    if(rex.test(lword)) matches++
  }
  performance.mark("post-regex-tests")
  console.log("matches:",matches,"words:",wc) 
  console.log("expression compile duration (ms)", performance.measure("expression compile duration (ms)","pre-expression-compile","post-expression-compile").duration)
  console.log("pattern compile duration (ms)", performance.measure("pattern compile duration (ms)","pre-pattern-compile","post-pattern-compile").duration)
  console.log("RegExp compile duration (ms)", performance.measure("RegExp compile duration (ms)","pre-RegExp-compile","post-RegExp-compile").duration)
  console.log("RegExp tests duration (ms)", performance.measure("RegExp tests duration (ms)","pre-regex-tests","post-regex-tests").duration)
  console.log("canary regex test failure, expect", false, "actual", rex.test("of course this isn't a word in moby dick!"))
  console.log("words with out of range code points",[...OOR.entries()].map(a=>`${a[0]} § ${[...a[1].values()].join(" ‡ ")}`).join(" ||| "))
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
