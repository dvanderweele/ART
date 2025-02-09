# JavaScript Adaptive Radix Tree Library Docs

## ART Module

### Constants

These constants are for configuring `ART` range queries. Read about their use cases in the section on the `query` instance method.

* `FORWARD`
* `EXCLUSIVE`
* `LOWER_BOUND_INCLUSIVE`
* `UPPER_BOUND_INCLUSIVE`
* `REVERSE`
* `FIXED_LENGTH_KEY`
* `VARIABLE_LENGTH_KEY`
* `LEAF_COMPONENT`

### class `ByteStack`

This is a support data structure used by the main Adaptive Radix Tree data structure (`ART`). It is a simple vector-style class for maintaining a growable stack of byte values. Same logical functionality could mostly be accomplished with a plain JavaScript `Array`, but this approach is much more compressive. Used internally by various `ART` range query methods where awareness of the iteration's current prefix is required.

#### `constructor`

Parameters:

* (optional) `initialCapacity` — default value of `8`.

#### Instance Properties

##### `size`

The number of byte values currently in the stack. You should treat this value as read-only. 

In theory you could manually lower this number to "remove" bytes in bulk from the stack (if you are not interested in their values) to avoid some of the minimal overhead of the `pop` method — but that has not been tested.

##### `dv`

The `DataView` which encapsulates the current backing buffer for stack values. Do not save references to this object because, when capacity is reached, it will be replaced internally by the growth mechanism.

##### `Symbol.iterator`

A generator function that makes this data structure iterable in the forward direction according to JavaScript's standard iteration protocol. The stack's byte values are yielded in FIFO order as JavaScript `Number`s. The state of the stack remains unchanged.

#### Public Instance Methods

##### `push`

Parameters:

* `b` - the key byte value to push onto the end of the stack (from range 0-255).

Add a byte value onto the end of the stack, growing the backing buffer as necessary.

##### `pop`

Remove and return the most recently `push`ed byte value. If stack is empty, returns -1.

##### `pull`

Does not modify the state of the stack. Returns a copy of the current `dv` DataView pointing to a copy of its backing buffer. For efficiency, byte values are copied in 8-byte batches. 

This method is used by various `ART` range query methods to produce a copy of the current key value which corresponds to a particular `NodeLeaf` instance. Therefore, *when possible* it is advised for performance to utilize `ART` range query methods which *do not* yield the key alongside the value (i.e., `LeafNode`). 

##### `peek`

Return but do not remove the most recently `push`ed byte value. If stack is empty, returns -1.

#### Private Instance Methods

##### `#grow`

When the capacity of the backing buffer is reached while `push`ing a byte value, the values are copied to a new backing buffer (twice the capacity of old buffer) in eight-byte batches. It's a pretty standard vector "growth" routine. There is no corresponding shrink method implemented. Only private to discourage you from mucking about, but since every other property is public there's technically nothing stopping you from doing growth or shrinkage operations if you are so-determined.

### class `Node1`

The smallest capacity `Node*` type, with room for only one key byte and its corresponding child node. This type is conceptually similar to a node in a singly linked list. This class extends `Array`.

