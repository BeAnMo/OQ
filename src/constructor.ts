import { JsonDoc, Config } from './types';
import {
  count,
  fold,
  map,
  flatten,
  deepFindAll,
  deepFindKeys,
  traverse
} from './iter-funcs';

const BLANK = '';
const ALL = '*';

class OQ<T> {
  private _doc: JsonDoc<T>;
  private _config: Config;

  constructor(doc: JsonDoc<T>, config: Config) {
    this._doc = doc;
    this._config = config;
  }

  /**
   * returns the current document
   */
  public get() {
    return this._doc;
  }

  /**
   * retrieves the value at the given path
   * ex in: 'data.children.1.data'
   *
   * should this double as a setter? extra param for
   * updating doc @ path
   */
  public at = (path: string): any => {
    return path === BLANK
      ? this._doc
      : new OQ(
          traverse({
            obj: this._doc,
            path: path.split(this._config.delimiter),
            blank: BLANK,
            all: ALL
            //atKey: x => x
          }) as JsonDoc<T>,
          this._config
        );
  };

  /**
   * ---- FLAT METHODS ---- *
   * operate on single level in a nested doc,
   * similar to Array methods
   */

  public flatReduce = (proc: Function, acc: any): OQ<T> => {
    return new OQ(fold(acc, this._doc, proc), this._config);
  };

  public flatMap = (proc: Function): OQ<T> => {
    return new OQ(map(this._doc, proc) as JsonDoc<T>, this._config);
  };

  /**
   * ---- DEEP METHODS ---- *
   * operate on entire nested document,
   * currently depth-first only
   */

  /**
   * @description counts all occurences
   * of given key within a document
   * @param {String}
   */
  public count = (key: string) => {
    return count(this._doc, key);
  };

  public maxDepth = () => {
    return null;
  };

  /**
   * @description flattens the collection
   * to a composite-key Dictionary
   * if path is given, returns whole
   * doc with flattened sub-doc @ path
   */
  public flatten = (path: string | undefined): OQ<T> => {
    if (!path) {
      return new OQ(flatten(this._doc) as JsonDoc<T>, this._config);
    } else {
      // return new doc with contents flattened @ given path
      return new OQ(flatten(this.at(path).get()) as JsonDoc<T>, this._config);
    }
  };

  /**
   * @description returns a flat collection of K:V pairs
   * where the predicate holds true
   * @param {Function} predicate ```Value, Key -> Boolean```
   */
  public deepFindAll = (predicate: Function): OQ<T> => {
    return new OQ(
      deepFindAll(this._config.delimiter, this._doc, predicate) as JsonDoc<T>,
      this._config
    );
  };

  /**
   * @description returns an Object
   * of K:V pairs at the given keys
   */
  public valuesOf = (...keys: string[]) => {
    return new OQ(deepFindKeys(this._doc, ...keys) as any, this._config);
  };
}

export default OQ;
