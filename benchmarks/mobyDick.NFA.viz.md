# Visualizing MASSIVE NFA State Machines for Shakespeare (66MB SVG) and Moby Dick (44MB SVG) Unique Words by Compiling from Adaptive Radix Tree (ART) to GraphViz

* [YouTube Demo of the SVGs]()
* [MobyDick SVG on GitHub](https://github.com/dvanderweele/ART/blob/main/benchmarks/mobyDick.svg)
* [Shakespeare SVG on GitHub](https://github.com/dvanderweele/ART/blob/main/benchmarks/shakespeare.svg)

After the initial release of my [JavaScript Adaptive Radix Tree project](https://dvanderweele.com/how-i-built-an-adaptive-radix-tree-compound-key-index-latin1-collation-regex-compiler-and-183kb-regex-pattern-for-the-complete-works-of-shakespeare-all-in-javascript) where we compiled massive regular expressions that match all the unique words in Moby Dick and the Complete Works of Shakespeare, I was mulling over diagram-as-code options for planning future projects.

I happened upon [Mermaid.js State Diagrams](https://mermaid.js.org/syntax/stateDiagram.html). This would seem to be exactly what I was after! The label on the tin hits a lot of notes:

* JavaScript ecosystem tool leads you to believe it will probably work on ARM64 platforms like Android Termux or Raspberry PI
* Mildly snazzy website
* Seemingly easy command file (.mmd) format syntax for targeting with our latest compilation procedure we're cooking up.
* Multiple rendering target options include bitmap and thankfully vector format (SVG)

As I was researching this Mermaid.js library, it struck me that these features could be a great candidate for possibly rendering visual representations of the non-deterministic finite automata that correspond to the huge regular expressions we compiled for unique words in Moby Dick and Shakespeare.

So, I set out to do just that!

And actually, I had a lot of problems with Mermaid — enough that I went elswhere. This isn't a hit piece by any means, but I was disappointed and so do want to note why I ended up abandoning the library.

## Why I Abandoned Mermaid.js

The first reason for my chagrin was that (as of this writing in late December 2025) the Mermaid-CLI tool is not usable on ARM64 processors. This means you can't use it in Termux on Android (huge bummer!), but it **also** means you can't even run this on a Raspberry PI.

That's seriously disappointing. Let's say I don't want something resource- or time-intensive running on my phone; in that case I might want to throw it on the PI and check back later. But we cannot do this because ARM64 is not supported.

Wow! I guess that means Mermaid is doing some really fancy and excellent things. So I plan on using my laptop for the build and meanwhile move on with development.

The Mermaid documentation, while giving some syntax examples, does not appear to have actual BNF or other grammar. It's not the end of the world but it does require some more elbow grease to derive correct syntax in some cases. It did not prevent me from ultimately producing a valid `.mmd` file for mermaid-cli. 

Finally, it was the moment of truth. I had compiled my `.mmd` file of commands from the intermediate result returned by my Adaptive Radix Tree's `toRegex` method. The resulting file was in the neighborhood of 3MB in size. I was ready to run the mermaid-cli to compile an epic SVG.

I opened my gaming laptop and hit run.

Before it would really run I had to research and create two config files to override various default limits (a timeout and a text limit) to give Mermaid a chance to actually run the file. But in the end, it did start running the file.

It ran for a while.

And then it ran some more.

*And it kept running...*

After some time it became clear to me it could run for an unrealistic amount of time. Some cursory research gave weight to that theory given the size of my `.mmd` file.

While it was still running, I looked into alternate options.

## Migrating to `GraphViz`

GraphViz has a number of things going for it.

* It works easily on ARM64 and is even installable through Termux `pkg` manager
* According to low-effort web research, it's faster for algorithmic reasons and also written in C
* No messing around, they are literally just putting rule grammars in the documentation.
* The syntax is quite similar to Mermaid but you evidently don't have to define your vertices separately from transitions.

I modified my compilation script to target graphviz format and *voila*, I had a `.gv` command file ready. I plugged my phone in and kicked off this command in Termux: `dot -Tsvg mobyDick.gv -o mobyDick.svg`

I laid down for a nap and upon waking a little more than an hour later, GraphViz had finished rendering the SVG... and Mermaid was still churning on my gaming laptop.

We have a winner!

The SVG for the NFA which recognizes all the words in Moby Dick is around 44MB in size. The aspect ratio when properly rendered is a wild 1×~307. That means if I physically printed it on a banner with a height of 1 foot, the banner would be longer than an American football field!

The SVG for the Complete Works of Shakespeare NFA (compiled after Moby Dick) is about 66MB. Actually, it took more than 4 hours to complete in Termux (with full battery and mostly plugged in, too); since the file sizes are not even greater by a factor of two, this to me indicates even the GraphViz algorithms are superlinear somehow in terms of time complexity. However, clearly far faster than Mermaid. The aspect ratio for the Shakespeare SVG is about 1×328, or more than 1.25 American football fields if printed on an a 1-foot tall banner.

And so it is hard to really get a proper view of these huge state machine diagrams in any medium, but I found LibreOffice Draw as usual just works for this random need I had.

These extreme aspect ratios are a testament to one of the chief advantages of trie data structures and also trie-style NFAs (trie regexes) for recognizing natural language words. That is, the height of the data structures, and therefore time required for membership tests, is limited to the length of words stored therein. As additional words are added, primarily the data structures keep growing horizontally.

A bit about the compilation procedure and how it differs from what we've done so far with the Radix Tree project.

## Details About Compiling a GraphViz NFA Definition from the Adaptive Radix Tree's `toRegex` Intermediate Result

The intermediate result from the ART's `toRegex` is a tree-like data structure. The root is always a Group (Array-like with a boolean instance property called `optional`). Each Group has a layout like this: 

1. A `ByteStack` — if you recall from the ART project overview this is a vector data structure for byte values.
2. Zero or more entries after that where each can be either a `ByteStack` or another group.

Based on the source representation of this data in the ART, we interpret differently the meaning of the boundaries in the array between `ByteStack` and Group instances depending on the order of the entries. In cases where a ByteStack preceeds a group, this is a place where a character in a regex pattern would be followed by a concatenation operator and then the start of a group. Conversely, in cases where a `ByteStack` succeeds a Group, this means the regex alternation operator would go between them. Finally, abutting `ByteStacks` naturally indicate the alternation operator between two strings.

And so in the regular expression compilation adventures we determined, in a somewhat odd way, whether two neighboring entries in a Group were separated by an alternation or concatenation operator by way of a quick analysis of the last token pushed onto the output tokens array. 

While okay for the purposes of compiling a regex pattern, a more robust approach was called for when compiling diagram-as-code commands for an NFA. 

Before commencing my iterative depth-first traversal of the intermediate result to produce rules, I did a recursive traversal which reduced each Group array to another array of entries potentially smaller in size. Mainly, cases where a ByteStack had a Group concatenated after it were transformed to an instance of a single compound type.

This makes managing the current prefix of the depth-first traversal tremendously easier and more accurate! Importantly, both Mermaid.js and GraphViz formats require unique identifier strings for each vertex defined. Naturally for that I use the prefix of the node/vertex.

Anyway, for a closer look at the compilation logic check the `*.diagram.js` files in the ART project's `benchmarks/` directory.
