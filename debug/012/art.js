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
  insert(keyByte,d=false){
    /**
     * REVIEW
     *
     * to ensure duplicate insertions when node full do not trigger resize response
     */
    if(d) console.log("n1.ins, stored",this[0].charCodeAt(0),"to store",keyByte,"!this[1]",!this[1])
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

class CustomArray extends Array {
    constructor() {
        super();
        this[0] = new Uint8Array(4); // Stores keyBytes, currently initialized to zero
        this[1] = new Array(4).fill(null); // Stores associated values
        this[2] = 0; // Number of active elements (i.e., valid entries)
    }

    insert(keyByte, value) {
        if (this[2] >= 4) return -3; // Array is full

        for (let i = 0; i < this[2]; i++) {
            if (this[0][i] === keyByte) return -4; // Duplicate exists
        }

        let index = this[2];
        
        // Insert and keep sorted in UInt8Array
        while (index > 0 && this[0][index - 1] > keyByte) {
            this[0][index] = this[0][index - 1];
            this[1][index] = this[1][index - 1];
            index--;
        }

        this[0][index] = keyByte;
        this[1][index] = value;
        this[2]++;
        return index; // Return index where keyByte is inserted
    }

    indexOf(keyByte) {
        for (let i = 0; i < this[2]; i++) {
            if (this[0][i] === keyByte) return i;
        }
        return -1; // Not found
    }

    remove(keyByte) {
        const idx = this.indexOf(keyByte);
        if (idx === -1) return -1; // Key not found

        for (let i = idx; i < this[2] - 1; i++) {
            this[0][i] = this[0][i + 1];
            this[1][i] = this[1][i + 1];
        }

        this[0][this[2] - 1] = 0; // Clear last element
        this[1][this[2] - 1] = null;
        this[2]--; // Decrease count of elements

        return idx;
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
  insertF(keyByte){
    /**
     * Node4 FAIL CODES
     * -3 FULL
     * -4 DUPE
     */ 
    //console.log("N4.ins, before",this[0].join("~"),"kb",keyByte)
    switch(this[2]){
      case 0: {
        this[0][0] = keyByte
        this[2] = 1 
        //console.log("N4.ins, after",this[0].join("~"))
        return 0
      }
      case 4: {
        const kbs = this[0]
        for(let i = 0; i < 4; i++){
          if(kbs[i] == keyByte) return -4
        } 
        //console.log("N4.ins, after",this[0].join("~"))

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
             *
             * in some cases, node can be full but size is still 3, causing not found issues later
             */
            kbs[i + 1] = kbs[i]
            chs[i + 1] = chs[i]
            if(i==0){
              this[2]++
              kbs[0] = keyByte
              chs[0] = null 
        //console.log("N4.ins, after",this[0].join("~"))

              return 0
            }
          } else if(kbs[i] == keyByte) return -4
          else {
            this[2]++
            const x = i + 1
            kbs[x] = keyByte
            chs[x] = null 
        //console.log("N4.ins, after",this[0].join("~"))

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
  insert(keyByte, debug = false){
    /**
     * Node16 FAIL CODES
     * -5 FULL
     * -6 DUPE
     *
     *  BUG 
     *  DUPE insert of 43 erroneously causes -5 FULL return
     */
    if(debug && false) console.log(
      "n16.ins dbg, kb", keyByte
    )
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
  #alloc(keyByte,debug=false){
    if(
      !(
        this[3].isSet(keyByte)
      )
    ){
      const rank = this[4].firstUnsetRank()
      //if(debug) console.log("before @@@ 1st.unset.child.rank",rank)
      this[4].setRank(rank, debug)
      this[3].setRank(keyByte)
      this[0][keyByte] = rank
      //if(debug) console.log("after @@@ 1st.unset.child.rank",this[4].firstUnsetRank())
      return rank
    }
    return -1
  }
  #free(keyByte, d = false){
    if(this[3].isSet(keyByte)){
      if(d) console.log("n48.free.dbg, kb",keyByte, "isSet(7)", this[3].isSet(7),"isSet(18)",this[3].isSet(18))
      const rank = this[0][keyByte]
      this[3].unsetRank(keyByte)
      this[4].unsetRank(rank)
      this[1][rank] = null
      return 1
    }
    return 0
  }
  insert(keyByte, debug = false){
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
        const index = this.#alloc(keyByte, debug)
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
  remove(keyByte, d = false){
    if(d) console.log("n48.dbg kb", keyByte)
    const fr = this.#free(keyByte,d)
    if(d) console.log('fr',fr)
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
      const ip = cnode.insert(
        kb
      )
      /*if("239~114~127~226~121~96~139~97~46~168" == cle){
        console.log("a.insert.while kb",kb,
        "ip",ip,"depth",depth,"cnode.type",
        cnode.constructor.name,'cnode.size',
        cnode[2])
      }*/
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
          /*if("239~114~127~226~121~96~139~97~46~168" == cle) console.log(
            "n4f.dbg, before, cnode.kb→ch",
            cnode[0],
            cnode[1].map(
              c=>c?c?.constructor.name:"-"
            ),"depth",depth
          )*/
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
          /*if("239~114~127~226~121~96~139~97~46~168" == cle) console.log(
            "n4f.dbg, after, rplc.kb→ch",
            replacement[0],
            replacement[1].map(
              c=>c?c?.constructor.name:"-"
            )
          )*/

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
  search(key,debug=false){
    /**
     * if not found and key is not prefix of another key in the tree, return 0
     * if not found and key is prefix of another key in the tree, return -1
     * else, return NodeLeaf
     */
    let depth = 0
    let cnode = this.root
    while(depth < key.length){
      /*if(
        (
          /^(?:239~114~|127~251~|165~212~)/.test(key.join("~")) && 
          depth == 2 
        ) || (
          /^182~20~255~/.test(key.join("~")) && 
          depth == 3
        )
      ) console.log("search dbg prefix log, depth",depth, "cnode.type", cnode?.constructor?.name, key.join("~"))*/
      const idx = cnode.indexOf(key[depth])
      if(debug && idx<0) console.log(
        "search dbg flg, depth",depth,
        "idx",idx,
        "cnode type", cnode?.constructor?.name,
        key.join("~")
      )
      if(idx > -1){
        cnode = cnode instanceof Node1 ? cnode[1] : cnode[1][idx]
        depth++
      } else {
        return 0
      }
    }
    /*if(debug||!(cnode instanceof NodeLeaf)) console.log(`search(${
      key.join("~")
    }), idx < 0, depth`,depth)*/
    if(cnode instanceof NodeLeaf) return cnode
    else return -1
  } 
  remove(key, debug = false){
    const cle = key.join("~")
    const anomalyOnsetKey = [143,7,249,4,223,172,121,26,64,60]
    const missingKey = [143,18,43,253,202,202,7,201,5,186]
    const anomalyOnsetCle = anomalyOnsetKey.join("~")
    const missingCle = missingKey.join("~")
    debug = cle == anomalyOnsetCle
    /**
     * if found, return NodeLeaf of removed key
     * if not found, return null
     */ 
    /*if(debug){
      console.log("rm.dbg, key", key.join("~"), "search of peer",this.search([18,220,33,75]))
    }*/
    let depth = 0
    const path = [this.root]
    while(depth<key.length){
      if(key.join("~").startsWith("143~18~43~253~202~202~7~201~5~186")){
        /*console.log(
          "remdbg, depth", depth,
          "143~18~43~253~202~202~7~201~5~186"
        ) 
        console.log(
          "\troot type",this.root.constructor.name,
          "size",this.root[2],
          "idx(143)",this.root.indexOf(143)
        ) 
        let nxt = this.root[1][this.root.indexOf(143)]
        console.log(
          "\tc1 type",nxt.constructor.name,
          "size",nxt[2],
          "idx(18)",nxt.indexOf(18)
        )
        nxt = nxt[1][nxt.indexOf(143)]
        console.log(
          "\tc2 type",nxt?.constructor?.name,
          "size",nxt[2],
          "idx(43)",nxt?.indexOf(43)
        )*/


      }
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
    if(debug) console.log("rm.dbg",this.search(missingKey))
    /*if(debug){
      console.log("rm.dbg2, key", key.join("~"), "search of peer",this.search([18,220,33,75]))
    }*/
    const result = path.pop()
    depth--
    if(!(result instanceof NodeLeaf)) return null
    let current = path.pop()
    while(current instanceof Node1){ 
    /*if(debug){
      console.log("rm.dbg3, key", key.join("~"), "search of peer",this.search([18,220,33,75]),current)
    }*/

      current.remove(key[depth])
      depth--
      current = path.pop()
    } 
    /*console.log("rm.dbg4, search of peer",this.search([18,220,33,75]), current, "lk", key[depth])*/
    if(debug) console.log("rm.dbg2",this.search(missingKey), "current[2]", current[2])
    if(current){
      if(debug) console.log("rm.dbg, b4 current rem", this.search(missingKey))
      current.remove(key[depth], true)  // goes missing here!
      if(debug) console.log("rm.dbg, after current rem:")
      if(debug) console.log( this.search(missingKey))
      /*console.log("rm.dbg5, search of peer",this.search([18,220,33,75]), current)*/

      //if(debug) console.log("rm.dbg3",this.search(missingKey), "current[2]",current[2])
      switch(current[2]){
        case 1: {
          if(debug) console.log("case1")
          // shrink n4 to n1
          const replacement = new Node1()
          for(let ent of current){
            replacement.insert(ent[0])
            replacement[1] = ent[1]
          } 
          /*console.log(
            "rm.dbg6, search peer",
            this.search([18,220,33,75]),
            "rplc", replacement,
            "path.len",path.length
          )*/
          if(path.length>0){
            const prnt = path.pop() 
          /*console.log(
            "rm.dbg6, search peer",
            this.search([18,220,33,75]),
            "rplc", replacement,
            "path.len",path.length,
            "popped path entry",prnt,
            "idx",
            prnt.indexOf(key[depth - 1])
          )*/

            if(prnt instanceof Node1) prnt[1] = replacement
            else {
              depth--
              prnt[1][prnt.indexOf(key[depth])] = replacement
            }
          } else {
            this.root = replacement
          }
          break
          /*console.log(
            "rm.dbg7, search peer",
            this.search([18,220,33,75]),
            "rplc", replacement,
            "path.len",path.length
          )*/
        }
        case 4: {
          if(debug) console.log("case4")
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
          if(debug) console.log("case16")
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
          if(debug) console.log("case48")
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
    if(debug) console.log("880het")
    if(debug) console.log("rm.dbg3",this.search(missingKey))
    this.size--
    return result
  }
}
