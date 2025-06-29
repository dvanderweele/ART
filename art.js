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

// ART RANGE QUERY CONSTANTS
export const FORWARD = 0,
      EXCLUSIVE = 0,
      LOWER_BOUND_INCLUSIVE = 1,
      UPPER_BOUND_INCLUSIVE = 2,
      REVERSE = 4,
      FIXED_LENGTH_KEY = 5,
      VARIABLE_LENGTH_KEY = 6,
      LEAF_COMPONENT = 7


export class ByteStack {
  [Symbol.iterator] = function*(){
    // forward iterator
    for(let i = 0; i < this.size; i++) yield this.dv.getUint8(i)
  }
  constructor(initialCapacity = 8){
    this.size = 0
    this.dv = new DataView(
      new ArrayBuffer(
        Math.max(1, initialCapacity)
      )
    )
  }
  #grow(){
    const dv = this.dv
    const ogl = dv.byteLength
    const ndv = new DataView(
      new ArrayBuffer(
        ogl * 2
      )
    )
    const ub = Math.floor(ogl / 8) * 8
    for(let i = 0; i < ub; i += 8) ndv.setFloat64(
      i,
      dv.getFloat64(
        i, false
      ),
      false
    )
    for(let j = ub; j < ogl; j++) ndv.setUint8(
      j, dv.getUint8(j)
    )
    this.dv = ndv
  }
  push(b){
    if(this.size >= this.dv.byteLength) this.#grow()
    //console.log("KS-IN, before b",b,"size", this.size, "$", this.dv)
    this.dv.setUint8(this.size++, b)
    //console.log("KS-IN, after b",b,"size", this.size, "$", this.dv)
  }
  pop(){
    //console.log("KS-OUT, before", this.size, "$", this.dv)
    return this.size < 1 ? -1 : this.dv.getUint8(--this.size)
  }
  pull(){    
    const dv = this.dv
    const ogl = this.size
    const r = new DataView(
      new ArrayBuffer(
        ogl
      )
    )    
    const ub = Math.floor(ogl / 8) * 8
    for(let i = 0; i < ub; i += 8) r.setFloat64(
      i,
      dv.getFloat64(
        i, false
      ),
      false
    )
    for(let j = ub; j < ogl; j++) r.setUint8(
      j, dv.getUint8(j)
    )
    return r
  }
  peek(){
    const s = this.size
    if(s > 0) return this.dv.getUint8(s-1)
    return -1
  }
}

/**
 * FIXED TRAVERSAL STATE TABLE
 *
 * KInc.  Depth  Align.  LBnd.  UBnd.  NInc.
 * =====  =====  ======  =====  =====  =====
 *     Y    < $      N       0    255      Y
 *     Y    < $      Y    <=UB   >=LB      Y
 *     Y      $      N       0    255      Y
 *     Y      $      Y    <=UB   >=LB      Y
 *     N    < $      N       0    255      Y
 *     N    < $      Y    <=UB   >=LB      Y
 *     N      $      N       0    255      Y
 *     N      $      Y    <=UB   >=LB      N
 *
 * SIMPLIFIED
 *
 * KInc.  Depth  Align.  NInc.
 * =====  =====  ======  =====
 *     N      $      Y       N
 *     *      *      *       Y     
 *
 *   ALIGNMENT SCENARIOS
 *   ===================
 *   alphabet 0-9
 *   LBI Key: 333
 *   UBI Key: 666
 *            3   LA    3 to 6
 *             4        3 to 9
 *              9       0 to 9
 *            6      UA 3 to 6
 *             0        0 to 6
 *              9       0 to 9
 *             6     UA 0 to 6
 *              0       0 to 6
 *              6    UA 0 to 6
 *   LBI Key: 123
 *   UBI Key: 876
 *            1   LA    1 to 8
 *             2  LA    2 to 9
 *              3 LA    3 to 9
 *              9       3 to 9
 *             9        2 to 9
 *              9       0 to 9
 *            8      UA 1 to 8
 *             1        0 to 7
 *              0       0 to 9
 *             7     UA 0 to 7
 *              3       0 to 6
 *              6    UA 0 to 6 
 *   LBX Key: 333 (min 334)
 *   UBX Key: 666 (max 665)
 *            3   LA    3 to 6
 *             3  LA    3 to 9
 *              4 LA    4 to 9
 *             5        3 to 9
 *              9       0 to 9
 *             9        3 to 9
 *              9       0 to 9
 *            6      UA 3 to 6
 *             0        0 to 6
 *              0       0 to 9
 *              9       0 to 9
 *             6     UA 0 to 6
 *              0       0 to 5
 *              5    UA 0 to 5
 *   
 *   ALIGNMENT INHERITANCE TABLE
 *   ===========================
 *   Legend:
 *   - CLA  = Can Lower Align
 *   - CUA  = Can Upper Align
 *   - KLI  = Key Low Bound Inclusive
 *   - KUI  = Key High Bound Inclusive
 *   - NLI  = Node Low Bound Inclusive
 *   - NUI  = Node High Bound Inclusive
 *   - KLB  = Key Low Bound Byte
 *   - KHB  = Key High Bound Byte
 *   - NLB  = Node Low Bound Byte
 *   - NUB  = Node High Bound Byte
 *   - DEP  = Depth
 *
 *   DEP CLA CUA
 *   === === ===
 *     0   Y   Y
 *
 *
 */
