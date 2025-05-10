# Discussing An Adaptive Radix Tree in JavaScript Optimized for Range Queries over Compound Keys

Years ago in undergraduate, on a whim I read the essential piece on adaptive radix trees by Viktor Leis and friends (*The Adaptive Radix Tree:
ARTful Indexing for Main-Memory Databases*). It was the first serious discussion on practical approaches to implementing a trie data structure that I'd ever encountered, and it launched a years' long obsession.

Of course, at the get-go I was not even close to being a mature enough programmer for a project like this. Indeed, I made various attempts on and off over the years, failing yet again after returning to the problem as if drawn by a siren's call.

Well, I'm proud to share after all this time and years of professional experience under my belt, **I've finally done it!**

While I'm not ready to open source the code, I'm excited to share a conceptual overview of my unique approach along with comparative benchmarks (*my order-statistic AVL tree and the ART go head to head!*) and a "Flockbuster" demonstration.

## A Quick Word on Trees, Tries, and the ART

It goes without saying that computer scientists have a proclivity for organizing information in tree-like structures. This is not a new principle either. It's difficult to conceive of any serious information retrieval system which does not use trees in a significant capacity.

Classically, tree data structures would work by storing at least a whole key (for example, a number) within each internal branch. [Self-balancing binary search trees](https://dvanderweele.com/order-statistic-avl-tree-javascript-library-docs) are a genus that comes to mind for most when considering this kind of data structuring, though there are others. 

And it depends on what you are actually doing with data. If your only interest is speedy insertions, removals, and membership tests, you'll encounter the refrain to just use a hash-based data structure. After all, for those so-called point queries, hashing offers hard-to-beat constant-time performance.

That utility evaporates though once you run into a problem that necessitates tasks such as efficiently iterating over a bounded range of numbers or strings within a larger collection. That's generally not possible with hash-based data structures, whose keys are strewn seemingly in random order within their backing arrays. And so the big picture is that's why we commonly tolerate the logarithmic runtimes of common tree data structures. Trees are naturally suited for you to range over their branches.

Naturally the question arises, is it possible to accomplish all these things and more while *beating* the traditional logarithmic time bound?

And so the search begins for an even more powerful data structure, a sort of general purpose master dictionary or index data structure. Faster, more flexible.

The trie suggests itself as a potential suitor. As a category, tries are still trees but different enough to warrant a slightly different name. Instead of storing an entire key or more in each internal branch, the inner nodes in a trie focus on indexing small lexicographic slices (for example, a single letter) of the larger sequences that make up the keys you're storing. That means, as you traverse the tree, you don't need to compare an entire key at each node, but merely a small slice of one! 

Most obvious perhaps is the boon to those who need to work with variable-length data like strings or compound keys comprised of a sequence of concatenated keys. It becomes very easy to retrieve a subset of strings sharing a particular prefix. You can also enumerate a bounded range of strings. In fact, even point queries like membership or search for a particular string or key can be even faster than hashing! And this is because hash computation typically requires a reading of the entire string, but in searching a trie it is reasonable to abandon the search entirely as soon as you realize that not even a prefix of the search term is contained within the data structure. For the daring, it is possible to extend the trie's prefix-searching expertise into a contains-based search capacity, a technique made possible by the old trick known as the suffix tree.

And perhaps most excitingly, this kind of data structure allows you to start to reason about the design of your own programs in terms of Codd's *relational algebra*, a privilege more commonly limited to the realm of database software. Your designs can take on a tabular nature, where you enable performant, multi-column indexing. 

This is all possible, if we can manage to overcome a venerable challenge associated with tries — their notorious hunger for memory. That is where the Adaptive Radix Tree suggests a pragmatic solution.

## The Protypical Adaptive Radix Tree of Viktor Leis et al

For the best view, the original piece is a must-read. Here I give my own brief summary.

This form of radix tree uses a *span* of one byte (as mine does). This means if you insert keys with a length of 12 bytes, each node in the tree will index only a one-byte span of those keys. This would result in a tree with a height of about 12. 

There are other schemes where the span is less or more (even just one bit), but I choose one byte for simplicity just like the original ART.

### Nodes That Vary in Size

This is the chief optimization of this data structure. 

Consider the naïve approach to implementing a trie with a span of one byte. You might just make each internal node an array of length 256. So the root node has such an array where each index corresponds to one of the possible byte values for the first byte in all the keys in the tree. And then the values stored at those indices are pointers or references to the next level of nodes, which index the second byte of the keys stored in the tree. But not even back-of-the-envelope math is required to understand that under such a system, most likely there is a vast amount of wasted space as most nodes are largely empty.

Instead we can use a scheme reminscent of the vector data structure, which alters the capacity of its backing array to accomodate changing storage requirements.

The ART classically envisions four different capacities for its internal nodes:

* **Node4**: this type maps up to four distinct key byte values to corresponding child nodes
  * The key byte values are kept packed and sorted in an array of capacity four.
  * The pointers or references to child nodes are kept at the corresponding index in a second array.
  * Read/write operations use linear search to find the required index.
* **Node16**: this type maps between five and sixteen key bytes to their children.
  * In most respects apart from size this type is similar to Node4, except that binary search is used in this case.
* **Node48**: complexity of implementation increases with this type, which maps between seventeen and 48 key bytes to their children.
  * One array with 256 slots is used to map key byte values (where each byte value is an index in this array) to index values in the range of zero to 47. 
  * Those 48 possible index values are the indices of the second array, which stores pointers or references to children.
* **Node256**: this type is essentially the same scheme as the naïve implementation of an array with capacity 256 where a key byte value is the index of the corresponding child.

If at any point a node grows too large or too small for its type, a new node of the appropriate size is allocated in its place and the values copied over.

In my implementation, all the above node types are given the same set of methods with same signatures exposed so that implementation of algorithms later is easier.

### Compressing One-Way Paths

Consider that, even under this space-saving scheme, if you store in the tree a key which has a long suffix not shared by any other nodes, that's a kind of "one-way path" which will have a whole sequence of Node4s which are mostly empty. Sure, it's better than the naïve scheme, but still a waste of memory.

To further reduce such memory wastage, two techniques are suggested. 

*Lazy expansion* is proposed, where you simply avoid creating such one-way paths to leaf nodes. This means, as you're inserting a key, as soon as you realize you've reached the part of the key which is an unique suffix not shared by other keys, simply stop creating internal nodes. Rather, create the leaf node then and there.

This is a form of lossy compression, of course, and it means you probably need to store the key in its entirety in either the leaf node itself or in some form within the tuple referred to by the key you store at the leaf.

The second technique, called *path compression* is very similar but applied to internal one-way paths. Instead of actually creating one-way paths inside your tree, you'll make a buffer inside the next branching node and store the one-way path prefix in that buffer. That's the lossless version of this technique. A lossy version, akin to lazy expansion, is also envisioned, where you simply put the length of the one-way path in that buffer and then, on reaching a terminal leaf node, somehow validate that you reached the right one.

## What I Do Differently Than The Original

Earlier I mentioned that, in the grander scheme of things, range queries are one of the bigger reasons we even use trees. With that in mind, I have no qualms with the ART prototype's adaptively sized nodes, but I do have an issue with its vision of the techniques of lazy expansion and path compression.

Tree traversals at times can be mind-bending enough in their own right. But the notion of doing so while simultaneously having to account for path compression buffers and/or partially missing paths seems to me, well, unrealistic at best.

In fairness though, the idea of utilizing no form of path compression and having smallest node size as Node4 strikes me as equally untenable.

After some vacillation, I elected to implement a compromise in my ART.

### Node1

That's right, a singly linked list. We introduce an even smaller node type that maps exactly one key byte to one child.

And before you accuse my neckbeard of being shorter and softer than it really is, note that I am not the first to suggest this kind of design choice.

Long preceding the ART paper by Leis is a reference from Donald Knuth himself to a 1959 paper by René de la Briandais on an early kind of trie data structure which effectively used a linked list pattern.

Because of my requirement to optimize for bounded range queries, I could not accept the suggestion from the original ART paper to use lossy forms of path compression. But in maintaining a dedication to using memory wisely, equally I could not accept the complications which were sure to arise if I were to attempt such ranging tree traversals with the lossless kind of prefix buffers scattered about my tree.

Singly linked lists seemed like a fair compromise to me. The links are more similar in nature to the larger node sizes. Sure, they use more memory than an array-backed vector would (by a largish constant factor), but that has always been true of linked lists versus vectors. Most of all, it makes doing what we need to do in the tree phenomenally easier to reason about.

Since numbers all doubles in JS, I considered if it was possible to compress them somehow since we only need 256 values of precision. I believe JS strings are based on UTF-16 code units, and so for the key byte value with this node type I create a one-character long string based on the code point whose value is the key byte being store. Based on some brief benchmarking I think this does save memory.

### Bitmapping the Larger Node Sizes

The choice to utilize bitmaps for Node48 and Node256 types was the product of some troubleshooting and realizing that the ART paper leaves, perhaps intentionally, some ambiguity in its descriptions of the inner workings of these two node types.

The first inkling that something may be missing in the design of these types may come as you first try to decide programmatically how to allocate the 48 child slots in the Node48 type. Given a new key byte and child to insert, it's easy to know where the key byte goes — at the index which has the magnitude of the key byte's value in the 256-capacity array. But afterwards, which slot in the 48-capacity array gets the child?

If your answer to that is a simple linear search for the first open slot, you are probably in good company. Whilst purusing ART implemenations available on the web one jealous summer evening, I'm certain I came across at least one that did just that.

But then you realize that, in node growth and shrinkage cases where you change the type of the node, you realize this linear searching could become uncomfortable. Maybe you would tolerate it if it's only true for Node48 though?

And so development proceeds to the Node256 implementation. It seems almost the simplest of types. Near the end, however, you encounter yet another linear search for all 48 of the sparsely allocated nodes in order to shrink to Node48 (where, if you recall, each insertion is a linear search).

Really, since there is a parallel between the implementation of Node256 and 256-capacity key byte array of the Node48 (where actually *at most* and *often fewer* slots will be occupied), it means there are more spots during growth and shrinkage from Node48 where this linear searching will happen.

It was hereabouts I started to feel vaguely dim-witted, which is a negative sign in the world of developer experience.

I spent time reasoning through the workflows involving these nodes and it came to me that it is not only these so-called "amortized operations" of growth and shrinkage which are beset with this performance concern. Also, evidently insertions can be impacted. And, perhaps most importantly, this kind of arrangement can seriously hamper the kind of bounded range queries which are supposed to be *a chief use-case* for this kind of data structure.

**Back to the drawing board.**

For a time I considered implementing a sort of doubly-linked allocation list for these nodes. I'll spare you the gory details, but on top of using a lot of extra memory, it doesn't even really solve all these problems. I'll leave it as an exercise for the reader to think about why.

*What does solve these problems nicely is, as the section heading suggests, a bitmap.*

Of course, this means a new data supporting data structure, and because we're in JavaScript-world, it's sure to get weird :-).

