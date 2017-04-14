(function (exports,reactDom,react) {
'use strict';

var fableGlobal = function () {
    var globalObj = typeof window !== "undefined" ? window
        : (typeof global !== "undefined" ? global
            : (typeof self !== "undefined" ? self : {}));
    if (typeof globalObj.__FABLE_CORE__ === "undefined") {
        globalObj.__FABLE_CORE__ = {
            types: new Map(),
            symbols: {
                reflection: Symbol("reflection"),
            }
        };
    }
    return globalObj.__FABLE_CORE__;
}();
function setType(fullName, cons) {
    fableGlobal.types.set(fullName, cons);
}

var _Symbol = (fableGlobal.symbols);

var NonDeclaredType = (function () {
    function NonDeclaredType(kind, definition, generics) {
        this.kind = kind;
        this.definition = definition;
        this.generics = generics;
    }
    NonDeclaredType.prototype.Equals = function (other) {
        if (this.kind === other.kind && this.definition === other.definition) {
            return typeof this.generics === "object"
                ? equalsRecords(this.generics, other.generics)
                : this.generics === other.generics;
        }
        return false;
    };
    return NonDeclaredType;
}());
var Any = new NonDeclaredType("Any");
var Unit = new NonDeclaredType("Unit");
function Option(t) {
    return new NonDeclaredType("Option", null, t);
}
function FableArray(t, isTypedArray) {
    if (isTypedArray === void 0) { isTypedArray = false; }
    var def = null, genArg = null;
    if (isTypedArray) {
        def = t;
    }
    else {
        genArg = t;
    }
    return new NonDeclaredType("Array", def, genArg);
}
function Tuple(ts) {
    return new NonDeclaredType("Tuple", null, ts);
}
function GenericParam(definition) {
    return new NonDeclaredType("GenericParam", definition);
}
function Interface(definition) {
    return new NonDeclaredType("Interface", definition);
}
function makeGeneric(typeDef, genArgs) {
    return new NonDeclaredType("GenericType", typeDef, genArgs);
}


function extendInfo(cons, info) {
    var parent = Object.getPrototypeOf(cons.prototype);
    if (typeof parent[_Symbol.reflection] === "function") {
        var newInfo_1 = {}, parentInfo_1 = parent[_Symbol.reflection]();
        Object.getOwnPropertyNames(info).forEach(function (k) {
            var i = info[k];
            if (typeof i === "object") {
                newInfo_1[k] = Array.isArray(i)
                    ? (parentInfo_1[k] || []).concat(i)
                    : Object.assign(parentInfo_1[k] || {}, i);
            }
            else {
                newInfo_1[k] = i;
            }
        });
        return newInfo_1;
    }
    return info;
}
function hasInterface(obj, interfaceName) {
    if (interfaceName === "System.Collections.Generic.IEnumerable") {
        return typeof obj[Symbol.iterator] === "function";
    }
    else if (typeof obj[_Symbol.reflection] === "function") {
        var interfaces = obj[_Symbol.reflection]().interfaces;
        return Array.isArray(interfaces) && interfaces.indexOf(interfaceName) > -1;
    }
    return false;
}
function getPropertyNames(obj) {
    if (obj == null) {
        return [];
    }
    var propertyMap = typeof obj[_Symbol.reflection] === "function" ? obj[_Symbol.reflection]().properties || [] : obj;
    return Object.getOwnPropertyNames(propertyMap);
}

function getRestParams(args, idx) {
    for (var _len = args.length, restArgs = Array(_len > idx ? _len - idx : 0), _key = idx; _key < _len; _key++)
        restArgs[_key - idx] = args[_key];
    return restArgs;
}
function toString(o) {
    return o != null && typeof o.ToString == "function" ? o.ToString() : String(o);
}

function equals(x, y) {
    if (x === y)
        return true;
    else if (x == null)
        return y == null;
    else if (y == null)
        return false;
    else if (Object.getPrototypeOf(x) !== Object.getPrototypeOf(y))
        return false;
    else if (typeof x.Equals === "function")
        return x.Equals(y);
    else if (Array.isArray(x)) {
        if (x.length != y.length)
            return false;
        for (var i = 0; i < x.length; i++)
            if (!equals(x[i], y[i]))
                return false;
        return true;
    }
    else if (ArrayBuffer.isView(x)) {
        if (x.byteLength !== y.byteLength)
            return false;
        var dv1 = new DataView(x.buffer), dv2 = new DataView(y.buffer);
        for (var i = 0; i < x.byteLength; i++)
            if (dv1.getUint8(i) !== dv2.getUint8(i))
                return false;
        return true;
    }
    else if (x instanceof Date)
        return x.getTime() == y.getTime();
    else
        return false;
}
function compare$1(x, y) {
    if (x === y)
        return 0;
    if (x == null)
        return y == null ? 0 : -1;
    else if (y == null)
        return 1;
    else if (Object.getPrototypeOf(x) !== Object.getPrototypeOf(y))
        return -1;
    else if (typeof x.CompareTo === "function")
        return x.CompareTo(y);
    else if (Array.isArray(x)) {
        if (x.length != y.length)
            return x.length < y.length ? -1 : 1;
        for (var i = 0, j = 0; i < x.length; i++)
            if ((j = compare$1(x[i], y[i])) !== 0)
                return j;
        return 0;
    }
    else if (ArrayBuffer.isView(x)) {
        if (x.byteLength != y.byteLength)
            return x.byteLength < y.byteLength ? -1 : 1;
        var dv1 = new DataView(x.buffer), dv2 = new DataView(y.buffer);
        for (var i = 0, b1 = 0, b2 = 0; i < x.byteLength; i++) {
            b1 = dv1.getUint8(i), b2 = dv2.getUint8(i);
            if (b1 < b2)
                return -1;
            if (b1 > b2)
                return 1;
        }
        return 0;
    }
    else if (x instanceof Date)
        return compare$1(x.getTime(), y.getTime());
    else
        return x < y ? -1 : 1;
}
function equalsRecords(x, y) {
    if (x === y) {
        return true;
    }
    else {
        var keys = getPropertyNames(x);
        for (var i = 0; i < keys.length; i++) {
            if (!equals(x[keys[i]], y[keys[i]]))
                return false;
        }
        return true;
    }
}
function compareRecords(x, y) {
    if (x === y) {
        return 0;
    }
    else {
        var keys = getPropertyNames(x);
        for (var i = 0; i < keys.length; i++) {
            var res = compare$1(x[keys[i]], y[keys[i]]);
            if (res !== 0)
                return res;
        }
        return 0;
    }
}
function equalsUnions(x, y) {
    if (x === y) {
        return true;
    }
    else if (x.Case !== y.Case) {
        return false;
    }
    else {
        for (var i = 0; i < x.Fields.length; i++) {
            if (!equals(x.Fields[i], y.Fields[i]))
                return false;
        }
        return true;
    }
}
function compareUnions(x, y) {
    if (x === y) {
        return 0;
    }
    else {
        var res = compare$1(x.Case, y.Case);
        if (res !== 0)
            return res;
        for (var i = 0; i < x.Fields.length; i++) {
            res = compare$1(x.Fields[i], y.Fields[i]);
            if (res !== 0)
                return res;
        }
        return 0;
    }
}





function defaultArg(arg, defaultValue, f) {
    return arg == null ? defaultValue : (f != null ? f(arg) : arg);
}

function create(pattern, options) {
    var flags = "g";
    flags += options & 1 ? "i" : "";
    flags += options & 2 ? "m" : "";
    return new RegExp(pattern, flags);
}
function escape(str) {
    return str.replace(/[\-\[\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function isMatch(str, pattern, options) {
    if (options === void 0) { options = 0; }
    var reg = str instanceof RegExp
        ? (reg = str, str = pattern, reg.lastIndex = options, reg)
        : reg = create(pattern, options);
    return reg.test(str);
}

var Long = (function () {
    function Long(low, high, unsigned) {
        this.eq = this.equals;
        this.neq = this.notEquals;
        this.lt = this.lessThan;
        this.lte = this.lessThanOrEqual;
        this.gt = this.greaterThan;
        this.gte = this.greaterThanOrEqual;
        this.comp = this.compare;
        this.neg = this.negate;
        this.abs = this.absolute;
        this.sub = this.subtract;
        this.mul = this.multiply;
        this.div = this.divide;
        this.mod = this.modulo;
        this.shl = this.shiftLeft;
        this.shr = this.shiftRight;
        this.shru = this.shiftRightUnsigned;
        this.Equals = this.equals;
        this.CompareTo = this.compare;
        this.ToString = this.toString;
        this.low = low | 0;
        this.high = high | 0;
        this.unsigned = !!unsigned;
    }
    Long.prototype.toInt = function () {
        return this.unsigned ? this.low >>> 0 : this.low;
    };
    Long.prototype.toNumber = function () {
        if (this.unsigned)
            return ((this.high >>> 0) * TWO_PWR_32_DBL) + (this.low >>> 0);
        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    };
    Long.prototype.toString = function (radix) {
        if (radix === void 0) { radix = 10; }
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');
        if (this.isZero())
            return '0';
        if (this.isNegative()) {
            if (this.eq(MIN_VALUE)) {
                var radixLong = fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
            }
            else
                return '-' + this.neg().toString(radix);
        }
        var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
        var result = '';
        while (true) {
            var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero())
                return digits + result;
            else {
                while (digits.length < 6)
                    digits = '0' + digits;
                result = '' + digits + result;
            }
        }
    };
    Long.prototype.getHighBits = function () {
        return this.high;
    };
    Long.prototype.getHighBitsUnsigned = function () {
        return this.high >>> 0;
    };
    Long.prototype.getLowBits = function () {
        return this.low;
    };
    Long.prototype.getLowBitsUnsigned = function () {
        return this.low >>> 0;
    };
    Long.prototype.getNumBitsAbs = function () {
        if (this.isNegative())
            return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
        var val = this.high != 0 ? this.high : this.low;
        for (var bit = 31; bit > 0; bit--)
            if ((val & (1 << bit)) != 0)
                break;
        return this.high != 0 ? bit + 33 : bit + 1;
    };
    Long.prototype.isZero = function () {
        return this.high === 0 && this.low === 0;
    };
    Long.prototype.isNegative = function () {
        return !this.unsigned && this.high < 0;
    };
    Long.prototype.isPositive = function () {
        return this.unsigned || this.high >= 0;
    };
    Long.prototype.isOdd = function () {
        return (this.low & 1) === 1;
    };
    Long.prototype.isEven = function () {
        return (this.low & 1) === 0;
    };
    Long.prototype.equals = function (other) {
        if (!isLong(other))
            other = fromValue(other);
        if (this.unsigned !== other.unsigned && (this.high >>> 31) === 1 && (other.high >>> 31) === 1)
            return false;
        return this.high === other.high && this.low === other.low;
    };
    Long.prototype.notEquals = function (other) {
        return !this.eq(other);
    };
    Long.prototype.lessThan = function (other) {
        return this.comp(other) < 0;
    };
    Long.prototype.lessThanOrEqual = function (other) {
        return this.comp(other) <= 0;
    };
    Long.prototype.greaterThan = function (other) {
        return this.comp(other) > 0;
    };
    Long.prototype.greaterThanOrEqual = function (other) {
        return this.comp(other) >= 0;
    };
    Long.prototype.compare = function (other) {
        if (!isLong(other))
            other = fromValue(other);
        if (this.eq(other))
            return 0;
        var thisNeg = this.isNegative(), otherNeg = other.isNegative();
        if (thisNeg && !otherNeg)
            return -1;
        if (!thisNeg && otherNeg)
            return 1;
        if (!this.unsigned)
            return this.sub(other).isNegative() ? -1 : 1;
        return (other.high >>> 0) > (this.high >>> 0) || (other.high === this.high && (other.low >>> 0) > (this.low >>> 0)) ? -1 : 1;
    };
    Long.prototype.negate = function () {
        if (!this.unsigned && this.eq(MIN_VALUE))
            return MIN_VALUE;
        return this.not().add(ONE);
    };
    Long.prototype.absolute = function () {
        if (!this.unsigned && this.isNegative())
            return this.negate();
        else
            return this;
    };
    Long.prototype.add = function (addend) {
        if (!isLong(addend))
            addend = fromValue(addend);
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;
        var b48 = addend.high >>> 16;
        var b32 = addend.high & 0xFFFF;
        var b16 = addend.low >>> 16;
        var b00 = addend.low & 0xFFFF;
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 + b48;
        c48 &= 0xFFFF;
        return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
    };
    Long.prototype.subtract = function (subtrahend) {
        if (!isLong(subtrahend))
            subtrahend = fromValue(subtrahend);
        return this.add(subtrahend.neg());
    };
    Long.prototype.multiply = function (multiplier) {
        if (this.isZero())
            return ZERO;
        if (!isLong(multiplier))
            multiplier = fromValue(multiplier);
        if (multiplier.isZero())
            return ZERO;
        if (this.eq(MIN_VALUE))
            return multiplier.isOdd() ? MIN_VALUE : ZERO;
        if (multiplier.eq(MIN_VALUE))
            return this.isOdd() ? MIN_VALUE : ZERO;
        if (this.isNegative()) {
            if (multiplier.isNegative())
                return this.neg().mul(multiplier.neg());
            else
                return this.neg().mul(multiplier).neg();
        }
        else if (multiplier.isNegative())
            return this.mul(multiplier.neg()).neg();
        if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
            return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;
        var b48 = multiplier.high >>> 16;
        var b32 = multiplier.high & 0xFFFF;
        var b16 = multiplier.low >>> 16;
        var b00 = multiplier.low & 0xFFFF;
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 0xFFFF;
        return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
    };
    Long.prototype.divide = function (divisor) {
        if (!isLong(divisor))
            divisor = fromValue(divisor);
        if (divisor.isZero())
            throw Error('division by zero');
        if (this.isZero())
            return this.unsigned ? UZERO : ZERO;
        var approx = 0, rem = ZERO, res = ZERO;
        if (!this.unsigned) {
            if (this.eq(MIN_VALUE)) {
                if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                    return MIN_VALUE;
                else if (divisor.eq(MIN_VALUE))
                    return ONE;
                else {
                    var halfThis = this.shr(1);
                    var approx_1 = halfThis.div(divisor).shl(1);
                    if (approx_1.eq(ZERO)) {
                        return divisor.isNegative() ? ONE : NEG_ONE;
                    }
                    else {
                        rem = this.sub(divisor.mul(approx_1));
                        res = approx_1.add(rem.div(divisor));
                        return res;
                    }
                }
            }
            else if (divisor.eq(MIN_VALUE))
                return this.unsigned ? UZERO : ZERO;
            if (this.isNegative()) {
                if (divisor.isNegative())
                    return this.neg().div(divisor.neg());
                return this.neg().div(divisor).neg();
            }
            else if (divisor.isNegative())
                return this.div(divisor.neg()).neg();
            res = ZERO;
        }
        else {
            if (!divisor.unsigned)
                divisor = divisor.toUnsigned();
            if (divisor.gt(this))
                return UZERO;
            if (divisor.gt(this.shru(1)))
                return UONE;
            res = UZERO;
        }
        rem = this;
        while (rem.gte(divisor)) {
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
            var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = (log2 <= 48) ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
            }
            if (approxRes.isZero())
                approxRes = ONE;
            res = res.add(approxRes);
            rem = rem.sub(approxRem);
        }
        return res;
    };
    Long.prototype.modulo = function (divisor) {
        if (!isLong(divisor))
            divisor = fromValue(divisor);
        return this.sub(this.div(divisor).mul(divisor));
    };
    
    Long.prototype.not = function () {
        return fromBits(~this.low, ~this.high, this.unsigned);
    };
    
    Long.prototype.and = function (other) {
        if (!isLong(other))
            other = fromValue(other);
        return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
    };
    Long.prototype.or = function (other) {
        if (!isLong(other))
            other = fromValue(other);
        return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
    };
    Long.prototype.xor = function (other) {
        if (!isLong(other))
            other = fromValue(other);
        return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
    };
    Long.prototype.shiftLeft = function (numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        numBits = numBits & 63;
        if (numBits === 0)
            return this;
        else if (numBits < 32)
            return fromBits(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
        else
            return fromBits(0, this.low << (numBits - 32), this.unsigned);
    };
    Long.prototype.shiftRight = function (numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        numBits = numBits & 63;
        if (numBits === 0)
            return this;
        else if (numBits < 32)
            return fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits, this.unsigned);
        else
            return fromBits(this.high >> (numBits - 32), this.high >= 0 ? 0 : -1, this.unsigned);
    };
    Long.prototype.shiftRightUnsigned = function (numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        numBits = numBits & 63;
        if (numBits === 0)
            return this;
        else {
            var high = this.high;
            if (numBits < 32) {
                var low = this.low;
                return fromBits((low >>> numBits) | (high << (32 - numBits)), high >>> numBits, this.unsigned);
            }
            else if (numBits === 32)
                return fromBits(high, 0, this.unsigned);
            else
                return fromBits(high >>> (numBits - 32), 0, this.unsigned);
        }
    };
    Long.prototype.toSigned = function () {
        if (!this.unsigned)
            return this;
        return fromBits(this.low, this.high, false);
    };
    Long.prototype.toUnsigned = function () {
        if (this.unsigned)
            return this;
        return fromBits(this.low, this.high, true);
    };
    Long.prototype.toBytes = function (le) {
        return le ? this.toBytesLE() : this.toBytesBE();
    };
    Long.prototype.toBytesLE = function () {
        var hi = this.high, lo = this.low;
        return [
            lo & 0xff,
            (lo >>> 8) & 0xff,
            (lo >>> 16) & 0xff,
            (lo >>> 24) & 0xff,
            hi & 0xff,
            (hi >>> 8) & 0xff,
            (hi >>> 16) & 0xff,
            (hi >>> 24) & 0xff
        ];
    };
    Long.prototype.toBytesBE = function () {
        var hi = this.high, lo = this.low;
        return [
            (hi >>> 24) & 0xff,
            (hi >>> 16) & 0xff,
            (hi >>> 8) & 0xff,
            hi & 0xff,
            (lo >>> 24) & 0xff,
            (lo >>> 16) & 0xff,
            (lo >>> 8) & 0xff,
            lo & 0xff
        ];
    };
    Long.prototype[_Symbol.reflection] = function () {
        return {
            type: "System.Int64",
            interfaces: ["FSharpRecord", "System.IComparable"],
            properties: {
                low: "number",
                high: "number",
                unsigned: "boolean"
            }
        };
    };
    return Long;
}());
var INT_CACHE = {};
var UINT_CACHE = {};
function isLong(obj) {
    return (obj && obj instanceof Long);
}
function fromInt(value, unsigned) {
    if (unsigned === void 0) { unsigned = false; }
    var obj, cachedObj, cache;
    if (unsigned) {
        value >>>= 0;
        if (cache = (0 <= value && value < 256)) {
            cachedObj = UINT_CACHE[value];
            if (cachedObj)
                return cachedObj;
        }
        obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
        if (cache)
            UINT_CACHE[value] = obj;
        return obj;
    }
    else {
        value |= 0;
        if (cache = (-128 <= value && value < 128)) {
            cachedObj = INT_CACHE[value];
            if (cachedObj)
                return cachedObj;
        }
        obj = fromBits(value, value < 0 ? -1 : 0, false);
        if (cache)
            INT_CACHE[value] = obj;
        return obj;
    }
}
function fromNumber(value, unsigned) {
    if (unsigned === void 0) { unsigned = false; }
    if (isNaN(value) || !isFinite(value))
        return unsigned ? UZERO : ZERO;
    if (unsigned) {
        if (value < 0)
            return UZERO;
        if (value >= TWO_PWR_64_DBL)
            return MAX_UNSIGNED_VALUE;
    }
    else {
        if (value <= -TWO_PWR_63_DBL)
            return MIN_VALUE;
        if (value + 1 >= TWO_PWR_63_DBL)
            return MAX_VALUE;
    }
    if (value < 0)
        return fromNumber(-value, unsigned).neg();
    return fromBits((value % TWO_PWR_32_DBL) | 0, (value / TWO_PWR_32_DBL) | 0, unsigned);
}
function fromBits(lowBits, highBits, unsigned) {
    return new Long(lowBits, highBits, unsigned);
}
var pow_dbl = Math.pow;
function fromString(str, unsigned, radix) {
    if (unsigned === void 0) { unsigned = false; }
    if (radix === void 0) { radix = 10; }
    if (str.length === 0)
        throw Error('empty string');
    if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
        return ZERO;
    if (typeof unsigned === 'number') {
        radix = unsigned,
            unsigned = false;
    }
    else {
        unsigned = !!unsigned;
    }
    radix = radix || 10;
    if (radix < 2 || 36 < radix)
        throw RangeError('radix');
    var p = str.indexOf('-');
    if (p > 0)
        throw Error('interior hyphen');
    else if (p === 0) {
        return fromString(str.substring(1), unsigned, radix).neg();
    }
    var radixToPower = fromNumber(pow_dbl(radix, 8));
    var result = ZERO;
    for (var i = 0; i < str.length; i += 8) {
        var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
        if (size < 8) {
            var power = fromNumber(pow_dbl(radix, size));
            result = result.mul(power).add(fromNumber(value));
        }
        else {
            result = result.mul(radixToPower);
            result = result.add(fromNumber(value));
        }
    }
    result.unsigned = unsigned;
    return result;
}
function fromValue(val) {
    if (val instanceof Long)
        return val;
    if (typeof val === 'number')
        return fromNumber(val);
    if (typeof val === 'string')
        return fromString(val);
    return fromBits(val.low, val.high, val.unsigned);
}
var TWO_PWR_16_DBL = 1 << 16;
var TWO_PWR_24_DBL = 1 << 24;
var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
var ZERO = fromInt(0);
var UZERO = fromInt(0, true);
var ONE = fromInt(1);
var UONE = fromInt(1, true);
var NEG_ONE = fromInt(-1);
var MAX_VALUE = fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0, false);
var MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF | 0, 0xFFFFFFFF | 0, true);
var MIN_VALUE = fromBits(0, 0x80000000 | 0, false);

function minValue() {
    return parse(-8640000000000000, 1);
}

function parse(v, kind) {
    if (kind == null) {
        kind = typeof v == "string" && v.slice(-1) == "Z" ? 1 : 2;
    }
    var date = (v == null) ? new Date() : new Date(v);
    if (kind === 2) {
        date.kind = kind;
    }
    if (isNaN(date.getTime())) {
        throw new Error("The string is not a valid Date.");
    }
    return date;
}
function tryParse(v) {
    try {
        return [true, parse(v)];
    }
    catch (_err) {
        return [false, minValue()];
    }
}
function create$1(year, month, day, h, m, s, ms, kind) {
    if (h === void 0) { h = 0; }
    if (m === void 0) { m = 0; }
    if (s === void 0) { s = 0; }
    if (ms === void 0) { ms = 0; }
    if (kind === void 0) { kind = 2; }
    var date;
    if (kind === 2) {
        date = new Date(year, month - 1, day, h, m, s, ms);
        date.kind = kind;
    }
    else {
        date = new Date(Date.UTC(year, month - 1, day, h, m, s, ms));
    }
    if (isNaN(date.getTime())) {
        throw new Error("The parameters describe an unrepresentable Date.");
    }
    return date;
}
function now() {
    return parse();
}

function today() {
    return date(now());
}
function isLeapYear(year) {
    return year % 4 == 0 && year % 100 != 0 || year % 400 == 0;
}
function daysInMonth(year, month) {
    return month == 2
        ? isLeapYear(year) ? 29 : 28
        : month >= 8 ? month % 2 == 0 ? 31 : 30 : month % 2 == 0 ? 30 : 31;
}



function date(d) {
    return create$1(year(d), month(d), day(d), 0, 0, 0, 0, d.kind || 1);
}

function day(d) {
    return d.kind === 2 ? d.getDate() : d.getUTCDate();
}
function hour(d) {
    return d.kind === 2 ? d.getHours() : d.getUTCHours();
}
function millisecond(d) {
    return d.kind === 2 ? d.getMilliseconds() : d.getUTCMilliseconds();
}
function minute(d) {
    return d.kind === 2 ? d.getMinutes() : d.getUTCMinutes();
}
function month(d) {
    return (d.kind === 2 ? d.getMonth() : d.getUTCMonth()) + 1;
}
function second(d) {
    return d.kind === 2 ? d.getSeconds() : d.getUTCSeconds();
}
function year(d) {
    return d.kind === 2 ? d.getFullYear() : d.getUTCFullYear();
}





function addDays(d, v) {
    return parse(d.getTime() + v * 86400000, d.kind || 1);
}





function addYears(d, v) {
    var newMonth = month(d);
    var newYear = year(d) + v;
    var _daysInMonth = daysInMonth(newYear, newMonth);
    var newDay = Math.min(_daysInMonth, day(d));
    return create$1(newYear, newMonth, newDay, hour(d), minute(d), second(d), millisecond(d), d.kind || 1);
}



function toShortDateString(d) {
    return d.toLocaleDateString();
}

var fsFormatRegExp = /(^|[^%])%([0+ ]*)(-?\d+)?(?:\.(\d+))?(\w)/;



function toHex(value) {
    return value < 0
        ? "ff" + (16777215 - (Math.abs(value) - 1)).toString(16)
        : value.toString(16);
}
function fsFormat(str) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var _cont;
    function isObject(x) {
        return x !== null && typeof x === "object" && !(x instanceof Number) && !(x instanceof String) && !(x instanceof Boolean);
    }
    function formatOnce(str, rep) {
        return str.replace(fsFormatRegExp, function (_, prefix, flags, pad, precision, format) {
            switch (format) {
                case "f":
                case "F":
                    rep = rep.toFixed(precision || 6);
                    break;
                case "g":
                case "G":
                    rep = rep.toPrecision(precision);
                    break;
                case "e":
                case "E":
                    rep = rep.toExponential(precision);
                    break;
                case "O":
                    rep = toString(rep);
                    break;
                case "A":
                    try {
                        rep = JSON.stringify(rep, function (k, v) {
                            return v && v[Symbol.iterator] && !Array.isArray(v) && isObject(v) ? Array.from(v)
                                : v && typeof v.ToString === "function" ? toString(v) : v;
                        });
                    }
                    catch (err) {
                        rep = "{" + Object.getOwnPropertyNames(rep).map(function (k) { return k + ": " + String(rep[k]); }).join(", ") + "}";
                    }
                    break;
                case "x":
                    rep = toHex(Number(rep));
                    break;
                case "X":
                    rep = toHex(Number(rep)).toUpperCase();
                    break;
            }
            var plusPrefix = flags.indexOf("+") >= 0 && parseInt(rep) >= 0;
            if (!isNaN(pad = parseInt(pad))) {
                var ch = pad >= 0 && flags.indexOf("0") >= 0 ? "0" : " ";
                rep = padLeft(rep, Math.abs(pad) - (plusPrefix ? 1 : 0), ch, pad < 0);
            }
            var once = prefix + (plusPrefix ? "+" + rep : rep);
            return once.replace(/%/g, "%%");
        });
    }
    function makeFn(str) {
        return function (rep) {
            var str2 = formatOnce(str, rep);
            return fsFormatRegExp.test(str2)
                ? makeFn(str2) : _cont(str2.replace(/%%/g, "%"));
        };
    }
    if (args.length === 0) {
        return function (cont) {
            _cont = cont;
            return fsFormatRegExp.test(str) ? makeFn(str) : _cont(str);
        };
    }
    else {
        for (var i = 0; i < args.length; i++) {
            str = formatOnce(str, args[i]);
        }
        return str.replace(/%%/g, "%");
    }
}






function join(delimiter, xs) {
    xs = typeof xs == "string" ? getRestParams(arguments, 1) : xs;
    return (Array.isArray(xs) ? xs : Array.from(xs)).join(delimiter);
}

function padLeft(str, len, ch, isRight) {
    ch = ch || " ";
    str = String(str);
    len = len - str.length;
    for (var i = -1; ++i < len;)
        str = isRight ? str + ch : ch + str;
    return str;
}


function replace$$1(str, search, replace$$1) {
    return str.replace(new RegExp(escape(search), "g"), replace$$1);
}

function split$$1(str, splitters, count, removeEmpty) {
    count = typeof count == "number" ? count : null;
    removeEmpty = typeof removeEmpty == "number" ? removeEmpty : null;
    if (count < 0)
        throw new Error("Count cannot be less than zero");
    if (count === 0)
        return [];
    splitters = Array.isArray(splitters) ? splitters : getRestParams(arguments, 1);
    splitters = splitters.map(function (x) { return escape(x); });
    splitters = splitters.length > 0 ? splitters : [" "];
    var m;
    var i = 0;
    var splits = [];
    var reg = new RegExp(splitters.join("|"), "g");
    while ((count == null || count > 1) && (m = reg.exec(str)) !== null) {
        if (!removeEmpty || (m.index - i) > 0) {
            count = count != null ? count - 1 : count;
            splits.push(str.substring(i, m.index));
        }
        i = reg.lastIndex;
    }
    if (!removeEmpty || (str.length - i) > 0)
        splits.push(str.substring(i));
    return splits;
}

function ofArray(args, base) {
    var acc = base || new List$1();
    for (var i = args.length - 1; i >= 0; i--) {
        acc = new List$1(args[i], acc);
    }
    return acc;
}
var List$1 = (function () {
    function List(head, tail) {
        this.head = head;
        this.tail = tail;
    }
    List.prototype.ToString = function () {
        return "[" + Array.from(this).map(toString).join("; ") + "]";
    };
    List.prototype.Equals = function (x) {
        if (this === x) {
            return true;
        }
        else {
            var iter1 = this[Symbol.iterator](), iter2 = x[Symbol.iterator]();
            for (;;) {
                var cur1 = iter1.next(), cur2 = iter2.next();
                if (cur1.done)
                    return cur2.done ? true : false;
                else if (cur2.done)
                    return false;
                else if (!equals(cur1.value, cur2.value))
                    return false;
            }
        }
    };
    List.prototype.CompareTo = function (x) {
        if (this === x) {
            return 0;
        }
        else {
            var acc = 0;
            var iter1 = this[Symbol.iterator](), iter2 = x[Symbol.iterator]();
            for (;;) {
                var cur1 = iter1.next(), cur2 = iter2.next();
                if (cur1.done)
                    return cur2.done ? acc : -1;
                else if (cur2.done)
                    return 1;
                else {
                    acc = compare$1(cur1.value, cur2.value);
                    if (acc != 0)
                        return acc;
                }
            }
        }
    };
    Object.defineProperty(List.prototype, "length", {
        get: function () {
            var cur = this, acc = 0;
            while (cur.tail != null) {
                cur = cur.tail;
                acc++;
            }
            return acc;
        },
        enumerable: true,
        configurable: true
    });
    List.prototype[Symbol.iterator] = function () {
        var cur = this;
        return {
            next: function () {
                var tmp = cur;
                cur = cur.tail;
                return { done: tmp.tail == null, value: tmp.head };
            }
        };
    };
    List.prototype[_Symbol.reflection] = function () {
        return {
            type: "Microsoft.FSharp.Collections.FSharpList",
            interfaces: ["System.IEquatable", "System.IComparable"]
        };
    };
    return List;
}());

var Enumerator = (function () {
    function Enumerator(iter) {
        this.iter = iter;
    }
    Enumerator.prototype.MoveNext = function () {
        var cur = this.iter.next();
        this.current = cur.value;
        return !cur.done;
    };
    Object.defineProperty(Enumerator.prototype, "Current", {
        get: function () {
            return this.current;
        },
        enumerable: true,
        configurable: true
    });
    Enumerator.prototype.Reset = function () {
        throw new Error("JS iterators cannot be reset");
    };
    Enumerator.prototype.Dispose = function () { };
    return Enumerator;
}());
function getEnumerator(o) {
    return typeof o.GetEnumerator === "function"
        ? o.GetEnumerator() : new Enumerator(o[Symbol.iterator]());
}

function toList(xs) {
    return foldBack(function (x, acc) {
        return new List$1(x, acc);
    }, xs, new List$1());
}





function concat$1(xs) {
    return delay(function () {
        var iter = xs[Symbol.iterator]();
        var output = null;
        return unfold(function (innerIter) {
            var hasFinished = false;
            while (!hasFinished) {
                if (innerIter == null) {
                    var cur = iter.next();
                    if (!cur.done) {
                        innerIter = cur.value[Symbol.iterator]();
                    }
                    else {
                        hasFinished = true;
                    }
                }
                else {
                    var cur = innerIter.next();
                    if (!cur.done) {
                        output = cur.value;
                        hasFinished = true;
                    }
                    else {
                        innerIter = null;
                    }
                }
            }
            return innerIter != null && output != null ? [output, innerIter] : null;
        }, null);
    });
}
function collect$1(f, xs) {
    return concat$1(map$1(f, xs));
}
function choose$1(f, xs) {
    var trySkipToNext = function (iter) {
        var cur = iter.next();
        if (!cur.done) {
            var y = f(cur.value);
            return y != null ? [y, iter] : trySkipToNext(iter);
        }
        return void 0;
    };
    return delay(function () {
        return unfold(function (iter) {
            return trySkipToNext(iter);
        }, xs[Symbol.iterator]());
    });
}
function compareWith(f, xs, ys) {
    var nonZero = tryFind(function (i) { return i != 0; }, map2(function (x, y) { return f(x, y); }, xs, ys));
    return nonZero != null ? nonZero : count(xs) - count(ys);
}
function delay(f) {
    return _a = {},
        _a[Symbol.iterator] = function () { return f()[Symbol.iterator](); },
        _a;
    var _a;
}
function empty() {
    return unfold(function () { return void 0; });
}





function exists(f, xs) {
    function aux(iter) {
        var cur = iter.next();
        return !cur.done && (f(cur.value) || aux(iter));
    }
    return aux(xs[Symbol.iterator]());
}

function filter$1(f, xs) {
    function trySkipToNext(iter) {
        var cur = iter.next();
        while (!cur.done) {
            if (f(cur.value)) {
                return [cur.value, iter];
            }
            cur = iter.next();
        }
        return void 0;
    }
    return delay(function () { return unfold(trySkipToNext, xs[Symbol.iterator]()); });
}

function fold(f, acc, xs) {
    if (Array.isArray(xs) || ArrayBuffer.isView(xs)) {
        return xs.reduce(f, acc);
    }
    else {
        var cur = void 0;
        for (var i = 0, iter = xs[Symbol.iterator]();; i++) {
            cur = iter.next();
            if (cur.done)
                break;
            acc = f(acc, cur.value, i);
        }
        return acc;
    }
}
function foldBack(f, xs, acc) {
    var arr = Array.isArray(xs) || ArrayBuffer.isView(xs) ? xs : Array.from(xs);
    for (var i = arr.length - 1; i >= 0; i--) {
        acc = f(arr[i], acc, i);
    }
    return acc;
}










function iterate(f, xs) {
    fold(function (_, x) { return f(x); }, null, xs);
}



function isEmpty(xs) {
    var i = xs[Symbol.iterator]();
    return i.next().done;
}


function count(xs) {
    return Array.isArray(xs) || ArrayBuffer.isView(xs)
        ? xs.length
        : fold(function (acc, x) { return acc + 1; }, 0, xs);
}
function map$1(f, xs) {
    return delay(function () { return unfold(function (iter) {
        var cur = iter.next();
        return !cur.done ? [f(cur.value), iter] : null;
    }, xs[Symbol.iterator]()); });
}

function map2(f, xs, ys) {
    return delay(function () {
        var iter1 = xs[Symbol.iterator]();
        var iter2 = ys[Symbol.iterator]();
        return unfold(function () {
            var cur1 = iter1.next(), cur2 = iter2.next();
            return !cur1.done && !cur2.done ? [f(cur1.value, cur2.value), null] : null;
        });
    });
}


















function scan(f, seed, xs) {
    return delay(function () {
        var iter = xs[Symbol.iterator]();
        return unfold(function (acc) {
            if (acc == null)
                return [seed, seed];
            var cur = iter.next();
            if (!cur.done) {
                acc = f(acc, cur.value);
                return [acc, acc];
            }
            return void 0;
        }, null);
    });
}











function tryFind(f, xs, defaultValue) {
    for (var i = 0, iter = xs[Symbol.iterator]();; i++) {
        var cur = iter.next();
        if (cur.done)
            return defaultValue === void 0 ? null : defaultValue;
        if (f(cur.value, i))
            return cur.value;
    }
}









function unfold(f, acc) {
    return _a = {},
        _a[Symbol.iterator] = function () {
            return {
                next: function () {
                    var res = f(acc);
                    if (res != null) {
                        acc = res[1];
                        return { done: false, value: res[0] };
                    }
                    return { done: true };
                }
            };
        },
        _a;
    var _a;
}

var GenericComparer = (function () {
    function GenericComparer(f) {
        this.Compare = f || compare$1;
    }
    GenericComparer.prototype[_Symbol.reflection] = function () {
        return { interfaces: ["System.IComparer"] };
    };
    return GenericComparer;
}());

var MapTree = (function () {
    function MapTree(caseName, fields) {
        this.Case = caseName;
        this.Fields = fields;
    }
    return MapTree;
}());
function tree_sizeAux(acc, m) {
    return m.Case === "MapOne"
        ? acc + 1
        : m.Case === "MapNode"
            ? tree_sizeAux(tree_sizeAux(acc + 1, m.Fields[2]), m.Fields[3])
            : acc;
}
function tree_size(x) {
    return tree_sizeAux(0, x);
}
function tree_empty() {
    return new MapTree("MapEmpty", []);
}
function tree_height(_arg1) {
    return _arg1.Case === "MapOne" ? 1 : _arg1.Case === "MapNode" ? _arg1.Fields[4] : 0;
}
function tree_mk(l, k, v, r) {
    var matchValue = [l, r];
    var $target1 = function () {
        var hl = tree_height(l);
        var hr = tree_height(r);
        var m = hl < hr ? hr : hl;
        return new MapTree("MapNode", [k, v, l, r, m + 1]);
    };
    if (matchValue[0].Case === "MapEmpty") {
        if (matchValue[1].Case === "MapEmpty") {
            return new MapTree("MapOne", [k, v]);
        }
        else {
            return $target1();
        }
    }
    else {
        return $target1();
    }
}

function tree_rebalance(t1, k, v, t2) {
    var t1h = tree_height(t1);
    var t2h = tree_height(t2);
    if (t2h > t1h + 2) {
        if (t2.Case === "MapNode") {
            if (tree_height(t2.Fields[2]) > t1h + 1) {
                if (t2.Fields[2].Case === "MapNode") {
                    return tree_mk(tree_mk(t1, k, v, t2.Fields[2].Fields[2]), t2.Fields[2].Fields[0], t2.Fields[2].Fields[1], tree_mk(t2.Fields[2].Fields[3], t2.Fields[0], t2.Fields[1], t2.Fields[3]));
                }
                else {
                    throw new Error("rebalance");
                }
            }
            else {
                return tree_mk(tree_mk(t1, k, v, t2.Fields[2]), t2.Fields[0], t2.Fields[1], t2.Fields[3]);
            }
        }
        else {
            throw new Error("rebalance");
        }
    }
    else {
        if (t1h > t2h + 2) {
            if (t1.Case === "MapNode") {
                if (tree_height(t1.Fields[3]) > t2h + 1) {
                    if (t1.Fields[3].Case === "MapNode") {
                        return tree_mk(tree_mk(t1.Fields[2], t1.Fields[0], t1.Fields[1], t1.Fields[3].Fields[2]), t1.Fields[3].Fields[0], t1.Fields[3].Fields[1], tree_mk(t1.Fields[3].Fields[3], k, v, t2));
                    }
                    else {
                        throw new Error("rebalance");
                    }
                }
                else {
                    return tree_mk(t1.Fields[2], t1.Fields[0], t1.Fields[1], tree_mk(t1.Fields[3], k, v, t2));
                }
            }
            else {
                throw new Error("rebalance");
            }
        }
        else {
            return tree_mk(t1, k, v, t2);
        }
    }
}
function tree_add(comparer, k, v, m) {
    if (m.Case === "MapOne") {
        var c = comparer.Compare(k, m.Fields[0]);
        if (c < 0) {
            return new MapTree("MapNode", [k, v, new MapTree("MapEmpty", []), m, 2]);
        }
        else if (c === 0) {
            return new MapTree("MapOne", [k, v]);
        }
        return new MapTree("MapNode", [k, v, m, new MapTree("MapEmpty", []), 2]);
    }
    else if (m.Case === "MapNode") {
        var c = comparer.Compare(k, m.Fields[0]);
        if (c < 0) {
            return tree_rebalance(tree_add(comparer, k, v, m.Fields[2]), m.Fields[0], m.Fields[1], m.Fields[3]);
        }
        else if (c === 0) {
            return new MapTree("MapNode", [k, v, m.Fields[2], m.Fields[3], m.Fields[4]]);
        }
        return tree_rebalance(m.Fields[2], m.Fields[0], m.Fields[1], tree_add(comparer, k, v, m.Fields[3]));
    }
    return new MapTree("MapOne", [k, v]);
}
function tree_find(comparer, k, m) {
    var res = tree_tryFind(comparer, k, m);
    if (res != null)
        return res;
    throw new Error("key not found");
}
function tree_tryFind(comparer, k, m) {
    if (m.Case === "MapOne") {
        var c = comparer.Compare(k, m.Fields[0]);
        return c === 0 ? m.Fields[1] : null;
    }
    else if (m.Case === "MapNode") {
        var c = comparer.Compare(k, m.Fields[0]);
        if (c < 0) {
            return tree_tryFind(comparer, k, m.Fields[2]);
        }
        else {
            if (c === 0) {
                return m.Fields[1];
            }
            else {
                return tree_tryFind(comparer, k, m.Fields[3]);
            }
        }
    }
    return null;
}
function tree_mem(comparer, k, m) {
    if (m.Case === "MapOne") {
        return comparer.Compare(k, m.Fields[0]) === 0;
    }
    else if (m.Case === "MapNode") {
        var c = comparer.Compare(k, m.Fields[0]);
        if (c < 0) {
            return tree_mem(comparer, k, m.Fields[2]);
        }
        else {
            if (c === 0) {
                return true;
            }
            else {
                return tree_mem(comparer, k, m.Fields[3]);
            }
        }
    }
    else {
        return false;
    }
}
function tree_mkFromEnumerator(comparer, acc, e) {
    var cur = e.next();
    while (!cur.done) {
        acc = tree_add(comparer, cur.value[0], cur.value[1], acc);
        cur = e.next();
    }
    return acc;
}
function tree_ofSeq(comparer, c) {
    var ie = c[Symbol.iterator]();
    return tree_mkFromEnumerator(comparer, tree_empty(), ie);
}
function tree_collapseLHS(stack) {
    if (stack.tail != null) {
        if (stack.head.Case === "MapOne") {
            return stack;
        }
        else if (stack.head.Case === "MapNode") {
            return tree_collapseLHS(ofArray([
                stack.head.Fields[2],
                new MapTree("MapOne", [stack.head.Fields[0], stack.head.Fields[1]]),
                stack.head.Fields[3]
            ], stack.tail));
        }
        else {
            return tree_collapseLHS(stack.tail);
        }
    }
    else {
        return new List$1();
    }
}
function tree_mkIterator(s) {
    return { stack: tree_collapseLHS(new List$1(s, new List$1())), started: false };
}
function tree_moveNext(i) {
    function current(i) {
        if (i.stack.tail == null) {
            return null;
        }
        else if (i.stack.head.Case === "MapOne") {
            return [i.stack.head.Fields[0], i.stack.head.Fields[1]];
        }
        throw new Error("Please report error: Map iterator, unexpected stack for current");
    }
    if (i.started) {
        if (i.stack.tail == null) {
            return { done: true, value: null };
        }
        else {
            if (i.stack.head.Case === "MapOne") {
                i.stack = tree_collapseLHS(i.stack.tail);
                return {
                    done: i.stack.tail == null,
                    value: current(i)
                };
            }
            else {
                throw new Error("Please report error: Map iterator, unexpected stack for moveNext");
            }
        }
    }
    else {
        i.started = true;
        return {
            done: i.stack.tail == null,
            value: current(i)
        };
    }
    
}
var FableMap = (function () {
    function FableMap() {
    }
    FableMap.prototype.ToString = function () {
        return "map [" + Array.from(this).map(toString).join("; ") + "]";
    };
    FableMap.prototype.Equals = function (m2) {
        return this.CompareTo(m2) === 0;
    };
    FableMap.prototype.CompareTo = function (m2) {
        var _this = this;
        return this === m2 ? 0 : compareWith(function (kvp1, kvp2) {
            var c = _this.comparer.Compare(kvp1[0], kvp2[0]);
            return c !== 0 ? c : compare$1(kvp1[1], kvp2[1]);
        }, this, m2);
    };
    FableMap.prototype[Symbol.iterator] = function () {
        var i = tree_mkIterator(this.tree);
        return {
            next: function () { return tree_moveNext(i); }
        };
    };
    FableMap.prototype.entries = function () {
        return this[Symbol.iterator]();
    };
    FableMap.prototype.keys = function () {
        return map$1(function (kv) { return kv[0]; }, this);
    };
    FableMap.prototype.values = function () {
        return map$1(function (kv) { return kv[1]; }, this);
    };
    FableMap.prototype.get = function (k) {
        return tree_find(this.comparer, k, this.tree);
    };
    FableMap.prototype.has = function (k) {
        return tree_mem(this.comparer, k, this.tree);
    };
    FableMap.prototype.set = function (k, v) {
        throw new Error("not supported");
    };
    FableMap.prototype.delete = function (k) {
        throw new Error("not supported");
    };
    FableMap.prototype.clear = function () {
        throw new Error("not supported");
    };
    Object.defineProperty(FableMap.prototype, "size", {
        get: function () {
            return tree_size(this.tree);
        },
        enumerable: true,
        configurable: true
    });
    FableMap.prototype[_Symbol.reflection] = function () {
        return {
            type: "Microsoft.FSharp.Collections.FSharpMap",
            interfaces: ["System.IEquatable", "System.IComparable", "System.Collections.Generic.IDictionary"]
        };
    };
    return FableMap;
}());
function from(comparer, tree) {
    var map$$1 = new FableMap();
    map$$1.tree = tree;
    map$$1.comparer = comparer || new GenericComparer();
    return map$$1;
}
function create$3(ie, comparer) {
    comparer = comparer || new GenericComparer();
    return from(comparer, ie ? tree_ofSeq(comparer, ie) : tree_empty());
}

function append$$1(xs, ys) {
    return fold(function (acc, x) { return new List$1(x, acc); }, ys, reverse$$1(xs));
}
function choose$$1(f, xs) {
    var r = fold(function (acc, x) {
        var y = f(x);
        return y != null ? new List$1(y, acc) : acc;
    }, new List$1(), xs);
    return reverse$$1(r);
}
function collect$$1(f, xs) {
    return fold(function (acc, x) { return append$$1(acc, f(x)); }, new List$1(), xs);
}




function map$$1(f, xs) {
    return reverse$$1(fold(function (acc, x) { return new List$1(f(x), acc); }, new List$1(), xs));
}



function reverse$$1(xs) {
    return fold(function (acc, x) { return new List$1(x, acc); }, new List$1(), xs);
}

var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QueryRequestType = function () {
  function QueryRequestType(username) {
    _classCallCheck$1(this, QueryRequestType);

    this.Username = username;
  }

  _createClass$1(QueryRequestType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.InTake.Core.BriefsQueueScreen.QueryRequestType",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          Username: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return QueryRequestType;
}();
setType("Lr.InTake.Core.BriefsQueueScreen.QueryRequestType", QueryRequestType);
var QueryType = function () {
  function QueryType(submittedByOfficer, inProcess, incomplete, recommendedApproval, recommendedDenial) {
    _classCallCheck$1(this, QueryType);

    this.SubmittedByOfficer = submittedByOfficer;
    this.InProcess = inProcess;
    this.Incomplete = incomplete;
    this.RecommendedApproval = recommendedApproval;
    this.RecommendedDenial = recommendedDenial;
  }

  _createClass$1(QueryType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.InTake.Core.BriefsQueueScreen.QueryType",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          SubmittedByOfficer: Interface("System.Collections.Generic.IEnumerable"),
          InProcess: Interface("System.Collections.Generic.IEnumerable"),
          Incomplete: Interface("System.Collections.Generic.IEnumerable"),
          RecommendedApproval: Interface("System.Collections.Generic.IEnumerable"),
          RecommendedDenial: Interface("System.Collections.Generic.IEnumerable")
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }]);

  return QueryType;
}();
setType("Lr.InTake.Core.BriefsQueueScreen.QueryType", QueryType);
var EmptyQuery = new QueryType(new List$1(), new List$1(), new List$1(), new List$1(), new List$1());

