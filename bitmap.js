export class BitMap extends Uint32Array {
  ITER_LB = 0; 
  static ITER_SETS_FWD_GE_TO_LE = function*(){
    const lb = Math.max(0, this.ITER_LB)
    const bitCount = this.length * 32
    const ub = Math.min(bitCount - 1, this.ITER_UB)
    const minPageIdx = Math.floor(lb / 32)
    const maxPageIdx = Math.floor(ub / 32)
    for(let i = minPageIdx; i <= maxPageIdx; i++){
      let page = this[i]
      if(page === 0) continue
      const pageFirstBitIdx = i * 32
      const start = Math.max(lb, pageFirstBitIdx)
      const end = Math.min(ub, pageFirstBitIdx + 31)
      let mask = ((~0 >>> (31 - (end - pageFirstBitIdx))) << (start - pageFirstBitIdx))
      mask &= page 
      while(mask){
        const lsb = mask & -mask
        const index = 31 - Math.clz32(lsb)
        const b = pageFirstBitIdx + index
        if(b >= start && b <= end) yield b
        mask ^= lsb
      }
    }
  }
  static ITER_SETS_FWD_GE_TO_LT = function*(){
    const lb = Math.max(0, this.ITER_LB)
    const bitCount = this.length * 32
    const ub = Math.min(bitCount - 1, this.ITER_UB - 1)
    const minPageIdx = Math.floor(lb / 32)
    const maxPageIdx = Math.floor(ub / 32)
    for(let i = minPageIdx; i <= maxPageIdx; i++){
      let page = this[i]
      if(page === 0) continue
      const pageFirstBitIdx = i * 32
      const start = Math.max(lb, pageFirstBitIdx)
      const end = Math.min(ub, pageFirstBitIdx + 31)
      let mask = ((~0 >>> (31 - (end - pageFirstBitIdx))) << (start - pageFirstBitIdx))
      mask &= page
      while(mask){
        const lsb = mask & -mask
        const index = 31 - Math.clz32(lsb)
        const b = pageFirstBitIdx + index
        if(b >= start && b <= end) yield b
        mask ^= lsb
      }
    }
  }
  static ITER_SETS_FWD_GT_TO_LE = function*(){
    const lb = Math.max(0, this.ITER_LB + 1)
    const bitCount = this.length * 32
    const ub = Math.min(bitCount - 1, this.ITER_UB)
    const minPageIdx = Math.floor(lb / 32)
    const maxPageIdx = Math.floor(ub / 32)
    for(let i = minPageIdx; i <= maxPageIdx; i++){
      let page = this[i]
      if(page === 0) continue
      const pageFirstBitIdx = i * 32
      const start = Math.max(lb, pageFirstBitIdx)
      const end = Math.min(ub, pageFirstBitIdx + 31)
      let mask = ((~0 >>> (31 - (end - pageFirstBitIdx))) << (start - pageFirstBitIdx))
      mask &= page
      while(mask){
        const lsb = mask & -mask
        const index = 31 - Math.clz32(lsb)
        const b = pageFirstBitIdx + index
        if(b >= start && b <= end) yield b
        mask ^= lsb
      }
    }
  }
  static ITER_SETS_FWD_GT_TO_LT = function*(){
    const lb = Math.max(0, this.ITER_LB + 1)
    const bitCount = this.length * 32
    const ub = Math.min(bitCount - 1, this.ITER_UB - 1)
    const minPageIdx = Math.floor(lb / 32)
    const maxPageIdx = Math.floor(ub / 32)
    for(let i = minPageIdx; i <= maxPageIdx; i++){
      let page = this[i]
      if(page === 0) continue
      const pageFirstBitIdx = i * 32
      const start = Math.max(lb, pageFirstBitIdx)
      const end = Math.min(ub, pageFirstBitIdx + 31)
      let mask = ((~0 >>> (31 - (end - pageFirstBitIdx))) << (start - pageFirstBitIdx))
      mask &= page
      while(mask){
        const lsb = mask & -mask
        const index = 31 - Math.clz32(lsb)
        const b = pageFirstBitIdx + index
        if(b >= start && b <= end) yield b
        mask ^= lsb
      }
    }
  } 
  static ITER_SETS_REV_LE_TO_GE = function*(){
    const lb = Math.max(0, this.ITER_LB)
    const bitCount = this.length * 32
    const ub = Math.min(bitCount - 1, this.ITER_UB)
    const minPageIdx = Math.floor(lb / 32)
    const maxPageIdx = Math.floor(ub / 32)
    for(let i = maxPageIdx; i >= minPageIdx; i--){
      let page = this[i]
      if(page === 0) continue
      const pageFirstBitIdx = i * 32
      const start = Math.max(lb, pageFirstBitIdx)
      const end = Math.min(ub, pageFirstBitIdx + 31)
      let mask = ((~0 >>> (31 - (end - pageFirstBitIdx))) << (start - pageFirstBitIdx))>>>0
      mask = (mask & page) >>> 0 
      while(mask){
        const msb = 1 << (Math.floor(Math.log2(mask)))
        const index = 31 - Math.clz32(msb)
        const b = pageFirstBitIdx + index
        if(b >= start && b <= end) yield b
        mask = (mask ^ msb) >>> 0
      }
    }
  } 
  static ITER_SETS_REV_LE_TO_GT = function*(){
    const lb = Math.max(0, this.ITER_LB+1)
    const bitCount = this.length * 32
    const ub = Math.min(bitCount - 1, this.ITER_UB)
    const minPageIdx = Math.floor(lb / 32)
    const maxPageIdx = Math.floor(ub / 32)
    for(let i = maxPageIdx; i >= minPageIdx; i--){
      let page = this[i]
      if(page === 0) continue
      const pageFirstBitIdx = i * 32
      const start = Math.max(lb, pageFirstBitIdx)
      const end = Math.min(ub, pageFirstBitIdx + 31)
      let mask = ((~0 >>> (31 - (end - pageFirstBitIdx))) << (start - pageFirstBitIdx))>>>0
      mask = (mask & page) >>> 0 
      while(mask){
        const msb = 1 << (Math.floor(Math.log2(mask)))
        const index = 31 - Math.clz32(msb)
        const b = pageFirstBitIdx + index
        if(b >= start && b <= end) yield b
        mask = (mask ^ msb) >>> 0
      }
    }
  }
  static ITER_SETS_REV_LT_TO_GE = function*(){
    const lb = Math.max(0, this.ITER_LB)
    const bitCount = this.length * 32
    const ub = Math.min(bitCount - 1, this.ITER_UB-1)
    const minPageIdx = Math.floor(lb / 32)
    const maxPageIdx = Math.floor(ub / 32)
    for(let i = maxPageIdx; i >= minPageIdx; i--){
      let page = this[i]
      if(page === 0) continue
      const pageFirstBitIdx = i * 32
      const start = Math.max(lb, pageFirstBitIdx)
      const end = Math.min(ub, pageFirstBitIdx + 31)
      let mask = ((~0 >>> (31 - (end - pageFirstBitIdx))) << (start - pageFirstBitIdx))>>>0
      mask = (mask & page) >>> 0 
      while(mask){
        const msb = 1 << (Math.floor(Math.log2(mask)))
        const index = 31 - Math.clz32(msb)
        const b = pageFirstBitIdx + index
        if(b >= start && b <= end) yield b
        mask = (mask ^ msb) >>> 0
      }
    }
  }
  static ITER_SETS_REV_LT_TO_GT = function*(){
    const lb = Math.max(0, this.ITER_LB+1)
    const bitCount = this.length * 32
    const ub = Math.min(bitCount - 1, this.ITER_UB-1)
    const minPageIdx = Math.floor(lb / 32)
    const maxPageIdx = Math.floor(ub / 32)
    for(let i = maxPageIdx; i >= minPageIdx; i--){
      let page = this[i]
      if(page === 0) continue
      const pageFirstBitIdx = i * 32
      const start = Math.max(lb, pageFirstBitIdx)
      const end = Math.min(ub, pageFirstBitIdx + 31)
      let mask = ((~0 >>> (31 - (end - pageFirstBitIdx))) << (start - pageFirstBitIdx))>>>0
      mask = (mask & page) >>> 0 
      while(mask){
        const msb = 1 << (Math.floor(Math.log2(mask)))
        const index = 31 - Math.clz32(msb)
        const b = pageFirstBitIdx + index
        if(b >= start && b <= end) yield b
        mask = (mask ^ msb) >>> 0
      }
    }
  }

  constructor(u32s){
    super(u32s)
    this[Symbol.iterator] = BitMap.ITER_SETS
    this.ITER_UB = (u32s * 32) - 1
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
  setRank(rank){
    const CHUNK_SIZE = 32
    const chunkIndex = Math.floor(rank / CHUNK_SIZE)
    const bitWithinChunk = rank % CHUNK_SIZE
    this[chunkIndex] |= (1 << bitWithinChunk) >>> 0
  }
  unsetRank(rank){
    const CHUNK_SIZE = 32
    const chunkIndex = Math.floor(rank / CHUNK_SIZE)
    const bitWithinChunk = rank % CHUNK_SIZE
    this[chunkIndex] &= ~((1 << bitWithinChunk)>>>0)
  }
  static ITER_SETS = function*(){    
    const startPage = Math.floor(this.ITER_LB / 32)
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