Complications arise because Javascript numbers are always 64-bit floats — except when they aren't. If you use TypedArrays, the numbers are stored according to the type you expect (e.g., unsigned 32-bit integer), but when you read it into a variable or try to do maths with that value then suddenly you're teleported to the realm of floating point wickedness. And if you then attempt bitwise operations on those numbers, it gets even more BANANAS.

By default the bitwise operators appear to treat your doubles as 32-bit *signed* integers. That means you have only 31 bits to flip, and another that's there for signing. You can reclaim the 32nd bit for flipping if you are willing to lace your bitwise operational code with these suffixes: `>>> 0`

It's a nightmare and you won't get through it (or this project in general) without tests. 

Assuming you can grapple with that complication, all you really need to understand to implement the bitmap's methods is the principle behind the `Math.clz32` function. Given a 32-bit number, from the binary representation of that number, return the number of leading zeroes. This allows you you to find the index of the first set bit, which allows you to implement functions to range over the set (or unset) bits in your bitmap.

Pseudo-code to describe the algorithm for computing the first set rank:

```
let bitmap = an array of unsigned 32-bit integers
for i in range 0 to final index of bitmap:
  let u = bitmap[i]
  if u == 0 continue
  let least significant set bit (lsb) = u & -u
  let leading zero count (lzc) = Math.clz32(lsb)
  let index = 31 - lzc
  return index + (i * 32)
```