This is a difference from the classic piece on Adaptive Radix Trees by Leis et al. ("The Adaptive Radix Tree:
ARTful Indexing for Main-Memory Databases"), where the smallest node type is `Node4`. In that vision, apart from adaptively sized nodes, additional compression is achieved by having a prefix vector/buffer within each node to store the contents of the one-way path preceding it (if any). These techniques are called *Lazy Expansion* and *Path Compression*. Lossy and lossless versions are envisioned, where lossy versions make it impossible to reconstruct the key from the path to the leaf node (requiring you to look instead to the tuple itself if you need the key).

Lossy variants of prefix compression were out of the question because a major use-case of this library is boundable range queries.

However, the vector approaches to lossless prefix compression, while highly compactive, vastly complicate the implementation of algorithms for range queries. This `Node1` type is my comprompise, enabling easier range queries while still having more compressiveness than if `Node4` was the smallest node type and any notion of prefix compression was forgone entirely. It should consume about as much additional memory (some constant factor) compared to the vector approach as would a program which elected to use a singly linked list instead of an array.

#### `constructor`

Initializes the key value to `0` and the child node value to `null`.

#### Instance Properties

##### index `0`

Stores the current key byte value in the form of a single-character-long string, where the character is the one with the character code corresponding to the key byte value.

##### index `1`

Stores a reference to the child node instance.

#### Instance Methods

##### `insert`

Parameters:

* `keyByte` — the key byte value (from range 0-255) to store. 

Return Codes:

* `0` — indicates success, only happens if child value at index 1 is null
* `1` — failure, child reference is not null and key byte value being inserted **does not** match currently stored key byte value.
* `2` — failure, child reference is not null and key byte value being inserted **does** match currently stored key byte value.

##### `indexOf`

Parameters:

* `keyByte`

If child is not null and `keyByte` matches what is stored, returns `0`, else `1`.

##### `remove`

Parameters:

* `keyByte`

Removal merely replaces child reference with `null` if the `keyByte` matches. 

##### `Symbol.iterator`

A generator function which yields an array where the first index has the key byte value and the second has the child node reference.

### class `Node4`

A node class for storing anywhere from 2 to 4 (inclusive) pairs of key byte and corresponsing child. It extends `Array`. Generally, linear search is used to locate keyBytes of interest.

#### `constructor`

Initialize empty `Node4` instance. By default, `Symbol.iterator` property initialized to `Node4.ITER_FWD_GE_TO_LE` method.

#### Instance Properties

##### index `0`

A `Uint8Array` instance with capacity of `4` for storing key bytes. Key bytes are stored packed in sorted order.

##### index `1`

An `Array` instance with 4 slots for storing child node instances (or `null`). Child node instances are kept at index that corresponds to the index their key byte is stored in the `Uint8Array`.

##### index `2`

A `Number` indicating the count of key/child pairs currently stored in the node.

##### `ITER_LB`

A `Number`, defaulting to `0`, which defines the lower bound for iteration. You can and should configure this property prior to iterating an instance of this type. All provided iteration methods respect this lower bound (see sections on `Symbol.iterator` instance property and the static iteration methods). 

##### `ITER_UB`

A `Number`, defaulting to `255`, which defines the upper bound for iteration. You can and should configure this property prior to iterating an instance of this type. All provided iteration methods respect this upper bound (see sections on `Symbol.iterator` instance property and the static iteration methods). 

##### `Symbol.iterator`

The property that makes compatibility with JavaScript's iteration protocol possible. See `constructor` for default value. Can have any of the provided static methods assigned to it before iterating.

#### Instance Methods

##### `insert`

Keeps the values packed and sorted according to `keyByte` values. Copies instances in children array as needed.

Parameters:

* `keyByte`

Return Codes:

* `-4` failure, the same `keyByte` was found at an occupied index.
* `-3` failure, the node is full
* the index the `keyByte` was successfully stored at — be sure to either store a node instance at rhw corresponding instance in the child node array or set that index to null.

##### `indexOf`

Parameters:

* `keyByte`

Return Codes:

* `-1` if `keyByte` not found
* the index of the `keyByte` if found

##### `remove`

Parameters:

* `keyByte`

Return Codes:

* `-1` if `keyByte` not found
* `1` if found and removed

#### Static Methods

##### `ITER_FWD_GE_TO_LE`

A generator function suitable for assignment to the `Symbol.iterator` property of an instance of the class. It yields keyByte/child pairs, in ascending order of the keyByte values, in the form of `Array` instances where the first index has the keyByte and the second the child. It treats the value of the instance's `ITER_LB` property as an inclusive lower bound for keyBytes to yield, and it treats the value of the instance's `ITER_UB` property as an inclusive upper bound for keyBytes to yield.

##### `ITER_FWD_GE_TO_LT`

A generator function suitable for assignment to the `Symbol.iterator` property of an instance of the class. It yields keyByte/child pairs, in ascending order of the keyByte values, in the form of `Array` instances where the first index has the keyByte and the second the child. It treats the value of the instance's `ITER_LB` property as an inclusive lower bound for keyBytes to yield, and it treats the value of the instance's `ITER_UB` property as an exclusive upper bound for keyBytes to yield.

##### `ITER_FWD_GT_TO_LE`

A generator function suitable for assignment to the `Symbol.iterator` property of an instance of the class. It yields keyByte/child pairs, in ascending order of the keyByte values, in the form of `Array` instances where the first index has the keyByte and the second the child. It treats the value of the instance's `ITER_LB` property as an exclusive lower bound for keyBytes to yield, and it treats the value of the instance's `ITER_UB` property as an inclusive upper bound for keyBytes to yield.

##### `ITER_FWD_GT_TO_LT`

A generator function suitable for assignment to the `Symbol.iterator` property of an instance of the class. It yields keyByte/child pairs, in ascending order of the keyByte values, in the form of `Array` instances where the first index has the keyByte and the second the child. It treats the value of the instance's `ITER_LB` property as an exclusive lower bound for keyBytes to yield, and it treats the value of the instance's `ITER_UB` property as an exclusive upper bound for keyBytes to yield.

##### `ITER_REV_LE_TO_GE`

A generator function suitable for assignment to the `Symbol.iterator` property of an instance of the class. It yields keyByte/child pairs, in descending order of the keyByte values, in the form of `Array` instances where the first index has the keyByte and the second the child. It treats the value of the instance's `ITER_LB` property as an inclusive lower bound for keyBytes to yield, and it treats the value of the instance's `ITER_UB` property as an inclusive upper bound for keyBytes to yield.

##### `ITER_REV_LE_TO_GT`

A generator function suitable for assignment to the `Symbol.iterator` property of an instance of the class. It yields keyByte/child pairs, in descending order of the keyByte values, in the form of `Array` instances where the first index has the keyByte and the second the child. It treats the value of the instance's `ITER_LB` property as an exclusive lower bound for keyBytes to yield, and it treats the value of the instance's `ITER_UB` property as an inclusive upper bound for keyBytes to yield.

##### `ITER_REV_LT_TO_GE`

A generator function suitable for assignment to the `Symbol.iterator` property of an instance of the class. It yields keyByte/child pairs, in descending order of the keyByte values, in the form of `Array` instances where the first index has the keyByte and the second the child. It treats the value of the instance's `ITER_LB` property as an inclusive lower bound for keyBytes to yield, and it treats the value of the instance's `ITER_UB` property as an exclusive upper bound for keyBytes to yield.

##### `ITER_REV_LT_TO_GT`

A generator function suitable for assignment to the `Symbol.iterator` property of an instance of the class. It yields keyByte/child pairs, in descending order of the keyByte values, in the form of `Array` instances where the first index has the keyByte and the second the child. It treats the value of the instance's `ITER_LB` property as an exclusive lower bound for keyBytes to yield, and it treats the value of the instance's `ITER_UB` property as an exclusive upper bound for keyBytes to yield.

### class `Node16`

### class `Node48`

### class `Node256`

### class `NodeLeaf`

### class `ART`

## BitMap Module

### class `BitMap`

#### `constructor`

#### Instance Properties

##### `ITER_LB`

##### `ITER_UB`

#### Instance Methods

#### Static Methods
