import {
  BitMap
} from "./bitmap.js"
import {
  expectation
} from "./utils.js"

const [expect, dump] = expectation();
expect(true, false, "canary failure")

const bmp = new BitMap(2)
console.log(bmp.toString())
for(let r of [0,1,2,30,31,32,33,62,63]){
  console.log("set",r,"\n")
  bmp.setRank(r)
  console.log(bmp.toString())
  console.log("###########\n")
}
console.log("fsr",bmp.firstSetRank())
console.log("fur",bmp.firstUnsetRank())
console.log("unset 0")
bmp.unsetRank(0)
console.log(bmp.toString())
console.log([...bmp].join("¥"))
console.log("###########\n")
console.log("fsr",bmp.firstSetRank())
console.log("fur",bmp.firstUnsetRank())
console.log("unset 1")
bmp.unsetRank(1)
console.log(bmp.toString())
console.log(bmp[Symbol.iterator])
console.log([...bmp].join("¥"))
bmp[Symbol.iterator] = BitMap.ITER_UNSETS
console.log(28,BitMap.ITER_UNSETS)
console.log(bmp[Symbol.iterator])
console.log([...bmp].join("•"))
console.log("###########\n")
bmp[Symbol.iterator] = BitMap.ITER_ALL
for(let v of bmp) console.log("v",v)
console.log(bmp.isSet(0),0)
console.log(bmp.isSet(1),1)
console.log(bmp.isSet(2),2)