Next you can create iterator functions to iterate over a bounded range of set bits. It uses same principle as computing first set rank, but more arithmetic required to calculate which "page" of bits in your bitmap array contains your bounds. Every time you yield the rank of a set bit, you unset that rank in a temporary variable before attempting another yield. And you continue until that temporary variable reaches zero.

It's finicky but possible in JavaScript. The way I do it is I make a class that extends Uint32Array, and then the class gets static generator functions for iterating over bounded ranges of set bits. Each combination of lower bound and upper bound being inclusive or exclusive is a separate method which you assign to the instance's `Symbol.iterator` as required.

# Making JavaScript Numbers Binary Comparable

As pointed out in the original ART piece, lots of things are not binary comparable the way they are — IEEE-754 floating point numbers for instance. Same for two's complement integers. And, yep, you guessed it, our modern unicode strings.

It means if you just try to sort JavaScript numbers by first comparing the magnitude of their first bytes in their binary representation, then their second bytes, and so forth, you will end up with an ordering that is different than the natural ordering according to their magnitudes. While it's a little more comprehensible why this is true with two's complement integers, as it turns out IEEE floats are almost like their own miniature file format and so require a special approach to comparing them — or alternatively converting them to a different format that is binary comparable.

The formula for such a transformation of floats and doubles to a binary comparable state is prescribed for us in in the ART article, albeit from my perspective in the manner of a riddle. Further complicating the solution to that riddle is the prospect of implementing it natively in JavaScript. 

