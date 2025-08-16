import os from "os"

export class Uint32s {
  constructor(size, indexMultiplier = 4){
    this.size = size
    this.buff = new Uint32Array(size).map((_,i)=>i*indexMultiplier) 
    this.shuffle()
    this[Symbol.iterator] = Uint32s.I
  }
  at(index){
    return this.buff[index]
  }
  put(index,value){
    this.buff[index] = value
  }
  shuffle(){
    for(let i = this.buff.length - 1; i > 0; i--){
      const j = Math.floor(Math.random()*(i+1))
      const tmp = this.buff[i]
      this.buff[i] = this.buff[j]
      this.buff[j] = tmp
    }
  }
  static I = function*(){
    const s = this.size
    for(let i = 0; i < s; i++) yield this.buff[i]
  }
}
/*
const u = new Uint32s(1_000_000)
console.log(u)
for(let i of u) console.log(i)
*/
