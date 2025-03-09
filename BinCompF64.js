

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
    const r = rankf64(n)
    d.setUint8(0,r)
    d.setFloat64(1,n)
    if(r < 5){ 
      d.setUint32(1, ~(
        d.getUint32(1)
      )>>>0) 
      d.setUint32(5, ~(
        d.getUint32(5)
      )>>>0)
    }
    return d
  }
}

export function unBinCompF64(n){
  const r = n.getUint8(0)
  if(r < 5){
    n.setUint32(1, ~(
      n.getUint32(1)
    )>>>0) 
    n.setUint32(5, ~(
      n.getUint32(5)      
    )>>>0)
  }
  return n.getFloat64(1)
}
