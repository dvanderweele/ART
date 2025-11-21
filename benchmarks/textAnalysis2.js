import fs from "fs/promises"
import path from "path"
import {fileURLToPath} from 'url'
import process from "node:process"
import os from "os"
import {ART,NodeLeaf} from "../art.js"
import Latin1 from "../collations/Latin1/Latin1.js"
import {AVL} from "../../avl/avl.js"

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

const mobydick_file = path.join(__dirname,"mobydick.stripped.txt")
const shakespeare_file = path.join(__dirname,"shakespeare.txt")

;(async ()=>{ 
  const mobydick_raw = await fs.readFile(
    mobydick_file,
    {encoding: "utf8"}
  ) 
  const shakespeare_raw = await fs.readFile(
    shakespeare_file,
    {encoding: "utf8"}
  )
  const wordPattern = /(?:[\s"\/_—,.!;:*&()”“?]+)?([^\s"\/_—,.!;:*&()”“?]+)/g
  const mdwords = [...mobydick_raw.matchAll(wordPattern)].map(w=>w[1])
  const spwords = [...shakespeare_raw.matchAll(wordPattern)].map(w=>w[1])
  const mddeduped = new ART() 
  const spdeduped = new ART() 
  for(let i=0;i<mdwords.length;i++){ 
    const word = mdwords[i].toLocaleLowerCase("en-US")
    const lword = Latin1.getL0SortKey(word)
    const searchRes = mddeduped.search(lword)
    if(searchRes instanceof NodeLeaf){
      searchRes[0][1]++
    }else{
      mddeduped.insert(lword,[word,1])
    }
  } 
  for(let i=0;i<spwords.length;i++){ 
    const word = spwords[i].toLocaleLowerCase("en-US")
    const lword = Latin1.getL0SortKey(word)
    const searchRes = spdeduped.search(lword)
    if(searchRes instanceof NodeLeaf){
      searchRes[0][1]++
    }else{
      spdeduped.insert(lword,[word,1])
    }
  }
  const CEQ = (a,b)=>a[0]==b[0]&&a[1]==b[1]
  const CLT = (a,b)=>a[0]<b[0]||(a[0]==b[0]&&a[1]<b[1])
  const CLE = (a,b)=>a[0]<=b[0]||(a[0]==b[0]&&a[1]<=b[1])
  const CGT = (a,b)=>a[0]>b[0]||(a[0]==b[0]&&a[1]>b[1])
  const CGE = (a,b)=>a[0]>=b[0]||(a[0]==b[0]&&a[1]>=b[1])
  const mdCountIdx = new AVL( 
    null,
    CEQ, CLT, CLE, CGT, CGE
  )
  const mdLengthIdx = new AVL( 
    null,
    CEQ, CLT, CLE, CGT, CGE
  ) 
  for(let leaf of mddeduped.fullFwdRangeV()){
    const word = leaf[0][0]
    const count = leaf[0][1]
    const size = leaf[0][0].length
    mdCountIdx.insert([count,word])
    mdLengthIdx.insert([size,word])
  }
  const spCountIdx = new AVL( 
    null,
    CEQ, CLT, CLE, CGT, CGE
  )
  const spLengthIdx = new AVL( 
    null,
    CEQ, CLT, CLE, CGT, CGE
  ) 
  for(let leaf of spdeduped.fullFwdRangeV()){
    const word = leaf[0][0]
    const count = leaf[0][1]
    const size = leaf[0][0].length
    spCountIdx.insert([count,word])
    spLengthIdx.insert([size,word])
  }
  const mdP95CountNode = mdCountIdx.OSSelect(Math.floor(0.95*mdCountIdx.size))
  const mdP95LengthNode = mdLengthIdx.OSSelect(Math.floor(0.95*mdLengthIdx.size))
  const spP95CountNode = spCountIdx.OSSelect(Math.floor(0.95*spCountIdx.size))
  const spP95LengthNode = spLengthIdx.OSSelect(Math.floor(0.95*spLengthIdx.size))
  console.log("P95 of Moby Dick words by Count",mdP95CountNode[1])
  console.log("P95 of Moby Dickwords by Length",mdP95LengthNode[1])
  console.log("P95 of Shakespeare words by Count",spP95CountNode[1])
  console.log("P95 of Shakespeare words by Length",spP95LengthNode[1])
  const mdTop5PCount = [...mdCountIdx.ITER_FWD_GE_TO_LE(mdP95CountNode[1],[Infinity])].map(x=>x[1])
  const mdTop5PLength = [...mdLengthIdx.ITER_FWD_GE_TO_LE(mdP95LengthNode[1],[Infinity])].map(x=>x[1])
  const spTop5PCount = [...spCountIdx.ITER_FWD_GE_TO_LE(spP95CountNode[1],[Infinity])].map(x=>x[1])
  const spTop5PLength = [...spLengthIdx.ITER_FWD_GE_TO_LE(spP95LengthNode[1],[Infinity])].map(x=>x[1])
  console.log("\n\nMoby Dick Words — P95 and Above by Count")
  console.log(...mdTop5PCount) 
  console.log("\n\nMoby Dick Words — P95 and Above by Length") 
  console.log(...mdTop5PLength)
  console.log("\n\nShakespeare Words — P95 and Above by Count")
  console.log(...spTop5PCount)
  console.log("\n\nShakespeare Words — P95 and Above by Length")
  console.log(...spTop5PLength)
  const mdTop5PCountWords = new ART()
  const mdTop5PLengthWords = new ART()
  const spTop5PCountWords = new ART()
  const spTop5PLengthWords = new ART() 
  for(let e of mdTop5PCount) mdTop5PCountWords.insert(Latin1.getL0SortKey(e[1]),e[1])
  for(let e of mdTop5PLength) mdTop5PLengthWords.insert(Latin1.getL0SortKey(e[1]),e[1]) 
  for(let e of spTop5PCount) spTop5PCountWords.insert(Latin1.getL0SortKey(e[1]),e[1])
  for(let e of spTop5PLength) spTop5PLengthWords.insert(Latin1.getL0SortKey(e[1]),e[1]) 
  const mdXSpTop5PCount = ART.intersect(mdTop5PCountWords,spTop5PCountWords)
  const mdXSpTop5PLength = ART.intersect(mdTop5PLengthWords,spTop5PLengthWords)
  console.log("\n\nMoby Dick × Shakespeare — Top 5% of Words by Count")
  console.log(...[...mdXSpTop5PCount.fullFwdRangeV()].map(w=>w[0]))
  console.log("\n\nMoby Dick × Shakespeare — Top 5% of Words by Length")
  console.log(...[...mdXSpTop5PLength.fullFwdRangeV()].map(w=>w[0]))
})()
