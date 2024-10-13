/**
 * Nodes are arrays:
 * 0 - CHAR
 * 1 - LO
 * 2 - EQ
 * 3 - HI
 * 4 - PARENT
 * 5 ? VALUE
 */

export const ITER_U8 = 0,
  ITER_U16 = 1,
  ITER_U32 = 2,
  ITER_I8 = 3,
  ITER_I16 = 4,
  ITER_I32 = 5,
  ITER_F32 = 6,
  ITER_F64 = 7

export class IDataView extends DataView {
  constructor(
    buffer = new ArrayBuffer(2)
  ){
    super(
      buffer
    )
    this.configureIterator()
  }
  [Symbol.toPrimitive] = function(hint){
    switch(hint){
      case "string": {
        this.configureIterator(0)
        return ([...this].map(
          l => l.map(
            n => `( ${
              n[0]
            }N ${
              n[1] ? n[1][0] : "_"
            }← ${
              n[3] ? n[3][0] : "_"
            }→ ${
              n[2] ? n[2][0] : "_"
            }↓ ${
              n[4] ? n[4][0] : "_"
            }↑ )`
          ).join("\t")
        ).join("\n\t↓\n"))
      }
      default: return this.size
    }
  }
  toString(){
    return this[Symbol.toPrimitive]("string")
  }
  configureIterator(
    mode = ITER_U8, 
    offset = 0, 
    limit = super.byteLength,
    littleEndian = false
  ){
    this[Symbol.iterator] = ([
      function*(){
        const lim = Math.min(
          limit,
          this.byteLength
        ); 
        for(
          let i = Math.max(
            offset, 0
          ); 
          i < lim; 
          i++
        ) yield this.getUint8(i)
      },
      function*(){
        const lim = Math.min(
          limit - 1,
          this.byteLength
        ); 
        for(
          let i = Math.max(
            offset, 0
          ); 
          i < lim; 
          i = i + 2
        ) yield this.getUint16(
          i, littleEndian
        )
      },
      function*(){
        const lim = Math.min(
          limit - 3,
          this.byteLength
        ); 
        for(
          let i = Math.max(
            offset, 0
          ); 
          i < lim; 
          i = i + 4
        ) yield this.getUint32(
          i, littleEndian
        )
      },
      function*(){
        const lim = Math.min(
          limit,
          this.byteLength
        ); 
        for(
          let i = Math.max(
            offset, 0
          ); 
          i < lim; 
          i++
        ) yield this.getInt8(
          i
        )
      },
      function*(){
        const lim = Math.min(
          limit - 1,
          this.byteLength
        ); 
        for(
          let i = Math.max(
            offset, 0
          ); 
          i < lim; 
          i = i + 2
        ) yield this.getInt16(
          i, littleEndian
        )
      },
      function*(){
        const lim = Math.min(
          limit - 3,
          this.byteLength
        ); 
        for(
          let i = Math.max(
            offset, 0
          ); 
          i < lim; 
          i = i + 4
        ) yield this.getInt32(
          i, littleEndian
        )
      },
      function*(){
        const lim = Math.min(
          limit - 3,
          this.byteLength
        ); 
        for(
          let i = Math.max(
            offset, 0
          ); 
          i < lim; 
          i = i + 4
        ) yield this.getFloat32(
          i, littleEndian
        )
      },
      function*(){
        const lim = Math.min(
          limit - 7,
          this.byteLength
        ); 
        for(
          let i = Math.max(
            offset, 0
          ); 
          i < lim; 
          i = i + 8
        ) yield this.getFloat64(
          i, littleEndian
        )
      }
    ])[mode]
  }
}

export class TernarySearchTree {
  root = null
  size = 0
  constructor(){
    this.configureIterator()
  }
  configureIterator(ModeInteger = 0){
    this[Symbol.iterator] = ([
      function*(){
        let level = this.root ? [this.root] : []
        while(level.length>0) {
          console.log("w")
          let tmp = []
          yield level
          for(let i = 0; i < level.length; i++){
            const n = level[i]
            if(n[2]) tmp.push(n[2])
            if(n[3]) tmp.push(n[3])
            if(n[4]) tmp.push(n[4])
          }
          level = tmp
        }
      },
    ])[
      Math.trunc(
        Math.min( 
          0, 
          Math.max(
            0, ModeInteger
          ) 
        ) 
      )
    ];
  }
  insert(key, value = null){
    const keyLen = key.length
    let last = null
    let current = this.root
    let index = 0
    for(let kc of key){
      if(!current){
        break
      }
      const cc =current[0]
      if(kc < cc){
        last = current
        current = current[1]
      } else if(kc > cc){
        last = current
        current = current[2]
      } else {
        if(index == key.byteLength){
          if(value) current[5] = value
          return 0
        }
        last = current
        current = current[4]
        index++
      }
    }
    const kb = key.getUint8(index)
    current = [
      kb,
      null,
      null,
      null,
      last
    ]
    if(value) current[5] = value
    if(!this.root) this.root = current
    else if(
      last && 
      last[0] < kb
    ) last[3] = current
    else if(
      last && 
      last[0] > kb
    ) last[1] = current
    else if(last) last[2] = current
    index++
    for(; index < key.byteLength; index++){
      current[2] = [
        key.getUint8(index),
        null, null, null,
        current
      ]
      if(
        index > key.byteLength - 1
      ) current[5] =value
      current = current[2]
    }
    this.size++
    return 1
  }
}
