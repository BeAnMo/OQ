# OQ (Object Query)

### A library for retrieving and manipulating JSON data.

The successor to my previous library [Json-Find](https://www.npmjs.com/package/json-find).

### IN PROGRESS

All names subject to change.

---

### Documentation

### Instantiation

```js
// Node/CommonJS
const OQ = require('OQ.common.js');
// ES6 Module
import OQ from 'OQ.es.js';
// Browser script
// <script src="OQ.browser.[full|min].js><script>

const doc = {
  a: 1,
  b: [{ c: 2, d: [4, 5, 6] }, { c: 3, d: [7, 8, 9] }],
  e: { g: { h: 'hello' } }
};

const Doc = new OQ(doc);
// set with custom path delimiter
const Doc = new OQ(doc, { delimiter: '/' });
```

An OQ object takes a JSON document and can optionally take in a configuration object (current only supports a delimiter for path creation).

The basic idea is to mimic the Array object interface and allow for traversing of Object & nested Arrays/Objects as well. For OQ, Array/Objects are simply "compound" data. Like Array methods, where the callback function includes the current item and its index, OQ does much the same, only the "index" may be the key of an Object as well.

OQ provides the ability to work within a single level or all levels of a nested document. Currently, there are _flat_ and _deep_ versions of the typical iterative functions like map/filter/reduce.

Types for making sense of the signatures:

- Primitive is one of:

  - String
  - Number
  - Boolean
  - Null
  - Undefined

- Compound is one of:

  - Array
  - Object

- Document is one of:

  - Primitive
  - Compound

- OQ-Doc is a Document implementing the OQ interface.

### Retrival

##### OQ.get: Void -> Compound | Primitive

Retrieves the current Document.

```js
Doc.get();
```

##### OQ.at: String -> OQ-Doc | Primitive

Retrieves the sub-document at the given path. A path is a string with each key separated by the custom delimiter. For retrieval of all keys (including Array indexes) use "\*".

```js
Doc.at('b.1.d.2').get(); // 9
Doc.at('b.1'); // new OQ object of { c: 3, d: [7, 8, 9] }
Doc.at('b.1').get(); // { c: 3, d: [7, 8, 9] }

// certain queries may also be replicated with OQ.flatMap
Doc.at('b.*.c').get(); // new OQ object of [2, 3]
```

### Flat Methods

##### OQ.flatMap: ((Any, String|Number) -> Any) -> OQ-Doc

Comparable to <code>Array.map</code>. Takes in a procedure and maps it to the top level of the current Document.

```js
Doc.flatMap((value, key) => key).get(); // {a: 'a', b: 'b', e: 'e' }
Doc.at('b')
  .flatMap((value, key) => value.c * value.c)
  .get(); // [4, 9]
```

##### OQ.flatReduce (((Accum, Any, String|Number) -> Any), Accum) -> Any

Comparable to <code>Array.reduce</code>. Applies a given procedure to each key:value pair in the top level document and combines it with the accumulator given. <code>OQ.flatReduce</code> operates "left" to "right" (or "top" to "bottom") on Compound data, and because Objects may or may not retain their key orders, there are no plans for an equivalent to <code>Array.reduceRight</code>.

```js
Doc.flatReduce((accum, value, key) => ..., ...);
```

### Deep Methods

All deep methods currently use depth-first search and traverse an entire document.

##### OQ.count: String -> Number

Counts All occurences of a given key.

```js
Doc.count('c'); // 2
```

##### OQ.flatten: String? -> OQ-Doc

Flattens the entire current Document or the sub-Document at the given path. The result is an Object whose keys represent the path to their respective _primitive_ values (compound data will not be values).

```js
Doc.flatten().get();
/*
{
    a: 1,
    'b.0.c': 2,
    'b.0.d.0': 4,
    'b.0.d.1': 5,
    'b.0.d.2': 6,
    ...
}
*/
```

##### OQ.deepFindAll: ((Any, String|Number) -> Boolean) -> OQ-Doc

Retrives all sub-documents that match the given predicate. The resulting OQ-Doc is an Array of Objects of <code>{ value: Any, key: String, path: String }</code>.

```js
Doc.deepFindAll((value, key) => ...).get(); //
```

##### OQ.valuesOf: ...String -> OQ-Doc

Retrieves the first value of each given key and returns an OQ-Doc of an Object with each given key's value.

```js
Doc.valuesOf('a', 'c', 'h').get(); // { a: 1, c: 2, h: 'hello' }
```
