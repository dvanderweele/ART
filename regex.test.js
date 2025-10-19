import { 
  ART,
  CapturingGroup,
  NonCapturingGroup,
  CharacterClass,
  ByteStack
} from "./art.js"
import Latin1 from "./collations/Latin1/Latin1.js"
import {
  expectation,
  shuffleArray
} from "./utils.js"

const [expect, dump] = expectation()
expect(true, false, "canary failure")

const words = [
  "combine_soldier",
  "combine_sniper",
  "combine_guard",
  "combine_elite",
  "combine_officer",
  "headcrab",
  "headcrab_fast",
  "headcrab_poison",
  "headcrab_zombie",
  "black_mesa",
  "black_mesa_east",
  "black_mesa_west",
  "black_mesa_research",
  "lambda_core",
  "lambda_complex",
  "lambda_reactor",
  "city17",
  "city17_trainstation",
  "city17_plaza",
  "city17_sewers",
  "alyx_vance",
  "eli_vance",
  "isaac_kliener",
  "gordon_freeman",
  "vortigaunt",
  "vortigaunt_slave",
  "vortigaunt_free",
  "resonance_cascade",
  "resonance_field",
  "resonance_test",
  "zen",
  "zen_wilds",
  "zen_lair",
  "zen_core"
];

const a = new ART()

for(let w of words) a.insert(Latin1.getL0SortKey(w),w)

const patternTree = a.toRegex()
/*
const patternArray = [patternTree instanceof CapturingGroup ? "(" : "(?:"]
const stack = [
  null, {
    iter: patternTree[Symbol.iterator](), 
    type: patternTree.constructor.name,
    opt: patternTree.optional
  }
]

while(stack[stack.length-1]){
  const t = stack[stack.length-1]
  const n = t.iter.next()
  if(n.done){
    if(
      t.type == "CapturingGroup"
      || t.type == "NonCapturingGroup"
    ){
      patternArray.push(t.opt ? ")?" : ")")
    }
    stack.pop()
  }else {
    const v = n.value
    switch(v.constructor.name){
      case "CapturingGroup":{
        patternArray.push("(") 
        stack.push({
          iter: v[Symbol.iterator](),
          type: "CapturingGroup",
          opt: v.optional
        })
        break
      }
      case "NonCapturingGroup":{
        patternArray.push("(?:") 
        stack.push({
          iter: v[Symbol.iterator](),
          type: "NonCapturingGroup",
          opt: v.optional
        })
        break
      }
      case "ByteStack":{
        const tail = patternArray[patternArray.length - 1]
        if(tail != null && !(/^[(](?:[?][:])?/.test(tail))) patternArray.push("|")
        for(let cp of v){
          // digit 0 = 48
          // digit 9 = 57
          // A = 65
          // Z = 90
          // a = 97
          // z = 122
          if(
            (cp >= 48 && cp <= 57)
            || (cp >= 65 && cp <= 90)
            || (cp >= 97 && cp <= 122)
          ) patternArray.push(String.fromCharCode(cp))
          else patternArray.push("\\x",Number(cp).toString(16).padStart(2,"0"))
        }
      }
      case "CharacterClass":{}
    }
  }
}
*/

const gex = new RegExp(patternTree.serialize())
console.log(gex)

let matches = 0
for(let w of words) matches += gex.test(w) ? 1 : 0
expect(matches,words.length, "every word matches")
dump(true)
