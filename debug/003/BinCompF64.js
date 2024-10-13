

export async function buildBinCompF64(
  wasmModuleProvider
){
  const buffer = await wasmModuleProvider()
  const wasmModule = await WebAssembly.instantiate(
    buffer
  );
  const {
    rankf64
  } = wasmModule.instance.exports;
  return function binCompF64(n){
    const d = new DataView(
      new ArrayBuffer(9)
    )
    d.setUint8(0,rankf64(n))
    d.setFloat64(1,n)
    return d
  }
}

export function unBinCompF64(n){
  return n.getFloat64(1)
}