var _createClass$2 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PrimitiveTypes = function () {
  function PrimitiveTypes(caseName, fields) {
    _classCallCheck$2(this, PrimitiveTypes);

    this.Case = caseName;
    this.Fields = fields;
  }

  _createClass$2(PrimitiveTypes, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.PrimitiveTypes",
        interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
        cases: {
          Binary: [],
          Date: [],
          DateTime: [],
          Decimal: [],
          Integer: [],
          String: []
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsUnions(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareUnions(this, other);
    }
  }]);

  return PrimitiveTypes;
}();
setType("FsCommons.Core.PrimitiveTypes", PrimitiveTypes);
var CommonDataRequirementsString = function () {
  function CommonDataRequirementsString(size, primitiveType, minSize) {
    _classCallCheck$2(this, CommonDataRequirementsString);

    this.Size = size;
    this.PrimitiveType = primitiveType;
    this.MinSize = minSize;
  }

  _createClass$2(CommonDataRequirementsString, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.CommonDataRequirementsString",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          Size: "number",
          PrimitiveType: PrimitiveTypes,
          MinSize: "number"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return CommonDataRequirementsString;
}();
setType("FsCommons.Core.CommonDataRequirementsString", CommonDataRequirementsString);
var CommonDataRequirementsStringPattern = function () {
  function CommonDataRequirementsStringPattern(size, primitiveType, minSize, regexPattern, charValidation) {
    _classCallCheck$2(this, CommonDataRequirementsStringPattern);

    this.Size = size;
    this.PrimitiveType = primitiveType;
    this.MinSize = minSize;
    this.RegexPattern = regexPattern;
    this.CharValidation = charValidation;
  }

  _createClass$2(CommonDataRequirementsStringPattern, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.CommonDataRequirementsStringPattern",
        interfaces: ["FSharpRecord"],
        properties: {
          Size: "number",
          PrimitiveType: PrimitiveTypes,
          MinSize: "number",
          RegexPattern: RegExp,
          CharValidation: "function"
        }
      };
    }
  }]);

  return CommonDataRequirementsStringPattern;
}();
setType("FsCommons.Core.CommonDataRequirementsStringPattern", CommonDataRequirementsStringPattern);
var CommonDataRequirementsInt = function () {
  function CommonDataRequirementsInt(primitiveType, minValue, maxValue) {
    _classCallCheck$2(this, CommonDataRequirementsInt);

    this.PrimitiveType = primitiveType;
    this.MinValue = minValue;
    this.MaxValue = maxValue;
  }

  _createClass$2(CommonDataRequirementsInt, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.CommonDataRequirementsInt",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          PrimitiveType: PrimitiveTypes,
          MinValue: "number",
          MaxValue: "number"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return CommonDataRequirementsInt;
}();
setType("FsCommons.Core.CommonDataRequirementsInt", CommonDataRequirementsInt);
var CommonDataRequirementsDecimal = function () {
  function CommonDataRequirementsDecimal(size, precision, primitiveType, minValue, maxValue) {
    _classCallCheck$2(this, CommonDataRequirementsDecimal);

    this.Size = size;
    this.Precision = precision;
    this.PrimitiveType = primitiveType;
    this.MinValue = minValue;
    this.MaxValue = maxValue;
  }

  _createClass$2(CommonDataRequirementsDecimal, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.CommonDataRequirementsDecimal",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          Size: "number",
          Precision: "number",
          PrimitiveType: PrimitiveTypes,
          MinValue: "number",
          MaxValue: "number"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return CommonDataRequirementsDecimal;
}();
setType("FsCommons.Core.CommonDataRequirementsDecimal", CommonDataRequirementsDecimal);
var CommonDataRequirementsDate = function () {
  function CommonDataRequirementsDate(primitiveType, minValue, maxValue) {
    _classCallCheck$2(this, CommonDataRequirementsDate);

    this.PrimitiveType = primitiveType;
    this.MinValue = minValue;
    this.MaxValue = maxValue;
  }

  _createClass$2(CommonDataRequirementsDate, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.CommonDataRequirementsDate",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          PrimitiveType: PrimitiveTypes,
          MinValue: Date,
          MaxValue: Date
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return CommonDataRequirementsDate;
}();
setType("FsCommons.Core.CommonDataRequirementsDate", CommonDataRequirementsDate);
var CommonDataRequirements = function () {
  function CommonDataRequirements(caseName, fields) {
    _classCallCheck$2(this, CommonDataRequirements);

    this.Case = caseName;
    this.Fields = fields;
  }

  _createClass$2(CommonDataRequirements, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.CommonDataRequirements",
        interfaces: ["FSharpUnion"],
        cases: {
          CommonDataRequirementsDate: [CommonDataRequirementsDate],
          CommonDataRequirementsDecimal: [CommonDataRequirementsDecimal],
          CommonDataRequirementsInt: [CommonDataRequirementsInt],
          CommonDataRequirementsString: [CommonDataRequirementsString],
          CommonDataRequirementsStringPattern: [CommonDataRequirementsStringPattern]
        }
      };
    }
  }]);

  return CommonDataRequirements;
}();
setType("FsCommons.Core.CommonDataRequirements", CommonDataRequirements);
var SummaryError = function () {
  function SummaryError(errorCode, description) {
    _classCallCheck$2(this, SummaryError);

    this.ErrorCode = errorCode;
    this.Description = description;
  }

  _createClass$2(SummaryError, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.SummaryError",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          ErrorCode: "string",
          Description: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return SummaryError;
}();
setType("FsCommons.Core.SummaryError", SummaryError);
var PropertyError = function () {
  function PropertyError(errorCode, description, propertyName) {
    _classCallCheck$2(this, PropertyError);

    this.ErrorCode = errorCode;
    this.Description = description;
    this.PropertyName = propertyName;
  }

  _createClass$2(PropertyError, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.PropertyError",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          ErrorCode: "string",
          Description: "string",
          PropertyName: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "DisplayAsPropErrorString",
    value: function () {
      return fsFormat("%s: %s")(function (x) {
        return x;
      })(this.PropertyName)(this.Description);
    }
  }, {
    key: "PropOrEntityName",
    get: function () {
      if (this.PropertyName === "") {
        return "Entity";
      } else {
        return this.PropertyName;
      }
    }
  }], [{
    key: "Undefined",
    get: function () {
      return ofArray([new PropertyError("PROP", "Undefined Error", "Undefined")]);
    }
  }]);

  return PropertyError;
}();
setType("FsCommons.Core.PropertyError", PropertyError);
var ApiResultRendition = function () {
  function ApiResultRendition(content, reportableErrors) {
    _classCallCheck$2(this, ApiResultRendition);

    this.Content = content;
    this.ReportableErrors = reportableErrors;
  }

  _createClass$2(ApiResultRendition, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.ApiResultRendition",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          Content: Option(GenericParam("a")),
          ReportableErrors: Interface("System.Collections.Generic.IEnumerable")
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }]);

  return ApiResultRendition;
}();
setType("FsCommons.Core.ApiResultRendition", ApiResultRendition);
var ApiResultHelpers = function (__exports) {
  var SuccessApiResult = __exports.SuccessApiResult = function (content) {
    return new ApiResultRendition(content, empty());
  };

  var FailureApiResult = __exports.FailureApiResult = function (errors) {
    return new ApiResultRendition(null, errors);
  };

  return __exports;
}({});

