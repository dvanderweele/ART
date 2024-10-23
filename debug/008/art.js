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
  constructor(){
    super()
    this[0] = String.fromCharCode(0)
    this[1] = null
  }
  insert(keyByte){
    /**
     * REVIEW
     *
     * to ensure duplicate insertions when node full do not trigger resize response
     */
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
}

export class Node4 extends Array {
  static childIndex = 1
  constructor(){
    super()
    this[0] = new Uint8Array(4)
    this[1] = [null,null,null,null]
    this[2] = 0
  }
  insert(keyByte){
    /**
     * Node4 FAIL CODES
     * -3 FULL
     * -4 DUPE
     */
    switch(this[2]){
      case 0: {
        this[0][0] = keyByte
        this[2] = 1
        return 0
      }
      case 4: {
        const kbs = this[0]
        for(let i = 0; i < 4; i++){
          if(kbs[i] == keyByte) return -4
        }
        return -3
      }
      default: {
        const kbs = this[0]
        const chs = this[1]
        for(let i = this[2] - 1; i > -1; i--){
          if(kbs[i] > keyByte){
            /**
             * BUG
             * if i == 0 and this is true, this function return undefined
             */
            kbs[i + 1] = kbs[i]
            chs[i + 1] = chs[i]
            if(i==0){
              kbs[0] = keyByte
              chs[0] = null
              return 0
            }
          } else if(kbs[i] == keyByte) return -4
          else {
            this[2]++
            const x = i + 1
            kbs[x] = keyByte
            chs[x] = null
            return x
          }
        }
      }
    }
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
        delete this[1][this[2]-1]
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
        delete this[1][this[2]-1]
        this[2]--
      }
      return 1
    }
    return -1
  }
  [Symbol.iterator] = function*(){
    for(let i = 0; i < this[2]; i++) yield [this[0][i],this[1][i]]
  }
}

export class Node16 extends Array {
  constructor(){
    super()
    this[0] = new Uint8Array(16)
    this[1] = Array.from({length:16},()=>null)
    this[2] = 0
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
  #binarySearchForInsert(key, LB, UB){
    let lo = LB
    let hi = UB
    while(lo <= hi){
      const MP = Math.floor((lo+hi)/2)
      if(this[0][MP] == key) return MP
      else if(this[0][MP] < key) lo = MP + 1
      else hi = MP - 1
    }
    return hi + 1
  } 
  #binarySearch2(key, LB, UB){
    let lo = LB
    let hi = UB
    while(lo <= hi){
      const MP = Math.floor((lo + hi) / 2)
      if(this[0][MP] < key) lo = MP + 1
      else if(this[0][MP] > key) hi = MP - 1
      else return MP
    }
    return -1
  }
  insert(keyByte){
    /**
     * Node16 FAIL CODES
     * -5 FULL
     * -6 DUPE
     *
     *  BUG 
     *  DUPE insert of 43 erroneously causes -5 FULL return
     */
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
        //if(keyByte == 9) console.log("n16.ins dbg, IP",IP, "keyByte",keyByte,"this[0][IP-1]", this[0][IP-1],"this[0][IP]",this[0][IP])
        if(
          keyByte == this[0][IP]
        ) return -6
        else return -5
      }
      default: {
        let IP = this.#binarySearch(
          keyByte, 0, this[2]-1
        )
        //if(keyByte == 9) console.log("n16.ins dbg, IP",IP, "keyByte",keyByte,"this[0][IP-1]", this[0][IP-1],"this[0][IP]",this[0][IP])
        if(
          keyByte == this[0][IP]
        ) return -6
        //console.log("ins16 dbg before, kb", keyByte,"IP",IP, "this",this[0])
        const kbs = this[0]
        const chs = this[1]
        for(let j = this[2] - 1; j >= IP; j--){
          kbs[j+1] = kbs[j]
          chs[j+1] = chs[j]
        }
        this[0][IP] = keyByte
        this[2]++
        //console.log("ins16 dbg after, kb", keyByte,"IP",IP, "this",this)
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
        delete this[1][this[2]-1]
        this[2]--
      } else {
        for(let i = idx +1; i < this[2]; i++){
          this[0][i-1] = this[0][i]
          this[1][i-1] = this[1][i]
        }
        delete this[1][this[2]-1]
        this[2]--
      }
      return 1
    }
    return -2
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
    /*
     * this[0]
     * 0-255 key bytes
     */
    this[1] = Array.from({
      length:48
    },
      ()=>null
    )
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
      const rank = this[3][keyByte]
      this[3].unsetRank(keyByte)
      this[4].unsetRank(rank)
      this[1][rank] = null
      return 1
    }
    return 0
  }
  insert(keyByte){
    /**
     * Node48
     * -7 FULL
     * -8 DUPE
     */
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
    },
      ()=>null
    )
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
      const cle = key.join("~")
      const ip = cnode.insert(kb)
      if(key.join("~") == "149~16~114~127~178~93") console.log("art.ins loop, depth",depth,"kb",kb,"ip",ip,"cle",cle)
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
          const idx = replacement.insert(kb)
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
}
