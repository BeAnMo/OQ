import { Key, Compound, JsonDoc } from './types';

export function setType<T>(collection: Compound<T>): Function {
  return Array.isArray(collection) ? Array : Object;
}

export function setAccum<Json>(type: Function): Compound<Json> {
  return type === Array ? [] : Object.create(null);
}

/**
 * adds a new key:value pair to a collection,
 * if an Array, appends to the end
 */
export function append<T>(
  collection: Compound<T>,
  item: JsonDoc<any>,
  key: Key
): Compound<T> {
  return Array.isArray(collection)
    ? collection.concat(item)
    : (<any>Object).assign(Object.create(null), collection, { [key]: item });
}

export function maybeValue<T>(obj: Compound<T>, key: Key): null | JsonDoc<T> {
  const val = obj[key];

  return isUndefined(val) ? null : val;
}

export function isCompound<T>(item: any): item is Compound<T> {
  return Array.isArray(item) || (typeof item === 'object' && item !== null);
}

export function isUndefined(val: any): val is undefined {
  return val === undefined;
}

/*---- General purpose ------------------------------------------------------*/

/**
 * Any, ...(Any) -> Any -> Any
 * composes functions with src as initial input
 * pipe(4, add2, sub5, mul10) == mul10(sub5(add2(4)))
 */
export function pipe(src: any, ...fns: Function[]): any {
  return fns.reduce((acc, fn) => fn(acc), src);
}