I chose a lower-level language more amenable to solving this problem: AssemblyScript. It compiles to WebAssembly, and so is compatible with our JavaScript ART with the added benefit of syntactic similarity to JavaScript.

We export to JavaScript from our WASM module one function, called `RankF64`. The function will not return a fully transformed number, but merely an integer rank value to indicate which of the ten categories it falls into:

1.  -NaN
2.  -Infinity
3.  -Normal
4.  -Denormal
5.  -Zero
6.  +Zero
7.  +Denormal
8.  +Normal
9.  +Infinity
10. +NaN

This integer rank value will become the value of the first byte of our binary comparable key. It is calculated like so:

1. *reinterpret* your 64-bit floating-point number as an unsigned 64-bit integer.
2. use bitwise operations to separate the exponent and the mantissa into separate unsigned 64-bit integers.
3. the following table shows how to interpret the rank from the sign bit, exponent, and mantissa:

```
SIGN | EXPONENT | MANTISSA | RANK | CATEGORY
----------------------------------------------
1    | All 1's  | Non-0    | 0    | - NaN
1    | All 1's  | All 0's  | 1    | - infinity
1    | FALLTHRU | FALLTHRU | 2    | - normal
1    | All 0's  | Non-0    | 3    | - denormal
1    | All 0's  | All 0's  | 4    | - zero
0    | All 0's  | All 0's  | 5    | + zero
0    | All 0's  | Non-0    | 6    | + denormal
0    | FALLTHRU | FALLTHRU | 7    | + normal
0    | All 1's  | All 0's  | 8    | + infinity
0    | All 1's  | Non-0    | 9    | + NaN
```

