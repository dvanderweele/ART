import {
  BitMap
} from "./bitmap.js"

/**
 * NODE INSERTION FAILURE CODES
 * ----------------------------
 *  - 1  = Node1   FULL
 *  - 2  = Node1   DUPLICATE
 *  - 3  = Node4   FULL
 *  - 4  = Node4   DUPLICATE
 *  - 5  = Node16  FULL
 *  - 6  = Node16  DUPLICATE
 *  - 7  = Node48  FULL
 *  - 8  = Node48  DUPLICATE
 *  - 9  = Node256 DUPLICATE
 *
 * NODE REMOVAL FAILURE CODES
 * --------------------------
 *  - 1  = Node4   NOT FOUND
 *  - 2  = Node16  NOT FOUND
 *  - 3  = Node48  NOT FOUND
 *  - 4  = Node256 NOT FOUND
 */

export class Node1 extends Array {
  ITER_LB = 0
  ITER_UB = 255
  constructor(){
    super()
    this[0] = String.fromCharCode(0)
    this[1] = null
    // this[Symbol.iterator]=Node1.ITER_FWD_GE_TO_LE
  }
  insert(keyByte){
    if(!this[1]){ 
      this[0] = String.fromCharCode(keyByte)
      return 0
    } else {
      if(this[0].charCodeAt(0) == keyByte) return -2
      else return -1
    }
  }
  indexOf(keyByte){
    return this[1] && this[0].charCodeAt(0) == keyByte ? 0 : -1
  }
  remove(keyByte){
    if(this[1] && this[0].charCodeAt(0) == keyByte) this[1] = null
  } 
  [Symbol.iterator]=function*(){
    yield [this[0].charCodeAt(0),this[1]]
  }
  static ITER_FWD_GE_TO_LE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GE_TO_LT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GT_TO_LE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GT_TO_LT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LE_TO_GE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LE_TO_GT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LT_TO_GE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LT_TO_GT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  }
}

export class Node4 extends Array {
  ITER_LB = 0
  ITER_UB = 255
  constructor(){
    super()
    this[0] = new Uint8Array(4)
    this[1] = [null,null,null,null]
    this[2] = 0
    //this[Symbol.iterator] = Node4.ITER_FWD_GE_TO_LE
  }
  insert(keyByte){
    for(let i = 0; i < this[2]; i++){
      if(this[0][i] == keyByte) return -4
    }
    if(this[2] >= 4) return -3
    let index = this[2]
    while(
      index > 0 && 
      this[0][index - 1] > keyByte
    ){
      const i = index - 1
      this[0][index] = this[0][i]
      this[1][index] = this[1][i]
      index--
    }
    this[0][index] = keyByte
    this[2]++
    return index
  }
  indexOf(keyByte){
    for(let i = 0; i < this[2]; i++){
      if(this[0][i] == keyByte) return i
    }
    return -1
  }
  remove(keyByte){
    const idx = this.indexOf(keyByte)
    if(idx > -1){
      if(idx > this[2]-2){ 
        this[1][this[2]-1] = null
        this[2]--
      } else {
        for(
          let i = idx +1; 
          i < this[2]; 
          i++
        ){
          this[0][i-1] = this[0][i]
          this[1][i-1] = this[1][i]
        }
        this[1][this[2]-1] = null
        this[2]--
      }
      return 1
    }
    return -1
  }  
  [Symbol.iterator] = function*(){
    for(let i = 0; i < this[2]; i++) yield [this[0][i],this[1][i]]
  }
  static ITER_FWD_GE_TO_LE = function*(){ 
    const lb = this.ITER_LB
    const ub = this.ITER_UB
    for(let i = 0; i < this[2]; i++){
      const kb = this[0][i]
      if(kb >= lb && kb <= ub) yield [kb, this[1][i]]
    }
  } 
  static ITER_FWD_GE_TO_LT = function*(){ 
    const lb = this.ITER_LB
    const ub = this.ITER_UB
    for(let i = 0; i < this[2]; i++){
      const kb = this[0][i]
      if(kb >= lb && kb < ub) yield [kb, this[1][i]]
    }
  } 
  static ITER_FWD_GT_TO_LE = function*(){ 
    const lb = this.ITER_LB
    const ub = this.ITER_UB
    for(let i = 0; i < this[2]; i++){
      const kb = this[0][i]
      if(kb > lb && kb <= ub) yield [kb, this[1][i]]
    }
  } 
  static ITER_FWD_GT_TO_LT = function*(){ 
    const lb = this.ITER_LB
    const ub = this.ITER_UB
    for(let i = 0; i < this[2]; i++){
      const kb = this[0][i]
      if(kb > lb && kb < ub) yield [kb, this[1][i]]
    }
  } 
  static ITER_REV_LE_TO_GE = function*(){ 
    const lb = this.ITER_LB
    const ub = this.ITER_UB
    for(let i = this[2] - 1; i > -1; i--){
      const kb = this[0][i]
      if(kb >= lb && kb <= ub) yield [kb, this[1][i]]
    }
  } 
  static ITER_REV_LE_TO_GT = function*(){ 
    const lb = this.ITER_LB
    const ub = this.ITER_UB
    for(let i = this[2] - 1; i > -1; i--){
      const kb = this[0][i]
      if(kb > lb && kb <= ub) yield [kb, this[1][i]]
    }
  } 
  static ITER_REV_LT_TO_GE = function*(){ 
    const lb = this.ITER_LB
    const ub = this.ITER_UB
    for(let i = this[2] - 1; i > -1; i--){
      const kb = this[0][i]
      if(kb >= lb && kb < ub) yield [kb, this[1][i]]
    }
  } 
  static ITER_REV_LT_TO_GT = function*(){ 
    const lb = this.ITER_LB
    const ub = this.ITER_UB
    for(let i = this[2] - 1; i > -1; i--){
      const kb = this[0][i]
      if(kb > lb && kb < ub) yield [kb, this[1][i]]
    }
  }
}