function choice1Of2(v) {
    return new Choice("Choice1Of2", [v]);
}
function choice2Of2(v) {
    return new Choice("Choice2Of2", [v]);
}
var Choice = (function () {
    function Choice(t, d) {
        this.Case = t;
        this.Fields = d;
    }
    Object.defineProperty(Choice.prototype, "valueIfChoice1", {
        get: function () {
            return this.Case === "Choice1Of2" ? this.Fields[0] : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Choice.prototype, "valueIfChoice2", {
        get: function () {
            return this.Case === "Choice2Of2" ? this.Fields[0] : null;
        },
        enumerable: true,
        configurable: true
    });
    Choice.prototype.Equals = function (other) {
        return equalsUnions(this, other);
    };
    Choice.prototype.CompareTo = function (other) {
        return compareUnions(this, other);
    };
    Choice.prototype[_Symbol.reflection] = function () {
        return {
            type: "Microsoft.FSharp.Core.FSharpChoice",
            interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"]
        };
    };
    return Choice;
}());

function distinctBy(f, xs) {
    return choose$1(function (tup) { return tup[0]; }, scan(function (tup, x) {
        var acc = tup[1];
        var k = f(x);
        return acc.has(k) ? [null, acc] : [x, add$3(k, acc)];
    }, [null, create$4()], xs));
}
function distinct(xs) {
    return distinctBy(function (x) { return x; }, xs);
}
var SetTree = (function () {
    function SetTree(caseName, fields) {
        this.Case = caseName;
        this.Fields = fields;
    }
    return SetTree;
}());
var tree_tolerance = 2;
function tree_countAux(s, acc) {
    return s.Case === "SetOne" ? acc + 1 : s.Case === "SetEmpty" ? acc : tree_countAux(s.Fields[1], tree_countAux(s.Fields[2], acc + 1));
}
function tree_count(s) {
    return tree_countAux(s, 0);
}
function tree_SetOne(n) {
    return new SetTree("SetOne", [n]);
}
function tree_SetNode(x, l, r, h) {
    return new SetTree("SetNode", [x, l, r, h]);
}
function tree_height$1(t) {
    return t.Case === "SetOne" ? 1 : t.Case === "SetNode" ? t.Fields[3] : 0;
}
function tree_mk$1(l, k, r) {
    var matchValue = [l, r];
    var $target1 = function () {
        var hl = tree_height$1(l);
        var hr = tree_height$1(r);
        var m = hl < hr ? hr : hl;
        return tree_SetNode(k, l, r, m + 1);
    };
    if (matchValue[0].Case === "SetEmpty") {
        if (matchValue[1].Case === "SetEmpty") {
            return tree_SetOne(k);
        }
        else {
            return $target1();
        }
    }
    else {
        return $target1();
    }
}
function tree_rebalance$1(t1, k, t2) {
    var t1h = tree_height$1(t1);
    var t2h = tree_height$1(t2);
    if (t2h > t1h + tree_tolerance) {
        if (t2.Case === "SetNode") {
            if (tree_height$1(t2.Fields[1]) > t1h + 1) {
                if (t2.Fields[1].Case === "SetNode") {
                    return tree_mk$1(tree_mk$1(t1, k, t2.Fields[1].Fields[1]), t2.Fields[1].Fields[0], tree_mk$1(t2.Fields[1].Fields[2], t2.Fields[0], t2.Fields[2]));
                }
                else {
                    throw new Error("rebalance");
                }
            }
            else {
                return tree_mk$1(tree_mk$1(t1, k, t2.Fields[1]), t2.Fields[0], t2.Fields[2]);
            }
        }
        else {
            throw new Error("rebalance");
        }
    }
    else {
        if (t1h > t2h + tree_tolerance) {
            if (t1.Case === "SetNode") {
                if (tree_height$1(t1.Fields[2]) > t2h + 1) {
                    if (t1.Fields[2].Case === "SetNode") {
                        return tree_mk$1(tree_mk$1(t1.Fields[1], t1.Fields[0], t1.Fields[2].Fields[1]), t1.Fields[2].Fields[0], tree_mk$1(t1.Fields[2].Fields[2], k, t2));
                    }
                    else {
                        throw new Error("rebalance");
                    }
                }
                else {
                    return tree_mk$1(t1.Fields[1], t1.Fields[0], tree_mk$1(t1.Fields[2], k, t2));
                }
            }
            else {
                throw new Error("rebalance");
            }
        }
        else {
            return tree_mk$1(t1, k, t2);
        }
    }
}
function tree_add$1(comparer, k, t) {
    if (t.Case === "SetOne") {
        var c = comparer.Compare(k, t.Fields[0]);
        if (c < 0) {
            return tree_SetNode(k, new SetTree("SetEmpty", []), t, 2);
        }
        else if (c === 0) {
            return t;
        }
        else {
            return tree_SetNode(k, t, new SetTree("SetEmpty", []), 2);
        }
    }
    else if (t.Case === "SetEmpty") {
        return tree_SetOne(k);
    }
    else {
        var c = comparer.Compare(k, t.Fields[0]);
        if (c < 0) {
            return tree_rebalance$1(tree_add$1(comparer, k, t.Fields[1]), t.Fields[0], t.Fields[2]);
        }
        else if (c === 0) {
            return t;
        }
        else {
            return tree_rebalance$1(t.Fields[1], t.Fields[0], tree_add$1(comparer, k, t.Fields[2]));
        }
    }
}
function tree_mem$1(comparer, k, t) {
    if (t.Case === "SetOne") {
        return comparer.Compare(k, t.Fields[0]) === 0;
    }
    else if (t.Case === "SetEmpty") {
        return false;
    }
    else {
        var c = comparer.Compare(k, t.Fields[0]);
        if (c < 0) {
            return tree_mem$1(comparer, k, t.Fields[1]);
        }
        else if (c === 0) {
            return true;
        }
        else {
            return tree_mem$1(comparer, k, t.Fields[2]);
        }
    }
}
function tree_collapseLHS$1(stack) {
    return stack.tail != null
        ? stack.head.Case === "SetOne"
            ? stack
            : stack.head.Case === "SetNode"
                ? tree_collapseLHS$1(ofArray([
                    stack.head.Fields[1],
                    tree_SetOne(stack.head.Fields[0]),
                    stack.head.Fields[2]
                ], stack.tail))
                : tree_collapseLHS$1(stack.tail)
        : new List$1();
}
function tree_mkIterator$1(s) {
    return { stack: tree_collapseLHS$1(new List$1(s, new List$1())), started: false };
}

function tree_moveNext$1(i) {
    function current(i) {
        if (i.stack.tail == null) {
            return null;
        }
        else if (i.stack.head.Case === "SetOne") {
            return i.stack.head.Fields[0];
        }
        throw new Error("Please report error: Set iterator, unexpected stack for current");
    }
    if (i.started) {
        if (i.stack.tail == null) {
            return { done: true, value: null };
        }
        else {
            if (i.stack.head.Case === "SetOne") {
                i.stack = tree_collapseLHS$1(i.stack.tail);
                return {
                    done: i.stack.tail == null,
                    value: current(i)
                };
            }
            else {
                throw new Error("Please report error: Set iterator, unexpected stack for moveNext");
            }
        }
    }
    else {
        i.started = true;
        return {
            done: i.stack.tail == null,
            value: current(i)
        };
    }
    
}
function tree_compareStacks(comparer, l1, l2) {
    var $target8 = function (n1k, t1) { return tree_compareStacks(comparer, ofArray([new SetTree("SetEmpty", []), tree_SetOne(n1k)], t1), l2); };
    var $target9 = function (n1k, n1l, n1r, t1) { return tree_compareStacks(comparer, ofArray([n1l, tree_SetNode(n1k, new SetTree("SetEmpty", []), n1r, 0)], t1), l2); };
    var $target11 = function (n2k, n2l, n2r, t2) { return tree_compareStacks(comparer, l1, ofArray([n2l, tree_SetNode(n2k, new SetTree("SetEmpty", []), n2r, 0)], t2)); };
    if (l1.tail != null) {
        if (l2.tail != null) {
            if (l2.head.Case === "SetOne") {
                if (l1.head.Case === "SetOne") {
                    var n1k = l1.head.Fields[0], n2k = l2.head.Fields[0], t1 = l1.tail, t2 = l2.tail, c = comparer.Compare(n1k, n2k);
                    if (c !== 0) {
                        return c;
                    }
                    else {
                        return tree_compareStacks(comparer, t1, t2);
                    }
                }
                else {
                    if (l1.head.Case === "SetNode") {
                        if (l1.head.Fields[1].Case === "SetEmpty") {
                            var emp = l1.head.Fields[1], n1k = l1.head.Fields[0], n1r = l1.head.Fields[2], n2k = l2.head.Fields[0], t1 = l1.tail, t2 = l2.tail, c = comparer.Compare(n1k, n2k);
                            if (c !== 0) {
                                return c;
                            }
                            else {
                                return tree_compareStacks(comparer, ofArray([n1r], t1), ofArray([emp], t2));
                            }
                        }
                        else {
                            return $target9(l1.head.Fields[0], l1.head.Fields[1], l1.head.Fields[2], l1.tail);
                        }
                    }
                    else {
                        var n2k = l2.head.Fields[0], t2 = l2.tail;
                        return tree_compareStacks(comparer, l1, ofArray([new SetTree("SetEmpty", []), tree_SetOne(n2k)], t2));
                    }
                }
            }
            else {
                if (l2.head.Case === "SetNode") {
                    if (l2.head.Fields[1].Case === "SetEmpty") {
                        if (l1.head.Case === "SetOne") {
                            var n1k = l1.head.Fields[0], n2k = l2.head.Fields[0], n2r = l2.head.Fields[2], t1 = l1.tail, t2 = l2.tail, c = comparer.Compare(n1k, n2k);
                            if (c !== 0) {
                                return c;
                            }
                            else {
                                return tree_compareStacks(comparer, ofArray([new SetTree("SetEmpty", [])], t1), ofArray([n2r], t2));
                            }
                        }
                        else {
                            if (l1.head.Case === "SetNode") {
                                if (l1.head.Fields[1].Case === "SetEmpty") {
                                    var n1k = l1.head.Fields[0], n1r = l1.head.Fields[2], n2k = l2.head.Fields[0], n2r = l2.head.Fields[2], t1 = l1.tail, t2 = l2.tail, c = comparer.Compare(n1k, n2k);
                                    if (c !== 0) {
                                        return c;
                                    }
                                    else {
                                        return tree_compareStacks(comparer, ofArray([n1r], t1), ofArray([n2r], t2));
                                    }
                                }
                                else {
                                    return $target9(l1.head.Fields[0], l1.head.Fields[1], l1.head.Fields[2], l1.tail);
                                }
                            }
                            else {
                                return $target11(l2.head.Fields[0], l2.head.Fields[1], l2.head.Fields[2], l2.tail);
                            }
                        }
                    }
                    else {
                        if (l1.head.Case === "SetOne") {
                            return $target8(l1.head.Fields[0], l1.tail);
                        }
                        else {
                            if (l1.head.Case === "SetNode") {
                                return $target9(l1.head.Fields[0], l1.head.Fields[1], l1.head.Fields[2], l1.tail);
                            }
                            else {
                                return $target11(l2.head.Fields[0], l2.head.Fields[1], l2.head.Fields[2], l2.tail);
                            }
                        }
                    }
                }
                else {
                    if (l1.head.Case === "SetOne") {
                        return $target8(l1.head.Fields[0], l1.tail);
                    }
                    else {
                        if (l1.head.Case === "SetNode") {
                            return $target9(l1.head.Fields[0], l1.head.Fields[1], l1.head.Fields[2], l1.tail);
                        }
                        else {
                            return tree_compareStacks(comparer, l1.tail, l2.tail);
                        }
                    }
                }
            }
        }
        else {
            return 1;
        }
    }
    else {
        if (l2.tail != null) {
            return -1;
        }
        else {
            return 0;
        }
    }
}
function tree_compare(comparer, s1, s2) {
    if (s1.Case === "SetEmpty") {
        if (s2.Case === "SetEmpty") {
            return 0;
        }
        else {
            return -1;
        }
    }
    else {
        if (s2.Case === "SetEmpty") {
            return 1;
        }
        else {
            return tree_compareStacks(comparer, ofArray([s1]), ofArray([s2]));
        }
    }
}
function tree_mkFromEnumerator$1(comparer, acc, e) {
    var cur = e.next();
    while (!cur.done) {
        acc = tree_add$1(comparer, cur.value, acc);
        cur = e.next();
    }
    return acc;
}
function tree_ofSeq$1(comparer, c) {
    var ie = c[Symbol.iterator]();
    return tree_mkFromEnumerator$1(comparer, new SetTree("SetEmpty", []), ie);
}
var FableSet = (function () {
    function FableSet() {
    }
    FableSet.prototype.ToString = function () {
        return "set [" + Array.from(this).map(toString).join("; ") + "]";
    };
    FableSet.prototype.Equals = function (s2) {
        return this.CompareTo(s2) === 0;
    };
    FableSet.prototype.CompareTo = function (s2) {
        return this === s2 ? 0 : tree_compare(this.comparer, this.tree, s2.tree);
    };
    FableSet.prototype[Symbol.iterator] = function () {
        var i = tree_mkIterator$1(this.tree);
        return {
            next: function () { return tree_moveNext$1(i); }
        };
    };
    FableSet.prototype.values = function () {
        return this[Symbol.iterator]();
    };
    FableSet.prototype.has = function (v) {
        return tree_mem$1(this.comparer, v, this.tree);
    };
    FableSet.prototype.add = function (v) {
        throw new Error("not supported");
    };
    FableSet.prototype.delete = function (v) {
        throw new Error("not supported");
    };
    FableSet.prototype.clear = function () {
        throw new Error("not supported");
    };
    Object.defineProperty(FableSet.prototype, "size", {
        get: function () {
            return tree_count(this.tree);
        },
        enumerable: true,
        configurable: true
    });
    FableSet.prototype[_Symbol.reflection] = function () {
        return {
            type: "Microsoft.FSharp.Collections.FSharpSet",
            interfaces: ["System.IEquatable", "System.IComparable"]
        };
    };
    return FableSet;
}());
function from$1(comparer, tree) {
    var s = new FableSet();
    s.tree = tree;
    s.comparer = comparer || new GenericComparer();
    return s;
}
function create$4(ie, comparer) {
    comparer = comparer || new GenericComparer();
    return from$1(comparer, ie ? tree_ofSeq$1(comparer, ie) : new SetTree("SetEmpty", []));
}

function add$3(item$$1, s) {
    return from$1(s.comparer, tree_add$1(s.comparer, item$$1, s.tree));
}

var _createClass$3 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Chessie = function (__exports) {
  var Result = __exports.Result = function () {
    function Result(caseName, fields) {
      _classCallCheck$3(this, Result);

      this.Case = caseName;
      this.Fields = fields;
    }

    _createClass$3(Result, [{
      key: _Symbol.reflection,
      value: function () {
        return {
          type: "FsCommons.Core.Chessie.Result",
          interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
          cases: {
            Bad: [makeGeneric(List$1, {
              T: GenericParam("TMessage")
            })],
            Ok: [GenericParam("TSuccess"), makeGeneric(List$1, {
              T: GenericParam("TMessage")
            })]
          }
        };
      }
    }, {
      key: "Equals",
      value: function (other) {
        return equalsUnions(this, other);
      }
    }, {
      key: "CompareTo",
      value: function (other) {
        return compareUnions(this, other);
      }
    }, {
      key: "ToString",
      value: function () {
        if (this.Case === "Bad") {
          return fsFormat("Error: %s")(function (x) {
            return x;
          })(join("\n", map$1(function (x) {
            return toString(x);
          }, this.Fields[0])));
        } else {
          return fsFormat("OK: %A - %s")(function (x) {
            return x;
          })(this.Fields[0])(join("\n", map$1(function (x_1) {
            return toString(x_1);
          }, this.Fields[1])));
        }
      }
    }], [{
      key: "FailWith_0",
      value: function (messages) {
        return new Result("Bad", [toList(messages)]);
      }
    }, {
      key: "FailWith_1",
      value: function (message) {
        return new Result("Bad", [ofArray([message])]);
      }
    }, {
      key: "Succeed_0",
      value: function (value) {
        return new Result("Ok", [value, new List$1()]);
      }
    }, {
      key: "Succeed_1",
      value: function (value, message) {
        return new Result("Ok", [value, ofArray([message])]);
      }
    }, {
      key: "Succeed_2",
      value: function (value, messages) {
        return new Result("Ok", [value, toList(messages)]);
      }
    }, {
      key: "Try",
      value: function (func) {
        try {
          return new Result("Ok", [func(), new List$1()]);
        } catch (exn) {
          return new Result("Bad", [ofArray([exn])]);
        }
      }
    }]);

    return Result;
  }();

  setType("FsCommons.Core.Chessie.Result", Result);

  var Trial = __exports.Trial = function (__exports) {
    var TrialBuilder = __exports.TrialBuilder = function () {
      _createClass$3(TrialBuilder, [{
        key: _Symbol.reflection,
        value: function () {
          return {
            type: "FsCommons.Core.Chessie.Trial.TrialBuilder",
            properties: {}
          };
        }
      }]);

      function TrialBuilder() {
        _classCallCheck$3(this, TrialBuilder);
      }

      _createClass$3(TrialBuilder, [{
        key: "Zero",
        value: function () {
          return new Result("Ok", [null, new List$1()]);
        }
      }, {
        key: "Bind",
        value: function (m, f) {
          var $var8 = m;

          if ($var8.Case === "Bad") {
            return function (msgs) {
              return new Result("Bad", [msgs]);
            }($var8.Fields[0]);
          } else {
            return function (tupledArg) {
              return function (result) {
                var $var6 = tupledArg[1];
                var $var7 = result;

                if ($var7.Case === "Bad") {
                  return function (errs) {
                    return new Result("Bad", [append$$1(errs, $var6)]);
                  }($var7.Fields[0]);
                } else {
                  return function (tupledArg_1) {
                    return new Result("Ok", [tupledArg_1[0], append$$1($var6, tupledArg_1[1])]);
                  }([$var7.Fields[0], $var7.Fields[1]]);
                }
              }(f(tupledArg[0]));
            }([$var8.Fields[0], $var8.Fields[1]]);
          }
        }
      }, {
        key: "Return",
        value: function (x) {
          return new Result("Ok", [x, new List$1()]);
        }
      }, {
        key: "ReturnFrom",
        value: function (x) {
          return x;
        }
      }, {
        key: "Combine",
        value: function (a, b) {
          var $var11 = a;

          if ($var11.Case === "Bad") {
            return function (msgs) {
              return new Result("Bad", [msgs]);
            }($var11.Fields[0]);
          } else {
            return function (tupledArg) {
              return function (result) {
                var $var9 = tupledArg[1];
                var $var10 = result;

                if ($var10.Case === "Bad") {
                  return function (errs) {
                    return new Result("Bad", [append$$1(errs, $var9)]);
                  }($var10.Fields[0]);
                } else {
                  return function (tupledArg_1) {
                    return new Result("Ok", [tupledArg_1[0], append$$1($var9, tupledArg_1[1])]);
                  }([$var10.Fields[0], $var10.Fields[1]]);
                }
              }(b(tupledArg[0]));
            }([$var11.Fields[0], $var11.Fields[1]]);
          }
        }
      }, {
        key: "Delay",
        value: function (f) {
          return f;
        }
      }, {
        key: "Run",
        value: function (f) {
          return f(null);
        }
      }, {
        key: "TryWith",
        value: function (body, handler) {
          try {
            return body(null);
          } catch (e) {
            return handler(e);
          }
        }
      }, {
        key: "TryFinally",
        value: function (body, compensation) {
          try {
            return body(null);
          } finally {
            compensation(null);
          }
        }
      }, {
        key: "Using",
        value: function (d, body) {
          var result = function result() {
            return body(d);
          };

          return this.TryFinally(result, function () {
            if (d == null) {} else {
              d.Dispose();
            }
          });
        }
      }, {
        key: "While",
        value: function (guard, body) {
          var _this = this;

          if (!guard(null)) {
            return this.Zero();
          } else {
            var $var14 = body(null);

            if ($var14.Case === "Bad") {
              return function (msgs) {
                return new Result("Bad", [msgs]);
              }($var14.Fields[0]);
            } else {
              return function (tupledArg) {
                return function (result) {
                  var $var12 = tupledArg[1];
                  var $var13 = result;

                  if ($var13.Case === "Bad") {
                    return function (errs) {
                      return new Result("Bad", [append$$1(errs, $var12)]);
                    }($var13.Fields[0]);
                  } else {
                    return function (tupledArg_1) {
                      return new Result("Ok", [null, append$$1($var12, tupledArg_1[1])]);
                    }([null, $var13.Fields[1]]);
                  }
                }(function () {
                  return _this.While(guard, body);
                }(null));
              }([null, $var14.Fields[1]]);
            }
          }
        }
      }, {
        key: "For",
        value: function (s, body) {
          var _this2 = this;

          return this.Using(getEnumerator(s), function (_enum) {
            return _this2.While(function () {
              return _enum.MoveNext();
            }, _this2.Delay(function () {
              return body(_enum.get_Current);
            }));
          });
        }
      }]);

      return TrialBuilder;
    }();

    setType("FsCommons.Core.Chessie.Trial.TrialBuilder", TrialBuilder);
    var trial = __exports.trial = new TrialBuilder();
    return __exports;
  }({});

  return __exports;
}({});
var ConversionHelpers = function (__exports) {
  var tryParseWith = __exports.tryParseWith = function (tryParseFunc) {
    return function ($var15) {
      return function (_arg1) {
        return _arg1[0] ? _arg1[1] : null;
      }(tryParseFunc($var15));
    };
  };

  var tryParseInt = __exports.tryParseInt = tryParseWith(function (arg00) {
    return isNaN(parseInt(arg00)) ? [0, false] : [true, parseInt(arg00)];
  });
  var tryParseDecimal = __exports.tryParseDecimal = tryParseWith(function (arg00) {
    return isNaN(parseFloat(arg00)) ? [0, false] : [true, parseFloat(arg00)];
  });

  var _Int___ = __exports["|Int|_|"] = tryParseInt;

  var _Decimal___ = __exports["|Decimal|_|"] = tryParseDecimal;

  return __exports;
}({});
var CommonValidations = function (__exports) {
  var ValidateDataRequirementsStr = __exports.ValidateDataRequirementsStr = function (req, propName, value) {
    var validations = map$1(function (option) {
      return option;
    }, filter$1(function (option_1) {
      return option_1 != null;
    }, map$1(function (e) {
      var $var16 = void 0;
      var activePatternResult443 = void 0;
      var $var17 = e;

      if ($var17.Case === "Bad") {
        activePatternResult443 = new Choice("Choice3Of3", [$var17.Fields[0]]);
      } else if ($var17.Fields[1].tail == null) {
        activePatternResult443 = new Choice("Choice1Of3", [$var17.Fields[0]]);
      } else {
        activePatternResult443 = new Choice("Choice2Of3", [[$var17.Fields[0], $var17.Fields[1]]]);
      }

      if (activePatternResult443.Case === "Choice3Of3") {
        if (activePatternResult443.Fields[0].tail != null) {
          $var16 = [0, activePatternResult443.Fields[0].head, activePatternResult443.Fields[0].tail];
        } else {
          $var16 = [1];
        }
      } else {
        $var16 = [1];
      }

      switch ($var16[0]) {
        case 0:
          return new PropertyError(propName, $var16[1], propName);

        case 1:
          return null;
      }
    }, ofArray([function () {
      var $var20 = value;
      var $var19 = req.Size;
      var $var18 = req.MinSize;

      if ($var20 == null) {
        return new Chessie.Result("Bad", [ofArray(["Must not be empty"])]);
      } else if ($var20.length < $var18) {
        return new Chessie.Result("Bad", [ofArray(["Must be more than " + toString($var18) + " character(s)"])]);
      } else if ($var20.length > $var19) {
        return new Chessie.Result("Bad", [ofArray(["Must be less than " + toString($var19) + " character(s)"])]);
      } else {
        return new Chessie.Result("Ok", [$var20, new List$1()]);
      }
    }()]))));
    var matchValue = isEmpty(validations);

    if (matchValue) {
      return new Chessie.Result("Ok", [value, new List$1()]);
    } else {
      return new Chessie.Result("Bad", [ofArray([validations])]);
    }
  };

  var areCharsCorrect = __exports.areCharsCorrect = function (validationFunc, txt) {
    if (txt == null) {
      return new Chessie.Result("Ok", [txt, new List$1()]);
    } else {
      var incorrectChars = Array.from(distinct(txt.split("").filter(function ($var21) {
        return function (value) {
          return !value;
        }(validationFunc($var21));
      })));

      if (incorrectChars.length === 0) {
        return new Chessie.Result("Ok", [txt, new List$1()]);
      } else {
        var chars = String(incorrectChars);
        return new Chessie.Result("Bad", [ofArray(["One or more of the characters are invalid: " + chars])]);
      }
    }
  };

  var ValidateDataRequirementsStrPattern = __exports.ValidateDataRequirementsStrPattern = function (req, propName, value) {
    var validations = map$1(function (option) {
      return option;
    }, filter$1(function (option_1) {
      return option_1 != null;
    }, map$1(function (e) {
      var $var22 = void 0;
      var activePatternResult450 = void 0;
      var $var23 = e;

      if ($var23.Case === "Bad") {
        activePatternResult450 = new Choice("Choice3Of3", [$var23.Fields[0]]);
      } else if ($var23.Fields[1].tail == null) {
        activePatternResult450 = new Choice("Choice1Of3", [$var23.Fields[0]]);
      } else {
        activePatternResult450 = new Choice("Choice2Of3", [[$var23.Fields[0], $var23.Fields[1]]]);
      }

      if (activePatternResult450.Case === "Choice3Of3") {
        if (activePatternResult450.Fields[0].tail != null) {
          $var22 = [0, activePatternResult450.Fields[0].head, activePatternResult450.Fields[0].tail];
        } else {
          $var22 = [1];
        }
      } else {
        $var22 = [1];
      }

      switch ($var22[0]) {
        case 0:
          return new PropertyError(propName, $var22[1], propName);

        case 1:
          return null;
      }
    }, ofArray([function () {
      var $var26 = value;
      var $var25 = req.Size;
      var $var24 = req.MinSize;

      if ($var26 == null) {
        return new Chessie.Result("Bad", [ofArray(["Must not be empty"])]);
      } else if ($var26.length < $var24) {
        return new Chessie.Result("Bad", [ofArray(["Must be more than " + toString($var24) + " character(s)"])]);
      } else if ($var26.length > $var25) {
        return new Chessie.Result("Bad", [ofArray(["Must be less than " + toString($var25) + " character(s)"])]);
      } else {
        return new Chessie.Result("Ok", [$var26, new List$1()]);
      }
    }(), function () {
      var $var28 = value;
      var $var27 = req.RegexPattern;

      if ($var27 == null) {
        return new Chessie.Result("Ok", [$var28, new List$1()]);
      } else if ($var28 == null) {
        return new Chessie.Result("Ok", [$var28, new List$1()]);
      } else if (!isMatch($var27, $var28)) {
        return new Chessie.Result("Bad", [ofArray(["Does not match pattern of " + toString($var27)])]);
      } else {
        return new Chessie.Result("Ok", [$var28, new List$1()]);
      }
    }(), areCharsCorrect(req.CharValidation, value)]))));
    var matchValue = isEmpty(validations);

    if (matchValue) {
      return new Chessie.Result("Ok", [value, new List$1()]);
    } else {
      return new Chessie.Result("Bad", [ofArray([validations])]);
    }
  };

  var isWithinRange = __exports.isWithinRange = function (minVal, maxVal, value) {
    if (compare$1(value, maxVal) > 0) {
      return new Chessie.Result("Bad", [ofArray(["Must not be more than " + toString(maxVal)])]);
    } else if (compare$1(value, minVal) < 0) {
      return new Chessie.Result("Bad", [ofArray(["Must not be less than " + toString(minVal)])]);
    } else {
      return new Chessie.Result("Ok", [value, new List$1()]);
    }
  };

  var ValidateDataRequirementsInt = __exports.ValidateDataRequirementsInt = function (req, propName, value) {
    var validations = map$1(function (option) {
      return option;
    }, filter$1(function (option_1) {
      return option_1 != null;
    }, map$1(function (e) {
      var $var29 = void 0;
      var activePatternResult459 = void 0;
      var $var30 = e;

      if ($var30.Case === "Bad") {
        activePatternResult459 = new Choice("Choice3Of3", [$var30.Fields[0]]);
      } else if ($var30.Fields[1].tail == null) {
        activePatternResult459 = new Choice("Choice1Of3", [$var30.Fields[0]]);
      } else {
        activePatternResult459 = new Choice("Choice2Of3", [[$var30.Fields[0], $var30.Fields[1]]]);
      }

      if (activePatternResult459.Case === "Choice3Of3") {
        if (activePatternResult459.Fields[0].tail != null) {
          $var29 = [0, activePatternResult459.Fields[0].head, activePatternResult459.Fields[0].tail];
        } else {
          $var29 = [1];
        }
      } else {
        $var29 = [1];
      }

      switch ($var29[0]) {
        case 0:
          return new PropertyError(propName, $var29[1], propName);

        case 1:
          return null;
      }
    }, ofArray([isWithinRange(req.MinValue, req.MaxValue, value)]))));
    var matchValue = isEmpty(validations);

    if (matchValue) {
      return new Chessie.Result("Ok", [value, new List$1()]);
    } else {
      return new Chessie.Result("Bad", [ofArray([validations])]);
    }
  };

  var ValidateDataRequirementsDecimal = __exports.ValidateDataRequirementsDecimal = function (req, propName, value) {
    var validations = map$1(function (option) {
      return option;
    }, filter$1(function (option_1) {
      return option_1 != null;
    }, map$1(function (e) {
      var $var31 = void 0;
      var activePatternResult464 = void 0;
      var $var32 = e;

      if ($var32.Case === "Bad") {
        activePatternResult464 = new Choice("Choice3Of3", [$var32.Fields[0]]);
      } else if ($var32.Fields[1].tail == null) {
        activePatternResult464 = new Choice("Choice1Of3", [$var32.Fields[0]]);
      } else {
        activePatternResult464 = new Choice("Choice2Of3", [[$var32.Fields[0], $var32.Fields[1]]]);
      }

      if (activePatternResult464.Case === "Choice3Of3") {
        if (activePatternResult464.Fields[0].tail != null) {
          $var31 = [0, activePatternResult464.Fields[0].head, activePatternResult464.Fields[0].tail];
        } else {
          $var31 = [1];
        }
      } else {
        $var31 = [1];
      }

      switch ($var31[0]) {
        case 0:
          return new PropertyError(propName, $var31[1], propName);

        case 1:
          return null;
      }
    }, ofArray([isWithinRange(req.MinValue, req.MaxValue, value)]))));
    var matchValue = isEmpty(validations);

    if (matchValue) {
      return new Chessie.Result("Ok", [value, new List$1()]);
    } else {
      return new Chessie.Result("Bad", [ofArray([validations])]);
    }
  };

  var ValidateDataRequirementsDate = __exports.ValidateDataRequirementsDate = function (req, propName, value) {
    var validations = map$1(function (option) {
      return option;
    }, filter$1(function (option_1) {
      return option_1 != null;
    }, map$1(function (e) {
      var $var33 = void 0;
      var activePatternResult469 = void 0;
      var $var34 = e;

      if ($var34.Case === "Bad") {
        activePatternResult469 = new Choice("Choice3Of3", [$var34.Fields[0]]);
      } else if ($var34.Fields[1].tail == null) {
        activePatternResult469 = new Choice("Choice1Of3", [$var34.Fields[0]]);
      } else {
        activePatternResult469 = new Choice("Choice2Of3", [[$var34.Fields[0], $var34.Fields[1]]]);
      }

      if (activePatternResult469.Case === "Choice3Of3") {
        if (activePatternResult469.Fields[0].tail != null) {
          $var33 = [0, activePatternResult469.Fields[0].head, activePatternResult469.Fields[0].tail];
        } else {
          $var33 = [1];
        }
      } else {
        $var33 = [1];
      }

      switch ($var33[0]) {
        case 0:
          return new PropertyError(propName, $var33[1], propName);

        case 1:
          return null;
      }
    }, ofArray([isWithinRange(req.MinValue, req.MaxValue, value)]))));
    var matchValue = isEmpty(validations);

    if (matchValue) {
      return new Chessie.Result("Ok", [value, new List$1()]);
    } else {
      return new Chessie.Result("Bad", [ofArray([validations])]);
    }
  };

  var ValidateAll = __exports.ValidateAll = function (validations, req) {
    var allResults = collect$1(function (e) {
      var activePatternResult477 = void 0;
      var $var35 = e;

      if ($var35.Case === "Bad") {
        activePatternResult477 = new Choice("Choice3Of3", [$var35.Fields[0]]);
      } else if ($var35.Fields[1].tail == null) {
        activePatternResult477 = new Choice("Choice1Of3", [$var35.Fields[0]]);
      } else {
        activePatternResult477 = new Choice("Choice2Of3", [[$var35.Fields[0], $var35.Fields[1]]]);
      }

      if (activePatternResult477.Case === "Choice3Of3") {
        return activePatternResult477.Fields[0];
      } else {
        return new List$1();
      }
    }, filter$1(function (r) {
      var activePatternResult475 = void 0;
      var $var36 = r;

      if ($var36.Case === "Bad") {
        activePatternResult475 = new Choice("Choice3Of3", [$var36.Fields[0]]);
      } else if ($var36.Fields[1].tail == null) {
        activePatternResult475 = new Choice("Choice1Of3", [$var36.Fields[0]]);
      } else {
        activePatternResult475 = new Choice("Choice2Of3", [[$var36.Fields[0], $var36.Fields[1]]]);
      }

      if (activePatternResult475.Case === "Choice3Of3") {
        return true;
      } else {
        return false;
      }
    }, map$1(function (v) {
      return v(req);
    }, validations)));
    var matchValue = isEmpty(allResults);

    if (matchValue) {
      return new Chessie.Result("Ok", [req, new List$1()]);
    } else {
      return new Chessie.Result("Bad", [ofArray([allResults])]);
    }
  };

  var ValidateAllResults = __exports.ValidateAllResults = function (results, onAllGood) {
    var allResults = collect$1(function (e) {
      var activePatternResult484 = void 0;
      var $var37 = e;

      if ($var37.Case === "Bad") {
        activePatternResult484 = new Choice("Choice3Of3", [$var37.Fields[0]]);
      } else if ($var37.Fields[1].tail == null) {
        activePatternResult484 = new Choice("Choice1Of3", [$var37.Fields[0]]);
      } else {
        activePatternResult484 = new Choice("Choice2Of3", [[$var37.Fields[0], $var37.Fields[1]]]);
      }

      if (activePatternResult484.Case === "Choice3Of3") {
        return activePatternResult484.Fields[0];
      } else {
        return new List$1();
      }
    }, filter$1(function (r) {
      var activePatternResult482 = void 0;
      var $var38 = r;

      if ($var38.Case === "Bad") {
        activePatternResult482 = new Choice("Choice3Of3", [$var38.Fields[0]]);
      } else if ($var38.Fields[1].tail == null) {
        activePatternResult482 = new Choice("Choice1Of3", [$var38.Fields[0]]);
      } else {
        activePatternResult482 = new Choice("Choice2Of3", [[$var38.Fields[0], $var38.Fields[1]]]);
      }

      if (activePatternResult482.Case === "Choice3Of3") {
        return true;
      } else {
        return false;
      }
    }, results));
    var matchValue = isEmpty(allResults);

    if (matchValue) {
      return new Chessie.Result("Ok", [onAllGood(null), new List$1()]);
    } else {
      return new Chessie.Result("Bad", [ofArray([allResults])]);
    }
  };

  var ValidateAndExecCmd = __exports.ValidateAndExecCmd = function (onSuccessModel, onFailureModel, model, validationFunc, req, cmd) {
    var validationResults = validationFunc(req);

    if (validationResults.Case === "Bad") {
      return onFailureModel(model)(validationResults.Fields[0]);
    } else {
      return [onSuccessModel(model), ofArray([cmd(validationResults.Fields[0])])];
    }
  };

  var ValidateAfterPropChg = __exports.ValidateAfterPropChg = function (onSuccessModel, onFailureModel, model, currChild, validationFunc, modelPropUpdater, childPropUpdater, newVal) {
    var newChild = childPropUpdater(currChild)(newVal);
    var validationResults = validationFunc(newChild);
    var newModel = modelPropUpdater(model)(newChild);

    if (validationResults.Case === "Bad") {
      return onFailureModel(newModel)(validationResults.Fields[0]);
    } else {
      return [onSuccessModel(newModel), new List$1()];
    }
  };

  return __exports;
}({});

var _createClass$5 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$5(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Result = function () {
    function Result(caseName, fields) {
        _classCallCheck$5(this, Result);

        this.Case = caseName;
        this.Fields = fields;
    }

    _createClass$5(Result, [{
        key: _Symbol.reflection,
        value: function () {
            return {
                type: "Fable.PowerPack.Result.Result",
                interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
                cases: {
                    Error: [GenericParam("B")],
                    Ok: [GenericParam("A")]
                }
            };
        }
    }, {
        key: "Equals",
        value: function (other) {
            return equalsUnions(this, other);
        }
    }, {
        key: "CompareTo",
        value: function (other) {
            return compareUnions(this, other);
        }
    }]);

    return Result;
}();
setType("Fable.PowerPack.Result.Result", Result);

function map$4(fn, a) {
    if (a.Case === "Error") {
        return new Result("Error", [a.Fields[0]]);
    } else {
        return new Result("Ok", [fn(a.Fields[0])]);
    }
}
function bind(fn, a) {
    if (a.Case === "Error") {
        return new Result("Error", [a.Fields[0]]);
    } else {
        return fn(a.Fields[0]);
    }
}
var ResultBuilder = function () {
    _createClass$5(ResultBuilder, [{
        key: _Symbol.reflection,
        value: function () {
            return {
                type: "Fable.PowerPack.Result.ResultBuilder",
                properties: {
                    Zero: "function"
                }
            };
        }
    }]);

    function ResultBuilder() {
        _classCallCheck$5(this, ResultBuilder);
    }

    _createClass$5(ResultBuilder, [{
        key: "Bind",
        value: function (m, f) {
            return bind(f, m);
        }
    }, {
        key: "Return",
        value: function (a) {
            return new Result("Ok", [a]);
        }
    }, {
        key: "ReturnFrom",
        value: function (m) {
            return m;
        }
    }, {
        key: "Combine",
        value: function (left, right) {
            return this.Bind(left, function () {
                return right;
            });
        }
    }, {
        key: "Zero",
        get: function () {
            var _this = this;

            return function (arg00) {
                return _this.Return(arg00);
            };
        }
    }]);

    return ResultBuilder;
}();
setType("Fable.PowerPack.Result.ResultBuilder", ResultBuilder);
var result = new ResultBuilder();
//# sourceMappingURL=Result.js.map

var _createClass$4 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$4(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Promise = function (__exports) {
    var result$$1 = __exports.result = function (a) {
        return a.then(function (arg0) {
            return new Result("Ok", [arg0]);
        }, function (arg0_1) {
            return new Result("Error", [arg0_1]);
        });
    };

    var mapResult = __exports.mapResult = function (fn, a) {
        return a.then(function (a_1) {
            return map$4(fn, a_1);
        });
    };

    var bindResult = __exports.bindResult = function (fn, a) {
        return a.then(function (a_1) {
            return a_1.Case === "Error" ? Promise.resolve(new Result("Error", [a_1.Fields[0]])) : result$$1(fn(a_1.Fields[0]));
        });
    };

    var PromiseBuilder = __exports.PromiseBuilder = function () {
        _createClass$4(PromiseBuilder, [{
            key: _Symbol.reflection,
            value: function () {
                return {
                    type: "Fable.PowerPack.Promise.PromiseBuilder",
                    properties: {}
                };
            }
        }]);

        function PromiseBuilder() {
            _classCallCheck$4(this, PromiseBuilder);
        }

        _createClass$4(PromiseBuilder, [{
            key: "For",
            value: function (seq, body) {
                var p = Promise.resolve(null);
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    var _loop = function _loop() {
                        var a = _step.value;
                        p = p.then(function () {
                            return body(a);
                        });
                    };

                    for (var _iterator = seq[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        _loop();
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                return p;
            }
        }, {
            key: "While",
            value: function (guard, p) {
                var _this = this;

                if (guard(null)) {
                    return p.then(function () {
                        return _this.While(guard, p);
                    });
                } else {
                    return Promise.resolve(null);
                }
            }
        }, {
            key: "TryFinally",
            value: function (p, compensation) {
                return p.then(function (x) {
                    compensation(null);
                    return x;
                }, function (er) {
                    compensation(null);
                    throw er;
                });
            }
        }, {
            key: "Delay",
            value: function (generator) {
                return {
                    then: function then(f1, f2) {
                        try {
                            return generator(null).then(f1, f2);
                        } catch (er) {
                            if (f2 == null) {
                                return Promise.reject(er);
                            } else {
                                try {
                                    return Promise.resolve(f2(er));
                                } catch (er_1) {
                                    return Promise.reject(er_1);
                                }
                            }
                        }
                    },
                    catch: function _catch(f) {
                        try {
                            return generator(null).catch(f);
                        } catch (er_2) {
                            try {
                                return Promise.resolve(f(er_2));
                            } catch (er_3) {
                                return Promise.reject(er_3);
                            }
                        }
                    }
                };
            }
        }, {
            key: "Using",
            value: function (resource, binder) {
                return this.TryFinally(binder(resource), function () {
                    resource.Dispose();
                });
            }
        }]);

        return PromiseBuilder;
    }();

    setType("Fable.PowerPack.Promise.PromiseBuilder", PromiseBuilder);
    return __exports;
}({});

var PromiseImpl = function (__exports) {
    var promise = __exports.promise = new _Promise.PromiseBuilder();
    return __exports;
}({});
//# sourceMappingURL=Promise.js.map

function resolveGeneric(idx, enclosing) {
    try {
        var t = enclosing.head;
        if (t.generics == null) {
            return resolveGeneric(idx, enclosing.tail);
        }
        else {
            var name_1 = typeof idx === "string"
                ? idx : Object.getOwnPropertyNames(t.generics)[idx];
            var resolved = t.generics[name_1];
            if (resolved == null) {
                return resolveGeneric(idx, enclosing.tail);
            }
            else if (resolved instanceof NonDeclaredType && resolved.kind === "GenericParam") {
                return resolveGeneric(resolved.definition, enclosing.tail);
            }
            else {
                return new List$1(resolved, enclosing);
            }
        }
    }
    catch (err) {
        throw new Error("Cannot resolve generic argument " + idx + ": " + err);
    }
}

function getTypeFullName(typ, option) {
    function trim(fullName, option) {
        if (typeof fullName !== "string") {
            return "unknown";
        }
        if (option === "name") {
            var i = fullName.lastIndexOf('.');
            return fullName.substr(i + 1);
        }
        if (option === "namespace") {
            var i = fullName.lastIndexOf('.');
            return i > -1 ? fullName.substr(0, i) : "";
        }
        return fullName;
    }
    if (typeof typ === "string") {
        return typ;
    }
    else if (typ instanceof NonDeclaredType) {
        switch (typ.kind) {
            case "Unit":
                return "unit";
            case "Option":
                return getTypeFullName(typ.generics, option) + " option";
            case "Array":
                return getTypeFullName(typ.generics, option) + "[]";
            case "Tuple":
                return typ.generics.map(function (x) { return getTypeFullName(x, option); }).join(" * ");
            case "GenericParam":
            case "Interface":
                return typ.definition;
            case "GenericType":
                return getTypeFullName(typ.definition, option);
            case "Any":
            default:
                return "unknown";
        }
    }
    else {
        var proto = typ.prototype;
        return trim(typeof proto[_Symbol.reflection] === "function"
            ? proto[_Symbol.reflection]().type : null, option);
    }
}

function toJson(o) {
    return JSON.stringify(o, function (k, v) {
        if (ArrayBuffer.isView(v)) {
            return Array.from(v);
        }
        else if (v != null && typeof v === "object") {
            var properties = typeof v[_Symbol.reflection] === "function" ? v[_Symbol.reflection]().properties : null;
            if (v instanceof List$1 || v instanceof FableSet || v instanceof Set) {
                return Array.from(v);
            }
            else if (v instanceof FableMap || v instanceof Map) {
                var stringKeys_1 = null;
                return fold(function (o, kv) {
                    if (stringKeys_1 === null) {
                        stringKeys_1 = typeof kv[0] === "string";
                    }
                    o[stringKeys_1 ? kv[0] : toJson(kv[0])] = kv[1];
                    return o;
                }, {}, v);
            }
            else if (!hasInterface(v, "FSharpRecord") && properties) {
                return fold(function (o, prop) {
                    return o[prop] = v[prop], o;
                }, {}, Object.getOwnPropertyNames(properties));
            }
            else if (hasInterface(v, "FSharpUnion")) {
                if (!v.Fields || !v.Fields.length) {
                    return v.Case;
                }
                else if (v.Fields.length === 1) {
                    var fieldValue = typeof v.Fields[0] === 'undefined' ? null : v.Fields[0];
                    return _a = {}, _a[v.Case] = fieldValue, _a;
                }
                else {
                    return _b = {}, _b[v.Case] = v.Fields, _b;
                }
            }
        }
        return v;
        var _a, _b;
    });
}
function combine(path1, path2) {
    return typeof path2 === "number"
        ? path1 + "[" + path2 + "]"
        : (path1 ? path1 + "." : "") + path2;
}
function isNullable(typ) {
    if (typeof typ === "string") {
        return typ !== "boolean" && typ !== "number";
    }
    else if (typ instanceof NonDeclaredType) {
        return typ.kind !== "Array" && typ.kind !== "Tuple";
    }
    else {
        var info = typeof typ.prototype[_Symbol.reflection] === "function"
            ? typ.prototype[_Symbol.reflection]() : null;
        return info ? info.nullable : true;
    }
}
function invalidate(val, typ, path) {
    throw new Error(fsFormat("%A", val) + " " + (path ? "(" + path + ")" : "") + " is not of type " + getTypeFullName(typ));
}
function needsInflate(enclosing) {
    var typ = enclosing.head;
    if (typeof typ === "string") {
        return false;
    }
    if (typ instanceof NonDeclaredType) {
        switch (typ.kind) {
            case "Option":
            case "Array":
                return typ.definition != null || needsInflate(new List$1(typ.generics, enclosing));
            case "Tuple":
                return typ.generics.some(function (x) {
                    return needsInflate(new List$1(x, enclosing));
                });
            case "GenericParam":
                return needsInflate(resolveGeneric(typ.definition, enclosing.tail));
            case "GenericType":
                return true;
            default:
                return false;
        }
    }
    return true;
}
function inflateArray(arr, enclosing, path) {
    if (!Array.isArray) {
        invalidate(arr, "array", path);
    }
    return needsInflate(enclosing)
        ? arr.map(function (x, i) { return inflate(x, enclosing, combine(path, i)); })
        : arr;
}
function inflateMap(obj, keyEnclosing, valEnclosing, path) {
    var inflateKey = keyEnclosing.head !== "string";
    var inflateVal = needsInflate(valEnclosing);
    return Object
        .getOwnPropertyNames(obj)
        .map(function (k) {
        var key = inflateKey ? inflate(JSON.parse(k), keyEnclosing, combine(path, k)) : k;
        var val = inflateVal ? inflate(obj[k], valEnclosing, combine(path, k)) : obj[k];
        return [key, val];
    });
}
function inflateList(val, enclosing, path) {
    var ar = [], li = new List$1(), cur = val, inf = needsInflate(enclosing);
    while (cur.tail != null) {
        ar.push(inf ? inflate(cur.head, enclosing, path) : cur.head);
        cur = cur.tail;
    }
    ar.reverse();
    for (var i = 0; i < ar.length; i++) {
        li = new List$1(ar[i], li);
    }
    return li;
}
function inflate(val, typ, path) {
    var enclosing = null;
    if (typ instanceof List$1) {
        enclosing = typ;
        typ = typ.head;
    }
    else {
        enclosing = new List$1(typ, new List$1());
    }
    if (val == null) {
        if (!isNullable(typ)) {
            invalidate(val, typ, path);
        }
        return val;
    }
    else if (typeof typ === "string") {
        if ((typ === "boolean" || typ === "number" || typ === "string") && (typeof val !== typ)) {
            invalidate(val, typ, path);
        }
        return val;
    }
    else if (typ instanceof NonDeclaredType) {
        switch (typ.kind) {
            case "Unit":
                return null;
            case "Option":
                return inflate(val, new List$1(typ.generics, enclosing), path);
            case "Array":
                if (typ.definition != null) {
                    return new typ.definition(val);
                }
                else {
                    return inflateArray(val, new List$1(typ.generics, enclosing), path);
                }
            case "Tuple":
                return typ.generics.map(function (x, i) {
                    return inflate(val[i], new List$1(x, enclosing), combine(path, i));
                });
            case "GenericParam":
                return inflate(val, resolveGeneric(typ.definition, enclosing.tail), path);
            case "GenericType":
                var def = typ.definition;
                if (def === List$1) {
                    return Array.isArray(val)
                        ? ofArray(inflateArray(val, resolveGeneric(0, enclosing), path))
                        : inflateList(val, resolveGeneric(0, enclosing), path);
                }
                if (def === FableSet) {
                    return create$4(inflateArray(val, resolveGeneric(0, enclosing), path));
                }
                if (def === Set) {
                    return new Set(inflateArray(val, resolveGeneric(0, enclosing), path));
                }
                if (def === FableMap) {
                    return create$3(inflateMap(val, resolveGeneric(0, enclosing), resolveGeneric(1, enclosing), path));
                }
                if (def === Map) {
                    return new Map(inflateMap(val, resolveGeneric(0, enclosing), resolveGeneric(1, enclosing), path));
                }
                return inflate(val, new List$1(typ.definition, enclosing), path);
            default:
                return val;
        }
    }
    else if (typeof typ === "function") {
        if (typ === Date) {
            return parse(val);
        }
        var info = typeof typ.prototype[_Symbol.reflection] === "function" ? typ.prototype[_Symbol.reflection]() : {};
        if (info.cases) {
            var uCase = void 0, uFields = [];
            if (typeof val === "string") {
                uCase = val;
            }
            else if (typeof val.Case === "string" && Array.isArray(val.Fields)) {
                uCase = val.Case;
                uFields = val.Fields;
            }
            else {
                var caseName = Object.getOwnPropertyNames(val)[0];
                var fieldTypes = info.cases[caseName];
                if (Array.isArray(fieldTypes)) {
                    var fields = fieldTypes.length > 1 ? val[caseName] : [val[caseName]];
                    uCase = caseName;
                    path = combine(path, caseName);
                    for (var i = 0; i < fieldTypes.length; i++) {
                        uFields.push(inflate(fields[i], new List$1(fieldTypes[i], enclosing), combine(path, i)));
                    }
                }
            }
            if (uCase in info.cases === false) {
                invalidate(val, typ, path);
            }
            return new typ(uCase, uFields);
        }
        if (info.properties) {
            var newObj = new typ();
            var properties = info.properties;
            var ks = Object.getOwnPropertyNames(properties);
            for (var i = 0; i < ks.length; i++) {
                var k = ks[i];
                newObj[k] = inflate(val[k], new List$1(properties[k], enclosing), combine(path, k));
            }
            return newObj;
        }
        return val;
    }
    throw new Error("Unexpected type when deserializing JSON: " + typ);
}
function ofJson(json, genArgs) {
    return inflate(JSON.parse(json), genArgs ? genArgs.T : null, "");
}

function _fetch(url, init) {
        return fetch(url, init).then(function (response) {
                if (response.ok) {
                        return response;
                } else {
                        throw new Error(String(response.status) + " " + response.statusText + " for URL " + response.url);
                }
        });
}







//# sourceMappingURL=Fetch.js.map

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function cleanRawJson(rawJson) {
  return replace$$1(rawJson, "@\":", "\":");
}

function fetchEntity(url, _genArgs) {
  return function (builder_) {
    return builder_.Delay(function () {
      return _fetch(url, {
        credentials: "include"
      }).then(function (_arg1) {
        return _arg1.text().then(function (_arg2) {
          return Promise.resolve(ofJson(cleanRawJson(_arg2), {
            T: _genArgs.EntityType
          }));
        });
      });
    });
  }(PromiseImpl.promise);
}

function postJson(url, jsonBody, _genArgs) {
  return function (builder_) {
    return builder_.Delay(function () {
      var body = jsonBody;
      return _fetch(url, {
        headers: _defineProperty({}, "Content-Type", "application/json"),
        method: "POST",
        credentials: "include",
        body: body
      }).then(function (_arg1) {
        return _arg1.text().then(function (_arg2) {
          return Promise.resolve(ofJson(cleanRawJson(_arg2), {
            T: _genArgs.EntityType
          }));
        });
      });
    });
  }(PromiseImpl.promise);
}

function goGet(url, msgOnSuccess, msgOnFailure, req, handler, _genArgs) {
  var json = toJson(req);

  (function (pr) {
    return pr.then(handler);
  })(function (pr_1) {
    return pr_1.then(msgOnSuccess);
  }(fetchEntity(url + "?data=" + json, {
    EntityType: _genArgs.ReturnedEntityType
  })).catch(function (err) {
    var errMsg = fsFormat("Error updating data to %s -> %s")(function (x) {
      return x;
    })(url)(err.message);
    return msgOnFailure(function () {
      var PropertyName = "Server";
      return new PropertyError("ServerUpdate", errMsg, PropertyName);
    }());
  }));
}
function postUpdate(url, msgOnSuccess, msgOnFailure, req, handler, _genArgs) {
  var json = toJson(req);

  (function (pr) {
    return pr.then(handler);
  })(function (pr_1) {
    return pr_1.then(msgOnSuccess);
  }(postJson(url, json, {
    EntityType: _genArgs.ReturnedEntityType
  })).catch(function (err) {
    var errMsg = fsFormat("Error updating data to %s -> %s")(function (x) {
      return x;
    })(url)(err.message);
    return msgOnFailure(function () {
      var PropertyName = "Server";
      return new PropertyError("ServerUpdate", errMsg, PropertyName);
    }());
  }));
}

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Msg = function () {
  function Msg(caseName, fields) {
    _classCallCheck(this, Msg);

    this.Case = caseName;
    this.Fields = fields;
  }

  _createClass(Msg, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.InTake.View.BriefsQueueView.Msg",
        interfaces: ["FSharpUnion", "System.IEquatable"],
        cases: {
          LoadRecord: [QueryRequestType],
          OpenLoanRequest: ["number"],
          RecordFailedToLoad: [PropertyError],
          RecordLoaded: [makeGeneric(Chessie.Result, {
            TSuccess: QueryType,
            TMessage: Interface("System.Collections.Generic.IEnumerable")
          })]
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsUnions(this, other);
    }
  }]);

  return Msg;
}();
setType("Lr.InTake.View.BriefsQueueView.Msg", Msg);
var ScreenType = function () {
  function ScreenType(queryModel, currentErrors) {
    _classCallCheck(this, ScreenType);

    this.QueryModel = queryModel;
    this.CurrentErrors = currentErrors;
  }

  _createClass(ScreenType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.InTake.View.BriefsQueueView.ScreenType",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          QueryModel: QueryType,
          CurrentErrors: Interface("System.Collections.Generic.IEnumerable")
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }]);

  return ScreenType;
}();
setType("Lr.InTake.View.BriefsQueueView.ScreenType", ScreenType);
var EmptyScreen = new ScreenType(EmptyQuery, new List$1());

var getRecord = function () {
  var url = "/api/BriefsQueue/GetAllForInTake";

  var msgOnSuccess = function msgOnSuccess(arg0) {
    return new Msg("RecordLoaded", [arg0]);
  };

  var msgOnFailure = function msgOnFailure(arg0_1) {
    return new Msg("RecordFailedToLoad", [arg0_1]);
  };

  return function (req) {
    return function (handler) {
      goGet(url, msgOnSuccess, msgOnFailure, req, handler);
    };
  };
}();

function InitQueryRequest() {
  return new QueryRequestType("Unkown");
}
function Load(queryRequest) {
  return getRecord(queryRequest);
}

function unwrapExports (x) {
	return x && x.__esModule ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var classCallCheck = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
});

var _classCallCheck$6 = unwrapExports(classCallCheck);

var _global = createCommonjsModule(function (module) {
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
});

var _core = createCommonjsModule(function (module) {
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
});

var _aFunction = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};