export class FixStackEntry {
  #stateView
  #generator
  #yieldCache
  constructor(
    node,
    keyLowInclusive,
    keyHighInclusive,
    depth,
    maxDepth,
    order,
    canLowerAlign,
    canUpperAlign,
    lowerBound,
    upperBound
  ){
    /**
     *  Byte  Bit   Desc
     *  ====  ====  ====
     *     0    0   NdLX
     *     0    1   NdUX
     *     0    2   Fwd
     *     0    3   CLA
     *     0    4   CUA
     *     0    5   Done
     *     1    *   KLB
     *     2    *   KHB
     *  3-10    *   Dep.
     *
     */
    const sv = new DataView(
      new ArrayBuffer(11)
    )
    this.#stateView = sv
    let nodeLowInclusive = true 
    let nodeHiInclusive = true 
    sv.setFloat64(3,depth)
    sv.setUint8(1,lowerBound)
    sv.setUint8(2,upperBound)
    let stateByte = 0
    if(order == FORWARD) stateByte |= (0b100>>>0) 
    if(canLowerAlign){
      stateByte |= (0b1000>>>0)
      if(
        depth == maxDepth 
        && !(keyLowInclusive == LOWER_BOUND_INCLUSIVE)
      ){
        stateByte |= (0b1>>>0)
        nodeLowInclusive = false
      }
    }  
    if(canUpperAlign){
      stateByte |= (0b10000>>>0)
      if(
        depth == maxDepth 
        && !(keyHighInclusive == UPPER_BOUND_INCLUSIVE)
      ){
        stateByte |= (0b10>>>0)
        nodeHiInclusive = false
      }
    } 
    sv.setUint8(0,(stateByte>>>0))
    /*FORWARD = 0,
      EXCLUSIVE = 0,
      LOWER_BOUND_INCLUSIVE = 1,
      UPPER_BOUND_INCLUSIVE = 2,
      REVERSE = 4,
    */
    const iterFuncNames = [// F + LX + UX
      "ITER_FWD_GT_TO_LT", // 0 + 0  + 0
      "ITER_FWD_GE_TO_LT", // 0 + 1  + 0
      "ITER_FWD_GT_TO_LE", // 0 + 0  + 2
      "ITER_FWD_GE_TO_LE", // 0 + 1  + 2
      "ITER_REV_LT_TO_GT", // 4 + 0  + 0
      "ITER_REV_LT_TO_GE", // 4 + 1  + 0
      "ITER_REV_LE_TO_GT", // 4 + 0  + 2
      "ITER_REV_LE_TO_GE"  // 4 + 1  + 2
    ]
    const iterFuncName = iterFuncNames[order + (nodeLowInclusive ? LOWER_BOUND_INCLUSIVE: EXCLUSIVE)+ (nodeHiInclusive ? UPPER_BOUND_INCLUSIVE : EXCLUSIVE)];
    //console.log("DBG275",iterFuncName,node.constructor,node)
    node[Symbol.iterator] = node.constructor[iterFuncName]
    node.ITER_LB = canLowerAlign ? lowerBound : 0
    node.ITER_UB = canUpperAlign ? upperBound : 255
    const g = node[Symbol.iterator]()
    this.#generator = g
    const fyield = g.next()
    if(fyield.done){
      stateByte |= (0b100000 >>> 0)
      this.#yieldCache = null
    } else {
      this.#yieldCache = [
        canLowerAlign && fyield.value[0] == lowerBound, // canLowerAlign?
        canUpperAlign && fyield.value[0] == upperBound,// canUpperAlign?
        fyield.value
      ]
    }
  }
  get depth(){
    return this.#stateView.getFloat64(3)
  }
  next(){
    let sb = this.#stateView.getUint8(0)
    if(((sb & 0b100000)>>>0) == 0b100000) return ({
      done: true,
      value: null
    })
    const c = {
      done: false,
      value: this.#yieldCache
    }
    const n = this.#generator.next()
    if(n.done){
      sb |= (0b100000>>>0)
      this.#yieldCache = null
      this.#stateView.setUint8(0,sb)
    } else {
      this.#yieldCache = [
        (((sb & 0b1000)>>>0) == 0b1000) && (n.value[0] == this.#stateView.getUint8(1)),
        (((sb & 0b10000)>>>0) == 0b10000) && (n.value[0] == this.#stateView.getUint8(2)),
        n.value
      ]
    }
    return c
  }
}

export function evalFixN1(
  node,
  keyLowInclusive,
  keyHighInclusive,
  depth,
  maxDepth,
  canLowerAlign,
  canUpperAlign,
  lowerBound,
  upperBound
){
  const kb = node[0].charCodeAt(0)
  const child = node[1]
  let nodeLowInclusive = true 
  let nodeHiInclusive = true 
  if(canLowerAlign){
    if(
      depth == maxDepth 
      && !(keyLowInclusive == LOWER_BOUND_INCLUSIVE)
    ) nodeLowInclusive = false
  }  
  if(canUpperAlign){
    if(
      depth == maxDepth 
      && !(keyHighInclusive == UPPER_BOUND_INCLUSIVE)
    ) nodeHiInclusive = false
  }
  const LB = canLowerAlign ? lowerBound : 0
  const UB = canUpperAlign ? upperBound : 255
  let outOfLowerBound = false
  let outOfUpperBound = false
  if( 
    (
      nodeLowInclusive && kb < LB
    ) || (
      !nodeLowInclusive && kb <=LB
    )
  ) outOfLowerBound = true
  if( 
    (
      nodeHiInclusive && kb > UB
    ) || (
      !nodeHiInclusive && kb >=UB
    )
  ) outOfUpperBound = true
  if(outOfUpperBound || outOfLowerBound) return null
  return [
    canLowerAlign && kb == lowerBound, 
    canUpperAlign && kb == upperBound,
    [kb, child]
  ]
}