export class Node16 extends Array {
  constructor(){
    super()
    this[0] = new Uint8Array(16)
    this[1] = Array.from({length:16}).fill(null)
    this[2] = 0 
    //this[Symbol.iterator] = Node16.ITER_FWD_GE_TO_LE
  }
  #binarySearch(key, LB, UB){
    for(;;){
      if(LB>UB) return LB
      else {
        const MP = Math.floor((LB+UB)/2)
        const KM = this[0][MP]
        if(key == KM) return MP
        else if(key < KM){
          UB = MP - 1
          continue
        } else {
          LB = MP + 1
          continue
        }
      }
    }
  }
  #binarySearch_for_LB(key, LB, UB){
    for(; LB < UB;){
      const MP = Math.floor((LB+UB)/2)
      if(key <= this[0][MP]) UB = MP
      else LB = MP+1
    }
    if(LB<this[2] && this[0][LB]<key) LB++
    return LB
  }
  #binarySearch_for_UB(key, LB, UB){
    for(; LB < UB;){
      const MP = Math.floor((LB+UB)/2)
      if(key  = this[0][MP]) LB = MP + 1
      else UB = MP
    }
    if(LB<this[2] && this[0][LB]<=key) LB++
    return LB

  }
  insert(keyByte){
    switch(this[2]){
      case 0: {
        this[0][0] = keyByte
        this[2] = 1
        return 0
      }
      case 16: {
        let IP = this.#binarySearch(
          keyByte, 0, this[2]-1
        )
        if(
          keyByte == this[0][IP]
        ) return -6
        else return -5
      }
      default: {
        let IP = this.#binarySearch(
          keyByte, 0, this[2]-1
        )
        if(
          keyByte == this[0][IP]
        ) return -6
        const kbs = this[0]
        const chs = this[1]
        for(let j = this[2] - 1; j >= IP; j--){
          kbs[j+1] = kbs[j]
          chs[j+1] = chs[j]
        }
        this[0][IP] = keyByte
        this[2]++
        return IP
      }
    }
  }
  indexOf(keyByte){
    if(this[2] == 0) return -1
    const result = this.#binarySearch(keyByte,0,this[2]- 1)
    return result < this[2] && this[0][result] == keyByte ? result : -1
  }
  remove(keyByte){
    const idx = this.#binarySearch(keyByte,0,this[2]-1)
    if(this[0][idx] == keyByte){
      if(idx > this[2]-2){ 
        this[1][this[2]-1] = null
        this[2]--
      } else {
        for(let i = idx +1; i < this[2]; i++){
          this[0][i-1] = this[0][i]
          this[1][i-1] = this[1][i]
        }
        this[1][this[2]-1] = null
        this[2]--
      }
      return 1
    }
    return -2
  } 
  static ITER_FWD_GE_TO_LE = function*(){
    const LB = this.#binarySearch_for_LB(this.ITER_LB,0,this[2])
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GE_TO_LT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GT_TO_LE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GT_TO_LT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LE_TO_GE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LE_TO_GT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LT_TO_GE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LT_TO_GT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  [Symbol.iterator] = function*(){
    for(let i = 0; i < this[2]; i++) yield [this[0][i],this[1][i]]
  } 
}

