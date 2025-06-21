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
    return [VarStackEntry.decisions[s],ILA]
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
    if(keyLowExclusive){
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
    if(keyHighExclusive){
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
        fyield.value
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

          } else { // ascent

          }
        } while(root != null)
      }
    }
  }
  boundedRangeFixN_old( 
    lowerBoundKey, 
    upperBoundKey,
    length,
    lowerInclusivity,
    upperInclusivity,
    order,
    limit = Infinity,
    root = this.root,
    dbg = false
  ){
    const art = this
    return {
      [Symbol.iterator]: function*(){
        if(dbg) console.log("DEBUG lbk",lowerBoundKey,"ubk",upperBoundKey,"len",length,"LI",lowerInclusivity,"UI",upperInclusivity,"order",order,"limit",limit)
        const iters = [
          "ITER_FWD_GT_TO_LT", // EXC + EXC + FWD = 0 + 0 + 0
          "ITER_FWD_GE_TO_LT", // LBI + EXC + FWD = 1 + 0 + 0
          "ITER_FWD_GT_TO_LE", // EXC + UBI + FWD = 0 + 2 + 0
          "ITER_FWD_GE_TO_LE", // LBI + UBI + FWD = 1 + 2 + 0
          "ITER_REV_LT_TO_GT", // EXC + EXC + REV = 0 + 0 + 4
          "ITER_REV_LT_TO_GE", // LBI + EXC + REV = 1 + 0 + 4
          "ITER_REV_LE_TO_GT", // EXC + UBI + REV = 0 + 2 + 4
          "ITER_REV_LE_TO_GE"  // LBI + UBI + REV = 1 + 2 + 4
        ]
        /**
         * Traversal Modes
         */
        const DESCENT         = 0b10000
        const LEFT_ALIGNED    = 0b01000
        const RIGHT_ALIGNED   = 0b00100
        const LEFT_INCLUSIVE  = 0b00010
        const RIGHT_INCLUSIVE = 0b00001
        // bootstrap state vals
        const initialStates = [
          0b11100, // descent, LA, RA 
          0b11110, // descent, LA, RA  LI
          0b11101, // descent, LA, RA, RI
          0b11111  // descent, LA, RA, LI, RI
        ] 
        const finalIdx = length - 1
        const startState = initialStates[
          lowerInclusivity +
          upperInclusivity
        ]
        let current = root
        let state = startState   
        let lastLeftAlignedDepth = 0
        let lastRightAlignedDepth = 0 
        const alignD = (
          depth,
          TLAP, // taking left aligned path 
          TRAP, // taking right aligned path 
        ) => {
          if(
            ((
              state & LEFT_ALIGNED
            )>>>0) == LEFT_ALIGNED
          ){
            if(TLAP) lastLeftAlignedDepth = depth
            else state &= (~(LEFT_ALIGNED)>>>0)
          }
          if(
            ((
              state & RIGHT_ALIGNED
            )>>>0) == RIGHT_ALIGNED
          ){
            if(TRAP) lastRightAlignedDepth = depth
            else state &= (~(RIGHT_ALIGNED)>>>0)
          }
        } 
        const alignA = (
          depth,
          TLAP, // taking left aligned path 
          TRAP, // taking right aligned path 
          CCP // choosing child path (rather than continue ascent)
        ) => {
          if(
            ((
              state & LEFT_ALIGNED
            )>>>0) == LEFT_ALIGNED
          ){
            if(CCP){
              if(TLAP) lastLeftAlignedDepth++
              else {
                lastLeftAlignedDepth--
                state &= (~(LEFT_ALIGNED)>>>0)
              }
            } else lastLeftAlignedDepth--
          } else {
            if(
              depth == lastLeftAlignedDepth
              && CCP
            ){
              if(TLAP) state |= (LEFT_ALIGNED>>>0)
              else lastLeftAlignedDepth-- 
            }
          }
          if(
            ((
              state & RIGHT_ALIGNED
            )>>>0) == RIGHT_ALIGNED
          ){
            if(CCP){
              if(TRAP) lastRightAlignedDepth++
              else {
                lastRightAlignedDepth--
                state &= (~(RIGHT_ALIGNED)>>>0)
              }
            } else lastRightAlignedDepth--
          } else {
            if(
              depth == lastRightAlignedDepth
              && CCP
            ){
              if(TRAP) state |= (RIGHT_ALIGNED>>>0)
              else lastRightAlignedDepth-- 
            }
          }
          /**
           * ASCENT is mandated to manage the ALIGNMENT STATE values thusly:
           * 
           *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE ALIGNED:
           *    IF CHOOSING A CHILD PATH:
           *      IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
           *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
           *        AND UNSET THE ALIGNMENT STATE
           *      ELSE IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
           *        THEN INCREMENT THE LAST ALIGNED DEPTH VALUE
           *    ELSE IF CONTINUING ASCENT:
           *      THEN DECREMENT LAST ALIGNED DEPTH VALUE
           * 
           *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE NOT ALIGNED:
           *    IF DEPTH MATCHES LAST ALIGNED DEPTH:
           *      IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
           *        THEN SET STATE AS ALIGNED 
           *      ELSE IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
           *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
           *    ELSE IF DEPTH IS GREATER THAN LAST ALIGNED DEPTH:
           *      THEN DO NOT MODIFY ALIGNMENT STATE
           */
        }
        let stack = []
        let yieldedCount = 0
        do {
          if(yieldedCount >= limit) break
          if((state & DESCENT) == DESCENT){ 
            if(dbg && stack.length > 7)
            switch(current.constructor.name){
              case "Node1": {
                const boundIndex = stack.length 
                const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                const LI = lowerInclusivity == LOWER_BOUND_INCLUSIVE
                const RI = upperInclusivity == UPPER_BOUND_INCLUSIVE
                const lbb = LA ? lowerBoundKey[boundIndex] : 0
                const ubb = RA ? upperBoundKey[boundIndex] : 255
                const tb = current[0].charCodeAt(0)
                if(boundIndex == finalIdx){ 
                  /**
                   * on last index,
                   * yield if:
                   * 0 left unbounded and right unbounded
                   * 1 left unbounded and kb compatible with right bound
                   * 2 right unbounded and kb compatible with left bound
                   * 3 kb compatible with both bound
                   */
                  let x = 0
                  if(RA) x++
                  if(LA) x+=2
                  switch(x){
                    case 0: {
                      yield current[1]
                      yieldedCount++
                      state &= (~(DESCENT)>>>0)
                      stack.pop()
                      current = stack[stack.length-1]
                      break
                    }
                    case 1: {
                      if(
                        (RI && tb <= ubb)
                        || tb < ubb
                      ){
                        yield current[1]
                        yieldedCount++
                        state &= (~(DESCENT)>>>0)
                        stack.pop()
                        current = stack[stack.length-1]
                      } else {
                        state &= (~(DESCENT)>>>0)
                        stack.pop()
                        current = stack[stack.length -1]
                      }
                      break
                    }
                    case 2: {
                      if(
                        (LI && tb >= lbb)
                        || tb > lbb
                      ){ 
                        yield current[1]
                        yieldedCount++
                        state &= (~(DESCENT)>>>0)
                        stack.pop()
                        current = stack[stack.length-1]
                      } else {
                        state &= (~(DESCENT)>>>0)
                        stack.pop()
                        current = stack[stack.length -1]
                      }
                      break
                    }
                    case 3: {
                      if(
                        (
                          (RI && tb <= ubb)
                          || tb < ubb
                        ) && (
                          (LI && tb >= lbb)
                          || tb > lbb
                        )
                      ){ 
                        yield current[1]
                        yieldedCount++
                        state &= (~(DESCENT)>>>0)
                        stack.pop()
                        current = stack[stack.length-1]
                      } else {
                        state &= (~(DESCENT)>>>0)
                        stack.pop()
                        current = stack[stack.length -1]
                      }
                      break
                    }
                  }
                } else {
                  if(tb >= lbb && tb <= ubb){
                    stack.push(current)
                    alignD(
                      stack.length-1,
                      LA && tb == lbb,
                      RA && tb == ubb
                    ) 
                    current = current[1]
                  } else {
                    state &= (~(DESCENT)>>>0)
                    stack.pop()
                    current = stack[stack.length -1]
                  }
                }
                continue
              }
              case "NodeLeaf":{
                // ungrammatical leaf, do not yield, instead ascend
                state &= (~(DESCENT)>>>0)
                stack.pop()
                current = stack[stack.length -1]
                continue
              }
              default:{ 
                const boundIndex = stack.length 
                const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                const LI = lowerInclusivity == LOWER_BOUND_INCLUSIVE
                const RI = upperInclusivity == UPPER_BOUND_INCLUSIVE
                const lbb = LA ? lowerBoundKey[boundIndex] : 0
                const ubb = RA ? upperBoundKey[boundIndex] : 255
                current.ITER_LB = lbb
                current.ITER_UB = ubb
                if(boundIndex == finalIdx){ 
                  let x = 0
                  if(RA) x++
                  if(LA) x+=2
                  switch(x){
                    case 0:{
                      current[Symbol.iterator] = current.constructor[iters[order == FORWARD ? 3 : 7]]
                      break
                    }
                    case 1:{
                      // r.inc: fwd3, rev7
                      // r.exc: fwd2, rev5 
                      // rinc.fwd = 2+0=2
                      // rinc.rev = 2+4=6
                      // rexc.fwd = 0+0=0
                      // rexc.rev = 0+4=4 
                      let s = 0
                      if(order == REVERSE) s+=4
                      if(upperInclusivity == UPPER_BOUND_INCLUSIVE) s+= 2
                      switch(s){
                        case 6: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[7]
                          ]
                          break
                        }
                        case 4: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[5]
                          ]
                          break
                        }
                        case 2: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[3]
                          ]
                          break
                        }
                        default: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[1]
                          ]
                          break
                        }
                      }
                      break
                    }
                    case 2:{
                      // l.inc: fwd3, rev7
                      // l.exc: fwd2, rev6
                      // linc.fwd 2+0=2
                      // linc.rev 2+4=6
                      // lexc.fwd 0+0=0
                      // lexc.rev 0+4=4 
                      let s = 0
                      if(order == REVERSE) s+=4
                      if(lowerInclusivity == LOWER_BOUND_INCLUSIVE) s+= 2
                      switch(s){
                        case 6: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[7]
                          ]
                          break
                        }
                        case 4: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[5]
                          ]
                          break
                        }
                        case 2: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[3]
                          ]
                          break
                        }
                        default: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[2]
                          ]
                          break
                        }
                      }
                      break
                    }
                    case 3:{
                      // fwd:linc,rinc 0+0+0=0
                      // fwd:linc,rexc 0+0+1=1
                      // fwd:lexc,rinc 0+2+0=2
                      // fwd:lexc,rexc 0+2+1=3
                      // rev:linc,rinc 4+0+0=4
                      // rev:linc,rexc 4+0+1=5
                      // rev:lexc,rinc 4+2+0=6
                      // rev:lexc,rexc 4+2+1=7
                      /**
                      "ITER_FWD_GT_TO_LT",  
                      "ITER_FWD_GE_TO_LT",
                      "ITER_FWD_GT_TO_LE",
                      "ITER_FWD_GE_TO_LE", 
                      "ITER_REV_LT_TO_GT", 
                      "ITER_REV_LT_TO_GE", 
                      "ITER_REV_LE_TO_GT", 
                      "ITER_REV_LE_TO_GE"  
                       */
                      let s = 0
                      if(order == REVERSE) s+=4
                      if(lowerInclusivity == EXCLUSIVE) s+= 2
                      if(upperInclusivity == EXCLUSIVE) s+= 1
                      switch(s){
                        case 0:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[3]
                          ]
                          break
                        }
                        case 1:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[1]
                          ]
                          break
                        }
                        case 2:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[2]
                          ]
                          break
                        }
                        case 3:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[0]
                          ]
                          break
                        }
                        case 4:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[7]
                          ]
                          break
                        }
                        case 5:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[5]
                          ]
                          break
                        }
                        case 6:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[6]
                          ]
                          break
                        }
                        default:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[4]
                          ]
                          break
                        }
                      }
                      break
                    }
                  }
                  const iterator = current[Symbol.iterator]()
                  for(let value of iterator){
                    yield value[1]
                    yieldedCount++
                    if(yieldedCount >= limit) return
                  }
                  state &= (~(DESCENT)>>>0)
                  stack.pop()
                  current = stack[stack.length-1]
                } else {
                  if(
                    order == FORWARD
                  ) current[
                    Symbol.iterator
                  ] = current.constructor[
                    iters[3]
                  ]
                  else current[
                    Symbol.iterator
                  ] = current.constructor[
                    iters[7]
                  ]
                  const iterator = current[Symbol.iterator]()
                  const { done, value } = iterator.next()
                  if(done){
                    state &= (~(DESCENT)>>>0)
                    stack.pop()
                      console.log("\tSETC",1904)
                    current = stack[stack.length-1]
                  } else {
                    stack.push(iterator)
                    alignD(
                      stack.length-1,
                      LA && value[0] == lbb,
                      RA && value[0] == ubb
                    )
                    current = value[1]
                  }
                }
                continue
              }
            }
          } else { // ASCENT 
            /**
             * ASCENT is mandated to manage the ALIGNMENT STATE values thusly:
             * 
             *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE ALIGNED:
             *    IF CHOOSING A CHILD PATH:
             *      IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
             *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
             *        AND UNSET THE ALIGNMENT STATE
             *      ELSE IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
             *        THEN INCREMENT THE LAST ALIGNED DEPTH VALUE
             *    ELSE IF CONTINUING ASCENT:
             *      THEN DECREMENT LAST ALIGNED DEPTH VALUE
             * 
             *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE NOT ALIGNED:
             *    IF DEPTH MATCHES LAST ALIGNED DEPTH:
             *      IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
             *        THEN SET STATE AS ALIGNED 
             *      ELSE IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
             *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
             *    ELSE IF DEPTH IS GREATER THAN LAST ALIGNED DEPTH:
             *      THEN DO NOT MODIFY ALIGNMENT STATE
             */
            const boundIndex = stack.length - 1 
            const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED || stack.length-1 <= lastLeftAlignedDepth
            const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED || stack.length-1 <= lastRightAlignedDepth

            const LI = lowerInclusivity == LOWER_BOUND_INCLUSIVE
            const RI = upperInclusivity == UPPER_BOUND_INCLUSIVE
            const lbb = LA ? lowerBoundKey[boundIndex] : 0
            const ubb = RA ? upperBoundKey[boundIndex] : 255
            switch(current.constructor.name){
              case "Node1": {
                const tb = current[0].charCodeAt(0)
                alignA(
                  stack.length-1,
                  LA && tb == lbb,
                  RA && tb == ubb,
                  false
                )
                stack.pop()
                current = stack[stack.length-1]
                continue
              }
              case "NodeLeaf":{
                // ungrammatical leaf, do not yield, instead ascend
                const depth = stack.length
                if(depth <= lastLeftAlignedDepth) lastLeftAlignedDepth = depth - 1
                if(depth <= lastRightAlignedDepth) lastRightAlignedDepth = depth - 1
                stack.pop()
                current = stack[stack.length -1]
                continue
              }
              default:{
                const result = current.next()
                if(result.done){
                  const depth = stack.length 
                  alignA(
                    stack.length-1,
                    false,
                    false,
                    false
                  )
                  stack.pop()
                  current = stack[stack.length -1]
                } else {
                  const k = result.value[0]
                  alignA(
                    stack.length-1,
                    k == lbb,
                    k == ubb,
                    true
                  )
                  state |= ((DESCENT)>>>0)
                  const v = result.value
                  current = v[1]
                }
                continue
              }
            }
          }
        } while(stack.length > 0)
      }
    }
  }
  boundedRangeVarN_OLD( 
    lowerBoundKey, 
    upperBoundKey,
    sentinel,
    lowerInclusivity,
    upperInclusivity,
    order,
    limit = Infinity,
    root = this.root
  ){
    const art = this
    return {
      [Symbol.iterator]: function*(){
        const iters = [
          "ITER_FWD_GT_TO_LT", // EXC + EXC + FWD = 0 + 0 + 0
          "ITER_FWD_GE_TO_LT", // LBI + EXC + FWD = 1 + 0 + 0
          "ITER_FWD_GT_TO_LE", // EXC + UBI + FWD = 0 + 2 + 0
          "ITER_FWD_GE_TO_LE", // LBI + UBI + FWD = 1 + 2 + 0
          "ITER_REV_LT_TO_GT", // EXC + EXC + REV = 0 + 0 + 4
          "ITER_REV_LT_TO_GE", // LBI + EXC + REV = 1 + 0 + 4
          "ITER_REV_LE_TO_GT", // EXC + UBI + REV = 0 + 2 + 4
          "ITER_REV_LE_TO_GE"  // LBI + UBI + REV = 1 + 2 + 4
        ]
        /**
         * Traversal Modes
         */
        const DESCENT         = 0b10000
        const LEFT_ALIGNED    = 0b01000
        const RIGHT_ALIGNED   = 0b00100
        const LEFT_INCLUSIVE  = 0b00010
        const RIGHT_INCLUSIVE = 0b00001
        // bootstrap state vals
        const initialStates = [
          0b11100, // descent, LA, RA 
          0b11110, // descent, LA, RA  LI
          0b11101, // descent, LA, RA, RI
          0b11111  // descent, LA, RA, LI, RI
        ] 
        const startState = initialStates[
          lowerInclusivity +
          upperInclusivity
        ]
        let current = root
        let state = startState   
        let lastLeftAlignedDepth = 0
        let lastRightAlignedDepth = 0 
        const alignD = (
          depth,
          TLAP, // taking left aligned path 
          TRAP, // taking right aligned path 
        ) => {
          if(
            ((
              state & LEFT_ALIGNED
            )>>>0) == LEFT_ALIGNED
          ){
            if(TLAP) lastLeftAlignedDepth = depth
            else state &= (~(LEFT_ALIGNED)>>>0)
          }
          if(
            ((
              state & RIGHT_ALIGNED
            )>>>0) == RIGHT_ALIGNED
          ){
            if(TRAP) lastRightAlignedDepth = depth
            else state &= (~(RIGHT_ALIGNED)>>>0)
          }
        } 
        const alignA = (
          depth,
          TLAP, // taking left aligned path 
          TRAP, // taking right aligned path 
          CCP // choosing child path (rather than continue ascent)
        ) => {
          if(
            ((
              state & LEFT_ALIGNED
            )>>>0) == LEFT_ALIGNED
          ){
            if(CCP){
              if(TLAP) lastLeftAlignedDepth++
              else {
                lastLeftAlignedDepth--
                state &= (~(LEFT_ALIGNED)>>>0)
              }
            } else lastLeftAlignedDepth--
          } else {
            if(
              depth == lastLeftAlignedDepth
              && CCP
            ){
              if(TLAP) state |= (LEFT_ALIGNED>>>0)
              else lastLeftAlignedDepth-- 
            }
          }
          if(
            ((
              state & RIGHT_ALIGNED
            )>>>0) == RIGHT_ALIGNED
          ){
            if(CCP){
              if(TRAP) lastRightAlignedDepth++
              else {
                lastRightAlignedDepth--
                state &= (~(RIGHT_ALIGNED)>>>0)
              }
            } else lastRightAlignedDepth--
          } else {
            if(
              depth == lastRightAlignedDepth
              && CCP
            ){
              if(TRAP) state |= (RIGHT_ALIGNED>>>0)
              else lastRightAlignedDepth-- 
            }
          }
        }
        let stack = []
        let yieldedCount = 0
        do {
          if(yieldedCount >= limit) break
            if((state & DESCENT) == DESCENT){ 
              switch(current.constructor.name){
                case "Node1": { // descent node1
                  const boundIndex = stack.length 
                  const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                  const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                  const LI = lowerInclusivity == LOWER_BOUND_INCLUSIVE
                  const RI = upperInclusivity == UPPER_BOUND_INCLUSIVE
                  const lbb = LA ? lowerBoundKey[boundIndex] : 0
                  const ubb = RA ? upperBoundKey[boundIndex] : 255
                  const tb = current[0].charCodeAt(0)
                  if( 
                    tb == sentinel
                  ){ 
                    /*
                    yield current[1]
                    yieldedCount++
                    state &= (~(DESCENT)>>>0)
                    stack.pop()
                    current = stack[stack.length-1]
                    continue
                    */
                    
                    let x = 0
                    if(RA) x++
                    if(LA) x+=2
                    switch(x){
                      case 0: { // descent node1 not aligned
                        yield current[1]
                        yieldedCount++
                        state &= (~(DESCENT)>>>0)
                        stack.pop()
                        current = stack[stack.length-1]
                        break
                      }
                      case 1: { // descent node1 only right aligned
                        if(
                          (RI && tb <= ubb)
                          || tb < ubb
                        ){ 
                          yield current[1]
                          yieldedCount++
                          state &= (~(DESCENT)>>>0)
                          stack.pop()
                          current = stack[stack.length-1]
                        } else {
                          state &= (~(DESCENT)>>>0)
                          stack.pop()
                          current = stack[stack.length -1]
                        }
                        break
                      }
                      case 2: { // descent node1 only left aligned
                        if(
                          (LI && tb >= lbb)
                          || tb > lbb
                        ){ 
                          yield current[1]
                          yieldedCount++
                          state &= (~(DESCENT)>>>0)
                          stack.pop()
                          current = stack[stack.length-1]
                        } else {
                          state &= (~(DESCENT)>>>0)
                          stack.pop()
                          current = stack[stack.length -1]
                        }
                        break
                      }
                      case 3: { // descent node1 both aligned
                        if(
                          (
                            (RI && tb <= ubb)
                            || tb < ubb
                          ) && (
                            (LI && tb >= lbb)
                            || tb > lbb
                          )
                        ){ 
                          yield current[1]
                          yieldedCount++
                          state &= (~(DESCENT)>>>0)
                          stack.pop()
                          current = stack[stack.length-1]
                        } else {
                          state &= (~(DESCENT)>>>0)
                          stack.pop()
                          current = stack[stack.length -1]
                        }
                        break
                      }
                    }
                    
                  } else {
                    if(tb >= lbb && tb <= ubb){
                      stack.push(current)
                      alignD(
                        stack.length-1,
                        LA && tb == lbb,
                        RA && tb == ubb
                      ) 
                      current = current[1]
                    } else {
                      state &= (~(DESCENT)>>>0)
                      stack.pop()
                      current = stack[stack.length -1]
                    }
                  }
                  continue
                }
                case "NodeLeaf":{
                  // ungrammatical leaf, do not yield, instead ascend
                  state &= (~(DESCENT)>>>0)
                  stack.pop()
                  current = stack[stack.length -1]
                  continue
                }
                default:{ 
                  const boundIndex = stack.length 
                  const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                  const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                  const LI = lowerInclusivity == LOWER_BOUND_INCLUSIVE
                  const RI = upperInclusivity == UPPER_BOUND_INCLUSIVE
                  const lbb = LA ? lowerBoundKey[boundIndex] : 0
                  const ubb = RA ? upperBoundKey[boundIndex] : 255
                  current.ITER_LB = lbb
                  current.ITER_UB = ubb
                  let x = 0
                  if(RA) x++
                  if(LA) x+=2
                  switch(x){
                    case 0:{
                      // fwd3, rev7 
                      current[Symbol.iterator] = current.constructor[iters[order == FORWARD ? 3 : 7]]
                      break
                    }
                    case 1:{
                      // r.inc: fwd3, rev7
                      // r.exc: fwd2, rev5 
                      // rinc.fwd = 2+0=2
                      // rinc.rev = 2+4=6
                      // rexc.fwd = 0+0=0
                      // rexc.rev = 0+4=4 
                      let s = 0
                      if(order == REVERSE) s+=4
                      if(upperInclusivity == UPPER_BOUND_INCLUSIVE) s+= 2
                      switch(s){
                        case 6: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[7]
                          ]
                          break
                        }
                        case 4: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[5]
                          ]
                          break
                        }
                        case 2: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[3]
                          ]
                          break
                        }
                        default: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[1]
                          ]
                          break
                        }
                      }
                      break
                    }
                    case 2:{
                      let s = 0
                      if(order == REVERSE) s+=4
                      if(lowerInclusivity == LOWER_BOUND_INCLUSIVE) s+= 2
                      switch(s){
                        case 6: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[7]
                          ]
                          break
                        }
                        case 4: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[5]
                          ]
                          break
                        }
                        case 2: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[3]
                          ]
                          break
                        }
                        default: { 
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[2]
                          ]
                          break
                        }
                      }
                      break
                    }
                    case 3:{
                      let s = 0
                      if(order == REVERSE) s+=4
                      if(lowerInclusivity == EXCLUSIVE) s+= 2
                      if(upperInclusivity == EXCLUSIVE) s+= 1
                      switch(s){
                        case 0:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[3]
                          ]
                          break
                        }
                        case 1:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[1]
                          ]
                          break
                        }
                        case 2:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[2]
                          ]
                          break
                        }
                        case 3:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[0]
                          ]
                          break
                        }
                        case 4:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[7]
                          ]
                          break
                        }
                        case 5:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[5]
                          ]
                          break
                        }
                        case 6:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[6]
                          ]
                          break
                        }
                        default:{ //
                          current[
                            Symbol.iterator
                          ] = current.constructor[
                            iters[4]
                          ]
                          break
                        }
                      }
                      break
                    }
                  }
                  const iterator = current[Symbol.iterator]()
                  const {done,value} = iterator.next()
                  if(done){
                    state &= (~(DESCENT)>>>0)
                    stack.pop()
                    current = stack[stack.length-1] 
                  } else {
                    if(
                      value[0] == sentinel
                    ){  
                      yield value[1]
                      yieldedCount++
                      const {
                        done,
                        value
                      } = iterator.next()
                      if(done){
                        state &= (~(DESCENT)>>>0)
                        stack.pop()
                        current = stack[stack.length-1] 
                      } else {
                        stack.push(iterator)
                        current = value[1]
                        alignD(
                          stack.length-1,
                          LA && value[0] == lbb,
                          RA && value[0] == ubb
                        )
                      }
                    } else{
                      stack.push(iterator)
                      current = value[1]
                      alignD(
                        stack.length-1,
                        LA && value[0] == lbb,
                        RA && value[0] == ubb
                      )
                    }
                  }
                  continue
                }
              }
            } else { // ASCENT 
              const boundIndex = stack.length - 1 
              const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED || stack.length-1 <= lastLeftAlignedDepth
              const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED || stack.length-1 <= lastRightAlignedDepth

              const LI = lowerInclusivity == LOWER_BOUND_INCLUSIVE
              const RI = upperInclusivity == UPPER_BOUND_INCLUSIVE
              const lbb = LA ? lowerBoundKey[boundIndex] : 0
              const ubb = RA ? upperBoundKey[boundIndex] : 255
              switch(current.constructor.name){
                case "Node1": {
                  const tb = current[0].charCodeAt(0)
                  alignA(
                    stack.length-1,
                    LA && tb == lbb,
                    RA && tb == ubb,
                    false
                  )
                  stack.pop()
                  current = stack[stack.length-1]
                  continue
                }
                case "NodeLeaf":{
                  // ungrammatical leaf, do not yield, instead ascend
                  const depth = stack.length
                  if(depth <= lastLeftAlignedDepth) lastLeftAlignedDepth = depth - 1
                  if(depth <= lastRightAlignedDepth) lastRightAlignedDepth = depth - 1
                  stack.pop()
                  current = stack[stack.length -1]
                  continue
                }
                default:{
                  const result = current.next()
                  if(result.done){
                    const depth = stack.length 
                    alignA(
                      stack.length-1,
                      false,
                      false,
                      false
                    )
                    stack.pop()
                    current = stack[stack.length -1]
                  } else {
                    const k = result.value[0]
                    if(
                      k == sentinel
                    ){
                      yield result.value[1]
                      yieldedCount++
                      const {
                        done,
                        value
                      } = current.next()
                      if(done){
                        state &= (~(DESCENT)>>>0)
                        stack.pop()
                        current = stack[stack.length-1] 
                      } else {
                        alignA(
                          stack.length-1,
                          value[0] == lbb,
                          value[0] == ubb,
                          true
                        )
                        state |= ((DESCENT)>>>0)
                        current = value[1]
                      }
                    } else {
                      alignA(
                        stack.length-1,
                        k == lbb,
                        k == ubb,
                        true
                      )
                      state |= ((DESCENT)>>>0)
                      const v = result.value
                      current = v[1]
                    }
                  }
                  continue
                }
              }
            }
        } while(stack.length>0)
      }
    }
  }
  query(constraints = []){
    const art = this
    return {
      [Symbol.iterator]: function*(){
        if(!art.root) return
        if(constraints.length < 1){
          yield * (
            this.fullFwdRangeKV()
          )[Symbol.iterator]()
        } else {
          let level = [art.root]
          //const keyStack = new ByteStack()
          /*
      FORWARD = 0,
      EXCLUSIVE = 0,
      LOWER_BOUND_INCLUSIVE = 1,
      UPPER_BOUND_INCLUSIVE = 2,
      REVERSE = 4,
      FIXED_LENGTH_KEY = 5,
      VARIABLE_LENGTH_KEY = 6,
      LEAF_COMPONENT = 7
           */ 
          const iters = [
            "ITER_FWD_GT_TO_LT", // EXC + EXC + FWD = 0 + 0 + 0
            "ITER_FWD_GE_TO_LT", // LBI + EXC + FWD = 1 + 0 + 0
            "ITER_FWD_GT_TO_LE", // EXC + UBI + FWD = 0 + 2 + 0
            "ITER_FWD_GE_TO_LE", // LBI + UBI + FWD = 1 + 2 + 0
            "ITER_REV_LT_TO_GT", // EXC + EXC + REV = 0 + 0 + 4
            "ITER_REV_LT_TO_GE", // LBI + EXC + REV = 1 + 0 + 4
            "ITER_REV_LE_TO_GT", // EXC + UBI + REV = 0 + 2 + 4
            "ITER_REV_LE_TO_GE"  // LBI + UBI + REV = 1 + 2 + 4
          ]
          /**
           * Traversal Modes
           */
          const DESCENT         = 0b10000
          const LEFT_ALIGNED    = 0b01000
          const RIGHT_ALIGNED   = 0b00100
          const LEFT_INCLUSIVE  = 0b00010
          const RIGHT_INCLUSIVE = 0b00001
          // bootstrap state vals
          const initialStates = [
            0b11100, // descent, LA, RA 
            0b11110, // descent, LA, RA  LI
            0b11101, // descent, LA, RA, RI
            0b11111  // descent, LA, RA, LI, RI
          ] 
          for(let constraint of constraints){
            if(!("limit" in constraint)) constraint.limit = Infinity
            /*if(constraint.componentType != LEAF_COMPONENT) console.log("constraint-dbg lbk", constraint.lowerBoundKey, "ubk", constraint.upperBoundKey)
            else console.log("LEAF COMPONENT", level.length, ...(level.map(l=>l[0])))*/
            const newLevel = []
            if(constraint.componentType == LEAF_COMPONENT){
              let c = 0
              for(let n of level){
                if(c >= constraint.limit) return
                yield n
                c++
              }
            } else { 
              const finalIdx = constraint.length - 1
              const startState = initialStates[
                constraint.lowerInclusivity +
                constraint.upperInclusivity
              ]
              const newLevel = []
              for(let i = (
                constraint.order == FORWARD ? 0 : level.length-1
              ); (
                constraint.order == FORWARD ? i < level.length : i > -1
              ); (
                constraint.order == FORWARD ? i++ : i--
              )){
                let current = level[i]
                let state = startState   
                let lastLeftAlignedDepth = 0
                let lastRightAlignedDepth = 0 
                const alignD = (
                  depth,
                  TLAP, // taking left aligned path 
                  TRAP, // taking right aligned path 
                ) => {
                  if(
                    ((
                      state & LEFT_ALIGNED
                    )>>>0) == LEFT_ALIGNED
                  ){
                    if(TLAP) lastLeftAlignedDepth = depth
                    else state &= (~(LEFT_ALIGNED)>>>0)
                  }
                  if(
                    ((
                      state & RIGHT_ALIGNED
                    )>>>0) == RIGHT_ALIGNED
                  ){
                    if(TRAP) lastRightAlignedDepth = depth
                    else state &= (~(RIGHT_ALIGNED)>>>0)
                  }
                } 
                const alignA = (
                  depth,
                  TLAP, // taking left aligned path 
                  TRAP, // taking right aligned path 
                  CCP // choosing child path (rather than continue ascent)
                ) => {//DBG, len-stck 1 k == lbb true k == ubb false k 2 lbb 2 ubb 7
                  if(
                    ((
                      state & LEFT_ALIGNED
                    )>>>0) == LEFT_ALIGNED
                  ){
                    if(CCP){
                      if(TLAP) lastLeftAlignedDepth++
                      else {
                        lastLeftAlignedDepth--
                        state &= (~(LEFT_ALIGNED)>>>0)
                      }
                    } else lastLeftAlignedDepth--
                  } else {
                    //console.log("dbg1485 depth", depth, "llad", lastLeftAlignedDepth,"CCP",CCP,"TLAP",TLAP)
                    if(
                      depth == lastLeftAlignedDepth
                      && CCP
                    ){
                      if(TLAP) state |= (LEFT_ALIGNED>>>0)
                      else lastLeftAlignedDepth-- 
                    }
                  }
                  if(
                    ((
                      state & RIGHT_ALIGNED
                    )>>>0) == RIGHT_ALIGNED
                  ){
                    if(CCP){
                      if(TRAP) lastRightAlignedDepth++
                      else {
                        lastRightAlignedDepth--
                        state &= (~(RIGHT_ALIGNED)>>>0)
                      }
                    } else lastRightAlignedDepth--
                  } else {
                    if(
                      depth == lastRightAlignedDepth
                      && CCP
                    ){
                      if(TRAP) state |= (RIGHT_ALIGNED>>>0)
                      else lastRightAlignedDepth-- 
                    }
                  }
                  /**
                         * ASCENT is mandated to manage the ALIGNMENT STATE values thusly:
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE ALIGNED:
                         *    IF CHOOSING A CHILD PATH:
                         *      IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
                         *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
                         *        AND UNSET THE ALIGNMENT STATE
                         *      ELSE IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
                         *        THEN INCREMENT THE LAST ALIGNED DEPTH VALUE
                         *    ELSE IF CONTINUING ASCENT:
                         *      THEN DECREMENT LAST ALIGNED DEPTH VALUE
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE NOT ALIGNED:
                         *    IF DEPTH MATCHES LAST ALIGNED DEPTH:
                         *      IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
                         *        THEN SET STATE AS ALIGNED 
                         *      ELSE IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
                         *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
                         *    ELSE IF DEPTH IS GREATER THAN LAST ALIGNED DEPTH:
                         *      THEN DO NOT MODIFY ALIGNMENT STATE
                         */

                  ;
                }
                let stack = []
                switch(constraint.componentType){
                  case FIXED_LENGTH_KEY: { 
                    do { 
                      if(newLevel.length >= constraint.limit) break
                      /*console.log(
                        "node-dbg descent?", 
                        (state & DESCENT) == DESCENT, 
                        "ntype", 
                        current.constructor.name,
                        "newLevel.size",
                        newLevel.length,
                        "stack.size",
                        stack.length,
                        "lastLeftAlignedDepth",
                        lastLeftAlignedDepth,
                        "lastRightAlignedDepth",
                        lastRightAlignedDepth,
                        "LA",
                        (state & LEFT_ALIGNED) == LEFT_ALIGNED,
                        "RA",
                        (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                      )*/
                      //console.log(state.toString(2), DESCENT.toString(2))
                      if((state & DESCENT) == DESCENT){ 
                        /**
                         * DESCENT is mandated to manage the ALIGNMENT STATE values thusly:
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE ALIGNED:
                         *    IF A CHILD PATH IS CHOSEN FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
                         *      THEN UNSET ALIGNMENT STATE
                         *      AND DO NOT ALTER LAST ALIGNED DEPTH VALUE
                         *    ELSE IF A CHILD PATH IS CHOSEN DIRECTLY ON/ALONG THE ALIGNMENT BOUND:
                         *      THEN SET LAST ALIGNED DEPTH VALUE AS CURRENT DEPTH BEFORE DESCENDING
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE NOT ALIGNED:
                         *    THEN DO NOTHING
                         */
                        //console.log(current.constructor.name)
                        switch(current.constructor.name){
                          case "Node1": {
                            const boundIndex = stack.length 
                            const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                            const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                            const LI = constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE
                            const RI = constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE
                            const lbb = LA ? constraint.lowerBoundKey[boundIndex] : 0
                            const ubb = RA ? constraint.upperBoundKey[boundIndex] : 255
                            const tb = current[0].charCodeAt(0)
                            //console.log("LA",LA,"RA",RA,"LI",LI,"RI",RI,"byte",tb)
                            if( 
                              (
                                constraint.componentType == FIXED_LENGTH_KEY 
                                && boundIndex == finalIdx
                              ) || (
                                constraint.componentType == VARIABLE_LENGTH_KEY 
                                && tb == constraint.sentinel
                              )
                            ){ // EDIT COMPTYPE CONSOLIDATE
                              /**
                               * on last index,
                               * yield if:
                               * 0 left unbounded and right unbounded
                               * 1 left unbounded and kb compatible with right bound
                               * 2 right unbounded and kb compatible with left bound
                               * 3 kb compatible with both bound
                               */
                              let x = 0
                              if(RA) x++
                              if(LA) x+=2
                              switch(x){
                                case 0: {
                                  newLevel.push(current[1])
                                  state &= (~(DESCENT)>>>0)
                                  stack.pop()
                                  current = stack[stack.length-1]
                                  break
                                }
                                case 1: {
                                  if(
                                    (RI && tb <= ubb)
                                    || tb < ubb
                                  ){
                                    newLevel.push(current[1])
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length-1]
                                  } else {
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length -1]
                                  }
                                  break
                                }
                                case 2: {
                                  if(
                                    (LI && tb >= lbb)
                                    || tb > lbb
                                  ){
                                    newLevel.push(current[1])
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length-1]
                                  } else {
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length -1]
                                  }
                                  break
                                }
                                case 3: {
                                  if(
                                    (
                                      (RI && tb <= ubb)
                                      || tb < ubb
                                    ) && (
                                      (LI && tb >= lbb)
                                      || tb > lbb
                                    )
                                  ){
                                    newLevel.push(current[1])
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length-1]
                                  } else {
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length -1]
                                  }
                                  break
                                }
                              }
                            } else {
                              if(tb >= lbb && tb <= ubb){
                                stack.push(current)
                                alignD(
                                  stack.length-1,
                                  LA && tb == lbb,
                                  RA && tb == ubb
                                ) 
                                current = current[1]
                              } else {
                                state &= (~(DESCENT)>>>0)
                                stack.pop()
                                current = stack[stack.length -1]
                              }
                            }
                            /*
                             * OLD
                            if(
                              (
                                (
                                  LI &&
                                  tb >= lbb
                                ) || tb > lbb 
                              ) && (
                                (
                                  RI &&
                                  tb <= ubb
                                ) || tb < ubb 
                              )
                            ){ // MATCH
                              if(boundIndex == finalIdx){
                                newLevel.push(current[1])
                                state &= (~(DESCENT)>>>0)
                                stack.pop()
                                current = stack[stack.length-1]
                                const depth = stack.length
                                if(depth <= lastLeftAlignedDepth) lastLeftAlignedDepth--
                                if(depth <= lastRightAlignedDepth) lastRightAlignedDepth--
                              } else{
                                if(
                                  LA && 
                                  LI && 
                                  tb == lbb
                                ) lastLeftAlignedDepth++
                                else state &= (~(LEFT_ALIGNED)>>>0)
                                if(
                                  RA &&
                                  RI &&
                                  tb == ubb
                                ) lastRightAlignedDepth++
                                else state &= (~(RIGHT_ALIGNED)>>>0)
                                stack.push(current)
                                current = current[1] 
                              }
                            } else { // NO MATCH
                              state &= (~(DESCENT)>>>0)
                              stack.pop()
                              current = stack[stack.length -1]
                            }
                            */
                            continue
                          }
                          case "NodeLeaf":{
                            // ungrammatical leaf, do not yield, instead ascend
                            state &= (~(DESCENT)>>>0)
                            stack.pop()
                            current = stack[stack.length -1]
                            continue
                          }
                          default:{ 
                            const boundIndex = stack.length 
                            const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                            const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                            const LI = constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE
                            const RI = constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE
                            const lbb = LA ? constraint.lowerBoundKey[boundIndex] : 0
                            const ubb = RA ? constraint.upperBoundKey[boundIndex] : 255
                            current.ITER_LB = lbb
                            current.ITER_UB = ubb
                            //console.log("CONF 4+ ITER, LBB",lbb,"UBB",ubb)
                            //const iterator = current[Symbol.iterator]()  
                            if( 
                              (
                                constraint.componentType == FIXED_LENGTH_KEY 
                                && boundIndex == finalIdx
                              ) || (
                                constraint.componentType == VARIABLE_LENGTH_KEY 
                                && tb == constraint.sentinel
                              )
                            ){ // EDIT COMPTYPE CONSOLIDATE

                              /**
                               * on last index,
                               * yield if:
                               * 0 left unbounded and right unbounded
                               * 1 left unbounded and kb compatible with right bound
                               * 2 right unbounded and kb compatible with left bound
                               * 3 kb compatible with both bound 
                               * const iters = [
            "ITER_FWD_GT_TO_LT", // EXC + EXC + FWD = 0 + 0 + 0
            "ITER_FWD_GE_TO_LT", // LBI + EXC + FWD = 1 + 0 + 0
            "ITER_FWD_GT_TO_LE", // EXC + UBI + FWD = 0 + 2 + 0
            "ITER_FWD_GE_TO_LE", // LBI + UBI + FWD = 1 + 2 + 0
            "ITER_REV_LT_TO_GT", // EXC + EXC + REV = 0 + 0 + 4
            "ITER_REV_LT_TO_GE", // LBI + EXC + REV = 1 + 0 + 4
            "ITER_REV_LE_TO_GT", // EXC + UBI + REV = 0 + 2 + 4
            "ITER_REV_LE_TO_GE"  // LBI + UBI + REV = 1 + 2 + 4
          ]
                              UBI
                              LBI
                              FWD
      export const FORWARD = 0,
      EXCLUSIVE = 0,
      LOWER_BOUND_INCLUSIVE = 1,
      UPPER_BOUND_INCLUSIVE = 2,
      REVERSE = 4,

                               */
                              let x = 0
                              if(RA) x++
                              if(LA) x+=2
                              switch(x){
                                case 0:{
                                  //console.log("n4+.d0 !LA !RA",iters[constraint.order == FORWARD ? 3 : 7])
                                  // fwd3, rev7 
                                  current[Symbol.iterator] = current.constructor[iters[constraint.order == FORWARD ? 3 : 7]]
                                  break
                                }
                                case 1:{
                                  // r.inc: fwd3, rev7
                                  // r.exc: fwd2, rev5 
                                  // rinc.fwd = 2+0=2
                                  // rinc.rev = 2+4=6
                                  // rexc.fwd = 0+0=0
                                  // rexc.rev = 0+4=4 
                                  let s = 0
                                  if(constraint.order == REVERSE) s+=4
                                  if(constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE) s+= 2
                                  switch(s){
                                    case 6: { 
                                      //console.log("n4+.d1.6 !LA RA",iters[7])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[7]
                                      ]
                                      break
                                    }
                                    case 4: { 
                                      //console.log("n4+.d1.4 !LA RA",iters[5])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[5]
                                      ]
                                      break
                                    }
                                    case 2: { 
                                      //console.log("n4+.d1.2 !LA RA",iters[3])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[3]
                                      ]
                                      break
                                    }
                                    default: { 
                                      //console.log("n4+.d1.D !LA RA",iters[1])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[1]
                                      ]
                                      break
                                    }
                                  }
                                  break
                                }
                                case 2:{
                                  // l.inc: fwd3, rev7
                                  // l.exc: fwd2, rev6
                                  // linc.fwd 2+0=2
                                  // linc.rev 2+4=6
                                  // lexc.fwd 0+0=0
                                  // lexc.rev 0+4=4 
                                  let s = 0
                                  if(constraint.order == REVERSE) s+=4
                                  if(constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE) s+= 2
                                  switch(s){
                                    case 6: { 
                                      //console.log("n4+.d2.6 LA !RA",iters[7])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[7]
                                      ]
                                      break
                                    }
                                    case 4: { 
                                      //console.log("n4+.d2.4 LA !RA",iters[5])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[5]
                                      ]
                                      break
                                    }
                                    case 2: { 
                                      //console.log("n4+.d2.2 LA !RA",iters[3])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[3]
                                      ]
                                      break
                                    }
                                    default: { 
                                      //console.log("n4+.d2.D LA !RA",iters[2])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[2]
                                      ]
                                      break
                                    }
                                  }
                                  break
                                }
                                case 3:{
                                  // fwd:linc,rinc 0+0+0=0
                                  // fwd:linc,rexc 0+0+1=1
                                  // fwd:lexc,rinc 0+2+0=2
                                  // fwd:lexc,rexc 0+2+1=3
                                  // rev:linc,rinc 4+0+0=4
                                  // rev:linc,rexc 4+0+1=5
                                  // rev:lexc,rinc 4+2+0=6
                                  // rev:lexc,rexc 4+2+1=7
                                  /**
                                  "ITER_FWD_GT_TO_LT",  
                                  "ITER_FWD_GE_TO_LT",
                                  "ITER_FWD_GT_TO_LE",
                                  "ITER_FWD_GE_TO_LE", 
                                  "ITER_REV_LT_TO_GT", 
                                  "ITER_REV_LT_TO_GE", 
                                  "ITER_REV_LE_TO_GT", 
                                  "ITER_REV_LE_TO_GE"  
                                   */
                                  let s = 0
                                  if(constraint.order == REVERSE) s+=4
                                  if(constraint.lowerInclusivity == EXCLUSIVE) s+= 2
                                  if(constraint.upperInclusivity == EXCLUSIVE) s+= 1
                                  switch(s){
                                    case 0:{ //
                                      //console.log("n4+.d3.0 LA RA",iters[3])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[3]
                                      ]
                                      break
                                    }
                                    case 1:{ //
                                      //console.log("n4+.d3.1 LA RA",iters[1])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[1]
                                      ]
                                      break
                                    }
                                    case 2:{ //
                                      //console.log("n4+.d3.2 LA RA",iters[2])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[2]
                                      ]
                                      break
                                    }
                                    case 3:{ //
                                      //console.log("n4+.d3.3 LA RA",iters[0])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[0]
                                      ]
                                      break
                                    }
                                    case 4:{ //
                                      //console.log("n4+.d3.4 LA RA",iters[7])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[7]
                                      ]
                                      break
                                    }
                                    case 5:{ //
                                      //console.log("n4+.d3.5 LA RA",iters[5])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[5]
                                      ]
                                      break
                                    }
                                    case 6:{ //
                                      //console.log("n4+.d3.6 LA RA",iters[6])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[6]
                                      ]
                                      break
                                    }
                                    default:{ //
                                      //console.log("n4+.d3.D LA RA",iters[4])
                                      current[
                                        Symbol.iterator
                                      ] = current.constructor[
                                        iters[4]
                                      ]
                                      break
                                    }
                                  }
                                  break
                                }
                              }
                              const iterator = current[Symbol.iterator]()
                              for(let value of iterator){
                                newLevel.push(value[1])
                                //console.log("newLevel+ byte", value[0])
                              }
                              state &= (~(DESCENT)>>>0)
                              stack.pop()
                              current = stack[stack.length-1]
                            } else {
                              //console.log("n4+(nonfinal)",constraint.order == FORWARD ? iters[3] : iters[7]);
                              if(
                                constraint.order == FORWARD
                              ) current[
                                Symbol.iterator
                              ] = current.constructor[
                                iters[3]
                              ]
                              else current[
                                Symbol.iterator
                              ] = current.constructor[
                                iters[7]
                              ]
                              const iterator = current[Symbol.iterator]()
                              const { done, value } = iterator.next()
                              if(done){
                              // continue here
                                //console.log(1107,iters[constraint.order + constraint.lowerInclusivity + constraint.upperInclusivity],LA,RA,LI,RI,lbb,ubb)
                                state &= (~(DESCENT)>>>0)
                                stack.pop()
                                current = stack[stack.length-1]
                              } else {
                                // sconsole.log("ALIGND.DBG, len-stck",stack.length,"LA,",LA,"LBB",lbb,"RA",RA,"UBB",ubb)
                                stack.push(iterator)
                                alignD(
                                  stack.length-1,
                                  LA && value[0] == lbb,
                                  RA && value[0] == ubb
                                )
                                // OLD
                                //console.log("LA",LA,"RA",RA,"LI",LI,"RI",RI,"byte",value[0])
                                current = value[1]
                              }
                            }
                            //console.log(1128, stack.length)
                            continue
                          }
                        }
                      } else { // ASCENT 
                        /**
                         * ASCENT is mandated to manage the ALIGNMENT STATE values thusly:
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE ALIGNED:
                         *    IF CHOOSING A CHILD PATH:
                         *      IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
                         *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
                         *        AND UNSET THE ALIGNMENT STATE
                         *      ELSE IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
                         *        THEN INCREMENT THE LAST ALIGNED DEPTH VALUE
                         *    ELSE IF CONTINUING ASCENT:
                         *      THEN DECREMENT LAST ALIGNED DEPTH VALUE
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE NOT ALIGNED:
                         *    IF DEPTH MATCHES LAST ALIGNED DEPTH:
                         *      IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
                         *        THEN SET STATE AS ALIGNED 
                         *      ELSE IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
                         *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
                         *    ELSE IF DEPTH IS GREATER THAN LAST ALIGNED DEPTH:
                         *      THEN DO NOT MODIFY ALIGNMENT STATE
                         */
                        const boundIndex = stack.length - 1 
                        const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED || stack.length-1 <= lastLeftAlignedDepth
                        const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED || stack.length-1 <= lastRightAlignedDepth

                        const LI = constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE
                        const RI = constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE
                        const lbb = LA ? constraint.lowerBoundKey[boundIndex] : 0
                        const ubb = RA ? constraint.upperBoundKey[boundIndex] : 255
                        switch(current.constructor.name){
                          case "Node1": {
                            const tb = current[0].charCodeAt(0)
                            alignA(
                              stack.length-1,
                              LA && tb == lbb,
                              RA && tb == ubb,
                              false
                            )
                            stack.pop()
                            current = stack[stack.length-1]
                            continue
                          }
                          case "NodeLeaf":{
                            // ungrammatical leaf, do not yield, instead ascend
                            const depth = stack.length
                            if(depth <= lastLeftAlignedDepth) lastLeftAlignedDepth = depth - 1
                            if(depth <= lastRightAlignedDepth) lastRightAlignedDepth = depth - 1
                            stack.pop()
                            current = stack[stack.length -1]
                            continue
                          }
                          default:{
                            // carry on
                            // OLD
                            //console.log(1141,current.constructor.name)
                            const result = current.next()
                            if(result.done){
                              const depth = stack.length 
                              alignA(
                                stack.length-1,
                                false,
                                false,
                                false
                              )
                              //if(depth <= lastLeftAlignedDepth) lastLeftAlignedDepth = depth - 1
                              //if(depth <= lastRightAlignedDepth) lastRightAlignedDepth = depth - 1
                              stack.pop()
                              current = stack[stack.length -1]
                            } else {
                              const k = result.value[0]
                              //console.log("ALIGNA.DBG, len-stck",stack.length, "k == lbb", k == lbb, "k == ubb", k == ubb,"k",k,"lbb",lbb,"ubb",ubb)
                              alignA(
                                stack.length-1,
                                /**
                                 * following LA/RA && conditions may prevent the TLAP/TRAP conditions from being rightfully fulfilled in cases where we reach the final byte in a yielded sequence and it is properly aligned once again. this causes decrementation rather than incrementation of tge lastAlignedDepth value
                                 */
                                k == lbb,
                                k == ubb,
                                true
                              )
                              state |= ((DESCENT)>>>0)
                              const v = result.value
                              current = v[1]
                              //console.log("undepleted n4+ caught on ascent LA", LA,"RA",RA,"LI",LI,"RI",RI,"byte",v[0], (state & DESCENT) == DESCENT)
                              /*const boundIndex = stack.length 
                              const depth = boundIndex
                              const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                              const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                              const LI = constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE
                              const RI = constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE
                              console.log("undepleted n4+ caught on ascent LA", LA,"RA",RA,"LI",LI,"RI",RI,"byte",v[0])
                              if(
                                LA 
                                && LI
                                && v[0] == constraint.lowerBoundKey[boundIndex]
                              ){
                                lastLeftAlignedDepth++
                                state |= ((LEFT_ALIGNED)>>>0)
                              }
                              if(
                                RA
                                && RI
                                && v[0] == constraint.upperBoundKey[boundIndex]
                              ){
                                lastRightAlignedDepth++
                                state |= ((RIGHT_ALIGNED)>>>0)
                              }
                              state |= ((DESCENT)>>>0)*/
                            }
                            continue
                          }
                        }
                      }
                    } while(stack.length > 0)
                    break
                  }
                  case VARIABLE_LENGTH_KEY: { 
                    do { 
                      if(newLevel.length >= constraint.limit) break
                      console.log(
                        "node-dbg descent?", 
                        (state & DESCENT) == DESCENT, 
                        "ntype", 
                        current.constructor.name,
                        "newLevel.size",
                        newLevel.length,
                        "stack.size",
                        stack.length,
                        "lastLeftAlignedDepth",
                        lastLeftAlignedDepth,
                        "lastRightAlignedDepth",
                        lastRightAlignedDepth,
                        "LA",
                        (state & LEFT_ALIGNED) == LEFT_ALIGNED,
                        "RA",
                        (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                      )
                      //console.log(state.toString(2), DESCENT.toString(2))
                      if((state & DESCENT) == DESCENT){ 
                        /**
                         * DESCENT is mandated to manage the ALIGNMENT STATE values thusly:
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE ALIGNED:
                         *    IF A CHILD PATH IS CHOSEN FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
                         *      THEN UNSET ALIGNMENT STATE
                         *      AND DO NOT ALTER LAST ALIGNED DEPTH VALUE
                         *    ELSE IF A CHILD PATH IS CHOSEN DIRECTLY ON/ALONG THE ALIGNMENT BOUND:
                         *      THEN SET LAST ALIGNED DEPTH VALUE AS CURRENT DEPTH BEFORE DESCENDING
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE NOT ALIGNED:
                         *    THEN DO NOTHING
                         */
                        //console.log(current.constructor.name)
                        switch(current.constructor.name){
                          case "Node1": {
                            const boundIndex = stack.length 
                            const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                            const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                            const LI = constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE
                            const RI = constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE
                            const lbb = LA ? constraint.lowerBoundKey[boundIndex] : 0
                            const ubb = RA ? constraint.upperBoundKey[boundIndex] : 255
                            const tb = current[0].charCodeAt(0)
                            console.log("LA",LA,"RA",RA,"LI",LI,"RI",RI,"byte",tb)
                            if( 
                              tb == constraint.sentinel
                            ){ // EDIT COMPTYPE CONSOLIDATE
                              /**
                               * on last index,
                               * yield if:
                               * 0 left unbounded and right unbounded
                               * 1 left unbounded and kb compatible with right bound
                               * 2 right unbounded and kb compatible with left bound
                               * 3 kb compatible with both bound
                               */
                              let x = 0
                              if(RA) x++
                              if(LA) x+=2
                              switch(x){
                                case 0: {
                                  newLevel.push(current[1])
                                  state &= (~(DESCENT)>>>0)
                                  stack.pop()
                                  current = stack[stack.length-1]
                                  break
                                }
                                case 1: {
                                  if(
                                    (RI && tb <= ubb)
                                    || tb < ubb
                                  ){
                                    newLevel.push(current[1])
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length-1]
                                  } else {
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length -1]
                                  }
                                  break
                                }
                                case 2: {
                                  if(
                                    (LI && tb >= lbb)
                                    || tb > lbb
                                  ){
                                    newLevel.push(current[1])
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length-1]
                                  } else {
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length -1]
                                  }
                                  break
                                }
                                case 3: {
                                  if(
                                    (
                                      (RI && tb <= ubb)
                                      || tb < ubb
                                    ) && (
                                      (LI && tb >= lbb)
                                      || tb > lbb
                                    )
                                  ){
                                    newLevel.push(current[1])
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length-1]
                                  } else {
                                    state &= (~(DESCENT)>>>0)
                                    stack.pop()
                                    current = stack[stack.length -1]
                                  }
                                  break
                                }
                              }
                            } else {
                              if(tb >= lbb && tb <= ubb){
                                stack.push(current)
                                alignD(
                                  stack.length-1,
                                  LA && tb == lbb,
                                  RA && tb == ubb
                                ) 
                                current = current[1]
                              } else {
                                state &= (~(DESCENT)>>>0)
                                stack.pop()
                                current = stack[stack.length -1]
                              }
                            }
                            /*
                             * OLD
                            if(
                              (
                                (
                                  LI &&
                                  tb >= lbb
                                ) || tb > lbb 
                              ) && (
                                (
                                  RI &&
                                  tb <= ubb
                                ) || tb < ubb 
                              )
                            ){ // MATCH
                              if(boundIndex == finalIdx){
                                newLevel.push(current[1])
                                state &= (~(DESCENT)>>>0)
                                stack.pop()
                                current = stack[stack.length-1]
                                const depth = stack.length
                                if(depth <= lastLeftAlignedDepth) lastLeftAlignedDepth--
                                if(depth <= lastRightAlignedDepth) lastRightAlignedDepth--
                              } else{
                                if(
                                  LA && 
                                  LI && 
                                  tb == lbb
                                ) lastLeftAlignedDepth++
                                else state &= (~(LEFT_ALIGNED)>>>0)
                                if(
                                  RA &&
                                  RI &&
                                  tb == ubb
                                ) lastRightAlignedDepth++
                                else state &= (~(RIGHT_ALIGNED)>>>0)
                                stack.push(current)
                                current = current[1] 
                              }
                            } else { // NO MATCH
                              state &= (~(DESCENT)>>>0)
                              stack.pop()
                              current = stack[stack.length -1]
                            }
                            */
                            continue
                          }
                          case "NodeLeaf":{
                            // ungrammatical leaf, do not yield, instead ascend
                            state &= (~(DESCENT)>>>0)
                            stack.pop()
                            current = stack[stack.length -1]
                            continue
                          }
                          default:{ 
                            const boundIndex = stack.length 
                            const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                            const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                            const LI = constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE
                            const RI = constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE
                            const lbb = LA ? constraint.lowerBoundKey[boundIndex] : 0
                            const ubb = RA ? constraint.upperBoundKey[boundIndex] : 255
                            current.ITER_LB = lbb
                            current.ITER_UB = ubb
                            console.log("CONF 4+ ITER, LBB",lbb,"UBB",ubb)
                            //const iterator = current[Symbol.iterator]()  
                              /**
                               * on last index,
                               * yield if:
                               * 0 left unbounded and right unbounded
                               * 1 left unbounded and kb compatible with right bound
                               * 2 right unbounded and kb compatible with left bound
                               * 3 kb compatible with both bound 
                               * const iters = [
            "ITER_FWD_GT_TO_LT", // EXC + EXC + FWD = 0 + 0 + 0
            "ITER_FWD_GE_TO_LT", // LBI + EXC + FWD = 1 + 0 + 0
            "ITER_FWD_GT_TO_LE", // EXC + UBI + FWD = 0 + 2 + 0
            "ITER_FWD_GE_TO_LE", // LBI + UBI + FWD = 1 + 2 + 0
            "ITER_REV_LT_TO_GT", // EXC + EXC + REV = 0 + 0 + 4
            "ITER_REV_LT_TO_GE", // LBI + EXC + REV = 1 + 0 + 4
            "ITER_REV_LE_TO_GT", // EXC + UBI + REV = 0 + 2 + 4
            "ITER_REV_LE_TO_GE"  // LBI + UBI + REV = 1 + 2 + 4
          ]
                              UBI
                              LBI
                              FWD
      export const FORWARD = 0,
      EXCLUSIVE = 0,
      LOWER_BOUND_INCLUSIVE = 1,
      UPPER_BOUND_INCLUSIVE = 2,
      REVERSE = 4,

                               */
                            let x = 0
                            if(RA) x++
                            if(LA) x+=2
                            switch(x){
                              case 0:{
                                console.log("n4+.d0 !LA !RA",iters[constraint.order == FORWARD ? 3 : 7])
                                // fwd3, rev7 
                                current[Symbol.iterator] = current.constructor[iters[constraint.order == FORWARD ? 3 : 7]]
                                break
                              }
                              case 1:{
                                // r.inc: fwd3, rev7
                                // r.exc: fwd2, rev5 
                                // rinc.fwd = 2+0=2
                                // rinc.rev = 2+4=6
                                // rexc.fwd = 0+0=0
                                // rexc.rev = 0+4=4 
                                let s = 0
                                if(constraint.order == REVERSE) s+=4
                                if(constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE) s+= 2
                                switch(s){
                                  case 6: { 
                                    console.log("n4+.d1.6 !LA RA",iters[7])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[7]
                                    ]
                                    break
                                  }
                                  case 4: { 
                                    console.log("n4+.d1.4 !LA RA",iters[5])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[5]
                                    ]
                                    break
                                  }
                                  case 2: { 
                                    console.log("n4+.d1.2 !LA RA",iters[3])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[3]
                                    ]
                                    break
                                  }
                                  default: { 
                                    console.log("n4+.d1.D !LA RA",iters[1])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[1]
                                    ]
                                    break
                                  }
                                }
                                break
                              }
                              case 2:{
                                // l.inc: fwd3, rev7
                                // l.exc: fwd2, rev6
                                // linc.fwd 2+0=2
                                // linc.rev 2+4=6
                                // lexc.fwd 0+0=0
                                // lexc.rev 0+4=4 
                                let s = 0
                                if(constraint.order == REVERSE) s+=4
                                if(constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE) s+= 2
                                switch(s){
                                  case 6: { 
                                    console.log("n4+.d2.6 LA !RA",iters[7])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[7]
                                    ]
                                    break
                                  }
                                  case 4: { 
                                    console.log("n4+.d2.4 LA !RA",iters[5])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[5]
                                    ]
                                    break
                                  }
                                  case 2: { 
                                    console.log("n4+.d2.2 LA !RA",iters[3])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[3]
                                    ]
                                    break
                                  }
                                  default: { 
                                    console.log("n4+.d2.D LA !RA",iters[2])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[2]
                                    ]
                                    break
                                  }
                                }
                                break
                              }
                              case 3:{
                                // fwd:linc,rinc 0+0+0=0
                                // fwd:linc,rexc 0+0+1=1
                                // fwd:lexc,rinc 0+2+0=2
                                // fwd:lexc,rexc 0+2+1=3
                                // rev:linc,rinc 4+0+0=4
                                // rev:linc,rexc 4+0+1=5
                                // rev:lexc,rinc 4+2+0=6
                                // rev:lexc,rexc 4+2+1=7
                                /**
                                "ITER_FWD_GT_TO_LT",  
                                "ITER_FWD_GE_TO_LT",
                                "ITER_FWD_GT_TO_LE",
                                "ITER_FWD_GE_TO_LE", 
                                "ITER_REV_LT_TO_GT", 
                                "ITER_REV_LT_TO_GE", 
                                "ITER_REV_LE_TO_GT", 
                                "ITER_REV_LE_TO_GE"  
                                 */
                                let s = 0
                                if(constraint.order == REVERSE) s+=4
                                if(constraint.lowerInclusivity == EXCLUSIVE) s+= 2
                                if(constraint.upperInclusivity == EXCLUSIVE) s+= 1
                                switch(s){
                                  case 0:{ //
                                    console.log("n4+.d3.0 LA RA",iters[3])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[3]
                                    ]
                                    break
                                  }
                                  case 1:{ //
                                    console.log("n4+.d3.1 LA RA",iters[1])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[1]
                                    ]
                                    break
                                  }
                                  case 2:{ //
                                    console.log("n4+.d3.2 LA RA",iters[2])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[2]
                                    ]
                                    break
                                  }
                                  case 3:{ //
                                    console.log("n4+.d3.3 LA RA",iters[0])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[0]
                                    ]
                                    break
                                  }
                                  case 4:{ //
                                    console.log("n4+.d3.4 LA RA",iters[7])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[7]
                                    ]
                                    break
                                  }
                                  case 5:{ //
                                    console.log("n4+.d3.5 LA RA",iters[5])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[5]
                                    ]
                                    break
                                  }
                                  case 6:{ //
                                    console.log("n4+.d3.6 LA RA",iters[6])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[6]
                                    ]
                                    break
                                  }
                                  default:{ //
                                    console.log("n4+.d3.D LA RA",iters[4])
                                    current[
                                      Symbol.iterator
                                    ] = current.constructor[
                                      iters[4]
                                    ]
                                    break
                                  }
                                }
                                break
                              }
                            }
                            const iterator = current[Symbol.iterator]()
                            /*
                             * 1st k = sentinel
                             * - push v to next level
                             * - push iter to stack
                             * - continue descent
                             *
                             * 1st k != sentinel
                             * - push iter to stack
                             * - continue descent
                             *
                             * iterator empty
                             * - ascend
                             */
                            const {done,value} = iterator.next()
                            if(done){
                              state &= (~(DESCENT)>>>0)
                              stack.pop()
                              current = stack[stack.length-1] 
                            } else {
                              if(
                                value[0] == constraint.sentinel
                              ){ 
                                newLevel.push(
                                  value[1]
                                )
                                const {
                                  done,
                                  value
                                } = iterator.next()
                                if(done){
                                  state &= (~(DESCENT)>>>0)
                                  stack.pop()
                                  current = stack[stack.length-1] 
                                } else {
                                  stack.push(iterator)
                                  current = value[1]
                                  alignD(
                                    stack.length-1,
                                    LA && value[0] == lbb,
                                    RA && value[0] == ubb
                                  )
                                }
                              } else{
                                stack.push(iterator)
                                current = value[1]
                                alignD(
                                  stack.length-1,
                                  LA && value[0] == lbb,
                                  RA && value[0] == ubb
                                )
                              }
                              
                            }
                            continue
                          }
                        }
                      } else { // ASCENT 
                        /**
                         * ASCENT is mandated to manage the ALIGNMENT STATE values thusly:
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE ALIGNED:
                         *    IF CHOOSING A CHILD PATH:
                         *      IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
                         *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
                         *        AND UNSET THE ALIGNMENT STATE
                         *      ELSE IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
                         *        THEN INCREMENT THE LAST ALIGNED DEPTH VALUE
                         *    ELSE IF CONTINUING ASCENT:
                         *      THEN DECREMENT LAST ALIGNED DEPTH VALUE
                         * 
                         *  WHEN ALIGNMENT STATE VALUES INDICATE WE ARE NOT ALIGNED:
                         *    IF DEPTH MATCHES LAST ALIGNED DEPTH:
                         *      IF CHOSEN CHILD PATH IS DIRECTLY ON ALIGNMENT BOUND:
                         *        THEN SET STATE AS ALIGNED 
                         *      ELSE IF CHOSEN CHILD PATH IS FULLY WITHIN ALIGNMENT BOUND (NOT ON IT):
                         *        THEN DECREMENT THE LAST ALIGNED DEPTH VALUE BY ONE
                         *    ELSE IF DEPTH IS GREATER THAN LAST ALIGNED DEPTH:
                         *      THEN DO NOT MODIFY ALIGNMENT STATE
                         */
                        const boundIndex = stack.length - 1 
                        const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED || stack.length-1 <= lastLeftAlignedDepth
                        const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED || stack.length-1 <= lastRightAlignedDepth

                        const LI = constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE
                        const RI = constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE
                        const lbb = LA ? constraint.lowerBoundKey[boundIndex] : 0
                        const ubb = RA ? constraint.upperBoundKey[boundIndex] : 255
                        switch(current.constructor.name){
                          case "Node1": {
                            const tb = current[0].charCodeAt(0)
                            alignA(
                              stack.length-1,
                              LA && tb == lbb,
                              RA && tb == ubb,
                              false
                            )
                            stack.pop()
                            current = stack[stack.length-1]
                            continue
                          }
                          case "NodeLeaf":{
                            // ungrammatical leaf, do not yield, instead ascend
                            const depth = stack.length
                            if(depth <= lastLeftAlignedDepth) lastLeftAlignedDepth = depth - 1
                            if(depth <= lastRightAlignedDepth) lastRightAlignedDepth = depth - 1
                            stack.pop()
                            current = stack[stack.length -1]
                            continue
                          }
                          default:{
                            // carry on
                            // OLD
                            //console.log(1141,current.constructor.name)
                            const result = current.next()
                            if(result.done){
                              const depth = stack.length 
                              alignA(
                                stack.length-1,
                                false,
                                false,
                                false
                              )
                              //if(depth <= lastLeftAlignedDepth) lastLeftAlignedDepth = depth - 1
                              //if(depth <= lastRightAlignedDepth) lastRightAlignedDepth = depth - 1
                              stack.pop()
                              current = stack[stack.length -1]
                            } else {
                              const k = result.value[0]
                              console.log("ALIGNA.DBG, len-stck",stack.length, "k == lbb", k == lbb, "k == ubb", k == ubb,"k",k,"lbb",lbb,"ubb",ubb)
                              if(
                                k == constraint.sentinel
                              ){
                                newLevel.push(
                                  result.value[1]
                                )
                                const {
                                  done,
                                  value
                                } = current.next()
                                if(done){
                                  state &= (~(DESCENT)>>>0)
                                  stack.pop()
                                  current = stack[stack.length-1] 
                                } else {
                                  alignA(
                                    stack.length-1,
                                    /**
                                     * following LA/RA && conditions may prevent the TLAP/TRAP conditions from being rightfully fulfilled in cases where we reach the final byte in a yielded sequence and it is properly aligned once again. this causes decrementation rather than incrementation of tge lastAlignedDepth value
                                     */
                                    value[0] == lbb,
                                    value[0] == ubb,
                                    true
                                  )
                                  state |= ((DESCENT)>>>0)
                                  current = value[1]

                                }
                              } else {
                                alignA(
                                  stack.length-1,
                                  /**
                                   * following LA/RA && conditions may prevent the TLAP/TRAP conditions from being rightfully fulfilled in cases where we reach the final byte in a yielded sequence and it is properly aligned once again. this causes decrementation rather than incrementation of tge lastAlignedDepth value
                                   */
                                  k == lbb,
                                  k == ubb,
                                  true
                                )
                                state |= ((DESCENT)>>>0)
                                const v = result.value
                                current = v[1]
                                console.log("undepleted n4+ caught on ascent LA", LA,"RA",RA,"LI",LI,"RI",RI,"byte",v[0], (state & DESCENT) == DESCENT)
                              }
                              /*const boundIndex = stack.length 
                              const depth = boundIndex
                              const LA = (state & LEFT_ALIGNED) == LEFT_ALIGNED
                              const RA = (state & RIGHT_ALIGNED) == RIGHT_ALIGNED
                              const LI = constraint.lowerInclusivity == LOWER_BOUND_INCLUSIVE
                              const RI = constraint.upperInclusivity == UPPER_BOUND_INCLUSIVE
                              console.log("undepleted n4+ caught on ascent LA", LA,"RA",RA,"LI",LI,"RI",RI,"byte",v[0])
                              if(
                                LA 
                                && LI
                                && v[0] == constraint.lowerBoundKey[boundIndex]
                              ){
                                lastLeftAlignedDepth++
                                state |= ((LEFT_ALIGNED)>>>0)
                              }
                              if(
                                RA
                                && RI
                                && v[0] == constraint.upperBoundKey[boundIndex]
                              ){
                                lastRightAlignedDepth++
                                state |= ((RIGHT_ALIGNED)>>>0)
                              }
                              state |= ((DESCENT)>>>0)*/
                            }
                            continue
                          }
                        }
                      }
                    } while(stack.length > 0)
                    break
                  }
                  case LEAF_COMPONENT: {
                    //console.log("LEAF LAYER!")
                    for(let lf of level){
                      if(lf instanceof NodeLeaf) yield lf
                    }
                    break
                  }
                  default: 
                    return
                } 
              }
              //console.log(newLevel.length)
              level = newLevel
            }          
          }
          // OLD BELOW
          /*
          const DISCRIMINATING_DESCENT = 0,
                INDISCRIMINATE_DESCENT = 1,
                ASCENT = 2
          for(let constraint of constraints){
            console.log("\nCONSTRAINT", 
                  "\nconstraint:",JSON.stringify(constraint))
            const newLevel = []
            const finalIdx = constraint.length - 1
            if(constraint.componentType == LEAF_COMPONENT){
              console.log("\nLEAF LAYERRR", level.length)
              return
            }
            for(let i = 0; i < level.length; i++){
              const genStack = []
              let current = level[i]
              let dir = DISCRIMINATING_DESCENT
              let lastDiscIdx = -1
              do {
                console.log(
                  "\nntype",current.constructor.name,
                  "\ndir",dir, 
                  "\ngs.len", genStack.length, 
                  "\nlastDiscIdx",lastDiscIdx, 
                  "\nnewLevel.len", newLevel.length
                )
                switch(constraint.componentType){
                  case FIXED_LENGTH_KEY: {
                    switch(dir){
                      case DISCRIMINATING_DESCENT: {
                        switch(current.constructor.name){
                          case "Node1": {
                            const boundIndex = genStack.length
                            const lbb = constraint.lowerBoundKey[boundIndex]
                            const ubb = constraint.upperBoundKey[boundIndex]
                            const tb = current[0].charCodeAt(0)
                            if(
                              JSON.stringify(constraint) == `{"componentType":5,"lowerBoundExclusive":0,"upperBoundExclusive":0,"order":0,"length":9,"lowerBoundKey":{"0":4,"1":127,"2":255,"3":255,"4":255,"5":255,"6":255,"7":255,"8":255},"upperBoundKey":{"0":7,"1":64,"2":98,"3":192,"4":0,"5":0,"6":0,"7":0,"8":0}}`
                            ) console.log("disc.n1.dbg lbb:",lbb, "ubb:",ubb,"tb:",tb)
                            if(
                              (
                                (
                                  constraint.lowerBoundExclusive == LOWER_BOUND_EXCLUSIVE &&
                                  tb > lbb
                                ) || tb >= lbb 
                              ) && (
                                (
                                  constraint.upperBoundExclusive == UPPER_BOUND_EXCLUSIVE &&
                                  tb < ubb
                                ) || tb <= ubb 
                              )
                            ){ 
                              if(boundIndex == finalIdx){ 
                                newLevel.push(current[1])
                                dir = ASCENT
                                genStack.pop()
                                current = genStack[genStack.length-1]
                              } else {
                                dir = (
                                  constraint.lowerBoundExclusive != LOWER_BOUND_EXCLUSIVE &&
                                  tb == lbb
                                ) || (
                                  constraint.upperBoundExclusive != UPPER_BOUND_EXCLUSIVE && 
                                  tb == ubb
                                ) ? DISCRIMINATING_DESCENT : INDISCRIMINATE_DESCENT
                                lastDiscIdx++
                                genStack.push(current)
                                current = current[1] 
                              }
                            } else { // out-of-bounds, ascend 
                              dir = ASCENT
                              genStack.pop()
                              current = genStack[genStack.length-1]
                            }
                            continue

                          }
                          case "NodeLeaf": {
                            // ungrammatical leaf, do not yield, instead ascend
                            dir = ASCENT
                            genStack.pop()
                            current = genStack[genStack.length-1]
                            continue
                          }
                          default: { 
                            current[Symbol.iterator] = current.constructor[iters[constraint.order + constraint.lowerBoundExclusive + constraint.upperBoundExclusive]]
                            const boundIndex = genStack.length
                            const lbb = constraint.lowerBoundKey[boundIndex]
                            const ubb = constraint.upperBoundKey[boundIndex]
                            current.ITER_LB = lbb
                            current.ITER_UB = ubb
                            const iterator = current[Symbol.iterator]()     
                            if(boundIndex == finalIdx){
                              for(let value of iterator) newLevel.push(value[1])
                              dir = ASCENT
                              genStack.pop()
                              current = genStack[genStack.length-1]
                            } else {
                              const r = iterator.next()
                              const {done, value} = r
                              if(done){
                                // no match within bounds
                                dir = ASCENT
                                current = genStack[genStack.length-1]
                              } else {
                                const v = value[0]
                                dir = (
                                  constraint.lowerBoundExclusive != LOWER_BOUND_EXCLUSIVE &&
                                  v == lbb
                                ) || (
                                  constraint.upperBoundExclusive != UPPER_BOUND_EXCLUSIVE && 
                                  v == ubb
                                ) ? DISCRIMINATING_DESCENT : INDISCRIMINATE_DESCENT
                                lastDiscIdx++
                                genStack.push(iterator)
                                current = value[1]
                              }
                            }
                            console.log("dbg",genStack.length)
                            continue
                          }
                        }
                      }
                      case INDISCRIMINATE_DESCENT: {
                        switch(current.constructor.name){
                          case "Node1": {
                            const boundIndex = genStack.length
                            console.log("IND N1, bidx", boundIndex, "fidx", finalIdx)
                            if(boundIndex == finalIdx){               
                              newLevel.push(current[1])
                              dir = ASCENT
                              genStack.pop()
                              current = genStack[genStack.length-1]
                            } else {
                              genStack.push(current)
                              current = current[1]
                            }
                            continue
                          }
                          case "NodeLeaf": {
                            // ungrammatical leaf, do not yield, instead ascend
                            dir = ASCENT
                            genStack.pop()
                            current = genStack[genStack.length-1]
                            continue
                          }
                          default: {
                            current[Symbol.iterator] = current.constructor[iters[constraint.order]]
                            const boundIndex = genStack.length
                            current.ITER_LB = 0
                            current.ITER_UB = 255
                            const iterator = current[Symbol.iterator]() 
                            if(boundIndex == finalIdx){
                              for(let value of iterator) newLevel.push(value[1])
                              dir = ASCENT
                              genStack.pop()
                              current = genStack[genStack.length-1]
                            } else {
                              const r = iterator.next()
                              const {done, value} = r
                              if(done){
                                // no match within bounds
                                dir = ASCENT
                                current = genStack[genStack.length-1]
                              } else {
                                const v = value[0]
                                genStack.push(iterator)
                                current = value[1]
                              }
                            }
                            continue
                          }
                        }
                      }
                      default: { // ascent
                        switch(current.constructor.name){
                          case "Node1": {
                            genStack.pop()
                            current = genStack[genStack.length-1]
                            continue
                          }
                          case "NodeLeaf": {
                            genStack.pop()
                            current = genStack[genStack.length-1]
                            continue
                          }
                          default: {
                            //console.log(1165,current)
                            const result = current.next()
                            if(result.done){
                              genStack.pop()
                              current = genStack[genStack.length-1]
                            } else { 
                              const v = result.value
                              current = v[1]
                              // how do you decide if descent should be discriminating?
                              const boundIndex = genStack.length
                              const lbb = constraint.lowerBoundKey[boundIndex]
                              const ubb = constraint.upperBoundKey[boundIndex]
                              if(
                                genStack.length - 1 == lastDiscIdx && ((
                                  (
                                    constraint.lowerBoundExclusive != LOWER_BOUND_EXCLUSIVE &&
                                    v == lbb
                                  ) 
                                ) || (
                                  (
                                    constraint.upperBoundExclusive != UPPER_BOUND_EXCLUSIVE &&
                                    v == ubb
                                  ) 
                                ))
                              ) dir = DISCRIMINATING_DESCENT
                              else dir = INDISCRIMINATE_DESCENT
                            }
                            continue
                          }
                        }
                      }
                    }
                    break
                  } 
                  case VARIABLE_LENGTH_KEY: {
                    
                    break
                  } 
                  case LEAF_COMPONENT: {
                    console.log("LEAF LAYER!")
                    for(let lf of level){
                      if(lf instanceof NodeLeaf) yield lf
                    }
                    break
                  }
                  default: {
                    return
                  }
                }
              } while(genStack.length > 0)
            }
            level = newLevel
          }*/
        }
      }
    }
  }
  iter(query = []){
    const art = this
    return {
      [Symbol.iterator]: function*(){
        const keyStack = new ByteStack()
        const genStack = []
        if(query.length < 1){
          // yield all keys
          let current = art.root
          let dir = 0
          while(current) {
            //console.log("\ncurrent type",current.constructor.name,"gstack.len",genStack.length,"current == end of stack?", genStack.length>0? current == genStack[genStack.length-1] : "gstack empty", "bs:",[...keyStack].join("#"),"dir",dir)
            switch(dir){
              case 0: { // descending 
                //console.log("descending",current.constructor.name, genStack.length, "bs: ",[...keyStack].join("#"))
                switch(current.constructor.name){
                  case "NodeLeaf": {
                    yield [keyStack.pull(), current]
                    //keyStack.pop()
                    current = genStack[genStack.length-1]
                    dir = 1
                    break
                  }
                  case "Node1": {
                    keyStack.push(current[0].charCodeAt(0))
                    genStack.push(current)
                    current = current[1]
                    break
                  }
                  default: { 
                    current[Symbol.iterator] = current.constructor.ITER_FWD_GE_TO_LE
                    current.ITER_LB = 0
                    current.ITER_UB = 255
                    const iterator = current[Symbol.iterator]()
                    genStack.push(iterator)
                    const {
                      value: [kb, ch],
                      done
                    } = iterator.next()
                    keyStack.push(kb)
                    current = ch
                  }
                }
                break
              }
              default: { // ascending
                keyStack.pop()
                switch(current.constructor.name){
                  case "Node1": {
                    genStack.pop()
                    current = genStack[genStack.length-1]
                    break
                  }
                  default: { 
                    const result = current.next()
                    if(result.done){
                      genStack.pop()
                      current = genStack[genStack.length-1]
                    } else {
                      const v = result.value
                      keyStack.push(v[0])
                      current = v[1]
                      dir = 0
                    }
                  }
                }
              }
            }
          }       
        } else {
          for(let y = 0; y < query.length; y++){
            const t = query[y]
            if(t.componentType == FIXED_LENGTH_KEY) t.finalIdx = t.length - 1
          }
          let queryIndex = 0
          query[0].startDepth = 0
          /**
           *
           * QUERIES
           * -------
           * 
           *  Query Conventions
           *  - last query in list is only query which can yield NodeLeaf instances
           *  - if NodeLeaf instances encountered earlier than last query, it is skipped and not yielded
           *  - when last query is fixed, NodeLeafs found at exact length specified will be yielded, not if encountered earlier or later. This is to enable flexibility of length for provided bounds.
           *
           *  Variable-Length Component Query
           *  - reservedByte
           *  - reverse
           *  - lowerBoundKey
           *  - lowerBoundInclusive
           *  - upperBoundKey
           *  - upperBoundInclusive
           *
           *  Fixed-Length Component Query
           *  - length
           *  - reverse
           *  - lowerBoundKey
           *  - lowerBoundInclusive
           *  - upperBoundKey
           *  - upperBoundInclusive
           *
           */
          let current = art.root
          let dir = 0
          const iters = [
            "ITER_FWD_GE_TO_LE", // -LBI + -UBI + -REV = 0 + 0 + 0
            "ITER_FWD_GT_TO_LE", // LBI + -UBI + -REV
            "ITER_FWD_GE_TO_LT", // -LBI + UBI + -REV
            "ITER_FWD_GT_TO_LT", // LBI + UBI + -REV
            "ITER_REV_LE_TO_GE", // -LBI + -UBI + REV
            "ITER_REV_LE_TO_GT", // LBI + -UBI + REV
            "ITER_REV_LT_TO_GE", // -LBI + UBI + REV
            "ITER_REV_LT_TO_GT"  // LBI + UBI + REV
          ]
          const DISCRIMINATING_DESCENT = 0,
                INDISCRIMINATE_DESCENT = 1,
                ASCENT = 2
          while(current){
            const q = query[queryIndex]
            console.log("\nldbg queryIdx",queryIndex,"ntype",current.constructor.name,"dir",dir, "ks",[...keyStack].join(" | "),"LBK",query[queryIndex].lowerBoundKey, "UBK", query[queryIndex].upperBoundKey, "ks.size", keyStack.size, "q.startDepth", q.startDepth,"q.finalIdx",q.finalIdx, "boundIndex", keyStack.size - q.startDepth)
            switch(q.componentType){
              case FIXED_LENGTH_KEY: {
                switch(dir){
                  case DISCRIMINATING_DESCENT: {
                    switch(current.constructor.name){
                      case "Node1": {
                        const boundIndex = keyStack.size - q.startDepth
                        const lbb = q.lowerBoundKey[boundIndex]
                        const ubb = q.upperBoundKey[boundIndex]
                        const tb = current[0].charCodeAt(0)
                        if(
                          (
                            (
                              q.lowerBoundExclusive == LOWER_BOUND_EXCLUSIVE &&
                              tb > lbb
                            ) || tb >= lbb 
                          ) && (
                            (
                              q.upperBoundExclusive == UPPER_BOUND_EXCLUSIVE &&
                              tb < ubb
                            ) || tb <= ubb 
                          )
                        ){ // inbounds, descend
                          dir = tb == lbb || tb == ubb ? DISCRIMINATING_DESCENT : INDISCRIMINATE_DESCENT
                          keyStack.push(tb)
                          genStack.push(current)
                          current = current[1] 
                          if(boundIndex == q.finalIdx){
                            queryIndex++
                            query[queryIndex].startDepth = keyStack.size
                          } 
                        } else { // out-of-bounds, ascend
                          dir = ASCENT
                          keyStack.pop() 
                          genStack.pop()
                          current = genStack[genStack.length-1]
                        }
                        // old ↓ 
                        /*
                        keyStack.push(current[0].charCodeAt(0))
                        genStack.push(current)
                        current = current[1]
                        */
                        continue
                      }
                      case "NodeLeaf": {
                        // ungrammatical leaf, do not yield, instead ascend
                        dir = ASCENT
                        keyStack.pop() 
                        genStack.pop()
                        current = genStack[genStack.length-1]
                        continue
                      }
                      default: {  
                        current[Symbol.iterator] = current.constructor[iters[q.reverse + q.lowerBoundExclusive + q.upperBoundExclusive]]
                        const boundIndex = keyStack.size - q.startDepth
                        const lbb = q.lowerBoundKey[boundIndex]
                        const ubb = q.upperBoundKey[boundIndex]
                        current.ITER_LB = lbb
                        current.ITER_UB = ubb
                        const iterator = current[Symbol.iterator]()     
                        const r = iterator.next()
                        const {done, value} = r
                        if(done){
                          // no match within bounds
                          dir = ASCENT
                          keyStack.pop()
                          console.log(1165,current,r, lbb, ubb, q.lowerBoundKey, q.upperBoundKey)
                          current = genStack[genStack.length-1]
                        } else {
                          const v = value[0]
                          dir = v == lbb || v == ubb ? DISCRIMINATING_DESCENT : INDISCRIMINATE_DESCENT

                          genStack.push(iterator)
                          keyStack.push(value[0])
                          current = value[1]
                          if(boundIndex == q.finalIdx){
                            queryIndex++
                            query[queryIndex].startDepth = keyStack.size
                          } 
                        }
                        continue
                      }
                    }
                    break
                  }
                  case INDISCRIMINATE_DESCENT: {
                    switch(current.constructor.name){
                      case "Node1": {
                        const boundIndex = keyStack.size - q.startDepth
                        keyStack.push(current[0].charCodeAt(0))
                        genStack.push(current)
                        current = current[1]
                        if(boundIndex == q.finalIdx){
                          queryIndex++
                          query[queryIndex].startDepth = keyStack.size
                          dir = DISCRIMINATING_DESCENT
                        }
                        continue
                      }
                      case "NodeLeaf": {
                        // ungrammatical leaf, do not yield, instead ascend
                        dir = ASCENT
                        keyStack.pop() 
                        genStack.pop()
                        current = genStack[genStack.length-1]
                        continue
                      }
                      default: {
                        current[Symbol.iterator] = current.constructor[iters[q.reverse]]
                        const boundIndex = keyStack.size - q.startDepth
                        current.ITER_LB = 0
                        current.ITER_UB = 255
                        const iterator = current[Symbol.iterator]()     
                        const r = iterator.next()
                        const {done, value} = r
                        if(done){
                          // somehow no match within bounds
                          dir = ASCENT
                          keyStack.pop()
                          current = genStack[genStack.length-1]
                        } else {
                          genStack.push(iterator)
                          keyStack.push(value[0])
                          current = value[1]
                          if(boundIndex == q.finalIdx){
                            queryIndex++
                            query[queryIndex].startDepth = keyStack.size
                            dir = DISCRIMINATING_DESCENT
                          } 
                        }
                        continue
                      }
                    }
                  }
                  default: { // dir ascent 
                    switch(current.constructor.name){
                      case "Node1": { 
                        keyStack.pop()
                        genStack.pop()
                        current = genStack[genStack.length-1]
                        // check if queryIdx needs reducing
                        if(keyStack.size < query[queryIndex].startDepth) queryIndex--
                        continue
                      }
                      case "NodeLeaf": {
                        // ungrammatical, continue ascent w/o yielding
                        keyStack.pop()
                        genStack.pop()
                        current = genStack[genStack.length-1]
                        // check if queryIdx needs reducing
                        if(keyStack.size < query[queryIndex].startDepth) queryIndex--
                        continue
                      } 
                      default: {  
                        const result = current.next()
                        if(result.done){
                          keyStack.pop()
                          genStack.pop()
                          current = genStack[genStack.length-1]
                          // check if queryIdx needs reducing
                          if(keyStack.size < query[queryIndex].startDepth) queryIndex--
                        } else { 
                          const v = result.value
                          keyStack.push(v[0])
                          //genStack.pop()
                          //genStack.push(v[1])
                          current = v[1]
                          dir = 0
                        }
                        continue
                      }
                    }
                    break
                  }
                }
                break
              } 
              case VARIABLE_LENGTH_KEY: {
                
                break
              } 
              case LEAF_COMPONENT_KV: {
                yield [keyStack.pull(), current]
                current = genStack[genStack.length-1]
                queryIndex--
                dir = ASCENT
                break
              }
              case LEAF_COMPONENT_V: {
                yield current
                current = genStack[genStack.length-1]
                queryIndex--
                dir = ASCENT
                break
              }
              default: {
                return
              }
            }
          }
        }
      }
    }
  }
}
