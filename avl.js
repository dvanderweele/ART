// nodes are arrays
// indexes:
// 0 = height
// 1 = key
// 2 = left
// 3 = right
// 4 = size
// 5 ? value

export class AVL  {
  #root = null;
  [Symbol.toStringTag] = "AVL";
  [Symbol.toPrimitive] = function(hint){
    switch(hint){
      case "string": {
        this[Symbol.iterator] = AVL.ITER_LEVEL_ORDER
        let pmap = new Map()
        let counter = 0
        let UB = this.ITER_UB
        let sq = []
        for(let level of this){
          counter++
          sq.push("\n\t↓\n")
          const tmp = new Map()
          for(let node of level){
            sq.push(
              "(", node[0],"H",
              node[1],"K",(
                node[2] ? node[2][1] : "_"
              ),"←",(
                node[3] ? node[3][1] : "_"
              ),"→",node[4],"S",(
                pmap.has(node[1]) ? pmap.get(node[1]) : "_"
              ),"↑) "
            )
            if(node[2]) tmp.set(node[2][1],node[1])
            if(node[3]) tmp.set(node[3][1],node[1])
          }
          pmap = tmp
          if(counter >= UB) break
        }
        return sq.join("")
      }
      default: return this.#root ? this.#root[4] : 0
    }
  }
  toString(){
    return this[Symbol.toPrimitive]("string")
  }
  static ITER_FWD_GE_TO_LE = function*(){
    if(!this.#root) return
    const LB = this.ITER_LB
    const UB = this.ITER_UB 
    const lt = this.COMP_LT
    const le = this.COMP_LE
    const gt = this.COMP_GT
    const ge = this.COMP_GE
    yield * function *a(r){
      if(!r) return
      if(gt(r[1],LB)) yield * a(r[2])
      if(ge(r[1],LB) && le(r[1],UB)) yield r
      if(lt(r[1],UB)) yield * a(r[3])
    }(this.#root)
  }
  static ITER_FWD_GE_TO_LT = function*(){    
    if(!this.#root) return
    const LB = this.ITER_LB
    const UB = this.ITER_UB 
    const lt = this.COMP_LT
    const le = this.COMP_LE
    const gt = this.COMP_GT
    const ge = this.COMP_GE
    yield * function *a(r){
      if(!r) return
      if(gt(r[1],LB)) yield * a(r[2])
      if(ge(r[1],LB) && lt(r[1],UB)) yield r
      if(lt(r[1],UB)) yield * a(r[3])
    }(this.#root)
  }
  static ITER_FWD_GT_TO_LE = function*(){ 
    if(!this.#root) return
    const LB = this.ITER_LB
    const UB = this.ITER_UB 
    const lt = this.COMP_LT
    const le = this.COMP_LE
    const gt = this.COMP_GT
    const ge = this.COMP_GE
    yield * function *a(r){
      if(!r) return
      if(gt(r[1],LB)) yield * a(r[2])
      if(gt(r[1],LB) && le(r[1],UB)) yield r
      if(lt(r[1],UB)) yield * a(r[3])
    }(this.#root)
  }
  static ITER_FWD_GT_TO_LT = function*(){  
    if(!this.#root) return
    const LB = this.ITER_LB
    const UB = this.ITER_UB 
    const lt = this.COMP_LT
    const le = this.COMP_LE
    const gt = this.COMP_GT
    const ge = this.COMP_GE
    yield * function *a(r){
      if(!r) return
      if(gt(r[1],LB)) yield * a(r[2])
      if(gt(r[1],LB) && lt(r[1],UB)) yield r
      if(lt(r[1],UB)) yield * a(r[3])
    }(this.#root)
  }
  static ITER_REV_LE_TO_GE = function*(){ 
    if(!this.#root) return
    const LB = this.ITER_LB
    const UB = this.ITER_UB 
    const lt = this.COMP_LT
    const le = this.COMP_LE
    const gt = this.COMP_GT
    const ge = this.COMP_GE
    yield * function *a(r){
      if(!r) return
      if(lt(r[1],UB)) yield * a(r[3])
      if(ge(r[1],LB) && le(r[1],UB)) yield r
      if(gt(r[1],LB)) yield * a(r[2])
    }(this.#root)
  }
  static ITER_REV_LE_TO_GT = function*(){  
    if(!this.#root) return
    const LB = this.ITER_LB
    const UB = this.ITER_UB 
    const lt = this.COMP_LT
    const le = this.COMP_LE
    const gt = this.COMP_GT
    const ge = this.COMP_GE
    yield * function *a(r){
      if(!r) return
      if(lt(r[1],UB)) yield * a(r[3])
      if(gt(r[1],LB) && le(r[1],UB)) yield r
      if(gt(r[1],LB)) yield * a(r[2])
    }(this.#root)
  }
  static ITER_REV_LT_TO_GE = function*(){  
    if(!this.#root) return
    const LB = this.ITER_LB
    const UB = this.ITER_UB 
    const lt = this.COMP_LT
    const le = this.COMP_LE
    const gt = this.COMP_GT
    const ge = this.COMP_GE
    yield * function *a(r){
      if(!r) return
      if(lt(r[1],UB)) yield * a(r[3])
      if(ge(r[1],LB) && lt(r[1],UB)) yield r
      if(gt(r[1],LB)) yield * a(r[2])
    }(this.#root)
  }
  static ITER_REV_LT_TO_GT = function*(){ 
    if(!this.#root) return
    const LB = this.ITER_LB
    const UB = this.ITER_UB 
    const lt = this.COMP_LT
    const le = this.COMP_LE
    const gt = this.COMP_GT
    const ge = this.COMP_GE
    yield * function *a(r){
      if(!r) return
      if(lt(r[1],UB)) yield * a(r[3])
      if(gt(r[1],LB) && lt(r[1],UB)) yield r
      if(gt(r[1],LB)) yield * a(r[2])
    }(this.#root)
  }
  static ITER_LEVEL_ORDER = function*(){
    let level = this.#root ? [this.#root] : []
    while(level.length>0) {
      let tmp = []
      yield level
      for(let i = 0; i < level.length; i++){
        const n = level[i]
        if(n[2]) tmp.push(n[2])

        if(n[3]) tmp.push(n[3])
      }
      level = tmp
    }
  }
  static ITER_PREORDER = function*(){
    const stack = this.#root ? [this.#root] : []
    while(stack.length > 0){
      const n = stack.pop()
      const l = n[2]
      const r = n[3]
      yield n
      if(r) stack.push(r)
      if(l) stack.push(l)
    }
  }
  static ITER_POSTORDER = function*(){
    const stackA = this.#root ? [this.#root] : []
    const stackB = []
    while(stackA.length > 0){
      const p = stackA.pop()
      stackB.push(p)
      if(p[2]) stackA.push(p[2])
      if(p[3]) stackA.push(p[3])
    }
    while(
      stackB.length > 0
    ) yield stackB.pop()
  }
  static ITER_REV_PREORDER = function*(){
    const stack = this.#root ? [this.#root] : []
    while(stack.length > 0){
      const n = stack.pop()
      const l = n[2]
      const r = n[3]
      yield n
      if(l) stack.push(l)
      if(r) stack.push(r)
    }       
  }
  static ITER_REV_POSTORDER = function*(){
    const stackA = this.#root ? [this.#root] : []
    const stackB = []
    while(stackA.length > 0){
      const p = stackA.pop()
      stackB.push(p)
      if(p[3]) stackA.push(p[3])
      if(p[2]) stackA.push(p[2])
    }
    while(
      stackB.length > 0
    ) yield stackB.pop()
  }
  static COMP_EQ = (a,b)=>a==b
  static COMP_LT = (a,b)=>a<b
  static COMP_LE = (a,b)=>a<=b
  static COMP_GT = (a,b)=>a>b
  static COMP_GE = (a,b)=>a>=b
  COMP_EQ
  COMP_LT
  COMP_LE
  COMP_GT
  COMP_GE
  ITER_LB = -Infinity
  ITER_UB = Infinity
  OSSelect(I = 1, X = this.#root){
    // nodes are arrays
    // indexes:
    // 0 = height
    // 1 = key
    // 2 = left
    // 3 = right
    // 4 = size
    // 5 ? value
    //if(X == this.#root) console.log("OSS root",I)
    //else console.log("OSS nonroot",I)
    if(X == null) return null
    const R = (
      X[2] ? X[2][4] : 0
    ) + 1
    //console.log("OSS_R_DBG",R)
    if(I == R) return X
    else if(I < R) return this.OSSelect(I,X[2])
    else return this.OSSelect(I-R,X[3])
  }
  OSRank(key, searchRoot = this.#root){
    if(!searchRoot) return 0
    if(searchRoot[1] <= key){
      if(!searchRoot[2]) return this.OSRank(
        key, searchRoot[3]
      ) + 1
      else return this.OSRank(
        key, searchRoot[3]
      ) + 1 + searchRoot[2][4]
    } else return this.OSRank(key,searchRoot[2])
  }
  constructor(
    sortedArray = null,
    comp_eq = AVL.COMP_EQ,
    comp_lt = AVL.COMP_LT,
    comp_le = AVL.COMP_LE,
    comp_gt = AVL.COMP_GT,
    comp_ge = AVL.COMP_GE
  ){
    this.COMP_EQ = comp_eq
    this.COMP_LT = comp_lt
    this.COMP_LE = comp_le
    this.COMP_GT = comp_gt
    this.COMP_GE = comp_ge
    this[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    if(
      sortedArray instanceof Array && 
      sortedArray.length > 0
    ){
      let sizeCounter = 0
      this.#root = (
        function preorderBuild(
          LBI = 0,
          RBI = sortedArray.length - 1,
          parent = null
        ){
          const MP = LBI !== RBI ? LBI + Math.floor(
            (RBI - LBI) / 2
          ) : LBI
          let k, v
          const en = sortedArray[MP]
          if(en instanceof Array){
            k = en[0]
            v = en[1]
          } else {
            k = en
            v = null
          }
          const n = [
            1, 
            k, 
            null, null, 
            1, v
          ]
          sizeCounter++
          // left child
          n[2] = LBI !== MP ? preorderBuild(
              LBI,
              MP - 1,
              n
            ) : null
          // right child
          n[3] = RBI !== MP ? preorderBuild(
              MP + 1,
              RBI,
              n
            ) : null
          return n
        }
      )()
      this[Symbol.iterator] = AVL.ITER_POSTORDER
      for(let n of this){
        this.#reSize(n)
        this.#reHeight(n)
      }
    }
    this[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
  }
  #reSize(n){
    n[4] = (
      n[2] ? n[2][4] : 0
    ) + (
      n[3] ? n[3][4] : 0
    ) + 1
  }
  #reHeight(n){
    const l = n[2]
    const r = n[3]
    n[0] = 1 + Math.max(
      !l ? 0 : l[0],
      !r ? 0 : r[0]
    )
  }
  #getBalanceFactor(n){
    return !n ? 0 : (
      (
        !n[2] ? 0 : n[2][0]
      ) - (
        !n[3] ? 0 : n[3][0]
      )
    )
  }
  search(key, searchRoot = this.#root){
    while(
      searchRoot != null && !(this.COMP_EQ(searchRoot[1],key))
    ){
      if(this.COMP_LT(key,searchRoot[1])){
        searchRoot = searchRoot[2]
      } else {
        searchRoot = searchRoot[3]
      }
    }
    return searchRoot
  }
  #leftLeft(E, eParent = null){
    const C = E[2]
    if(!eParent) this.#root = C
    else if(
      eParent[2] == E
    ) eParent[2] = C
    else eParent[3] = C
    const D = C[3]
    C[3] = E
    E[2] = D
    this.#reHeight(E)
    this.#reSize(E)
    this.#reHeight(C)
    this.#reSize(C)
  }
  #rightRight(B, bParent){
    const D = B[3] 
    if(!bParent) this.#root = D
    else if(
      bParent[2] == B
    ) bParent[2] = D
    else bParent[3] = D 
    const C = D[2] 
    D[2] = B 
    B[3] = C 
    this.#reHeight(B)
    this.#reSize(B)
    this.#reHeight(D)
    this.#reSize(D)
  }
  #leftRight(E, eParent){
    const B = E[2]
    const C = B[3]
    const CL = C[2]
    const D = C[3]
    E[2] = D
    B[3] = CL
    C[2] = B
    C[3] = E 
    if(eParent){
      if(eParent[2] == E) eParent[2] = C
      else eParent[3] = C
    } else this.#root = C
    this.#reHeight(E)
    this.#reHeight(B)
    this.#reHeight(C)
    this.#reSize(E)
    this.#reSize(B)
    this.#reSize(C)
  }
  #rightLeft(B, bParent){
    const E = B[3]
    const D = E[2]
    const DR = D[3]
    const C = D[2]
    B[3] = C
    E[2] = DR
    D[3] = E
    D[2] = B
    if(bParent){
      if(bParent[2] == B) bParent[2] = D
      else bParent[3] = D
    } else this.#root = D
    this.#reHeight(E)
    this.#reHeight(B)
    this.#reHeight(D)
    this.#reSize(E)
    this.#reSize(B)
    this.#reSize(D)
  }
  #retrace(path){
    for(
      let current = path.pop(); 
      current; 
      current = path.pop()
    ){
      this.#reSize(current)
      this.#reHeight(current)
      const NBF = this.#getBalanceFactor(current)
      const LBF = this.#getBalanceFactor(current[2])
      const RBF = this.#getBalanceFactor(current[3])
      const atRoot = current == this.#root
      let dbg = null
      if (
        NBF > 1 && // LL - Left Child Tall due to Left Grandchild
        LBF >= 0
      ){
        this.#leftLeft(
          current, 
          atRoot ? null : path[path.length - 1]
        )
      } else if (
        NBF>1 && 
        LBF<0 // LR - Left Child Tall due to Right Grandchild
      ){
        this.#leftRight(
          current, 
          atRoot ? null : path[path.length - 1]
        )
      } else if (
        NBF < -1 && // RR - Right Child Tall due to Right Grandchild
        RBF <= 0
      ){
        this.#rightRight(
          current, 
          atRoot ? null : path[path.length - 1]
        )
      } else if (
        NBF < -1 &&
        RBF > 0
      ){// RL
        this.#rightLeft(
          current, 
          atRoot ? null : path[path.length - 1]
        )
      }
    }
  }
  insert(key, node = this.#root, value = null){
    if(!this.#root){
      this.#root = [
        1, key,
        null, null,
        1, value
      ]
      return this.#root
    }
    else {
      const path = [];
      let current = null
      for(
        current = this.#root; 
        current!= null;
      ){
        if(
          this.COMP_LT(key,current[1])
        ){
          path.push(current)
          current = current[2]
        }
        else if(
          this.COMP_GT(key,current[1])
        ){
          path.push(current)
          current = current[3]
        } else {
          break
        }
      }
      if(current) return null
      else {
        // insert
        const parent = path[path.length - 1]
        let inserted
        if(this.COMP_LT(key,parent[1])){
          parent[2] = [
            1, key,
            null, null,
            1, value
          ]
          inserted = parent[2]
        } else {
          parent[3] = [
            1, key, null,
            null,
            1, value
          ]
          inserted = parent[3]
        }
        // re-tracing
        this.#retrace(path)
        return inserted
      }
    }
  }
  getMinOfSubtree(node = this.#root){
    return !node || !node[2] ? node : (
      this.getMinOfSubtree(
        node[2]
      )
    )
  }
  getMaxOfSubtree(node = this.#root){
    return !node || !node[3] ? node : (
      this.getMaxOfSubtree(
        node[3]
      )
    )
  }
  #leafRemoval(leaf, leafParent){
    if(this.#root == leaf) this.#root = null
    else {
      if(leaf == leafParent[2]) leafParent[2] = null
      else leafParent[3] = null
    }
  }
  #leftOnlyChildParentRemoval(target, targetParent){
    if(this.#root != target){
      if(
        target == targetParent[2]
      ) targetParent[2] = target[2]
      else targetParent[3] = target[2]      
    } else this.#root = target[2]
  }
  #rightOnlyChildParentRemoval(target, targetParent){
    if(this.#root !=target){
      if(
        target == targetParent[2]
      ) targetParent[2] = target[3]
      else targetParent[3] = target[3]
    } else this.#root = target[3]
  }
  #twoChildParentRemoval(target, path){
    const idx = path.length
    let MS2 = this.getMinOfSubtree(target[3])
    let MS = target[3]
    path.push(MS)
    let it = MS[2]
    while(it){
      MS = it
      path.push(MS)
      it = it[2]
    }
    const MSParent = path[path.length - 2]
    const matchIsRoot = this.#root == target
    const matchParent = path.length > 0 ? path[path.length - 2] : null
    if(MS == target[3]){
      // replace match with its right child
      if(!matchIsRoot){
        if(
          target == matchParent[2]
        ) matchParent[2] = MS
        else matchParent[3] = MS
      } else this.#root = MS
      // reparent match's left child
      MS[2] = target[2]
    } else {
      path.splice(idx,0,target)
      const tmp = target[1]
      target[1] = MS[1]
      MS[1] = tmp
      this.#rightOnlyChildParentRemoval(
        MS, MSParent
      )
      path.pop()
    }
  }
  remove(key, node = this.#root){
    if(!this.#root) return null
    else {
      const path = []
      let current = this.#root
      while(
        current &&
        !(this.COMP_EQ(current[1],key))
      ){
        path.push(current)
        if(this.COMP_LT(key,current[1])){
          current = current[2]
        } else {
          current = current[3]
        }
      }
      if(
        current == this.#root &&
        this.COMP_EQ(current[1],key)
      ) path.push(current)
      if(!current) return null
      else {
        // removal
        const matchIsRoot = this.#root[1] === current[1]
        const matchParent = matchIsRoot ? null : (
          path[path.length - 1]
        )
        let match = current
        if(
          !match[2] && 
          !match[3]
        ){ 
          this.#leafRemoval(match, matchParent)
        } else if(
          !match[2] || 
          !match[3]
        ){ 
          if(match[2]){
            this.#leftOnlyChildParentRemoval(
              match, matchParent
            )
          } else {
            this.#rightOnlyChildParentRemoval(
              match, matchParent
            )
          }
        } else { // 2-children removal
          this.#twoChildParentRemoval(
            match, path
          )
        }
        // re-tracing
        this.#retrace(path)
      }
    }
  }
  get root(){
    return this.#root
  }
  get size(){
    return this.#root ? this.#root[4] : 0
  }
  get min(){
    return this.getMinOfSubtree()
  }
  get max(){
    return this.getMaxOfSubtree()
  }
  static union( 
    a,
    b,
    comp_lt = AVL.COMP_LT,
    comp_gt = AVL.COMP_GT
  ){    
    a[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    a.ITER_LB = -Infinity
    a.ITER_UB = Infinity
    const aMembers = [...a].map(v=>[v[1],v[5]]);
    b[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    b.ITER_LB = -Infinity
    b.ITER_UB = Infinity
    const bMembers = [...b].map(v=>[v[1],v[5]]);
    const ab = []
    for(let i = 0, j = 0; i < aMembers.length || j < bMembers.length;){
      if(i < aMembers.length && j < bMembers.length){
        if(comp_lt(aMembers[i][0],bMembers[j][0])){
          ab.push(aMembers[i])
          i++
        } else if (comp_gt(aMembers[i][0],bMembers[j][0])){
          ab.push(bMembers[j])
          j++
        } else {
          ab.push([bMembers[j][0],[aMembers[i][1],bMembers[j][1]]])
          j++
          i++
        }
      } else if(i < aMembers.length){
        ab.push(aMembers[i])
        i++
      } else {
        ab.push(bMembers[j])
        j++
      }
    }
    return new AVL(
      ab,
      a.COMP_EQ,
      a.COMP_LT,
      a.COMP_LE,
      a.COMP_GT,
      a.COMP_GE
    )
  }
  static intersect( 
    a,
    b,
    comp_lt = AVL.COMP_LT,
    comp_gt = AVL.COMP_GT,
    comp_eq = AVL.COMP_EQ
  ){
    a[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    a.ITER_LB = -Infinity
    a.ITER_UB = Infinity
    const aMembers = [...a].map(v=>[v[1],v[5]]);
    b[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    b.ITER_LB = -Infinity
    b.ITER_UB = Infinity
    const bMembers = [...b].map(v=>[v[1],v[5]]);
    const ab = []
    for(let i = 0, j = 0; i < aMembers.length && j < bMembers.length;){
      if(comp_lt(aMembers[i][0],bMembers[j][0])){
        i++
      } else if(comp_gt(aMembers[i][0],bMembers[j][0])){
        j++
      } else if(comp_eq(aMembers[i][0],bMembers[j][0])) {
        ab.push([bMembers[j][0],[aMembers[i][1],bMembers[j][1]]])
        i++
        j++
      }
    }
    return new AVL(
      ab,
      a.COMP_EQ,
      a.COMP_LT,
      a.COMP_LE,
      a.COMP_GT,
      a.COMP_GE
    )
  }
  static difference(
    a, 
    b,
    serialize = key => JSON.stringify(key)
  ){
    b[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    b.ITER_LB = -Infinity
    b.ITER_UB = Infinity
    const bMembers = [...b].map(v=>serialize(v[1]));
    const bSet = new Set(bMembers)
    const ab=[]
    a[Symbol.iterator] = AVL.ITER_FWD_GE_TO_LE
    a.ITER_LB = -Infinity
    a.ITER_UB = Infinity
    for(let n of a){
      if(
        !bSet.has(serialize(n[1]))
      ) ab.push([n[1],n[5]])
    }
    return new AVL(
      ab,
      a.COMP_EQ,
      a.COMP_LT,
      a.COMP_LE,
      a.COMP_GT,
      a.COMP_GE
    )
  }
  minGreaterEqual(searchTerm){
    let match = null
    let current = this.#root
    while(current){
      if(this.COMP_GE(current[1],searchTerm)){
        match = current
        current = current[2]
      } else {
        current = current[3]
      }
    }
    if(match) return match
    else return null
  }
  maxLesserEqual(searchTerm){
    let match = null
    let current = this.#root
    while(current){
      if(this.COMP_LE(current[1],searchTerm)){
        match = current
        current = current[3]
      } else {
        current = current[2]
      }
    }
    if(match) return match
    else return null
  }
  minGreater(searchTerm){
    let match = null
    let current = this.#root
    while(current){
      if(this.COMP_GT(current[1],searchTerm)){
        match = current
        current = current[2]
      } else {
        current = current[3]
      }
    }
    if(match) return match
    else return null
  }
  maxLesser(searchTerm){
    let match = null
    let current = this.#root
    while(current){
      if(this.COMP_LT(current[1],searchTerm)){
        match = current
        current = current[3]
      } else {
        current = current[2]
      }
    }
    if(match) return match
    else return null
  }
}

