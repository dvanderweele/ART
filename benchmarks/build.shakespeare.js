import fs from "fs/promises"
import path from "path"
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

;(async ()=>{
  const mdResultFiles = await fs.readdir(path.join(__dirname,"shakespeareResults"))
  const results = []
  for(let fn of mdResultFiles){
    results.push(JSON.parse(await fs.readFile(
      path.join(__dirname, "shakespeareResults",fn),
      {encoding:"utf8"}
    )))
  }
  const rmap = new Map()
  const resultCategories = new Set()
  for(let r of results){
    const k = `${r.osType} | ${r.osPlatform} | ${r.osArch} | ${r.nodeVersion} | ${r.testType}`
    const c = `${r.osType} | ${r.osPlatform} | ${r.osArch} | ${r.nodeVersion}`
    if(!(resultCategories.has(c))) resultCategories.add(c)
    if(!(rmap.has(k))) rmap.set(k,{
      testCount: 1,
      resultCategory: c,
      wordCount: { 
        max: r.wordCount,
        min: r.wordCount,
        avg: r.wordCount,
        sum: r.wordCount
      },
      distinctWordCount: {
        max: r.distinctWordCount,
        min: r.distinctWordCount,
        avg: r.distinctWordCount,
        sum: r.distinctWordCount
      },
      dedupeDurationMS: { 
        max: r.dedupeDurationMS,
        min: r.dedupeDurationMS,
        avg: r.dedupeDurationMS,
        sum: r.dedupeDurationMS
      },
      fastestIterationDurationMS: { 
        max: r.fastestIterationDurationMS,
        min: r.fastestIterationDurationMS,
        avg: r.fastestIterationDurationMS,
        sum: r.fastestIterationDurationMS
      },
      orderedIterationDurationMS: { 
        max: r.orderedIterationDurationMS,
        min: r.orderedIterationDurationMS,
        avg: r.orderedIterationDurationMS,
        sum: r.orderedIterationDurationMS
      },
      deltaMemoryRSS: { 
        max: r.orderedIterationDurationMS,
        min: r.orderedIterationDurationMS,
        avg: r.orderedIterationDurationMS,
        sum: r.orderedIterationDurationMS
      },
      deltaMemoryHeapTotal: { 
        max: r.deltaMemoryHeapTotal,
        min: r.deltaMemoryHeapTotal,
        avg: r.deltaMemoryHeapTotal,
        sum: r.deltaMemoryHeapTotal
      },
      deltaMemoryHeapUsed: { 
        max: r.deltaMemoryHeapUsed,
        min: r.deltaMemoryHeapUsed,
        avg: r.deltaMemoryHeapUsed,
        sum: r.deltaMemoryHeapUsed
      }
    })
    else {
      const s = rmap.get(k)
      s.testCount++ 
      if(s.wordCount.max < r.wordCount) s.wordCount.max = r.wordCount
      if(s.wordCount.min > r.wordCount) s.wordCount.min = r.wordCount
      s.wordCount.sum += r.wordCount
      s.wordCount.avg = s.wordCount.sum / s.testCount 
      if(s.distinctWordCount.max < r.distinctWordCount) s.distinctWordCount.max = r.distinctWordCount
      if(s.distinctWordCount.min > r.distinctWordCount) s.distinctWordCount.min = r.distinctWordCount
      s.distinctWordCount.sum += r.distinctWordCount
      s.distinctWordCount.avg = s.distinctWordCount.sum / s.testCount 
      if(s.dedupeDurationMS.max < r.dedupeDurationMS) s.dedupeDurationMS.max = r.dedupeDurationMS
      if(s.dedupeDurationMS.min > r.dedupeDurationMS) s.dedupeDurationMS.min = r.dedupeDurationMS
      s.dedupeDurationMS.sum += r.dedupeDurationMS
      s.dedupeDurationMS.avg = s.dedupeDurationMS.sum / s.testCount 
      if(s.fastestIterationDurationMS.max < r.fastestIterationDurationMS) s.fastestIterationDurationMS.max = r.fastestIterationDurationMS
      if(s.fastestIterationDurationMS.min > r.fastestIterationDurationMS) s.fastestIterationDurationMS.min = r.fastestIterationDurationMS
      s.fastestIterationDurationMS.sum += r.fastestIterationDurationMS
      s.fastestIterationDurationMS.avg = s.fastestIterationDurationMS.sum / s.testCount
      if(s.orderedIterationDurationMS.max < r.orderedIterationDurationMS) s.orderedIterationDurationMS.max = r.orderedIterationDurationMS
      if(s.orderedIterationDurationMS.min > r.orderedIterationDurationMS) s.orderedIterationDurationMS.min = r.orderedIterationDurationMS
      s.orderedIterationDurationMS.sum += r.orderedIterationDurationMS
      s.orderedIterationDurationMS.avg = s.orderedIterationDurationMS.sum / s.testCount
      if(s.deltaMemoryRSS.max < r.deltaMemoryRSS) s.deltaMemoryRSS.max = r.deltaMemoryRSS
      if(s.deltaMemoryRSS.min > r.deltaMemoryRSS) s.deltaMemoryRSS.min = r.deltaMemoryRSS
      s.deltaMemoryRSS.sum += r.deltaMemoryRSS
      s.deltaMemoryRSS.avg = s.deltaMemoryRSS.sum / s.testCount
      if(s.deltaMemoryHeapTotal.max < r.deltaMemoryHeapTotal) s.deltaMemoryHeapTotal.max = r.deltaMemoryHeapTotal
      if(s.deltaMemoryHeapTotal.min > r.deltaMemoryHeapTotal) s.deltaMemoryHeapTotal.min = r.deltaMemoryHeapTotal
      s.deltaMemoryHeapTotal.sum += r.deltaMemoryHeapTotal
      s.deltaMemoryHeapTotal.avg = s.deltaMemoryHeapTotal.sum / s.testCount
      if(s.deltaMemoryHeapUsed.max < r.deltaMemoryHeapUsed) s.deltaMemoryHeapUsed.max = r.deltaMemoryHeapUsed
      if(s.deltaMemoryHeapUsed.min > r.deltaMemoryHeapUsed) s.deltaMemoryHeapUsed.min = r.deltaMemoryHeapUsed
      s.deltaMemoryHeapUsed.sum += r.deltaMemoryHeapUsed
    s.deltaMemoryHeapUsed.avg = s.deltaMemoryHeapUsed.sum / s.testCount
    }
  }
  //console.log(rmap)
  // build Moby Dick Details Page
  /**
   *
var x1 = [];
var x2 = [];
for (var i = 1; i < 500; i++)
{
	k = Math.random();
	x1.push(Math.random() + 1);
	x2.push(Math.random() + 1.1);
}
var trace1 = {
  x: x1,
  type: "histogram",
  opacity: 0.5,
  marker: {
     color: 'green',
  },
};
var trace2 = {
  x: x2,
  type: "histogram", 
  opacity: 0.6,
  marker: {
     color: 'red',
  },
};

var data = [trace1, trace2];
var layout = {barmode: "overlay"};
Plotly.newPlot('myDiv', data, layout);

   *
   */
  var ex = /^(.+?) [|][^|]+$/
  for(let rc of resultCategories.values()){
    const detailsPage = `<!DOCTYPE html>
<html lang="en">
  <head>
  <title>Details — Complete Works of Shakespeare Word Deduplication Benchmark | Adaptive Radix Tree | ${rc}</title>
  <script src="https://cdn.plot.ly/plotly-3.0.1.min.js" charset="utf-8"></script>
  <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
  </head>
  <body>
    <h1>Details — <em>Complete Works of Shakespeare</em> Word Deduplication Benchmark | Adaptive Radix Tree</h1>
    ${
      [
        "dedupeDurationMS",
        "fastestIterationDurationMS",
        "orderedIterationDurationMS",
        "deltaMemoryHeapUsed"
      ].map(
        stat => `<h2>${stat}</h2>${[...[...(rmap.keys())].filter(k=>k.startsWith(rc)).reduce((a,c)=>a.has(ex.exec(c)[1])?a:(()=>{a.add(ex.exec(c)[1]);return a})(),new Set()).values()].sort().map(
          ky => `<figure><div id="${
            ky.replaceAll(" | ","_").replaceAll(" ","-").replaceAll(".","-")
          }__${stat}__hist"></div><figcaption>${
            ky
          }</figcaption></figure>`
        ).join("\n")}`
      ).join("<hr />\n")
    }    <script>
           ${
              [
                "dedupeDurationMS",
                "fastestIterationDurationMS",
                "orderedIterationDurationMS",
                "deltaMemoryHeapUsed"
              ].map(
                stat => `const traces_${
                  stat
                } = [${
                  [...(rmap.keys())].filter(k=>k.startsWith(rc)).sort().map(
                    ky => `{x:[${
                      results.filter(
                        r => ky.startsWith(`${r.osType} | ${r.osPlatform} | ${r.osArch} | ${r.nodeVersion} | ${r.testType}`)
                      ).map(
                        r => r[stat]
                      ).join(",")
                    }],type:"histogram",name:"${/[|] ([^|]+)$/.exec(ky)[1]}",opacity:0.3,marker:{color:"${
                      ky.match(/Set/) ? "green" : (
                        ky.match(/AVL/) ? "yellow" : "red"
                      )
                    }"}}`
                  ).join(",")
                }]; ${
                  [...[...(rmap.keys())].filter(k=>k.startsWith(rc)).reduce((a,c)=>a.has(ex.exec(c)[1])?a:(()=>{a.add(ex.exec(c)[1]);return a})(),new Set()).values()].sort().map(
                    ky => `Plotly.newPlot("${
                      ky.replaceAll(" | ","_").replaceAll(" ","-").replaceAll(".","-")
                    }__${stat}__hist",traces_${stat},{barmode:"overlay"})`
                  ).join("\n")
                }`
              ).join("\n")
            }
          </script>
  </body>
</html>
`
    await fs.writeFile(path.join(__dirname, `details.shakespeare.${rc.replaceAll(" | ","_").replaceAll(" ","-").replaceAll(".","-")}.html`), detailsPage, {encoding: "utf8"})
  }
})()