export class VarStackEntry {
  #stateView
  #generator
  #yieldCache
  constructor(
    node,
    sentinel,
    keyLowInclusive,
    keyHighInclusive,
    depth,
    keyLowPrefixLen,
    keyHighPrefixLen,
    order,
    canLowerAlign,
    canUpperAlign,
    lowerBound,
    upperBound
  ){
    /**
     *  Byte  Bit   Desc
     *  ====  ====  ====
     *     0    0   NdLX
     *     0    1   NdUX
     *     0    2   Fwd
     *     0    3   CLA
     *     0    4   CUA
     *     0    5   Done
     *     0    6   KeyHighExclusive
     *     0    7   KeyLowExclusive
     *     1    *   KLB
     *     2    *   KHB
     *  3-10    *   Dep.
     *    11    *   LowDepthSegment
     *    12    *   HighDepthSegment
     *    13    *   SNTL
     *
     */
    const sv = new DataView(
      new ArrayBuffer(27)
    )
    this.#stateView = sv
    let nodeLowInclusive = true 
    let nodeHiInclusive = true 
    sv.setFloat64(3,depth) 
    let lowDepthSegment = 0
    const lbsd = keyLowPrefixLen-1
    if(depth==lbsd) lowDepthSegment+= 2
    if(depth > lbsd) lowDepthSegment+=3
    if(depth == lbsd-1) lowDepthSegment++ 
    let hiDepthSegment = 0
    const hbsd = keyHighPrefixLen-1
    if(depth==hbsd) hiDepthSegment+= 2
    if(depth > hbsd) hiDepthSegment+=3
    if(depth == hbsd-1) hiDepthSegment++
    sv.setUint8(11,lowDepthSegment)
    sv.setUint8(12,hiDepthSegment)
    sv.setUint8(1,lowerBound)
    sv.setUint8(2,upperBound)
    sv.setUint8(13,sentinel)
    let stateByte = 0
    if(order == FORWARD) stateByte |= (0b100>>>0) 
    if(canLowerAlign){
      stateByte |= (0b1000>>>0)
      if(
        depth == keyLowPrefixLen-1 
        && !(keyLowInclusive == LOWER_BOUND_INCLUSIVE)
      ){
        stateByte |= (0b1>>>0)
        nodeLowInclusive = false
      }
    }  
    if(canUpperAlign){
      stateByte |= (0b10000>>>0)
      if(
        depth == keyHighPrefixLen-1
        && !(keyHighInclusive == UPPER_BOUND_INCLUSIVE)
      ){
        stateByte |= (0b10>>>0)
        nodeHiInclusive = false
      }
    } 
    if(!keyHighInclusive) stateByte |= (0b1000000>>>0)
    if(!keyLowInclusive) stateByte |= (0b10000000>>>0)
    sv.setUint8(0,(stateByte>>>0))
    /*FORWARD = 0,
      EXCLUSIVE = 0,
      LOWER_BOUND_INCLUSIVE = 1,
      UPPER_BOUND_INCLUSIVE = 2,
      REVERSE = 4,
    */
    const iterFuncNames = [// F + LX + UX
      "ITER_FWD_GT_TO_LT", // 0 + 0  + 0
      "ITER_FWD_GE_TO_LT", // 0 + 1  + 0
      "ITER_FWD_GT_TO_LE", // 0 + 0  + 2
      "ITER_FWD_GE_TO_LE", // 0 + 1  + 2
      "ITER_REV_LT_TO_GT", // 4 + 0  + 0
      "ITER_REV_LT_TO_GE", // 4 + 1  + 0
      "ITER_REV_LE_TO_GT", // 4 + 0  + 2
      "ITER_REV_LE_TO_GE"  // 4 + 1  + 2
    ]
    const iterFuncName = iterFuncNames[order + (nodeLowInclusive ? LOWER_BOUND_INCLUSIVE: EXCLUSIVE)+ (nodeHiInclusive ? UPPER_BOUND_INCLUSIVE : EXCLUSIVE)];
    node[Symbol.iterator] = node.constructor[iterFuncName]
    node.ITER_LB = canLowerAlign ? lowerBound : 0
    node.ITER_UB = canUpperAlign ? upperBound : 255
    const g = node[Symbol.iterator]()
    this.#generator = g
    const fyield = g.next()
    if(fyield.done){ 
      stateByte |= (0b100000 >>> 0)
      this.#yieldCache = null
    } else {
      const lbd = this.LB_Decide(
        fyield.value[0],
        canLowerAlign
      )
      const ubd = this.UB_Decide(
        fyield.value[0],
        canUpperAlign
      )
      const lbdo = lbd[0]
      const ubdo = ubd[0]
      const canYieldRes =lbdo[0] && ubdo[0]
      const canDescendRes = lbdo[1] && ubdo[1]
      if(!canYieldRes && !canDescendRes){
        const fyield2 = g.next()
        if(fyield2.done){ 
          stateByte |= (0b100000 >>> 0)
          this.#yieldCache = null
        } else {
          const lbd2 = this.LB_Decide(
            fyield2.value[0],
            canLowerAlign
          )
          const ubd2 = this.UB_Decide(
            fyield2.value[0],
            canUpperAlign
          )
          const lbdo2 = lbd2[0]
          const ubdo2 = ubd2[0]
          const canYieldRes2 =lbdo2[0] && ubdo2[0]
          const canDescendRes2 = lbdo2[1] && ubdo2[1]
          this.#yieldCache = [
            canYieldRes2, // canYield?
            canDescendRes2, // canDescend?
            lbd2[1], // canLowerAlign?
            ubd2[1],// canUpperAlign?
            fyield2.value
          ]
        }
      }
      else this.#yieldCache = [
        canYieldRes, // canYield?
        canDescendRes, // canDescend?
        lbd[1], // canLowerAlign?
        ubd[1],// canUpperAlign?
        fyield.value
      ]
    }
    this.#stateView.setUint8(0,stateByte)
  }
  static evalVarN1(
    node,
    depth,
    keyLowInclusive,
    keyHighInclusive,
    keyLowPrefixLen,
    keyHighPrefixLen,
    sentinel,
    canLowerAlign,
    canUpperAlign,
    lowerBound,
    upperBound
  ){
    const currentByte = node[0].charCodeAt(0)
    const child = node[1] 
    let ILA = false
    if(canLowerAlign){
      if(!keyLowInclusive){
        if(currentByte == lowerBound+1) ILA = true
        else ILA = false
      } else {
        if(currentByte == lowerBound) ILA = true
        else ILA = false
      }
    }
    let IUA = false
    if(canUpperAlign){
      if(!keyHighInclusive){
        if(currentByte == upperBound-1) IUA = true
        else IUA = false
      } else {
        if(currentByte == upperBound) IUA = true
        else IUA = false
      }
    }
    let s = 0
    if(currentByte == sentinel) s+=4
    if(canLowerAlign) s+=8
    if(canLowerAlign && ILA) s+=16
    let lowDepthSegment = 0
    const lbsd = keyLowPrefixLen-1
    if(depth==lbsd) lowDepthSegment+= 2
    if(depth > lbsd) lowDepthSegment+=3
    if(depth == lbsd-1) lowDepthSegment++ 
    let hiDepthSegment = 0
    const hbsd = keyHighPrefixLen-1
    if(depth==hbsd) hiDepthSegment+= 2
    if(depth > hbsd) hiDepthSegment+=3
    if(depth == hbsd-1) hiDepthSegment++
    s+=lowDepthSegment
    s+=hiDepthSegment
    if(!keyHighInclusive) s+= 32
    return [
      ...VarStackEntry.decisions[s],
      ILA,
      IUA,
      [
        currentByte,
        child
      ]
    ]
  }
  static combos = [
    /* CanY, CanD */
    [false, false],
    [false, true],
    [true, false],
    [true, true]
  ]
  static decisions = [
    /* 0   1   2   3   4   5   6   7   8   9  */
       1,  1,  1,  1,  2,  2,  2,  2,  1,  1, //  0
       1,  0,  0,  0,  0,  0,  0,  0,  0,  0, // 10
       0,  0,  0,  0,  1,  1,  0,  0,  0,  0, // 20
       2,  0,  1,  1,  1,  1,  2,  2,  2,  2, // 30
       1,  1,  0,  0,  2,  2,  0,  0,  0,  0, // 40
       0,  0,  0,  0,  0,  0,  1,  1,  0,  0, // 50
       0,  0,  2,  0,  1,  1,  1,  1,  2,  2, // 60
       2,  2,  1,  1,  1,  0,  2,  2,  0,  0, // 70
       0,  0,  0,  0,  0,  0,  0,  0,  1,  1, // 80
       0,  0,  0,  0,  2,  0,  0,  0,  0,  0  // 90
  ].map(v=>VarStackEntry.combos[v])
  get canLowerAlign(){ 
    return ((this.#stateView.getUint8(0) >>> 0) & (0b1000 >>> 0)) == (0b1000 >>> 0)
  }
  get canUpperAlign(){ 
    return ((this.#stateView.getUint8(0) >>> 0) & (0b10000 >>> 0)) == (0b10000 >>> 0)
  }
  get depth(){ 
    return this.#stateView.getFloat64(3)
  }
  get sentinel(){
    return this.#stateView.getUint8(13)
  } 
  get lowDepthSegment(){
    return this.#stateView.getUint8(11)
  } 
  get hiDepthSegment(){
    return this.#stateView.getUint8(12)
  }
  get keyHighExclusive(){
    return ((this.#stateView.getUint8(0) >>> 0) & (0b1000000 >>> 0)) == (0b1000000 >>> 0)
  }
  get keyLowExclusive(){
    return ((this.#stateView.getUint8(0) >>> 0) & (0b10000000 >>> 0)) == (0b10000000 >>> 0)
  }
  get lowerBoundByte(){ 
    return this.#stateView.getUint8(1)
  }
  get upperBoundByte(){ 
    return this.#stateView.getUint8(2)
  }
  isLowerAligned(
    currentByte
  ){ 
    if(this.keyLowExclusive){
      if(currentByte == this.lowerBoundByte+1) return true
      else return false
    } else {
      if(currentByte == this.lowerBoundByte) return true
      else return false
    }
  }
  isUpperAligned(
    currentByte
  ){ 
    if(this.keyHighExclusive){
      if(currentByte == this.upperBoundByte-1) return true
      else return false
    } else {
      if(currentByte == this.upperBoundByte) return true
      else return false
    }
  }
  LB_Decide( 
    currentByte,
    canLowerAlign
  ){ 
    let s = 0
    const ILA = this.isLowerAligned(currentByte)
    if(currentByte == this.sentinel) s+=4
    if(canLowerAlign) s+=8
    if(canLowerAlign && ILA) s+=16
    s+=this.lowDepthSegment
    return [VarStackEntry.decisions[s],ILA]
  }
  UB_Decide( 
    currentByte,
    canUpperAlign
  ){ 
    let s = 32
    const IUA = this.isUpperAligned(currentByte)
    if(currentByte == this.sentinel) s+=4
    if(canUpperAlign) s+=8
    if(canUpperAlign && IUA) s+=16
    s+=this.hiDepthSegment
    if(this.keyHighExclusive) s+= 32
    return [VarStackEntry.decisions[s],IUA]
  } 
  next(){
    let sb = this.#stateView.getUint8(0)
    if(((sb & 0b100000)>>>0) == 0b100000) return ({
      done: true,
      value: null
    })
    const c = {
      done: false,
      value: this.#yieldCache
    }
    const g = this.#generator
    const n = g.next()
    if(n.done){ 
      sb |= (0b100000 >>> 0)
      this.#yieldCache = null
    } else {
      const lbd = this.LB_Decide(
        n.value[0],
        this.canLowerAlign
      )
      const ubd = this.UB_Decide(
        n.value[0],
        this.canUpperAlign
      )
      const lbdo = lbd[0]
      const ubdo = ubd[0]
      const canYieldRes =lbdo[0] && ubdo[0]
      const canDescendRes = lbdo[1] && ubdo[1]
      if(!canYieldRes && !canDescendRes){
        const fyield2 = g.next()
        if(fyield2.done){ 
          sb |= (0b100000 >>> 0)
          this.#yieldCache = null
        } else {
          const lbd2 = this.LB_Decide(
            fyield2.value[0],
            this.canLowerAlign
          )
          const ubd2 = this.UB_Decide(
            fyield2.value[0],
            this.canUpperAlign
          )
          const lbdo2 = lbd2[0]
          const ubdo2 = ubd2[0]
          const canYieldRes2 =lbdo2[0] && ubdo2[0]
          const canDescendRes2 = lbdo2[1] && ubdo2[1]
          this.#yieldCache = [
            canYieldRes2, // canYield?
            canDescendRes2, // canDescend?
            lbd2[1], // canLowerAlign?
            ubd2[1],// canUpperAlign?
            fyield2.value
          ]
        }
      }
      else this.#yieldCache = [
        canYieldRes, // canYield?
        canDescendRes, // canDescend?
        lbd[1], // canLowerAlign?
        ubd[1],// canUpperAlign?
        n.value
      ]
    }
    this.#stateView.setUint8(0,sb)
    return c
  }
}

/**
 *
 * SCENARIO 
 * ALPHA ABCDEF
 * SENTINEL C
 * UBI = FFFC
 * LBI = ADBC    CAln  IAln  LBB  UBB  OOB  CanY  CanD
 *       A          Y     Y    A    F    N     N     Y
 *        D         Y     Y    D    F    N     N     Y
 *         C        Y     N    B    F    Y     N     N
 *         B        Y     Y    B    F    N     N     Y
 *          A       Y     N    A    F    N     N     Y
 *           A      N     N    A    F    N     N     Y
 *           C      N     N    A    F    N     Y     N
 *           F      N     N
 *          C       Y     Y    A    F    N     Y     N
 *
 *
 *
 * OLD OLD OLD
 * VARIABLE TRAVERSAL STATE TABLE
 *
 * WHY ARBITRARY SENTINEL SUPPORT IS TROUBLESOME:
 *
 * Alphabet: A B C D E
 *
 * D RESERVED
 *
 * 1 2 3 4 5 6
 * = = = = = =
 * A B C C E E
 * E A A A A E
 * D D B D B D
 *     D   D
 *
 * LB = CAB(D)
 * UB = EAB(D)
 * 
 * CA(D) < CAB(D) !
 *
 * LOWEST LETTER:
 *
 * ALPHABET: A B C D E
 *
 * A RESERVED
 *
 * 1 2 3 4 5 6
 * = = = = = =
 * B B C C E E
 * D E D D D E
 * A A A B B A
 *       A A
 *
 * VARIABLE TRAVERSAL STATE TABLE
 *
 * KInc.  YSent  Align.  LBnd.  Ubnd.  NInc.
 * =====  =====  ======  =====  =====  =====
 *     Y             N       0    255      Y
 *     Y             Y    <=UB   >=LB      Y
 *     Y             N       0    255      Y
 *     Y             Y    <=UB   >=LB      Y
 *     N             N       0    255      Y
 *     N             Y    <=UB   >=LB      Y
 *     N             N       0    255      Y
 *     N             Y    <=UB   >=LB      N

 * 
 */

export class Node1 extends Array {
  constructor(){
    super()
    this[0] = String.fromCharCode(0)
    this[1] = null
  }
  insert(keyByte,){
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
  ITER_LB = 0
  ITER_UB = 255
  constructor(){
    super()
    this[0] = new Uint8Array(4)
    this[1] = [null,null,null,null]
    this[2] = 0
    this[Symbol.iterator] = Node4.ITER_FWD_GE_TO_LE
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
  ITER_LB = 0;
  ITER_UB = 255  
  static ITER_FWD_GE_TO_LE = function*(){
    const start = this.#binarySearch_for_LB(
      this.ITER_LB,
      0, this[2]
    )
    const ub = this.ITER_UB
    for(let i = start; i < this[2] && this[0][i] <= ub; i++) yield [this[0][i], this[1][i]] 
  } 
  static ITER_FWD_GE_TO_LT = function*(){
    const start = this.#binarySearch_for_LB(
      this.ITER_LB,
      0, this[2]
    )
    const ub = this.ITER_UB
    for(let i = start; i < this[2] && this[0][i] < ub; i++) yield [this[0][i], this[1][i]]
  } 
  static ITER_FWD_GT_TO_LE = function*(){
    const start = this.#binarySearch_for_LB(
      this.ITER_LB,
      0, this[2]
    ) + 1
    if(start >= this[2]) return
    const ub = this.ITER_UB
    for(let i = start; i < this[2] && this[0][i] <= ub; i++) yield [this[0][i], this[1][i]]
  }  
  static ITER_FWD_GT_TO_LT = function*(){
    const start = this.#binarySearch_for_LB(
      this.ITER_LB,
      0, this[2]
    ) + 1
    if(start >= this[2]) return
    const ub = this.ITER_UB
    for(let i = start; i < this[2] && this[0][i] < ub; i++) yield [this[0][i], this[1][i]]
  }  
  static ITER_REV_LE_TO_GE = function*(){
    const start = this.#binarySearch_for_UB(
      this.ITER_UB,
      0, this[2]
    ) - 1
    const lb = this.ITER_LB
    for(let i = start; i>=0 && this[0][i] >= lb; i--) yield [this[0][i], this[1][i]] 
  } 
  static ITER_REV_LE_TO_GT = function*(){
    const start = this.#binarySearch_for_UB(
      this.ITER_UB,
      0, this[2]
    ) - 1
    const lb = this.ITER_LB
    for(let i = start; i>=0 && this[0][i] > lb; i--) yield [this[0][i], this[1][i]]
  } 
  static ITER_REV_LT_TO_GE = function*(){
    const start = this.#binarySearch_for_UB(
      this.ITER_UB,
      0, this[2]
    ) - 2
    if(start >= this[2] || start < 0) return
    const lb = this.ITER_LB
    for(let i = start; i>=0 && this[0][i] >= lb; i--) yield [this[0][i], this[1][i]]
  }  
  static ITER_REV_LT_TO_GT = function*(){
    const start = this.#binarySearch_for_UB(
      this.ITER_UB,
      0, this[2]
    ) - 2
    if(start >= this[2] || start < 0) return
    const lb = this.ITER_LB
    for(let i = start; i>=0 && this[0][i] > lb; i--) yield [this[0][i], this[1][i]]
  } 
  constructor(){
    super()
    this[0] = new Uint8Array(16)
    this[1] = Array.from({length:16}).fill(null)
    this[2] = 0;
    /*this[Symbol.iterator] = function*(){
      for(let i = 0; i < this[2]; i++) yield [this[0][i],this[1][i]]
    }  */
    this[Symbol.iterator] = Node16.ITER_FWD_GE_TO_LE
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
      if(key >= this[0][MP]) LB = MP + 1
      else UB = MP
    }
    if(LB<this[2] && this[0][LB]<=key) LB++
    return LB
  }
}