export class Node48 extends Array {
  constructor(){
    super()
    const x = new Uint8Array(256) 
    this[0] = x
    this[1] = Array.from({
      length:48
    }).fill(null)
    this[2] = 0  // size
    this[3] = new BitMap(8) // byte map
    this[4] = new BitMap(2) // child map
  }
  #alloc(keyByte){
    if(
      !(
        this[3].isSet(keyByte)
      )
    ){
      const rank = this[4].firstUnsetRank()
      this[4].setRank(rank)
      this[3].setRank(keyByte)
      this[0][keyByte] = rank
      return rank
    }
    return -1
  }
  #free(keyByte){
    if(this[3].isSet(keyByte)){
      const rank = this[0][keyByte]
      this[3].unsetRank(keyByte)
      this[4].unsetRank(rank)
      this[1][rank] = null
      return 1
    }
    return 0
  }
  insert(keyByte){
    switch(this[2]){
      case 48: {
        if(this.indexOf(keyByte) < 0) return -7
        else return -8
      }
      default: {
        const index = this.#alloc(keyByte)
        if(index < 0) return -8
        this[0][keyByte] = index
        this[2]++
        return index
      }
    }
  }
  indexOf(keyByte){
    return this[3].isSet(keyByte) ? this[0][keyByte] : -1
  }
  remove(keyByte){
    const fr = this.#free(keyByte)
    if(fr == 0) return -3
    this[2]--
    return 1
  } 
  static ITER_FWD_GE_TO_LE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GE_TO_LT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GT_TO_LE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GT_TO_LT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LE_TO_GE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LE_TO_GT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LT_TO_GE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LT_TO_GT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  }
  [Symbol.iterator] = function*(){
    this[3][Symbol.iterator] = BitMap.ITER_SETS
    for(let keyByte of this[3]) yield [keyByte, this[1][this.indexOf(keyByte)]]
  }
}

export class Node256 extends Array {
  constructor(){
    super()
    this[0] = new BitMap(8)
    this[1] = Array.from({
      length:256
    }).fill(null)
    this[2] = 0
  }
  #alloc(keyByte){
    if(!(
      this[0].isSet(keyByte)
    )){
      this[0].setRank(keyByte)
      return keyByte
    }
    return -1
  }
  #free(keyByte){
    if(this[0].isSet(keyByte)){
      this[0].unsetRank(keyByte)
      this[1][keyByte] = null
      return 1
    }
    return 0
  }
  insert(keyByte){
    const ar = this.#alloc(keyByte)
    if(ar < 0) return -9
    this[2]++
    return ar
  }
  indexOf(keyByte){
    return this[0].isSet(keyByte) ? keyByte : -1
  }
  remove(keyByte){
    const fr = this.#free(keyByte)
    if(fr == 0) return -4
    this[2]--
    return 1
  } 
  static ITER_FWD_GE_TO_LE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GE_TO_LT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GT_TO_LE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_FWD_GT_TO_LT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LE_TO_GE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LE_TO_GT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<=this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LT_TO_GE = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>=this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  } 
  static ITER_REV_LT_TO_GT = function*(){
    const kb = this[0].charCodeAt(0)
    if(kb>this.ITER_LB && kb<this.ITER_UB) yield [kb,this[1]]
  }
  [Symbol.iterator] = function*(){
    this[0][Symbol.iterator] = BitMap.ITER_SETS
    for(let keyByte of this[0]) yield [keyByte, this[1][keyByte]]
  }
}

