import fs from "fs/promises"
import path from "path"
import {fileURLToPath} from 'url'
import process from "node:process"
import os from "os"
import {ART} from "../art.js"
import {AVL} from "../avl.js"
import Latin1 from "../collations/Latin1/Latin1.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const mobydick_file = path.join(__dirname,"mobydick.stripped.txt")
const shakespeare_file = path.join(__dirname,"shakespeare.txt")

;(async ()=>{
  const mobydick_raw = await fs.readFile(
    mobydick_file,
    {encoding: "utf8"}
  )
  const wordPattern = /(?:[\s"\/_—,.!;:*&()”“?]+)?([^\s"\/_—,.!;:*&()”“?]+)/g
  const mdWords = [...mobydick_raw.matchAll(wordPattern)].map(w=>w[1])
  const mdDeduped = new ART()
  const mdVDeduped = new AVL() 
  mdVDeduped[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
  mdVDeduped.ITER_LB = "\x00"
  mdVDeduped.ITER_UB = "\uFFFF"
  for(let i=0;i<mdWords.length;i++){
    const lword = Latin1.getL2SortKey(mdWords[i])
    mdDeduped.insert(lword) 
    const vword = mdWords[i].toLocaleLowerCase("en-US")
    mdVDeduped.insert(vword)
  }
  const shakespeare_raw = await fs.readFile(
    shakespeare_file,
    {encoding: "utf8"}
  )
  const spWords = [...shakespeare_raw.matchAll(wordPattern)].map(w=>w[1])
  const spDeduped = new ART()
  const spVDeduped = new AVL() 
  spVDeduped[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
  spVDeduped.ITER_LB = "\x00"
  spVDeduped.ITER_UB = "\uFFFF"
  for(let i=0;i<spWords.length;i++){
    const lword = Latin1.getL2SortKey(spWords[i])
    spDeduped.insert(lword) 
    const vword = spWords[i].toLocaleLowerCase("en-US")
    spVDeduped.insert(vword)
  } 
  const art_ci = (()=>{
    performance.mark("pre-intersect")
    const ci = ART.intersect(mdDeduped,spDeduped)
    performance.mark("post-intersect") 
    let ci_iter_cnt = 0
    for(let _ of ci.fullFwdRangeKV()) ci_iter_cnt++
    return {
      type: "ART intersect",
      "ts": (new Date()).toISOString(),
      "osType": os.type(),
      "osPlatform": os.platform(),
      "osArch": os.arch(),
      "osAvailableParallelism": os.availableParallelism(),
      "nodeVersion": process.version,
      size: ci.size,
      iterationSize: ci_iter_cnt,
      durationMS: performance.measure("a","pre-intersect","post-intersect").duration
    }
  })();
  const art_cd_hms = (()=>{
    performance.mark("pre-difference-hms")
    const cd_hms = ART.difference(mdDeduped,spDeduped)
    performance.mark("post-difference-hms") 
    let cd_hms_iter_cnt = 0
    for(let _ of cd_hms.fullFwdRangeKV()) cd_hms_iter_cnt++
    return {
      type: "ART difference-hms",
      "ts": (new Date()).toISOString(),
      "osType": os.type(),
      "osPlatform": os.platform(),
      "osArch": os.arch(),
      "osAvailableParallelism": os.availableParallelism(),
      "nodeVersion": process.version,
      size: cd_hms.size,
      iterationSize: cd_hms_iter_cnt,
      durationMS: performance.measure("b","pre-difference-hms","post-difference-hms").duration
    }
  })();
  const art_cd_smh = (()=>{
    performance.mark("pre-difference-smh")
    const cd_smh = ART.difference(spDeduped,mdDeduped)
    performance.mark("post-difference-smh")  
    let cd_smh_iter_cnt = 0
    for(let _ of cd_smh.fullFwdRangeKV()) cd_smh_iter_cnt++
    return {
      type: "ART difference-smh",
      "ts": (new Date()).toISOString(),
      "osType": os.type(),
      "osPlatform": os.platform(),
      "osArch": os.arch(),
      "osAvailableParallelism": os.availableParallelism(),
      "nodeVersion": process.version,
      size: cd_smh.size,
      iterationSize: cd_smh_iter_cnt,
      durationMS: performance.measure("c","pre-difference-smh","post-difference-smh").duration
    }
  })()
  const art_cu = (()=>{
    performance.mark("pre-union")
    const cu = ART.union(mdDeduped,spDeduped)
    performance.mark("post-union")  
    let cu_iter_cnt = 0
    for(let _ of cu.fullFwdRangeKV()) cu_iter_cnt++
    return {
      type: "ART union",
      "ts": (new Date()).toISOString(),
      "osType": os.type(),
      "osPlatform": os.platform(),
      "osArch": os.arch(),
      "osAvailableParallelism": os.availableParallelism(),
      "nodeVersion": process.version,
      size: cu.size,
      iterationSize: cu_iter_cnt,
      durationMS: performance.measure("d","pre-union","post-union").duration
    }
  })() 
  // avl
  const avl_ci = (()=>{
    performance.mark("pre-intersect")
    const ci = AVL.intersect(mdVDeduped,spVDeduped)
    performance.mark("post-intersect") 
    let ci_iter_cnt = 0 
    ci[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    ci.ITER_LB = "\x00"
    ci.ITER_UB = "\uFFFF"
    for(let _ of ci) ci_iter_cnt++
    return {
      type: "AVL intersect",
      "ts": (new Date()).toISOString(),
      "osType": os.type(),
      "osPlatform": os.platform(),
      "osArch": os.arch(),
      "osAvailableParallelism": os.availableParallelism(),
      "nodeVersion": process.version,
      size: ci.size,
      iterationSize: ci_iter_cnt,
      durationMS: performance.measure("a","pre-intersect","post-intersect").duration
    }
  })();
  const avl_cd_hms = (()=>{
    performance.mark("pre-difference-hms")
    const cd_hms = AVL.difference(mdVDeduped,spVDeduped)
    performance.mark("post-difference-hms") 
    let cd_hms_iter_cnt = 0 
    cd_hms[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    cd_hms.ITER_LB = "\x00"
    cd_hms.ITER_UB = "\uFFFF"
    for(let _ of cd_hms) cd_hms_iter_cnt++
    return {
      type: "AVL difference-hms",
      "ts": (new Date()).toISOString(),
      "osType": os.type(),
      "osPlatform": os.platform(),
      "osArch": os.arch(),
      "osAvailableParallelism": os.availableParallelism(),
      "nodeVersion": process.version,
      size: cd_hms.size,
      iterationSize: cd_hms_iter_cnt,
      durationMS: performance.measure("b","pre-difference-hms","post-difference-hms").duration
    }
  })();
  const avl_cd_smh = (()=>{
    performance.mark("pre-difference-smh")
    const cd_smh = AVL.difference(spVDeduped,mdVDeduped)
    performance.mark("post-difference-smh")  
    let cd_smh_iter_cnt = 0 
    cd_smh[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    cd_smh.ITER_LB = "\x00"
    cd_smh.ITER_UB = "\uFFFF"
    for(let _ of cd_smh) cd_smh_iter_cnt++
    return {
      type: "AVL difference-smh",
      "ts": (new Date()).toISOString(),
      "osType": os.type(),
      "osPlatform": os.platform(),
      "osArch": os.arch(),
      "osAvailableParallelism": os.availableParallelism(),
      "nodeVersion": process.version,
      size: cd_smh.size,
      iterationSize: cd_smh_iter_cnt,
      durationMS: performance.measure("c","pre-difference-smh","post-difference-smh").duration
    }
  })()
  const avl_cu = (()=>{
    performance.mark("pre-union")
    const cu = AVL.union(mdVDeduped,spVDeduped)
    performance.mark("post-union")  
    let cu_iter_cnt = 0
    cu[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    cu.ITER_LB = "\x00"
    cu.ITER_UB = "\uFFFF"
    for(let _ of cu) cu_iter_cnt++
    return {
      type: "AVL union",
      "ts": (new Date()).toISOString(),
      "osType": os.type(),
      "osPlatform": os.platform(),
      "osArch": os.arch(),
      "osAvailableParallelism": os.availableParallelism(),
      "nodeVersion": process.version,
      size: cu.size,
      iterationSize: cu_iter_cnt,
      durationMS: performance.measure("d","pre-union","post-union").duration
    }
  })() 
  await fs.writeFile(path.join(__dirname,"melville_v_shakespeare",`art.result.ci.${Date.now()}.json`),JSON.stringify(art_ci),{encoding:"utf8"})
  await fs.writeFile(path.join(__dirname,"melville_v_shakespeare",`art.result.cd_hms.${Date.now()}.json`),JSON.stringify(art_cd_hms),{encoding:"utf8"})
  await fs.writeFile(path.join(__dirname,"melville_v_shakespeare",`art.result.cd_smh.${Date.now()}.json`),JSON.stringify(art_cd_smh),{encoding:"utf8"})
  await fs.writeFile(path.join(__dirname,"melville_v_shakespeare",`art.result.cu.${Date.now()}.json`),JSON.stringify(art_cu),{encoding:"utf8"}) 
  await fs.writeFile(path.join(__dirname,"melville_v_shakespeare",`avl.result.ci.${Date.now()}.json`),JSON.stringify(avl_ci),{encoding:"utf8"})
  await fs.writeFile(path.join(__dirname,"melville_v_shakespeare",`avl.result.cd_hms.${Date.now()}.json`),JSON.stringify(avl_cd_hms),{encoding:"utf8"})
  await fs.writeFile(path.join(__dirname,"melville_v_shakespeare",`avl.result.cd_smh.${Date.now()}.json`),JSON.stringify(avl_cd_smh),{encoding:"utf8"})
  await fs.writeFile(path.join(__dirname,"melville_v_shakespeare",`avl.result.cu.${Date.now()}.json`),JSON.stringify(avl_cu),{encoding:"utf8"})
})()
