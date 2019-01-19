import { Key, Compound, JsonDoc, Dict, List } from './types';
import { setType, setAccum, append, isCompound, maybeValue } from './helpers';

/**
 * Behold the might of Fold!
 *
 * Technically this is foldL.
 * It mimics Array.reduce in that
 * it traverse Arrays [L,..., R]
 * (left to right).
 *
 * No plans for Array.reduceRight,
 * because I assume Object keys do not
 * maintain order (even if they actually do).
 *
 * @param {Any} accum
 */
export function fold<Json>(
  accum: Json,
  collection: Compound<Json>,
  fn: Function
): Json {
  // converts array indexes to [...String]
  // eliminates need to check type
  // ...though if accum is an Array, could
  // be optimized with Array.push
  const keys: Key[] = Object.keys(collection);
  let acc = accum;

  for (const key of keys) {
    acc = fn(acc, collection[key], key);
  }

  return acc;
}

/*export function fold(accum, collection, fn) {
  // converts array indexes to [...String]
  // eliminates need to check type
  // ...though if accum is an Array, could
  // be optimized with Array.push
  const keys = Object.keys(collection);
  let acc = accum;

  for (const key of keys) {
    acc = fn(acc, collection[key], key);
  }

  return acc;
}*/

/** @description Maps a procedure to a collection.
 * Similar to Array.map.
 */
export function map<T>(collection: Compound<T>, proc: Function): Compound<T> {
  const type = setType(collection);

  return fold(
    setAccum(type),
    collection,
    <T>(acc: Compound<T>, val: JsonDoc<any>, key: Key): any =>
      append(acc, proc(val, key), key)
  );
}

export function flatten<Json>(collection: Compound<Json>): Dict<Json> {
  const withAcc = (coll: Compound<Json>, accum: Dict<Json>, p: string) => {
    return fold(accum, coll, (acc: Dict<Json>, value: Json, key: Key) => {
      const path = `${p}.${key}`;

      return isCompound(value)
        ? // why can't I do (value as Compound<T>)
          withAcc(value as any, acc, path)
        : (Object as any).assign({}, acc, { [path.slice(1)]: value });
    });
  };

  return withAcc(collection, {}, '');
}

/** @description findAll differs from filter in that
 * filter returns the original shape of the collection
 * that has been filtered accordingly, findAll returns a
 * flat collection of K:V pairs
 *
 * flatFilter == flatFindAll
 */
export function deepFindAll<Json>(
  delim: string,
  collection: Compound<Json>,
  isMatch: Function
): List<Json> {
  const withAcc = (coll: Compound<Json>, accum: List<Json>, p: string) => {
    return fold(accum, coll, (acc: List<Json>, value: Json, key: string) => {
      const path = `${p}${delim}${key}`;

      if (isMatch(value, key)) {
        // need to remove delimiter at front
        // i'm sure there's a cleaner way
        return [...(acc as []), { value, key, path: path.slice(1) }];
      } else if (isCompound(value)) {
        return withAcc(value as any, acc, path);
      } else {
        return acc;
      }
    });
  };

  return withAcc(collection, [], '');
}

/** @description Returns the K:V pair for
 * every key in keys. Search stop for first
 * instance of a key found.
 * Uses depth-first search.
 */
export function deepFindKeys<Json>(
  collection: Compound<Json>,
  ...keys: string[]
): Dict<Json> {
  const lookup = keys.reduce(
    (acc, key) => (Object as any).assign({}, acc, { [key]: 1 }),
    Object.create(null)
  );

  const withAcc = (coll: Compound<Json>, accum: Dict<Json>) => {
    return fold(accum, coll, (acc: Dict<Json>, val: Json, key: string) => {
      if (key in lookup) {
        return (Object as any).assign({}, acc, { [key]: val });
      } else if (isCompound(val)) {
        return withAcc(val as any, acc);
      } else {
        return acc;
      }
    });
  };

  return withAcc(collection, Object.create(null));
}

/** @description Counts all occurrences
 * of the given key.
 */
export function count<Json>(aDoc: JsonDoc<Json>, aKey: string): number {
  const withCount = (doc: JsonDoc<Json>, num: number) => {
    return fold(num, doc, (acc: number, val: Json, key: Key) => {
      // assumes key is only in an Object
      if (key === aKey) {
        return withCount(val as any, 1 + acc);
      } else if (isCompound(val)) {
        return withCount(val as any, acc);
      } else {
        return acc;
      }
    });
  };

  return withCount(aDoc, 0);
}

interface TraverseArgs<T> {
  blank: string | '';
  all: string | '*';
  obj: JsonDoc<T>;
  path: string[];
  atKey?: Function;
}

export function traverse<Json>({
  blank,
  all,
  obj,
  path,
  atKey
}: TraverseArgs<Json>): JsonDoc<Json> | null {
  const atPath = (
    anObj: JsonDoc<Json>,
    aPath: string[]
  ): JsonDoc<Json> | null => {
    const L = aPath.length;
    let result = anObj;

    for (let i = 0; i < L; i++) {
      const P = aPath[i];

      if (P === all) {
        return map(result, (item: JsonDoc<Json>) =>
          setRoute(item, aPath.slice(i + 1))
        ) as JsonDoc<Json>;
      } else {
        const newResult = result[P];

        if (newResult) {
          result = newResult;
        } else {
          return null;
        }
      }
    }

    return result;
  };

  const setRoute = (
    anObj: JsonDoc<Json>,
    aPath: string[]
  ): JsonDoc<Json> | null => {
    if (aPath[0] === blank) {
      return null;
    } else if (aPath[0] === all) {
      return obj;
    } else {
      return atPath(anObj, aPath);
    }
  };

  return setRoute(obj, path);
}
