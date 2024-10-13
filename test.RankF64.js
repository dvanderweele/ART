import fs from "fs"
import {
  expectation
} from "./utils.js"
const wasmBuffer = fs.readFileSync('./RankF64.wasm');

(async () => {
  const wasmModule = await WebAssembly.instantiate(
    wasmBuffer  
  );
  const [expect, dump] = expectation();
  expect(true, false, "canary failure")
  const {
    rankf64
  } = wasmModule.instance.exports;
  const tests = [
    [-NaN,0],
    [-Infinity,1],
    [-5000000,2],
    [-0.000000005,2],
    [-5.0e-324,3],
    [-0,4],
    [0,5],
    [4.9e-324,6],
    [0.000000005,7],
    [5000000,7],
    [Infinity,8],
    [NaN,9]
  ];
  for(let t of tests){
    expect(rankf64(t[0]),t[1],"expected rank computed")
  }
  dump(true)
})()