export class NodeLeaf extends Array {}

export class ART {
  size
  root
  constructor(){
    this.size = 0
    this.root = new Node1()
  }
  insert(key, value = null){
    let depth = 0
    let pnode = null
    let selfidx = -1
    let cnode = this.root
    while(depth < key.length){
      const isLast = depth == key.length - 1
      const kb = key[depth]
      const ip = cnode.insert(
        kb
      )
      switch(ip){
        case -1: {//full
          const rplc = new Node4()
          for(let kc of cnode){
            const i = rplc.insert(kc[0])
            rplc[1][i] = kc[1]
          }
          if(pnode){
            if(pnode instanceof Node1)
              pnode[1] = rplc
            else 
              pnode[1][selfidx] = rplc
          } else this.root = rplc
          const nip = rplc.insert(kb)
          const next = isLast ? new NodeLeaf() : new Node1()
          rplc[1][nip] = next
          pnode = rplc
          selfidx = nip
          cnode = next
          depth++
          break
        }
        case -2: {//dupe
          pnode = cnode
          cnode = cnode[1]
          depth++
          break
        }
        case -3: { // N4 FULL 
          const replacement = new Node16()
          for(let ent of cnode){
            const i = replacement.insert(ent[0])
            replacement[1][i] = ent[1]
          }
          if(!pnode) this.root = replacement
          else {
            if(pnode instanceof Node1) pnode[1] = replacement
            else pnode[1][selfidx] = replacement
          }
          const idx = replacement.insert(kb,key)
          const next = isLast ? new NodeLeaf() : new Node1()
          replacement[1][idx] = next
          cnode = next
          selfidx = idx
          pnode = replacement
          depth++ 
          break
        }
        case -4:{ // n4 dupe
          selfidx = cnode.indexOf(kb)
          pnode = cnode
          cnode = cnode[1][selfidx] 
          depth++
          break
        }        
        case -5: { // N16 FULL
          const replacement = new Node48()
          for(let ent of cnode){
            const i = replacement.insert(ent[0])
            replacement[1][i] = ent[1]
          }
          if(!pnode) this.root = replacement
          else {
            if(pnode instanceof Node1) pnode[1] = replacement
            else pnode[1][selfidx] = replacement
          }
          const idx = replacement.insert(kb)
          const next = isLast ? new NodeLeaf() : new Node1()
          replacement[1][idx] = next
          cnode = next
          selfidx = idx
          pnode = replacement
          depth++
          break
        }
        case -6: { // N16 DUPE
          selfidx = cnode.indexOf(kb)
          pnode = cnode
          cnode = cnode[1][selfidx] 
          depth++
          break
        }
        case -7: { // N48 FULL
          const replacement = new Node256()
          for(let ent of cnode){
            const i = replacement.insert(ent[0])
            replacement[1][i] = ent[1]
          }
          if(!pnode) this.root = replacement
          else {
            if(pnode instanceof Node1) pnode[1] = replacement
            else pnode[1][selfidx] = replacement
          }
          const idx = replacement.insert(kb)
          const next = isLast ? new NodeLeaf() : new Node1()
          replacement[1][idx] = next
          cnode = next
          selfidx = idx
          pnode = replacement
          depth++
          break
        }
        case -8: { // N48 DUPE
          selfidx = cnode.indexOf(kb)
          pnode = cnode
          cnode = cnode[1][selfidx] 
          depth++
          break
        }
        case -9: { // N256 DUPE
          selfidx = cnode.indexOf(kb)
          pnode = cnode
          cnode = cnode[1][selfidx] 
          depth++
          break
        }
        default: { 
          if(cnode instanceof Node1){
            const next = isLast ? new NodeLeaf() : new Node1()
            pnode = cnode
            cnode[1] = next
            cnode = next
            depth++
          } else {
            selfidx = ip
            pnode = cnode
            const next = isLast ? new NodeLeaf() : new Node1()
            cnode[1][ip] = next
            cnode = next
            depth++
          }
        }
      }
    }
    if(value != null) cnode[0] = value 
    this.size++
  }
  search(key){
    /**
     * if not found and key is not prefix of another key in the tree, return 0
     * if not found and key is prefix of another key in the tree, return -1
     * else, return NodeLeaf
     */
    let depth = 0
    let cnode = this.root
    while(depth < key.length){
      const idx = cnode.indexOf(key[depth])
      if(idx > -1){
        cnode = cnode instanceof Node1 ? cnode[1] : cnode[1][idx]
        depth++
      } else {
        return 0
      }
    }
    if(cnode instanceof NodeLeaf) return cnode
    else return -1
  } 
  remove(key){
    /**
     * if found, return NodeLeaf of removed key
     * if not found, return null
     */ 
    let depth = 0
    const path = [this.root]
    while(depth<key.length){
      const kb = key[depth]
      const current = path[path.length-1]
      const idx = current.indexOf(kb)
      if(idx<0) return null
      else {
        if(current instanceof Node1){
          path.push(current[1])
          depth++
        }else{
          path.push(current[1][idx])
          depth++
        }
      }
    } 
    const result = path.pop()
    depth--
    if(!(result instanceof NodeLeaf)) return null
    let current = path.pop()
    while(current instanceof Node1){ 
      current.remove(key[depth])
      depth--
      current = path.pop()
    } 
    if(current){
      current.remove(key[depth]) 
      switch(current[2]){
        case 1: {
          // shrink n4 to n1
          const replacement = new Node1()
          for(let ent of current){
            replacement.insert(ent[0])
            replacement[1] = ent[1]
          } 
          if(path.length>0){
            const prnt = path.pop() 
            if(prnt instanceof Node1) prnt[1] = replacement
            else {
              depth--
              prnt[1][prnt.indexOf(key[depth])] = replacement
            }
          } else {
            this.root = replacement
          }
          break
        }
        case 4: {
          // shrink n16 to n4
          const replacement = new Node4()
          for(let ent of current){
            const i = replacement.insert(ent[0])
            replacement[1][i] = ent[1]
          }
          if(path.length>0){
            const prnt = path.pop()
            if(prnt instanceof Node1) prnt[1] = replacement
            else {
              depth--
              prnt[1][prnt.indexOf(key[depth])] = replacement
            }
          } else {
            this.root = replacement
          }
          break
        }
        case 16: {
          // shrink n48 to n16
          const replacement = new Node16()
          for(let ent of current){
            const i = replacement.insert(ent[0])
            replacement[1][i] = ent[1]
          }
          if(path.length>0){
            const prnt = path.pop()
            if(prnt instanceof Node1) prnt[1] = replacement
            else {
              depth--
              prnt[1][prnt.indexOf(key[depth])] = replacement
            }
          } else {
            this.root = replacement
          }
          break
        }
        case 48: {
          // shrink n256 to n48
          const replacement = new Node48()
          for(let ent of current){
            const i = replacement.insert(ent[0])
            replacement[1][i] = ent[1]
          }
          if(path.length>0){
            const prnt = path.pop()
            if(prnt instanceof Node1) prnt[1] = replacement
            else {
              depth--
              prnt[1][prnt.indexOf(key[depth])] = replacement
            }
          } else {
            this.root = replacement
          }
          break
        }
      }
    }
    this.size--
    return result
  }
}
