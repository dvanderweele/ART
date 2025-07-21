import fs from "fs/promises"
import {
  expectation,
  shuffleArray
} from "./utils.js"
import {
  ART,
  Node1,
  Node4,
  Node16,
  Node48,
  Node256,
  NodeLeaf,
  ByteStack,
  LOWER_BOUND_INCLUSIVE, 
  UPPER_BOUND_INCLUSIVE,
  REVERSE,
  FIXED_LENGTH_KEY,
  VARIABLE_LENGTH_KEY,
  LEAF_COMPONENT,
  FORWARD,
  EXCLUSIVE
} from "./art.js";
import {
  getWASMBuffer
} from "./NodeWASMProvider.js"
import {
  buildBinCompF64,
  unBinCompF64
} from "./BinCompF64.js"
import Latin1 from "./collations/Latin1/Latin1.js"
import BinComp2sComplement from "./BinComp2sComplements.js"
import {AVL} from "./avl.js"

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
  const records = JSON.parse(
    await fs.readFile(
      "./debug.nums.json",
      {encoding:"utf8"}
    )
  )*/
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
    a.insert(records[i],i,)
    if(
      !(a.search(records[i],true) instanceof NodeLeaf)
    ){ 
      console.log(
        "404dbg", records[i], 
        "ret", a.search(records[i],true)
      )
      console.log("root type",a.root.constructor.name,"root size",a.root[2],"idx(239)",a.root.indexOf(239))
      const d1 = a.root[1][a.root.indexOf(239)]
      console.log("d1 type",d1.constructor.name,"d1 size",d1[2],"idx(114)",d1.indexOf(114))
      const d2 = d1[1][d1.indexOf(114)]
      console.log("d2 type",d2.constructor.name,"idx(127)",d2.indexOf(127))
      throw "thrown: 404"
    }
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
  // remove odds
  for(let i = 1; i < records.length; i=i+2) a.remove(records[i])
  // verify odds not there
  // verify evens still there
  for(let i = 0; i < records.length; i++) expect(
    i%2==0 ? a.search(records[i]) instanceof NodeLeaf : !(a.search(records[i]) instanceof NodeLeaf),
    true,
    "odds not there after removal but evens are"
  );
  // remove evens
  
  for(let i = 0; i < records.length; i=i+2){
    /*if(records[i].join("~").startsWith("143~18~") || i > 32637) console.log("even-rem.dbg, i",i,"k",records[i].join("~"), "sres",a.search([
      143,18,43,253,202,202,7,201,5,186
    ]))*/
    /*
     * or case causes same failure during search call of 143~7~249~4~223~172~121~26~64~60
     */
    //console.log("rm, key:",records[i].join("~"))
    //console.log(a.search([143,18,43,253,202,202,7,201,5,186]))
    a.remove(records[i]);
  }
  // verify none there
  for(let i = 0; i < records.length; i++) expect(
    !(a.search(records[i]) instanceof NodeLeaf),
    true,
    "odds and evens all gone"
  );
  
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
  
  
  for(let i = 0; i < rtks.length;i++){
    /*console.log(
      "rm.loop, 18~220~33~75.search", rt.search([18,220,33,75]) instanceof NodeLeaf, "ck", rtks[i]
   )*/
    const s = rtks[i]
    rt.remove(s, "145~67~200~255" == s.join("~"))
    expect(
      !(rt.search(s) instanceof NodeLeaf),
      true,
      "key not found right after removal"
    )
    for(let j = i+1; j < rtks.length;j++){ 
      if(!(rt.search(rtks[j]) instanceof NodeLeaf)){
        console.log("unremoved404, ik",rtks[i].join("~"),"jk",rtks[j].join("~"),"i",i,"j",j)
        throw "failure_"
      }
      expect(
      rt.search(rtks[j]) instanceof NodeLeaf,
      true,
      "unremoved peers still found after key removed"
    )}
  }
  //n4 bounded traversal tests
  const btn4 = new Node4()
  ;[0,85,170,255].forEach(v=>btn4.insert(v))
  // ITER_FWD_GE_TO_LT 
  btn4[Symbol.iterator] = Node4.ITER_FWD_GE_TO_LT
  btn4.ITER_LB = 85
  btn4.ITER_UB = 255
  expect(
    [...btn4].map(a=>a[0]).join("~"),
    "85~170",
    "node4 iter_fwd_ge_to_lt"
  )
  // ITER_FWD_GT_TO_LE 
  btn4[Symbol.iterator] = Node4.ITER_FWD_GT_TO_LE
  btn4.ITER_LB = 85
  btn4.ITER_UB = 255
  expect(
    [...btn4].map(a=>a[0]).join("~"),
    "170~255",
    "node4 iter_fwd_gt_to_le"
  )

  // ITER_FWD_GT_TO_LT 
  btn4[Symbol.iterator] = Node4.ITER_FWD_GT_TO_LT
  btn4.ITER_LB = 85
  btn4.ITER_UB = 255
  expect(
    [...btn4].map(a=>a[0]).join("~"),
    "170",
    "node4 iter_fwd_gt_to_lt"
  )

  // ITER_REV_LE_TO_GE 
  btn4[Symbol.iterator] = Node4.ITER_REV_LE_TO_GE
  btn4.ITER_LB = 85
  btn4.ITER_UB = 255
  expect(
    [...btn4].map(a=>a[0]).join("~"),
    "255~170~85",
    "node4 iter_rev_le_to_ge"
  )

  // ITER_REV_LE_TO_GT
  btn4[Symbol.iterator] = Node4.ITER_REV_LE_TO_GT
  btn4.ITER_LB = 85
  btn4.ITER_UB = 255
  expect(
    [...btn4].map(a=>a[0]).join("~"),
    "255~170",
    "node4 iter_rev_le_to_gt"
  )

  // ITER_REV_LT_TO_GE
  btn4[Symbol.iterator] = Node4.ITER_REV_LT_TO_GE
  btn4.ITER_LB = 85
  btn4.ITER_UB = 255
  expect(
    [...btn4].map(a=>a[0]).join("~"),
    "170~85",
    "node4 iter_rev_lt_to_ge"
  )

  // ITER_REV_LT_TO_GT 
  btn4[Symbol.iterator] = Node4.ITER_REV_LT_TO_GT
  btn4.ITER_LB = 85
  btn4.ITER_UB = 255
  expect(
    [...btn4].map(a=>a[0]).join("~"),
    "170",
    "node4 iter_rev_lt_to_gt"
  )
  
  // n16 bounded traversal tests
  const bt16 = [0,11,22,33,44,55,66,77,88,99,111,122,133,144,155,255]
  const bn16 = new Node16()
  bt16.forEach(n=>bn16.insert(n)) 
  bn16[Symbol.iterator] = Node16.ITER_FWD_GE_TO_LE 
  bn16.ITER_LB = 55
  bn16.ITER_UB = 133
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "55~66~77~88~99~111~122~133"
    , "bt16"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 0
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "0"
    , "bt16"
  ) 
  bn16.ITER_LB = 144
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "144~155~255" 
    , "bt16"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 11
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "0~11"
    , "bt16"
  ) 
  bn16.ITER_LB = 255
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "255"
    , "bt16"
  )
  bn16[Symbol.iterator] = Node16.ITER_FWD_GE_TO_LT 
  bn16.ITER_LB = 55
  bn16.ITER_UB = 133
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "55~66~77~88~99~111~122"
    , "bt16"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 0
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16"
  ) 
  bn16.ITER_LB = 144
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "144~155" 
    , "bt16"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 11
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "0"
    , "bt16"
  ) 
  bn16.ITER_LB = 255
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16"
  ) 
  bn16[Symbol.iterator] = Node16.ITER_FWD_GT_TO_LE 
  bn16.ITER_LB = 55
  bn16.ITER_UB = 133
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "66~77~88~99~111~122~133"
    , "bt16"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 0
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16"
  ) 
  bn16.ITER_LB = 144
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "155~255" 
    , "bt16"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 11
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "11"
    , "bt16"
  ) 
  bn16.ITER_LB = 255
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16"
  ) 
  bn16[Symbol.iterator] = Node16.ITER_FWD_GT_TO_LT 
  bn16.ITER_LB = 55
  bn16.ITER_UB = 133
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "66~77~88~99~111~122"
    , "bt16"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 0
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16"
  ) 
  bn16.ITER_LB = 144
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "155" 
    , "bt16"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 11
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16"
  ) 
  bn16.ITER_LB = 255
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16"
  )
  // reverse 
  bn16[Symbol.iterator] = Node16.ITER_REV_LE_TO_GE 
  bn16.ITER_LB = 55
  bn16.ITER_UB = 133
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "133~122~111~99~88~77~66~55"
    , "bt16-ree"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 0
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "0"
    , "bt16-ree"
  ) 
  bn16.ITER_LB = 144
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "255~155~144"
    , "bt16-ree"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 11
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "11~0"
    , "bt16-ree"
  ) 
  bn16.ITER_LB = 255
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "255"
    , "bt16-ree"
  )
  bn16[Symbol.iterator] = Node16.ITER_REV_LE_TO_GT 
  bn16.ITER_LB = 55
  bn16.ITER_UB = 133
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "133~122~111~99~88~77~66"
    , "bt16-ret"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 0
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16-ret"
  ) 
  bn16.ITER_LB = 144
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "255~155" 
    , "bt16-ret"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 11
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "11"
    , "bt16-ret"
  ) 
  bn16.ITER_LB = 255
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16-ret"
  ) 
  bn16[Symbol.iterator] = Node16.ITER_REV_LT_TO_GE 
  bn16.ITER_LB = 55
  bn16.ITER_UB = 133
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "122~111~99~88~77~66~55"
    , "bt16-rte"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 0
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16-rte"
  ) 
  bn16.ITER_LB = 144
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "155~144" 
    , "bt16-rte"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 11
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "0"
    , "bt16-rte"
  ) 
  bn16.ITER_LB = 255
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16-rte"
  ) 
  bn16[Symbol.iterator] = Node16.ITER_REV_LT_TO_GT 
  bn16.ITER_LB = 55
  bn16.ITER_UB = 133
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "122~111~99~88~77~66"
    , "bt16-rtt"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 0
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16-rtt"
  ) 
  bn16.ITER_LB = 144
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    "155" 
    , "bt16-rtt"
  ) 
  bn16.ITER_LB = 0
  bn16.ITER_UB = 11
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16-rtt"
  ) 
  bn16.ITER_LB = 255
  bn16.ITER_UB = 255
  expect(
    [...bn16].map(([kb,_])=>kb).join("~"),
    ""
    , "bt16-rtt"
  ) 
  const bt48 = Array.from({length:48}, (_,i)=>i)
  shuffleArray(bt48)
  //console.log(bt48)
  const b48r = new Node48()
  for(let n of bt48){
    b48r.insert(n)
  } 
  //b48r[Symbol.iterator] = Node48.ITER_FWD_GE_TO_LE
  let srl = Array.from({length:48}, (_,i)=>i).join("~")
  expect(
    [...b48r].map(v=>v[0]).join("~"),
    srl,
    "n48 ITER_FWD_GE_TO_LE full"
  )
  b48r.remove(47)
  b48r.insert(255)  
  //console.log(srl.slice(0,srl.length-2) + "255")
  expect(
    [...b48r].map(v=>v[0]).join("~"),
    srl.slice(0,srl.length-2) + "255",
    "n48 ITER_FWD_GE_TO_LE full"
  ) 
  const b48fet = new Node48()
  for(let n of bt48){
    b48fet.insert(n)
  } 
  srl = Array.from({length:48}, (_,i)=>i).join("~")
  b48fet[Symbol.iterator] = Node48.ITER_FWD_GE_TO_LT
  b48fet.ITER_LB = 7
  b48fet.ITER_UB = 17
  expect(
    [...b48fet].map(v=>v[0]).join("~"),
    "7~8~9~10~11~12~13~14~15~16",
    "n48 ITER_FWD_GE_TO_LT full"
  )
  const b48fte = new Node48()
  for(let n of bt48){
    b48fte.insert(n)
  } 
  srl = Array.from({length:48}, (_,i)=>i).join("~")
  b48fte[Symbol.iterator] = Node48.ITER_FWD_GT_TO_LE
  b48fte.ITER_LB = 7
  b48fte.ITER_UB = 17
  expect(
    [...b48fte].map(v=>v[0]).join("~"),
    "8~9~10~11~12~13~14~15~16~17",
    "n48 ITER_FWD_GT_TO_LE full"
  )  
  const b48ftt = new Node48()
  for(let n of bt48){
    b48ftt.insert(n)
  } 
  srl = Array.from({length:48}, (_,i)=>i).join("~")
  b48ftt[Symbol.iterator] = Node48.ITER_FWD_GT_TO_LT
  b48ftt.ITER_LB = 7
  b48ftt.ITER_UB = 17
  expect(
    [...b48ftt].map(v=>v[0]).join("~"),
    "8~9~10~11~12~13~14~15~16",
    "n48 ITER_FWD_GT_TO_LT full"
  ) 
  const b48ree = new Node48()
  for(let n of bt48){
    b48ree.insert(n)
  } 
  srl = Array.from({length:48}, (_,i)=>i).join("~")
  b48ree[Symbol.iterator] = Node48.ITER_REV_LE_TO_GE
  b48ree.ITER_LB = 7
  b48ree.ITER_UB = 17
  expect(
    [...b48ree].map(v=>v[0]).join("~"),
    "17~16~15~14~13~12~11~10~9~8~7",
    "n48 ITER_REV_LE_TO_GE full"
  ) 
  const b48ret = new Node48()
  for(let n of bt48){
    b48ret.insert(n)
  } 
  srl = Array.from({length:48}, (_,i)=>i).join("~")
  b48ret[Symbol.iterator] = Node48.ITER_REV_LE_TO_GT
  b48ret.ITER_LB = 7
  b48ret.ITER_UB = 17
  expect(
    [...b48ret].map(v=>v[0]).join("~"),
    "17~16~15~14~13~12~11~10~9~8",
    "n48 ITER_REV_LE_TO_GT full"
  ) 
  const b48rte = new Node48()
  for(let n of bt48){
    b48rte.insert(n)
  } 
  srl = Array.from({length:48}, (_,i)=>i).join("~")
  b48rte[Symbol.iterator] = Node48.ITER_REV_LT_TO_GE
  b48rte.ITER_LB = 7
  b48rte.ITER_UB = 17
  expect(
    [...b48rte].map(v=>v[0]).join("~"),
    "16~15~14~13~12~11~10~9~8~7",
    "n48 ITER_REV_LT_TO_GE full"
  ) 
  const b48rtt = new Node48()
  for(let n of bt48){
    b48rtt.insert(n)
  } 
  srl = Array.from({length:48}, (_,i)=>i).join("~")
  b48rtt[Symbol.iterator] = Node48.ITER_REV_LT_TO_GT
  b48rtt.ITER_LB = 7
  b48rtt.ITER_UB = 17
  expect(
    [...b48rtt].map(v=>v[0]).join("~"),
    "16~15~14~13~12~11~10~9~8",
    "n48 ITER_REV_LT_TO_GT full"
  )


  // n256 range
  const bt256 = Array.from({length:256}, (_,i)=>i)
  shuffleArray(bt256)
  const b256r = new Node256()
  for(let n of bt256){
    b256r.insert(n)
  } 
  srl = Array.from({length:256}, (_,i)=>i).join("~")
  expect(
    [...b256r].map(v=>v[0]).join("~"),
    srl,
    "n256 ITER_FWD_GE_TO_LE full"
  )
  const b256fet = new Node256()
  for(let n of bt256){
    b256fet.insert(n)
  } 
  srl = Array.from({length:256}, (_,i)=>i).join("~")
  b256fet[Symbol.iterator] = Node256.ITER_FWD_GE_TO_LT
  b256fet.ITER_LB = 7
  b256fet.ITER_UB = 17
  expect(
    [...b256fet].map(v=>v[0]).join("~"),
    "7~8~9~10~11~12~13~14~15~16",
    "n256 ITER_FWD_GE_TO_LT full"
  )
  const b256fte = new Node256()
  for(let n of bt256){
    b256fte.insert(n)
  } 
  srl = Array.from({length:256}, (_,i)=>i).join("~")
  b256fte[Symbol.iterator] = Node256.ITER_FWD_GT_TO_LE
  b256fte.ITER_LB = 7
  b256fte.ITER_UB = 17
  expect(
    [...b256fte].map(v=>v[0]).join("~"),
    "8~9~10~11~12~13~14~15~16~17",
    "n256 ITER_FWD_GT_TO_LE full"
  )  
  const b256ftt = new Node256()
  for(let n of bt256){
    b256ftt.insert(n)
  } 
  srl = Array.from({length:256}, (_,i)=>i).join("~")
  b256ftt[Symbol.iterator] = Node256.ITER_FWD_GT_TO_LT
  b256ftt.ITER_LB = 7
  b256ftt.ITER_UB = 17
  expect(
    [...b256ftt].map(v=>v[0]).join("~"),
    "8~9~10~11~12~13~14~15~16",
    "n256 ITER_FWD_GT_TO_LT full"
  ) 
  const b256ree = new Node256()
  for(let n of bt256){
    b256ree.insert(n)
  } 
  srl = Array.from({length:256}, (_,i)=>i).join("~")
  b256ree[Symbol.iterator] = Node256.ITER_REV_LE_TO_GE
  b256ree.ITER_LB = 7
  b256ree.ITER_UB = 17
  expect(
    [...b256ree].map(v=>v[0]).join("~"),
    "17~16~15~14~13~12~11~10~9~8~7",
    "n256 ITER_REV_LE_TO_GE full"
  ) 
  const b256ret = new Node256()
  for(let n of bt256){
    b256ret.insert(n)
  } 
  srl = Array.from({length:256}, (_,i)=>i).join("~")
  b256ret[Symbol.iterator] = Node256.ITER_REV_LE_TO_GT
  b256ret.ITER_LB = 7
  b256ret.ITER_UB = 17
  expect(
    [...b256ret].map(v=>v[0]).join("~"),
    "17~16~15~14~13~12~11~10~9~8",
    "n256 ITER_REV_LE_TO_GT full"
  ) 
  const b256rte = new Node256()
  for(let n of bt256){
    b256rte.insert(n)
  } 
  srl = Array.from({length:256}, (_,i)=>i).join("~")
  b256rte[Symbol.iterator] = Node256.ITER_REV_LT_TO_GE
  b256rte.ITER_LB = 7
  b256rte.ITER_UB = 17
  expect(
    [...b256rte].map(v=>v[0]).join("~"),
    "16~15~14~13~12~11~10~9~8~7",
    "n256 ITER_REV_LT_TO_GE full"
  ) 
  const b256rtt = new Node256()
  for(let n of bt256){
    b256rtt.insert(n)
  } 
  srl = Array.from({length:256}, (_,i)=>i).join("~")
  b256rtt[Symbol.iterator] = Node256.ITER_REV_LT_TO_GT
  b256rtt.ITER_LB = 7
  b256rtt.ITER_UB = 17
  expect(
    [...b256rtt].map(v=>v[0]).join("~"),
    "16~15~14~13~12~11~10~9~8",
    "n256 ITER_REV_LT_TO_GT full"
  )
  const bstk = new ByteStack(8)
  const bstkNums = Array.from({ length:12 }, (_,i)=>i)
  for(let n of bstkNums) bstk.push(n)
  const pullt = bstk.pull()
  expect(
    pullt.byteLength,
    12,
    "pulled dataview from grown byteStack right size"
  )
  for(let n of bstkNums) expect(
    pullt.getUint8(n),
    n,
    "pulled dv has right vals"
  )
  const dv2arr = dv => {
    const a = [];
    for(let i = 0; i < dv.byteLength; i++){
      a.push(dv.getUint8(i))
    }
    return a
  }  
  const frseqs = [
    [[13,23,33,43],53],
    [[13,23,34,44,54],64],
    [[13,33,33,43],73],
    [[14,43,53,63],83],
    [[15,23,33,43],93],
    [[16,23,33,43],23],
    [[16,33,33,43],33],
    [[17,23,33,43],43],
  ]
  const frart = new ART()
  for(let pair of frseqs){
    frart.insert(...pair)
  }
  /*console.log([...(frart.iter([]))].map(
      ([k,v])=>[dv2arr(k).join("#"),v].join("$")
    ).join("|"))*/
  // expect(
  //   [...(frart.iter([]))].map(
  //     ([k,v])=>[dv2arr(k).join("#"),v].join("$")
  //   ).join("|"),
  //   "13#23#33#43$53|13#23#34#44#54$64|13#33#33#43$73|14#43#53#63$83|15#23#33#43$93|16#23#33#43$23|16#33#33#43$33|17#23#33#43$43",
  //   "full range iteration correct w/ empty query"
  // )
  const binCompF64 = await buildBinCompF64(
    getWASMBuffer("./RankF64.wasm")
  )
  const fixOnlyCompKeys = [
    [[-2095.55, 450.25, -45],5],
    [[-2095.55, 660.7, 90],15],
    [[-2095.55, 713.1, 135],25],
    [[-2095.55, 1004.92, 180],35],
    [[-1498.87, -123.23, 0], 45],
    [[-1498.87, -0.0135, -15], 55],
    [[-1498.87, -0.0135, -13], 65],
    [[-1498.87, 132.32, -0], 75],
    [[427.17, -123.23, 0], 85],
    [[427.17, -0.0135, -15], 95],
    [[427.17, -0.0135, -13], 105],
    [[427.17, 132.32, -0], 115],
    [[557.00934, 14.6, -5], 125]
  ].map(record => ([
    record[0].map(
      fl => binCompF64(fl)
    ).reduce(
      (acc, cur, idx) => {
        for(let i = 0; i < cur.byteLength; i++) acc[( idx * 9 ) + i] = cur.getUint8(i)
        return acc
      },
      new Uint8Array(9*3)
    ),
    record[1]
  ]))
  const fockArt = new ART()
  for(let pair of fixOnlyCompKeys){
    // console.log("FOCKART.INS:", pair[0], pair[1])
    fockArt.insert(pair[0], pair[1])
  }
  /*
  console.log("debug")
  console.log(fockArt.root)
  console.log("=============")
  console.log(fockArt.root[1][0][0].charCodeAt(0))
  console.log("=============")
  console.log(fockArt.root[1][0])
  console.log("debug")
  */
  //console.log("start rangeQ")
  // console.log("\nCASE 1\n")
  // expect(
  //   [...(fockArt.query([
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -2100,
  //       upperBoundKey: -2000
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: 600,
  //       upperBoundKey: 800
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -0,
  //       upperBoundKey: 150
  //     },
  //     {
  //       componentType: LEAF_COMPONENT
  //     }
  //   ].map(
  //     query => ({
  //       ...query,
  //       lowerBoundKey: new Uint8Array(binCompF64(query.lowerBoundKey).buffer),
  //       upperBoundKey: new Uint8Array(binCompF64(query.upperBoundKey).buffer)
  //     })
  //   )))].join("|"),
  //   "15|25", 
  //   "3x fixed compound key fwd traversal #1"
  // ) 
  // console.log("\nCASE 2\n")
  // expect(
  //   [...(fockArt.query([
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -2095.55,
  //       upperBoundKey: -2000
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: 600,
  //       upperBoundKey: 713.1
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -0,
  //       upperBoundKey: 150
  //     },
  //     {
  //       componentType: LEAF_COMPONENT
  //     }
  //   ].map(
  //     query => ({
  //       ...query,
  //       lowerBoundKey: new Uint8Array(binCompF64(query.lowerBoundKey).buffer),
  //       upperBoundKey: new Uint8Array(binCompF64(query.upperBoundKey).buffer)
  //     })
  //   )))].join("|"),
  //   "15|25", 
  //   "3x fixed compound key fwd traversal #2"
  // ) 
  // console.log("\nCase 3\n")
  // expect(
  //   [...(fockArt.query([
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -2095.55,
  //       upperBoundKey: -1000
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -1,
  //       upperBoundKey: 713.1
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -15,
  //       upperBoundKey: 150
  //     },
  //     {
  //       componentType: LEAF_COMPONENT
  //     }
  //   ].map(
  //     query => ({
  //       ...query,
  //       lowerBoundKey: new Uint8Array(binCompF64(query.lowerBoundKey).buffer),
  //       upperBoundKey: new Uint8Array(binCompF64(query.upperBoundKey).buffer)
  //     })
  //   )))].join("|"),
  //   "15|25|55|65|75", 
  //   "3x fixed compound key fwd traversal #3"
  // ) 
  // console.log("\nCase 4\n")
  // expect(
  //   [...(fockArt.query([
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -2095.55,
  //       upperBoundKey: -1000
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: REVERSE,
  //       length: 9,
  //       lowerBoundKey: -1,
  //       upperBoundKey: 713.1
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -15,
  //       upperBoundKey: 150
  //     },
  //     {
  //       componentType: LEAF_COMPONENT
  //     }
  //   ].map(
  //     query => ({
  //       ...query,
  //       lowerBoundKey: new Uint8Array(binCompF64(query.lowerBoundKey).buffer),
  //       upperBoundKey: new Uint8Array(binCompF64(query.upperBoundKey).buffer)
  //     })
  //   )))].join("|"),
  //   "75|55|65|25|15",
  //   "3x fixed compound key fwd-rev-fwd traversal #4"
  // )
  const FRseqs = [
    [[11,21,31,41,51],5],
    [[11,21,32,42,52],15],
    [[11,21,33,43,53],25],
    [[11,21,34,44,54],35],
    [[11,22,35,45,55],45],
    [[11,22,36,46,56],55],
    [[11,22,37,47,57],65]
  ];
  const fullRangeART = new ART();
  for(let pair of FRseqs) fullRangeART.insert(...pair); 
  let pcix = 0
  for(let pair of FRseqs){
    const p = pair[0]
    for(let i = p.length-1; i>-1; i--){
      const prfx = p.slice(0,i)
      expect(
        fullRangeART.hasPrefix(prfx),
        true,
        `hasPrefix ${pcix}-${i}`
      )
    }
    pcix++
  }
  expect(
    [...(fullRangeART.fullFwdRangeV())].join("|"),
    "5|15|25|35|45|55|65",
    "full forward range iteration"
  ) 
  expect(
    [...(fullRangeART.fullRevRangeV())].join("|"),
    "65|55|45|35|25|15|5",
    "full reverse range iteration"
  ) 
  expect(
    [
      ...(
        fullRangeART.allWithPrefixFwdV(
          [11, 21]
        )
      )
    ].join("|"),
    "5|15|25|35",
    "forward range with prefix"
  ) 
  expect(
    [
      ...(
        fullRangeART.allWithPrefixRevV(
          [11, 21]
        )
      )
    ].join("|"),
    "35|25|15|5",
    "reverse range with prefix"
  ) 
  expect(
    [...(fullRangeART.fullFwdRangeKV())].map(
      p => [dv2arr(p[0]).join(","),p[1]].join("],")
    ).join("|"),
    "11,21,31,41,51],5|11,21,32,42,52],15|11,21,33,43,53],25|11,21,34,44,54],35|11,22,35,45,55],45|11,22,36,46,56],55|11,22,37,47,57],65",
    "full forward kv range iteration"
  ) 
  expect(
    [...(fullRangeART.allWithPrefixFwdKV([11,22]))].map(
      p => [dv2arr(p[0]).join(","),p[1]].join("~")
    ).join("|"),
    "11,22,35,45,55~45|11,22,36,46,56~55|11,22,37,47,57~65",
    "allprefix fwd kv"
  )
  expect(
    [...(fullRangeART.fullRevRangeKV())].map(
      p => [dv2arr(p[0]).join(","),p[1]].join("],")
    ).join("|"),
    "11,21,31,41,51],5|11,21,32,42,52],15|11,21,33,43,53],25|11,21,34,44,54],35|11,22,35,45,55],45|11,22,36,46,56],55|11,22,37,47,57],65".split("|").reverse().join("|"),
    "full reverse kv range iteration"
  ) 
  expect(
    [...(fullRangeART.allWithPrefixRevKV([11,22]))].map(
      p => [dv2arr(p[0]).join(","),p[1]].join("~")
    ).join("|"),
    "11,22,35,45,55~45|11,22,36,46,56~55|11,22,37,47,57~65".split("|").reverse().join("|"),
    "allprefix rev kv"
  )
  const varkeys = [
    '’Twas brillig, and the slithy toves', 
    'Did gyre and gimble in the wabe:',
    'All mimsy were the borogoves,',
    'And the mome raths outgrabe.',
    '“Beware the Jabberwock, my son!',
    'The jaws that bite, the claws that catch!',
    'Beware the Jubjub bird, and shun',
    'The frumious Bandersnatch!”',
    'He took his vorpal sword in hand;',
    'Long time the manxome foe he sought—',
    'So rested he by the Tumtum tree',
    'And stood awhile in thought.',
    'And, as in uffish thought he stood,',
    'The Jabberwock, with eyes of flame,',
    'Came whiffling through the tulgey wood,',
    'And burbled as it came!',
    'One, two! One, two! And through and through',
    'The vorpal blade went snicker-snack!',
    'He left it dead, and with its head',
    'He went galumphing back.',
    '“And hast thou slain the Jabberwock?',
    'Come to my arms, my beamish boy!',
    'O frabjous day! Callooh! Callay!”',
    'He chortled in his joy.',
    '’Twas brillig, and the slithy toves',
    'Did gyre and gimble in the wabe:', 
    'All mimsy were the borogoves,',
    'And the mome raths outgrabe.'
  ]
  const vkt = new ART()
  for(let i = 0; i < varkeys.length; i++){
    const sk = Latin1.getL1SortKey(varkeys[i])
    const cle = new Uint8Array(sk.length+1)
    for(let j = 0; j < sk.length; j++) cle[j] = sk[j]
    cle[sk.length] = i
    vkt.insert(cle, i)
  }
  /*
  for(
    let pk of vkt.query([
      {
        componentType: VARIABLE_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        lowerBoundKey: Latin1.getL1SortKey(String.fromCharCode(0)),
        upperBoundKey: Latin1.getL1SortKey(
          Array.from(
            { 
              length: 256 
            }, 
            _ => String.fromCharCode(255)
          ).join("")
        ),
        sentinel: 0
      }, {
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 1,
        lowerBoundKey: 0,
        upperBoundKey: 255
      }, {
        componentType: LEAF_COMPONENT
      }
    ])
  ) console.log(pk)*/
  // for(let v of vkt.fullFwdRangeV()) console.log(varkeys[v[0]])
  // for(let v of vkt.allWithPrefixFwdV(Latin1.getL1SortKey("And").slice(0,3))) console.log(varkeys[v[0]])
  // expect(
  //   [...(fockArt.query([
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -2095.55,
  //       upperBoundKey: -1000
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: REVERSE,
  //       length: 9,
  //       lowerBoundKey: -1,
  //       upperBoundKey: 713.1
  //     },
  //     { 
  //       componentType: FIXED_LENGTH_KEY,
  //       lowerInclusivity: LOWER_BOUND_INCLUSIVE,
  //       upperInclusivity: UPPER_BOUND_INCLUSIVE,
  //       order: FORWARD,
  //       length: 9,
  //       lowerBoundKey: -15,
  //       upperBoundKey: 150,
  //       limit:1
  //     },
  //     {
  //       componentType: LEAF_COMPONENT
  //     }
  //   ].map(
  //     query => ({
  //       ...query,
  //       lowerBoundKey: new Uint8Array(binCompF64(query.lowerBoundKey).buffer),
  //       upperBoundKey: new Uint8Array(binCompF64(query.upperBoundKey).buffer)
  //     })
  //   )))].join("|"),
  //   "75",
  //   "3x fixed compound key fwd-rev-fwd traversal #5"
  // )
  // boundedRangeFixN tests
  /**
   * LB
   * UB
   * LEN
   * LI
   * UI
   * order
   * limit
   * root
   */ 
      /*
       * boundedRangeFixN_new sig
       * - lb buffer
       * - ub buffer
       * - key length
       * - low inclusivity
       * - hi inclusivity
       * - order
       * - root node ref
       */
  expect(
    [
      ...(
        function*(){
          for(let i of fockArt.boundedRangeFixN(
            new Uint8Array(binCompF64(-2100).buffer),
            new Uint8Array(binCompF64(-2000).buffer),
            9,
            LOWER_BOUND_INCLUSIVE,
            UPPER_BOUND_INCLUSIVE,
            FORWARD, 
            fockArt.root
          )){
            for(let j of fockArt.boundedRangeFixN(
              new Uint8Array(binCompF64(600).buffer),
              new Uint8Array(binCompF64(800).buffer),
              9,
              LOWER_BOUND_INCLUSIVE,
              UPPER_BOUND_INCLUSIVE,
              FORWARD,
              i
            )){
              for(let k of fockArt.boundedRangeFixN(
                new Uint8Array(binCompF64(-0).buffer),
                new Uint8Array(binCompF64(150).buffer),
                9,
                LOWER_BOUND_INCLUSIVE,
                UPPER_BOUND_INCLUSIVE,
                FORWARD,
                j
              )) yield k
            }
          }
        }
      )()
    ].join("|"),
    "15|25", 
    "3x boundedRangeFixN #1"
  )  
      /*
       * boundedRangeFixN_new sig
       * - lb buffer
       * - ub buffer
       * - key length
       * - low inclusivity
       * - hi inclusivity
       * - order
       * - root node ref
       */
  expect(
    [
      ...(
        function*(){
          for(let i of fockArt.boundedRangeFixN(
            new Uint8Array(binCompF64(-2095.55).buffer),
            new Uint8Array(binCompF64(-2000).buffer),
            9,
            LOWER_BOUND_INCLUSIVE,
            UPPER_BOUND_INCLUSIVE,
            FORWARD,
            fockArt.root
          )){
            for(let j of fockArt.boundedRangeFixN(
              new Uint8Array(binCompF64(600).buffer),
              new Uint8Array(binCompF64(713.1).buffer),
              9,
              LOWER_BOUND_INCLUSIVE,
              UPPER_BOUND_INCLUSIVE,
              FORWARD,
              i
            )){
              for(let k of fockArt.boundedRangeFixN(
                new Uint8Array(binCompF64(-0).buffer),
                new Uint8Array(binCompF64(150).buffer),
                9,
                LOWER_BOUND_INCLUSIVE,
                UPPER_BOUND_INCLUSIVE,
                FORWARD,
                j
              )) yield k
            }
          }
        }
      )()
    ].join("|"),
    "15|25", 
    "3x boundedRangeFixN #2"
  )  
      /*
       * boundedRangeFixN_new sig
       * - lb buffer
       * - ub buffer
       * - key length
       * - low inclusivity
       * - hi inclusivity
       * - order
       * - root node ref
       */
  expect(
    [
      ...(
        function*(){
          for(let i of fockArt.boundedRangeFixN(
            new Uint8Array(binCompF64(-2095.55).buffer),
            new Uint8Array(binCompF64(-1000).buffer),
            9,
            LOWER_BOUND_INCLUSIVE,
            UPPER_BOUND_INCLUSIVE,
            FORWARD,
            fockArt.root
          )){
            for(let j of fockArt.boundedRangeFixN(
              new Uint8Array(binCompF64(-1).buffer),
              new Uint8Array(binCompF64(713.1).buffer),
              9,
              LOWER_BOUND_INCLUSIVE,
              UPPER_BOUND_INCLUSIVE,
              FORWARD,
              i
            )){
              for(let k of fockArt.boundedRangeFixN(
                new Uint8Array(binCompF64(-15).buffer),
                new Uint8Array(binCompF64(150).buffer),
                9,
                LOWER_BOUND_INCLUSIVE,
                UPPER_BOUND_INCLUSIVE,
                FORWARD,
                j
              )) yield k
            }
          }
        }
      )()
    ].join("|"),
    "15|25|55|65|75", 
    "3x boundedRangeFixN #3"
  )  
      /*
       * boundedRangeFixN_new sig
       * - lb buffer
       * - ub buffer
       * - key length
       * - low inclusivity
       * - hi inclusivity
       * - order
       * - root node ref
       */
  expect(
    [
      ...(
        function*(){
          let q = []
          for(let i of fockArt.boundedRangeFixN(
            new Uint8Array(binCompF64(-2095.55).buffer),
            new Uint8Array(binCompF64(-1000).buffer),
            9,
            LOWER_BOUND_INCLUSIVE,
            UPPER_BOUND_INCLUSIVE,
            FORWARD,
            fockArt.root
          )) q.push(i)
          q.reverse()
          for(let qi of q){
            for(let j of fockArt.boundedRangeFixN(
              new Uint8Array(binCompF64(-1).buffer),
              new Uint8Array(binCompF64(713.1).buffer),
              9,
              LOWER_BOUND_INCLUSIVE,
              UPPER_BOUND_INCLUSIVE,
              REVERSE,
              qi
            )){ 
              for(let k of fockArt.boundedRangeFixN(
                new Uint8Array(binCompF64(-15).buffer),
                new Uint8Array(binCompF64(150).buffer),
                9,
                LOWER_BOUND_INCLUSIVE,
                UPPER_BOUND_INCLUSIVE,
                FORWARD,
                j
              )) yield k
            }
          }
        }
      )()
    ].join("|"),
    "75|55|65|25|15", 
    "3x boundedRangeFixN #4 fwd-rev-fwd"
  )
  expect(
    [
      ...(
        function*(){
          for(let i of vkt.boundedRangeVarN(
            Latin1.getL1SortKey("And"),
            Latin1.getL1SortKey("He"),
            0,
            LOWER_BOUND_INCLUSIVE,
            UPPER_BOUND_INCLUSIVE,
            FORWARD
          )){
            // console.log("DBG1638", i)
            for(let j of vkt.boundedRangeFixN(
              new Uint8Array([0]),
              new Uint8Array([255]),
              1,
              LOWER_BOUND_INCLUSIVE,
              UPPER_BOUND_INCLUSIVE,
              FORWARD,
              i[1]
            )) yield j
          }
        }
      )()
    ].map(v=>v[0]).join("|"),
    "15|11|3|27|12|6|14|21|1|25|23|18|8|19",
    "bounded L1 jabberwocky range"
  )
  for(let boundCombo of [
    "LIRE",
    "LERI",
    "LIRI",
    "LERE"
  ]){
    for(let i = 0; i < 6; i++){
      const T = new ART()
      const orderedUniqueDoubles = [...(new Set(
        Array.from({
          length: 660
        }, ()=>Math.random()*1000).map(
          n=>Math.random()>.5?n:-n
        )
      ))].sort((a, b) => a - b)
      for(let j = 0; j < orderedUniqueDoubles.length; j++) T.insert(
        new Uint8Array(binCompF64(
          orderedUniqueDoubles[j]
        ).buffer),
        j
      )
      //console.log(T.root,T.size)
      const lowerIndex = Math.floor(orderedUniqueDoubles.length / 3)
      const upperIndex = lowerIndex * 2
      let target
      let rtarget
      let LB
      let UB
      let LI
      let UI
      switch(boundCombo){
        case "LIRE": { 
          target = orderedUniqueDoubles.map((_,i)=>i).slice(lowerIndex, upperIndex).join("~")
          rtarget = orderedUniqueDoubles.map((_,i)=>i).slice(lowerIndex, upperIndex).reverse().join("~")
          LB = orderedUniqueDoubles[lowerIndex]
          UB = orderedUniqueDoubles[upperIndex] 
          LI = lowerIndex
          UI = upperIndex
          break
        }
        case "LERI": { 
          target = orderedUniqueDoubles.map((_,i)=>i).slice(lowerIndex+1, upperIndex+2).join("~")
          rtarget = orderedUniqueDoubles.map((_,i)=>i).slice(lowerIndex+1, upperIndex+2).reverse().join("~")
          LB = orderedUniqueDoubles[lowerIndex]
          UB = orderedUniqueDoubles[upperIndex+1] 
          LI = lowerIndex
          UI = upperIndex+1
          break
        }
        case "LIRI": { 
          target = orderedUniqueDoubles.map((_,i)=>i).slice(lowerIndex, upperIndex+2).join("~")
          rtarget = orderedUniqueDoubles.map((_,i)=>i).slice(lowerIndex, upperIndex+2).  reverse().join("~")
          LB = orderedUniqueDoubles[lowerIndex]
          UB = orderedUniqueDoubles[upperIndex+1] 
          LI = lowerIndex
          UI = upperIndex+1
          break
        }
        default: { 
          target = orderedUniqueDoubles.map((_,i)=>i).slice(lowerIndex+1, upperIndex).join("~")
          rtarget = orderedUniqueDoubles.map((_,i)=>i).slice(lowerIndex+1, upperIndex).reverse().join("~")
          LB = orderedUniqueDoubles[lowerIndex]
          UB = orderedUniqueDoubles[upperIndex] 
          LI = lowerIndex
          UI = upperIndex

          break
        }
      } 
      /*
       * boundedRangeFixN_new sig
       * - lb buffer
       * - ub buffer
       * - key length
       * - low inclusivity
       * - hi inclusivity
       * - order
       * - root node ref
       */
      expect(
        //"test log, LB", LB,"LI",LI, "UB",UB, "UI",UI,
        target,
        [...(
          T.boundedRangeFixN(
            new Uint8Array(binCompF64(LB).buffer),
            new Uint8Array(binCompF64(UB).buffer),
            9,
            boundCombo.startsWith("LI") ? LOWER_BOUND_INCLUSIVE : EXCLUSIVE,
            boundCombo.endsWith("RI") ?  UPPER_BOUND_INCLUSIVE : EXCLUSIVE,
            FORWARD,
            T.root
          )
        )].map(v=>v[0]).join("~"),
        boundCombo + " " + i,
        "bounded fixed fwd ranges autogen #"+i
      ) 
      expect(
        //"test log, LB", LB,"LI",LI, "UB",UB, "UI",UI,
        rtarget,
        [...(
          T.boundedRangeFixN(
            new Uint8Array(binCompF64(LB).buffer),
            new Uint8Array(binCompF64(UB).buffer),
            9,
            boundCombo.startsWith("LI") ? LOWER_BOUND_INCLUSIVE : EXCLUSIVE,
            boundCombo.endsWith("RI") ?  UPPER_BOUND_INCLUSIVE : EXCLUSIVE,
            REVERSE,
            T.root
          )
        )].map(v=>v[0]).join("~"),
        boundCombo + " " + i,
        "bounded fixed rev ranges autogen #"+i
      )

    }
  }
  let twoD = []
  for(let i = 0; i < 10000; i++){
    const a = Math.random() * 10000
    const b = Math.random() * 10000
    twoD.push({
      a,
      b,
      k: a + "|" + b,
      bca: binCompF64(a,new DataView(new ArrayBuffer(18)))
    })
  }
  for(let e of twoD){ 
    e.ck = new Uint8Array(
      binCompF64(e.b,e.bca,9).buffer
    )
  }
  twoD = new Map(
    twoD.map(o=>[o.k,({a: o.a,b: o.b,ck: o.ck})])
  )
  twoD = [...twoD.entries()].map(
    ([k,{a,b,ck}]) => ({k,a,b,ck})
  )
  const twoDart = new ART()
  for(let i = 0; i < twoD.length; i++) twoDart.insert(twoD[i].ck,i)
  const twoDTestRanges = []
  for(let i = 0; i < 1000; i++){
    twoDTestRanges.push({ 
      lb1: Math.random() *5000,
      ub1: Math.random() *5000+5000,
      l1inc: Math.random()>.5,
      u1inc: Math.random()>.5, 
      lb2: Math.random() *5000,
      ub2: Math.random() *5000+5000,
      l2inc: Math.random()>.5,
      u2inc: Math.random()>.5
    })
  }
  for(let d = 0; d<twoDTestRanges.length; d++){
    const testRange = twoDTestRanges[d]
    console.log(d,"DEBUG, TESTRANGE START")
    let target = []
    for(let i = 0; i < twoD.length; i++){
      const tuple = twoD[i]
      // k, a, b, ck
      const {
        lb1, ub1,
        l1inc, u1inc,
        lb2, ub2,
        l2inc, u2inc
      } = testRange
      let omatch = false 
      let imatch = false 
      if(
        (
          (
            l1inc && lb1 >= tuple.a
          ) || lb1 > tuple.a
        ) && (
          (
            u1inc && ub1 <= tuple.a
          ) || ub1 < tuple.a
        )
      ) omatch = true 
      if(
        (
          (
            l2inc && lb2 >= tuple.b
          ) || lb2 > tuple.b
        ) && (
          (
            u2inc && ub2 <= tuple.b
          ) || ub2 < tuple.b
        )
      ) imatch = true
      if(omatch && imatch) target.push(i)
    }
    target.sort(
      (x,y) => {
        const tx = twoD[x]
        const ty = twoD[y]
        if(tx.a == ty.a){
          return tx.b - ty.b
        } else {
          return tx.a - ty.a
        }
      }
    )
    expect(
      [
        ...(
          function*(){
            for(let i of twoDart.boundedRangeFixN( 
              new Uint8Array(binCompF64(testRange.lb1).buffer),
              new Uint8Array(binCompF64(testRange.ub1).buffer),
              9,
              testRange.l1inc ? LOWER_BOUND_INCLUSIVE : EXCLUSIVE,
              testRange.u1inc ?  UPPER_BOUND_INCLUSIVE : EXCLUSIVE,
              FORWARD
            )){
              for(let j of twoDart.boundedRangeFixN( 
                new Uint8Array(binCompF64(testRange.lb2).buffer),
                new Uint8Array(binCompF64(testRange.ub2).buffer),
                9,
                testRange.l2inc ? LOWER_BOUND_INCLUSIVE : EXCLUSIVE,
                testRange.u12nc ?  UPPER_BOUND_INCLUSIVE : EXCLUSIVE,
                FORWARD,
                i[1]
              )) yield j
            }
          }
        )()
      ].map(v=>v[0]).join("|"),
      target.join("|"),
      "boundedRangeFixN 2D - autogen iteration" 
    )
    const blart = new ART()
    blart.bulkLoad([
      [
        new Uint8Array([1,2,3]),
        42
      ],[
        new Uint8Array([1,3,5,7,9]),
        24
      ],[
        new Uint8Array([2,4,6,56]),
        31
      ],[
        new Uint8Array([3,5,7]),
        13
      ],[
        new Uint8Array([4,6,8,8,8]),
        64
      ],[
        new Uint8Array([4,7,1]),
        2
      ]
    ])
    expect(
      [
        ...(blart.fullFwdRangeV()),
      ].map(nl=>nl[0]).join("~"),
      "42~24~31~13~64~2",
      "range after bulk load"
    )
    function generateTestLists({
      sizeA = 100,
      sizeB = 100,
      overlap = 0.3, // 30% overlap
      min = 1,
      max = 1000
    } = {}){
      const totalUnique = Math.floor(sizeA + sizeB - (overlap * Math.min(sizeA, sizeB)))

      const pool = new Set()
      while(pool.size < totalUnique){
        pool.add(Math.floor(Math.random() * (max - min + 1)) + min)
      }

      const poolArray = Array.from(pool)
      const overlapSize = Math.floor(overlap * Math.min(sizeA, sizeB))
      const shared = poolArray.splice(0, overlapSize)
      const remaining = poolArray
      const uniqueA = remaining.splice(0, sizeA - overlapSize)
      const uniqueB = remaining.splice(0, sizeB - overlapSize)
      const listA = [...shared, ...uniqueA].sort((a, b) => a - b)
      const listB = [...shared, ...uniqueB].sort((a, b) => a - b)

      return { 
        listA, 
        listB 
      }
    } 
    const { 
      listA, 
      listB 
    } = generateTestLists()
    const artA = new ART() 
    const avlA = new AVL(listA.map((v,i)=>[v,i])) 
    artA.bulkLoad( 
      listA.map(
        (v,i)=>{
          const d = new DataView(
            new ArrayBuffer(2)
          )
          d.setUint16(0,v,false)
          return [new Uint8Array(d.buffer),i]
        }
      )
    )
    const artB = new ART() 
    const avlB = new AVL(listB.map((v,i)=>[v,i]))
    artB.bulkLoad(
      listB.map(
        (v,i)=>{
          const d = new DataView(
            new ArrayBuffer(2)
          )
          d.setUint16(0,v,false)
          return [new Uint8Array(d.buffer),i]
        }
      )
    )
    const artC = ART.union(artA,artB)
    expect(
      [
        ...(AVL.union(avlA,avlB))
      ].map(v=>v[5] instanceof Array ? v[5].join("~") : v[5]).join("|"),
      [
        ...(artC.fullFwdRangeV())
      ].map(v=>v.length>1 ? v.join("~") : v[0]).join("|"),
      "union avl == union art"
    ) 
    // large union
    const { 
      listA: listD, 
      listB: listE 
    } = generateTestLists(
      500,
      600,
      0.3,
      1,
      75000
    )
    console.log("lg union")//, listD, listE)
    const artD = new ART() 
    const avlD = new AVL(listD.map((v,i)=>[v,i])) 
    console.log("avlD loaded")
    artD.bulkLoad( 
      listD.map(
        (v,i)=>{
          const k = new Uint8Array(binCompF64(
            v
          ).buffer)
          return [k,i]
        }
      )
    )
    console.log("artD loaded")
    const artE = new ART() 
    const avlE = new AVL(listE.map((v,i)=>[v,i]))
    console.log("avlE loaded")
    artE.bulkLoad(
      listE.map(
        (v,i)=>{
          const k = new Uint8Array(binCompF64(
            v
          ).buffer)
          return [k,i]
        }
      )
    )
    console.log("artE loaded")
    const artF = ART.union(artD,artE,false)
    expect(
      [
        ...(AVL.union(avlD,avlE))
      ].map(v=>v[5] instanceof Array ? v[5].join("~") : v[5]).join("|"),
      [
        ...(artF.fullFwdRangeV())
      ].map(v=>v.length>1 ? v.join("~") : v[0]).join("|"),
      "union avl == union art 2"
    )
    console.log("finished large union")
  }
  dump(true);
})()
