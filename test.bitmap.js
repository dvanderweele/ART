import {
  BitMap
} from "./bitmap.js"

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