export class Node48 extends Array { 
  ITER_LB = 0
  ITER_UB = 255 
  static ITER_FWD_GE_TO_LE = function*(){
    const bmp = this[3]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GE_TO_LE
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][this[0][kb]]]
  }   
  static ITER_FWD_GE_TO_LT = function*(){
    const bmp = this[3]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GE_TO_LT
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][this[0][kb]]]
  }
  static ITER_FWD_GT_TO_LE = function*(){
    const bmp = this[3]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GT_TO_LE
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][this[0][kb]]]
  }
  static ITER_FWD_GT_TO_LT = function*(){
    const bmp = this[3]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GT_TO_LT
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][this[0][kb]]]
  } 
  static ITER_REV_LE_TO_GE = function*(){
    const bmp = this[3]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LE_TO_GE
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][this[0][kb]]]
  }   
  static ITER_REV_LE_TO_GT = function*(){
    const bmp = this[3]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LE_TO_GT
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][this[0][kb]]]
  }
  static ITER_REV_LT_TO_GE = function*(){
    const bmp = this[3]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LT_TO_GE
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][this[0][kb]]]
  }
  static ITER_REV_LT_TO_GT = function*(){
    const bmp = this[3]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LT_TO_GT
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][this[0][kb]]]
  }
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
    this[Symbol.iterator] = Node48.ITER_FWD_GE_TO_LE
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
  /*[Symbol.iterator] = function*(){
    this[3][Symbol.iterator] = BitMap.ITER_SETS
    for(let keyByte of this[3]) yield [keyByte, this[1][this.indexOf(keyByte)]]
  }*/
}

