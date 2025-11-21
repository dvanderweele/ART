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
  const mdCountIdx = new AVL( 
    null,
    (a,b)=>a[0]==b[0]&&a[1]==b[1], 
    (a,b)=>a[0]<b[0]||(a[0]==b[0]&&a[1]<b[1]),
    (a,b)=>a[0]<=b[0]||(a[0]==b[0]&&a[1]<=b[1]),
    (a,b)=>a[0]>b[0]||(a[0]==b[0]&&a[1]>b[1]),
    (a,b)=>a[0]>=b[0]||(a[0]==b[0]&&a[1]>=b[1])
  )
  const mdLengthIdx = new AVL( 
    null,
    (a,b)=>a[0]==b[0]&&a[1]==b[1], 
    (a,b)=>a[0]<b[0]||(a[0]==b[0]&&a[1]<b[1]),
    (a,b)=>a[0]<=b[0]||(a[0]==b[0]&&a[1]<=b[1]),
    (a,b)=>a[0]>b[0]||(a[0]==b[0]&&a[1]>b[1]),
    (a,b)=>a[0]>=b[0]||(a[0]==b[0]&&a[1]>=b[1])
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
    (a,b)=>a[0]==b[0]&&a[1]==b[1], 
    (a,b)=>a[0]<b[0]||(a[0]==b[0]&&a[1]<b[1]),
    (a,b)=>a[0]<=b[0]||(a[0]==b[0]&&a[1]<=b[1]),
    (a,b)=>a[0]>b[0]||(a[0]==b[0]&&a[1]>b[1]),
    (a,b)=>a[0]>=b[0]||(a[0]==b[0]&&a[1]>=b[1])
  )
  const spLengthIdx = new AVL( 
    null,
    (a,b)=>a[0]==b[0]&&a[1]==b[1], 
    (a,b)=>a[0]<b[0]||(a[0]==b[0]&&a[1]<b[1]),
    (a,b)=>a[0]<=b[0]||(a[0]==b[0]&&a[1]<=b[1]),
    (a,b)=>a[0]>b[0]||(a[0]==b[0]&&a[1]>b[1]),
    (a,b)=>a[0]>=b[0]||(a[0]==b[0]&&a[1]>=b[1])
  ) 
  for(let leaf of spdeduped.fullFwdRangeV()){
    const word = leaf[0][0]
    const count = leaf[0][1]
    const size = leaf[0][0].length
    spCountIdx.insert([count,word])
    spLengthIdx.insert([size,word])
  }
  const k = 20 
  console.log("top 20 most frequent words in Moby Dick")
  let yielded = 0
  for(let node of mdCountIdx.ITER_REV_LE_TO_GE([0,""],[Infinity,""])){
    if(yielded == k) break
    console.log(node[1][0],node[1][1])
    yielded++
  } 
  console.log("top 20 most frequent words in Shakespeare")
  yielded = 0
  for(let node of spCountIdx.ITER_REV_LE_TO_GE([0,""],[Infinity,""])){
    if(yielded == k) break
    console.log(node[1][0],node[1][1])
    yielded++
  } 
  console.log("top 20 longest words in Moby Dick")
  yielded = 0
  for(let node of mdLengthIdx.ITER_REV_LE_TO_GE([0,""],[Infinity,""])){
    if(yielded == k) break
    console.log(node[1][0],node[1][1])
    yielded++
  } 
  console.log("top 20 longest words in Shakespeare")
  yielded = 0
  for(let node of spLengthIdx.ITER_REV_LE_TO_GE([0,""],[Infinity,""])){
    if(yielded == k) break
    console.log(node[1][0],node[1][1])
    yielded++
  }
})()