var aFunction = _aFunction;
var _ctx = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};

var _isObject = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

var isObject = _isObject;
var _anObject = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};

var _fails = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};

var _descriptors = !_fails(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});

var isObject$1 = _isObject;
var document$1 = _global.document;
var is = isObject$1(document$1) && isObject$1(document$1.createElement);
var _domCreate = function(it){
  return is ? document$1.createElement(it) : {};
};

var _ie8DomDefine = !_descriptors && !_fails(function(){
  return Object.defineProperty(_domCreate('div'), 'a', {get: function(){ return 7; }}).a != 7;
});

var isObject$2 = _isObject;
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var _toPrimitive = function(it, S){
  if(!isObject$2(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject$2(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject$2(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject$2(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};

var anObject       = _anObject;
var IE8_DOM_DEFINE = _ie8DomDefine;
var toPrimitive    = _toPrimitive;
var dP$1             = Object.defineProperty;

var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP$1(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};

var _objectDp = {
	f: f
};

var _propertyDesc = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};

var dP         = _objectDp;
var createDesc = _propertyDesc;
var _hide = _descriptors ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};

var global$1    = _global;
var core      = _core;
var ctx       = _ctx;
var hide      = _hide;
var PROTOTYPE = 'prototype';

var $export$1 = function(type, name, source){
  var IS_FORCED = type & $export$1.F
    , IS_GLOBAL = type & $export$1.G
    , IS_STATIC = type & $export$1.S
    , IS_PROTO  = type & $export$1.P
    , IS_BIND   = type & $export$1.B
    , IS_WRAP   = type & $export$1.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE]
    , target    = IS_GLOBAL ? global$1 : IS_STATIC ? global$1[name] : (global$1[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global$1)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(a, b, c){
        if(this instanceof C){
          switch(arguments.length){
            case 0: return new C;
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if(IS_PROTO){
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if(type & $export$1.R && expProto && !expProto[key])hide(expProto, key, out);
    }
  }
};
// type bitmap
$export$1.F = 1;   // forced
$export$1.G = 2;   // global
$export$1.S = 4;   // static
$export$1.P = 8;   // proto
$export$1.B = 16;  // bind
$export$1.W = 32;  // wrap
$export$1.U = 64;  // safe
$export$1.R = 128; // real proto method for `library` 
var _export = $export$1;

var $export = _export;
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !_descriptors, 'Object', {defineProperty: _objectDp.f});

var $Object = _core.Object;
var defineProperty$2 = function defineProperty(it, key, desc){
  return $Object.defineProperty(it, key, desc);
};

var defineProperty = createCommonjsModule(function (module) {
module.exports = { "default": defineProperty$2, __esModule: true };
});

var createClass = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _defineProperty = defineProperty;

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
});

var _createClass$6 = unwrapExports(createClass);

var Trampoline = (function () {
    function Trampoline() {
        this.callCount = 0;
    }
    Object.defineProperty(Trampoline, "maxTrampolineCallCount", {
        get: function () {
            return 2000;
        },
        enumerable: true,
        configurable: true
    });
    Trampoline.prototype.incrementAndCheck = function () {
        return this.callCount++ > Trampoline.maxTrampolineCallCount;
    };
    Trampoline.prototype.hijack = function (f) {
        this.callCount = 0;
        setTimeout(f, 0);
    };
    return Trampoline;
}());
function protectedCont(f) {
    return function (ctx) {
        if (ctx.cancelToken.isCancelled)
            ctx.onCancel("cancelled");
        else if (ctx.trampoline.incrementAndCheck())
            ctx.trampoline.hijack(function () {
                try {
                    f(ctx);
                }
                catch (err) {
                    ctx.onError(err);
                }
            });
        else
            try {
                f(ctx);
            }
            catch (err) {
                ctx.onError(err);
            }
    };
}
function protectedBind(computation, binder) {
    return protectedCont(function (ctx) {
        computation({
            onSuccess: function (x) {
                try {
                    binder(x)(ctx);
                }
                catch (ex) {
                    ctx.onError(ex);
                }
            },
            onError: ctx.onError,
            onCancel: ctx.onCancel,
            cancelToken: ctx.cancelToken,
            trampoline: ctx.trampoline
        });
    });
}
function protectedReturn(value) {
    return protectedCont(function (ctx) { return ctx.onSuccess(value); });
}
var AsyncBuilder = (function () {
    function AsyncBuilder() {
    }
    AsyncBuilder.prototype.Bind = function (computation, binder) {
        return protectedBind(computation, binder);
    };
    AsyncBuilder.prototype.Combine = function (computation1, computation2) {
        return this.Bind(computation1, function () { return computation2; });
    };
    AsyncBuilder.prototype.Delay = function (generator) {
        return protectedCont(function (ctx) { return generator()(ctx); });
    };
    AsyncBuilder.prototype.For = function (sequence, body) {
        var iter = sequence[Symbol.iterator]();
        var cur = iter.next();
        return this.While(function () { return !cur.done; }, this.Delay(function () {
            var res = body(cur.value);
            cur = iter.next();
            return res;
        }));
    };
    AsyncBuilder.prototype.Return = function (value) {
        return protectedReturn(value);
    };
    AsyncBuilder.prototype.ReturnFrom = function (computation) {
        return computation;
    };
    AsyncBuilder.prototype.TryFinally = function (computation, compensation) {
        return protectedCont(function (ctx) {
            computation({
                onSuccess: function (x) {
                    compensation();
                    ctx.onSuccess(x);
                },
                onError: function (x) {
                    compensation();
                    ctx.onError(x);
                },
                onCancel: function (x) {
                    compensation();
                    ctx.onCancel(x);
                },
                cancelToken: ctx.cancelToken,
                trampoline: ctx.trampoline
            });
        });
    };
    AsyncBuilder.prototype.TryWith = function (computation, catchHandler) {
        return protectedCont(function (ctx) {
            computation({
                onSuccess: ctx.onSuccess,
                onCancel: ctx.onCancel,
                cancelToken: ctx.cancelToken,
                trampoline: ctx.trampoline,
                onError: function (ex) {
                    try {
                        catchHandler(ex)(ctx);
                    }
                    catch (ex2) {
                        ctx.onError(ex2);
                    }
                }
            });
        });
    };
    AsyncBuilder.prototype.Using = function (resource, binder) {
        return this.TryFinally(binder(resource), function () { return resource.Dispose(); });
    };
    AsyncBuilder.prototype.While = function (guard, computation) {
        var _this = this;
        if (guard())
            return this.Bind(computation, function () { return _this.While(guard, computation); });
        else
            return this.Return(void 0);
    };
    AsyncBuilder.prototype.Zero = function () {
        return protectedCont(function (ctx) { return ctx.onSuccess(void 0); });
    };
    return AsyncBuilder;
}());
var singleton$2 = new AsyncBuilder();

function emptyContinuation(x) {
}


var defaultCancellationToken = { isCancelled: false };
function catchAsync(work) {
    return protectedCont(function (ctx) {
        work({
            onSuccess: function (x) { return ctx.onSuccess(choice1Of2(x)); },
            onError: function (ex) { return ctx.onSuccess(choice2Of2(ex)); },
            onCancel: ctx.onCancel,
            cancelToken: ctx.cancelToken,
            trampoline: ctx.trampoline
        });
    });
}
function fromContinuations(f) {
    return protectedCont(function (ctx) { return f([ctx.onSuccess, ctx.onError, ctx.onCancel]); });
}



function start(computation, cancellationToken) {
    return startWithContinuations(computation, cancellationToken);
}
function startImmediate(computation, cancellationToken) {
    return start(computation, cancellationToken);
}
function startWithContinuations(computation, continuation, exceptionContinuation, cancellationContinuation, cancelToken) {
    if (typeof continuation !== "function") {
        cancelToken = continuation;
        continuation = null;
    }
    var trampoline = new Trampoline();
    computation({
        onSuccess: continuation ? continuation : emptyContinuation,
        onError: exceptionContinuation ? exceptionContinuation : emptyContinuation,
        onCancel: cancellationContinuation ? cancellationContinuation : emptyContinuation,
        cancelToken: cancelToken ? cancelToken : defaultCancellationToken,
        trampoline: trampoline
    });
}

var QueueCell = (function () {
    function QueueCell(message) {
        this.value = message;
    }
    return QueueCell;
}());
var MailboxQueue = (function () {
    function MailboxQueue() {
    }
    MailboxQueue.prototype.add = function (message) {
        var itCell = new QueueCell(message);
        if (this.firstAndLast) {
            this.firstAndLast[1].next = itCell;
            this.firstAndLast = [this.firstAndLast[0], itCell];
        }
        else
            this.firstAndLast = [itCell, itCell];
    };
    MailboxQueue.prototype.tryGet = function () {
        if (this.firstAndLast) {
            var value = this.firstAndLast[0].value;
            if (this.firstAndLast[0].next)
                this.firstAndLast = [this.firstAndLast[0].next, this.firstAndLast[1]];
            else
                delete this.firstAndLast;
            return value;
        }
        return void 0;
    };
    return MailboxQueue;
}());
var MailboxProcessor = (function () {
    function MailboxProcessor(body, cancellationToken$$1) {
        this.body = body;
        this.cancellationToken = cancellationToken$$1 || defaultCancellationToken;
        this.messages = new MailboxQueue();
    }
    MailboxProcessor.prototype.__processEvents = function () {
        if (this.continuation) {
            var value = this.messages.tryGet();
            if (value) {
                var cont = this.continuation;
                delete this.continuation;
                cont(value);
            }
        }
    };
    MailboxProcessor.prototype.start = function () {
        startImmediate(this.body(this), this.cancellationToken);
    };
    MailboxProcessor.prototype.receive = function () {
        var _this = this;
        return fromContinuations(function (conts) {
            if (_this.continuation)
                throw new Error("Receive can only be called once!");
            _this.continuation = conts[0];
            _this.__processEvents();
        });
    };
    MailboxProcessor.prototype.post = function (message) {
        this.messages.add(message);
        this.__processEvents();
    };
    MailboxProcessor.prototype.postAndAsyncReply = function (buildMessage) {
        var result;
        var continuation;
        function checkCompletion() {
            if (result && continuation)
                continuation(result);
        }
        var reply = {
            reply: function (res) {
                result = res;
                checkCompletion();
            }
        };
        this.messages.add(buildMessage(reply));
        this.__processEvents();
        return fromContinuations(function (conts) {
            continuation = conts[0];
            checkCompletion();
        });
    };
    return MailboxProcessor;
}());
function start$1(body, cancellationToken$$1) {
    var mbox = new MailboxProcessor(body, cancellationToken$$1);
    mbox.start();
    return mbox;
}

var CmdModule = function (__exports) {
    var none = __exports.none = function () {
        return new List$1();
    };

    var ofMsg = __exports.ofMsg = function (msg) {
        return ofArray([function (dispatch) {
            dispatch(msg);
        }]);
    };

    var map$$2 = __exports.map = function (f, cmd) {
        return map$$1(function (g) {
            return function ($var2) {
                return g(function (post) {
                    return function ($var1) {
                        return post(f($var1));
                    };
                }($var2));
            };
        }, cmd);
    };

    var batch = __exports.batch = function (cmds) {
        return collect$$1(function (x) {
            return x;
        }, cmds);
    };

    var ofAsync = __exports.ofAsync = function (task, arg, ofSuccess, ofError) {
        var bind = function bind(dispatch) {
            return function (builder_) {
                return builder_.Delay(function () {
                    return builder_.Bind(catchAsync(task(arg)), function (_arg1) {
                        dispatch(_arg1.Case === "Choice2Of2" ? ofError(_arg1.Fields[0]) : ofSuccess(_arg1.Fields[0]));
                        return builder_.Zero();
                    });
                });
            }(singleton$2);
        };

        return ofArray([function ($var3) {
            return function (arg00) {
                startImmediate(arg00);
            }(bind($var3));
        }]);
    };

    var ofFunc = __exports.ofFunc = function (task, arg, ofSuccess, ofError) {
        var bind = function bind(dispatch) {
            try {
                (function ($var4) {
                    return dispatch(ofSuccess($var4));
                })(task(arg));
            } catch (x) {
                (function ($var5) {
                    return dispatch(ofError($var5));
                })(x);
            }
        };

        return ofArray([bind]);
    };

    var ofSub = __exports.ofSub = function (sub) {
        return ofArray([sub]);
    };

    var ofPromise = __exports.ofPromise = function (task, arg, ofSuccess, ofError) {
        var bind = function bind(dispatch) {
            task(arg).then(function ($var7) {
                return dispatch(ofSuccess($var7));
            }).catch(function ($var6) {
                return dispatch(ofError($var6));
            });
        };

        return ofArray([bind]);
    };

    return __exports;
}({});
var Program = function () {
    function Program(init, update, subscribe, view, setState, onError) {
        _classCallCheck$6(this, Program);

        this.init = init;
        this.update = update;
        this.subscribe = subscribe;
        this.view = view;
        this.setState = setState;
        this.onError = onError;
    }

    _createClass$6(Program, [{
        key: _Symbol.reflection,
        value: function () {
            return {
                type: "Elmish.Program",
                interfaces: ["FSharpRecord"],
                properties: {
                    init: "function",
                    update: "function",
                    subscribe: "function",
                    view: "function",
                    setState: "function",
                    onError: "function"
                }
            };
        }
    }]);

    return Program;
}();
setType("Elmish.Program", Program);
var ProgramModule = function (__exports) {
    var onError = __exports.onError = function (text, ex) {
        console.error(text, ex);
    };

    var mkProgram = __exports.mkProgram = function (init, update, view) {
        var setState = function setState(model) {
            return function ($var8) {
                return function (value) {
                    value;
                }(view(model)($var8));
            };
        };

        return new Program(init, update, function (_arg1) {
            return CmdModule.none();
        }, view, setState, function (tupledArg) {
            onError(tupledArg[0], tupledArg[1]);
        });
    };

    var mkSimple = __exports.mkSimple = function (init, update, view) {
        var init_1 = function init_1($var9) {
            return function (state) {
                return [state, CmdModule.none()];
            }(init($var9));
        };

        var update_1 = function update_1(msg) {
            return function ($var10) {
                return function (state) {
                    return [state, CmdModule.none()];
                }(update(msg)($var10));
            };
        };

        var setState = function setState(model) {
            return function ($var11) {
                return function (value) {
                    value;
                }(view(model)($var11));
            };
        };

        return new Program(init_1, update_1, function (_arg1) {
            return CmdModule.none();
        }, view, setState, function (tupledArg) {
            onError(tupledArg[0], tupledArg[1]);
        });
    };

    var withSubscription = __exports.withSubscription = function (subscribe, program) {
        return new Program(program.init, program.update, subscribe, program.view, program.setState, program.onError);
    };

    var withConsoleTrace = __exports.withConsoleTrace = function (program) {
        var trace = function trace(text) {
            return function (msg) {
                return function (model) {
                    console.log(text, model, msg);
                    return program.update(msg)(model);
                };
            };
        };

        var update = trace("Updating:");
        return new Program(program.init, update, program.subscribe, program.view, program.setState, program.onError);
    };

    var withTrace = __exports.withTrace = function (program, trace) {
        var update = function update(msg) {
            return function (model) {
                trace(msg)(model);
                return program.update(msg)(model);
            };
        };

        return new Program(program.init, update, program.subscribe, program.view, program.setState, program.onError);
    };

    var runWith = __exports.runWith = function (arg, program) {
        var patternInput = program.init(arg);
        var inbox = start$1(function (mb) {
            var loop = function loop(state) {
                return function (builder_) {
                    return builder_.Delay(function () {
                        return builder_.Bind(mb.receive(), function (_arg1) {
                            return builder_.TryWith(builder_.Delay(function () {
                                var patternInput_1 = program.update(_arg1)(state);
                                program.setState(patternInput_1[0])(function (arg00) {
                                    mb.post(arg00);
                                });
                                iterate(function (sub) {
                                    sub(function (arg00) {
                                        mb.post(arg00);
                                    });
                                }, patternInput_1[1]);
                                return builder_.ReturnFrom(loop(patternInput_1[0]));
                            }), function (_arg2) {
                                program.onError(["Unable to process a message:", _arg2]);
                                return builder_.ReturnFrom(loop(state));
                            });
                        });
                    });
                }(singleton$2);
            };

            return loop(patternInput[0]);
        });
        program.setState(patternInput[0])(function (arg00) {
            inbox.post(arg00);
        });
        iterate(function (sub) {
            sub(function (arg00) {
                inbox.post(arg00);
            });
        }, append$$1(program.subscribe(patternInput[0]), patternInput[1]));
    };

    var run = __exports.run = function (program) {
        runWith(null, program);
    };

    return __exports;
}({});
//# sourceMappingURL=elmish.js.map

// 7.2.1 RequireObjectCoercible(argument)
var _defined = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};

var defined = _defined;
var _toObject = function(it){
  return Object(defined(it));
};

var hasOwnProperty = {}.hasOwnProperty;
var _has = function(it, key){
  return hasOwnProperty.call(it, key);
};

var global$2 = _global;
var SHARED = '__core-js_shared__';
var store  = global$2[SHARED] || (global$2[SHARED] = {});
var _shared = function(key){
  return store[key] || (store[key] = {});
};

var id = 0;
var px = Math.random();
var _uid = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

var shared = _shared('keys');
var uid    = _uid;
var _sharedKey = function(key){
  return shared[key] || (shared[key] = uid(key));
};

var has         = _has;
var toObject$1    = _toObject;
var IE_PROTO    = _sharedKey('IE_PROTO');
var ObjectProto = Object.prototype;

var _objectGpo = Object.getPrototypeOf || function(O){
  O = toObject$1(O);
  if(has(O, IE_PROTO))return O[IE_PROTO];
  if(typeof O.constructor == 'function' && O instanceof O.constructor){
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

var $export$2 = _export;
var core$1    = _core;
var fails   = _fails;
var _objectSap = function(KEY, exec){
  var fn  = (core$1.Object || {})[KEY] || Object[KEY]
    , exp = {};
  exp[KEY] = exec(fn);
  $export$2($export$2.S + $export$2.F * fails(function(){ fn(1); }), 'Object', exp);
};

var toObject        = _toObject;
var $getPrototypeOf = _objectGpo;

_objectSap('getPrototypeOf', function(){
  return function getPrototypeOf(it){
    return $getPrototypeOf(toObject(it));
  };
});

var getPrototypeOf$1 = _core.Object.getPrototypeOf;

var getPrototypeOf = createCommonjsModule(function (module) {
module.exports = { "default": getPrototypeOf$1, __esModule: true };
});

var _Object$getPrototypeOf = unwrapExports(getPrototypeOf);

// 7.1.4 ToInteger
var ceil  = Math.ceil;
var floor = Math.floor;
var _toInteger = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

var toInteger = _toInteger;
var defined$1   = _defined;
// true  -> String#at
// false -> String#codePointAt
var _stringAt = function(TO_STRING){
  return function(that, pos){
    var s = String(defined$1(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

var _library = true;

var _redefine = _hide;

var _iterators = {};

var toString$1 = {}.toString;

var _cof = function(it){
  return toString$1.call(it).slice(8, -1);
};

var cof = _cof;
var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};

var IObject = _iobject;
var defined$2 = _defined;
var _toIobject = function(it){
  return IObject(defined$2(it));
};

var toInteger$1 = _toInteger;
var min$1       = Math.min;
var _toLength = function(it){
  return it > 0 ? min$1(toInteger$1(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

var toInteger$2 = _toInteger;
var max$1       = Math.max;
var min$2       = Math.min;
var _toIndex = function(index, length){
  index = toInteger$2(index);
  return index < 0 ? max$1(index + length, 0) : min$2(index, length);
};

var toIObject$1 = _toIobject;
var toLength  = _toLength;
var toIndex   = _toIndex;
var _arrayIncludes = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject$1($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var has$2          = _has;
var toIObject    = _toIobject;
var arrayIndexOf = _arrayIncludes(false);
var IE_PROTO$2     = _sharedKey('IE_PROTO');

var _objectKeysInternal = function(object, names){
  var O      = toIObject(object)
    , i      = 0
    , result = []
    , key;
  for(key in O)if(key != IE_PROTO$2)has$2(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while(names.length > i)if(has$2(O, key = names[i++])){
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

// IE 8- don't enum bug keys
var _enumBugKeys = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

var $keys       = _objectKeysInternal;
var enumBugKeys$1 = _enumBugKeys;

var _objectKeys = Object.keys || function keys(O){
  return $keys(O, enumBugKeys$1);
};

var dP$2       = _objectDp;
var anObject$2 = _anObject;
var getKeys  = _objectKeys;

var _objectDps = _descriptors ? Object.defineProperties : function defineProperties(O, Properties){
  anObject$2(O);
  var keys   = getKeys(Properties)
    , length = keys.length
    , i = 0
    , P;
  while(length > i)dP$2.f(O, P = keys[i++], Properties[P]);
  return O;
};

var _html = _global.document && document.documentElement;

var anObject$1    = _anObject;
var dPs         = _objectDps;
var enumBugKeys = _enumBugKeys;
var IE_PROTO$1    = _sharedKey('IE_PROTO');
var Empty       = function(){ /* empty */ };
var PROTOTYPE$1   = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = _domCreate('iframe')
    , i      = enumBugKeys.length
    , lt     = '<'
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  _html.appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict[PROTOTYPE$1][enumBugKeys[i]];
  return createDict();
};

var _objectCreate = Object.create || function create(O, Properties){
  var result;
  if(O !== null){
    Empty[PROTOTYPE$1] = anObject$1(O);
    result = new Empty;
    Empty[PROTOTYPE$1] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO$1] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

var _wks = createCommonjsModule(function (module) {
var store      = _shared('wks')
  , uid        = _uid
  , Symbol     = _global.Symbol
  , USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function(name){
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;
});

var def = _objectDp.f;
var has$3 = _has;
var TAG = _wks('toStringTag');

var _setToStringTag = function(it, tag, stat){
  if(it && !has$3(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};

var create$5         = _objectCreate;
var descriptor     = _propertyDesc;
var setToStringTag$1 = _setToStringTag;
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
_hide(IteratorPrototype, _wks('iterator'), function(){ return this; });

var _iterCreate = function(Constructor, NAME, next){
  Constructor.prototype = create$5(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag$1(Constructor, NAME + ' Iterator');
};

var LIBRARY        = _library;
var $export$3        = _export;
var redefine       = _redefine;
var hide$1           = _hide;
var has$1            = _has;
var Iterators      = _iterators;
var $iterCreate    = _iterCreate;
var setToStringTag = _setToStringTag;
var getPrototypeOf$3 = _objectGpo;
var ITERATOR       = _wks('iterator');
var BUGGY          = !([].keys && 'next' in [].keys());
var FF_ITERATOR    = '@@iterator';
var KEYS           = 'keys';
var VALUES         = 'values';

var returnThis = function(){ return this; };

var _iterDefine = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
    , methods, key, IteratorPrototype;
  // Fix native
  if($anyNative){
    IteratorPrototype = getPrototypeOf$3($anyNative.call(new Base));
    if(IteratorPrototype !== Object.prototype){
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if(!LIBRARY && !has$1(IteratorPrototype, ITERATOR))hide$1(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if(DEF_VALUES && $native && $native.name !== VALUES){
    VALUES_BUG = true;
    $default = function values(){ return $native.call(this); };
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide$1(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES ? $default : getMethod(VALUES),
      keys:    IS_SET     ? $default : getMethod(KEYS),
      entries: $entries
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export$3($export$3.P + $export$3.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

var $at  = _stringAt(true);

// 21.1.3.27 String.prototype[@@iterator]()
_iterDefine(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});

var _addToUnscopables = function(){ /* empty */ };

var _iterStep = function(done, value){
  return {value: value, done: !!done};
};

var addToUnscopables = _addToUnscopables;
var step             = _iterStep;
var Iterators$2        = _iterators;
var toIObject$2        = _toIobject;

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
var es6_array_iterator = _iterDefine(Array, 'Array', function(iterated, kind){
  this._t = toIObject$2(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators$2.Arguments = Iterators$2.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

var global$3        = _global;
var hide$2          = _hide;
var Iterators$1     = _iterators;
var TO_STRING_TAG = _wks('toStringTag');

for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
  var NAME       = collections[i]
    , Collection = global$3[NAME]
    , proto      = Collection && Collection.prototype;
  if(proto && !proto[TO_STRING_TAG])hide$2(proto, TO_STRING_TAG, NAME);
  Iterators$1[NAME] = Iterators$1.Array;
}

var f$1 = _wks;

var _wksExt = {
	f: f$1
};

var iterator$2 = _wksExt.f('iterator');

var iterator = createCommonjsModule(function (module) {
module.exports = { "default": iterator$2, __esModule: true };
});

var _meta = createCommonjsModule(function (module) {
var META     = _uid('meta')
  , isObject = _isObject
  , has      = _has
  , setDesc  = _objectDp.f
  , id       = 0;
var isExtensible = Object.isExtensible || function(){
  return true;
};
var FREEZE = !_fails(function(){
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function(it){
  setDesc(it, META, {value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  }});
};
var fastKey = function(it, create){
  // return primitive with prefix
  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return 'F';
    // not necessary to add metadata
    if(!create)return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function(it, create){
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return true;
    // not necessary to add metadata
    if(!create)return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function(it){
  if(FREEZE && meta.NEED && isExtensible(it) && !has(it, META))setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY:      META,
  NEED:     false,
  fastKey:  fastKey,
  getWeak:  getWeak,
  onFreeze: onFreeze
};
});

var global$5         = _global;
var core$2           = _core;
var LIBRARY$1        = _library;
var wksExt$1         = _wksExt;
var defineProperty$4 = _objectDp.f;
var _wksDefine = function(name){
  var $Symbol = core$2.Symbol || (core$2.Symbol = LIBRARY$1 ? {} : global$5.Symbol || {});
  if(name.charAt(0) != '_' && !(name in $Symbol))defineProperty$4($Symbol, name, {value: wksExt$1.f(name)});
};

var getKeys$1   = _objectKeys;
var toIObject$4 = _toIobject;
var _keyof = function(object, el){
  var O      = toIObject$4(object)
    , keys   = getKeys$1(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};

var f$2 = Object.getOwnPropertySymbols;

var _objectGops = {
	f: f$2
};

var f$3 = {}.propertyIsEnumerable;

var _objectPie = {
	f: f$3
};

var getKeys$2 = _objectKeys;
var gOPS    = _objectGops;
var pIE     = _objectPie;
var _enumKeys = function(it){
  var result     = getKeys$2(it)
    , getSymbols = gOPS.f;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = pIE.f
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))result.push(key);
  } return result;
};

var cof$1 = _cof;
var _isArray = Array.isArray || function isArray(arg){
  return cof$1(arg) == 'Array';
};

var $keys$2      = _objectKeysInternal;
var hiddenKeys = _enumBugKeys.concat('length', 'prototype');

var f$5 = Object.getOwnPropertyNames || function getOwnPropertyNames(O){
  return $keys$2(O, hiddenKeys);
};

var _objectGopn = {
	f: f$5
};

var toIObject$5 = _toIobject;
var gOPN$1      = _objectGopn.f;
var toString$2  = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function(it){
  try {
    return gOPN$1(it);
  } catch(e){
    return windowNames.slice();
  }
};

var f$4 = function getOwnPropertyNames(it){
  return windowNames && toString$2.call(it) == '[object Window]' ? getWindowNames(it) : gOPN$1(toIObject$5(it));
};

var _objectGopnExt = {
	f: f$4
};

var pIE$1            = _objectPie;
var createDesc$2     = _propertyDesc;
var toIObject$6      = _toIobject;
var toPrimitive$2    = _toPrimitive;
var has$5            = _has;
var IE8_DOM_DEFINE$1 = _ie8DomDefine;
var gOPD$1           = Object.getOwnPropertyDescriptor;

var f$6 = _descriptors ? gOPD$1 : function getOwnPropertyDescriptor(O, P){
  O = toIObject$6(O);
  P = toPrimitive$2(P, true);
  if(IE8_DOM_DEFINE$1)try {
    return gOPD$1(O, P);
  } catch(e){ /* empty */ }
  if(has$5(O, P))return createDesc$2(!pIE$1.f.call(O, P), O[P]);
};

var _objectGopd = {
	f: f$6
};

var global$4         = _global;
var has$4            = _has;
var DESCRIPTORS    = _descriptors;
var $export$4        = _export;
var redefine$1       = _redefine;
var META           = _meta.KEY;
var $fails         = _fails;
var shared$1         = _shared;
var setToStringTag$2 = _setToStringTag;
var uid$1            = _uid;
var wks            = _wks;
var wksExt         = _wksExt;
var wksDefine      = _wksDefine;
var keyOf          = _keyof;
var enumKeys       = _enumKeys;
var isArray$1        = _isArray;
var anObject$3       = _anObject;
var toIObject$3      = _toIobject;
var toPrimitive$1    = _toPrimitive;
var createDesc$1     = _propertyDesc;
var _create        = _objectCreate;
var gOPNExt        = _objectGopnExt;
var $GOPD          = _objectGopd;
var $DP            = _objectDp;
var $keys$1          = _objectKeys;
var gOPD           = $GOPD.f;
var dP$3             = $DP.f;
var gOPN           = gOPNExt.f;
var $Symbol        = global$4.Symbol;
var $JSON          = global$4.JSON;
var _stringify     = $JSON && $JSON.stringify;
var PROTOTYPE$2      = 'prototype';
var HIDDEN         = wks('_hidden');
var TO_PRIMITIVE   = wks('toPrimitive');
var isEnum         = {}.propertyIsEnumerable;
var SymbolRegistry = shared$1('symbol-registry');
var AllSymbols     = shared$1('symbols');
var OPSymbols      = shared$1('op-symbols');
var ObjectProto$1    = Object[PROTOTYPE$2];
var USE_NATIVE     = typeof $Symbol == 'function';
var QObject        = global$4.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE$2] || !QObject[PROTOTYPE$2].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function(){
  return _create(dP$3({}, 'a', {
    get: function(){ return dP$3(this, 'a', {value: 7}).a; }
  })).a != 7;
}) ? function(it, key, D){
  var protoDesc = gOPD(ObjectProto$1, key);
  if(protoDesc)delete ObjectProto$1[key];
  dP$3(it, key, D);
  if(protoDesc && it !== ObjectProto$1)dP$3(ObjectProto$1, key, protoDesc);
} : dP$3;

var wrap = function(tag){
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE$2]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function(it){
  return typeof it == 'symbol';
} : function(it){
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D){
  if(it === ObjectProto$1)$defineProperty(OPSymbols, key, D);
  anObject$3(it);
  key = toPrimitive$1(key, true);
  anObject$3(D);
  if(has$4(AllSymbols, key)){
    if(!D.enumerable){
      if(!has$4(it, HIDDEN))dP$3(it, HIDDEN, createDesc$1(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has$4(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc$1(0, false)});
    } return setSymbolDesc(it, key, D);
  } return dP$3(it, key, D);
};
var $defineProperties = function defineProperties(it, P){
  anObject$3(it);
  var keys = enumKeys(P = toIObject$3(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P){
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key){
  var E = isEnum.call(this, key = toPrimitive$1(key, true));
  if(this === ObjectProto$1 && has$4(AllSymbols, key) && !has$4(OPSymbols, key))return false;
  return E || !has$4(this, key) || !has$4(AllSymbols, key) || has$4(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
  it  = toIObject$3(it);
  key = toPrimitive$1(key, true);
  if(it === ObjectProto$1 && has$4(AllSymbols, key) && !has$4(OPSymbols, key))return;
  var D = gOPD(it, key);
  if(D && has$4(AllSymbols, key) && !(has$4(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it){
  var names  = gOPN(toIObject$3(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i){
    if(!has$4(AllSymbols, key = names[i++]) && key != HIDDEN && key != META)result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
  var IS_OP  = it === ObjectProto$1
    , names  = gOPN(IS_OP ? OPSymbols : toIObject$3(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i){
    if(has$4(AllSymbols, key = names[i++]) && (IS_OP ? has$4(ObjectProto$1, key) : true))result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if(!USE_NATIVE){
  $Symbol = function Symbol(){
    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor!');
    var tag = uid$1(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function(value){
      if(this === ObjectProto$1)$set.call(OPSymbols, value);
      if(has$4(this, HIDDEN) && has$4(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc$1(1, value));
    };
    if(DESCRIPTORS && setter)setSymbolDesc(ObjectProto$1, tag, {configurable: true, set: $set});
    return wrap(tag);
  };
  redefine$1($Symbol[PROTOTYPE$2], 'toString', function toString(){
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f   = $defineProperty;
  _objectGopn.f = gOPNExt.f = $getOwnPropertyNames;
  _objectPie.f  = $propertyIsEnumerable;
  _objectGops.f = $getOwnPropertySymbols;

  if(DESCRIPTORS && !_library){
    redefine$1(ObjectProto$1, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function(name){
    return wrap(wks(name));
  };
}

$export$4($export$4.G + $export$4.W + $export$4.F * !USE_NATIVE, {Symbol: $Symbol});

for(var symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), i$1 = 0; symbols.length > i$1; )wks(symbols[i$1++]);

for(var symbols = $keys$1(wks.store), i$1 = 0; symbols.length > i$1; )wksDefine(symbols[i$1++]);

$export$4($export$4.S + $export$4.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has$4(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    if(isSymbol(key))return keyOf(SymbolRegistry, key);
    throw TypeError(key + ' is not a symbol!');
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
});

$export$4($export$4.S + $export$4.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export$4($export$4.S + $export$4.F * (!USE_NATIVE || $fails(function(){
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it){
    if(it === undefined || isSymbol(it))return; // IE8 returns string on undefined
    var args = [it]
      , i    = 1
      , replacer, $replacer;
    while(arguments.length > i)args.push(arguments[i++]);
    replacer = args[1];
    if(typeof replacer == 'function')$replacer = replacer;
    if($replacer || !isArray$1(replacer))replacer = function(key, value){
      if($replacer)value = $replacer.call(this, key, value);
      if(!isSymbol(value))return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE$2][TO_PRIMITIVE] || _hide($Symbol[PROTOTYPE$2], TO_PRIMITIVE, $Symbol[PROTOTYPE$2].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag$2($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag$2(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag$2(global$4.JSON, 'JSON', true);

_wksDefine('asyncIterator');

_wksDefine('observable');

var index = _core.Symbol;

var symbol = createCommonjsModule(function (module) {
module.exports = { "default": index, __esModule: true };
});

var _typeof_1 = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _iterator = iterator;

var _iterator2 = _interopRequireDefault(_iterator);

var _symbol = symbol;

var _symbol2 = _interopRequireDefault(_symbol);

var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = typeof _symbol2.default === "function" && _typeof(_iterator2.default) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof(obj);
} : function (obj) {
  return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
};
});

var possibleConstructorReturn = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _typeof2 = _typeof_1;

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && ((typeof call === "undefined" ? "undefined" : (0, _typeof3.default)(call)) === "object" || typeof call === "function") ? call : self;
};
});

var _possibleConstructorReturn = unwrapExports(possibleConstructorReturn);

var isObject$3 = _isObject;
var anObject$4 = _anObject;
var check = function(O, proto){
  anObject$4(O);
  if(!isObject$3(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
var _setProto = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = _ctx(Function.call, _objectGopd.f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};

var $export$5 = _export;
$export$5($export$5.S, 'Object', {setPrototypeOf: _setProto.set});

var setPrototypeOf$2 = _core.Object.setPrototypeOf;

var setPrototypeOf = createCommonjsModule(function (module) {
module.exports = { "default": setPrototypeOf$2, __esModule: true };
});

var $export$6 = _export;
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export$6($export$6.S, 'Object', {create: _objectCreate});

var $Object$1 = _core.Object;
var create$8 = function create(P, D){
  return $Object$1.create(P, D);
};

var create$6 = createCommonjsModule(function (module) {
module.exports = { "default": create$8, __esModule: true };
});

var inherits = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _setPrototypeOf = setPrototypeOf;

var _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);

var _create = create$6;

var _create2 = _interopRequireDefault(_create);

var _typeof2 = _typeof_1;

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : (0, _typeof3.default)(superClass)));
  }

  subClass.prototype = (0, _create2.default)(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf2.default ? (0, _setPrototypeOf2.default)(subClass, superClass) : subClass.__proto__ = superClass;
};
});

var _inherits = unwrapExports(inherits);

var Components = function (__exports) {
    var LazyView = __exports.LazyView = function (_Component) {
        _inherits(LazyView, _Component);

        _createClass$6(LazyView, [{
            key: _Symbol.reflection,
            value: function () {
                return extendInfo(LazyView, {
                    type: "Elmish.React.Components.LazyView",
                    interfaces: [],
                    properties: {}
                });
            }
        }]);

        function LazyView(props) {
            _classCallCheck$6(this, LazyView);

            var _this = _possibleConstructorReturn(this, (LazyView.__proto__ || _Object$getPrototypeOf(LazyView)).call(this, props));

            return _this;
        }

        _createClass$6(LazyView, [{
            key: "shouldComponentUpdate",
            value: function (nextProps, nextState, nextContext) {
                return !this.props.equal(this.props.model)(nextProps.model);
            }
        }, {
            key: "render",
            value: function () {
                return this.props.render(null);
            }
        }]);

        return LazyView;
    }(react.Component);

    setType("Elmish.React.Components.LazyView", LazyView);
    return __exports;
}({});
var Common = function (__exports) {
    var lazyViewWith = __exports.lazyViewWith = function (equal, view, state) {
        return react.createElement(Components.LazyView, function () {
            var render$$1 = function render$$1() {
                return view(state);
            };

            return {
                model: state,
                render: render$$1,
                equal: equal
            };
        }());
    };

    var lazyView2With = __exports.lazyView2With = function (equal, view, state, dispatch) {
        return react.createElement(Components.LazyView, function () {
            var render$$1 = function render$$1() {
                return view(state)(dispatch);
            };

            return {
                model: state,
                render: render$$1,
                equal: equal
            };
        }());
    };

    var lazyView3With = __exports.lazyView3With = function (equal, view, state1, state2, dispatch) {
        return react.createElement(Components.LazyView, function () {
            var render$$1 = function render$$1() {
                return view(state1)(state2)(dispatch);
            };

            return {
                model: [state1, state2],
                render: render$$1,
                equal: equal
            };
        }());
    };

    var lazyView = __exports.lazyView = function (view) {
        var equal = function equal(x) {
            return function (y) {
                return equals(x, y);
            };
        };

        return function (state) {
            return lazyViewWith(equal, view, state);
        };
    };

    var lazyView2 = __exports.lazyView2 = function (view) {
        var equal = function equal(x) {
            return function (y) {
                return equals(x, y);
            };
        };

        return function (state) {
            return function (dispatch) {
                return lazyView2With(equal, view, state, dispatch);
            };
        };
    };

    var lazyView3 = __exports.lazyView3 = function (view) {
        var equal = function equal(x) {
            return function (y) {
                return equals(x, y);
            };
        };

        return function (state1) {
            return function (state2) {
                return function (dispatch) {
                    return lazyView3With(equal, view, state1, state2, dispatch);
                };
            };
        };
    };

    return __exports;
}({});
//# sourceMappingURL=common.js.map

function withReact(placeholderId, program) {
    var lastRequest = null;

    var setState = function setState(model) {
        return function (dispatch) {
            if (lastRequest != null) {
                var r = lastRequest;
                window.cancelAnimationFrame(r);
            }

            lastRequest = window.requestAnimationFrame(function (_arg1) {
                reactDom.render(Common.lazyView2With(function (x) {
                    return function (y) {
                        return x === y;
                    };
                }, program.view, model, dispatch), document.getElementById(placeholderId));
            });
        };
    };

    return new Program(program.init, program.update, program.subscribe, program.view, setState, program.onError);
}
//# sourceMappingURL=react.js.map

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function viewQueueItem(item$$1) {
  return react.createElement("div", {
    className: "queue-item-container"
  }, react.createElement("div", {
    className: "queue-item"
  }, react.createElement("div", {}, item$$1.CompanyTaxId), react.createElement("div", {}, item$$1.CompanyName), react.createElement("div", {}, item$$1.CreatedBy), react.createElement("div", {}, toShortDateString(item$$1.ModifiedOn)), react.createElement("div", {}, item$$1.LrId), react.createElement("div", {}, item$$1.AmountRequested)));
}
function viewQueue(queue) {
  return react.createElement.apply(undefined, ["div", {
    className: "queue-container"
  }].concat(_toConsumableArray(toList(function (source) {
    return map$1(function (item$$1) {
      return viewQueueItem(item$$1);
    }, source);
  }(queue)))));
}
function View(screen, msgSender) {
  return react.createElement("div", {
    className: "briefs-queue-screen"
  }, viewQueue(screen.QueryModel.SubmittedByOfficer));
}

function update(appMsg, screen) {
  if (appMsg.Case === "RecordLoaded") {
    if (appMsg.Fields[0].Case === "Bad") {
      return [function () {
        var CurrentErrors = appMsg.Fields[0].Fields[0].head;
        return new ScreenType(screen.QueryModel, CurrentErrors);
      }(), new List$1()];
    } else {
      return [new ScreenType(appMsg.Fields[0].Fields[0], screen.CurrentErrors), new List$1()];
    }
  } else if (appMsg.Case === "RecordFailedToLoad") {
    return [function () {
      var CurrentErrors_1 = ofArray([appMsg.Fields[0]]);
      return new ScreenType(screen.QueryModel, CurrentErrors_1);
    }(), new List$1()];
  } else if (appMsg.Case === "OpenLoanRequest") {
    return [screen, new List$1()];
  } else {
    return [screen, ofArray([Load(appMsg.Fields[0])])];
  }
}
var emptyModel = EmptyScreen;
function init(paramQry) {
  return [emptyModel, ofArray([Load(paramQry)])];
}

function RunScreen(divId, qryParams) {
  var paramQry = InitQueryRequest();
  ProgramModule.run(function (program) {
    return withReact(divId, program);
  }(ProgramModule.mkProgram(function () {
    return init(paramQry, null);
  }, function (appMsg) {
    return function (screen) {
      return update(appMsg, screen);
    };
  }, function (screen_1) {
    return function (msgSender) {
      return View(screen_1, msgSender);
    };
  })));
}

var _createClass$10 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$10(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BzProp = function () {
  function BzProp(caseName, fields) {
    _classCallCheck$10(this, BzProp);

    this.Case = caseName;
    this.Fields = fields;
  }

  _createClass$10(BzProp, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.BzProp",
        interfaces: ["FSharpUnion", "System.IEquatable"],
        cases: {
          Invalid: [Tuple([GenericParam("RawType"), Interface("System.Collections.Generic.IEnumerable")])],
          Valid: [GenericParam("P")]
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsUnions(this, other);
    }
  }]);

  return BzProp;
}();
setType("FsCommons.Core.BusinessTypes.BzProp", BzProp);



function GetPropErrors(bzProp) {
  if (bzProp.Case === "Invalid") {
    var rawObj = bzProp.Fields[0][0];
    var errors = bzProp.Fields[0][1];
    return errors;
  } else {
    return empty();
  }
}

function FlattenErrors(propErrors) {
  return concat$1(propErrors);
}
function isValid(bzProp) {
  if (bzProp.Case === "Invalid") {
    return false;
  } else {
    return true;
  }
}
function IsAnyInvalid(validationChecks) {
  return exists(function (x) {
    return equals(false, x);
  }, validationChecks);
}
function createPropStr(commonDataReqs, fromRawValue, propName, newValue) {
  var validationResult = CommonValidations.ValidateDataRequirementsStr(commonDataReqs, propName, newValue);

  if (validationResult.Case === "Bad") {
    if (validationResult.Fields[0].tail == null) {
      return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
    } else {
      return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
    }
  } else {
    return new BzProp("Valid", [fromRawValue(validationResult.Fields[0])]);
  }
}

function createPropIntStr(commonDataReqs, fromRawValue, propName, newValue) {
  var parsedVal = ConversionHelpers.tryParseInt(newValue);

  if (parsedVal != null) {
    var validationResult = CommonValidations.ValidateDataRequirementsInt(commonDataReqs, propName, parsedVal);

    if (validationResult.Case === "Bad") {
      if (validationResult.Fields[0].tail == null) {
        return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
      } else {
        return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
      }
    } else {
      return new BzProp("Valid", [fromRawValue(validationResult.Fields[0])]);
    }
  } else {
    return new BzProp("Invalid", [[newValue, ofArray([new PropertyError("PROP", "Must be numeric", propName)])]]);
  }
}
function createPropDecimalStr(commonDataReqs, fromRawValue, propName, newValue) {
  var parsedVal = ConversionHelpers.tryParseDecimal(newValue);

  if (parsedVal != null) {
    var validationResult = CommonValidations.ValidateDataRequirementsDecimal(commonDataReqs, propName, parsedVal);

    if (validationResult.Case === "Bad") {
      if (validationResult.Fields[0].tail == null) {
        return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
      } else {
        return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
      }
    } else {
      return new BzProp("Valid", [fromRawValue(validationResult.Fields[0])]);
    }
  } else {
    return new BzProp("Invalid", [[newValue, ofArray([new PropertyError("PROP", "Must be numeric", propName)])]]);
  }
}
function createPropStrPattern(commonDataReqs, fromRawValue, propName, newValue) {
  var validationResult = CommonValidations.ValidateDataRequirementsStrPattern(commonDataReqs, propName, newValue);

  if (validationResult.Case === "Bad") {
    if (validationResult.Fields[0].tail == null) {
      return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
    } else {
      return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
    }
  } else {
    return new BzProp("Valid", [fromRawValue(validationResult.Fields[0])]);
  }
}
function createPropDate(commonDataReqs, fromRawValue, propName, newValue) {
  var parsedVal = ConversionHelpers.tryParseWith(function (arg00) {
    return tryParse(arg00, null);
  })(newValue);

  if (parsedVal != null) {
    var validationResult = CommonValidations.ValidateDataRequirementsDate(commonDataReqs, propName, parsedVal);

    if (validationResult.Case === "Bad") {
      if (validationResult.Fields[0].tail == null) {
        return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
      } else {
        return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
      }
    } else {
      return new BzProp("Valid", [fromRawValue(validationResult.Fields[0])]);
    }
  } else {
    return new BzProp("Invalid", [[newValue, ofArray([new PropertyError("PROP", "Must be a valid date", propName)])]]);
  }
}
var YesNo = function () {
  function YesNo(innerVal) {
    _classCallCheck$10(this, YesNo);

    this.innerVal = innerVal;
  }

  _createClass$10(YesNo, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.YesNo",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return new CommonDataRequirementsString(1, new PrimitiveTypes("String", []), 1);
    }
  }, {
    key: "Create",
    value: function (propName, newValueRaw) {
      var newValue = newValueRaw.toLocaleUpperCase();
      var validationResult = CommonValidations.ValidateDataRequirementsStr(YesNo.GetCommonDataRequirements(), propName, newValue);

      if (validationResult.Case === "Bad") {
        if (validationResult.Fields[0].tail == null) {
          return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
        } else {
          return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
        }
      } else if (newValue !== "N" ? newValue !== "Y" : false) {
        return new BzProp("Invalid", [[newValue, ofArray([new PropertyError("PROP", "Must be Yes or No", propName)])]]);
      } else {
        return new BzProp("Valid", [new YesNo(newValue)]);
      }
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return YesNo.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }]);

  return YesNo;
}();
setType("FsCommons.Core.BusinessTypes.YesNo", YesNo);
var ShortName = function () {
  function ShortName(innerVal) {
    _classCallCheck$10(this, ShortName);

    this.innerVal = innerVal;
  }

  _createClass$10(ShortName, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.ShortName",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return new CommonDataRequirementsString(20, new PrimitiveTypes("String", []), 1);
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      var validationResult = CommonValidations.ValidateDataRequirementsStr(ShortName.GetCommonDataRequirements(), propName, newValue);

      if (validationResult.Case === "Bad") {
        if (validationResult.Fields[0].tail == null) {
          return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
        } else {
          return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
        }
      } else {
        return new BzProp("Valid", [new ShortName(newValue)]);
      }
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return ShortName.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }]);

  return ShortName;
}();
setType("FsCommons.Core.BusinessTypes.ShortName", ShortName);
var OptionalEntry = function () {
  function OptionalEntry(innerVal) {
    _classCallCheck$10(this, OptionalEntry);

    this.innerVal = innerVal;
  }

  _createClass$10(OptionalEntry, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.OptionalEntry",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "ToString",
    value: function () {
      return this.Val;
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return OptionalEntry.commonDataRequirements;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      var validationResult = CommonValidations.ValidateDataRequirementsStr(OptionalEntry.GetCommonDataRequirements(), propName, newValue);

      if (validationResult.Case === "Bad") {
        if (validationResult.Fields[0].tail == null) {
          return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
        } else {
          return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
        }
      } else {
        return new BzProp("Valid", [new OptionalEntry(newValue)]);
      }
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return OptionalEntry.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataRequirements",
    get: function () {
      return new CommonDataRequirementsString(150, new PrimitiveTypes("String", []), 0);
    }
  }]);

  return OptionalEntry;
}();
setType("FsCommons.Core.BusinessTypes.OptionalEntry", OptionalEntry);
var LongName = function () {
  function LongName(innerVal) {
    _classCallCheck$10(this, LongName);

    this.innerVal = innerVal;
  }

  _createClass$10(LongName, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.LongName",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "ToString",
    value: function () {
      return this.Val;
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return new CommonDataRequirementsString(40, new PrimitiveTypes("String", []), 1);
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      var validationResult = CommonValidations.ValidateDataRequirementsStr(LongName.GetCommonDataRequirements(), propName, newValue);

      if (validationResult.Case === "Bad") {
        if (validationResult.Fields[0].tail == null) {
          return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
        } else {
          return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
        }
      } else {
        return new BzProp("Valid", [new LongName(newValue)]);
      }
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return LongName.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }]);

  return LongName;
}();
setType("FsCommons.Core.BusinessTypes.LongName", LongName);
var PersonName = function () {
  function PersonName(firstName, middleName, lastName) {
    _classCallCheck$10(this, PersonName);

    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
  }

  _createClass$10(PersonName, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.PersonName",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          firstName: makeGeneric(BzProp, {
            P: LongName,
            RawType: "string"
          }),
          middleName: makeGeneric(BzProp, {
            P: LongName,
            RawType: "string"
          }),
          lastName: makeGeneric(BzProp, {
            P: LongName,
            RawType: "string"
          })
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "ToFullName",
    value: function () {
      return this.LastName + ", " + this.FirstName + (this.MiddleName === "" ? "" : " " + this.MiddleName);
    }
  }, {
    key: "IsValid",
    value: function () {
      return IsAnyInvalid(ofArray([isValid(this.firstName), isValid(this.middleName), isValid(this.lastName)]));
    }
  }, {
    key: "GetValidationErrors",
    value: function () {
      return FlattenErrors(ofArray([GetPropErrors(this.firstName), GetPropErrors(this.middleName), GetPropErrors(this.lastName)]));
    }
  }, {
    key: "FirstName",
    get: function () {
      if (this.firstName.Case === "Invalid") {
        var newValue = this.firstName.Fields[0][0];
        var errors = this.firstName.Fields[0][1];
        return "INVALID";
      } else {
        return this.firstName.Fields[0].Val;
      }
    }
  }, {
    key: "MiddleName",
    get: function () {
      if (this.middleName.Case === "Invalid") {
        var newValue = this.middleName.Fields[0][0];
        var errors = this.middleName.Fields[0][1];
        return "INVALID";
      } else {
        return this.middleName.Fields[0].Val;
      }
    }
  }, {
    key: "LastName",
    get: function () {
      if (this.lastName.Case === "Invalid") {
        var newValue = this.lastName.Fields[0][0];
        var errors = this.lastName.Fields[0][1];
        return "INVALID";
      } else {
        return this.lastName.Fields[0].Val;
      }
    }
  }]);

  return PersonName;
}();
setType("FsCommons.Core.BusinessTypes.PersonName", PersonName);
var AddressStreetLine = function () {
  function AddressStreetLine(innerVal) {
    _classCallCheck$10(this, AddressStreetLine);

    this.innerVal = innerVal;
  }

  _createClass$10(AddressStreetLine, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.AddressStreetLine",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return AddressStreetLine.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropStr(AddressStreetLine.commonDataReqs, function (r) {
        return new AddressStreetLine(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return AddressStreetLine.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsString(100, new PrimitiveTypes("String", []), 1);
    }
  }]);

  return AddressStreetLine;
}();
setType("FsCommons.Core.BusinessTypes.AddressStreetLine", AddressStreetLine);
var AddressCity = function () {
  function AddressCity(innerVal) {
    _classCallCheck$10(this, AddressCity);

    this.innerVal = innerVal;
  }

  _createClass$10(AddressCity, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.AddressCity",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return AddressCity.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropStr(AddressCity.commonDataReqs, function (r) {
        return new AddressCity(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return AddressCity.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsString(40, new PrimitiveTypes("String", []), 1);
    }
  }]);

  return AddressCity;
}();
setType("FsCommons.Core.BusinessTypes.AddressCity", AddressCity);
var AddressStateCode = function () {
  function AddressStateCode(innerVal) {
    _classCallCheck$10(this, AddressStateCode);

    this.innerVal = innerVal;
  }

  _createClass$10(AddressStateCode, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.AddressStateCode",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return AddressStateCode.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropStrPattern(AddressStateCode.commonDataReqs, function (r) {
        return new AddressStateCode(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return AddressStateCode.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsStringPattern(2, new PrimitiveTypes("String", []), 2, null, function (arg00) {
        return arg00.toUpperCase() != arg00.toLowerCase();
      });
    }
  }]);

  return AddressStateCode;
}();
setType("FsCommons.Core.BusinessTypes.AddressStateCode", AddressStateCode);
var AddressZipCode = function () {
  function AddressZipCode(innerVal) {
    _classCallCheck$10(this, AddressZipCode);

    this.innerVal = innerVal;
  }

  _createClass$10(AddressZipCode, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.AddressZipCode",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return AddressZipCode.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropStrPattern(AddressZipCode.commonDataReqs, function (r) {
        return new AddressZipCode(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return AddressZipCode.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsStringPattern(5, new PrimitiveTypes("String", []), 5, null, function (arg00) {
        return arg00 == '0' || arg00 == '1' || arg00 == '2' || arg00 == '3' || arg00 == '4' || arg00 == '5' || arg00 == '6' || arg00 == '7' || arg00 == '8' || arg00 == '9';
      });
    }
  }]);

  return AddressZipCode;
}();
setType("FsCommons.Core.BusinessTypes.AddressZipCode", AddressZipCode);
var UsAddress = function () {
  function UsAddress(addressStreet1, addressCity, addressStateCode, addressZipCode) {
    _classCallCheck$10(this, UsAddress);

    this.AddressStreet1 = addressStreet1;
    this.AddressCity = addressCity;
    this.AddressStateCode = addressStateCode;
    this.AddressZipCode = addressZipCode;
  }

  _createClass$10(UsAddress, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.UsAddress",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          AddressStreet1: makeGeneric(BzProp, {
            P: AddressStreetLine,
            RawType: "string"
          }),
          AddressCity: makeGeneric(BzProp, {
            P: AddressCity,
            RawType: "string"
          }),
          AddressStateCode: makeGeneric(BzProp, {
            P: AddressStateCode,
            RawType: "string"
          }),
          AddressZipCode: makeGeneric(BzProp, {
            P: AddressZipCode,
            RawType: "string"
          })
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "IsValid",
    value: function () {
      return IsAnyInvalid(ofArray([isValid(this.AddressStreet1), isValid(this.AddressCity), isValid(this.AddressStateCode), isValid(this.AddressZipCode)]));
    }
  }, {
    key: "GetValidationErrors",
    value: function () {
      return FlattenErrors(ofArray([GetPropErrors(this.AddressStreet1), GetPropErrors(this.AddressCity), GetPropErrors(this.AddressStateCode), GetPropErrors(this.AddressZipCode)]));
    }
  }]);

  return UsAddress;
}();
setType("FsCommons.Core.BusinessTypes.UsAddress", UsAddress);
var UniqueId = function () {
  function UniqueId(innerVal) {
    _classCallCheck$10(this, UniqueId);

    this.innerVal = innerVal;
  }

  _createClass$10(UniqueId, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.UniqueId",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return UniqueId.commonDataReqs;
    }
  }, {
    key: "CreateId",
    value: function (userName) {
      var now$$1 = now();
      var timeStamp = year(now$$1) * 100000000 + month(now$$1) * 1000000 + day(now$$1) * 10000 + hour(now$$1) * 100 + minute(now$$1);
      var rand = millisecond(now$$1) % 1000;
      return String(timeStamp) + String(rand) + userName;
    }
  }, {
    key: "Create",
    value: function (propName, newId) {
      return createPropStrPattern(UniqueId.commonDataReqs, function (r) {
        return new UniqueId(newId);
      }, propName, newId);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return UniqueId.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsStringPattern(30, new PrimitiveTypes("String", []), 20, null, function (c) {
        return (c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9' ? true : c.toUpperCase() != c.toLowerCase()) ? true : c === ".";
      });
    }
  }]);

  return UniqueId;
}();
setType("FsCommons.Core.BusinessTypes.UniqueId", UniqueId);
var PositiveMoneyAmount = function () {
  function PositiveMoneyAmount(innerVal) {
    _classCallCheck$10(this, PositiveMoneyAmount);

    this.innerVal = innerVal;
  }

  _createClass$10(PositiveMoneyAmount, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.PositiveMoneyAmount",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "number"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return PositiveMoneyAmount.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropDecimalStr(PositiveMoneyAmount.commonDataReqs, function (r) {
        return new PositiveMoneyAmount(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return PositiveMoneyAmount.Create(arg00, arg10);
        };
      }(propName)(function () {
        var copyOfStruct = oldProp.Val;
        return String(copyOfStruct);
      }());
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsDecimal(11, 2, new PrimitiveTypes("Decimal", []), 0, 999999999);
    }
  }]);

  return PositiveMoneyAmount;
}();
setType("FsCommons.Core.BusinessTypes.PositiveMoneyAmount", PositiveMoneyAmount);
var UsTaxId = function () {
  function UsTaxId(innerVal) {
    _classCallCheck$10(this, UsTaxId);

    this.innerVal = innerVal;
  }

  _createClass$10(UsTaxId, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.UsTaxId",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return UsTaxId.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newId) {
      return createPropStrPattern(UsTaxId.commonDataReqs, function (r) {
        return new UsTaxId(newId);
      }, propName, newId);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return UsTaxId.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsStringPattern(9, new PrimitiveTypes("String", []), 9, null, function (c) {
        return c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9';
      });
    }
  }]);

  return UsTaxId;
}();
setType("FsCommons.Core.BusinessTypes.UsTaxId", UsTaxId);
var UsPhone = function () {
  function UsPhone(innerVal) {
    _classCallCheck$10(this, UsPhone);

    this.innerVal = innerVal;
  }

  _createClass$10(UsPhone, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.UsPhone",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return UsPhone.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropStrPattern(UsPhone.commonDataReqs, function (r) {
        return new UsPhone(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return UsPhone.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsStringPattern(10, new PrimitiveTypes("String", []), 10, null, function (arg00) {
        return arg00 == '0' || arg00 == '1' || arg00 == '2' || arg00 == '3' || arg00 == '4' || arg00 == '5' || arg00 == '6' || arg00 == '7' || arg00 == '8' || arg00 == '9';
      });
    }
  }]);

  return UsPhone;
}();
setType("FsCommons.Core.BusinessTypes.UsPhone", UsPhone);
var RequiredCount = function () {
  function RequiredCount(innerVal, strVal) {
    _classCallCheck$10(this, RequiredCount);

    this.innerVal = innerVal;
    this.strVal = strVal;
  }

  _createClass$10(RequiredCount, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.RequiredCount",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "number",
          strVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }, {
    key: "RawVal",
    get: function () {
      return this.strVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return RequiredCount.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropIntStr(RequiredCount.commonDataReqs, function (r) {
        return new RequiredCount(r, newValue);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return RequiredCount.Create(arg00, arg10);
        };
      }(propName)(function () {
        var copyOfStruct = oldProp.Val;
        return String(copyOfStruct);
      }());
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsInt(new PrimitiveTypes("Integer", []), 1, 999999999);
    }
  }]);

  return RequiredCount;
}();
setType("FsCommons.Core.BusinessTypes.RequiredCount", RequiredCount);
var PositivePercentage = function () {
  function PositivePercentage(innerVal) {
    _classCallCheck$10(this, PositivePercentage);

    this.innerVal = innerVal;
  }

  _createClass$10(PositivePercentage, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.PositivePercentage",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "number"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return PositivePercentage.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropDecimalStr(PositivePercentage.commonDataReqs, function (r) {
        return new PositivePercentage(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return PositiveMoneyAmount.Create(arg00, arg10);
        };
      }(propName)(function () {
        var copyOfStruct = oldProp.Val;
        return String(copyOfStruct);
      }());
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsDecimal(5, 2, new PrimitiveTypes("Decimal", []), 0, 100);
    }
  }]);

  return PositivePercentage;
}();
setType("FsCommons.Core.BusinessTypes.PositivePercentage", PositivePercentage);
var EmailAddress = function () {
  function EmailAddress(innerVal) {
    _classCallCheck$10(this, EmailAddress);

    this.innerVal = innerVal;
  }

  _createClass$10(EmailAddress, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.EmailAddress",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return EmailAddress.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newVal) {
      return createPropStrPattern(EmailAddress.commonDataReqs, function (r) {
        return new EmailAddress(r);
      }, propName, newVal);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return EmailAddress.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsStringPattern(50, new PrimitiveTypes("String", []), 4, create("^\\S+@\\S+\\.\\S+$"), function (c) {
        return true;
      });
    }
  }]);

  return EmailAddress;
}();
setType("FsCommons.Core.BusinessTypes.EmailAddress", EmailAddress);
var PastDate = function () {
  function PastDate(innerVal) {
    _classCallCheck$10(this, PastDate);

    this.innerVal = innerVal;
  }

  _createClass$10(PastDate, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.PastDate",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: Date
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return PastDate.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newVal) {
      return createPropDate(PastDate.commonDataReqs, function (r) {
        return new PastDate(r);
      }, propName, newVal);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return PastDate.Create(arg00, arg10);
        };
      }(propName)(function () {
        var copyOfStruct = oldProp.Val;
        return toString(copyOfStruct);
      }());
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      var MinValue = create$1(1900, 1, 1);
      var MaxValue = today();
      return new CommonDataRequirementsDate(new PrimitiveTypes("Date", []), MinValue, MaxValue);
    }
  }]);

  return PastDate;
}();
setType("FsCommons.Core.BusinessTypes.PastDate", PastDate);
var FutureDate = function () {
  function FutureDate(innerVal) {
    _classCallCheck$10(this, FutureDate);

    this.innerVal = innerVal;
  }

  _createClass$10(FutureDate, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "FsCommons.Core.BusinessTypes.FutureDate",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: Date
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return FutureDate.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newVal) {
      return createPropDate(FutureDate.commonDataReqs, function (r) {
        return new FutureDate(r);
      }, propName, newVal);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return FutureDate.Create(arg00, arg10);
        };
      }(propName)(function () {
        var copyOfStruct = oldProp.Val;
        return toString(copyOfStruct);
      }());
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      var MinValue = void 0;
      var copyOfStruct = today();
      MinValue = addDays(copyOfStruct, 1);
      var MaxValue = void 0;
      var copyOfStruct_1 = today();
      MaxValue = addYears(copyOfStruct_1, 200);
      return new CommonDataRequirementsDate(new PrimitiveTypes("Date", []), MinValue, MaxValue);
    }
  }]);

  return FutureDate;
}();
setType("FsCommons.Core.BusinessTypes.FutureDate", FutureDate);

