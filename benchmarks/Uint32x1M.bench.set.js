import {Uint32s} from "./Uint32.framework.js"
import {AVL} from "../avl.js"
import {ART,NodeLeaf} from "../art.js"
import process from "node:process"
import fs from "fs/promises"
import path from "path"
import os from "os"

const uint32s = new Uint32s(1_000_000)
gc()

const setMemoryBaseline = process.memoryUsage()
performance.mark("pre-set-insert")
const S = new Set()
for(let i of uint32s) S.add(i)
performance.mark("post-set-insert")
const setMemoryComparison = process.memoryUsage(); 
uint32s.shuffle()
performance.mark("pre-set-lookup")
for(let i of uint32s) S.has(i)
performance.mark("post-set-lookup") 
const ss = S.size
performance.mark("pre-set-delete")
for(let i of uint32s) S.delete(i)
performance.mark("post-set-delete") 
const setResult = {
  type: "Set", 
  ts: (new Date()).toISOString(),     
  osType: os.type(),        
  osPlatform: os.platform(),  
  osArch: os.arch(),           
  osAvailableParallelism: os.availableParallelism(),           
  nodeVersion: process.version,
  sourceSize: 1_000_000, 
  destinationSize: ss,
  postSize: S.size,
  insertDurationMS: performance.measure("1","pre-set-insert","post-set-insert").duration,
  lookupDurationMS: performance.measure("2","pre-set-lookup","post-set-lookup").duration,
  deleteDurationMS: performance.measure("3","pre-set-delete","post-set-delete").duration,
  deltaMemoryUsedBytes: setMemoryComparison.heapUsed - setMemoryBaseline.heapUsed
}
gc()

uint32s.shuffle()
const avlMemoryBaseline = process.memoryUsage()
performance.mark("pre-avl-insert")
const V = new AVL()
for(let i of uint32s) V.insert(i)
performance.mark("post-avl-insert")
const avlMemoryComparison = process.memoryUsage(); 
uint32s.shuffle()
performance.mark("pre-avl-lookup")
for(let i of uint32s) V.search(i)
performance.mark("post-avl-lookup") 
const vs = V.size
performance.mark("pre-avl-delete")
for(let i of uint32s) V.remove(i)
performance.mark("post-avl-delete") 
const avlResult = {
  type: "AVL", 
  ts: (new Date()).toISOString(),     
  osType: os.type(),        
  osPlatform: os.platform(),  
  osArch: os.arch(),           
  osAvailableParallelism: os.availableParallelism(),           
  nodeVersion: process.version,
  sourceSize: 1_000_000, 
  destinationSize: vs,
  postSize: V.size,
  insertDurationMS: performance.measure("4","pre-avl-insert","post-avl-insert").duration,
  lookupDurationMS: performance.measure("5","pre-avl-lookup","post-avl-lookup").duration,
  deleteDurationMS: performance.measure("6","pre-avl-delete","post-avl-delete").duration,
  deltaMemoryUsedBytes: avlMemoryComparison.heapUsed - avlMemoryBaseline.heapUsed
}
gc()

uint32s.shuffle()
const artMemoryBaseline = process.memoryUsage()
performance.mark("pre-art-insert")
const R = new ART() 
for(let i of uint32s){
  const presize = R.size
  const v = new DataView(new ArrayBuffer(4))
  v.setUint32(0,i,false)
  const b = new Uint8Array(v.buffer)
  //console.log("===inserting", i)
  //const b4Mem = R.search(b)
  R.insert(b)
  //const afterMem = R.search(b)
  //const postSize = R.size
  //if(postSize-presize!=1) console.log("art insert anomaly, presize", presize, "postSize",postSize,"delta",postSize-presize,"uint",i, "insertResultCode",ir,"before test", b4Mem instanceof NodeLeaf, "after test", afterMem instanceof NodeLeaf)
}
performance.mark("post-art-insert")
let lfc = 0
for(let lf of R.fullFwdRangeV()) lfc++
const artMemoryComparison = process.memoryUsage(); 
uint32s.shuffle()
performance.mark("pre-art-lookup") 
for(let i of uint32s){
  const v = new DataView(new ArrayBuffer(4))
  v.setUint32(0,i,false)
  const b = new Uint8Array(v.buffer)
  R.search(b)
}
performance.mark("post-art-lookup") 
const rs = R.size
performance.mark("pre-art-delete") 
for(let i of uint32s){
  const presize = R.size
  const v = new DataView(new ArrayBuffer(4))
  v.setUint32(0,i,false)
  const b = new Uint8Array(v.buffer)
  R.remove(b)
  const postSize = R.size
  //if(postSize-presize!=-1) console.log("art delete anomaly, presize", presize, "postSize",postSize,"delta",postSize-presize,"uint",i)
}
performance.mark("post-art-delete") 
const artResult = {
  type: "ART", 
  ts: (new Date()).toISOString(),     
  osType: os.type(),        
  osPlatform: os.platform(),  
  osArch: os.arch(),           
  osAvailableParallelism: os.availableParallelism(),           
  nodeVersion: process.version,
  sourceSize: 1_000_000,
  destinationSize: rs,
  destinationLeafCount: lfc,
  postSize: R.size,
  insertDurationMS: performance.measure("7","pre-art-insert","post-art-insert").duration,
  lookupDurationMS: performance.measure("8","pre-art-lookup","post-art-lookup").duration,
  deleteDurationMS: performance.measure("9","pre-art-delete","post-art-delete").duration,
  deltaMemoryUsedBytes: artMemoryComparison.heapUsed - artMemoryBaseline.heapUsed
}
gc()

const __filename = fileURLToPath(import.meta.url)                      
const __dirname = path.dirname(__filename)
;(async()=>{
  await fs.writeFile(path.join(__dirname,"uint32x1MResults",`set.result.${Date.now()}.json`),JSON.stringify(setResult),{encoding:"utf8"})
  await fs.writeFile(path.join(__dirname,"uint32x1MResults",`avl.result.${Date.now()}.json`),JSON.stringify(avlResult),{encoding:"utf8"})
  await fs.writeFile(path.join(__dirname,"uint32x1MResults",`art.result.${Date.now()}.json`),JSON.stringify(artResult),{encoding:"utf8"})
})()
