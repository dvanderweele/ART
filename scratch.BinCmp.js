import fs from "fs"
import {
  expectation
} from "./utils.js"
import {
  getWASMBuffer
} from "./NodeWASMProvider.js"
import {
  buildBinCompF64,
  unBinCompF64
} from "./BinCompF64.js"

(async () => {
  const binCompF64 = await buildBinCompF64(
    getWASMBuffer("./RankF64.wasm")
  )
  const a = binCompF64(-437.00157)
  console.log(unBinCompF64(a))
  const acc = new Uint8Array(9)
  for(let i = 0; i < a.byteLength; i++) acc[i] = a.getUint8(i)
  a.setUint8(8,a.getUint8(8)+1-1)
  console.log(unBinCompF64(a))
})()
