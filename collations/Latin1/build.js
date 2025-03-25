import fs from "fs/promises"
import crypto from "crypto"

;(
  async ()=>{
    const langs = JSON.parse(await fs.readFile(
      "languages.json",
      {
        encoding: "utf8"
      }
    ));
    const content = JSON.parse(await fs.readFile(
      "encoding.json",
      {
        encoding: "utf8"
      }
    ));
    const collations = {
      Languages: {},
      Collations: {}
    }
    const cs = new Set()
    for(let lang of langs){
      console.log(`~~~~~~~~~~\nAttempting to build collation for Identifier "${
        lang.Identifier
      }" and Description "${
        lang.Description
      }"`)
      const dict = new Map()
      for(let chr of content){
        chr.CollationElements[3] = parseInt(chr.Hex,16)
        dict.set(chr.Hex,chr)
      }
      const L1 = Intl.Collator(lang.Identifier, {sensitivity:"base"})
      console.log("Resolved Locale: " + L1.resolvedOptions().locale)
      const L2 = Intl.Collator(lang.Identifier, {sensitivity:"accent"})
      const L3 = Intl.Collator(lang.Identifier, {sensitivity:"variant"}) 
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
      const data = [...dict.values()].sort((a,b)=>parseInt(a.Hex,16)-parseInt(b.Hex,16)).map(e=>e.CollationElements)
      const digest = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(
              JSON.stringify(data)
            )
          )
        )
      ).map(
        b=>b.toString(16).padStart(2, "0")
      ).join("").slice(0,3)
      cs.add(digest)
      collations.Languages[lang.Identifier] = digest
      if(!(digest in collations.Collations)) collations.Collations[digest] = data
      await fs.writeFile(
        "collations.json",
        JSON.stringify(collations, undefined, "\t"),
        {encoding:"utf8"}
      )
      /*
       * compile Latin1 class
       */
      const Latin1ClassSource = `
class Latin1 { 
  static getL0SortKey( 
    sourceString,
    outOfRangeCodePoint = 63,
    sentinelCodePoint = 0
  ){ 
    const s =[]
    for(let ch of sourceString){
      const cp = ch.charCodeAt(0)
      s.push(cp < 256 ? cp : outOfRangeCodePoint)
    }
    s.push(sentinelCodePoint)
    return new Uint8Array(s)
  }
  static getL1SortKey( 
    sourceString, 
    language = "en",
    outOfRangeCodePoint = 63,
    sentinelCodePoint = 0
  ){ 
    const c = Latin1.Collations.get(Latin1.Languages.get(language)) 
    const s =[]
    for(let ch of sourceString){
      const cp = ch.charCodeAt(0)
      s.push(cp < 256 ? c[cp][1] : outOfRangeCodePoint)
    }
    s.push(sentinelCodePoint)
    return new Uint8Array(s)
  }
  static getL2SortKey( 
    sourceString, 
    language = "en",
    outOfRangeCodePoint = 63,
    sentinelCodePoint = 0
  ){ 
    const c = Latin1.Collations.get(Latin1.Languages.get(language)) 
    const s =[]
    for(let ch of sourceString){
      const cp = ch.charCodeAt(0)
      s.push(cp < 256 ? c[cp][2] : outOfRangeCodePoint)
    }
    s.push(sentinelCodePoint)
    return new Uint8Array(s)
  }
  static getL3SortKey( 
    sourceString, 
    language = "en",
    outOfRangeCodePoint = 63,
    sentinelCodePoint = 0
  ){ 
    const c = Latin1.Collations.get(Latin1.Languages.get(language)) 
    const s =[]
    for(let ch of sourceString){
      const cp = ch.charCodeAt(0)
      s.push(cp < 256 ? c[cp][3] : outOfRangeCodePoint)
    }
    s.push(sentinelCodePoint)
    return new Uint8Array(s)
  }
  static Languages = new Map([
    ${
      Object.entries(
        collations.Languages
      ).map(
        ([k,v]) => `["${
          k
        }","${
          v
        }"]`
      ).join(",\n    ")
    }
  ])
  static Collations = new Map([
    ${
      Object.entries(
        collations.Collations
      ).map(
        ([k,v]) => `["${k}",[${
          v.map(
            cea => `[${cea[3]},${cea[0]},${cea[1]},${cea[2]}]`
          ).join(",")
        }]]`
      ).join(",")
    }
  ])}
`
      await fs.writeFile(
        "Latin1.js",
        Latin1ClassSource,
        {encoding:"utf8"}
      )
    }
    console.log(cs.size)
  }
)()
