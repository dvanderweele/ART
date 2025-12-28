import fs from "fs/promises"
import path from "path"
import {fileURLToPath} from 'url'
import process from "node:process"
import os from "os"
import {ART,ByteStack,CapturingGroup,NonCapturingGroup} from "../art.js"
import Latin1 from "../collations/Latin1/Latin1.js"

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
  // Depth-First Traversal of Intermediate Result
  const prefix = new ByteStack()
  class BranchSequence{
    prefix
    tails
    idx
    limit
    constructor(prefix, tails){
      this.prefix = prefix
      this.tails = tails.reduce(
        BranchSequence.interpret,
        []
      )
      this.idx = 0
      this.limit = this.tails.length
    }
    next(){
      if(this.idx < this.limit){
        const i = this.idx
        this.idx++
        return {
          done: false,
          value: this.tails[i]
        }
      }else{
        return {
          done: true
        }
      }
    }
    static interpret(acc,cur,idx,arr){
      if(idx < arr.length-1){
        if(cur instanceof ByteStack){
          const nxt= arr[idx+1]
          if(nxt instanceof ByteStack){
            acc.push(cur)
          }else{
            acc.push(new BranchSequence(
              cur, nxt
            ))
          }
        }
      }else{
        if(cur instanceof ByteStack) acc.push(cur)
      }
      return acc
    }
  }
  const stack = [
    new BranchSequence(
      {size:0},
      rexpr.result
    )
  ]
  const headerParts = ["---","title: Non-Deterministic Finite Automaton","---","stateDiagram-v2"]
  const stateDefs = new Set()
  const transitions = []
  const buildRule = (p,n,t) => {
    const dv = p.pull()
    const prefix = p.size == 0 ? "[*]" : [...(new Uint8Array(dv.buffer))].map(b=>(b).toString(16).padStart(2,"0")).join("")
    const dst = t ? "[*]" : (n).toString(16).padStart(2,"0")
    const rule = `${prefix}${prefix == "[*]" ? "" : ' : " "'} --> ${p.size > 0 ? prefix : ""}${dst} : ${dst == "[*]" ? "ε" : String.fromCharCode(n)}`
    console.log(rule)
    return rule
  }
  const limit = 300
  let i = 0
  while(stack.length > 0){
    const tail = stack[stack.length-1]
    const next = tail.next()
    if(next.done){
      const prefixSize = tail.prefix.size
      for(let _ = 0; _ < prefixSize; _++) prefix.pop()
      stack.pop()
    } else {
      const nextVal = next.value
      if(nextVal instanceof ByteStack){
        let prefixStr = [...(new Uint8Array(prefix.pull().buffer))].map(b=>(b).toString(16).padStart(2,"0")).join("") 
        let lastPrefix = null
        for(let ch of nextVal){
          const nxtPfx = prefixStr + (ch).toString(16).padStart(2,"0")
          const srcId = prefixStr == "" ? "[*]" : "x" + prefixStr
          const dstId = nxtPfx
          const rule = `    ${srcId} --> x${dstId}: ${String.fromCharCode(ch)}`
          lastPrefix = dstId
          prefixStr = nxtPfx
          if(srcId != "[*]") stateDefs.add("    " + srcId + ': " "')
          transitions.push(rule)
        }
        stateDefs.add(`    x${lastPrefix}: " "`)
        transitions.push(`    x${lastPrefix} --> [*]: ε`)
      }else{
        // BranchSequence 
        const nextVal = next.value
        let prefixStr = [...(new Uint8Array(prefix.pull().buffer))].map(b=>(b).toString(16).padStart(2,"0")).join("") 
        let lastPrefix = null
        //console.log(121,nextVal)
        //console.log(nextVal.constructor.name)
        if(nextVal.prefix.size > 0){
          for(let ch of nextVal.prefix){
            prefix.push(ch)
            const nxtPfx = prefixStr + (ch).toString(16).padStart(2,"0")
            const srcId = prefixStr == "" ? "[*]" : "x"+prefixStr
            const dstId = nxtPfx
            const rule = `    ${srcId} --> x${dstId}: ${String.fromCharCode(ch)}`
            lastPrefix = dstId
            prefixStr = nxtPfx
            if(srcId != "[*]") stateDefs.add("    "+srcId + ': " "')
            transitions.push(rule)
          }
        }
        stateDefs.add(`    x${lastPrefix}: " "`)
        if(nextVal.tails.optional) tokens.push(`    x${lastPrefix} --> [*]: ε`)
        stack.push(nextVal)
      }
    }
      /**
       * ABC
       *      (
       *          DEF
       *          GHI
       *                (
       *                    JKL
       *                    MNO
       *                )
       *          PQR
       *      )
       */
  }
  //console.log(tokens.join("\n"))
  await fs.writeFile(path.join(__dirname,"mobyDick.mmd"),[...headerParts, ...stateDefs, ...transitions].join("\n"),{encoding:"utf8"})
  
  /**
   OLD
  do {
    const tail = stack[stack.length-1]
    const next = tail.next()
    if(i++ > limit) break
    console.log("prefixlen",prefix.size,"stacklen",stack.length,stack.map(e=>e.constructor.name).join("|"))
    if(next.done && lastGrp){
      stack.pop()
      if(next.popchar) prefix.pop()
    } else {
      let nextVal = next.value
      if(
        nextVal instanceof ByteStack
      ){
        for(let kb of nextVal){
          console.log("\t"+String.fromCharCode(kb))
          stack.push({
            next(){
              return {
                done: true,
                popchar: true
              }
            }
          })
          tokens.push(buildRule(prefix,kb,false))
          prefix.push(kb)
        }
        lastGrp = false
      }else{
        // group
        if(nextVal?.optional&&prefix.size>0) tokens.push(buildRule(prefix,-1,true))
        stack.push(nextVal[Symbol.iterator]())
        lastGrp = true
      }
    }
  } while(stack.length > 0 && tokens.length < 300)
  */
  /*
  performance.mark("pre-pattern-compile")
  const rexStr = rexpr.serialize()
  performance.mark("post-pattern-compile")
  await fs.writeFile(path.join(__dirname,"mobyDick.regex.txt"),deduped.toRegex().serialize(),{encoding:"utf8"})
  performance.mark("pre-RegExp-compile")
  const rex = new RegExp("^"+rexStr+"$")
  performance.mark("post-RegExp-compile")
  let matches = 0 
  let wc = 0
  const OOR = new Map()
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
    console.log(i,"/",words.length, lword)
    wc++
    if(rex.test(lword)) matches++
  }
  console.log("matches:",matches,"words:",wc) 
  console.log("expression compile duration (ms)", performance.measure("expression compile duration (ms)","pre-expression-compile","post-expression-compile").duration)
  console.log("pattern compile duration (ms)", performance.measure("pattern compile duration (ms)","pre-pattern-compile","post-pattern-compile").duration)
  console.log("RegExp compile duration (ms)", performance.measure("RegExp compile duration (ms)","pre-RegExp-compile","post-RegExp-compile").duration)
  console.log("canary regex test failure, expect", false, "actual", rex.test("of course this isn't a word in moby dick!"))
  console.log("words with out of range code points",[...OOR.entries()].map(a=>`${a[0]} § ${[...a[1].values()].join(" ‡ ")}`).join(" ||| "))
*/
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
