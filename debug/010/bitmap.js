export class BitMap extends Uint32Array {
  constructor(u32s){
    super(u32s)
    this[Symbol.iterator] = BitMap.ITER_SETS

  }
  toString(lineLength = 10){
    let stack = []
    let counter = 0
    for(let i = 0; i < this.length; i++){
      const bitmap = this[i]
      for(let j = 0; j < 32; j++){
        stack.push(((bitmap >>> j) & 1).toString())
        counter++
        if(counter == lineLength){ 
          stack.push("\n")
          counter = 0
        }
      }
    }
    return stack.join("")
  }
  firstSetRank(){
    for(let i = 0; i < this.length; i++){
      const bitmap = this[i]
      if(bitmap === 0) continue
      let leastSignificantSetBit = bitmap & -bitmap
      let index = 31 - Math.clz32(leastSignificantSetBit)
      return index + (i * 32)
    }
  }
  firstUnsetRank(){
    for(let i = 0; i < this.length; i++){
      const bitmap = ~this[i]
      if(bitmap === 0) continue
      let leastSignificantSetBit = bitmap & -bitmap
      let index = 31 - Math.clz32(leastSignificantSetBit)
      return index + (i * 32)
    }
  }
  isSet(rank){
    const CHUNK_SIZE = 32
    const chunkIndex = Math.floor(rank / CHUNK_SIZE)
    const bitWithinChunk = rank % CHUNK_SIZE
    return (this[chunkIndex] & (1 << bitWithinChunk))>>>0 > 0
  }
  setRank(rank, debug = false){
    //if(debug) console.log("SETR:BEFORE\n",this.toString())
    const CHUNK_SIZE = 32
    const chunkIndex = Math.floor(rank / CHUNK_SIZE)
    const bitWithinChunk = rank % CHUNK_SIZE
    this[chunkIndex] |= (1 << bitWithinChunk) >>> 0
    //if(debug) console.log("SETR:AFTER\n",this.toString())
  }
  unsetRank(rank){
    const CHUNK_SIZE = 32
    const chunkIndex = Math.floor(rank / CHUNK_SIZE)
    const bitWithinChunk = rank % CHUNK_SIZE
    this[chunkIndex] &= ~((1 << bitWithinChunk)>>>0)
  }
  static ITER_SETS = function*(){    
    for (let i = 0; i < this.length; i++){
      let bitmap = this[i];
      while (bitmap !== 0){
        const leastSignificantSetBit = bitmap & -bitmap;
        const index = 31 - Math.clz32(leastSignificantSetBit);
        yield (index + i * 32)
        bitmap &= (bitmap - 1);
      }
    }
  }
  static ITER_UNSETS = function*(){
    for (let i = 0; i < this.length; i++){
      let bitmap = ~this[i];
      while (bitmap !== 0){
        const leastSignificantSetBit = bitmap & -bitmap;
        const index = 31 - Math.clz32(leastSignificantSetBit);
        yield (index + i * 32)
        bitmap &= (bitmap - 1);
      }
    }
  }
  static ITER_ALL = function*(){
    for(let i = 0; i < this.length; i++){
      const bitmap = this[i]
      for(let j = 0; j < 32; j++){
         yield ((bitmap >> j) & 1)
      }
    }
  }
}