var _createClass$9 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$9(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LkupValue = function () {
  function LkupValue(idValue, label) {
    _classCallCheck$9(this, LkupValue);

    this.IdValue = idValue;
    this.Label = label;
  }

  _createClass$9(LkupValue, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.LkupValue",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          IdValue: "string",
          Label: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return LkupValue;
}();
setType("Lr.Core.LkupValue", LkupValue);
var BleAmountRequested = function () {
  function BleAmountRequested(innerVal) {
    _classCallCheck$9(this, BleAmountRequested);

    this.innerVal = innerVal;
  }

  _createClass$9(BleAmountRequested, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.BleAmountRequested",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "number"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return BleAmountRequested.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropDecimalStr(BleAmountRequested.commonDataReqs, function (r) {
        return new BleAmountRequested(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return BleAmountRequested.Create(arg00, arg10);
        };
      }(propName)(function () {
        var copyOfStruct = oldProp.Val;
        return String(copyOfStruct);
      }());
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsDecimal(11, 2, new PrimitiveTypes("Decimal", []), 1, 249999);
    }
  }]);

  return BleAmountRequested;
}();
setType("Lr.Core.BleAmountRequested", BleAmountRequested);
var LoanType = function () {
  function LoanType(innerVal) {
    _classCallCheck$9(this, LoanType);

    this.innerVal = innerVal;
  }

  _createClass$9(LoanType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.LoanType",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return LoanType.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropStr(LoanType.commonDataReqs, function (r) {
        return new LoanType(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return LoanType.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsString(30, new PrimitiveTypes("String", []), 1);
    }
  }]);

  return LoanType;
}();
setType("Lr.Core.LoanType", LoanType);
var LoanPurpose = function () {
  function LoanPurpose(innerVal) {
    _classCallCheck$9(this, LoanPurpose);

    this.innerVal = innerVal;
  }

  _createClass$9(LoanPurpose, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.LoanPurpose",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return LoanPurpose.commonDataReqs;
    }
  }, {
    key: "Create",
    value: function (propName, newValue) {
      return createPropStr(LoanPurpose.commonDataReqs, function (r) {
        return new LoanPurpose(r);
      }, propName, newValue);
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return LoanPurpose.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }, {
    key: "commonDataReqs",
    get: function () {
      return new CommonDataRequirementsString(30, new PrimitiveTypes("String", []), 1);
    }
  }]);

  return LoanPurpose;
}();
setType("Lr.Core.LoanPurpose", LoanPurpose);
var EcoaAnswer = function () {
  function EcoaAnswer(innerVal) {
    _classCallCheck$9(this, EcoaAnswer);

    this.innerVal = innerVal;
  }

  _createClass$9(EcoaAnswer, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.EcoaAnswer",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return YesNo.GetCommonDataRequirements();
    }
  }, {
    key: "Create",
    value: function (propName, newValueRaw, grossRev) {
      var newValue = newValueRaw.toLocaleUpperCase();
      var validationResult = CommonValidations.ValidateDataRequirementsStr(YesNo.GetCommonDataRequirements(), propName, newValue);

      if (validationResult.Case === "Bad") {
        if (validationResult.Fields[0].tail == null) {
          return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
        } else {
          return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
        }
      } else {
        var $var103 = newValue === "Y" ? (grossRev + 0).CompareTo(1000000) <= 0 ? [0] : [1] : [1];

        switch ($var103[0]) {
          case 0:
            return new BzProp("Invalid", [[newValue, ofArray([new PropertyError("PROP", "Must be NO when Gross Revenue is One Million or less", propName)])]]);

          case 1:
            var $var104 = newValue === "N" ? (grossRev + 0).CompareTo(1000000) > 0 ? [0] : [1] : [1];

            switch ($var104[0]) {
              case 0:
                return new BzProp("Invalid", [[newValue, ofArray([new PropertyError("PROP", "Must be YES when Gross Revenue is over One Million", propName)])]]);

              case 1:
                switch (newValue) {
                  case "Y":
                    return new BzProp("Valid", [new EcoaAnswer(newValue)]);

                  case "N":
                    return new BzProp("Valid", [new EcoaAnswer(newValue)]);

                  default:
                    return new BzProp("Invalid", [[newValue, ofArray([new PropertyError("PROP", "Must be Yes or No", propName)])]]);
                }

            }

        }
      }
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return LoanPurpose.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }]);

  return EcoaAnswer;
}();
setType("Lr.Core.EcoaAnswer", EcoaAnswer);
var LoanDocType = function () {
  function LoanDocType(caseName, fields) {
    _classCallCheck$9(this, LoanDocType);

    this.Case = caseName;
    this.Fields = fields;
  }

  _createClass$9(LoanDocType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.LoanDocType",
        interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
        cases: {
          Collateral: [],
          Company: [],
          RelatedEntity: []
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsUnions(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareUnions(this, other);
    }
  }]);

  return LoanDocType;
}();
setType("Lr.Core.LoanDocType", LoanDocType);
var LoanDocTypeHelpers = function (__exports) {
  var ToRendition = __exports.ToRendition = function (v) {
    if (v.Case === "Collateral") {
      return "COL";
    } else if (v.Case === "Company") {
      return "COMP";
    } else {
      return "ENT";
    }
  };

  var FromRendition = __exports.FromRendition = function (v) {
    switch (v) {
      case "ENT":
        return new LoanDocType("RelatedEntity", []);

      case "COL":
        return new LoanDocType("Collateral", []);

      case "COMP":
        return new LoanDocType("Company", []);

      default:
        throw new Error("C:\\Sources\\Repos\\LN\\lnAppl\\XpressLoanRequest\\Lr.Core\\LrTypes.fs", 91, 14);
    }
  };

  return __exports;
}({});
var NeededOn = function () {
  function NeededOn(caseName, fields) {
    _classCallCheck$9(this, NeededOn);

    this.Case = caseName;
    this.Fields = fields;
  }

  _createClass$9(NeededOn, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.NeededOn",
        interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
        cases: {
          Closing: [],
          Initial: []
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsUnions(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareUnions(this, other);
    }
  }]);

  return NeededOn;
}();
setType("Lr.Core.NeededOn", NeededOn);
var NeededOnHelpers = function (__exports) {
  var ToRendition = __exports.ToRendition = function (v) {
    if (v.Case === "Closing") {
      return "C";
    } else {
      return "R";
    }
  };

  var FromRendition = __exports.FromRendition = function (v) {
    switch (v) {
      case "R":
        return new NeededOn("Initial", []);

      case "C":
        return new NeededOn("Closing", []);

      default:
        throw new Error("C:\\Sources\\Repos\\LN\\lnAppl\\XpressLoanRequest\\Lr.Core\\LrTypes.fs", 107, 14);
    }
  };

  return __exports;
}({});
var NeededFrom = function () {
  function NeededFrom(caseName, fields) {
    _classCallCheck$9(this, NeededFrom);

    this.Case = caseName;
    this.Fields = fields;
  }

  _createClass$9(NeededFrom, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.NeededFrom",
        interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
        cases: {
          Customer: [],
          Officer: []
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsUnions(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareUnions(this, other);
    }
  }]);

  return NeededFrom;
}();
setType("Lr.Core.NeededFrom", NeededFrom);
var NeededFromHelpers = function (__exports) {
  var ToRendition = __exports.ToRendition = function (v) {
    if (v.Case === "Officer") {
      return "CUS";
    } else {
      return "OFF";
    }
  };

  var FromRendition = __exports.FromRendition = function (v) {
    switch (v) {
      case "OFF":
        return new NeededFrom("Customer", []);

      case "CUS":
        return new NeededFrom("Officer", []);

      default:
        throw new Error("C:\\Sources\\Repos\\LN\\lnAppl\\XpressLoanRequest\\Lr.Core\\LrTypes.fs", 122, 14);
    }
  };

  return __exports;
}({});
var LoanDocRequirement = function () {
  function LoanDocRequirement(attachmentRequirementBucketName, loanDocType, neededOn, neededFrom) {
    _classCallCheck$9(this, LoanDocRequirement);

    this.AttachmentRequirementBucketName = attachmentRequirementBucketName;
    this.LoanDocType = loanDocType;
    this.NeededOn = neededOn;
    this.NeededFrom = neededFrom;
  }

  _createClass$9(LoanDocRequirement, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.LoanDocRequirement",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          AttachmentRequirementBucketName: "string",
          LoanDocType: LoanDocType,
          NeededOn: NeededOn,
          NeededFrom: NeededFrom
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return LoanDocRequirement;
}();
setType("Lr.Core.LoanDocRequirement", LoanDocRequirement);
var LoanDoc = function () {
  function LoanDoc(attachmentName) {
    _classCallCheck$9(this, LoanDoc);

    this.AttachmentName = attachmentName;
  }

  _createClass$9(LoanDoc, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.LoanDoc",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          AttachmentName: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return LoanDoc;
}();
setType("Lr.Core.LoanDoc", LoanDoc);
var LoanDocUpload = function () {
  function LoanDocUpload(loanRequestId, requirementBucket, attachmentName, contents, username) {
    _classCallCheck$9(this, LoanDocUpload);

    this.LoanRequestId = loanRequestId;
    this.RequirementBucket = requirementBucket;
    this.AttachmentName = attachmentName;
    this.Contents = contents;
    this.Username = username;
  }

  _createClass$9(LoanDocUpload, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.LoanDocUpload",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          LoanRequestId: "number",
          RequirementBucket: "string",
          AttachmentName: "string",
          Contents: FableArray(Uint8Array, true),
          Username: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return LoanDocUpload;
}();
setType("Lr.Core.LoanDocUpload", LoanDocUpload);
var DocRequirementFulfilment = function () {
  function DocRequirementFulfilment(loadDocRequirement, loanDocs) {
    _classCallCheck$9(this, DocRequirementFulfilment);

    this.LoadDocRequirement = loadDocRequirement;
    this.LoanDocs = loanDocs;
  }

  _createClass$9(DocRequirementFulfilment, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.DocRequirementFulfilment",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          LoadDocRequirement: LoanDocRequirement,
          LoanDocs: makeGeneric(List$1, {
            T: LoanDoc
          })
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return DocRequirementFulfilment;
}();
setType("Lr.Core.DocRequirementFulfilment", DocRequirementFulfilment);
var Collateral = function () {
  function Collateral(seqNumber, specificDescription, collateralType, docRequirementFulfilment) {
    _classCallCheck$9(this, Collateral);

    this.SeqNumber = seqNumber;
    this.SpecificDescription = specificDescription;
    this.CollateralType = collateralType;
    this.DocRequirementFulfilment = docRequirementFulfilment;
  }

  _createClass$9(Collateral, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.Collateral",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          SeqNumber: "number",
          SpecificDescription: makeGeneric(BzProp, {
            P: ShortName,
            RawType: "string"
          }),
          CollateralType: makeGeneric(BzProp, {
            P: ShortName,
            RawType: "string"
          }),
          DocRequirementFulfilment: makeGeneric(List$1, {
            T: DocRequirementFulfilment
          })
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }]);

  return Collateral;
}();
setType("Lr.Core.Collateral", Collateral);
var Company = function () {
  function Company(companyId, taxId, companyType, grossAnnualRevenue, registeredName, tradeName, businessPhone, dateEstablished, stateCodeStablished, loanIndustry, natureOfBusiness, legalStatus, registrationNumber, stateFilingUrl, isOneYearFinancialsRequired, revenueMoreThanOneMillion, physicalAddress, isPhysicalSameAsMailing, mailingAddress, modifiedBy, modifiedOn, hasRequestedToApplyJointly, dDACollectiveBalance, docRequirementFulfilment) {
    _classCallCheck$9(this, Company);

    this.CompanyId = companyId;
    this.TaxId = taxId;
    this.CompanyType = companyType;
    this.GrossAnnualRevenue = grossAnnualRevenue;
    this.RegisteredName = registeredName;
    this.TradeName = tradeName;
    this.BusinessPhone = businessPhone;
    this.DateEstablished = dateEstablished;
    this.StateCodeStablished = stateCodeStablished;
    this.LoanIndustry = loanIndustry;
    this.NatureOfBusiness = natureOfBusiness;
    this.LegalStatus = legalStatus;
    this.RegistrationNumber = registrationNumber;
    this.StateFilingUrl = stateFilingUrl;
    this.IsOneYearFinancialsRequired = isOneYearFinancialsRequired;
    this.RevenueMoreThanOneMillion = revenueMoreThanOneMillion;
    this.PhysicalAddress = physicalAddress;
    this.IsPhysicalSameAsMailing = isPhysicalSameAsMailing;
    this.MailingAddress = mailingAddress;
    this.ModifiedBy = modifiedBy;
    this.ModifiedOn = modifiedOn;
    this.HasRequestedToApplyJointly = hasRequestedToApplyJointly;
    this.DDACollectiveBalance = dDACollectiveBalance;
    this.DocRequirementFulfilment = docRequirementFulfilment;
  }

  _createClass$9(Company, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.Company",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          CompanyId: makeGeneric(BzProp, {
            P: UniqueId,
            RawType: "string"
          }),
          TaxId: makeGeneric(BzProp, {
            P: UsTaxId,
            RawType: "string"
          }),
          CompanyType: makeGeneric(BzProp, {
            P: ShortName,
            RawType: "string"
          }),
          GrossAnnualRevenue: makeGeneric(BzProp, {
            P: PositiveMoneyAmount,
            RawType: "string"
          }),
          RegisteredName: makeGeneric(BzProp, {
            P: LongName,
            RawType: "string"
          }),
          TradeName: makeGeneric(BzProp, {
            P: LongName,
            RawType: "string"
          }),
          BusinessPhone: makeGeneric(BzProp, {
            P: UsPhone,
            RawType: "string"
          }),
          DateEstablished: makeGeneric(BzProp, {
            P: PastDate,
            RawType: "string"
          }),
          StateCodeStablished: makeGeneric(BzProp, {
            P: AddressStateCode,
            RawType: "string"
          }),
          LoanIndustry: makeGeneric(BzProp, {
            P: ShortName,
            RawType: "string"
          }),
          NatureOfBusiness: makeGeneric(BzProp, {
            P: ShortName,
            RawType: "string"
          }),
          LegalStatus: makeGeneric(BzProp, {
            P: ShortName,
            RawType: "string"
          }),
          RegistrationNumber: makeGeneric(BzProp, {
            P: OptionalEntry,
            RawType: "string"
          }),
          StateFilingUrl: makeGeneric(BzProp, {
            P: OptionalEntry,
            RawType: "string"
          }),
          IsOneYearFinancialsRequired: makeGeneric(BzProp, {
            P: YesNo,
            RawType: "string"
          }),
          RevenueMoreThanOneMillion: makeGeneric(BzProp, {
            P: EcoaAnswer,
            RawType: "string"
          }),
          PhysicalAddress: UsAddress,
          IsPhysicalSameAsMailing: makeGeneric(BzProp, {
            P: YesNo,
            RawType: "string"
          }),
          MailingAddress: UsAddress,
          ModifiedBy: "string",
          ModifiedOn: Date,
          HasRequestedToApplyJointly: makeGeneric(BzProp, {
            P: YesNo,
            RawType: "string"
          }),
          DDACollectiveBalance: makeGeneric(BzProp, {
            P: PositiveMoneyAmount,
            RawType: "string"
          }),
          DocRequirementFulfilment: makeGeneric(List$1, {
            T: DocRequirementFulfilment
          })
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "IsValid",
    value: function () {
      return IsAnyInvalid(ofArray([isValid(this.RegisteredName), this.PhysicalAddress.IsValid(), this.MailingAddress.IsValid()]));
    }
  }, {
    key: "GetValidationErrors",
    value: function () {
      return FlattenErrors(ofArray([GetPropErrors(this.RegisteredName), this.PhysicalAddress.GetValidationErrors(), this.MailingAddress.GetValidationErrors()]));
    }
  }]);

  return Company;
}();
setType("Lr.Core.Company", Company);
var CompanyValidations = function (__exports) {
  var Validate = __exports.Validate = function (comp) {
    var errors = comp.GetValidationErrors();

    if (isEmpty(errors)) {
      return new Chessie.Result("Ok", [comp, new List$1()]);
    } else {
      return new Chessie.Result("Bad", [ofArray([errors])]);
    }
  };

  return __exports;
}({});
var EntityTypeClass = function () {
  function EntityTypeClass(caseName, fields) {
    _classCallCheck$9(this, EntityTypeClass);

    this.Case = caseName;
    this.Fields = fields;
  }

  _createClass$9(EntityTypeClass, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.EntityTypeClass",
        interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
        cases: {
          Company: [],
          Individual: [],
          Trust: []
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsUnions(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareUnions(this, other);
    }
  }]);

  return EntityTypeClass;
}();
setType("Lr.Core.EntityTypeClass", EntityTypeClass);
var EntityType = function () {
  function EntityType(innerVal, classification) {
    _classCallCheck$9(this, EntityType);

    this.innerVal = innerVal;
    this.classification = classification;
  }

  _createClass$9(EntityType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.EntityType",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string",
          classification: EntityTypeClass
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }, {
    key: "Classification",
    get: function () {
      return this.classification;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return new CommonDataRequirementsString(1, new PrimitiveTypes("String", []), 1);
    }
  }, {
    key: "Create",
    value: function (propName, newValueRaw) {
      var newValue = newValueRaw.toLocaleUpperCase();
      var validationResult = CommonValidations.ValidateDataRequirementsStr(EntityType.GetCommonDataRequirements(), propName, newValue);

      if (validationResult.Case === "Bad") {
        if (validationResult.Fields[0].tail == null) {
          return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
        } else {
          return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
        }
      } else {
        switch (validationResult.Fields[0]) {
          case "I":
            return new BzProp("Valid", [new EntityType(newValue, new EntityTypeClass("Individual", []))]);

          case "C":
            return new BzProp("Valid", [new EntityType(newValue, new EntityTypeClass("Company", []))]);

          case "T":
            return new BzProp("Valid", [new EntityType(newValue, new EntityTypeClass("Trust", []))]);

          default:
            return new BzProp("Invalid", [[newValue, ofArray([new PropertyError("PROP", "Must be (I)ndividual, (C)ompany or (T)rust", propName)])]]);
        }
      }
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return EntityType.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }]);

  return EntityType;
}();
setType("Lr.Core.EntityType", EntityType);
var EntityRelationship = function () {
  function EntityRelationship(innerVal) {
    _classCallCheck$9(this, EntityRelationship);

    this.innerVal = innerVal;
  }

  _createClass$9(EntityRelationship, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.EntityRelationship",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          innerVal: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }, {
    key: "Val",
    get: function () {
      return this.innerVal;
    }
  }], [{
    key: "GetCommonDataRequirements",
    value: function () {
      return new CommonDataRequirementsString(3, new PrimitiveTypes("String", []), 3);
    }
  }, {
    key: "Create",
    value: function (propName, newValueRaw) {
      var newValue = newValueRaw.toLocaleUpperCase();
      var validationResult = CommonValidations.ValidateDataRequirementsStr(EntityRelationship.GetCommonDataRequirements(), propName, newValue);

      if (validationResult.Case === "Bad") {
        if (validationResult.Fields[0].tail == null) {
          return new BzProp("Invalid", [[newValue, PropertyError.Undefined]]);
        } else {
          return new BzProp("Invalid", [[newValue, validationResult.Fields[0].head]]);
        }
      } else {
        return new BzProp("Valid", [new EntityRelationship(newValue)]);
      }
    }
  }, {
    key: "ReCreate",
    value: function (propName, oldProp) {
      return function (arg00) {
        return function (arg10) {
          return EntityRelationship.Create(arg00, arg10);
        };
      }(propName)(oldProp.Val);
    }
  }]);

  return EntityRelationship;
}();
setType("Lr.Core.EntityRelationship", EntityRelationship);
var RelatedEntity = function () {
  function RelatedEntity(entityIdInRequest, entityType, taxId, personName, businessName, ownershipPercent, mainAddress, dateOfBirth, hasDeclaredBankruptcy, hasOutstandingLiens, iDType, iDNumber, issuer, expirationDate, issueDate, emailAddress, businessPhone, isPrimaryContact, entityRelationship, relatedSince, netWorth, combinedIncome, docRequirementFulfilment) {
    _classCallCheck$9(this, RelatedEntity);

    this.EntityIdInRequest = entityIdInRequest;
    this.EntityType = entityType;
    this.TaxId = taxId;
    this.PersonName = personName;
    this.BusinessName = businessName;
    this.OwnershipPercent = ownershipPercent;
    this.MainAddress = mainAddress;
    this.DateOfBirth = dateOfBirth;
    this.HasDeclaredBankruptcy = hasDeclaredBankruptcy;
    this.HasOutstandingLiens = hasOutstandingLiens;
    this.IDType = iDType;
    this.IDNumber = iDNumber;
    this.Issuer = issuer;
    this.ExpirationDate = expirationDate;
    this.IssueDate = issueDate;
    this.EmailAddress = emailAddress;
    this.BusinessPhone = businessPhone;
    this.IsPrimaryContact = isPrimaryContact;
    this.EntityRelationship = entityRelationship;
    this.RelatedSince = relatedSince;
    this.NetWorth = netWorth;
    this.CombinedIncome = combinedIncome;
    this.DocRequirementFulfilment = docRequirementFulfilment;
  }

  _createClass$9(RelatedEntity, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.RelatedEntity",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          EntityIdInRequest: "number",
          EntityType: makeGeneric(BzProp, {
            P: EntityType,
            RawType: "string"
          }),
          TaxId: makeGeneric(BzProp, {
            P: UsTaxId,
            RawType: "string"
          }),
          PersonName: PersonName,
          BusinessName: makeGeneric(BzProp, {
            P: LongName,
            RawType: "string"
          }),
          OwnershipPercent: makeGeneric(BzProp, {
            P: PositivePercentage,
            RawType: "string"
          }),
          MainAddress: UsAddress,
          DateOfBirth: makeGeneric(BzProp, {
            P: PastDate,
            RawType: "string"
          }),
          HasDeclaredBankruptcy: makeGeneric(BzProp, {
            P: YesNo,
            RawType: "string"
          }),
          HasOutstandingLiens: makeGeneric(BzProp, {
            P: YesNo,
            RawType: "string"
          }),
          IDType: makeGeneric(BzProp, {
            P: ShortName,
            RawType: "string"
          }),
          IDNumber: makeGeneric(BzProp, {
            P: ShortName,
            RawType: "string"
          }),
          Issuer: makeGeneric(BzProp, {
            P: ShortName,
            RawType: "string"
          }),
          ExpirationDate: makeGeneric(BzProp, {
            P: FutureDate,
            RawType: "string"
          }),
          IssueDate: makeGeneric(BzProp, {
            P: PastDate,
            RawType: "string"
          }),
          EmailAddress: makeGeneric(BzProp, {
            P: EmailAddress,
            RawType: "string"
          }),
          BusinessPhone: makeGeneric(BzProp, {
            P: UsPhone,
            RawType: "string"
          }),
          IsPrimaryContact: makeGeneric(BzProp, {
            P: YesNo,
            RawType: "string"
          }),
          EntityRelationship: makeGeneric(BzProp, {
            P: EntityRelationship,
            RawType: "string"
          }),
          RelatedSince: makeGeneric(BzProp, {
            P: PastDate,
            RawType: "string"
          }),
          NetWorth: makeGeneric(BzProp, {
            P: PositiveMoneyAmount,
            RawType: "string"
          }),
          CombinedIncome: makeGeneric(BzProp, {
            P: PositiveMoneyAmount,
            RawType: "string"
          }),
          DocRequirementFulfilment: makeGeneric(List$1, {
            T: DocRequirementFulfilment
          })
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }]);

  return RelatedEntity;
}();
setType("Lr.Core.RelatedEntity", RelatedEntity);
var LoanRequestBaseInfo = function () {
  function LoanRequestBaseInfo(loanRequestId, loanType, isSecured, amountRequested, loanPurpose, specificPurpose) {
    _classCallCheck$9(this, LoanRequestBaseInfo);

    this.LoanRequestId = loanRequestId;
    this.LoanType = loanType;
    this.IsSecured = isSecured;
    this.AmountRequested = amountRequested;
    this.LoanPurpose = loanPurpose;
    this.SpecificPurpose = specificPurpose;
  }

  _createClass$9(LoanRequestBaseInfo, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.LoanRequestBaseInfo",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          LoanRequestId: makeGeneric(BzProp, {
            P: UniqueId,
            RawType: "string"
          }),
          LoanType: makeGeneric(BzProp, {
            P: LoanType,
            RawType: "string"
          }),
          IsSecured: makeGeneric(BzProp, {
            P: YesNo,
            RawType: "string"
          }),
          AmountRequested: makeGeneric(BzProp, {
            P: BleAmountRequested,
            RawType: "string"
          }),
          LoanPurpose: makeGeneric(BzProp, {
            P: LoanPurpose,
            RawType: "string"
          }),
          SpecificPurpose: makeGeneric(BzProp, {
            P: LongName,
            RawType: "string"
          })
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }]);

  return LoanRequestBaseInfo;
}();
setType("Lr.Core.LoanRequestBaseInfo", LoanRequestBaseInfo);
var CoreBalance = function () {
  function CoreBalance(acctNumber, currentPrincipalBalance, creditRiskCode, balanceAsOf) {
    _classCallCheck$9(this, CoreBalance);

    this.AcctNumber = acctNumber;
    this.CurrentPrincipalBalance = currentPrincipalBalance;
    this.CreditRiskCode = creditRiskCode;
    this.BalanceAsOf = balanceAsOf;
  }

  _createClass$9(CoreBalance, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.CoreBalance",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          AcctNumber: "string",
          CurrentPrincipalBalance: "number",
          CreditRiskCode: "number",
          BalanceAsOf: Date
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return CoreBalance;
}();
setType("Lr.Core.CoreBalance", CoreBalance);
var CoreAggregatedBalance = function () {
  function CoreAggregatedBalance(coreBalances, newAmountRequested) {
    _classCallCheck$9(this, CoreAggregatedBalance);

    this.CoreBalances = coreBalances;
    this.NewAmountRequested = newAmountRequested;
  }

  _createClass$9(CoreAggregatedBalance, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.CoreAggregatedBalance",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          CoreBalances: Interface("System.Collections.Generic.IEnumerable"),
          NewAmountRequested: "number"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }]);

  return CoreAggregatedBalance;
}();
setType("Lr.Core.CoreAggregatedBalance", CoreAggregatedBalance);
var CoreBalanceRequest = function () {
  function CoreBalanceRequest(requestorTaxId, newAmountRequested) {
    _classCallCheck$9(this, CoreBalanceRequest);

    this.RequestorTaxId = requestorTaxId;
    this.NewAmountRequested = newAmountRequested;
  }

  _createClass$9(CoreBalanceRequest, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.CoreBalanceRequest",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          RequestorTaxId: "string",
          NewAmountRequested: "number"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return CoreBalanceRequest;
}();
setType("Lr.Core.CoreBalanceRequest", CoreBalanceRequest);
var LoanRequest = function () {
  function LoanRequest(lrId, requestBaseInfo, requestingCompany, collateral, relatedEntities, aggregatedBalacesInfo, modifiedBy, modifiedOn) {
    _classCallCheck$9(this, LoanRequest);

    this.LrId = lrId;
    this.RequestBaseInfo = requestBaseInfo;
    this.RequestingCompany = requestingCompany;
    this.Collateral = collateral;
    this.RelatedEntities = relatedEntities;
    this.AggregatedBalacesInfo = aggregatedBalacesInfo;
    this.ModifiedBy = modifiedBy;
    this.ModifiedOn = modifiedOn;
  }

  _createClass$9(LoanRequest, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.LoanRequest",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          LrId: "number",
          RequestBaseInfo: LoanRequestBaseInfo,
          RequestingCompany: Company,
          Collateral: makeGeneric(List$1, {
            T: Collateral
          }),
          RelatedEntities: makeGeneric(List$1, {
            T: RelatedEntity
          }),
          AggregatedBalacesInfo: CoreAggregatedBalance,
          ModifiedBy: "string",
          ModifiedOn: Date
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }]);

  return LoanRequest;
}();
setType("Lr.Core.LoanRequest", LoanRequest);
var AppLookupInfo = function () {
  function AppLookupInfo(possibleCollateralTypes, possibleLoanPurposes, possibleLoanTypes, possibleIndustryCodes, possibleSectorCodes) {
    _classCallCheck$9(this, AppLookupInfo);

    this.PossibleCollateralTypes = possibleCollateralTypes;
    this.PossibleLoanPurposes = possibleLoanPurposes;
    this.PossibleLoanTypes = possibleLoanTypes;
    this.PossibleIndustryCodes = possibleIndustryCodes;
    this.PossibleSectorCodes = possibleSectorCodes;
  }

  _createClass$9(AppLookupInfo, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.AppLookupInfo",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          PossibleCollateralTypes: makeGeneric(List$1, {
            T: LkupValue
          }),
          PossibleLoanPurposes: FableArray(Tuple(["string", "string"])),
          PossibleLoanTypes: FableArray(Tuple(["string", "string", "string"])),
          PossibleIndustryCodes: makeGeneric(List$1, {
            T: LkupValue
          }),
          PossibleSectorCodes: makeGeneric(List$1, {
            T: LkupValue
          })
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return AppLookupInfo;
}();
setType("Lr.Core.AppLookupInfo", AppLookupInfo);
var CoreAggregatedBalanceHelpers = function (__exports) {
  var Empty = __exports.Empty = new CoreAggregatedBalance(new List$1(), 0);

  var SumBalances = __exports.SumBalances = function (model) {
    return fold(function (s, r) {
      return r.CurrentPrincipalBalance + s;
    }, 0, model.CoreBalances);
  };

  var HasBalances = __exports.HasBalances = function (model) {
    return count(model.CoreBalances) > 0;
  };

  var IsAmtAllowed = __exports.IsAmtAllowed = function (model) {
    var coreBal = SumBalances(model);
    return coreBal + model.NewAmountRequested < 250000;
  };

  return __exports;
}({});
var CollateralDocument = function () {
  function CollateralDocument(collateralDocumentId, collateralId, docRequirement, referToDocumentId, attachmentId) {
    _classCallCheck$9(this, CollateralDocument);

    this.CollateralDocumentId = collateralDocumentId;
    this.CollateralId = collateralId;
    this.DocRequirement = docRequirement;
    this.ReferToDocumentId = referToDocumentId;
    this.AttachmentId = attachmentId;
  }

  _createClass$9(CollateralDocument, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.CollateralDocument",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          CollateralDocumentId: "number",
          CollateralId: "number",
          DocRequirement: "number",
          ReferToDocumentId: "number",
          AttachmentId: "number"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return CollateralDocument;
}();
setType("Lr.Core.CollateralDocument", CollateralDocument);

var Empty$1 = new CollateralDocument(0, 0, 0, 0, 0);

var _createClass$8 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$8(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QueryRequestType$1 = function () {
  function QueryRequestType(id, collateralId, docRequirementId, username) {
    _classCallCheck$8(this, QueryRequestType);

    this.Id = id;
    this.CollateralId = collateralId;
    this.DocRequirementId = docRequirementId;
    this.Username = username;
  }

  _createClass$8(QueryRequestType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.UpdateCollateralDocScreen.QueryRequestType",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          Id: "number",
          CollateralId: "number",
          DocRequirementId: "number",
          Username: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return QueryRequestType;
}();
setType("Lr.Core.UpdateCollateralDocScreen.QueryRequestType", QueryRequestType$1);
var QueryType$1 = function () {
  function QueryType(collateralDocument, possibleReferTos, collateralFullName, docRequirementName) {
    _classCallCheck$8(this, QueryType);

    this.CollateralDocument = collateralDocument;
    this.PossibleReferTos = possibleReferTos;
    this.CollateralFullName = collateralFullName;
    this.DocRequirementName = docRequirementName;
  }

  _createClass$8(QueryType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.UpdateCollateralDocScreen.QueryType",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          CollateralDocument: CollateralDocument,
          PossibleReferTos: FableArray(Tuple(["number", "string"])),
          CollateralFullName: "string",
          DocRequirementName: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return QueryType;
}();
setType("Lr.Core.UpdateCollateralDocScreen.QueryType", QueryType$1);
var CmdType = function () {
  function CmdType(collateralDocument, modifiedOn, modifiedBy) {
    _classCallCheck$8(this, CmdType);

    this.CollateralDocument = collateralDocument;
    this.ModifiedOn = modifiedOn;
    this.ModifiedBy = modifiedBy;
  }

  _createClass$8(CmdType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.UpdateCollateralDocScreen.CmdType",
        interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
        properties: {
          CollateralDocument: CollateralDocument,
          ModifiedOn: Date,
          ModifiedBy: "string"
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }, {
    key: "CompareTo",
    value: function (other) {
      return compareRecords(this, other);
    }
  }]);

  return CmdType;
}();
setType("Lr.Core.UpdateCollateralDocScreen.CmdType", CmdType);
function ToCmd(model) {
  return new CmdType(model.CollateralDocument, now(), "UNKOWN");
}
var EmptyQuery$1 = new QueryType$1(Empty$1, [], "", "");

var _createClass$7 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$7(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Msg$1 = function () {
  function Msg(caseName, fields) {
    _classCallCheck$7(this, Msg);

    this.Case = caseName;
    this.Fields = fields;
  }

  _createClass$7(Msg, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.View.UpdateCollateralDocView.Msg",
        interfaces: ["FSharpUnion", "System.IEquatable"],
        cases: {
          AttachmentId: ["number"],
          LoadRecord: [QueryRequestType$1],
          RecordFailedToLoad: [PropertyError],
          RecordFailedToSave: [PropertyError],
          RecordLoaded: [makeGeneric(Chessie.Result, {
            TSuccess: QueryType$1,
            TMessage: Interface("System.Collections.Generic.IEnumerable")
          })],
          RecordSaved: [makeGeneric(Chessie.Result, {
            TSuccess: CmdType,
            TMessage: Interface("System.Collections.Generic.IEnumerable")
          })],
          ReferToDocumentId: ["number"],
          SaveRecord: []
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsUnions(this, other);
    }
  }]);

  return Msg;
}();
setType("Lr.Core.View.UpdateCollateralDocView.Msg", Msg$1);
var ScreenType$1 = function () {
  function ScreenType(queryModel, currentErrors) {
    _classCallCheck$7(this, ScreenType);

    this.QueryModel = queryModel;
    this.CurrentErrors = currentErrors;
  }

  _createClass$7(ScreenType, [{
    key: _Symbol.reflection,
    value: function () {
      return {
        type: "Lr.Core.View.UpdateCollateralDocView.ScreenType",
        interfaces: ["FSharpRecord", "System.IEquatable"],
        properties: {
          QueryModel: QueryType$1,
          CurrentErrors: Interface("System.Collections.Generic.IEnumerable")
        }
      };
    }
  }, {
    key: "Equals",
    value: function (other) {
      return equalsRecords(this, other);
    }
  }]);

  return ScreenType;
}();
setType("Lr.Core.View.UpdateCollateralDocView.ScreenType", ScreenType$1);
var EmptyScreen$1 = new ScreenType$1(EmptyQuery$1, new List$1());

var getRecord$1 = function () {
  var url = "/api/CollateralDoc/ById";

  var msgOnSuccess = function msgOnSuccess(arg0) {
    return new Msg$1("RecordLoaded", [arg0]);
  };

  var msgOnFailure = function msgOnFailure(arg0_1) {
    return new Msg$1("RecordFailedToLoad", [arg0_1]);
  };

  return function (req) {
    return function (handler) {
      goGet(url, msgOnSuccess, msgOnFailure, req, handler);
    };
  };
}();

var saveRecord = function () {
  var url = "/api/CollateralDoc/Save";

  var msgOnSuccess = function msgOnSuccess(arg0) {
    return new Msg$1("RecordSaved", [arg0]);
  };

  var msgOnFailure = function msgOnFailure(arg0_1) {
    return new Msg$1("RecordFailedToSave", [arg0_1]);
  };

  return function (req) {
    return function (handler) {
      postUpdate(url, msgOnSuccess, msgOnFailure, req, handler);
    };
  };
}();

function InitQueryRequest$1(recordId, colId, requirementId) {
  return new QueryRequestType$1(recordId, colId, requirementId, "Unkown");
}
function Load$1(queryRequest) {
  return getRecord$1(queryRequest);
}
function Save(record) {
  return saveRecord(ToCmd(record));
}

var _createClass$11 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$11(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReactHelpers = function (__exports) {
  var ESCAPE_KEY = __exports.ESCAPE_KEY = 27;
  var ENTER_KEY = __exports.ENTER_KEY = 13;

  var classNames = __exports.classNames = function ($var158) {
    return join(" ", choose$$1(function (tupledArg) {
      return tupledArg[1] ? tupledArg[0] : null;
    }, $var158));
  };

  var onClick = __exports.onClick = function (msg, dispatch) {
    return dispatch(msg);
  };

  var handleInputChg = __exports.handleInputChg = function (dispatch, msg) {
    return function ($var161) {
      return dispatch(function ($var160) {
        return msg(function ($var159) {
          return function (value) {
            return value;
          }(function (ev) {
            return ev.target.value;
          }($var159));
        }($var160));
      }($var161));
    };
  };

  var handleToolboxInputChg = __exports.handleToolboxInputChg = function (dispatch, msg) {
    return function ($var164) {
      return dispatch(function ($var163) {
        return msg(function ($var162) {
          return function (value) {
            return value;
          }(function (strVal) {
            return strVal;
          }($var162));
        }($var163));
      }($var164));
    };
  };

  var handleToolboxAutoCompleteChg = __exports.handleToolboxAutoCompleteChg = function (dispatch, msg) {
    return function ($var167) {
      return dispatch(function ($var166) {
        return msg(function ($var165) {
          return function (value) {
            return value;
          }(function (strVal) {
            return strVal;
          }($var165));
        }($var166));
      }($var167));
    };
  };

  var handleToolboxDateChg = __exports.handleToolboxDateChg = function (dispatch, msg) {
    return function ($var170) {
      return dispatch(function ($var169) {
        return msg(function ($var168) {
          return function (value) {
            return value;
          }(function (dateVal) {
            return dateVal;
          }($var168));
        }($var169));
      }($var170));
    };
  };

  var ChildDataFlow = __exports.ChildDataFlow = function (parentDispatch, msgBuilder, curChildModel, childFlowFunc, childMsg) {
    var newModel = childFlowFunc(childMsg)(curChildModel);
    var newChildMsg = msgBuilder(newModel);
    parentDispatch(newChildMsg);
  };

  var ChildDataFlowWithAsyncs = __exports.ChildDataFlowWithAsyncs = function (parentDispatch, msgBuilder, curChildModel, childFlowFunc, childMsg) {
    var patternInput = childFlowFunc(childMsg)(curChildModel);
    var newChildMsg = msgBuilder(patternInput[0])(patternInput[1]);
    parentDispatch(newChildMsg);
  };

  var ChildDataFlow2 = __exports.ChildDataFlow2 = function (parentDispatch, curChildModel, childFlowFunc, msgBuilder, childMsg) {
    var newModel = childFlowFunc(childMsg)(curChildModel);
    var newChildMsg = msgBuilder(newModel);
    parentDispatch(newChildMsg);
  };

  var ejUploadboxSuccessEvent = __exports.ejUploadboxSuccessEvent = function () {
    function ejUploadboxSuccessEvent(responseText, success) {
      _classCallCheck$11(this, ejUploadboxSuccessEvent);

      this.responseText = responseText;
      this.success = success;
    }

    _createClass$11(ejUploadboxSuccessEvent, [{
      key: _Symbol.reflection,
      value: function () {
        return {
          type: "FsCommons.Presentation.ReactHelpers.ejUploadboxSuccessEvent",
          interfaces: ["FSharpRecord", "System.IEquatable"],
          properties: {
            responseText: "string",
            success: Interface("System.Collections.Generic.IEnumerable")
          }
        };
      }
    }, {
      key: "Equals",
      value: function (other) {
        return equalsRecords(this, other);
      }
    }]);

    return ejUploadboxSuccessEvent;
  }();

  setType("FsCommons.Presentation.ReactHelpers.ejUploadboxSuccessEvent", ejUploadboxSuccessEvent);

  var ejEvent = __exports.ejEvent = function () {
    function ejEvent(value) {
      _classCallCheck$11(this, ejEvent);

      this.value = value;
    }

    _createClass$11(ejEvent, [{
      key: _Symbol.reflection,
      value: function () {
        return {
          type: "FsCommons.Presentation.ReactHelpers.ejEvent",
          interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
          properties: {
            value: "string"
          }
        };
      }
    }, {
      key: "Equals",
      value: function (other) {
        return equalsRecords(this, other);
      }
    }, {
      key: "CompareTo",
      value: function (other) {
        return compareRecords(this, other);
      }
    }]);

    return ejEvent;
  }();

  setType("FsCommons.Presentation.ReactHelpers.ejEvent", ejEvent);

  var raiseInputChg = __exports.raiseInputChg = function (msgSender, msgToSend, newVal) {
    msgSender(msgToSend(newVal.value));
  };

  var raiseIntInputChg = __exports.raiseIntInputChg = function (msgSender, msgToSend, newVal) {
    var matchValue = ConversionHelpers.tryParseInt(newVal.value);

    if (matchValue == null) {} else {
      msgSender(msgToSend(matchValue));
    }
  };

  var EJAutocompleteOption = __exports.EJAutocompleteOption = function () {
    function EJAutocompleteOption(name, index) {
      _classCallCheck$11(this, EJAutocompleteOption);

      this.name = name;
      this.index = index;
    }

    _createClass$11(EJAutocompleteOption, [{
      key: _Symbol.reflection,
      value: function () {
        return {
          type: "FsCommons.Presentation.ReactHelpers.EJAutocompleteOption",
          interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
          properties: {
            name: "string",
            index: "string"
          }
        };
      }
    }, {
      key: "Equals",
      value: function (other) {
        return equalsRecords(this, other);
      }
    }, {
      key: "CompareTo",
      value: function (other) {
        return compareRecords(this, other);
      }
    }]);

    return EJAutocompleteOption;
  }();

  setType("FsCommons.Presentation.ReactHelpers.EJAutocompleteOption", EJAutocompleteOption);

  var ReadOnlyField = __exports.ReadOnlyField = function (label, value) {
    return react.createElement("div", {
      className: "form-group"
    }, react.createElement("label", {}, label), react.createElement("p", {}, value));
  };

  var AutocompleteChoicesFieldInt = __exports.AutocompleteChoicesFieldInt = function (possibleValues, msgToSend, label, value, msgSender) {
    var ejChoices = possibleValues.map(function (tupledArg) {
      return new EJAutocompleteOption(toString(tupledArg[1]), String(tupledArg[0]));
    });
    return react.createElement("div", {
      className: "form-group"
    }, react.createElement("label", {}, label), React.createElement(EJ.Autocomplete, {
      change: function change(newVal) {
        raiseIntInputChg(msgSender, msgToSend, newVal);
      },
      value: value,
      enableAutoFill: true,
      dataSource: ejChoices
    }));
  };

  var UploadFileFieldInt = __exports.UploadFileFieldInt = function (saveUrl, removeUrl, elementId, msgToSend, label, value, msgSender) {
    var successCallback = function successCallback(evt) {
      var matchValue = ConversionHelpers.tryParseInt(evt.responseText);

      if (matchValue == null) {} else {
        msgSender(msgToSend(matchValue));
      }
    };

    return react.createElement("div", {
      className: "form-group"
    }, react.createElement("label", {}, label), React.createElement(EJ.Uploadbox, {
      id: elementId,
      success: successCallback,
      multipleFilesSelection: true,
      saveUrl: saveUrl,
      removeUrl: removeUrl,
      error: 'errorfunc',
      extensionsAllow: '.docx,.pdf',
      extensionsDeny: '.zip,.rar'
    }));
  };

  return __exports;
}({});

function View$1(screen, msgSender) {
  return react.createElement("div", {
    className: "update-collateral-doc-screen"
  }, ReactHelpers.ReadOnlyField("Collateral", screen.QueryModel.CollateralFullName), ReactHelpers.ReadOnlyField("Document Type", screen.QueryModel.DocRequirementName), ReactHelpers.AutocompleteChoicesFieldInt(screen.QueryModel.PossibleReferTos, function (arg0) {
    return new Msg$1("ReferToDocumentId", [arg0]);
  }, "Refer To", screen.QueryModel.CollateralDocument.ReferToDocumentId, msgSender));
}

function update$1(appMsg, screen) {
  if (appMsg.Case === "RecordLoaded") {
    if (appMsg.Fields[0].Case === "Bad") {
      return [function () {
        var CurrentErrors = appMsg.Fields[0].Fields[0].head;
        return new ScreenType$1(screen.QueryModel, CurrentErrors);
      }(), new List$1()];
    } else {
      return [new ScreenType$1(appMsg.Fields[0].Fields[0], screen.CurrentErrors), new List$1()];
    }
  } else if (appMsg.Case === "RecordFailedToLoad") {
    return [function () {
      var CurrentErrors_1 = ofArray([appMsg.Fields[0]]);
      return new ScreenType$1(screen.QueryModel, CurrentErrors_1);
    }(), new List$1()];
  } else if (appMsg.Case === "SaveRecord") {
    return [screen, ofArray([Save(screen.QueryModel)])];
  } else if (appMsg.Case === "RecordSaved") {
    if (appMsg.Fields[0].Case === "Bad") {
      return [function () {
        var CurrentErrors_2 = appMsg.Fields[0].Fields[0].head;
        return new ScreenType$1(screen.QueryModel, CurrentErrors_2);
      }(), new List$1()];
    } else {
      return [screen, new List$1()];
    }
  } else if (appMsg.Case === "RecordFailedToSave") {
    return [function () {
      var CurrentErrors_3 = ofArray([appMsg.Fields[0]]);
      return new ScreenType$1(screen.QueryModel, CurrentErrors_3);
    }(), new List$1()];
  } else if (appMsg.Case === "ReferToDocumentId") {
    return [new ScreenType$1(new QueryType$1(new CollateralDocument(screen.QueryModel.CollateralDocument.CollateralDocumentId, screen.QueryModel.CollateralDocument.CollateralId, screen.QueryModel.CollateralDocument.DocRequirement, appMsg.Fields[0], screen.QueryModel.CollateralDocument.AttachmentId), screen.QueryModel.PossibleReferTos, screen.QueryModel.CollateralFullName, screen.QueryModel.DocRequirementName), screen.CurrentErrors), new List$1()];
  } else if (appMsg.Case === "AttachmentId") {
    return [new ScreenType$1(new QueryType$1(new CollateralDocument(screen.QueryModel.CollateralDocument.CollateralDocumentId, screen.QueryModel.CollateralDocument.CollateralId, screen.QueryModel.CollateralDocument.DocRequirement, screen.QueryModel.CollateralDocument.ReferToDocumentId, appMsg.Fields[0]), screen.QueryModel.PossibleReferTos, screen.QueryModel.CollateralFullName, screen.QueryModel.DocRequirementName), screen.CurrentErrors), new List$1()];
  } else {
    return [screen, ofArray([Load$1(appMsg.Fields[0])])];
  }
}
var emptyModel$1 = EmptyScreen$1;
function init$1(paramQry) {
  return [emptyModel$1, ofArray([Load$1(paramQry)])];
}

function getParamValue$1(qryParams, paramName) {
  return defaultArg(tryFind(function (tupledArg) {
    return equals(tupledArg[0], paramName);
  }, qryParams), null, function (tuple) {
    return tuple[1];
  });
}

function RunScreen$1(divId, qryParams) {
  var recordId = getParamValue$1(qryParams, "recordId");
  var colId = getParamValue$1(qryParams, "colId");
  var requirementId = getParamValue$1(qryParams, "requirementId");
  var matchValue = [recordId, colId, requirementId];
  var $var216 = matchValue[0] != null ? matchValue[1] != null ? matchValue[2] != null ? [0, matchValue[1], matchValue[0], matchValue[2]] : [1] : [1] : [1];

  switch ($var216[0]) {
    case 0:
      var paramQry = InitQueryRequest$1($var216[2], $var216[1], $var216[3]);
      ProgramModule.run(function (program) {
        return withReact(divId, program);
      }(ProgramModule.mkProgram(function () {
        return init$1(paramQry, null);
      }, function (appMsg) {
        return function (screen) {
          return update$1(appMsg, screen);
        };
      }, function (screen_1) {
        return function (msgSender) {
          return View$1(screen_1, msgSender);
        };
      })));
      break;

    case 1:
      throw new Error("Invalid query Paramters recordId,colId,requirementId");
      break;
  }
}

function getUrlParamsAsTuples(url) {
  var firstIdx = url.indexOf("?");

  if (firstIdx > 0) {
    var queryPart = url.substr(firstIdx + 1, url.length - firstIdx);
    return split$$1(queryPart, "&").map(function (pair_1) {
      return split$$1(pair_1, "=");
    }).map(function (pair) {
      if (pair.length === 2) {
        var v = pair[1];
        var k = pair[0];
        return [k, v];
      } else {
        return ["", ""];
      }
    });
  } else {
    return [];
  }
}

var OnInit = function () {
  var currUrl = location.href;
  var urlParams = getUrlParamsAsTuples(currUrl);
  var screenName = urlParams.find(function (tupledArg) {
    return tupledArg[0] === "screen";
  })[1];

  switch (screenName) {
    case "BriefsQueue":
      var divId = "screenPlaceholder";
      return function (qryParams) {
        RunScreen(divId, qryParams);
      };

    case "UpdateCollateralDoc":
      var divId_1 = "screenPlaceholder";
      return function (qryParams_1) {
        RunScreen$1(divId_1, qryParams_1);
      };

    default:
      throw new Error("C:\\Sources\\Repos\\LN\\lnAppl\\XpressLoanRequest\\InTakeFrontEnd\\InTakeFrontEnd.Updaters\\PageInitialization.fs", 32, 14);
  }
}();

exports.OnInit = OnInit;

}((this.InTakeFrontEnd = this.InTakeFrontEnd || {}),ReactDOM,React));
