/*
 * Nodes are Arrays
 * 0 - "byte"
 * 1 - lo
 * 2 - eq
 * 3 - hi
 * 4 ? value
 */

export class TST {
  root
  size
  constructor(){
    this.root = null
    this.size = 0
  }
  insert(key, value = null){
    let index = 0
    let current = this.root
    let previous = this.root
    while(current){
      const kb = String.fromCharCode(
        key.getUint8(index)
      )
      const cb = current[0]
      if(
        kb < cb
      ){ 
        previous = current
        current = current[1]
      } else if(
        kb > cb
      ){ 
        previous = current
        current = current[3]
      } else {
        if(index === key.byteLength){
          if(value) current[4] = value
          return 0
        }
        index++
        previous = current
        current = current[2]
      }
    }
    const kb = String.fromCharCode(key.getUint8(index))
    current = [
      kb,
      null,
      null,
      null
    ]
    if(!this.root) this.root = current
    else if(
      previous && 
      previous[0] < kb
    ) previous[3] = current
    else if(
      previous && 
      previous[0] > kb
    ) previous[1] = current
    else if(previous) previous[2] = current
    index++
    while(index < key.byteLength){
      current[2] = [
        String.fromCharCode(key.getUint8(index)),
        null,null,null
      ]
      if(
        index == key.byteLength - 1 && value
      ) current[2].push(value)
      current = current[2]
      index++
    }
    this.size++
    return 1
  }
  search(key){
    if(key.byteLength < 1) return null
    let current = this.root
    let index = 0
    while(current){
      const kb = String.fromCharCode(
        key.getUint8(index)
      )
      if(kb < current[0]) current = current[1]
      else if(kb > current[0]) current = current[3]
      else {
        if(
          index === key.byteLength - 1
        ){
          if(current[4]) return current[4]
          else return true
        }
        index++
        current = current[2]
      }
    }
    return null
  }
  remove(key){
    if(key.byteLength < 1) return 0
    let index = 0
    let current = this.root
    let lastBranchingNode = null
    while(current){
      const kb = String.fromCharCode(
        key.getUint8(index)
      )
      if(kb < current[0]) {
        lastBranchingNode = null
        current = current[1]
      } else if(kb > current[0]) {
        lastBranchingNode = null
        current = current[3]
      } else {
        lastBranchingNode = current
        while(
          current && 
          String.fromCharCode(
            key.getUint8(index)
          ) === current[0]
        ){
          index++
          current = current[2]
        }
      }
    }
    if(!lastBranchingNode) return 0
    lastBranchingNode[2] = null
    if(this.root && lastBranchingNode[0] == this.root[0]) this.root = null
    this.size--
    return 1
  }
}
