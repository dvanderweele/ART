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
  expect(
    [...(frart.iter([]))].map(
      ([k,v])=>[dv2arr(k).join("#"),v].join("$")
    ).join("|"),
    "13#23#33#43$53|13#23#34#44#54$64|13#33#33#43$73|14#43#53#63$83|15#23#33#43$93|16#23#33#43$23|16#33#33#43$33|17#23#33#43$43",
    "full range iteration correct w/ empty query"
  )
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
    fockArt.insert(pair[0], pair[1])
  }
  //console.log("start rangeQ")
  expect(
    [...(fockArt.query([
      { 
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 9,
        lowerBoundKey: -2100,
        upperBoundKey: -2000
      },
      { 
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 9,
        lowerBoundKey: 600,
        upperBoundKey: 800
      },
      { 
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 9,
        lowerBoundKey: -0,
        upperBoundKey: 150
      },
      {
        componentType: LEAF_COMPONENT
      }
    ].map(
      query => ({
        ...query,
        lowerBoundKey: new Uint8Array(binCompF64(query.lowerBoundKey).buffer),
        upperBoundKey: new Uint8Array(binCompF64(query.upperBoundKey).buffer)
      })
    )))].join("|"),
    "15|25", 
    "3x fixed compound key fwd traversal #1"
  ) 
  console.log("\nCASE 2\n")
  expect(
    [...(fockArt.query([
      { 
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 9,
        lowerBoundKey: -2095.55,
        upperBoundKey: -2000
      },
      { 
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 9,
        lowerBoundKey: 600,
        upperBoundKey: 713.1
      },
      { 
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 9,
        lowerBoundKey: -0,
        upperBoundKey: 150
      },
      {
        componentType: LEAF_COMPONENT
      }
    ].map(
      query => ({
        ...query,
        lowerBoundKey: new Uint8Array(binCompF64(query.lowerBoundKey).buffer),
        upperBoundKey: new Uint8Array(binCompF64(query.upperBoundKey).buffer)
      })
    )))].join("|"),
    "15|25", 
    "3x fixed compound key fwd traversal #2"
  ) 
  console.log("\nCase 3\n")
  console.log(
    [...(fockArt.query([
      { 
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 9,
        lowerBoundKey: -2095.55,
        upperBoundKey: -1000
      },
      { 
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 9,
        lowerBoundKey: -1,
        upperBoundKey: 713.1
      },
      { 
        componentType: FIXED_LENGTH_KEY,
        lowerInclusivity: LOWER_BOUND_INCLUSIVE,
        upperInclusivity: UPPER_BOUND_INCLUSIVE,
        order: FORWARD,
        length: 9,
        lowerBoundKey: -15,
        upperBoundKey: 150
      },
      {
        componentType: LEAF_COMPONENT
      }
    ].map(
      query => ({
        ...query,
        lowerBoundKey: new Uint8Array(binCompF64(query.lowerBoundKey).buffer),
        upperBoundKey: new Uint8Array(binCompF64(query.upperBoundKey).buffer)
      })
    )))].join("|"),
    "15|25|55|65", 
    "3x fixed compound key fwd traversal #3"
  )

  dump(true);
})()
