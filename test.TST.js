import {
  TST
} from "./index2.js"
import {
  expectation
} from "./utils.js"

const [expect, dump] = expectation();
expect(true, false, "canary failure");

let T = new TST()

const sequences = [
  [34,25,129],
  [73,213,174],
  [34,25,128,55],
  [73,212]
].map(a=>{
  const d = new DataView(
    new ArrayBuffer(a.length)
  )
  for(let i = 0; i < a.length;i++) d.setUint8(i,a[i])
  return d
})

for(let s of sequences){
  expect(!T.search(s), true, "empty TST does not have a sequence in it")
  expect(T.insert(s),1,"TST.insert returns 1 for sequence not in tree")
  expect(T.search(s) != null, true, "TST has a sequence in it")
}
expect(T.size,4,"correct after all inserts")
for(let s of sequences){
  expect(T.remove(s), 1, "remove returns 1 when item found for removal")
}
console.log(T.size)
expect(T.size,0,"correct size after removals")


dump(true)
