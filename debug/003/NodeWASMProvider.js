import fs from "fs/promises"
const wasmBuffer = fs.readFile('./RankF64.wasm');

export function getWASMBuffer(
  path
){
  return async () => await fs.readFile(path)
}


