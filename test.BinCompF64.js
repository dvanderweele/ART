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
  const [expect, dump] = expectation();
  expect(true, false, "canary failure")
  expect(
    unBinCompF64(binCompF64(-437)),
    -437,"binCompF64 is reversible"
  )
  const a = binCompF64(-437)
  const b = binCompF64(437)
  let leftTurns = 0
  let rightTurns = 0
  for(let i = 0; i < 4; i++){
    const ab = a.getUint8(i)
    const bb = b.getUint8(i)
    if(ab < bb) {
      leftTurns++
      break
    } else if(ab > bb) rightTurns++
  }
  expect(
    leftTurns > 0 && rightTurns == 0, 
    true, 
    "BinCompF64 orders normal negative vs positive nums correctly"
  )
  dump(true)
})()
