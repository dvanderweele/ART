import fs from "fs/promises"
import {
  expectation,
  shuffleArray
} from "./utils.js"
import {
  getWASMBuffer
} from "./NodeWASMProvider.js"
import {
  buildBinCompF64,
  unBinCompF64
} from "./BinCompF64.js"
import {
  ART,
  Node1,
  Node4,
  Node16,
  Node48,
  Node256,
  NodeLeaf
} from "./art.js";

const L = x => console.log(x);
function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}


(async () => {
  const binCompF64 = await buildBinCompF64(
    getWASMBuffer("./RankF64.wasm")
  )
  const [expect, dump] = expectation();
  expect(true, false, "canary failure")
  const n1 = new Node1()
  expect(n1.indexOf(5),-1,"5 not in empty n1")
  n1.insert(5)
  n1[1] = true 
  expect(n1.indexOf(5),0,"5 in n1")
  expect(n1.indexOf(9),-1,"9 not in empty n1")
  n1.remove(5)
  expect(n1.indexOf(5),-1,"5 no longer in n1 ")
  const n4 = new Node4()
  let ns = [25, 50, 75, 100]
  for(let n of ns) expect(
    n4.indexOf(n) < 0, true,
    "n not in n4 yet"
  )
  for(let n of ns) n4.insert(n)
  for(let n of ns) expect(
    n4.indexOf(n) >= 0, true,
    "n in n4"
  )
  n4.insert(125)
  expect(n4.indexOf(125)<0,true,"cant add 125")
  for(let n of ns) expect(
    n4.indexOf(n) >= 0, true,
    "n in n4"
  )
  for(let n of ns) n4.remove(n)
  for(let n of ns) expect(
    n4.indexOf(n) < 0, true,
    "n no longer in n4"
  )
  const n16= new Node16()
  ns = [
    10,70,20,80,
    30,90,40,100,
    50,110,60,120,
    170,130,180,140
  ]
  for(let n of ns) expect(
    n16.indexOf(n) < 0, true,
    "n not in n16 yet"
  )
  for(let n of ns) n16.insert(n)
  for(let n of ns) expect(
    n16.indexOf(n) >= 0, true,
    "n in n16"
  )
  expect(n16.indexOf(190)<0,true,"190 not in n16")
  for(let n of ns) n16.remove(n)
  for(let n of ns) expect(
    n16.indexOf(n) < 0, true,
    "n no longer in n16"
  )
  const n48= new Node48()
  ns = [
    0,2,4,6,8,10,12,14,16,18,
    1,3,5,7,9,11,13,15,17,19,
    20,22,24,26,28,30,32,34,36,38,
    21,23,25,27,29,31,33,35,37,39,
    40,42,41,44,43,46,45,47
  ]
  for(let n of ns) expect(
    n48.indexOf(n) < 0, true,
    "n not in n48 yet"
  )
  for(let n of ns) n48.insert(n)
  for(let n of ns) expect(
    n48.indexOf(n) >= 0, true,
    "n in n48"
  )
  expect(n48.indexOf(190)<0,true,"190 not in n48")
  for(let n of ns) n48.remove(n)
  for(let n of ns) expect(
    n48.indexOf(n) < 0, true,
    "n no longer in n48"
  )
  const n256= new Node256()
  ns = Array.from(
    {length:256},
    (_,i)=>i
  )
  shuffleArray(ns)
  for(let n of ns) expect(
    n256.indexOf(n) < 0, true,
    "n not in n256 yet"
  )
  for(let n of ns) n256.insert(n)
  for(let n of ns) expect(
    n256.indexOf(n) >= 0, true,
    "n in n256"
  )
  expect(n256.indexOf(190)>=0,true,"190 in n256")
  for(let n of ns) n256.remove(n)
  for(let n of ns) expect(
    n256.indexOf(n) < 0, true,
    "n no longer in n56"
  ) 
  const a = new ART()
  const rset = new Set()
  const records = Array.from(
    {length:500},
    ()=>Array.from(
      {length:4},
      ()=>getRandomInt(0,256)
    )
  ).filter(
    r => {
      const i = rset.has(r.join("#"))
      if(!i){
        rset.add(r.join("#"))
        return true
      } else return false
    }
  )
  await fs.writeFile( "./debug.nums.json",
    JSON.stringify( records ), {
      encoding:"utf8"
    })
  for(let i = 0; i < records.length;i++){
    expect(
      a.search(records[i]),
      0,
      "key not inserted into tree yet results in 0 when sought"
    )
    a.insert(records[i],i)
    if(
      !(a.search(records[i]) instanceof NodeLeaf)
    ) console.log("404dbg",records[i],"ret",a.search(records[i],true))
    expect(
      a.search(records[i]) instanceof NodeLeaf,
      true,
      "key inserted into tree is yielded when sought"
    )
  }
  dump(true)
})()
