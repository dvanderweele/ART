import fs from "fs/promises"
import { execSync } from "child_process"

async function setup(){
  await (async () => {
    const doc = await (await fetch("https://cs.stanford.edu/people/miles/iso8859.html")).text()
    await fs.writeFile(/*await fs.realpath(*/"./latin1.html"/*)*/, doc)
  })()
}

async function build(){
  const doc = await fs.readFile(await fs.realpath("./latin1.html"), {encoding: "utf8"})
  const tabre = /[<]TABLE[^>]*[>]([\s\S]+)[<]\/TABLE[>]/
  const tabRows = (tabre.exec(doc))[1]
  const rowsre = /[<]TR[^>]*[>][\s]*[<]TD[>][<]TT[>]([^<]*)[<][\/]?TT[>][<][\/]TD[>][\s]*[<]TD[>][<]TT[>]([^<]*)[<][\/]?TT[>][<][\/]TD[>][\s]*[<]TD[>][<]TT[>]([^<]*)[<][\/]?TT[>][<][\/]TD[>][\s]*[<]TD[>][<]TT[>]([^<]*)[<][\/]?TT[>][<][\/]TD[>][\s]*[<]TD[>]([^<]*)[<][\/]TD[>][\s]*[<]TD[>][<]B[>][<]TT[>]([^<]*)[<][\/]?TT[>][<][\/]B[>][<][\/]TD[>][\s]*[<][\/]TR[>]/g
  /*
[<]TR[^>]*[>]
  
    [<]TD[>][<]TT[>](
      [^<]*
    )[<][\/]TT[>][<][\/]TD[>]
    (?:
      [\s]*[<]TD[>][<]TT[>](
        [^<]*
      )[<][\/]TT[>][<][\/]TD[>]
    ){3}
  
  (?:
    [\s]*[<]TD[>](
      [^<]*
    )[<][\/]TD[>]
  )
  (?:
    [\s]*[<]TD[>][<]B[>][<]TT[>](
      [^<]*
    )[<][\/]TT[>][<][\/]B[>][<][\/]TD[>]
  )
[<][\/]TR[>]
   */
  let r
  let a = []
  while((r = rowsre.exec(tabRows)) != null){
    const alt = [...(r.slice(1))].map(c => c.replaceAll("&amp;","&")).map(c => c == "&nbsp;" ? String.fromCharCode(160) : c)
    const cp = parseInt(alt[1],16)
    a.push({
      CharacterReference: alt[0],
      Hex: alt[1],
      Character: alt[2].startsWith("&") && alt[2].endsWith(";") ? execSync(`./unescape "${alt[2]}"`) : alt[2],
      EntityName: alt[3],
      Description: alt[4],
      CollationElements: [
        cp,
        cp,
        cp
      ]
    })
  }
  await fs.writeFile("./Latin1.Encoding.json",JSON.stringify(a,null,"\t"),{encoding:"utf8"})
}

(async ()=> {
  //await setup()
  await build()
})()
