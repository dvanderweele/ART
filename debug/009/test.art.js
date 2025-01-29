import fs from "fs/promises"
import {
  expectation,
  shuffleArray
} from "../../utils.js"
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
    {length:50000},
    ()=>Array.from(
      {length:10},
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
  /*
  await fs.writeFile( "./debug.nums.json",
    JSON.stringify( records ), {
      encoding:"utf8"
    })
  */
  for(let i = 0; i < records.length;i++){
    expect(
      a.search(records[i]),
      0,
      "key not inserted into tree yet results in 0 when sought"
    )
    a.insert(records[i],i)
    /*if(
      !(a.search(records[i]) instanceof NodeLeaf)
    ) console.log("404dbg",records[i],"ret",a.search(records[i],true))*/
    expect(
      a.search(records[i]) instanceof NodeLeaf,
      true,
      "key inserted into tree is yielded when sought"
    )
    
  }
  for(let i = 0; i < records.length; i++) expect(
      a.search(records[i]) instanceof NodeLeaf,
      true,
      "key still found after all insertions done"
    )
  const rt = new ART()
  const rtks = [
    [23, 45, 67, 89],
    [123, 234, 12, 98],
    [145, 67, 200, 255],
    [18, 220, 33, 75],
    [90, 76, 34, 210],
    [88, 150, 60, 22],
    [201, 30, 78, 120],
    [55, 91, 134, 245],
    [3, 80, 140, 60],
    [200, 170, 250, 123],
    [45, 88, 120, 13],
    [72, 18, 60, 90],
    [110, 140, 180, 240],
    [23, 210, 190, 100],
    [77, 55, 240, 33],
    [44, 76, 119, 213],
    [160, 70, 91, 145],
    [190, 20, 35, 205],
    [129, 78, 45, 99],
    [19, 150, 230, 67],
    [240, 110, 56, 34],
    [17, 89, 140, 200],
    [23, 67, 98, 156],
    [48, 132, 77, 199],
    [87, 210, 34, 56],
    [66, 39, 188, 143],
    [12, 180, 210, 220],
    [98, 65, 12, 144],
    [23, 78, 132, 56],
    [120, 17, 88, 250],
    [88, 60, 99, 140],
    [130, 44, 155, 78],
    [255, 23, 89, 145],
    [44, 110, 190, 56],
    [92, 34, 210, 45],
    [120, 88, 15, 205],
    [170, 30, 240, 50],
    [33, 200, 89, 143],
    [145, 50, 70, 233],
    [78, 120, 34, 189],
    [39, 210, 99, 120],
    [88, 15, 170, 204],
    [111, 70, 30, 155],
    [67, 190, 23, 123],
    [200, 45, 88, 130],
    [190, 60, 35, 78],
    [13, 230, 88, 200],
    [55, 120, 134, 89],
    [78, 150, 240, 13],
    [60, 170, 77, 210]
  ];
  for(let i = 0; i < 50;i++){
    //console.log("insert, root type",rt.root.constructor.name,"size",rt.size,"key",rtks[i].join("~"))
    if(rtks[i].join("~") == "78~120~34~189"){ 
      /*console.log("\nPRE-MISSING-KEY-INSERT")
      console.log("root size",rt.root[2])
      console.log("iof(78)",rt.root.indexOf(78))
      console.log("iof(39)",rt.root.indexOf(39))
      console.log("ch.ptr(78)",rt.root[0][78])
      console.log("ch.ptr(39)",rt.root[0][39])
      console.log("kbm.iss(78)",rt.root[3].isSet(78))
      console.log("kbm.iss(39)",rt.root[3].isSet(39))
      console.log("cbm.iss(35)",rt.root[4].isSet(35))
      console.log("\n/PRE-MISSING-KEY-INSERT")*/
    }
    rt.insert(rtks[i])
    if(rtks[i].join("~") == "78~120~34~189"){ 
      /*console.log("\nPRE-TRIAGE")
      console.log("iof(78)",rt.root.indexOf(78))
      console.log("iof(39)",rt.root.indexOf(39))
      console.log("ch.ptr(78)",rt.root[0][78])
      console.log("ch.ptr(39)",rt.root[0][39])
      console.log("kbm.iss(78)",rt.root[3].isSet(78))
      console.log("kbm.iss(39)",rt.root[3].isSet(39))
      console.log("cbm.iss(35)",rt.root[4].isSet(35))
      console.log("\n/PRE-TRIAGE")*/
    }
    if(rtks[i].join("~") == "39~210~99~120"){
      /*console.log("\nTRIAGE\n")
      console.log("root type", rt.root.constructor.name)
      console.log("root size", rt.root[2])
      console.log("iof(78)",rt.root.indexOf(78))
      console.log("iof(39)",rt.root.indexOf(39))
      console.log("ch.ptr(78)",rt.root[0][78])
      console.log("ch.ptr(39)",rt.root[0][39])
      console.log("kbm.iss(78)",rt.root[3].isSet(78))
      console.log("kbm.iss(39)",rt.root[3].isSet(39))
      console.log("cbm.iss(35)",rt.root[4].isSet(35))
      console.log("\n/TRIAGE\n")*/
    }
    for(let j = 0; j < i; j++){
      if(!(rt.search(rtks[j]) instanceof NodeLeaf)){
        /*console.log("dbg search return val",rt.search(rtks[j]))
        console.log("anomaly, prior inserted key no longer found",rt.root.constructor.name,"size",rt.size,"key",rtks[j].join("~"))*/
        //console.log("depth 0",rt.root, "depth 1",rt.root[1][3],"leaf type",rt.root[1][3][1][1][1] instanceof NodeLeaf)
        throw "quit!!!"
      }
    }
  }
  
  expect(
    rt.size, 50,
    "size correct after 50 inserts"
  )
  
  
  for(let i = 0; i < rtks.length;i++){
    expect(
      rt.search(rtks[i]) instanceof NodeLeaf,
      true,
      "key in tree after inserted w/ 49 peers"
    )
  }
  
  /*
  for(let i = 0; i < rtks.length;i++){
    const s = rtks[i]
    rt.remove(s)
    expect(
      !(rt.search(s) instanceof NodeLeaf),
      true,
      "key not found right after removal"
    )
    for(let j = i; j < rtks.length;j++) expect(
      rt.search(rtks[j]) instanceof NodeLeaf,
      true,
      "unremoved peers still found after key removed"
    )
  }
  */
  dump(true);
})()