const ge_le_tsts = [
  [
    4, // ranks 0 - 127
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0,  // lb
      127 // ub
    ],
    "0~25~31~32~50~75~100~125~127"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 126
    ],
    "0~25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 125
    ],
    "0~25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      10, 125
    ],
    "25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      25, 125
    ],
    "25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      75, 75
    ],
    "75"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      76, 75
    ],
    ""
  ]
];
let i = 0
for(let t of ge_le_tsts){
  const bmp = new BitMap(t[0])
  bmp.ITER_LB = t[2][0]
  bmp.ITER_UB = t[2][1]
  bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GE_TO_LE
  for(let n of t[1]) bmp.setRank(n)
  //console.log(true,bmp.isSet(31))
  i++
  /*console.log("i",i,"l",t[2][0],"u",t[2][1], 
    [...bmp].join("~"),
    " ||| ",
    t[3]
  )*/
  expect(
    [...bmp].join("~")
    , t[3],
    "ge_le__"+i
  )
}
const ge_lt_tsts = [
  [
    4, // ranks 0 - 127
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0,  // lb
      127 // ub
    ],
    "0~25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 126
    ],
    "0~25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 125
    ],
    "0~25~31~32~50~75~100"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      10, 125
    ],
    "25~31~32~50~75~100"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      25, 125
    ],
    "25~31~32~50~75~100"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      75, 75
    ],
    ""
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      76, 75
    ],
    ""
  ]
];
i = 0
for(let t of ge_lt_tsts){
  const bmp = new BitMap(t[0])
  bmp.ITER_LB = t[2][0]
  bmp.ITER_UB = t[2][1]
  bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GE_TO_LT
  for(let n of t[1]) bmp.setRank(n)
  i++
  expect(
    [...bmp].join("~")
    , t[3],
    "ge_lt__"+i
  )
}
const gt_le_tsts = [
  [
    4, // ranks 0 - 127
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0,  // lb
      127 // ub
    ],
    "25~31~32~50~75~100~125~127"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 126
    ],
    "25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 125
    ],
    "25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      10, 125
    ],
    "25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      25, 125
    ],
    "31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      75, 75
    ],
    ""
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      76, 75
    ],
    ""
  ]
];
i = 0
for(let t of gt_le_tsts){
  const bmp = new BitMap(t[0])
  bmp.ITER_LB = t[2][0]
  bmp.ITER_UB = t[2][1]
  bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GT_TO_LE
  for(let n of t[1]) bmp.setRank(n)
  i++
  expect(
    [...bmp].join("~")
    , t[3],
    "gt_le__"+i
  )
}
const gt_lt_tsts = [
  [
    4, // ranks 0 - 127
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0,  // lb
      127 // ub
    ],
    "25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 126
    ],
    "25~31~32~50~75~100~125"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 125
    ],
    "25~31~32~50~75~100"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      10, 125
    ],
    "25~31~32~50~75~100"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      25, 125
    ],
    "31~32~50~75~100"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      75, 75
    ],
    ""
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      76, 75
    ],
    ""
  ]
];
i = 0
for(let t of gt_lt_tsts){
  const bmp = new BitMap(t[0])
  bmp.ITER_LB = t[2][0]
  bmp.ITER_UB = t[2][1]
  bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GT_TO_LT
  for(let n of t[1]) bmp.setRank(n)
  i++
  /*console.log(
    [...bmp].join("~"),
    t[3]
  )*/
  expect(
    [...bmp].join("~")
    , t[3],
    "gt_lt__"+i
  )
}
const le_ge_tsts = [
  [
    4, // ranks 0 - 127
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0,  // lb
      127 // ub
    ],
    "127~125~100~75~50~32~31~25~0"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 126
    ],
    "125~100~75~50~32~31~25~0"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 125
    ],
    "125~100~75~50~32~31~25~0"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      10, 125
    ],
    "125~100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      25, 125
    ],
    "125~100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      75, 75
    ],
    "75"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      76, 75
    ],
    ""
  ]
];
i = 0
for(let t of le_ge_tsts){
  const bmp = new BitMap(t[0])
  bmp.ITER_LB = t[2][0]
  bmp.ITER_UB = t[2][1]
  bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LE_TO_GE
  for(let n of t[1]) bmp.setRank(n)
  i++
  expect(
    [...bmp].join("~")
    , t[3],
    "le_ge__"+i
  )
}
const le_gt_tsts = [
  [
    4, // ranks 0 - 127
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0,  // lb
      127 // ub
    ],
    "127~125~100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 126
    ],
    "125~100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 125
    ],
    "125~100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      10, 125
    ],
    "125~100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      25, 125
    ],
    "125~100~75~50~32~31"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      75, 75
    ],
    ""
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      76, 75
    ],
    ""
  ]
];
i=0
for(let t of le_gt_tsts){
  const bmp = new BitMap(t[0])
  bmp.ITER_LB = t[2][0]
  bmp.ITER_UB = t[2][1]
  bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LE_TO_GT
  for(let n of t[1]) bmp.setRank(n)
  i++
  expect(
    [...bmp].join("~")
    , t[3],
    "le_gt__"+i
  )
}
const lt_ge_tsts = [
  [
    4, // ranks 0 - 127
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0,  // lb
      127 // ub
    ],
    "125~100~75~50~32~31~25~0"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 126
    ],
    "125~100~75~50~32~31~25~0"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 125
    ],
    "100~75~50~32~31~25~0"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      10, 125
    ],
    "100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      25, 125
    ],
    "100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      75, 75
    ],
    ""
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      76, 75
    ],
    ""
  ]
];
i=0
for(let t of lt_ge_tsts){
  const bmp = new BitMap(t[0])
  bmp.ITER_LB = t[2][0]
  bmp.ITER_UB = t[2][1]
  bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LT_TO_GE
  for(let n of t[1]) bmp.setRank(n)
  i++
  expect(
    [...bmp].join("~")
    , t[3],
    "lt_ge__"+i
  )
}
const lt_gt_tsts = [
  [
    4, // ranks 0 - 127
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0,  // lb
      127 // ub
    ],
    "125~100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 126
    ],
    "125~100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      0, 125
    ],
    "100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      10, 125
    ],
    "100~75~50~32~31~25"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      25, 125
    ],
    "100~75~50~32~31"
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      75, 75
    ],
    ""
  ],
  [
    4,
    [
      0, 25, 31, 32, 50, 75, 100, 125, 127
    ],
    [
      76, 75
    ],
    ""
  ]
];
i=0
for(let t of lt_gt_tsts){
  const bmp = new BitMap(t[0])
  bmp.ITER_LB = t[2][0]
  bmp.ITER_UB = t[2][1]
  bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LT_TO_GT
  for(let n of t[1]) bmp.setRank(n)
  i++
  expect(
    [...bmp].join("~")
    , t[3],
    "lt_gt__"+i
  )
}



dump(true)