After you have set the first byte of the nine-byte buffer (which will become your binary comparable key) to the rank value, write the JavaScript number into the remaining eight-byte segment as a Float64. Finally, if the rank was calculated as less than five (a negative JavaScript number), then you need to invert the bits of the JavaScript number you wrote into the buffer. Read it out in two four-byte segments as unsigned 32-bit integers and invert the bits before writing them back into the buffer.

**Disclaimer:** so far this has worked for me, but I'm not 100% sure it's a true algorithm that solves all edge cases. 

## A Single-Byte String Encoding and Collation (Latin1)

JavaScript strings are a different beast than the ASCII c-strings of yore.

And for a moment, entertain that a form of the problem we will discuss would also exist if you were dealing merely with ASCII c-strings. If you try to sort ASCII c-strings by comparing them byte-after-byte, it's true that `a` will come before `b`, and `b` before `c`, and so forth. But it is important to note, `a` will come after `Z`. The order of ASCII code points is such that the entire uppercase alphabet precedes the entire lowercase. Relying on the order of those code points is then rarely the way that a normal human will expect strings to be sorted in most softwares.  

As it turns out, the complexity of a string sorting endeavor largely depends on audience — computer scientists are easier to please compared to the rest.

**Enter**: *the concept of a collation.*

We need an algorithm that can take a string and produce a binary-comparable key suitable for sorting (and insertion into our radix tree, which does not support variable-length keys which are prefixes of other keys already in the tree). If this algorithm is effective in terms of *localization*, then also it will be able to produce different sort keys from the same input key depending on the chosen *locale*, as different cultures have different expectations about how strings should be sorted.

Modern JavaScript already has a `Collator`. Great! 

Alas we can't use it directly. It's only for locale-aware string sorting and comparison, not for producing an actual sort key. 

But in a sense, we will use it. After a brief consultation with YAGNI, I came to the conclusion I don't really need a full unicode string collation engine. Have a read through the official documents pertaining to the Unicode Collation Algorithm (UCA), and try not to shudder! If I can restrict myself to a limited range of characters which can be encoded in a single byte quite easily (for example, Latin1), we should be able to script out a kind of compilation routine to "rip off" the collation orders present in the JavaScript `Collator` without much trouble.

The first step is to somehow enumerate and cache in a JSON file the list of language Identifiers l we want to support. We don't need all languages, just those that have some interest in the Latin1 character set. For this I interrogated ChatGPT and came up with this list:

```json
[
  {"Identifier": "en", "Description": "English"},
  {"Identifier": "de", "Description": "German"},
  {"Identifier": "fr", "Description": "French"},
  {"Identifier": "es", "Description": "Spanish"},
  {"Identifier": "it", "Description": "Italian"},
  {"Identifier": "nl", "Description": "Dutch"},
  {"Identifier": "pt", "Description": "Portuguese"},
  {"Identifier": "da", "Description": "Danish"},
  {"Identifier": "sv", "Description": "Swedish"},
  {"Identifier": "nb", "Description": "Norwegian Bokmål"},
  {"Identifier": "nn", "Description": "Norwegian Nynorsk"},
  {"Identifier": "fi", "Description": "Finnish"},
  {"Identifier": "pl", "Description": "Polish"},
  {"Identifier": "cs", "Description": "Czech"},
  {"Identifier": "hu", "Description": "Hungarian"},
  {"Identifier": "sk", "Description": "Slovak"},
  {"Identifier": "sl", "Description": "Slovenian"},
  {"Identifier": "is", "Description": "Icelandic"},
  {"Identifier": "tr", "Description": "Turkish"},
  {"Identifier": "et", "Description": "Estonian"},
  {"Identifier": "eo", "Description": "Esperanto"},
  {"Identifier": "af", "Description": "Afrikaans"}
]
```

With these Identifiers, it turns out you can be even more granular, but I found that being even more specific did not result in more specific collation outcomes with the version of Node I was using so I left it like this.

