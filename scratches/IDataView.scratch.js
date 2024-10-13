import {
  IDataView
} from "../index.js"

const idv = new IDataView(
  new ArrayBuffer(16)
)

console.log(...idv)
idv.setUint8(0, 15)
idv.setUint8(1, 16)
console.log(...idv)
idv.setUint16(0,56)
idv.configureIterator(1)
console.log(...idv)
idv.setUint32(0,45600)
idv.configureIterator(2)
console.log(...idv)
idv.setInt8(7, -7)
idv.configureIterator(3)
console.log(...idv)
idv.setInt8(7, 0)
idv.configureIterator(4)
idv.setInt16(6, 555)
console.log(...idv)
idv.setInt16(6, 0)
idv.configureIterator(5)
idv.setInt32(8, 9001)
console.log(...idv)
idv.setInt32(8,0)
idv.configureIterator(6)
idv.setFloat32(8, 324.956)
console.log(...idv)
idv.configureIterator(7)
idv.setFloat64(0,666.555)
console.log(...idv)


