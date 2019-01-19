function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function setType(collection) {
  return Array.isArray(collection) ? Array : Object;
}
function setAccum(type) {
  return type === Array ? [] : Object.create(null);
}
/**
 * @desription Adds a new key:value pair to a collection.
 * If the collection is an Array, appends item to the end.
 */

function append(collection, item, key) {
  return Array.isArray(collection) ? collection.concat(item) : Object.assign(Object.create(null), collection, _defineProperty({}, key, item));
}
function isCompound(item) {
  return Array.isArray(item) || _typeof(item) === 'object' && item !== null;
}

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
 */

function fold(accum, collection, fn) {
  // converts array indexes to [...String]
  // eliminates need to check type
  // ...though if accum is an Array, could
  // be optimized with Array.push
  // Alternatively, if an Object has not prototype
  var keys = Object.keys(collection);
  var acc = accum;

  for (var _i = 0; _i < keys.length; _i++) {
    var key = keys[_i];
    acc = fn(acc, collection[key], key);
  }

  return acc;
}
/**
 * @description Maps a procedure to a collection.
 * Similar to Array.map.
 */

function map(collection, proc) {
  var type = setType(collection);
  return fold(setAccum(type), collection, function (acc, val, key) {
    return append(acc, proc(val, key), key);
  });
}
/**
 * @description Flattens a nested document to
 * a Dictionary of composite keys. That is
 * each key in the Dict represents the path
 * to its own value.
 */

function flatten(collection) {
  var withAcc = function withAcc(coll, accum, p) {
    return fold(accum, coll, function (acc, value, key) {
      var path = "".concat(p, ".").concat(key);
      return isCompound(value) ? // why can't I do (value as Compound<T>)
      withAcc(value, acc, path) : Object.assign({}, acc, _defineProperty({}, path.slice(1), value));
    });
  };

  return withAcc(collection, {}, '');
}
/**
 * @description findAll differs from filter in that
 * filter returns the original shape of the collection
 * that has been filtered accordingly, findAll returns an
 * Array of { key, value, path }
 *
 * flatFilter == flatFindAll
 */

function deepFindAll(delim, collection, isMatch) {
  var withAcc = function withAcc(coll, accum, p) {
    return fold(accum, coll, function (acc, value, key) {
      var path = "".concat(p).concat(delim).concat(key);

      if (isMatch(value, key)) {
        // need to remove delimiter at front
        // i'm sure there's a cleaner way
        return [].concat(_toConsumableArray(acc), [{
          value: value,
          key: key,
          path: path.slice(1)
        }]);
      } else if (isCompound(value)) {
        return withAcc(value, acc, path);
      } else {
        return acc;
      }
    });
  };

  return withAcc(collection, [], '');
}
/**
 * @description Returns a Dictionary of
 * K:V pairs for every key in keys.
 * A search stops for first
 * instance of a key found.
 * Uses depth-first search.
 */

function deepFindKeys(collection) {
  for (var _len = arguments.length, keys = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    keys[_key - 1] = arguments[_key];
  }

  var lookup = keys.reduce(function (acc, key) {
    return Object.assign({}, acc, _defineProperty({}, key, 1));
  }, Object.create(null));

  var withAcc = function withAcc(coll, accum) {
    return fold(accum, coll, function (acc, val, key) {
      if (key in lookup) {
        return Object.assign({}, acc, _defineProperty({}, key, val));
      } else if (isCompound(val)) {
        return withAcc(val, acc);
      } else {
        return acc;
      }
    });
  };

  return withAcc(collection, Object.create(null));
}
/**
 * @description Counts all occurrences of the given key.
 */

function count(aDoc, aKey) {
  var withCount = function withCount(doc, num) {
    return fold(num, doc, function (acc, val, key) {
      // assumes key is only in an Object
      if (key === aKey) {
        return withCount(val, 1 + acc);
      } else if (isCompound(val)) {
        return withCount(val, acc);
      } else {
        return acc;
      }
    });
  };

  return withCount(aDoc, 0);
}

/**
 * @description Retrieves the document(s)
 * at the given path.
 */
function traverse(_ref) {
  var blank = _ref.blank,
      all = _ref.all,
      obj = _ref.obj,
      path = _ref.path,
      atKey = _ref.atKey;

  var atPath = function atPath(anObj, aPath) {
    var L = aPath.length;
    var result = anObj;

    var _loop = function _loop(i) {
      var P = aPath[i];

      if (P === all) {
        return {
          v: map(result, function (item) {
            return setRoute(item, aPath.slice(i + 1));
          })
        };
      } else {
        var newResult = result[P];

        if (newResult) {
          result = newResult;
        } else {
          return {
            v: null
          };
        }
      }
    };

    for (var i = 0; i < L; i++) {
      var _ret = _loop(i);

      if (_typeof(_ret) === "object") return _ret.v;
    }

    return result;
  };

  var setRoute = function setRoute(anObj, aPath) {
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

var BLANK = '';
var ALL = '*';

var OQ =
/*#__PURE__*/
function () {
  function OQ(doc, config) {
    var _this = this;

    _classCallCheck(this, OQ);

    _defineProperty(this, "_doc", void 0);

    _defineProperty(this, "_config", void 0);

    _defineProperty(this, "at", function (path) {
      return path === BLANK ? _this._doc : new OQ(traverse({
        obj: _this._doc,
        path: path.split(_this._config.delimiter),
        blank: BLANK,
        all: ALL //atKey: x => x

      }), _this._config);
    });

    _defineProperty(this, "flatReduce", function (proc, acc) {
      return new OQ(fold(acc, _this._doc, proc), _this._config);
    });

    _defineProperty(this, "flatMap", function (proc) {
      return new OQ(map(_this._doc, proc), _this._config);
    });

    _defineProperty(this, "count", function (key) {
      return count(_this._doc, key);
    });

    _defineProperty(this, "maxDepth", function () {
      return null;
    });

    _defineProperty(this, "flatten", function (path) {
      if (!path) {
        return new OQ(flatten(_this._doc), _this._config);
      } else {
        // return new doc with contents flattened @ given path
        return new OQ(flatten(_this.at(path).get()), _this._config);
      }
    });

    _defineProperty(this, "deepFindAll", function (predicate) {
      return new OQ(deepFindAll(_this._config.delimiter, _this._doc, predicate), _this._config);
    });

    _defineProperty(this, "valuesOf", function () {
      for (var _len = arguments.length, keys = new Array(_len), _key = 0; _key < _len; _key++) {
        keys[_key] = arguments[_key];
      }

      return new OQ(deepFindKeys.apply(void 0, [_this._doc].concat(keys)), _this._config);
    });

    this._doc = doc;
    this._config = config;
  }
  /**
   * returns the current document
   */


  _createClass(OQ, [{
    key: "get",
    value: function get() {
      return this._doc;
    }
    /**
     * retrieves the value at the given path
     * ex in: 'data.children.1.data'
     *
     * should this double as a setter? extra param for
     * updating doc @ path
     */

  }]);

  return OQ;
}();

export default OQ;
