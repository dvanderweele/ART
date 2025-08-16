import {execSync} from "child_process"

for(let i=0;i<1000;i++){
  console.log("bench loop iteration",i)
  console.log("moby dick bench:")
  console.log("\t-native js set")
  execSync("node --expose-gc benchmarks/mobyDick.bench.set.js")
  console.log("\t-js avl tree")
  execSync("node --expose-gc benchmarks/mobyDick.bench.avl.js")
  console.log("\t-js art tree")
  execSync("node --expose-gc benchmarks/mobyDick.bench.art.js")
  console.log("shakespeare bench:")
  console.log("\t-native js set")
  execSync("node --expose-gc benchmarks/shakespeare.bench.set.js")
  console.log("\t-js avl tree")
  execSync("node --expose-gc benchmarks/shakespeare.bench.avl.js")
  console.log("\t-js art tree")
  execSync("node --expose-gc benchmarks/shakespeare.bench.art.js")
  console.log("Uint32x1M bench:")
  execSync("node --expose-gc benchmarks/Uint32x1M.bench.js")
  console.log("Melville vs Shakespeare Set Operations")
  execSync("node benchmarks/melville_v_shakespeare.js")
}