Next we need an actual table of Latin-1 codepoints and metadata. I found this [HTML document hosted by the CS folks at Stanford](https://cs.stanford.edu/people/miles/iso8859.html). This is probably more than you care about as far as a side quest is concerned, but there was an oddity about it so I'll share a few extra details.

Usually in these situations I prefer to map the information into my chosen format with a script rather than manually transcribe it. Manual transcription is more boring, you stand to learn less, and it's more error-prone.

I came to know while I was writing my parsing script that this HTML document was indeed hand-crafted. I know this because a regex pattern in my parsing script encountered a snag caused by occasional missing forward slash characters in closing tags inside the table. It was no problem to overcome the issue by making the regex more permissive, but it was a fun little Easter egg left by Standford CS.

Here's the script (close your eyes if you want to try it yourself):

```js
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
```

The mysterious unescape executable I'm using came about because I realized the document is of course HTML, which means many special characters are in the form of HTML escape sequences.

Still avoiding translating things by hand, it seemed like JavaScript weirdly lacked a native way of translating HTML escape codes into code points. I could've used an NPM library, but then I realized golang had something in their standard library:

```go
package main

import(
  "html"
  "os"
  "bufio"
)

func main(){
  f := bufio.NewWriter(os.Stdout)
  defer f.Flush()
  f.Write([]byte(html.UnescapeString(os.Args[1])))
}
```

And this does not even "unescape" all the arcane escape codes hand-placed by the CS Standford folks (wow!), so I believe I ended up manually fixing a bunch anyway!

At long last I was ready to build my Latin-1 collation. These are the goals I made for the collation:

* Each character in the Latin-1 character set gets three collation numbers. This allows us to support three different "levels" of collation. They correspond to these levels of the `Intl.Collator`:
  * **base** — different characters with the same base character get the same number, regardless of accents or casing. This allows us to make very permissive, case-insensitive prefix-searches.
  * **accent** — different characters only get the same number if they merely differ in casing.
  * **variant** — neither casing nor accents allow different characters to compare equal.
* Each collation element fits within one byte.
* Different locales/languages get different collation elements.
* Compile the source code of the Latin1 JavaScript class to have the computed collation element table embedded in it from the get-go.
* a "0"-level collation function which lets you convert a JavaScript string into pure Latin1-encoding in a lossy fashion where any code point out of range will merely be mapped to a character you specify.

Since this is just a side quest, I'll share the code verbatim:


```js
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
```

Now we can make language-appropriate, binary-comparable keys out of strings!

## Prefix Searches

A trie without prefix-search functions is like... an incomplete attempt.

In order to support this, we need a quick, cheap supporting data structure I call `ByteStack`. I'll not give the algorithms because they are the same exceptionally well-known algorithms for implementing a vector/stack data structure:

* **push** a byte value onto the stack
* **pop** the most recently pushed byte value off the stack
* **peek** the most recently pushed byte value without removing
* **grow** the backing buffer as needed (internal use only)
* **pull** — this is one I maybe named weirdly and it's not a standard kind of function for this type of data structure, but it just renders out the current contents of the `ByteStack` as a fresh `DataView` with its own new backing `ArrayBuffer`. Bytes are copied in eight-byte "pages" as doubles to save time during copy operation.
* and an iterator method for iterating the byte values

The simplest prefix-search is a membership test. Provide a prefix, and it will return a boolean indicating if any key with the given prefix is present. Here's the pseudocode:

```
let prefix = your provided prefix
let root = the tree root
if root is null, tree is empty so return false
for every byte b in the prefix:
  if root does not contain b, then return false
  else:
    root = the child node associated with byte b
    continue
return true
```

These remaining methods ought to take a prefix string and return an iterator which will take you through all the leaf nodes whose keys have that prefix.

I have two kind of layers of these methods. 

The lowest layer is for when you just need to enumerate all the leaf nodes which descend from an arbitrary node as quickly as possible. By default the root node is the starting point, but you can specify any other node reference within the tree to start from as well as its key prefix. The four variants:

* **fullFwdRangeV** — an iterator for enumerating all descendent leaf nodes only in ascending order of their keys (but without yielding their keys). Requires as an argument only the node from which to commence the traversal.
* **fullRevRangeV** — same as the last one but in descending order of the keys.
* **fullFwdRangeKV** — an iterator for enumerating all descendent leaf nodes and theit keys in ascending order of their keys. Requires as an argument the node from which to commence the traversal as well as the key prefix of the same node (so that the full key can be reconstructed and yielded for each leaf).
* **fullRevRangeKV** same as the last one but in descending order of the keys.

First, the pseudocode algorithm for the version which yields leaves but not their keys:

```
let root = the node from which to start traversal (default tree root)
if root is null, return without yielding anything
let stack = an array/vector with null at index 0
do:
  if root is null break
  switch root.type:
    case Node1:
      do:
        root = root.child
      while root.type is Node1
      continue
    case NodeLeaf:
      yield root
      while length of stack is greater than 0:
        root = value at last index of stack
        if root is null then return
        let iteratorResult = root.next()
        if iteratorResult.done is true, then stack.pop()
        else:
          root = iteratorResult.value.child
          break
      continue
    default:
      set root's iterator method to version with forward direction and inclusive lower and upper bounds
      root.ITER_LB = 0
      root.ITER_UB = 255
      let iter = new instance of root's iterator
      stack.push(iter)
      root = iter.next().value
      continue
while true
```

Conceptually, the versions which also yield keys are only a little more complicated. You must manage two stacks in parallel instead of one. The first stack is for the key byte values, and the second is for node references. At the end you use the "pull" method from the `ByteStack` to render the key associated with a given leaf.

Next we need a correlary method for actually performing the prefix *search*. This yields only the node with the key prefix provided.

* **nodeWithPrefix** — for returning only the node.

```
let root = tree root or provided node
let prefix = provided prefix
foreach value of i from 0 to prefix length in bytes (latter exclusive):
  let keyByte = prefix[i]
  switch root.type:
    case Node1:
      if root's keyByte is not equal to keyByte, then return null
      root = root.child
      continue
    case NodeLeaf:
      return null
    default:
      if root does not contain keyByte, then return null
      root = child corresponding to keyByte in root
      continue
return root
```

## Compound Range Queries and Composable Query Methods

This is by far the most challenging part of the journey. Debugging my test cases was so intense that, at one point, I resorted to hand-sketching out my test-case trie with compound keys on a large sheet of paper in multiple colors. I fixed it to my dining room wall aside some print outs of test-case debug logging, surely etching a permanent memory in the minds of my wife and children.

Part of the complexity was that I tried to implement a single monolithic `query` method. I wanted a query method you could give an array of bound definitions, one for each subcomponent of the compound keys stored in the tree. Each definition could specify the inclusiveness of the bounds as well as whether that subcomponent has a fixed or variable length. I maintain that it's not impossible, but if you plan the composability of your methods optimally then you may be able break things up into more bite-sized pieces.

There is an invariant in the context of the bounded traversal that at any time, the key path to any node within the traversal must be lexicographically greater than the lower bound and less than the upper bound. Of course, inclusive versions of this invariant also exist. Almost wildly fewer lines of code (and lesser cyclomatic complexity) is attainable in the so-called naïve pursuit of this invariant whereby a full-length comparison of the current key prefix is permissible at each inner node of the trie. Evocative of this is the arrangement of full key comparisons performed at every node in logarithmic runtime algorithms for trees such the self-balancing binary search species, and so I could not stomach this design choice.

The way forward then is ensuring that the traversal is accurately stateful. This is not a small task. There is naturally the question of recursion versus an iterative, stack-based approach. I chose the latter because this problem is not fundamentally recursive and I have more experience with stack-based tree-traversal solutions. This is emphatically not the sort of problem where you should start swinging outside your wheelhouse.

### boundedRangeFixN

### boundedRangeFixPN

### boundedRangeVarN

### boundedRangeVarPN

## The Suffix Tree Use Case

## Future Improvements

## Comparative Benchmarking the AVL Binary Search and the Adaptive Radix Tree

## The "Flockbuster" Demonstration


