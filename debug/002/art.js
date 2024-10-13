import {
  BitMap
} from "./bitmap.js"

/**
 * NODE INSERTION FAILURE CODES
 * ----------------------------
 *  - 1  = Node1   FULL
 *  - 2  = Node1   DUPLICATE
 *  - 1  = Node4   FULL
 *  - 2  = Node4   DUPLICATE
 *  - 3  = Node16  FULL
 *  - 4  = Node16  DUPLICATE
 *  - 5  = Node48  FULL
 *  - 6  = Node48  DUPLICATE
 *  - 7  = Node256 DUPLICATE
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
    if(this[2] < 4){
      let successor = -1
      let match = -1
      for(let i = 0; i < this[2]; i++){
        if(this[0][i] == keyByte){
          match = -2
          break
        } else if(this[0][i] > keyByte){ 
          successor = i
          break
        }
      }
      if(match == -2) return match
      if(successor > -1){
        for(let j = this[2] - 1; j >= successor; j--){
          this[0][j+1] = this[0][j]
          this[1][j+1] = this[1][j]
        }
        this[0][successor] = keyByte
        this[2]++
        return successor
      } else {
        this[0][this[2]] = keyByte
        const r = this[2]
        this[2]++
        return r
      }
    }
    return -1
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
  #binarySearch(key, LB, UB){
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
    if(this[2] < 16){
      let IP = this.#binarySearchForInsert(
        keyByte, 0, this[2]-1
      )
      if(IP > 0 && keyByte == this[0][IP-1]
) return -4
      for(let j = this[2] - 1; j >= IP; j--){
        this[0][j+1] = this[0][j]
        this[1][j+1] = this[1][j]
      }
      this[0][IP] = keyByte
      this[2]++
      return IP
    }
    return -3
  }
  indexOf(keyByte){
    return this.#binarySearch(keyByte,0,this[2]- 1)
  }
  remove(keyByte){
    const idx = this.#binarySearch(keyByte,0,this[2]-1)
    if(idx > -1){
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
    console.log(
      "in n48.alloc, kb:",
      keyByte, "bytemap.isSet(kb):",
      this[3].isSet(keyByte)
    )
    if(
      !(
        this[3].isSet(keyByte)
      )
    ){
      console.log("not this time, batman!")
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
    console.log(
      "ahaha!!! in n48.ins., size:",
      this[2]
    )
    if(this[2]<48){
      const index = this.#alloc(keyByte)
      console.log("n48.alloc w/in ins ret idx:",index,",idxof(51):",this.indexOf(153))
      if(index < 0) return -6
      this[0][keyByte] = index
      this[2]++
      return index
    }
    return -5
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
    for(let keyByte of this[3]) yield [keyByte, this[1][keyByte]]
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
    if(ar < 0) return -7
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
    const cereal = key.join("|")
    console.log("chglog",cereal,this.root.indexOf(51))
    if(key[0] ==51)console.log("\n#########\n")
    if(key[0] ==51)console.log("insert key",cereal)
    if(key[0] ==51)console.log("root type", this.root.constructor.name)
    if(key[0] ==51)console.log("pre:")
    if(key[0] ==51)console.log(
      "\t->root:\n\t\tchildidx(153): "+
      this.root[0][153] + 
      "\n\t\tchildref type: " +
      (this.root[1][this.root[0][153]]).constructor.name + 
      "\n\t\tchildref key: " +
      (this.root[1][this.root[0][153]])[0].charCodeAt(0) +
      "\n\t\tchildref valref type: " + 
      ((this.root[1][this.root[0][153]])[1]).constructor.name,
      "\n\t\tindexOf(153)",
      this.root.indexOf(153)
    )
    let depth = 0
    let pnode = null
    let selfidx = -1
    let cnode = this.root
    const rootCache = this.root
    console.log("prewhile dbg; r.idx(153)",this.root.indexOf(153),"root type",this.root.constructor.name, "depth",depth)
    while(depth < key.length){
      let last = null
      if(cereal == "153|199|88|235"){
        console.log("ins 153|199|88|235 depth",depth)
        console.log("\tcnode == root?",cnode == this.root)
        console.log("\tcnode type",typeof cnode)
        console.log("\tlast: ",last)
      }
      const isLast = depth == key.length - 1
      const kb = key[depth]
      console.log("preinsert dbg; r.idx(153)",this.root.indexOf(153),"root type",this.root.constructor.name, "depth",depth)
      const ip = cnode.insert(kb)
      console.log("postinsert dbg; r.idx(153)",this.root.indexOf(153),"root type",this.root.constructor.name, "depth",depth, "ip", ip)
      if(cnode instanceof Node1){
        switch(ip){
          case -1: {//full 
            last = "n1full"
            let dbgp = false
            if(cnode == this.root){
              dbgp = true
              console.log("root node1 growth case")
              console.log("\tprecheck:")
              console.log(
                "\t\t153 in?",
                cnode[0].charCodeAt(0) == 153
              )
            }
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
            if(dbgp){
              console.log("\tpostcheck:")
              console.log(
                "\t\t153 in?",
                this.root.indexOf(153)
              )
            }
            cnode = next
            depth++
            break
          }
          case -2: {//dupe 
            last = "n1dupe"
            pnode = cnode
            cnode = cnode[1]
            depth++
            break
          }
          default: { // empty 
            last = "n1empty"
            const next = isLast ? new NodeLeaf() : new Node1()
            pnode = cnode
            cnode[1] = next
            cnode = next
            depth++
          }
        }
      } else {
        console.log("wtfff")
        console.log("preswitch dbg; r.idx(153)",this.root.indexOf(153),"root type",this.root.constructor.name, "depth",depth, this.root == rootCache)
        switch(ip){
          case -1: { // N4 FULL  
            console.log("n4f")
            last = "n4full"
            let dbgp = false
            if(cnode == this.root){
              dbgp = true
              console.log("root node4 growth case")
              console.log("\tprecheck:")
              console.log(
                "\t\t153 in?",
                cnode.indexOf(153)
              )
            }
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
            if(dbgp){
              console.log("\tpostcheck:")
              console.log(
                "\t\t153 in?",
                this.root.indexOf(153)
              )
            }
            cnode = next
            selfidx = idx
            pnode = replacement
            depth++
            break
          }
          case -2:{ // n4 dupe 
            console.log("n4d")
            last = "n4dupe"
            selfidx = cnode.indexOf(kb)
            pnode = cnode
            cnode = cnode[1][selfidx] 
            depth++
            break
          }        
          case -3: { // N16 FULL  
            console.log("n16f")
            last = "n16full"
            let dbgp = false
            if(cnode == this.root){
              dbgp = true
              console.log("root node16 growth case")
              console.log("\tprecheck:")
              console.log(
                "\t\t153 in?",
                cnode.indexOf(153)
              )
            }
            const replacement = new Node48()
            for(let ent of cnode){
              console.log(
                "n16 full dbg: ",
                pnode ? "y":"n",
                ent[0]
              )
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
            if(dbgp){
              console.log("\tpostcheck:")
              console.log(
                "\t\t153 in?",
                this.root.indexOf(153)
              )
            }
            cnode = next
            selfidx = idx
            pnode = replacement
            depth++
            break
          }
          case -4: { // N16 DUPE 
            console.log("n16d")
            last = "n16dupe"
            selfidx = cnode.indexOf(kb)
            pnode = cnode
            cnode = cnode[1][selfidx] 
            depth++
            break
          }
          case -5: { // N48 FULL           
            console.log("n48f")
            last = "n48full"  
            if(cnode == this.root){
              console.log("root node1 growth case")
            }
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
          case -6: { // N48 DUPE 
            console.log(
              "n48d, kb:",
              kb, ", idxof:",
              cnode.indexOf(kb),
              "isroot:", cnode == this.root
            )
            last = "n48dupe"
            selfidx = cnode.indexOf(kb)
            pnode = cnode
            cnode = cnode[1][selfidx] 
            depth++
            break
          }
          case -7: { // N256 DUPE 
            console.log("n256d")
            last = "n256dupe"
            selfidx = cnode.indexOf(kb)
            pnode = cnode
            cnode = cnode[1][selfidx] 
            depth++
            break
          }
          default: { 
            console.log("def")
            last = "findefault"
            selfidx = ip
            pnode = cnode
            const next = isLast ? new NodeLeaf() : new Node1()
            // does this handle all node types?
            cnode[1][ip] = next
            cnode = next
            depth++
          }
        }
        console.log("but how?")
      }
    }
    if(value) cnode[0] = value
    if(key[0] ==51){
      console.log("insert key",cereal)
      console.log("root type", this.root.constructor.name)
      console.log("post:")
      console.log(
        "\t->root:\n\t\tidxof(153):",
        this.root.indexOf(153)
      ) 
      console.log(
        "\t\troot->child.idxof(199):",
        this.root[1][18].indexOf(199)
      ) 
      console.log(
        "\t\tr->c->c.idxof(88):",
        this.root[1][18][1].indexOf(88)
      )
    }
  }
  insert2(key, value = null){
    let depth = 0
    let pnode = null
    let selfidx = -1
    let cnode = this.root
    while(depth < key.length){
      const isLast = depth == key.length - 1
      const kb = key[depth]
      const ip = cnode.insert(kb)
      switch(ip){
        case -1: { // N4 FULL
          const replacement = new Node16()
          for(let ent of cnode){
            const i = replacement.insert(ent[0])
            replacement[1][i] = ent[1]
          }
          if(!pnode) this.root = replacement
          else pnode[1][selfidx] = replacement
          const idx = replacement.insert(kb)
          const next = isLast ? new NodeLeaf() : new Node4()
          replacement[1][idx] = next
          cnode = next
          selfidx = idx
          pnode = replacement
          depth++
          break
        }
        case -2: { // N4 DUPE
          selfidx = cnode.indexOf(keyByte)
          pnode = cnode
          cnode = cnode[1][selfidx] 
          depth++
          break
        }
        case -3: { // N16 FULL
          const replacement = new Node48()
          for(let ent of cnode){
            const i = replacement.insert(ent[0])
            replacement[1][i] = ent[1]
          }
          if(!pnode) this.root = replacement
          else pnode[1][selfidx] = replacement
          const idx = replacement.insert(kb)
          const next = isLast ? new NodeLeaf() : new Node4()
          replacement[1][idx] = next
          cnode = next
          selfidx = idx
          pnode = replacement
          depth++
          break
        }
        case -4: { // N16 DUPE
          selfidx = cnode.indexOf(keyByte)
          pnode = cnode
          cnode = cnode[1][selfidx] 
          depth++
          break
        }
        case -5: { // N48 FULL
          const replacement = new Node256()
          for(let ent of cnode){
            const i = replacement.insert(ent[0])
            replacement[1][i] = ent[1]
          }
          if(!pnode) this.root = replacement
          else pnode[1][selfidx] = replacement
          const idx = replacement.insert(kb)
          const next = isLast ? new NodeLeaf() : new Node4()
          replacement[1][idx] = next
          cnode = next
          selfidx = idx
          pnode = replacement
          depth++
          break
        }
        case -6: { // N48 DUPE
          selfidx = cnode.indexOf(kb)
          pnode = cnode
          cnode = cnode[1][selfidx] 
          depth++
          break
        }
        case -7: { // N256 DUPE
          selfidx = cnode.indexOf(kb)
          pnode = cnode
          cnode = cnode[1][selfidx] 
          depth++
          break
        }
        default: {
          selfidx = ip
          pnode = cnode
          const next = isLast ? new NodeLeaf() : new Node4()
          cnode[1][ip] = next
          cnode = cnode[1][ip]
          depth++
        }
      }
    }
    cnode[0] = value 
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
        cnode = cnode[1][idx]
        depth++
      } else {
        return 0
      }
    }
    if(cnode instanceof NodeLeaf) return cnode
    else return -1
  }
}
