import {
  TernarySearchTree,
  IDataView
} from "../index.js"

const s1 = new IDataView(new ArrayBuffer(4))
s1.setUint8(0,4)
s1.setUint8(0,5)
s1.setUint8(0,6)
s1.setUint8(0,7)
const s2 = new IDataView(new ArrayBuffer(4))
s1.setUint8(0,4)
s1.setUint8(0,5)
s1.setUint8(0,8)
s1.setUint8(0,9)

const t = new TernarySearchTree()
t.insert(
  s1
)
console.log("---")
console.log(...t)