export class Node256 extends Array { 
  ITER_LB = 0
  ITER_UB = 255 
  static ITER_FWD_GE_TO_LE = function*(){
    const bmp = this[0]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GE_TO_LE
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][kb]]
  }   
  static ITER_FWD_GE_TO_LT = function*(){
    const bmp = this[0]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GE_TO_LT
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][kb]]
  }
  static ITER_FWD_GT_TO_LE = function*(){
    const bmp = this[0]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GT_TO_LE
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][kb]]
  }
  static ITER_FWD_GT_TO_LT = function*(){
    const bmp = this[0]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_FWD_GT_TO_LT
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][kb]]
  } 
  static ITER_REV_LE_TO_GE = function*(){
    const bmp = this[0]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LE_TO_GE
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][kb]]
  }   
  static ITER_REV_LE_TO_GT = function*(){
    const bmp = this[0]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LE_TO_GT
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][kb]]
  }
  static ITER_REV_LT_TO_GE = function*(){
    const bmp = this[0]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LT_TO_GE
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][kb]]
  }
  static ITER_REV_LT_TO_GT = function*(){
    const bmp = this[0]
    bmp[Symbol.iterator] = BitMap.ITER_SETS_REV_LT_TO_GT
    bmp.ITER_LB = this.ITER_LB
    bmp.ITER_UB = this.ITER_UB
    for(let kb of bmp) yield [kb, this[1][kb]]
  }
  constructor(){
    super()
    this[0] = new BitMap(8)
    this[1] = Array.from({
      length:256
    }).fill(null)
    this[2] = 0 
    this[Symbol.iterator] = Node256.ITER_FWD_GE_TO_LE
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
  /*[Symbol.iterator] = function*(){
    this[0][Symbol.iterator] = BitMap.ITER_SETS
    for(let keyByte of this[0]) yield [keyByte, this[1][keyByte]]
  }*/
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
      //const cle = key.join("~")
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
          cnode[Symbol.iterator] = Node4.ITER_FWD_GE_TO_LE
          cnode.ITER_LB = 0
          cnode.ITER_UB = 255
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
          cnode[Symbol.iterator] =Node16.ITER_FWD_GE_TO_LE
          cnode.ITER_LB = 0
          cnode.ITER_UB = 255
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
          cnode[Symbol.iterator] =Node48.ITER_FWD_GE_TO_LE
          cnode.ITER_LB = 0
          cnode.ITER_UB = 255
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
  bulkLoad(sortedKeys){
    ;
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
      } else return 0
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
          current[Symbol.iterator] = Node4.ITER_FWD_GE_TO_LE
          current.ITER_LB = 0
          current.ITER_UB = 255
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
          current[Symbol.iterator] =Node16.ITER_FWD_GE_TO_LE
          current.ITER_LB = 0
          current.ITER_UB = 255
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
          current[Symbol.iterator] =Node48.ITER_FWD_GE_TO_LE
          current.ITER_LB = 0
          current.ITER_UB = 255
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
          current[Symbol.iterator] = Node256.ITER_FWD_GE_TO_LE
          current.ITER_LB = 0
          current.ITER_UB = 255
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
  fullFwdRangeV(start = this.root){
    return {
      [Symbol.iterator]: function*(){
        let root = start
        if(!root) return
        const stack = ["$"]
        do {
          if(!root) break
          switch(root.constructor.name){
            case "Node1": {
              do
                root = root[1]
              while(
                root.constructor.name == "Node1"
              )
              continue
            }
            case "NodeLeaf": {
              yield root
              while(stack.length > 0){
                root = stack[stack.length - 1]
                if(root == "$")return
                const {done, value} = root.next()
                if(done)stack.pop()
                else {
                  root = value[1]
                  break
                }
              }
              continue
            }
            default: {
              root[Symbol.iterator] = root.constructor["ITER_FWD_GE_TO_LE"]
              root.ITER_LB = 0
              root.ITER_UB = 255
              const i = root[Symbol.iterator]()
              stack.push(i)
              const {value} = i.next()
              root = value[1]
              continue
            }
          }
        } while(true)
      }
    }
  } 
  fullRevRangeV(start = this.root){ 
    return {
      [Symbol.iterator]: function*(){
        let root = start
        if(!root) return
        const stack = ["$"]
        do {
          if(!root) break
          switch(root.constructor.name){
            case "Node1": {
              do
                root = root[1]
              while(
                root.constructor.name == "Node1"
              )
              continue
            }
            case "NodeLeaf": {
              yield root
              while(stack.length > 0){
                root = stack[stack.length - 1]
                if(root == "$")return
                const {done, value} = root.next()
                if(done)stack.pop()
                else {
                  root = value[1]
                  break
                }
              }
              continue
            }
            default: {
              root[Symbol.iterator] = root.constructor["ITER_REV_LE_TO_GE"]
              root.ITER_LB = 0
              root.ITER_UB = 255
              const i = root[Symbol.iterator]()
              stack.push(i)
              const {value} = i.next()
              root = value[1]
              continue
            }
          }
        } while(true)
      }
    }
  } 
  fullFwdRangeKV(start = this.root, prefix = new ByteStack()){ 
    return {
      [Symbol.iterator]: function*(){
        let root = start
        const limit = prefix.size 
        if(!root) return
        const kStack = new ByteStack(8+limit)
        if(limit > 0){
          for(let b of prefix) kStack.push(b)
        }
        const nStack = []
        do {
          if(!root) break
          switch(root.constructor.name){
            case "Node1": {
              do {
                kStack.push(root[0].charCodeAt(0))
                nStack.push(root)
                root = root[1]
              } while(
                root.constructor.name == "Node1"
              )
              continue
            }
            case "NodeLeaf": {
              yield [kStack.pull(), root]
              let lla = true
              kStack.pop()
              root = nStack[nStack.length - 1]
              while(
                kStack.size >= limit
                && kStack.size > 0
                && lla
              ){
                if(root instanceof Node1){
                  kStack.pop()
                  nStack.pop()
                  root = nStack[nStack.length - 1]

                } else {
                  const {done, value} = root.next()
                  if(done){
                    kStack.pop()
                    nStack.pop()
                    root = nStack[nStack.length - 1]

                  } else {
                    kStack.push(value[0])
                    root = value[1]
                    lla = false
                  }
                }
              }
              continue
            }
            default: {
              root[Symbol.iterator] = root.constructor["ITER_FWD_GE_TO_LE"]
              root.ITER_LB = 0
              root.ITER_UB = 255
              const i = root[Symbol.iterator]()
              nStack.push(i)
              const {value} = i.next()
              kStack.push(value[0])
              root = value[1]
              continue
            }
          }
        } while(kStack.size > limit)
      }
    }
  } 
  fullRevRangeKV(start = this.root, prefix = new ByteStack()){ 
    return {
      [Symbol.iterator]: function*(){
        let root = start
        const limit = prefix.size 
        if(!root) return
        const kStack = new ByteStack(8+limit)
        if(limit > 0){
          for(let b of prefix) kStack.push(b)
        }
        const nStack = []
        do {
          if(!root) break
          switch(root.constructor.name){
            case "Node1": {
              do {
                kStack.push(root[0].charCodeAt(0))
                nStack.push(root)
                root = root[1]
              } while(
                root.constructor.name == "Node1"
              )
              continue
            }
            case "NodeLeaf": {
              yield [kStack.pull(), root]
              let lla = true
              kStack.pop()
              root = nStack[nStack.length - 1]
              while(
                kStack.size >= limit
                && kStack.size > 0
                && lla
              ){
                if(root instanceof Node1){
                  kStack.pop()
                  nStack.pop()
                  root = nStack[nStack.length - 1]

                } else {
                  const {done, value} = root.next()
                  if(done){
                    kStack.pop()
                    nStack.pop()
                    root = nStack[nStack.length - 1]

                  } else {
                    kStack.push(value[0])
                    root = value[1]
                    lla = false
                  }
                }
              }
              continue
            }
            default: {
              root[Symbol.iterator] = root.constructor["ITER_REV_LE_TO_GE"]
              root.ITER_LB = 0
              root.ITER_UB = 255
              const i = root[Symbol.iterator]()
              nStack.push(i)
              const {value} = i.next()
              kStack.push(value[0])
              root = value[1]
              continue
            }
          }
        } while(kStack.size > limit)
      }
    }
  }
  hasPrefix(prefix){
    let root = this.root
    if(!root) return
    for(
      let i = 0; 
      i < prefix.length; 
      i++
    ){
      const kb = prefix[i]
      switch(root.constructor.name){
        case "Node1": {
          if(root[0].charCodeAt(0) != kb) return false
          root = root[1]
          continue
        }
        case "NodeLeaf": return false
        default: {
          const idx = root.indexOf(kb)
          if(idx == -1) return false
          root = root[1][idx]
          continue
        }
      }
    }
    return true
  }
  nodeWithPrefix(prefix){
    let root = this.root
    if(!root) return null
    for(
      let i = 0; 
      i < prefix.length; 
      i++
    ){
      const kb = prefix[i]
      switch(root.constructor.name){
        case "Node1": {
          if(root[0].charCodeAt(0) != kb) return null
          root = root[1]
          continue
        }
        case "NodeLeaf": return root
        default: {
          const idx = root.indexOf(kb)
          if(idx == -1) return null
          root = root[1][idx]
          continue
        }
      }
    }
    return root
  }
  allWithPrefixFwdV(prefix){ 
    const art = this
    return {
      [Symbol.iterator]: function*(){
        let root = art.root
        if(!root) return
        for(
          let i = 0; 
          i < prefix.length; 
          i++
        ){
          const kb = prefix[i]
          switch(root.constructor.name){
            case "Node1": {
              if(root[0].charCodeAt(0) != kb) return
              root = root[1]
              continue
            }
            case "NodeLeaf": return
            default: {
              const idx = root.indexOf(kb)
              if(idx == -1) return
              root = root[1][idx]
              continue
            }
          }
        }
        yield * (
          art.fullFwdRangeV(root)
        )[Symbol.iterator]()
      }
    }
  }
  allWithPrefixRevV(prefix){ 
    const art = this
    return {
      [Symbol.iterator]: function*(){
        let root = art.root
        if(!root) return
        for(
          let i = 0; 
          i < prefix.length; 
          i++
        ){
          const kb = prefix[i]
          switch(root.constructor.name){
            case "Node1": {
              if(root[0].charCodeAt(0) != kb) return
              root = root[1]
              continue
            }
            case "NodeLeaf": return
            default: {
              const idx = root.indexOf(kb)
              if(idx == -1) return
              root = root[1][idx]
              continue
            }
          }
        }
        yield * (
          art.fullRevRangeV(root)
        )[Symbol.iterator]()
      }
    }
  }
  allWithPrefixFwdKV(prefix){
    const art = this
    return {
      [Symbol.iterator]: function*(){
        let root = art.root
        if(!root) return
        const pl = prefix.length
        const b = new ByteStack(pl)
        for(
          let i = 0; 
          i < prefix.length; 
          i++
        ){
          const kb = prefix[i]
          switch(root.constructor.name){
            case "Node1": {
              const k = root[0].charCodeAt(0)
              if(k != kb) return
              root = root[1]
              b.push(k)
              continue
            }
            case "NodeLeaf": return
            default: {
              const idx = root.indexOf(kb)
              if(idx == -1) return
              b.push(kb)
              root = root[1][idx]
              continue
            }
          }
        }
        yield * (
          art.fullFwdRangeKV(root, b)
        )[Symbol.iterator]()
      }
    }
  }
  allWithPrefixRevKV(prefix){
    const art = this
    return {
      [Symbol.iterator]: function*(){
        let root = art.root
        if(!root) return
        const pl = prefix.length
        const b = new ByteStack(pl)
        for(
          let i = 0; 
          i < prefix.length; 
          i++
        ){
          const kb = prefix[i]
          switch(root.constructor.name){
            case "Node1": {
              const k = root[0].charCodeAt(0)
              if(k != kb) return
              root = root[1]
              b.push(k)
              continue
            }
            case "NodeLeaf": return
            default: {
              const idx = root.indexOf(kb)
              if(idx == -1) return
              b.push(kb)
              root = root[1][idx]
              continue
            }
          }
        }
        yield * (
          art.fullRevRangeKV(root, b)
        )[Symbol.iterator]()
      }
    }
  }
  boundedRangeFixN(
    lowerBoundKey, 
    upperBoundKey,
    length,
    lowerInclusivity,
    upperInclusivity,
    order,
    root = this.root
  ){
    return {
      [Symbol.iterator]: function*(){
        if(root == null) return
        const stack = [null]
        let canLoAlign = true
        let canHiAlign = true
        let descent = true
        let depth = 0
        const maxDepth = length - 1
        do {
          if(descent){ 
            if(depth > maxDepth){
              yield root
              root = stack[stack.length-1]
              descent = false
              continue 
            }
            switch(root.constructor.name){
              case "Node1": {
                const result = evalFixN1(
                  root,
                  lowerInclusivity,
                  upperInclusivity,
                  depth,
                  maxDepth,
                  canLoAlign,
                  canHiAlign,
                  lowerBoundKey[depth],
                  upperBoundKey[depth]
                )
                if(result == null){
                  //console.log("N1D res null")
                  root = stack[stack.length-1]
                  descent = false
                  continue
                }
                //console.log("N1D res not null", result)
                depth++
                root = result[2][1]
                canLoAlign = result[0]
                canHiAlign = result[1]
                break
              }
              case "NodeLeaf": {
                /**
                 * KL = 3
                 * 0 I D0 M2
                 * 1 I D1 M2
                 * 2 I D2 M2
                 * 3 L D3 M2
                 */
                //console.log("NLD, premature? ",depth<=maxDepth) 
                root = stack[stack.length-1]
                descent = false
                continue 
              }
              default: { // N4+
                // console.log("DEBUG N4+", root.constructor.name)
                const e = new FixStackEntry(
                  root,
                  lowerInclusivity,
                  upperInclusivity,
                  depth,
                  maxDepth,
                  order,
                  canLoAlign,
                  canHiAlign,
                  lowerBoundKey[depth],
                  upperBoundKey[depth]
                )
                const result = e.next()
                if(result.done){
                  //console.log("N4+D done, type", root.constructor.name)
                  root = stack[stack.length-1]
                  descent = false
                  continue
                }
                //console.log("N4+D undone, type", root.constructor.name)

                canLoAlign = result.value[0]
                canHiAlign = result.value[1]
                root = result.value[2][1]
                stack.push(e)
                depth++
                break
              }
            }
          } else { // ascent
            const result = root.next()
            depth = root.depth
            if(result.done){
              //console.log("Ascent, res done")
              stack.pop()
              root = stack[stack.length-1]
              continue
            }
            //console.log("Ascent, res undone")
            descent = true
            canLoAlign = result.value[0]
            canHiAlign = result.value[1]
            root = result.value[2] instanceof Array ? result.value[2][1] : result.value[2]
            depth++
            continue
          }
        } while(root != null)
      }
    }
  }
  boundedRangeVarN(
    lowerBoundKey, 
    upperBoundKey,
    sentinel,
    lowerInclusivity,
    upperInclusivity,
    order,
    root = this.root
  ){
    return {
      [Symbol.iterator]: function*(){
        if(root == null) return
        const stack = [null]
        let canLoAlign = true
        let canHiAlign = true
        let descent = true
        let depth = 0
        do {
          if(descent){
            switch(root.constructor.name){
              case "Node1": {
                const ev = VarStackEntry.evalVarN1(
                  root,
                  depth,
                  lowerInclusivity == LOWER_BOUND_INCLUSIVE,
                  upperInclusivity == UPPER_BOUND_INCLUSIVE,
                  lowerBoundKey.length,
                  upperBoundKey.length,
                  sentinel,
                  canLoAlign,
                  canHiAlign,
                  lowerBoundKey[depth],
                  upperBoundKey[depth]
                )
                if(ev[0]){
                  yield ev[4]
                  root = stack[stack.length-1]
                  descent = false
                } else if(ev[1]){ 
                  root = root[1]
                  depth++
                  canLoAlign = ev[2]
                  canHiAlign = ev[3]
                } else {
                  root = stack[stack.length-1]
                  descent = false
                }
                break
              }
              case "NodeLeaf": {
                // premature leaf, DNY
                root = stack[stack.length-1]
                descent = false
                break 
              }
              default: { // N4+
                const nse = new VarStackEntry(
                  root,
                  sentinel,
                  lowerInclusivity == LOWER_BOUND_INCLUSIVE,
                  upperInclusivity == UPPER_BOUND_INCLUSIVE,
                  depth,
                  lowerBoundKey.length,
                  upperBoundKey.length,
                  order,
                  canLoAlign,
                  canHiAlign,
                  lowerBoundKey[depth],
                  upperBoundKey[depth]
                )
                const res1 = nse.next()
                if(res1.done){
                  root = stack[stack.length-1]
                  descent = false
                }else{
                  stack.push(nse)
                  const r1v = res1.value
                  if(r1v[0]){ // canY
                    yield r1v[4]
                    const res2 = nse.next()
                    if(res2.done){
                      stack.pop()
                      root = stack[stack.length - 1]
                      descent = false
                    } else { // canD
                      const r2v = res2.value
                      root = r2v[4][1]
                      canLoAlign = r2v[2]
                      canHiAlign = r2v[3]
                      depth++
                    }
                  } else { // canD
                    root = r1v[4][1]
                    canLoAlign = r1v[2]
                    canHiAlign = r1v[3]
                    depth++
                  } 
                }
                break
              }
            }
          } else { // ascent
            const res1 = root.next()
            if(res1.done){
              stack.pop()
              root = stack[stack.length - 1]
            } else {
              depth = root.depth
              const r1v = res1.value
              if(r1v[0]){ // canY
                yield r1v[4]
                const res2 = nse.next()
                if(res2.done){
                  stack.pop()
                  root = stack[stack.length - 1]
                } else { // canD
                  const r2v = res2.value
                  root = r2v[4][1]
                  canLoAlign = r2v[2]
                  canHiAlign = r2v[3]
                  depth++
                  descent = true
                }
              } else { // canD
                root = r1v[4][1]
                canLoAlign = r1v[2]
                canHiAlign = r1v[3]
                depth++
                descent = true
              }
            }
          }
        } while(root != null)
      }
    }
  }
}
