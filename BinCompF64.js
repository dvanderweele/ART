

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
  return function binCompF64(
    n,
    d = new DataView(
      new ArrayBuffer(9)
    ),
    offset = 0
  ){
    const r = rankf64(n)
    d.setUint8(offset,r)
    const t1 = offset+1
    d.setFloat64(t1,n)
    if(r < 5){ 
      const t5 = offset+5
      d.setUint32(t1, ~(
        d.getUint32(t1)
      )>>>0) 
      d.setUint32(t5, ~(
        d.getUint32(t5)
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
