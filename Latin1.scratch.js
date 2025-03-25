import fs from "fs/promises"

;(
  async ()=>{
    const content = JSON.parse(await fs.readFile(
      "Latin1.Encoding.json",
      {
        encoding: "utf8"
      }
    ));
    const dict = new Map()
    for(let chr of content){
      dict.set(chr.Hex,chr)
    }
    const L1 = Intl.Collator(undefined, {sensitivity:"base"})
    const L2 = Intl.Collator(undefined, {sensitivity:"accent"})
    const L3 = Intl.Collator(undefined, {sensitivity:"variant"}) 
    content.sort((a,b)=>L1.compare(String.fromCharCode(parseInt(a.Hex,16)),String.fromCharCode(parseInt(b.Hex,16))))
    // L1
    let L1S = [[content[0]]]
    for(let i = 1; i < content.length; i++){ 
      const a = L1S[L1S.length-1][L1S[L1S.length-1].length-1]
      const b = content[i]
      if(L1.compare(String.fromCharCode(parseInt(a.Hex,16)),String.fromCharCode(parseInt(b.Hex,16))) == 0) L1S[L1S.length-1].push(b)
      else L1S.push([b])
    }
    // L2
    content.sort((a,b)=>L2.compare(String.fromCharCode(parseInt(a.Hex,16)),String.fromCharCode(parseInt(b.Hex,16))))
    let L2S = [[content[0]]]
    for(let i = 1; i < content.length; i++){ 
      const a = L2S[L2S.length-1][L2S[L2S.length-1].length-1]
      const b = content[i]
      if(L2.compare(String.fromCharCode(parseInt(a.Hex,16)),String.fromCharCode(parseInt(b.Hex,16))) == 0) L2S[L2S.length-1].push(b)
      else L2S.push([b])
    }
    // L3
    content.sort((a,b)=>L3.compare(String.fromCharCode(parseInt(a.Hex,16)),String.fromCharCode(parseInt(b.Hex,16))))
    let L3S = [[content[0]]]
    for(let i = 1; i < content.length; i++){ 
      const a = L3S[L3S.length-1][L3S[L3S.length-1].length-1]
      const b = content[i]
      if(L3.compare(String.fromCharCode(parseInt(a.Hex,16)),String.fromCharCode(parseInt(b.Hex,16))) == 0) L3S[L3S.length-1].push(b)
      else L3S.push([b])
    }
    for(let i = 0; i<L1S.length;i++){
      const is = L1S[i]
      for(let j = 0; j<is.length; j++) dict.get(is[j].Hex).CollationElements[0] = i
    }
    for(let i = 0; i<L2S.length;i++){
      const is = L2S[i]
      for(let j = 0; j<is.length; j++) dict.get(is[j].Hex).CollationElements[1] = i
    }
    for(let i = 0; i<L3S.length;i++){
      const is = L3S[i]
      for(let j = 0; j<is.length; j++) dict.get(is[j].Hex).CollationElements[2] = i
    }
    await fs.writeFile("./Latin1.Encoding3.json",JSON.stringify([...dict.values()].sort((a,b)=>L3.compare(String.fromCharCode(parseInt(a.Hex,16)),String.fromCharCode(parseInt(b.Hex,16)))),null,"\t"),{encoding:"utf8"})
  }
)()
