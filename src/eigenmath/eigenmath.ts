import { Adapter, BasisBlade, BigInteger, Blade, create_algebra, create_flt, create_rat, create_sym, Flt, is_blade, is_flt, is_rat, is_str, is_sym, is_tensor, is_uom, Num, Rat, Str, SumTerm, Sym, Tensor } from 'math-expression-atoms';
import { ExprContext, LambdaExpr } from 'math-expression-context';
import { Native, native_sym } from 'math-expression-native';
import { car, cdr, Cons, cons as create_cons, is_atom, is_cons, nil, U } from 'math-expression-tree';
import { convert_tensor_to_strings } from '../helpers/convert_tensor_to_strings';
import { convertMetricToNative } from '../operators/algebra/create_algebra_as_tensor';
import { is_num } from '../operators/num/is_num';
import { assert_sym } from '../operators/sym/assert_sym';
import { create_uom, is_uom_name } from '../operators/uom/uom';
import { assert_cons } from '../tree/cons/assert_cons';
import { two } from '../tree/rat/Rat';
import { bignum_equal } from './bignum_equal';
import { bignum_itoa } from './bignum_itoa';
import { EigenmathReadScope } from './EigenmathReadScope';
import { EigenmathScope } from './EigenmathScope';
import { ColorCode, html_escape_and_colorize } from './html_escape_and_colorize';
import { isdigit } from './isdigit';
import { isequaln } from './isequaln';
import { isequalq } from './isequalq';
import { isfraction } from './isfraction';
import { isimaginaryunit } from './isimaginaryunit';
import { isinteger } from './isinteger';
import { isminusone } from './isminusone';
import { isnegativenumber } from './isnegativenumber';
import { isnegativeterm } from './isnegativeterm';
import { isposint } from './isposint';

function alloc_tensor(): Tensor {
    return new Tensor([], []);
}

function alloc_matrix(nrow: number, ncol: number): Tensor {
    const p = alloc_tensor();
    p.dims[0] = nrow;
    p.dims[1] = ncol;
    return p;
}

function alloc_vector(n: number): Tensor {
    const p = alloc_tensor();
    p.dims[0] = n;
    return p;
}

function any_radical_factors(h: number, $: ScriptVars): 0 | 1 {
    const n = $.stack.length;
    for (let i = h; i < n; i++)
        if (isradical($.stack[i]))
            return 1;
    return 0;
}

function bignum_int(n: number): BigInteger {
    return new BigInteger(BigInt(n));
}

function bignum_iszero(u: BigInteger): boolean {
    return u.isZero();
}

function bignum_odd(u: BigInteger): boolean {
    return u.isOdd();
}
/*
function bignum_float(u: BigInteger): number {

    const d = u.toJSNumber();

    if (!isFinite(d)) {
        stopf("floating point nan or infinity");
    }

    return d;
}
*/
// convert bignum to int32

function bignum_smallnum(u: BigInteger): number {
    return u.toJSNumber();
}

const MAX_SMALL_INTEGER = new BigInteger(BigInt(Number.MAX_SAFE_INTEGER));
const MIN_SMALL_INTEGER = new BigInteger(BigInt(Number.MIN_SAFE_INTEGER));

function bignum_issmallnum(u: BigInteger): boolean {
    if (u.geq(MIN_SMALL_INTEGER) && u.leq(MAX_SMALL_INTEGER)) {
        return true;
    }
    else {
        return false;
    }
}

/**
 * Pushes a Rat onto the stack.
 * @param sign 
 * @param a 
 * @param b 
 */
function push_bignum(sign: 1 | -1, a: BigInteger, b: BigInteger, $: ScriptVars): void {
    // normalize zero

    if (bignum_iszero(a)) {
        sign = 1;
        if (!bignum_equal(b, 1)) {
            b = bignum_int(1);
        }
    }

    const X: Rat = sign > 0 ? new Rat(a, b) : new Rat(a.negate(), b);

    push(X, $);
}

// convert string to bignum (7 decimal digits fits in 24 bits)
function bignum_atoi(s: string): BigInteger {
    return new BigInteger(BigInt(s));
}

function bignum_cmp(u: BigInteger, v: BigInteger): 0 | 1 | -1 {
    return u.compare(v);
}
// floor(u / v)

function bignum_div(u: BigInteger, v: BigInteger): BigInteger {
    return u.divide(v);
}

function bignum_mod(u: BigInteger, v: BigInteger): BigInteger {
    return u.mod(v);
}

function bignum_pow(u: BigInteger, v: BigInteger): BigInteger {
    if (v.isNegative()) {
        throw new Error(`bignum_pow(u=${u}, v=${v}): v must be positive.`);
    }
    const result = u.pow(v);
    return result;
}

// returns null if not perfect root, otherwise returns u^(1/v)

function bignum_root(u: BigInteger, v: BigInteger): BigInteger | null {
    return u.pow(new BigInteger(BigInt(1)).divide(v));
}

function caaddr(p: U): U {
    return car(car(cdr(cdr(p))));
}

function caadr(p: U): U {
    return car(car(cdr(p)));
}

function cadaddr(p: U): U {
    return car(cdr(car(cdr(cdr(p)))));
}

function cadadr(p: U): U {
    return car(cdr(car(cdr(p))));
}

function caddddr(p: U): U {
    return car(cdr(cdr(cdr(cdr(p)))));
}

function cadddr(p: U): U {
    return car(cdr(cdr(cdr(p))));
}

function caddr(p: U): U {
    return car(cdr(cdr(p)));
}

function cadr(p: U): U {
    return car(cdr(p));
}

function cancel_factor($: ScriptVars): void {

    let p2 = pop($);
    const p1 = pop($);

    if (car(p2).equals(ADD)) {
        const h = $.stack.length;
        p2 = cdr(p2);
        while (is_cons(p2)) {
            push(p1, $);
            push(car(p2), $);
            multiply($);
            p2 = cdr(p2);
        }
        add_terms($.stack.length - h, $);
        return;
    }

    push(p1, $);
    push(p2, $);
    multiply($);
}

function cdadr(p: U): Cons {
    return cdr(car(cdr(p)));
}

function cddadr(p: U): Cons {
    return cdr(cdr(car(cdr(p))));
}

function cddddr(p: U): Cons {
    return cdr(cdr(cdr(cdr(p))));
}

function cdddr(p: U): Cons {
    return cdr(cdr(cdr(p)));
}

function cddr(p: U): Cons {
    return cdr(cdr(p));
}

function cmp(lhs: U, rhs: U): 1 | 0 | -1 {

    if (lhs === rhs)
        return 0;

    if (lhs.isnil)
        return -1;

    if (rhs.isnil)
        return 1;

    if (is_num(lhs) && is_num(rhs))
        return cmp_numbers(lhs, rhs);

    if (is_num(lhs))
        return -1;

    if (is_num(rhs))
        return 1;

    if (is_str(lhs) && isstring(rhs))
        return cmp_strings(lhs.str, rhs.str);

    if (is_str(lhs))
        return -1;

    if (is_str(rhs))
        return 1;

    if (is_sym(lhs) && issymbol(rhs)) {
        // The comparison is by namespace then localName.
        return lhs.compare(rhs);
    }

    if (is_sym(lhs))
        return -1;

    if (is_sym(rhs))
        return 1;

    if (is_tensor(lhs) && istensor(rhs))
        return cmp_tensors(lhs, rhs);

    if (is_tensor(lhs))
        return -1;

    if (is_tensor(rhs))
        return 1;

    while (is_cons(lhs) && is_cons(rhs)) {
        const t = cmp(car(lhs), car(rhs));
        if (t)
            return t;
        lhs = cdr(lhs);
        rhs = cdr(rhs);
    }

    if (is_cons(rhs))
        return -1; // lengthf(p1) < lengthf(p2)

    if (is_cons(lhs))
        return 1; // lengthf(p1) > lengthf(p2)

    if (is_uom(lhs) && is_uom(rhs)) {
        // TODO: Perhaps there is a better way to compare?
        return cmp_strings(lhs.toString(), rhs.toString());
    }

    if (is_uom(lhs)) {
        return -1;
    }

    if (is_uom(rhs)) {
        return 1;
    }

    // console.lg(`cmp(lhs=${lhs}, rhs=${rhs})=>0`);
    return 0;
}

function cmp_factors(p1: U, p2: U): 0 | 1 | -1 {

    const a = order_factor(p1);
    const b = order_factor(p2);

    if (a < b)
        return -1;

    if (a > b)
        return 1;

    let base1: U;
    let base2: U;
    let expo1: U;
    let expo2: U;

    if (is_cons(p1) && p1.opr.equals(POWER)) {
        base1 = p1.base;
        expo1 = p1.expo;
    }
    else {
        base1 = p1;
        expo1 = one;
    }

    if (is_cons(p2) && p2.opr.equals(POWER)) {
        base2 = p2.base;
        expo2 = p2.expo;
    }
    else {
        base2 = p2;
        expo2 = one;
    }

    let c = cmp(base1, base2);

    if (c === 0)
        c = cmp(expo2, expo1); // swapped to reverse sort order

    return c;
}

function cmp_factors_provisional(p1: U, p2: U): 0 | 1 | -1 {
    if (is_cons(p1) && p1.opr.equals(POWER))
        p1 = p1.base;

    if (is_cons(p2) && p2.opr.equals(POWER))
        p2 = p2.base;

    return cmp(p1, p2);
}

function cmp_numbers(p1: Num, p2: Num): 1 | 0 | -1 {

    if (is_rat(p1) && is_rat(p2)) {
        return p1.compare(p2);
    }

    const d1 = assert_num_to_number(p1);

    const d2 = assert_num_to_number(p2);

    if (d1 < d2)
        return -1;

    if (d1 > d2)
        return 1;

    return 0;
}

// this way matches strcmp (localeCompare differs from strcmp)
function cmp_strings(s1: string, s2: string): 0 | 1 | -1 {
    if (s1 < s2)
        return -1;
    if (s1 > s2)
        return 1;
    return 0;
}

function cmp_tensors(p1: Tensor, p2: Tensor): 1 | 0 | -1 {
    const t = p1.ndim - p2.ndim;

    if (t)
        return t > 0 ? 1 : t < 0 ? -1 : 0;

    for (let i = 0; i < p1.ndim; i++) {
        const t = p1.dims[i] - p2.dims[i];
        if (t)
            return t > 0 ? 1 : t < 0 ? -1 : 0;
    }

    for (let i = 0; i < p1.nelem; i++) {
        const t = cmp(p1.elems[i], p2.elems[i]);
        if (t)
            return t;
    }

    return 0;
}
// push coefficients of polynomial P(X) on stack

function coeffs(P: U, X: U, $: ScriptVars): void {

    for (; ;) {

        push(P, $);
        push(X, $);
        push_integer(0, $);
        subst($);
        value_of($);
        const C = pop($);

        push(C, $);

        push(P, $);
        push(C, $);
        subtract($);
        P = pop($);

        if (iszero(P))
            break;

        push(P, $);
        push(X, $);
        divide($);
        P = pop($);
    }
}

function combine_factors(h: number, $: ScriptVars): void {
    // console.lg(`before sort factors provisional: ${$.stack}`);
    sort_factors_provisional(h, $);
    // console.lg(`after sort factors provisional: ${$.stack}`);
    let n = $.stack.length;
    for (let i = h; i < n - 1; i++) {
        if (combine_factors_nib(i, i + 1, $)) {
            $.stack.splice(i + 1, 1); // remove factor
            i--; // use same index again
            n--;
        }
    }
}

function combine_factors_nib(i: number, j: number, $: ScriptVars): 0 | 1 {
    let BASE1: U;
    let EXPO1: U;
    let BASE2: U;
    let EXPO2: U;

    const p1 = $.stack[i];
    const p2 = $.stack[j];

    if (is_cons(p1) && p1.opr.equals(POWER)) {
        BASE1 = p1.base;
        EXPO1 = p1.expo;
    }
    else {
        BASE1 = p1;
        EXPO1 = one;
    }

    if (car(p2).equals(POWER)) {
        BASE2 = cadr(p2);
        EXPO2 = caddr(p2);
    }
    else {
        BASE2 = p2;
        EXPO2 = one;
    }

    // console.lg(`BASE1=${BASE1}, BASE2=${BASE2}`);
    if (!equal(BASE1, BASE2)) {
        return 0;
    }

    // console.lg(`BASE1=${BASE1}, BASE2=${BASE2} are considered EQUAL`);

    if (is_flt(BASE2))
        BASE1 = BASE2; // if mixed rational and double, use double

    push(POWER, $);
    push(BASE1, $);
    push(EXPO1, $);
    push(EXPO2, $);
    add($);
    list(3, $);

    $.stack[i] = pop($);

    return 1;
}

function combine_numerical_factors(start: number, coeff: Num, $: ScriptVars): Num {

    let end = $.stack.length;

    for (let i = start; i < end; i++) {

        const p1 = $.stack[i];

        if (is_num(p1)) {
            multiply_numbers(coeff, p1, $);
            coeff = pop($) as Num;
            $.stack.splice(i, 1); // remove factor
            i--;
            end--;
        }
    }

    return coeff;
}

function compatible_dimensions(p1: U, p2: U): 0 | 1 {

    if (!istensor(p1) && !istensor(p2))
        return 1; // both are scalars

    if (!istensor(p1) || !istensor(p2))
        return 0; // scalar and tensor

    const n = p1.ndim;

    if (n !== p2.ndim)
        return 0;

    for (let i = 0; i < n; i++)
        if (p1.dims[i] !== p2.dims[i])
            return 0;

    return 1;
}

function complexity(p: U): number {
    let n = 1;
    while (is_cons(p)) {
        n += complexity(car(p));
        p = cdr(p);
    }
    return n;
}

/**
 * ( pop1 pop2 => Cons(pop2, pop1) )
 */
function cons($: ScriptVars): void {
    const pop1 = pop($);
    const pop2 = pop($);
    push(create_cons(pop2, pop1), $);
}

const ABS = native_sym(Native.abs);
const ADJ = create_sym("adj");
const ALGEBRA = create_sym("algebra");
const AND = create_sym("and");
const ARCCOS = native_sym(Native.arccos);
const ARCCOSH = native_sym(Native.arccosh);
const ARCSIN = native_sym(Native.arcsin);
const ARCSINH = native_sym(Native.arcsinh);
const ARCTAN = native_sym(Native.arctan);
const ARCTANH = native_sym(Native.arctanh);
const ARG = create_sym("arg");
const BINDING = create_sym("binding");
const CEILING = create_sym("ceiling");
const CHECK = create_sym("check");
const CIRCEXP = create_sym("circexp");
const CLEAR = create_sym("clear");
const CLOCK = create_sym("clock");
const COFACTOR = create_sym("cofactor");
const CONJ = create_sym("conj");
const CONTRACT = create_sym("contract");
const COS = native_sym(Native.cos);
const COSH = native_sym(Native.cosh);
const DEFINT = create_sym("defint");
const DENOMINATOR = create_sym("denominator");
const DERIVATIVE = create_sym("derivative");
const DET = create_sym("det");
const DIM = create_sym("dim");
const DO = create_sym("do");
const DOT = create_sym("dot");
const EIGENVEC = create_sym("eigenvec");
const ERF = create_sym("erf");
const ERFC = create_sym("erfc");
const EVAL = create_sym("eval");
const EXIT = create_sym("exit");
const EXP = native_sym(Native.exp);
const EXPCOS = create_sym("expcos");
const EXPCOSH = create_sym("expcosh");
const EXPSIN = create_sym("expsin");
const EXPSINH = create_sym("expsinh");
const EXPTAN = create_sym("exptan");
const EXPTANH = create_sym("exptanh");
const FACTORIAL = create_sym("factorial");
const FLOAT = create_sym("float");
const FLOOR = create_sym("floor");
const FOR = create_sym("for");
const HADAMARD = create_sym("hadamard");
const IMAG = create_sym("imag");
const INNER = create_sym("inner");
const INTEGRAL = create_sym("integral");
const INV = create_sym("inv");
const KRONECKER = create_sym("kronecker");
const LOG = native_sym(Native.log);
const MAG = create_sym("mag");
const MINOR = create_sym("minor");
const MINORMATRIX = create_sym("minormatrix");
const MOD = create_sym("mod");
const NOEXPAND = create_sym("noexpand");
const NOT = create_sym("not");
const NROOTS = create_sym("nroots");
const NUMBER = create_sym("number");
const NUMERATOR = create_sym("numerator");
const OR = create_sym("or");
const OUTER = create_sym("outer");
const POLAR = create_sym("polar");
const PREFIXFORM = create_sym("prefixform");
const PRODUCT = create_sym("product");
const QUOTE = create_sym("quote");
const RANK = create_sym("rank");
const RATIONALIZE = create_sym("rationalize");
const REAL = create_sym("real");
const RECT = create_sym("rect");
const ROOTS = create_sym("roots");
const ROTATE = create_sym("rotate");
const SGN = create_sym("sgn");
const SIMPLIFY = create_sym("simplify");
const SIN = native_sym(Native.sin);
const SINH = native_sym(Native.sinh);
const SQRT = create_sym("sqrt");
const STATUS = create_sym("status");
const STOP = create_sym("stop");
const SUBST = create_sym("subst");
const SUM = create_sym("sum");
const TAN = native_sym(Native.tan);
const TANH = native_sym(Native.tanh);
const TAU = native_sym(Native.tau);
const TAYLOR = create_sym("taylor");
const TEST = create_sym("test");
const TESTEQ = create_sym("testeq");
const TESTGE = create_sym("testge");
const TESTGT = create_sym("testgt");
const TESTLE = create_sym("testle");
const TESTLT = create_sym("testlt");
const TRANSPOSE = create_sym("transpose");
export const TTY = create_sym("tty");
const UNIT = create_sym("unit");
const UOM = create_sym("uom");
const ZERO = create_sym("zero");

const ADD = native_sym(Native.add);
const MULTIPLY = native_sym(Native.multiply);
const POWER = native_sym(Native.pow);
const INDEX = native_sym(Native.component);
const ASSIGN = native_sym(Native.assign);

export const LAST = create_sym("last");
/**
 * mathematical constant Pi
 */
const Pi = native_sym(Native.PI);
const TRACE = create_sym("trace");

/**
 * 'd'
 */
const D_LOWER = create_sym("d");
/**
 * 'i'
 */
const I_LOWER = create_sym("i");
const J_LOWER = create_sym("j");
const X_LOWER = create_sym("x");

const DOLLAR_E = create_sym("$e");
const DOLLAR_A = create_sym("$a");
const DOLLAR_B = create_sym("$b");
const DOLLAR_X = create_sym("$x");

const ARG1 = create_sym("$1");
const ARG2 = create_sym("$2");
const ARG3 = create_sym("$3");
const ARG4 = create_sym("$4");
const ARG5 = create_sym("$5");
const ARG6 = create_sym("$6");
const ARG7 = create_sym("$7");
const ARG8 = create_sym("$8");
const ARG9 = create_sym("$9");

function copy_tensor(p1: Tensor) {

    const p2 = alloc_tensor();

    let n = p1.ndim;

    for (let i = 0; i < n; i++)
        p2.dims[i] = p1.dims[i];

    n = p1.nelem;

    for (let i = 0; i < n; i++)
        p2.elems[i] = p1.elems[i];

    return p2;
}

function decomp($: ScriptVars) {

    const X = pop($);
    const F = pop($);

    // is the entire expression constant?

    if (!findf(F, X, $)) {
        push(F, $);
        return;
    }

    // sum?

    if (car(F).equals(ADD)) {
        decomp_sum(F, X, $);
        return;
    }

    // product?

    if (car(F).equals(MULTIPLY)) {
        decomp_product(F, X, $);
        return;
    }

    // naive decomp

    let p1 = cdr(F);
    while (is_cons(p1)) {
        push(car(p1), $);
        push(X, $);
        decomp($);
        p1 = cdr(p1);
    }
}

function decomp_sum(F: U, X: U, $: ScriptVars): void {

    let p2: U;

    let h = $.stack.length;

    // partition terms

    let p1: U = cdr(F);

    while (is_cons(p1)) {
        p2 = car(p1);
        if (findf(p2, X, $)) {
            if (car(p2).equals(MULTIPLY)) {
                push(p2, $);
                push(X, $);
                partition_term($);	// push const part then push var part
            }
            else {
                push_integer(1, $);	// const part
                push(p2, $);		// var part
            }
        }
        p1 = cdr(p1);
    }

    // combine const parts of matching var parts

    let n = $.stack.length - h;

    for (let i = 0; i < n - 2; i += 2)
        for (let j = i + 2; j < n; j += 2) {
            if (!equal($.stack[h + i + 1], $.stack[h + j + 1]))
                continue;
            push($.stack[h + i], $); // add const parts
            push($.stack[h + j], $);
            add($);
            $.stack[h + i] = pop($);
            for (let k = j; k < n - 2; k++)
                $.stack[h + k] = $.stack[h + k + 2];
            j -= 2; // use same j again
            n -= 2;
            $.stack.splice($.stack.length - 2); // pop
        }

    // push const parts, decomp var parts

    list($.stack.length - h, $);
    p1 = pop($);

    while (is_cons(p1)) {
        push(car(p1), $); // const part
        push(cadr(p1), $); // var part
        push(X, $);
        decomp($);
        p1 = cddr(p1);
    }

    // add together all constant terms

    h = $.stack.length;
    p1 = cdr(F);
    while (is_cons(p1)) {
        if (!findf(car(p1), X, $))
            push(car(p1), $);
        p1 = cdr(p1);
    }

    n = $.stack.length - h;

    if (n > 1) {
        list(n, $);
        push(ADD, $);
        swap($);
        cons($); // makes ADD head of list
    }
}

function decomp_product(F: U, X: U, $: ScriptVars): void {

    // decomp factors involving x

    let p1 = cdr(F);
    while (is_cons(p1)) {
        if (findf(car(p1), X, $)) {
            push(car(p1), $);
            push(X, $);
            decomp($);
        }
        p1 = cdr(p1);
    }

    // combine constant factors

    const h = $.stack.length;
    p1 = cdr(F);
    while (is_cons(p1)) {
        if (!findf(car(p1), X, $))
            push(car(p1), $);
        p1 = cdr(p1);
    }

    const n = $.stack.length - h;

    if (n > 1) {
        list(n, $);
        push(MULTIPLY, $);
        swap($);
        cons($); // makes MULTIPLY head of list
    }
}

function divide($: ScriptVars): void {
    reciprocate($);
    multiply($);
}

/**
 * ( x -- x x )
 * @param $ 
 */
function dupl($: ScriptVars): void {
    const p1 = pop($);
    push(p1, $);
    push(p1, $);
}

function equal(p1: U, p2: U): boolean {
    return cmp(p1, p2) === 0;
}

function eval_abs(expr: U, $: ScriptVars): void {
    push(cadr(expr), $);
    value_of($);
    absfunc($);
}

function absfunc($: ScriptVars): void {

    let p1 = pop($);

    if (is_num(p1)) {
        push(p1, $);
        if (isnegativenumber(p1))
            negate($);
        return;
    }

    if (is_tensor(p1)) {
        if (p1.ndim > 1) {
            push(ABS, $);
            push(p1, $);
            list(2, $);
            return;
        }
        push(p1, $);
        push(p1, $);
        conjfunc($);
        inner($);
        push_rational(1, 2, $);
        power($);
        return;
    }

    push(p1, $);
    push(p1, $);
    conjfunc($);
    multiply($);
    push_rational(1, 2, $);
    power($);

    const p2 = pop($);
    push(p2, $);
    floatfunc($);
    const p3 = pop($);
    if (is_flt(p3)) {
        push(p2, $);
        if (isnegativenumber(p3))
            negate($);
        return;
    }

    // abs(1/a) evaluates to 1/abs(a)

    if (car(p1).equals(POWER) && isnegativeterm(caddr(p1))) {
        push(p1, $);
        reciprocate($);
        absfunc($);
        reciprocate($);
        return;
    }

    // abs(a*b) evaluates to abs(a)*abs(b)

    if (car(p1).equals(MULTIPLY)) {
        const h = $.stack.length;
        p1 = cdr(p1);
        while (is_cons(p1)) {
            push(car(p1), $);
            absfunc($);
            p1 = cdr(p1);
        }
        multiply_factors($.stack.length - h, $);
        return;
    }

    if (isnegativeterm(p1) || (car(p1).equals(ADD) && isnegativeterm(cadr(p1)))) {
        push(p1, $);
        negate($);
        p1 = pop($);
    }

    push(ABS, $);
    push(p1, $);
    list(2, $);
}

function eval_add(p1: U, $: ScriptVars): void {
    const h = $.stack.length;
    $.expanding--; // undo expanding++ in evalf
    p1 = cdr(p1);
    while (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
        p1 = cdr(p1);
    }
    add_terms($.stack.length - h, $);
    $.expanding++;
}

function add($: ScriptVars): void {
    add_terms(2, $);
}

function add_terms(n: number, $: ScriptVars): void {

    if (n < 2)
        return;

    const h = $.stack.length - n;

    flatten_terms(h, $);

    let T = combine_tensors(h, $);

    combine_terms(h, $);

    if (simplify_terms(h, $))
        combine_terms(h, $);

    n = $.stack.length - h;

    if (n === 0) {
        if (is_tensor(T))
            push(T, $);
        else
            push_integer(0, $);
        return;
    }

    if (n > 1) {
        list(n, $);
        push(ADD, $);
        swap($);
        cons($); // prepend ADD to list
    }

    if (!istensor(T))
        return;

    const p1 = pop($);

    T = copy_tensor(T);

    n = T.nelem;

    for (let i = 0; i < n; i++) {
        push(T.elems[i], $);
        push(p1, $);
        add($);
        T.elems[i] = pop($);
    }

    push(T, $);
}

function flatten_terms(h: number, $: ScriptVars): void {
    const n = $.stack.length;
    for (let i = h; i < n; i++) {
        let p1 = $.stack[i];
        if (car(p1).equals(ADD)) {
            $.stack[i] = cadr(p1);
            p1 = cddr(p1);
            while (is_cons(p1)) {
                push(car(p1), $);
                p1 = cdr(p1);
            }
        }
    }
}

function combine_tensors(h: number, $: ScriptVars): Tensor {
    let T: U = nil;
    for (let i = h; i < $.stack.length; i++) {
        const p1 = $.stack[i];
        if (is_tensor(p1)) {
            if (is_tensor(T)) {
                push(T, $);
                push(p1, $);
                add_tensors($);
                T = pop($);
            }
            else
                T = p1;
            $.stack.splice(i, 1);
            i--; // use same index again
        }
    }
    return T as Tensor;
}

function add_tensors($: ScriptVars): void {

    const p2 = pop($) as Tensor;
    let p1 = pop($) as Tensor;

    if (!compatible_dimensions(p1, p2))
        stopf("incompatible tensor arithmetic");

    p1 = copy_tensor(p1);

    const n = p1.nelem;

    for (let i = 0; i < n; i++) {
        push(p1.elems[i], $);
        push(p2.elems[i], $);
        add($);
        p1.elems[i] = pop($);
    }

    push(p1, $);
}

function combine_terms(h: number, $: ScriptVars): void {
    sort_terms(h, $);
    for (let i = h; i < $.stack.length - 1; i++) {
        if (combine_terms_nib(i, i + 1, $)) {
            if (iszero($.stack[i]))
                $.stack.splice(i, 2); // remove 2 terms
            else
                $.stack.splice(i + 1, 1); // remove 1 term
            i--; // use same index again
        }
    }
    if (h < $.stack.length && iszero($.stack[$.stack.length - 1]))
        $.stack.pop();
}

function combine_terms_nib(i: number, j: number, $: ScriptVars): 1 | 0 {

    let p1 = $.stack[i];
    let p2 = $.stack[j];

    if (iszero(p2))
        return 1;

    if (iszero(p1)) {
        $.stack[i] = p2;
        return 1;
    }

    if (is_num(p1) && is_num(p2)) {
        add_numbers(p1, p2, $);
        $.stack[i] = pop($);
        return 1;
    }

    if (is_num(p1) || is_num(p2))
        return 0; // cannot add number and something else

    let coeff1: U = one;
    let coeff2: U = one;

    let denorm = 0;

    if (car(p1).equals(MULTIPLY)) {
        p1 = cdr(p1);
        denorm = 1;
        if (is_num(car(p1))) {
            coeff1 = car(p1);
            p1 = cdr(p1);
            if (cdr(p1).isnil) {
                p1 = car(p1);
                denorm = 0;
            }
        }
    }

    if (car(p2).equals(MULTIPLY)) {
        p2 = cdr(p2);
        if (is_num(car(p2))) {
            coeff2 = car(p2);
            p2 = cdr(p2);
            if (cdr(p2).isnil)
                p2 = car(p2);
        }
    }

    if (!equal(p1, p2))
        return 0;

    add_numbers(coeff1, coeff2, $);

    coeff1 = pop($);

    if (iszero(coeff1)) {
        $.stack[i] = coeff1;
        return 1;
    }

    if (isplusone(coeff1) && !is_flt(coeff1)) {
        if (denorm) {
            push(MULTIPLY, $);
            push(p1, $); // p1 is a list, not an atom
            cons($); // prepend MULTIPLY
        }
        else
            push(p1, $);
    }
    else {
        if (denorm) {
            push(MULTIPLY, $);
            push(coeff1, $);
            push(p1, $); // p1 is a list, not an atom
            cons($); // prepend coeff1
            cons($); // prepend MULTIPLY
        }
        else {
            push(MULTIPLY, $);
            push(coeff1, $);
            push(p1, $);
            list(3, $);
        }
    }

    $.stack[i] = pop($);

    return 1;
}

function sort_terms(h: number, $: ScriptVars): void {
    const compareFn = (lhs: U, rhs: U) => cmp_terms(lhs, rhs);
    const t = $.stack.splice(h).sort(compareFn);
    $.stack = $.stack.concat(t);
}

function cmp_terms(p1: U, p2: U): 0 | 1 | -1 {

    // 1st level: imaginary terms on the right

    let a = isimaginaryterm(p1);
    let b = isimaginaryterm(p2);

    if (a === 0 && b === 1)
        return -1; // ok

    if (a === 1 && b === 0)
        return 1; // out of order

    // 2nd level: numericals on the right

    if (is_num(p1) && is_num(p2))
        return 0; // don't care about order, save time, don't compare

    if (is_num(p1))
        return 1; // out of order

    if (is_num(p2))
        return -1; // ok

    // 3rd level: sort by factors

    a = 0;
    b = 0;

    if (car(p1).equals(MULTIPLY)) {
        p1 = cdr(p1);
        a = 1; // p1 is a list of factors
        if (is_num(car(p1))) {
            // skip over coeff
            p1 = cdr(p1);
            if (cdr(p1).isnil) {
                p1 = car(p1);
                a = 0;
            }
        }
    }

    if (car(p2).equals(MULTIPLY)) {
        p2 = cdr(p2);
        b = 1; // p2 is a list of factors
        if (is_num(car(p2))) {
            // skip over coeff
            p2 = cdr(p2);
            if (cdr(p2).isnil) {
                p2 = car(p2);
                b = 0;
            }
        }
    }

    if (a === 0 && b === 0)
        return cmp_factors(p1, p2);

    if (a === 0 && b === 1) {
        let c = cmp_factors(p1, car(p2));
        if (c === 0)
            c = -1; // lengthf(p1) < lengthf(p2)
        return c;
    }

    if (a === 1 && b === 0) {
        let c = cmp_factors(car(p1), p2);
        if (c === 0)
            c = 1; // lengthf(p1) > lengthf(p2)
        return c;
    }

    while (is_cons(p1) && is_cons(p2)) {
        const c = cmp_factors(car(p1), car(p2));
        if (c)
            return c;
        p1 = cdr(p1);
        p2 = cdr(p2);
    }

    if (is_cons(p1))
        return 1; // lengthf(p1) > lengthf(p2)

    if (is_cons(p2))
        return -1; // lengthf(p1) < lengthf(p2)

    return 0;
}

function simplify_terms(h: number, $: ScriptVars): number {
    let n = 0;
    for (let i = h; i < $.stack.length; i++) {
        const p1 = $.stack[i];
        if (isradicalterm(p1)) {
            push(p1, $);
            value_of($);
            const p2 = pop($);
            if (!equal(p1, p2)) {
                $.stack[i] = p2;
                n++;
            }
        }
    }
    return n;
}

function isradicalterm(p: U): boolean {
    return car(p).equals(MULTIPLY) && is_num(cadr(p)) && isradical(caddr(p));
}

function isimaginaryterm(p: U): 0 | 1 {
    if (isimaginaryfactor(p))
        return 1;
    if (car(p).equals(MULTIPLY)) {
        p = cdr(p);
        while (is_cons(p)) {
            if (isimaginaryfactor(car(p)))
                return 1;
            p = cdr(p);
        }
    }
    return 0;
}

// DGH
function isimaginaryfactor(p: U): boolean | 0 {
    return car(p).equals(POWER) && isminusone(cadr(p));
}

function add_numbers(p1: U, p2: U, $: ScriptVars): void {

    if (is_rat(p1) && is_rat(p2)) {
        add_rationals(p1, p2, $);
        return;
    }

    const a = assert_num_to_number(p1);

    const b = assert_num_to_number(p2);

    push_double(a + b, $);
}

function add_rationals(p1: Rat, p2: Rat, $: ScriptVars): void {
    const sum = p1.add(p2);
    push(sum, $);
}

function eval_adj(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    adj($);
}

function adj($: ScriptVars): void {

    const p1 = pop($);

    if (!istensor(p1)) {
        push_integer(1, $); // adj of scalar is 1 because adj = det inv
        return;
    }

    if (!issquarematrix(p1))
        stopf("adj: square matrix expected");

    const n = p1.dims[0];

    // p2 is the adjunct matrix

    const p2 = alloc_matrix(n, n);

    if (n === 2) {
        p2.elems[0] = p1.elems[3];
        push(p1.elems[1], $);
        negate($);
        p2.elems[1] = pop($);
        push(p1.elems[2], $);
        negate($);
        p2.elems[2] = pop($);
        p2.elems[3] = p1.elems[0];
        push(p2, $);
        return;
    }

    // p3 is for computing cofactors

    const p3 = alloc_matrix(n - 1, n - 1);

    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            let k = 0;
            for (let i = 0; i < n; i++)
                for (let j = 0; j < n; j++)
                    if (i !== row && j !== col)
                        p3.elems[k++] = p1.elems[n * i + j];
            push(p3, $);
            det($);
            if ((row + col) % 2)
                negate($);
            p2.elems[n * col + row] = pop($); // transpose
        }
    }

    push(p2, $);
}

function eval_algebra(expr: U, $: ScriptVars): void {
    push(assert_cons(expr).item(1), $);
    value_of($);
    const metric = pop($);
    if (!is_tensor(metric)) {
        stopf('');
    }
    push(assert_cons(expr).item(2), $);
    value_of($);
    const labels = pop($);
    if (!is_tensor(labels)) {
        stopf('');
    }
    push_algebra_tensor(metric, labels, $);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function push_algebra_tensor(metric: Tensor<U>, labels: Tensor<U>, $: ScriptVars): void {
    const metricNative: U[] = convertMetricToNative(metric);
    const labelsNative: string[] = convert_tensor_to_strings(labels);
    const T: Tensor<U> = create_algebra_as_tensor(metricNative, labelsNative, $);
    push(T, $);
}

class AlgebraFieldAdapter implements Adapter<U, U> {
    constructor(private readonly dimensions: number, private readonly $: ScriptVars) {
    }
    get ε(): U {
        return create_flt(1e-6);
    }
    get one(): U {
        return one;
    }
    get zero(): U {
        return zero;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abs(arg: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    add(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sub(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    eq(lhs: U, rhs: U): boolean {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ne(lhs: U, rhs: U): boolean {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    le(lhs: U, rhs: U): boolean {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lt(lhs: U, rhs: U): boolean {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ge(lhs: U, rhs: U): boolean {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gt(lhs: U, rhs: U): boolean {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    max(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    min(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mul(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    div(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    neg(arg: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    asString(arg: U): string {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cos(arg: U): U {
        throw new Error('Method not implemented.');
    }
    isField(arg: U | BasisBlade<U, U>): arg is U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOne(arg: U): boolean {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isZero(arg: U): boolean {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sin(arg: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sqrt(arg: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isDimension(arg: U): boolean {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dim(arg: U): number {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sum(terms: SumTerm<U, U>[]): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extractGrade(arg: U, grade: number): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    treeAdd(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    treeLco(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    treeMul(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    treeScp(lhs: U, rhs: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    treeSqrt(arg: U): U {
        throw new Error('Method not implemented.');
    }
    treeZero(): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    weightToTree(arg: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    scalarCoordinate(arg: U): U {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bladeToTree(blade: BasisBlade<U, U>): U {
        throw new Error('Method not implemented.');
    }
}

function create_algebra_as_tensor<T extends U>(metric: T[], labels: string[], $: ScriptVars): Tensor<U> {
    const uFieldAdaptor = new AlgebraFieldAdapter(metric.length, $);
    const GA = create_algebra(metric, uFieldAdaptor, labels);
    /**
     * Number of basis vectors in algebra is dimensionality.
     */
    const dimensions = metric.length;
    const dims = [metric.length];
    const elems = new Array<Blade>(dimensions);
    for (let index = 0; index < dimensions; index++) {
        elems[index] = GA.unit(index);
    }
    return new Tensor(dims, elems);
}

function eval_and(p1: U, $: ScriptVars): void {
    p1 = cdr(p1);
    while (is_cons(p1)) {
        push(car(p1), $);
        evalp($);
        const p2 = pop($);
        if (iszero(p2)) {
            push_integer(0, $);
            return;
        }
        p1 = cdr(p1);
    }
    push_integer(1, $);
}

/**
 * Evaluates the given exprression in the specified context and returns the result.
 * @param expression The expression to be evaluated.
 * @param $ The expression context.
 */
export function evaluate_expression(expression: U, $: ScriptVars): U {
    push(expression, $);
    value_of($);
    return pop($);
}

function eval_arccos(p1: U, $: ScriptVars) {
    push(cadr(p1), $);
    value_of($);
    arccos($);
}

function arccos($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            arccos($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        if (-1.0 <= d && d <= 1.0) {
            d = Math.acos(d);
            push_double(d, $);
            return;
        }
    }

    // arccos(z) = -i log(z + i sqrt(1 - z^2))

    if (is_flt(p1) || isdoublez(p1)) {
        push_double(1.0, $);
        push(p1, $);
        push(p1, $);
        multiply($);
        subtract($);
        sqrtfunc($);
        push(imaginaryunit, $);
        multiply($);
        push(p1, $);
        add($);
        logfunc($);
        push(imaginaryunit, $);
        multiply($);
        negate($);
        return;
    }

    // arccos(1 / sqrt(2)) = 1/4 Pi

    if (isoneoversqrttwo(p1)) {
        push_rational(1, 4, $);
        push(Pi, $);
        multiply($);
        return;
    }

    // arccos(-1 / sqrt(2)) = 3/4 Pi

    if (isminusoneoversqrttwo(p1)) {
        push_rational(3, 4, $);
        push(Pi, $);
        multiply($);
        return;
    }

    // arccos(0) = 1/2 Pi

    if (iszero(p1)) {
        push_rational(1, 2, $);
        push(Pi, $);
        multiply($);
        return;
    }

    // arccos(1/2) = 1/3 Pi

    if (isequalq(p1, 1, 2)) {
        push_rational(1, 3, $);
        push(Pi, $);
        multiply($);
        return;
    }

    // arccos(1) = 0

    if (isplusone(p1)) {
        push_integer(0, $);
        return;
    }

    // arccos(-1/2) = 2/3 Pi

    if (isequalq(p1, -1, 2)) {
        push_rational(2, 3, $);
        push(Pi, $);
        multiply($);
        return;
    }

    // arccos(-1) = Pi

    if (isminusone(p1)) {
        push(Pi, $);
        return;
    }

    push(ARCCOS, $);
    push(p1, $);
    list(2, $);
}

function eval_arccosh(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    arccosh($);
}

function arccosh($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            arccosh($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        if (d >= 1.0) {
            d = Math.acosh(d);
            push_double(d, $);
            return;
        }
    }

    // arccosh(z) = log(sqrt(z^2 - 1) + z)

    if (is_flt(p1) || isdoublez(p1)) {
        push(p1, $);
        push(p1, $);
        multiply($);
        push_double(-1.0, $);
        add($);
        sqrtfunc($);
        push(p1, $);
        add($);
        logfunc($);
        return;
    }

    if (isplusone(p1)) {
        push_integer(0, $);
        return;
    }

    if (car(p1).equals(COSH)) {
        push(cadr(p1), $);
        return;
    }

    push(ARCCOSH, $);
    push(p1, $);
    list(2, $);
}

function eval_arcsin(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    arcsin($);
}

function arcsin($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            arcsin($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        if (-1.0 <= d && d <= 1.0) {
            d = Math.asin(d);
            push_double(d, $);
            return;
        }
    }

    // arcsin(z) = -i log(i z + sqrt(1 - z^2))

    if (is_flt(p1) || isdoublez(p1)) {
        push(imaginaryunit, $);
        negate($);
        push(imaginaryunit, $);
        push(p1, $);
        multiply($);
        push_double(1.0, $);
        push(p1, $);
        push(p1, $);
        multiply($);
        subtract($);
        sqrtfunc($);
        add($);
        logfunc($);
        multiply($);
        return;
    }

    // arcsin(-x) = -arcsin(x)

    if (isnegativeterm(p1)) {
        push(p1, $);
        negate($);
        arcsin($);
        negate($);
        return;
    }

    // arcsin(1 / sqrt(2)) = 1/4 Pi

    if (isoneoversqrttwo(p1)) {
        push_rational(1, 4, $);
        push(Pi, $);
        multiply($);
        return;
    }

    // arcsin(0) = 0

    if (iszero(p1)) {
        push_integer(0, $);
        return;
    }

    // arcsin(1/2) = 1/6 Pi

    if (isequalq(p1, 1, 2)) {
        push_rational(1, 6, $);
        push(Pi, $);
        multiply($);
        return;
    }

    // arcsin(1) = 1/2 Pi

    if (isplusone(p1)) {
        push_rational(1, 2, $);
        push(Pi, $);
        multiply($);
        return;
    }

    push(ARCSIN, $);
    push(p1, $);
    list(2, $);
}

function eval_arcsinh(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    arcsinh($);
}

function arcsinh($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            arcsinh($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = Math.asinh(d);
        push_double(d, $);
        return;
    }

    // arcsinh(z) = log(sqrt(z^2 + 1) + z)

    if (isdoublez(p1)) {
        push(p1, $);
        push(p1, $);
        multiply($);
        push_double(1.0, $);
        add($);
        sqrtfunc($);
        push(p1, $);
        add($);
        logfunc($);
        return;
    }

    if (iszero(p1)) {
        push(p1, $);
        return;
    }

    // arcsinh(-x) = -arcsinh(x)

    if (isnegativeterm(p1)) {
        push(p1, $);
        negate($);
        arcsinh($);
        negate($);
        return;
    }

    if (car(p1).equals(SINH)) {
        push(cadr(p1), $);
        return;
    }

    push(ARCSINH, $);
    push(p1, $);
    list(2, $);
}

function eval_arctan(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    if (is_cons(cddr(p1))) {
        push(caddr(p1), $);
        value_of($);
    }
    else
        push_integer(1, $);
    arctan($);
}

function arctan($: ScriptVars): void {

    const X = pop($);
    const Y = pop($);

    if (is_tensor(Y)) {
        const T = copy_tensor(Y);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            push(X, $);
            arctan($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_num(X) && is_num(Y)) {
        arctan_numbers(X, Y, $);
        return;
    }

    // arctan(z) = -1/2 i log((i - z) / (i + z))

    if (!iszero(X) && (isdoublez(X) || isdoublez(Y))) {
        push(Y, $);
        push(X, $);
        divide($);
        const Z = pop($);
        push_double(-0.5, $);
        push(imaginaryunit, $);
        multiply($);
        push(imaginaryunit, $);
        push(Z, $);
        subtract($);
        push(imaginaryunit, $);
        push(Z, $);
        add($);
        divide($);
        logfunc($);
        multiply($);
        return;
    }

    // arctan(-y,x) = -arctan(y,x)

    if (isnegativeterm(Y)) {
        push(Y, $);
        negate($);
        push(X, $);
        arctan($);
        negate($);
        return;
    }

    if (car(Y).equals(TAN) && isplusone(X)) {
        push(cadr(Y), $); // x of tan(x)
        return;
    }

    push(ARCTAN, $);
    push(Y, $);
    push(X, $);
    list(3, $);
}

function arctan_numbers(X: Num, Y: Num, $: ScriptVars): void {

    if (iszero(X) && iszero(Y)) {
        push(ARCTAN, $);
        push_integer(0, $);
        push_integer(0, $);
        list(3, $);
        return;
    }

    if (is_num(X) && is_num(Y) && (is_flt(X) || is_flt(Y))) {
        const x = X.toNumber();
        const y = Y.toNumber();
        push_double(Math.atan2(y, x), $);
        return;
    }

    // X and Y are rational numbers

    if (iszero(Y)) {
        if (isnegativenumber(X))
            push(Pi, $);
        else
            push_integer(0, $);
        return;
    }

    if (iszero(X)) {
        if (isnegativenumber(Y))
            push_rational(-1, 2, $);
        else
            push_rational(1, 2, $);
        push(Pi, $);
        multiply($);
        return;
    }

    // convert fractions to integers

    push(Y, $);
    push(X, $);
    divide($);
    absfunc($);
    const T = pop($);

    push(T, $);
    numerator($);
    if (isnegativenumber(Y))
        negate($);
    const Ynum = pop($) as Rat;

    push(T, $);
    denominator($);
    if (isnegativenumber(X))
        negate($);
    const Xnum = pop($) as Rat;

    // compare numerators and denominators, ignore signs

    if (bignum_cmp(Xnum.a, Ynum.a) !== 0 || bignum_cmp(Xnum.b, Ynum.b) !== 0) {
        // not equal
        if (isnegativenumber(Ynum)) {
            push(ARCTAN, $);
            push(Ynum, $);
            negate($);
            push(Xnum, $);
            list(3, $);
            negate($);
        }
        else {
            push(ARCTAN, $);
            push(Ynum, $);
            push(Xnum, $);
            list(3, $);
        }
        return;
    }

    // X = Y modulo sign

    if (isnegativenumber(Xnum)) {
        if (isnegativenumber(Ynum))
            push_rational(-3, 4, $);
        else
            push_rational(3, 4, $);
    }
    else {
        if (isnegativenumber(Ynum))
            push_rational(-1, 4, $);
        else
            push_rational(1, 4, $);
    }

    push(Pi, $);
    multiply($);
}

function eval_arctanh(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    arctanh($);
}

function arctanh($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            arctanh($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (isplusone(p1) || isminusone(p1)) {
        push(ARCTANH, $);
        push(p1, $);
        list(2, $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        if (-1.0 < d && d < 1.0) {
            d = Math.atanh(d);
            push_double(d, $);
            return;
        }
    }

    // arctanh(z) = 1/2 log(1 + z) - 1/2 log(1 - z)

    if (is_flt(p1) || isdoublez(p1)) {
        push_double(1.0, $);
        push(p1, $);
        add($);
        logfunc($);
        push_double(1.0, $);
        push(p1, $);
        subtract($);
        logfunc($);
        subtract($);
        push_double(0.5, $);
        multiply($);
        return;
    }

    if (iszero(p1)) {
        push_integer(0, $);
        return;
    }

    // arctanh(-x) = -arctanh(x)

    if (isnegativeterm(p1)) {
        push(p1, $);
        negate($);
        arctanh($);
        negate($);
        return;
    }

    if (car(p1).equals(TANH)) {
        push(cadr(p1), $);
        return;
    }

    push(ARCTANH, $);
    push(p1, $);
    list(2, $);
}

function eval_arg(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    arg($);
}

// use numerator and denominator to handle (a + i b) / (c + i d)

function arg($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            arg($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    const t = isdoublesomewhere(p1);

    push(p1, $);
    numerator($);
    arg1($);

    push(p1, $);
    denominator($);
    arg1($);

    subtract($);

    if (t)
        floatfunc($);
}

function arg1($: ScriptVars): void {

    let p1 = pop($);

    if (is_rat(p1)) {
        if (isnegativenumber(p1)) {
            push(Pi, $);
            negate($);
        }
        else
            push_integer(0, $);
        return;
    }

    if (is_flt(p1)) {
        if (isnegativenumber(p1))
            push_double(-Math.PI, $);
        else
            push_double(0.0, $);
        return;
    }

    // (-1) ^ expr

    if (car(p1).equals(POWER) && isminusone(cadr(p1))) {
        push(Pi, $);
        push(caddr(p1), $);
        multiply($);
        return;
    }

    // e ^ expr

    if (is_cons(p1) && p1.opr.equals(POWER) && cadr(p1).equals(DOLLAR_E)) {
        push(caddr(p1), $);
        imag($);
        return;
    }

    if (car(p1).equals(MULTIPLY)) {
        const h = $.stack.length;
        p1 = cdr(p1);
        while (is_cons(p1)) {
            push(car(p1), $);
            arg($);
            p1 = cdr(p1);
        }
        add_terms($.stack.length - h, $);
        return;
    }

    if (car(p1).equals(ADD)) {
        push(p1, $);
        rect($); // convert polar and clock forms
        p1 = pop($);
        push(p1, $);
        real($);
        const RE = pop($);
        push(p1, $);
        imag($);
        const IM = pop($);
        push(IM, $);
        push(RE, $);
        arctan($);
        return;
    }

    push_integer(0, $); // p1 is real
}

function eval_binding(p1: U, $: ScriptVars): void {
    const sym = assert_sym(cadr(p1));
    push(get_binding(sym, $), $);
}

function eval_ceiling(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    ceilingfunc($);
}

function ceilingfunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            ceilingfunc($);
            T.elems[i] = pop($);
        }
        push(p1, $);
        return;
    }

    if (is_rat(p1) && isinteger(p1)) {
        push(p1, $);
        return;
    }

    if (is_rat(p1)) {
        const a = bignum_div(p1.a, p1.b);
        const b = bignum_int(1);
        if (isnegativenumber(p1))
            push_bignum(-1, a, b, $);
        else {
            push_bignum(1, a, b, $);
            push_integer(1, $);
            add($);
        }
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = Math.ceil(d);
        push_double(d, $);
        return;
    }

    push(CEILING, $);
    push(p1, $);
    list(2, $);
}

function eval_check(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    evalp($);
    p1 = pop($);
    if (iszero(p1)) {
        stopf("check");
    }
    push(nil, $); // no result is printed
}

function eval_circexp(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    circexp($);
}

function circexp($: ScriptVars): void {
    circexp_subst($);
    value_of($);
}

function circexp_subst($: ScriptVars): void {

    let p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            circexp_subst($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (car(p1).equals(COS)) {
        push(EXPCOS, $);
        push(cadr(p1), $);
        circexp_subst($);
        list(2, $);
        return;
    }

    if (car(p1).equals(SIN)) {
        push(EXPSIN, $);
        push(cadr(p1), $);
        circexp_subst($);
        list(2, $);
        return;
    }

    if (car(p1).equals(TAN)) {
        push(EXPTAN, $);
        push(cadr(p1), $);
        circexp_subst($);
        list(2, $);
        return;
    }

    if (car(p1).equals(COSH)) {
        push(EXPCOSH, $);
        push(cadr(p1), $);
        circexp_subst($);
        list(2, $);
        return;
    }

    if (car(p1).equals(SINH)) {
        push(EXPSINH, $);
        push(cadr(p1), $);
        circexp_subst($);
        list(2, $);
        return;
    }

    if (car(p1).equals(TANH)) {
        push(EXPTANH, $);
        push(cadr(p1), $);
        circexp_subst($);
        list(2, $);
        return;
    }

    // none of the above

    if (is_cons(p1)) {
        const h = $.stack.length;
        push(car(p1), $);
        p1 = cdr(p1);
        while (is_cons(p1)) {
            push(car(p1), $);
            circexp_subst($);
            p1 = cdr(p1);
        }
        list($.stack.length - h, $);
        return;
    }

    push(p1, $);
}

function eval_clear(expr: U, $: ScriptVars) {
    save_symbol(TRACE, $);
    save_symbol(TTY, $);

    $.binding = {};
    $.usrfunc = {};

    // TODO: A restore or rest would be better here.
    $.executeProlog(eigenmath_prolog);

    restore_symbol($);
    restore_symbol($);

    push(nil, $); // result
}

function eval_clock(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    clockfunc($);
}

function clockfunc($: ScriptVars): void {
    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            clockfunc($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    push(p1, $);
    mag($);

    push_integer(-1, $); // base

    push(p1, $);
    arg($);
    push(Pi, $);
    divide($);

    power($);

    multiply($);
}

function eval_cofactor(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);
    const p2 = pop($) as Tensor;

    push(caddr(p1), $);
    value_of($);
    const i = pop_integer($);

    push(cadddr(p1), $);
    value_of($);
    const j = pop_integer($);

    if (!issquarematrix(p2))
        stopf("cofactor: square matrix expected");

    if (i < 1 || i > p2.dims[0] || j < 0 || j > p2.dims[1])
        stopf("cofactor: index err");

    push(p2, $);

    minormatrix(i, j, $);

    det($);

    if ((i + j) % 2)
        negate($);
}

function eval_conj(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    conjfunc($);
}

function conjfunc($: ScriptVars): void {
    conjfunc_subst($);
    value_of($);
}

function conjfunc_subst($: ScriptVars): void {

    let p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            conjfunc_subst($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    // (-1) ^ expr

    if (car(p1).equals(POWER) && isminusone(cadr(p1))) {
        push(POWER, $);
        push_integer(-1, $);
        push(caddr(p1), $);
        negate($);
        list(3, $);
        return;
    }

    if (is_cons(p1)) {
        const h = $.stack.length;
        push(car(p1), $);
        p1 = cdr(p1);
        while (is_cons(p1)) {
            push(car(p1), $);
            conjfunc_subst($);
            p1 = cdr(p1);
        }
        list($.stack.length - h, $);
        return;
    }

    push(p1, $);
}

function eval_contract(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);

    p1 = cddr(p1);

    if (!is_cons(p1)) {
        push_integer(1, $);
        push_integer(2, $);
        contract($);
        return;
    }

    while (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
        push(cadr(p1), $);
        value_of($);
        contract($);
        p1 = cddr(p1);
    }
}

function contract($: ScriptVars): void {
    const index: number[] = [];

    const p3 = pop($);
    const p2 = pop($);
    const p1 = pop($);

    if (!istensor(p1)) {
        push(p1, $);
        return;
    }

    const ndim = p1.ndim;

    push(p2, $);
    let n = pop_integer($);

    push(p3, $);
    let m = pop_integer($);

    if (n < 1 || n > ndim || m < 1 || m > ndim || n === m)
        stopf("contract: index error");

    n--; // make zero based
    m--;

    const ncol = p1.dims[n];
    const nrow = p1.dims[m];

    if (ncol !== nrow)
        stopf("contract: unequal tensor dimensions");

    // nelem is the number of elements in result

    const nelem = p1.nelem / ncol / nrow;

    const T = alloc_tensor();

    for (let i = 0; i < ndim; i++)
        index[i] = 0;

    for (let i = 0; i < nelem; i++) {

        for (let j = 0; j < ncol; j++) {
            index[n] = j;
            index[m] = j;
            let k = index[0];
            for (let h = 1; h < ndim; h++)
                k = k * p1.dims[h] + index[h];
            push(p1.elems[k], $);
        }

        add_terms(ncol, $);

        T.elems[i] = pop($);

        // increment index

        for (let j = ndim - 1; j >= 0; j--) {
            if (j === n || j === m)
                continue;
            if (++index[j] < p1.dims[j])
                break;
            index[j] = 0;
        }
    }

    if (nelem === 1) {
        push(T.elems[0], $);
        return;
    }

    // add dim info

    let k = 0;

    for (let i = 0; i < ndim; i++)
        if (i !== n && i !== m)
            T.dims[k++] = p1.dims[i];

    push(T, $);
}

function eval_cos(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    cosfunc($);
}

function cosfunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, cosfunc, $), $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = Math.cos(d);
        push_double(d, $);
        return;
    }

    // cos(z) = 1/2 exp(i z) + 1/2 exp(-i z)

    if (isdoublez(p1)) {
        push_double(0.5, $);
        push(imaginaryunit, $);
        push(p1, $);
        multiply($);
        expfunc($);
        push(imaginaryunit, $);
        negate($);
        push(p1, $);
        multiply($);
        expfunc($);
        add($);
        multiply($);
        return;
    }

    // cos(-x) = cos(x)

    if (isnegativeterm(p1)) {
        push(p1, $);
        negate($);
        cosfunc($);
        return;
    }

    if (car(p1).equals(ADD)) {
        cosfunc_sum(p1, $);
        return;
    }

    // cos(arctan(y,x)) = x (x^2 + y^2)^(-1/2)

    if (car(p1).equals(ARCTAN)) {
        const X = caddr(p1);
        const Y = cadr(p1);
        push(X, $);
        push(X, $);
        push(X, $);
        multiply($);
        push(Y, $);
        push(Y, $);
        multiply($);
        add($);
        push_rational(-1, 2, $);
        power($);
        multiply($);
        return;
    }

    // cos(arcsin(x)) = sqrt(1 - x^2)

    if (car(p1).equals(ARCSIN)) {
        push_integer(1, $);
        push(cadr(p1), $);
        push_integer(2, $);
        power($);
        subtract($);
        push_rational(1, 2, $);
        power($);
        return;
    }

    // n Pi ?

    push(p1, $);
    push(Pi, $);
    divide($);
    let p2 = pop($);

    if (!is_num(p2)) {
        push(COS, $);
        push(p1, $);
        list(2, $);
        return;
    }

    if (is_flt(p2)) {
        let d = p2.toNumber();
        d = Math.cos(d * Math.PI);
        push_double(d, $);
        return;
    }

    push(p2, $); // nonnegative by cos(-x) = cos(x) above
    push_integer(180, $);
    multiply($);
    p2 = pop($);

    if (!(is_rat(p2) && isinteger(p2))) {
        push(COS, $);
        push(p1, $);
        list(2, $);
        return;
    }

    push(p2, $);
    push_integer(360, $);
    modfunc($);
    const n = pop_integer($);

    switch (n) {
        case 90:
        case 270:
            push_integer(0, $);
            break;
        case 60:
        case 300:
            push_rational(1, 2, $);
            break;
        case 120:
        case 240:
            push_rational(-1, 2, $);
            break;
        case 45:
        case 315:
            push_rational(1, 2, $);
            push_integer(2, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 135:
        case 225:
            push_rational(-1, 2, $);
            push_integer(2, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 30:
        case 330:
            push_rational(1, 2, $);
            push_integer(3, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 150:
        case 210:
            push_rational(-1, 2, $);
            push_integer(3, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 0:
            push_integer(1, $);
            break;
        case 180:
            push_integer(-1, $);
            break;
        default:
            push(COS, $);
            push(p1, $);
            list(2, $);
            break;
    }
}

// cos(x + n/2 Pi) = cos(x) cos(n/2 Pi) - sin(x) sin(n/2 Pi)

function cosfunc_sum(p1: U, $: ScriptVars): void {
    let p2 = cdr(p1);
    while (is_cons(p2)) {
        push_integer(2, $);
        push(car(p2), $);
        multiply($);
        push(Pi, $);
        divide($);
        let p3 = pop($);
        if (is_rat(p3) && isinteger(p3)) {
            push(p1, $);
            push(car(p2), $);
            subtract($);
            p3 = pop($);
            push(p3, $);
            cosfunc($);
            push(car(p2), $);
            cosfunc($);
            multiply($);
            push(p3, $);
            sinfunc($);
            push(car(p2), $);
            sinfunc($);
            multiply($);
            subtract($);
            return;
        }
        p2 = cdr(p2);
    }
    push(COS, $);
    push(p1, $);
    list(2, $);
}

function eval_cosh(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    coshfunc($);
}

function coshfunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            coshfunc($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = Math.cosh(d);
        push_double(d, $);
        return;
    }

    // cosh(z) = 1/2 exp(z) + 1/2 exp(-z)

    if (isdoublez(p1)) {
        push_rational(1, 2, $);
        push(p1, $);
        expfunc($);
        push(p1, $);
        negate($);
        expfunc($);
        add($);
        multiply($);
        return;
    }

    if (iszero(p1)) {
        push_integer(1, $);
        return;
    }

    // cosh(-x) = cosh(x)

    if (isnegativeterm(p1)) {
        push(p1, $);
        negate($);
        coshfunc($);
        return;
    }

    if (car(p1).equals(ARCCOSH)) {
        push(cadr(p1), $);
        return;
    }

    push(COSH, $);
    push(p1, $);
    list(2, $);
}

function eval_defint(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);
    let F = pop($);

    p1 = cddr(p1);

    while (is_cons(p1)) {

        push(car(p1), $);
        value_of($);
        const X = pop($);

        push(cadr(p1), $);
        value_of($);
        const A = pop($);

        push(caddr(p1), $);
        value_of($);
        const B = pop($);

        push(F, $);
        push(X, $);
        integral($);
        F = pop($);

        push(F, $);
        push(X, $);
        push(B, $);
        subst($);
        value_of($);

        push(F, $);
        push(X, $);
        push(A, $);
        subst($);
        value_of($);

        subtract($);
        F = pop($);

        p1 = cdddr(p1);
    }

    push(F, $);
}

function eval_denominator(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    denominator($);
}

function denominator($: ScriptVars): void {

    let p1 = pop($);

    if (is_rat(p1)) {
        push_bignum(1, p1.b, bignum_int(1), $);
        return;
    }

    let p2: U = one; // denominator

    while (find_divisor(p1, $)) {

        const p0 = pop($); // p0 is a denominator

        push(p0, $); // cancel in orig expr
        push(p1, $);
        cancel_factor($);
        p1 = pop($);

        push(p0, $); // update denominator
        push(p2, $);
        cancel_factor($);
        p2 = pop($);
    }

    push(p2, $);
}

function eval_derivative(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);
    p1 = cddr(p1);

    if (!is_cons(p1)) {
        push(X_LOWER, $);
        derivative($);
        return;
    }

    let flag = 0;
    let X: U;
    let Y: U = nil;

    while (is_cons(p1) || flag) {

        if (flag) {
            X = Y;
            flag = 0;
        }
        else {
            push(car(p1), $);
            value_of($);
            X = pop($);
            p1 = cdr(p1);
        }

        if (is_num(X)) {
            push(X, $);
            const n = pop_integer($);
            push(X_LOWER, $);
            X = pop($);
            for (let i = 0; i < n; i++) {
                push(X, $);
                derivative($);
            }
            continue;
        }

        if (is_cons(p1)) {

            push(car(p1), $);
            value_of($);
            Y = pop($);
            p1 = cdr(p1);

            if (is_num(Y)) {
                push(Y, $);
                const n = pop_integer($);
                for (let i = 0; i < n; i++) {
                    push(X, $);
                    derivative($);
                }
                continue;
            }

            flag = 1;
        }

        push(X, $);
        derivative($);
    }
}

function derivative($: ScriptVars): void {

    const X = pop($);
    const F = pop($);

    if (is_tensor(F)) {
        if (is_tensor(X))
            d_tensor_tensor(F, X, $);
        else
            d_tensor_scalar(F, X, $);
    }
    else {
        if (is_tensor(X))
            d_scalar_tensor(F, X, $);
        else
            d_scalar_scalar(F, X, $);
    }
}

function d_scalar_scalar(F: U, X: U, $: ScriptVars): void {
    if (!(is_sym(X) && $.hasUserFunction(X)))
        stopf("derivative: symbol expected");

    // d(x,x)?

    if (equal(F, X)) {
        push_integer(1, $);
        return;
    }

    // d(a,x)?

    if (!is_cons(F)) {
        push_integer(0, $);
        return;
    }

    if (car(F).equals(ADD)) {
        dsum(F, X, $);
        return;
    }

    if (car(F).equals(MULTIPLY)) {
        dproduct(F, X, $);
        return;
    }

    if (car(F).equals(POWER)) {
        dpower(F, X, $);
        return;
    }

    if (car(F).equals(DERIVATIVE)) {
        dd(F, X, $);
        return;
    }

    if (car(F).equals(LOG)) {
        dlog(F, X, $);
        return;
    }

    if (car(F).equals(SIN)) {
        dsin(F, X, $);
        return;
    }

    if (car(F).equals(COS)) {
        dcos(F, X, $);
        return;
    }

    if (car(F).equals(TAN)) {
        dtan(F, X, $);
        return;
    }

    if (car(F).equals(ARCSIN)) {
        darcsin(F, X, $);
        return;
    }

    if (car(F).equals(ARCCOS)) {
        darccos(F, X, $);
        return;
    }

    if (car(F).equals(ARCTAN)) {
        darctan(F, X, $);
        return;
    }

    if (car(F).equals(SINH)) {
        dsinh(F, X, $);
        return;
    }

    if (car(F).equals(COSH)) {
        dcosh(F, X, $);
        return;
    }

    if (car(F).equals(TANH)) {
        dtanh(F, X, $);
        return;
    }

    if (car(F).equals(ARCSINH)) {
        darcsinh(F, X, $);
        return;
    }

    if (car(F).equals(ARCCOSH)) {
        darccosh(F, X, $);
        return;
    }

    if (car(F).equals(ARCTANH)) {
        darctanh(F, X, $);
        return;
    }

    if (car(F).equals(ERF)) {
        derf(F, X, $);
        return;
    }

    if (car(F).equals(ERFC)) {
        derfc(F, X, $);
        return;
    }

    if (car(F).equals(INTEGRAL) && caddr(F).equals(X)) {
        push(cadr(F), $);
        return;
    }

    dfunction(F, X, $);
}

function dsum(p1: U, p2: U, $: ScriptVars): void {
    const h = $.stack.length;
    p1 = cdr(p1);
    while (is_cons(p1)) {
        push(car(p1), $);
        push(p2, $);
        derivative($);
        p1 = cdr(p1);
    }
    add_terms($.stack.length - h, $);
}

function dproduct(p1: U, p2: U, $: ScriptVars): void {
    const n = lengthf(p1) - 1;
    for (let i = 0; i < n; i++) {
        let p3 = cdr(p1);
        for (let j = 0; j < n; j++) {
            push(car(p3), $);
            if (i === j) {
                push(p2, $);
                derivative($);
            }
            p3 = cdr(p3);
        }
        multiply_factors(n, $);
    }
    add_terms(n, $);
}

//	     v
//	y = u
//
//	log y = v log u
//
//	1 dy   v du           dv
//	- -- = - -- + (log u) --
//	y dx   u dx           dx
//
//	dy    v  v du           dv
//	-- = u  (- -- + (log u) --)
//	dx       u dx           dx

function dpower(F: U, X: U, $: ScriptVars): void {
    if (is_num(cadr(F)) && is_num(caddr(F))) {
        push_integer(0, $); // irr or imag
        return;
    }

    push(caddr(F), $);		// v/u
    push(cadr(F), $);
    divide($);

    push(cadr(F), $);		// du/dx
    push(X, $);
    derivative($);

    multiply($);

    push(cadr(F), $);		// log u
    logfunc($);

    push(caddr(F), $);		// dv/dx
    push(X, $);
    derivative($);

    multiply($);

    add($);

    push(F, $);		// u^v

    multiply($);
}

function dlog(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push(cadr(p1), $);
    divide($);
}

//	derivative of derivative
//
//	example: d(d(f(x,y),y),x)
//
//	p1 = d(f(x,y),y)
//
//	p2 = x
//
//	cadr(p1) = f(x,y)
//
//	caddr(p1) = y

function dd(p1: U, p2: U, $: ScriptVars): void {
    // d(f(x,y),x)

    push(cadr(p1), $);
    push(p2, $);
    derivative($);

    const p3 = pop($);

    if (car(p3).equals(DERIVATIVE)) {

        // sort dx terms

        push(DERIVATIVE, $);
        push(DERIVATIVE, $);
        push(cadr(p3), $);

        if (lessp(caddr(p3), caddr(p1))) {
            push(caddr(p3), $);
            list(3, $);
            push(caddr(p1), $);
        }
        else {
            push(caddr(p1), $);
            list(3, $);
            push(caddr(p3), $);
        }

        list(3, $);

    }
    else {
        push(p3, $);
        push(caddr(p1), $);
        derivative($);
    }
}

// derivative of a generic function

function dfunction(p1: U, p2: U, $: ScriptVars): void {

    const p3 = cdr(p1); // p3 is the argument list for the function

    if (p3.isnil || findf(p3, p2, $)) {
        push(DERIVATIVE, $);
        push(p1, $);
        push(p2, $);
        list(3, $);
    }
    else
        push_integer(0, $);
}

function dsin(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push(cadr(p1), $);
    cosfunc($);
    multiply($);
}

function dcos(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push(cadr(p1), $);
    sinfunc($);
    multiply($);
    negate($);
}

function dtan(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push(cadr(p1), $);
    cosfunc($);
    push_integer(-2, $);
    power($);
    multiply($);
}

function darcsin(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push_integer(1, $);
    push(cadr(p1), $);
    push_integer(2, $);
    power($);
    subtract($);
    push_rational(-1, 2, $);
    power($);
    multiply($);
}

function darccos(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push_integer(1, $);
    push(cadr(p1), $);
    push_integer(2, $);
    power($);
    subtract($);
    push_rational(-1, 2, $);
    power($);
    multiply($);
    negate($);
}

function darctan(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push_integer(1, $);
    push(cadr(p1), $);
    push_integer(2, $);
    power($);
    add($);
    reciprocate($);
    multiply($);
}

function dsinh(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push(cadr(p1), $);
    coshfunc($);
    multiply($);
}

function dcosh(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push(cadr(p1), $);
    sinhfunc($);
    multiply($);
}

function dtanh(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push(cadr(p1), $);
    coshfunc($);
    push_integer(-2, $);
    power($);
    multiply($);
}

function darcsinh(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push(cadr(p1), $);
    push_integer(2, $);
    power($);
    push_integer(1, $);
    add($);
    push_rational(-1, 2, $);
    power($);
    multiply($);
}

function darccosh(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push(cadr(p1), $);
    push_integer(2, $);
    power($);
    push_integer(-1, $);
    add($);
    push_rational(-1, 2, $);
    power($);
    multiply($);
}

function darctanh(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    push_integer(1, $);
    push(cadr(p1), $);
    push_integer(2, $);
    power($);
    subtract($);
    reciprocate($);
    multiply($);
}

function derf(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push_integer(2, $);
    power($);
    push_integer(-1, $);
    multiply($);
    expfunc($);
    push(Pi, $);
    push_rational(-1, 2, $);
    power($);
    multiply($);
    push_integer(2, $);
    multiply($);
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    multiply($);
}


function derfc(p1: U, p2: U, $: ScriptVars): void {
    push(cadr(p1), $);
    push_integer(2, $);
    power($);
    push_integer(-1, $);
    multiply($);
    expfunc($);
    push(Pi, $);
    push_rational(-1, 2, $);
    power($);
    multiply($);
    push_integer(-2, $);
    multiply($);
    push(cadr(p1), $);
    push(p2, $);
    derivative($);
    multiply($);
}

// gradient of tensor p1 wrt tensor p2

function d_tensor_tensor(p1: Tensor, p2: Tensor, $: ScriptVars): void {

    let n = p1.nelem;
    const m = p2.nelem;

    const p3 = alloc_tensor();

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            push(p1.elems[i], $);
            push(p2.elems[j], $);
            derivative($);
            p3.elems[m * i + j] = pop($);
        }
    }

    // dim info

    let k = 0;

    n = p1.ndim;

    for (let i = 0; i < n; i++)
        p3.dims[k++] = p1.dims[i];

    n = p2.ndim;

    for (let i = 0; i < n; i++)
        p3.dims[k++] = p2.dims[i];

    push(p3, $);
}

// gradient of scalar p1 wrt tensor p2

function d_scalar_tensor(p1: U, p2: Tensor, $: ScriptVars): void {

    const p3 = copy_tensor(p2);

    const n = p2.nelem;

    for (let i = 0; i < n; i++) {
        push(p1, $);
        push(p2.elems[i], $);
        derivative($);
        p3.elems[i] = pop($);
    }

    push(p3, $);
}

// derivative of tensor p1 wrt scalar p2

function d_tensor_scalar(p1: Tensor, p2: U, $: ScriptVars): void {

    const p3 = copy_tensor(p1);

    const n = p1.nelem;

    for (let i = 0; i < n; i++) {
        push(p1.elems[i], $);
        push(p2, $);
        derivative($);
        p3.elems[i] = pop($);
    }

    push(p3, $);
}

function eval_det(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    det($);
}

function det($: ScriptVars): void {

    const p1 = pop($);

    if (!istensor(p1)) {
        push(p1, $);
        return;
    }

    if (!issquarematrix(p1))
        stopf("det: square matrix expected");

    const n = p1.dims[0];

    switch (n) {
        case 1:
            push(p1.elems[0], $);
            return;
        case 2:
            push(p1.elems[0], $);
            push(p1.elems[3], $);
            multiply($);
            push(p1.elems[1], $);
            push(p1.elems[2], $);
            multiply($);
            subtract($);
            return;
        case 3:
            push(p1.elems[0], $);
            push(p1.elems[4], $);
            push(p1.elems[8], $);
            multiply_factors(3, $);
            push(p1.elems[1], $);
            push(p1.elems[5], $);
            push(p1.elems[6], $);
            multiply_factors(3, $);
            push(p1.elems[2], $);
            push(p1.elems[3], $);
            push(p1.elems[7], $);
            multiply_factors(3, $);
            push_integer(-1, $);
            push(p1.elems[2], $);
            push(p1.elems[4], $);
            push(p1.elems[6], $);
            multiply_factors(4, $);
            push_integer(-1, $);
            push(p1.elems[1], $);
            push(p1.elems[3], $);
            push(p1.elems[8], $);
            multiply_factors(4, $);
            push_integer(-1, $);
            push(p1.elems[0], $);
            push(p1.elems[5], $);
            push(p1.elems[7], $);
            multiply_factors(4, $);
            add_terms(6, $);
            return;
        default:
            break;
    }

    const p2 = alloc_matrix(n - 1, n - 1);

    const h = $.stack.length;

    for (let m = 0; m < n; m++) {
        if (iszero(p1.elems[m]))
            continue;
        let k = 0;
        for (let i = 1; i < n; i++)
            for (let j = 0; j < n; j++)
                if (j !== m)
                    p2.elems[k++] = p1.elems[n * i + j];
        push(p2, $);
        det($);
        push(p1.elems[m], $);
        multiply($);
        if (m % 2)
            negate($);
    }

    const s = $.stack.length - h;

    if (s === 0)
        push_integer(0, $);
    else
        add_terms(s, $);
}

function eval_dim(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);
    const p2 = pop($);

    if (!istensor(p2)) {
        push_integer(1, $);
        return;
    }

    let k: number;

    if (lengthf(p1) === 2)
        k = 1;
    else {
        push(caddr(p1), $);
        value_of($);
        k = pop_integer($);
    }

    if (k < 1 || k > p2.ndim)
        stopf("dim 2nd arg: error");

    push_integer(p2.dims[k - 1], $);
}

function eval_do(p1: U, $: ScriptVars): void {
    push(nil, $);
    p1 = cdr(p1);
    while (is_cons(p1)) {
        pop($);
        push(car(p1), $);
        value_of($);
        p1 = cdr(p1);
    }
}

function eval_dot(p1: U, $: ScriptVars): void {
    eval_inner(p1, $);
}

function eval_eigenvec(punk: U, $: ScriptVars): void {
    const D: number[] = [];
    const Q: number[] = [];

    push(cadr(punk), $);
    value_of($);
    floatfunc($);
    let T = pop($) as Tensor;

    if (!issquarematrix(T))
        stopf("eigenvec: square matrix expected");

    const n = T.dims[0];

    for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
            if (!is_flt(T.elems[n * i + j]))
                stopf("eigenvec: numerical matrix expected");

    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            const Tij: number = (T.elems[n * i + j] as Flt).d;
            const Tji: number = (T.elems[n * j + i] as Flt).d;
            if (Math.abs(Tij - Tji) > 1e-10) {
                stopf("eigenvec: symmetrical matrix expected");
            }
        }
    }

    // initialize D

    for (let i = 0; i < n; i++) {
        D[n * i + i] = (T.elems[n * i + i] as Flt).d;
        for (let j = i + 1; j < n; j++) {
            D[n * i + j] = (T.elems[n * i + j] as Flt).d;
            D[n * j + i] = (T.elems[n * i + j] as Flt).d;
        }
    }

    // initialize Q

    for (let i = 0; i < n; i++) {
        Q[n * i + i] = 1.0;
        for (let j = i + 1; j < n; j++) {
            Q[n * i + j] = 0.0;
            Q[n * j + i] = 0.0;
        }
    }

    eigenvec(D, Q, n);

    T = alloc_matrix(n, n);

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            push_double(Q[n * j + i], $); // transpose
            T.elems[n * i + j] = pop($);
        }
    }

    push(T, $);
}

function eigenvec(D: number[], Q: number[], n: number): void {

    for (let i = 0; i < 100; i++)
        if (eigenvec_step(D, Q, n) === 0)
            return;

    stopf("eigenvec: convergence error");
}

function eigenvec_step(D: number[], Q: number[], n: number) {

    let count = 0;

    // for each upper triangle "off-diagonal" component do step_nib

    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            if (D[n * i + j] !== 0.0) {
                eigenvec_step_nib(D, Q, n, i, j);
                count++;
            }
        }
    }

    return count;
}

function eigenvec_step_nib(D: number[], Q: number[], n: number, p: number, q: number): void {

    // compute c and s

    // from Numerical Recipes (except they have a_qq - a_pp)

    const theta = 0.5 * (D[n * p + p] - D[n * q + q]) / D[n * p + q];

    let t = 1.0 / (Math.abs(theta) + Math.sqrt(theta * theta + 1.0));

    if (theta < 0.0)
        t = -t;

    const c = 1.0 / Math.sqrt(t * t + 1.0);

    const s = t * c;

    // D = GD

    // which means "add rows"

    for (let k = 0; k < n; k++) {
        const cc = D[n * p + k];
        const ss = D[n * q + k];
        D[n * p + k] = c * cc + s * ss;
        D[n * q + k] = c * ss - s * cc;
    }

    // D = D transpose(G)

    // which means "add columns"

    for (let k = 0; k < n; k++) {
        const cc = D[n * k + p];
        const ss = D[n * k + q];
        D[n * k + p] = c * cc + s * ss;
        D[n * k + q] = c * ss - s * cc;
    }

    // Q = GQ

    // which means "add rows"

    for (let k = 0; k < n; k++) {
        const cc = Q[n * p + k];
        const ss = Q[n * q + k];
        Q[n * p + k] = c * cc + s * ss;
        Q[n * q + k] = c * ss - s * cc;
    }

    D[n * p + q] = 0.0;
    D[n * q + p] = 0.0;
}

function eval_erf(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    erffunc($);
}

function erffunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            erffunc($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = erf(d);
        push_double(d, $);
        return;
    }

    if (iszero(p1)) {
        push_integer(0, $);
        return;
    }

    if (isnegativeterm(p1)) {
        push(ERF, $);
        push(p1, $);
        negate($);
        list(2, $);
        negate($);
        return;
    }

    push(ERF, $);
    push(p1, $);
    list(2, $);
}

function eval_erfc(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    erfcfunc($);
}

function erfcfunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            erfcfunc($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = erfc(d);
        push_double(d, $);
        return;
    }

    if (iszero(p1)) {
        push_integer(1, $);
        return;
    }

    push(ERFC, $);
    push(p1, $);
    list(2, $);
}

function eval_eval(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    p1 = cddr(p1);
    while (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
        push(cadr(p1), $);
        value_of($);
        subst($);
        p1 = cddr(p1);
    }
    value_of($);
}

function eval_exit(expr: U, $: ScriptVars): void {
    push(nil, $);
}

function eval_exp(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    expfunc($);
}

function expfunc($: ScriptVars): void {
    push(DOLLAR_E, $);
    swap($);
    power($);
}

function eval_expcos(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    expcos($);
}

function expcos($: ScriptVars): void {
    const p1 = pop($);

    push(imaginaryunit, $);
    push(p1, $);
    multiply($);
    expfunc($);
    push_rational(1, 2, $);
    multiply($);

    push(imaginaryunit, $);
    negate($);
    push(p1, $);
    multiply($);
    expfunc($);
    push_rational(1, 2, $);
    multiply($);

    add($);
}

function eval_expcosh(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    expcosh($);
}

function expcosh($: ScriptVars): void {
    const p1 = pop($);
    push(p1, $);
    expfunc($);
    push(p1, $);
    negate($);
    expfunc($);
    add($);
    push_rational(1, 2, $);
    multiply($);
}

function eval_expsin(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    expsin($);
}

function expsin($: ScriptVars): void {
    const p1 = pop($);

    push(imaginaryunit, $);
    push(p1, $);
    multiply($);
    expfunc($);
    push(imaginaryunit, $);
    divide($);
    push_rational(1, 2, $);
    multiply($);

    push(imaginaryunit, $);
    negate($);
    push(p1, $);
    multiply($);
    expfunc($);
    push(imaginaryunit, $);
    divide($);
    push_rational(1, 2, $);
    multiply($);

    subtract($);
}

function eval_expsinh(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    expsinh($);
}

function expsinh($: ScriptVars): void {
    const p1 = pop($);
    push(p1, $);
    expfunc($);
    push(p1, $);
    negate($);
    expfunc($);
    subtract($);
    push_rational(1, 2, $);
    multiply($);
}
// tan(z) = (i - i exp(2 i z)) / (exp(2 i z) + 1)

function eval_exptan(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    exptan($);
}

function exptan($: ScriptVars): void {

    push_integer(2, $);
    push(imaginaryunit, $);
    multiply_factors(3, $);
    expfunc($);

    const p1 = pop($);

    push(imaginaryunit, $);
    push(imaginaryunit, $);
    push(p1, $);
    multiply($);
    subtract($);

    push(p1, $);
    push_integer(1, $);
    add($);

    divide($);
}

function eval_exptanh(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    exptanh($);
}

function exptanh($: ScriptVars): void {
    push_integer(2, $);
    multiply($);
    expfunc($);
    const p1 = pop($);
    push(p1, $);
    push_integer(1, $);
    subtract($);
    push(p1, $);
    push_integer(1, $);
    add($);
    divide($);
}

function eval_factorial(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    factorial($);
}

function factorial($: ScriptVars): void {

    const p1 = pop($);

    if (is_rat(p1) && isposint(p1)) {
        push(p1, $);
        const n = pop_integer($);
        push_integer(1, $);
        for (let i = 2; i <= n; i++) {
            push_integer(i, $);
            multiply($);
        }
        return;
    }

    if (is_flt(p1) && p1.d >= 0 && Math.floor(p1.d) === p1.d) {
        push(p1, $);
        const n = pop_integer($);
        let m = 1.0;
        for (let i = 2; i <= n; i++)
            m *= i;
        push_double(m, $);
        return;
    }

    push(FACTORIAL, $);
    push(p1, $);
    list(2, $);
}

function eval_float(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    floatfunc($);
}

export function floatfunc($: ScriptVars): void {
    floatfunc_subst($);
    value_of($);
    floatfunc_subst($); // in case Pi popped up
    value_of($);
}

function floatfunc_subst($: ScriptVars): void {
    let p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            floatfunc_subst($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (p1.equals(Pi)) {
        push_double(Math.PI, $);
        return;
    }

    if (p1.equals(DOLLAR_E)) {
        push_double(Math.E, $);
        return;
    }

    if (is_rat(p1)) {
        push_double(p1.toNumber(), $);
        return;
    }

    // don't float exponential

    if (car(p1).equals(POWER) && cadr(p1).equals(DOLLAR_E)) {
        push(POWER, $);
        push(DOLLAR_E, $);
        push(caddr(p1), $);
        floatfunc_subst($);
        list(3, $);
        return;
    }

    // don't float imaginary unit, but multiply it by 1.0

    if (car(p1).equals(POWER) && isminusone(cadr(p1))) {
        push(MULTIPLY, $);
        push_double(1.0, $);
        push(POWER, $);
        push(cadr(p1), $);
        push(caddr(p1), $);
        floatfunc_subst($);
        list(3, $);
        list(3, $);
        return;
    }

    if (is_cons(p1)) {
        const h = $.stack.length;
        push(car(p1), $);
        p1 = cdr(p1);
        while (is_cons(p1)) {
            push(car(p1), $);
            floatfunc_subst($);
            p1 = cdr(p1);
        }
        list($.stack.length - h, $);
        return;
    }

    push(p1, $);
}

function eval_floor(p1: U, $: ScriptVars) {
    push(cadr(p1), $);
    value_of($);
    floorfunc($);
}

function floorfunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            floorfunc($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_rat(p1) && isinteger(p1)) {
        push(p1, $);
        return;
    }

    if (is_rat(p1)) {
        const a = bignum_div(p1.a, p1.b);
        const b = bignum_int(1);
        if (isnegativenumber(p1)) {
            push_bignum(-1, a, b, $);
            push_integer(-1, $);
            add($);
        }
        else
            push_bignum(1, a, b, $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = Math.floor(d);
        push_double(d, $);
        return;
    }

    push(FLOOR, $);
    push(p1, $);
    list(2, $);
}

function eval_for(p1: U, $: ScriptVars): void {

    const p2 = cadr(p1);
    if (!(is_sym(p2) && $.hasUserFunction(p2)))
        stopf("for: symbol error");

    push(caddr(p1), $);
    value_of($);
    let j = pop_integer($);

    push(cadddr(p1), $);
    value_of($);
    const k = pop_integer($);

    p1 = cddddr(p1);

    save_symbol(p2, $);

    for (; ;) {
        push_integer(j, $);
        let p3 = pop($);
        set_symbol(p2, p3, nil, $);
        p3 = p1;
        while (is_cons(p3)) {
            push(car(p3), $);
            value_of($);
            pop($);
            p3 = cdr(p3);
        }
        if (j === k)
            break;
        if (j < k)
            j++;
        else
            j--;
    }

    restore_symbol($);

    push(nil, $); // return value
}

function eval_hadamard(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    p1 = cddr(p1);
    while (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
        hadamard($);
        p1 = cdr(p1);
    }
}

/**
 * 
 * @param $ 
 * @returns 
 */
function hadamard($: ScriptVars): void {

    const p2 = pop($);
    const p1 = pop($);

    if (!istensor(p1) || !istensor(p2)) {
        push(p1, $);
        push(p2, $);
        multiply($);
        return;
    }

    if (p1.ndim !== p2.ndim)
        stopf("hadamard");

    let n = p1.ndim;

    for (let i = 0; i < n; i++)
        if (p1.dims[i] !== p2.dims[i])
            stopf("hadamard");

    const T = copy_tensor(p1);

    n = T.nelem;

    for (let i = 0; i < n; i++) {
        push(p1.elems[i], $);
        push(p2.elems[i], $);
        multiply($);
        T.elems[i] = pop($);
    }

    push(p1, $);
}

function eval_imag(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    imag($);
}

function imag($: ScriptVars): void {
    let p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            imag($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    push(p1, $);
    rect($);
    p1 = pop($);
    push_rational(-1, 2, $);
    push(imaginaryunit, $);
    push(p1, $);
    push(p1, $);
    conjfunc($);
    subtract($);
    multiply_factors(3, $);
}

function eval_index(p1: U, $: ScriptVars): void {

    let T = cadr(p1);

    p1 = cddr(p1);

    const h = $.stack.length;

    while (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
        p1 = cdr(p1);
    }

    // try to optimize by indexing before eval

    if (is_sym(T) && $.hasUserFunction(T)) {
        p1 = get_binding(T, $);
        const n = $.stack.length - h;
        if (is_tensor(p1) && n <= p1.ndim) {
            T = p1;
            indexfunc(T as Tensor, h, $);
            value_of($);
            return;
        }
    }

    push(T, $);
    value_of($);
    T = pop($);

    if (!istensor(T)) {
        $.stack.splice(h); // pop all
        push(T, $); // quirky, but EVA2.txt depends on it
        return;
    }

    indexfunc(T, h, $);
}

function indexfunc(T: Tensor, h: number, $: ScriptVars): void {

    const m = T.ndim;

    const n = $.stack.length - h;

    const r = m - n; // rank of result

    if (r < 0)
        stopf("index error");

    let k = 0;

    for (let i = 0; i < n; i++) {
        push($.stack[h + i], $);
        const t = pop_integer($);
        if (t < 1 || t > T.dims[i])
            stopf("index error");
        k = k * T.dims[i] + t - 1;
    }

    $.stack.splice(h); // pop all

    if (r === 0) {
        push(T.elems[k], $); // scalar result
        return;
    }

    let w = 1;

    for (let i = n; i < m; i++)
        w *= T.dims[i];

    k *= w;

    const p1 = alloc_tensor();

    for (let i = 0; i < w; i++)
        p1.elems[i] = T.elems[k + i];

    for (let i = 0; i < r; i++)
        p1.dims[i] = T.dims[n + i];

    push(p1, $);
}

function eval_inner(p1: U, $: ScriptVars): void {
    const h = $.stack.length;

    // evaluate from right to left

    p1 = cdr(p1);

    while (is_cons(p1)) {
        push(car(p1), $);
        p1 = cdr(p1);
    }

    if (h === $.stack.length)
        stopf("inner: no args");

    value_of($);

    while ($.stack.length - h > 1) {
        swap($);
        value_of($);
        swap($);
        inner($);
    }
}

function inner($: ScriptVars): void {

    let p2 = pop($);
    let p1 = pop($);
    let p3: Tensor;

    if (!istensor(p1) && !istensor(p2)) {
        push(p1, $);
        push(p2, $);
        multiply($);
        return;
    }

    if (is_tensor(p1) && !istensor(p2)) {
        p3 = p1;
        p1 = p2;
        p2 = p3;
    }

    if (!istensor(p1) && istensor(p2)) {
        const T = copy_tensor(p2);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(p1, $);
            push(T.elems[i], $);
            multiply($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_tensor(p1) && istensor(p2)) {
        // Do nothing
    }
    else {
        throw new Error();
    }

    let k = p1.ndim - 1;

    const ncol = p1.dims[k];
    const mrow = p2.dims[0];

    if (ncol !== mrow)
        stopf("inner: dimension err");

    const ndim = p1.ndim + p2.ndim - 2;

    //	nrow is the number of rows in p1
    //
    //	mcol is the number of columns p2
    //
    //	Example:
    //
    //	A[3][3][4] B[4][4][3]
    //
    //	  3  3				nrow = 3 * 3 = 9
    //
    //	                4  3		mcol = 4 * 3 = 12

    const nrow = p1.nelem / ncol;
    const mcol = p2.nelem / mrow;

    p3 = alloc_tensor();

    for (let i = 0; i < nrow; i++) {
        for (let j = 0; j < mcol; j++) {
            for (let k = 0; k < ncol; k++) {
                push(p1.elems[i * ncol + k], $);
                push(p2.elems[k * mcol + j], $);
                multiply($);
            }
            add_terms(ncol, $);
            p3.elems[i * mcol + j] = pop($);
        }
    }

    if (ndim === 0) {
        push(p3.elems[0], $); // scalar result
        return;
    }

    // dim info

    k = 0;

    let n = p1.ndim - 1;

    for (let i = 0; i < n; i++)
        p3.dims[k++] = p1.dims[i];

    n = p2.ndim;

    for (let i = 1; i < n; i++)
        p3.dims[k++] = p2.dims[i];

    push(p3, $);
}
const integral_tab_exp: string[] = [

    // x^n exp(a x + b)

    "exp(a x)",
    "exp(a x) / a",
    "1",

    "exp(a x + b)",
    "exp(a x + b) / a",
    "1",

    "x exp(a x)",
    "exp(a x) (a x - 1) / (a^2)",
    "1",

    "x exp(a x + b)",
    "exp(a x + b) (a x - 1) / (a^2)",
    "1",

    "x^2 exp(a x)",
    "exp(a x) (a^2 x^2 - 2 a x + 2) / (a^3)",
    "1",

    "x^2 exp(a x + b)",
    "exp(a x + b) (a^2 x^2 - 2 a x + 2) / (a^3)",
    "1",

    "x^3 exp(a x)",
    "(a^3 x^3 - 3 a^2 x^2 + 6 a x - 6) exp(a x) / a^4",
    "1",

    "x^3 exp(a x + b)",
    "(a^3 x^3 - 3 a^2 x^2 + 6 a x - 6) exp(a x + b) / a^4",
    "1",

    "x^4 exp(a x)",
    "((a^4*x^4-4*a^3*x^3+12*a^2*x^2-24*a*x+24)*exp(a*x))/a^5",
    "1",

    "x^4 exp(a x + b)",
    "((a^4*x^4-4*a^3*x^3+12*a^2*x^2-24*a*x+24)*exp(a*x+b))/a^5",
    "1",

    "x^5 exp(a x)",
    "((a^5*x^5-5*a^4*x^4+20*a^3*x^3-60*a^2*x^2+120*a*x-120)*exp(a*x))/a^6",
    "1",

    "x^5 exp(a x + b)",
    "((a^5*x^5-5*a^4*x^4+20*a^3*x^3-60*a^2*x^2+120*a*x-120)*exp(a*x+b))/a^6",
    "1",

    "x^6 exp(a x)",
    "((a^6*x^6-6*a^5*x^5+30*a^4*x^4-120*a^3*x^3+360*a^2*x^2-720*a*x+720)*exp(a*x))/a^7",
    "1",

    "x^6 exp(a x + b)",
    "((a^6*x^6-6*a^5*x^5+30*a^4*x^4-120*a^3*x^3+360*a^2*x^2-720*a*x+720)*exp(a*x+b))/a^7",
    "1",

    "x^7 exp(a x)",
    "((a^7*x^7-7*a^6*x^6+42*a^5*x^5-210*a^4*x^4+840*a^3*x^3-2520*a^2*x^2+5040*a*x-5040)*exp(a*x))/a^8",
    "1",

    "x^7 exp(a x + b)",
    "((a^7*x^7-7*a^6*x^6+42*a^5*x^5-210*a^4*x^4+840*a^3*x^3-2520*a^2*x^2+5040*a*x-5040)*exp(a*x+b))/a^8",
    "1",

    "x^8 exp(a x)",
    "((a^8*x^8-8*a^7*x^7+56*a^6*x^6-336*a^5*x^5+1680*a^4*x^4-6720*a^3*x^3+20160*a^2*x^2-40320*a*x+40320)*exp(a*x))/a^9",
    "1",

    "x^8 exp(a x + b)",
    "((a^8*x^8-8*a^7*x^7+56*a^6*x^6-336*a^5*x^5+1680*a^4*x^4-6720*a^3*x^3+20160*a^2*x^2-40320*a*x+40320)*exp(a*x+b))/a^9",
    "1",

    "x^9 exp(a x)",
    "x^9 exp(a x) / a - 9 x^8 exp(a x) / a^2 + 72 x^7 exp(a x) / a^3 - 504 x^6 exp(a x) / a^4 + 3024 x^5 exp(a x) / a^5 - 15120 x^4 exp(a x) / a^6 + 60480 x^3 exp(a x) / a^7 - 181440 x^2 exp(a x) / a^8 + 362880 x exp(a x) / a^9 - 362880 exp(a x) / a^10",
    "1",

    "x^9 exp(a x + b)",
    "x^9 exp(a x + b) / a - 9 x^8 exp(a x + b) / a^2 + 72 x^7 exp(a x + b) / a^3 - 504 x^6 exp(a x + b) / a^4 + 3024 x^5 exp(a x + b) / a^5 - 15120 x^4 exp(a x + b) / a^6 + 60480 x^3 exp(a x + b) / a^7 - 181440 x^2 exp(a x + b) / a^8 + 362880 x exp(a x + b) / a^9 - 362880 exp(a x + b) / a^10",
    "1",

    "x^10 exp(a x)",
    "x^10 exp(a x) / a - 10 x^9 exp(a x) / a^2 + 90 x^8 exp(a x) / a^3 - 720 x^7 exp(a x) / a^4 + 5040 x^6 exp(a x) / a^5 - 30240 x^5 exp(a x) / a^6 + 151200 x^4 exp(a x) / a^7 - 604800 x^3 exp(a x) / a^8 + 1814400 x^2 exp(a x) / a^9 - 3628800 x exp(a x) / a^10 + 3628800 exp(a x) / a^11",
    "1",

    "x^10 exp(a x + b)",
    "x^10 exp(a x + b) / a - 10 x^9 exp(a x + b) / a^2 + 90 x^8 exp(a x + b) / a^3 - 720 x^7 exp(a x + b) / a^4 + 5040 x^6 exp(a x + b) / a^5 - 30240 x^5 exp(a x + b) / a^6 + 151200 x^4 exp(a x + b) / a^7 - 604800 x^3 exp(a x + b) / a^8 + 1814400 x^2 exp(a x + b) / a^9 - 3628800 x exp(a x + b) / a^10 + 3628800 exp(a x + b) / a^11",
    "1",

    "x^11 exp(a x)",
    "x^11 exp(a x) / a - 11 x^10 exp(a x) / a^2 + 110 x^9 exp(a x) / a^3 - 990 x^8 exp(a x) / a^4 + 7920 x^7 exp(a x) / a^5 - 55440 x^6 exp(a x) / a^6 + 332640 x^5 exp(a x) / a^7 - 1663200 x^4 exp(a x) / a^8 + 6652800 x^3 exp(a x) / a^9 - 19958400 x^2 exp(a x) / a^10 + 39916800 x exp(a x) / a^11 - 39916800 exp(a x) / a^12",
    "1",

    "x^11 exp(a x + b)",
    "x^11 exp(a x + b) / a - 11 x^10 exp(a x + b) / a^2 + 110 x^9 exp(a x + b) / a^3 - 990 x^8 exp(a x + b) / a^4 + 7920 x^7 exp(a x + b) / a^5 - 55440 x^6 exp(a x + b) / a^6 + 332640 x^5 exp(a x + b) / a^7 - 1663200 x^4 exp(a x + b) / a^8 + 6652800 x^3 exp(a x + b) / a^9 - 19958400 x^2 exp(a x + b) / a^10 + 39916800 x exp(a x + b) / a^11 - 39916800 exp(a x + b) / a^12",
    "1",

    // sin exp

    "sin(x) exp(a x)",
    "a sin(x) exp(a x) / (a^2 + 1) - cos(x) exp(a x) / (a^2 + 1)",
    "a^2 + 1", // denominator not zero

    "sin(x) exp(a x + b)",
    "a sin(x) exp(a x + b) / (a^2 + 1) - cos(x) exp(a x + b) / (a^2 + 1)",
    "a^2 + 1", // denominator not zero

    "sin(x) exp(i x)",
    "-1/4 exp(2 i x) + 1/2 i x",
    "1",

    "sin(x) exp(i x + b)",
    "-1/4 exp(b + 2 i x) + 1/2 i x exp(b)",
    "1",

    "sin(x) exp(-i x)",
    "-1/4 exp(-2 i x) - 1/2 i x",
    "1",

    "sin(x) exp(-i x + b)",
    "-1/4 exp(b - 2 i x) - 1/2 i x exp(b)",
    "1",

    // cos exp

    "cos(x) exp(a x)",
    "a cos(x) exp(a x) / (a^2 + 1) + sin(x) exp(a x) / (a^2 + 1)",
    "a^2 + 1", // denominator not zero

    "cos(x) exp(a x + b)",
    "a cos(x) exp(a x + b) / (a^2 + 1) + sin(x) exp(a x + b) / (a^2 + 1)",
    "a^2 + 1", // denominator not zero

    "cos(x) exp(i x)",
    "1/2 x - 1/4 i exp(2 i x)",
    "1",

    "cos(x) exp(i x + b)",
    "1/2 x exp(b) - 1/4 i exp(b + 2 i x)",
    "1",

    "cos(x) exp(-i x)",
    "1/2 x + 1/4 i exp(-2 i x)",
    "1",

    "cos(x) exp(-i x + b)",
    "1/2 x exp(b) + 1/4 i exp(b - 2 i x)",
    "1",

    // sin cos exp

    "sin(x) cos(x) exp(a x)",
    "a sin(2 x) exp(a x) / (2 (a^2 + 4)) - cos(2 x) exp(a x) / (a^2 + 4)",
    "a^2 + 4", // denominator not zero

    // x^n exp(a x^2 + b)

    "exp(a x^2)",
    "-1/2 i sqrt(pi) erf(i sqrt(a) x) / sqrt(a)",
    "1",

    "exp(a x^2 + b)",
    "-1/2 i sqrt(pi) exp(b) erf(i sqrt(a) x) / sqrt(a)",
    "1",

    "x exp(a x^2)",
    "1/2 exp(a x^2) / a",
    "1",

    "x exp(a x^2 + b)",
    "1/2 exp(a x^2 + b) / a",
    "1",

    "x^2 exp(a x^2)",
    "1/2 x exp(a x^2) / a + 1/4 i sqrt(pi) erf(i sqrt(a) x) / a^(3/2)",
    "1",

    "x^2 exp(a x^2 + b)",
    "1/2 x exp(a x^2 + b) / a + 1/4 i sqrt(pi) exp(b) erf(i sqrt(a) x) / a^(3/2)",
    "1",

    "x^3 exp(a x^2)",
    "1/2 exp(a x^2) (x^2 / a - 1 / a^2)",
    "1",

    "x^3 exp(a x^2 + b)",
    "1/2 exp(a x^2) exp(b) (x^2 / a - 1 / a^2)",
    "1",

    "x^4 exp(a x^2)",
    "x^3 exp(a x^2) / (2 a) - 3 x exp(a x^2) / (4 a^2) - 3 i pi^(1/2) erf(i a^(1/2) x) / (8 a^(5/2))",
    "1",

    "x^4 exp(a x^2 + b)",
    "x^3 exp(a x^2 + b) / (2 a) - 3 x exp(a x^2 + b) / (4 a^2) - 3 i pi^(1/2) erf(i a^(1/2) x) exp(b) / (8 a^(5/2))",
    "1",

    "x^5 exp(a x^2)",
    "x^4 exp(a x^2) / (2 a) - x^2 exp(a x^2) / a^2 + exp(a x^2) / a^3",
    "1",

    "x^5 exp(a x^2 + b)",
    "x^4 exp(a x^2 + b) / (2 a) - x^2 exp(a x^2 + b) / a^2 + exp(a x^2 + b) / a^3",
    "1",

    "x^6 exp(a x^2)",
    "x^5 exp(a x^2) / (2 a) - 5 x^3 exp(a x^2) / (4 a^2) + 15 x exp(a x^2) / (8 a^3) + 15 i pi^(1/2) erf(i a^(1/2) x) / (16 a^(7/2))",
    "1",

    "x^6 exp(a x^2 + b)",
    "x^5 exp(a x^2 + b) / (2 a) - 5 x^3 exp(a x^2 + b) / (4 a^2) + 15 x exp(a x^2 + b) / (8 a^3) + 15 i pi^(1/2) erf(i a^(1/2) x) exp(b) / (16 a^(7/2))",
    "1",

    "x^7 exp(a x^2)",
    "x^6 exp(a x^2) / (2 a) - 3 x^4 exp(a x^2) / (2 a^2) + 3 x^2 exp(a x^2) / a^3 - 3 exp(a x^2) / a^4",
    "1",

    "x^7 exp(a x^2 + b)",
    "x^6 exp(a x^2 + b) / (2 a) - 3 x^4 exp(a x^2 + b) / (2 a^2) + 3 x^2 exp(a x^2 + b) / a^3 - 3 exp(a x^2 + b) / a^4",
    "1",

    "x^8 exp(a x^2)",
    "x^7 exp(a x^2) / (2 a) - 7 x^5 exp(a x^2) / (4 a^2) + 35 x^3 exp(a x^2) / (8 a^3) - 105 x exp(a x^2) / (16 a^4) - 105 i pi^(1/2) erf(i a^(1/2) x) / (32 a^(9/2))",
    "1",

    "x^8 exp(a x^2 + b)",
    "x^7 exp(a x^2 + b) / (2 a) - 7 x^5 exp(a x^2 + b) / (4 a^2) + 35 x^3 exp(a x^2 + b) / (8 a^3) - 105 x exp(a x^2 + b) / (16 a^4) - 105 i pi^(1/2) erf(i a^(1/2) x) exp(b) / (32 a^(9/2))",
    "1",

    "x^9 exp(a x^2)",
    "x^8 exp(a x^2) / (2 a) - 2 x^6 exp(a x^2) / a^2 + 6 x^4 exp(a x^2) / a^3 - 12 x^2 exp(a x^2) / a^4 + 12 exp(a x^2) / a^5",
    "1",

    "x^9 exp(a x^2 + b)",
    "x^8 exp(a x^2 + b) / (2 a) - 2 x^6 exp(a x^2 + b) / a^2 + 6 x^4 exp(a x^2 + b) / a^3 - 12 x^2 exp(a x^2 + b) / a^4 + 12 exp(a x^2 + b) / a^5",
    "1",
];

// log(a x) is transformed to log(a) + log(x)

const integral_tab_log: string[] = [

    "log(x)",
    "x log(x) - x",
    "1",

    "log(a x + b)",
    "x log(a x + b) + b log(a x + b) / a - x",
    "1",

    "x log(x)",
    "x^2 log(x) 1/2 - x^2 1/4",
    "1",

    "x log(a x + b)",
    "1/2 (a x - b) (a x + b) log(a x + b) / a^2 - 1/4 x (a x - 2 b) / a",
    "1",

    "x^2 log(x)",
    "x^3 log(x) 1/3 - 1/9 x^3",
    "1",

    "x^2 log(a x + b)",
    "1/3 (a x + b) (a^2 x^2 - a b x + b^2) log(a x + b) / a^3 - 1/18 x (2 a^2 x^2 - 3 a b x + 6 b^2) / a^2",
    "1",

    "log(x)^2",
    "x log(x)^2 - 2 x log(x) + 2 x",
    "1",

    "log(a x + b)^2",
    "(a x + b) (log(a x + b)^2 - 2 log(a x + b) + 2) / a",
    "1",

    "log(x) / x^2",
    "-(log(x) + 1) / x",
    "1",

    "log(a x + b) / x^2",
    "a log(x) / b - (a x + b) log(a x + b) / (b x)",
    "1",

    "1 / (x (a + log(x)))",
    "log(a + log(x))",
    "1",
];

const integral_tab_trig: string[] = [

    "sin(a x)",
    "-cos(a x) / a",
    "1",

    "cos(a x)",
    "sin(a x) / a",
    "1",

    "tan(a x)",
    "-log(cos(a x)) / a",
    "1",

    // sin(a x)^n

    "sin(a x)^2",
    "-sin(2 a x) / (4 a) + 1/2 x",
    "1",

    "sin(a x)^3",
    "-2 cos(a x) / (3 a) - cos(a x) sin(a x)^2 / (3 a)",
    "1",

    "sin(a x)^4",
    "-sin(2 a x) / (4 a) + sin(4 a x) / (32 a) + 3/8 x",
    "1",

    "sin(a x)^5",
    "-cos(a x)^5 / (5 a) + 2 cos(a x)^3 / (3 a) - cos(a x) / a",
    "1",

    "sin(a x)^6",
    "sin(2 a x)^3 / (48 a) - sin(2 a x) / (4 a) + 3 sin(4 a x) / (64 a) + 5/16 x",
    "1",

    // cos(a x)^n

    "cos(a x)^2",
    "sin(2 a x) / (4 a) + 1/2 x",
    "1",

    "cos(a x)^3",
    "cos(a x)^2 sin(a x) / (3 a) + 2 sin(a x) / (3 a)",
    "1",

    "cos(a x)^4",
    "sin(2 a x) / (4 a) + sin(4 a x) / (32 a) + 3/8 x",
    "1",

    "cos(a x)^5",
    "sin(a x)^5 / (5 a) - 2 sin(a x)^3 / (3 a) + sin(a x) / a",
    "1",

    "cos(a x)^6",
    "-sin(2 a x)^3 / (48 a) + sin(2 a x) / (4 a) + 3 sin(4 a x) / (64 a) + 5/16 x",
    "1",

    //

    "sin(a x) cos(a x)",
    "1/2 sin(a x)^2 / a",
    "1",

    "sin(a x) cos(a x)^2",
    "-1/3 cos(a x)^3 / a",
    "1",

    "sin(a x)^2 cos(a x)",
    "1/3 sin(a x)^3 / a",
    "1",

    "sin(a x)^2 cos(a x)^2",
    "1/8 x - 1/32 sin(4 a x) / a",
    "1",
    // 329
    "1 / sin(a x) / cos(a x)",
    "log(tan(a x)) / a",
    "1",
    // 330
    "1 / sin(a x) / cos(a x)^2",
    "(1 / cos(a x) + log(tan(a x 1/2))) / a",
    "1",
    // 331
    "1 / sin(a x)^2 / cos(a x)",
    "(log(tan(pi 1/4 + a x 1/2)) - 1 / sin(a x)) / a",
    "1",
    // 333
    "1 / sin(a x)^2 / cos(a x)^2",
    "-2 / (a tan(2 a x))",
    "1",
    //
    "sin(a x) / cos(a x)",
    "-log(cos(a x)) / a",
    "1",

    "sin(a x) / cos(a x)^2",
    "1 / a / cos(a x)",
    "1",

    "sin(a x)^2 / cos(a x)",
    "-(sin(a x) + log(cos(a x / 2) - sin(a x / 2)) - log(sin(a x / 2) + cos(a x / 2))) / a",
    "1",

    "sin(a x)^2 / cos(a x)^2",
    "tan(a x) / a - x",
    "1",

    "cos(a x) / sin(a x)",
    "log(sin(a x)) / a",
    "1",

    "cos(a x) / sin(a x)^2",
    "-1 / (a sin(a x))",
    "1",

    "cos(a x)^2 / sin(a x)^2",
    "-x - cos(a x) / sin(a x) / a",
    "1",

    "sin(a + b x)",
    "-cos(a + b x) / b",
    "1",

    "cos(a + b x)",
    "sin(a + b x) / b",
    "1",

    "x sin(a x)",
    "sin(a x) / (a^2) - x cos(a x) / a",
    "1",

    "x^2 sin(a x)",
    "2 x sin(a x) / (a^2) - (a^2 x^2 - 2) cos(a x) / (a^3)",
    "1",

    "x cos(a x)",
    "cos(a x) / (a^2) + x sin(a x) / a",
    "1",

    "x^2 cos(a x)",
    "2 x cos(a x) / (a^2) + (a^2 x^2 - 2) sin(a x) / (a^3)",
    "1",

    "1 / tan(a x)",
    "log(sin(a x)) / a",
    "1",

    "1 / cos(a x)",
    "log(tan(pi 1/4 + a x 1/2)) / a",
    "1",

    "1 / sin(a x)",
    "log(tan(a x 1/2)) / a",
    "1",

    "1 / sin(a x)^2",
    "-1 / (a tan(a x))",
    "1",

    "1 / cos(a x)^2",
    "tan(a x) / a",
    "1",

    "1 / (b + b sin(a x))",
    "-tan(pi 1/4 - a x 1/2) / (a b)",
    "1",

    "1 / (b - b sin(a x))",
    "tan(pi 1/4 + a x 1/2) / (a b)",
    "1",

    "1 / (b + b cos(a x))",
    "tan(a x 1/2) / (a b)",
    "1",

    "1 / (b - b cos(a x))",
    "-1 / (tan(a x 1/2) a b)",
    "1",

    "1 / (a + b sin(x))",
    "log((a tan(x 1/2) + b - sqrt(b^2 - a^2)) / (a tan(x 1/2) + b + sqrt(b^2 - a^2))) / sqrt(b^2 - a^2)",
    "b^2 - a^2",

    "1 / (a + b cos(x))",
    "log((sqrt(b^2 - a^2) tan(x 1/2) + a + b) / (sqrt(b^2 - a^2) tan(x 1/2) - a - b)) / sqrt(b^2 - a^2)",
    "b^2 - a^2",

    "x sin(a x) sin(b x)",
    "1/2 ((x sin(x (a - b)))/(a - b) - (x sin(x (a + b)))/(a + b) + cos(x (a - b))/(a - b)^2 - cos(x (a + b))/(a + b)^2)",
    "and(not(a + b == 0),not(a - b == 0))",

    "sin(a x)/(cos(a x) - 1)^2",
    "1/a * 1/(cos(a x) - 1)",
    "1",

    "sin(a x)/(1 - cos(a x))^2",
    "1/a * 1/(cos(a x) - 1)",
    "1",

    "cos(x)^3 sin(x)",
    "-1/4 cos(x)^4",
    "1",

    "cos(a x)^5",
    "sin(a x)^5 / (5 a) - 2 sin(a x)^3 / (3 a) + sin(a x) / a",
    "1",

    "cos(a x)^5 / sin(a x)^2",
    "sin(a x)^3 / (3 a) - 2 sin(a x) / a - 1 / (a sin(a x))",
    "1",

    "cos(a x)^3 / sin(a x)^2",
    "-sin(a x) / a - 1 / (a sin(a x))",
    "1",

    "cos(a x)^5 / sin(a x)",
    "log(sin(a x)) / a + sin(a x)^4 / (4 a) - sin(a x)^2 / a",
    "1",

    "cos(a x)^3 / sin(a x)",
    "log(sin(a x)) / a - sin(a x)^2 / (2 a)",
    "1",

    "cos(a x) sin(a x)^3",
    "sin(a x)^4 / (4 a)",
    "1",

    "cos(a x)^3 sin(a x)^2",
    "-sin(a x)^5 / (5 a) + sin(a x)^3 / (3 a)",
    "1",

    "cos(a x)^2 sin(a x)^3",
    "cos(a x)^5 / (5 a) - cos(a x)^3 / (3 a)",
    "1",

    "cos(a x)^4 sin(a x)",
    "-cos(a x)^5 / (5 a)",
    "1",

    "cos(a x)^7 / sin(a x)^2",
    "-sin(a x)^5 / (5 a) + sin(a x)^3 / a - 3 sin(a x) / a - 1 / (a sin(a x))",
    "1",

    // cos(a x)^n / sin(a x)

    "cos(a x)^2 / sin(a x)",
    "cos(a x) / a + log(tan(1/2 a x)) / a",
    "1",

    "cos(a x)^4 / sin(a x)",
    "4 cos(a x) / (3 a) - cos(a x) sin(a x)^2 / (3 a) + log(tan(1/2 a x)) / a",
    "1",

    "cos(a x)^6 / sin(a x)",
    "cos(a x)^5 / (5 a) - 2 cos(a x)^3 / (3 a) + 2 cos(a x) / a - cos(a x) sin(a x)^2 / a + log(tan(1/2 a x)) / a",
    "1",
];

const integral_tab_power: string[] = [

    "a", // for forms c^d where both c and d are constant expressions
    "a x",
    "1",

    "1 / x",
    "log(x)",
    "1",

    "x^a",			// integrand
    "x^(a + 1) / (a + 1)",	// answer
    "not(a = -1)",		// condition

    "a^x",
    "a^x / log(a)",
    "or(not(number(a)),a>0)",

    "1 / (a + b x)",
    "log(a + b x) / b",
    "1",
    // 124
    "sqrt(a x + b)",
    "2/3 (a x + b)^(3/2) / a",
    "1",
    // 138
    "sqrt(a x^2 + b)",
    "1/2 x sqrt(a x^2 + b) + 1/2 b log(sqrt(a) sqrt(a x^2 + b) + a x) / sqrt(a)",
    "1",
    // 131
    "1 / sqrt(a x + b)",
    "2 sqrt(a x + b) / a",
    "1",

    "1 / ((a + b x)^2)",
    "-1 / (b (a + b x))",
    "1",

    "1 / ((a + b x)^3)",
    "-1 / ((2 b) ((a + b x)^2))",
    "1",
    // 16
    "1 / (a x^2 + b)",
    "arctan(sqrt(a) x / sqrt(b)) / sqrt(a) / sqrt(b)",
    "1",
    // 17
    "1 / sqrt(1 - x^2)",
    "arcsin(x)",
    "1",

    "sqrt(1 + x^2 / (1 - x^2))",
    "arcsin(x)",
    "1",

    "1 / sqrt(a x^2 + b)",
    "log(sqrt(a) sqrt(a x^2 + b) + a x) / sqrt(a)",
    "1",
    // 65
    "1 / (a x^2 + b)^2",
    "1/2 ((arctan((sqrt(a) x) / sqrt(b))) / (sqrt(a) b^(3/2)) + x / (a b x^2 + b^2))",
    "1",
    // 67 (m=2)
    "1 / (a + b x^2)^3",
    "x / (a + b x^2)^2 / (4 a) + 3 x / (8 a (a^2 + a b x^2)) + 3 arctan(b^(1/2) x / a^(1/2),1) / (8 a^(5/2) b^(1/2))",
    "1",
    // 67 (m=3)
    "1 / (a + b x^2)^4",
    "11 x / (16 a (a + b x^2)^3) + 5 b x^3 / (6 a^2 (a + b x^2)^3) + 5 b^2 x^5 / (16 a^3 (a + b x^2)^3) + 5 arctan(b^(1/2) x / a^(1/2),1) / (16 a^(7/2) b^(1/2))",
    "1",
    // 165
    "(a x^2 + b)^(-3/2)",
    "x / b / sqrt(a x^2 + b)",
    "1",
    // 74
    "1 / (a x^3 + b)",
    "-log(a^(2/3) x^2 - a^(1/3) b^(1/3) x + b^(2/3))/(6 a^(1/3) b^(2/3))" +
    " + log(a^(1/3) x + b^(1/3))/(3 a^(1/3) b^(2/3))" +
    " - (i log(1 - (i (1 - (2 a^(1/3) x)/b^(1/3)))/sqrt(3)))/(2 sqrt(3) a^(1/3) b^(2/3))" +
    " + (i log(1 + (i (1 - (2 a^(1/3) x)/b^(1/3)))/sqrt(3)))/(2 sqrt(3) a^(1/3) b^(2/3))", // from Wolfram Alpha
    "1",
    // 77 78
    "1 / (a x^4 + b)",
    "-log(-sqrt(2) a^(1/4) b^(1/4) x + sqrt(a) x^2 + sqrt(b))/(4 sqrt(2) a^(1/4) b^(3/4))" +
    " + log(sqrt(2) a^(1/4) b^(1/4) x + sqrt(a) x^2 + sqrt(b))/(4 sqrt(2) a^(1/4) b^(3/4))" +
    " - (i log(1 - i (1 - (sqrt(2) a^(1/4) x)/b^(1/4))))/(4 sqrt(2) a^(1/4) b^(3/4))" +
    " + (i log(1 + i (1 - (sqrt(2) a^(1/4) x)/b^(1/4))))/(4 sqrt(2) a^(1/4) b^(3/4))" +
    " + (i log(1 - i ((sqrt(2) a^(1/4) x)/b^(1/4) + 1)))/(4 sqrt(2) a^(1/4) b^(3/4))" +
    " - (i log(1 + i ((sqrt(2) a^(1/4) x)/b^(1/4) + 1)))/(4 sqrt(2) a^(1/4) b^(3/4))", // from Wolfram Alpha
    "1",
    //
    "1 / (a x^5 + b)",
    "(sqrt(5) log(2 a^(2/5) x^2 + (sqrt(5) - 1) a^(1/5) b^(1/5) x + 2 b^(2/5))" +
    " - log(2 a^(2/5) x^2 + (sqrt(5) - 1) a^(1/5) b^(1/5) x + 2 b^(2/5))" +
    " - sqrt(5) log(2 a^(2/5) x^2 - (1 + sqrt(5)) a^(1/5) b^(1/5) x + 2 b^(2/5))" +
    " - log(2 a^(2/5) x^2 - (1 + sqrt(5)) a^(1/5) b^(1/5) x + 2 b^(2/5))" +
    " + 4 log(a^(1/5) x + b^(1/5))" +
    " + 2 sqrt(2 (5 + sqrt(5))) arctan((4 a^(1/5) x + (sqrt(5) - 1) b^(1/5))/(sqrt(2 (5 + sqrt(5))) b^(1/5)))" +
    " + 2 sqrt(10 - 2 sqrt(5)) arctan((4 a^(1/5) x - (1 + sqrt(5)) b^(1/5))/(sqrt(10 - 2 sqrt(5)) b^(1/5))))/(20 a^(1/5) b^(4/5))", // from Wolfram Alpha
    "1",
    // 164
    "sqrt(a + x^6 + 3 a^(1/3) x^4 + 3 a^(2/3) x^2)",
    "1/4 (x sqrt((x^2 + a^(1/3))^3) + 3/2 a^(1/3) x sqrt(x^2 + a^(1/3)) + 3/2 a^(2/3) log(x + sqrt(x^2 + a^(1/3))))",
    "1",
    // 165
    "sqrt(-a + x^6 - 3 a^(1/3) x^4 + 3 a^(2/3) x^2)",
    "1/4 (x sqrt((x^2 - a^(1/3))^3) - 3/2 a^(1/3) x sqrt(x^2 - a^(1/3)) + 3/2 a^(2/3) log(x + sqrt(x^2 - a^(1/3))))",
    "1",

    "sinh(x)^2",
    "sinh(2 x) 1/4 - x 1/2",
    "1",

    "tanh(x)^2",
    "x - tanh(x)",
    "1",

    "cosh(x)^2",
    "sinh(2 x) 1/4 + x 1/2",
    "1",
];

const integral_tab: string[] = [

    "a",
    "a x",
    "1",

    "x",
    "1/2 x^2",
    "1",
    // 18
    "x / sqrt(a x^2 + b)",
    "sqrt(a x^2 + b) / a",
    "1",

    "x / (a + b x)",
    "x / b - a log(a + b x) / (b b)",
    "1",

    "x / ((a + b x)^2)",
    "(log(a + b x) + a / (a + b x)) / (b^2)",
    "1",
    // 33
    "x^2 / (a + b x)",
    "a^2 log(a + b x) / b^3 + x (b x - 2 a) / (2 b^2)",
    "1",
    // 34
    "x^2 / (a + b x)^2",
    "(-a^2 / (a + b x) - 2 a log(a + b x) + b x) / b^3",
    "1",

    "x^2 / (a + b x)^3",
    "(log(a + b x) + 2 a / (a + b x) - a^2 / (2 ((a + b x)^2))) / (b^3)",
    "1",

    "1 / x / (a + b x)",
    "-log((a + b x) / x) / a",
    "1",

    "1 / x / (a + b x)^2",
    "1 / (a (a + b x)) - log((a + b x) / x) / (a^2)",
    "1",

    "1 / x / (a + b x)^3",
    "(1/2 ((2 a + b x) / (a + b x))^2 + log(x / (a + b x))) / (a^3)",
    "1",

    "1 / x^2 / (a + b x)",
    "-1 / (a x) + b log((a + b x) / x) / (a^2)",
    "1",

    "1 / x^3 / (a + b x)",
    "(2 b x - a) / (2 a^2 x^2) + b^2 log(x / (a + b x)) / (a^3)",
    "1",

    "1 / x^2 / (a + b x)^2",
    "-(a + 2 b x) / (a^2 x (a + b x)) + 2 b log((a + b x) / x) / (a^3)",
    "1",

    "x / (a + b x^2)",
    "log(a + b x^2) / (2 b)",
    "1",
    // 64
    "x^2 / (a x^2 + b)",
    "1/2 i a^(-3/2) sqrt(b) (log(1 + i sqrt(a) x / sqrt(b)) - log(1 - i sqrt(a) x / sqrt(b))) + x / a",
    "1",
    // 68 (m=1)
    "x / (a + b x^2)^2",
    "-1 / (2 b (a + b x^2))",
    "1",
    // 68 (m=2)
    "x / (a + b x^2)^3",
    "-1 / (4 b (a + b x^2)^2)",
    "1",
    // 68 (m=3)
    "x / (a + b x^2)^4",
    "-1 / (6 b (a + b x^2)^3)",
    "1",
    // 69 (m=1)
    "x^2 / (a + b x^2)^2",
    "-x / (2 b (a + b x^2)) + arctan(sqrt(b/a) x) / (2 sqrt(a b^3))",
    "1",
    // 69 (m=2)
    "x^2 / (a + b x^2)^3",
    "x^3 / (8 a (a + b x^2)^2) + arctan(b^(1/2) x / a^(1/2),1) / (8 a^(3/2) b^(3/2)) - x / (8 b (a + b x^2)^2)",
    "1",
    // 69 (m=3)
    "x^2 / (a + b x^2)^4",
    "x^3 / (6 a (a + b x^2)^3) + b x^5 / (16 a^2 (a + b x^2)^3) + arctan(b^(1/2) x / a^(1/2),1) / (16 a^(5/2) b^(3/2)) - x / (16 b (a + b x^2)^3)",
    "1",
    // 70
    "1 / x * 1 / (a + b x^2)",
    "1 log(x^2 / (a + b x^2)) / (2 a)",
    "1",
    // 71
    "1 / x^2 * 1 / (a x^2 + b)",
    "1/2 i sqrt(a) b^(-3/2) (log(1 + i sqrt(a) x / sqrt(b)) - log(1 - i sqrt(a) x / sqrt(b))) - 1 / (b x)",
    "1",
    // 75
    "x / (a x^3 + b)",
    "log(a^(2/3) x^2 - a^(1/3) b^(1/3) x + b^(2/3))/(6 a^(2/3) b^(1/3))" +
    " - log(a^(1/3) x + b^(1/3))/(3 a^(2/3) b^(1/3))" +
    " - (i log(1 - (i (1 - (2 a^(1/3) x)/b^(1/3)))/sqrt(3)))/(2 sqrt(3) a^(2/3) b^(1/3))" +
    " + (i log(1 + (i (1 - (2 a^(1/3) x)/b^(1/3)))/sqrt(3)))/(2 sqrt(3) a^(2/3) b^(1/3))", // from Wolfram Alpha
    "1",
    // 76
    "x^2 / (a + b x^3)",
    "1 log(a + b x^3) / (3 b)",
    "1",
    // 79 80
    "x / (a x^4 + b)",
    "(i log(1 - (i sqrt(a) x^2)/sqrt(b)))/(4 sqrt(a) sqrt(b))" +
    " - (i log(1 + (i sqrt(a) x^2)/sqrt(b)))/(4 sqrt(a) sqrt(b))", // from Wolfram Alpha
    "1",
    // 81 82
    "x^2 / (a x^4 + b)",
    "log(-sqrt(2) a^(1/4) b^(1/4) x + sqrt(a) x^2 + sqrt(b))/(4 sqrt(2) a^(3/4) b^(1/4))" +
    " - log(sqrt(2) a^(1/4) b^(1/4) x + sqrt(a) x^2 + sqrt(b))/(4 sqrt(2) a^(3/4) b^(1/4))" +
    " - (i log(1 - i (1 - (sqrt(2) a^(1/4) x)/b^(1/4))))/(4 sqrt(2) a^(3/4) b^(1/4))" +
    " + (i log(1 + i (1 - (sqrt(2) a^(1/4) x)/b^(1/4))))/(4 sqrt(2) a^(3/4) b^(1/4))" +
    " + (i log(1 - i ((sqrt(2) a^(1/4) x)/b^(1/4) + 1)))/(4 sqrt(2) a^(3/4) b^(1/4))" +
    " - (i log(1 + i ((sqrt(2) a^(1/4) x)/b^(1/4) + 1)))/(4 sqrt(2) a^(3/4) b^(1/4))", // from Wolfram Alpha
    "1",
    //
    "x^3 / (a + b x^4)",
    "1 log(a + b x^4) / (4 b)",
    "1",

    "x sqrt(a + b x)",
    "-2 (2 a - 3 b x) sqrt((a + b x)^3) 1/15 / (b^2)",
    "1",

    "x^2 sqrt(a + b x)",
    "2 (8 a^2 - 12 a b x + 15 b^2 x^2) sqrt((a + b x)^3) 1/105 / (b^3)",
    "1",

    "x^2 sqrt(a + b x^2)",
    "(sqrt(b) x sqrt(a + b x^2) (a + 2 b x^2) - a^2 log(sqrt(b) sqrt(a + b x^2) + b x)) / (8 b^(3/2))",
    "1",
    // 128
    "sqrt(a x + b) / x",
    "2 sqrt(a x + b) - 2 sqrt(b) arctanh(sqrt(a x + b) / sqrt(b))",
    "1",
    // 129
    "sqrt(a x + b) / x^2",
    "-sqrt(a x + b) / x - a arctanh(sqrt(a x + b) / sqrt(b)) / sqrt(b)",
    "1",

    "x / sqrt(a + b x)",
    "-2 (2 a - b x) sqrt(a + b x) / (3 (b^2))",
    "1",

    "x^2 / sqrt(a + b x)",
    "2 (8 a^2 - 4 a b x + 3 b^2 x^2) sqrt(a + b x) / (15 (b^3))",
    "1",
    // 134
    "1 / x / sqrt(a x + b)",
    "-2 arctanh(sqrt(a x + b) / sqrt(b)) / sqrt(b)",
    "1",
    // 137
    "1 / x^2 / sqrt(a x + b)",
    "a arctanh(sqrt(a x + b) / sqrt(b)) / b^(3/2) - sqrt(a x + b) / (b x)",
    "1",
    // 158
    "1 / x / sqrt(a x^2 + b)",
    "(log(x) - log(sqrt(b) sqrt(a x^2 + b) + b)) / sqrt(b)",
    "1",
    // 160
    "sqrt(a x^2 + b) / x",
    "sqrt(a x^2 + b) - sqrt(b) log(sqrt(b) sqrt(a x^2 + b) + b) + sqrt(b) log(x)",
    "1",
    // 163
    "x sqrt(a x^2 + b)",
    "1/3 (a x^2 + b)^(3/2) / a",
    "1",
    // 166
    "x (a x^2 + b)^(-3/2)",
    "-1 / a / sqrt(a x^2 + b)",
    "1",

    "x sqrt(a + x^6 + 3 a^(1/3) x^4 + 3 a^(2/3) x^2)",
    "1/5 sqrt((x^2 + a^(1/3))^5)",
    "1",
    // 168
    "x^2 sqrt(a x^2 + b)",
    "1/8 a^(-3/2) (sqrt(a) x sqrt(a x^2 + b) (2 a x^2 + b) - b^2 log(sqrt(a) sqrt(a x^2 + b) + a x))",
    "and(number(a),a>0)",
    // 169
    "x^3 sqrt(a x^2 + b)",
    "1/15 sqrt(a x^2 + b) (3 a^2 x^4 + a b x^2 - 2 b^2) / a^2",
    "1",
    // 171
    "x^2 / sqrt(a x^2 + b)",
    "1/2 a^(-3/2) (sqrt(a) x sqrt(a x^2 + b) - b log(sqrt(a) sqrt(a x^2 + b) + a x))",
    "1",
    // 172
    "x^3 / sqrt(a x^2 + b)",
    "1/3 (a x^2 - 2 b) sqrt(a x^2 + b) / a^2",
    "1",
    // 173
    "1 / x^2 / sqrt(a x^2 + b)",
    "-sqrt(a x^2 + b) / (b x)",
    "1",
    // 174
    "1 / x^3 / sqrt(a x^2 + b)",
    "-sqrt(a x^2 + b) / (2 b x^2) + a (log(sqrt(b) sqrt(a x^2 + b) + b) - log(x)) / (2 b^(3/2))",
    "1",
    // 216
    "sqrt(a x^2 + b) / x^2",
    "sqrt(a) log(sqrt(a) sqrt(a x^2 + b) + a x) - sqrt(a x^2 + b) / x",
    "and(number(a),a>0)",
    // 217
    "sqrt(a x^2 + b) / x^3",
    "1/2 (-sqrt(a x^2 + b) / x^2 - (a log(sqrt(b) sqrt(a x^2 + b) + b)) / sqrt(b) + (a log(x)) / sqrt(b))",
    "and(number(b),b>0)",

    "arcsin(a x)",
    "x arcsin(a x) + sqrt(1 - a^2 x^2) / a",
    "1",

    "arccos(a x)",
    "x arccos(a x) + sqrt(1 - a^2 x^2) / a",
    "1",

    "arctan(a x)",
    "x arctan(a x) - log(1 + a^2 x^2) / (2 a)",
    "1",

    "sinh(x)",
    "cosh(x)",
    "1",

    "cosh(x)",
    "sinh(x)",
    "1",

    "tanh(x)",
    "log(cosh(x))",
    "1",

    "x sinh(x)",
    "x cosh(x) - sinh(x)",
    "1",

    "x cosh(x)",
    "x sinh(x) - cosh(x)",
    "1",

    "erf(a x)",
    "x erf(a x) + exp(-a^2 x^2) / (a sqrt(pi))",
    "1",

    "x^2 (1 - x^2)^(3/2)",
    "(x sqrt(1 - x^2) (-8 x^4 + 14 x^2 - 3) + 3 arcsin(x)) 1/48",
    "1",

    "x^2 (1 - x^2)^(5/2)",
    "(x sqrt(1 - x^2) (48 x^6 - 136 x^4 + 118 x^2 - 15) + 15 arcsin(x)) 1/384",
    "1",

    "x^4 (1 - x^2)^(3/2)",
    "(-x sqrt(1 - x^2) (16 x^6 - 24 x^4 + 2 x^2 + 3) + 3 arcsin(x)) 1/128",
    "1",
];

function eval_integral(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);

    p1 = cddr(p1);

    if (!is_cons(p1)) {
        push(X_LOWER, $);
        integral($);
        return;
    }

    let flag = 0;
    let X: U;
    let Y: U = nil;

    while (is_cons(p1) || flag) {

        if (flag) {
            X = Y;
            flag = 0;
        }
        else {
            push(car(p1), $);
            value_of($);
            X = pop($);
            p1 = cdr(p1);
        }

        if (is_num(X)) {
            push(X, $);
            const n = pop_integer($);
            push(X_LOWER, $);
            X = pop($);
            for (let i = 0; i < n; i++) {
                push(X, $);
                integral($);
            }
            continue;
        }

        if (!(is_sym(X) && $.hasUserFunction(X)))
            stopf("integral");

        if (is_cons(p1)) {

            push(car(p1), $);
            value_of($);
            Y = pop($);
            p1 = cdr(p1);

            if (is_num(Y)) {
                push(Y, $);
                const n = pop_integer($);
                for (let i = 0; i < n; i++) {
                    push(X, $);
                    integral($);
                }
                continue;
            }

            flag = 1;
        }

        push(X, $);
        integral($);
    }
}

function integral($: ScriptVars): void {

    const X = pop($);
    let F = pop($);

    if (!(is_sym(X) && $.hasUserFunction(X)))
        stopf("integral: symbol expected");

    if (car(F).equals(ADD)) {
        const h = $.stack.length;
        let p1 = cdr(F);
        while (is_cons(p1)) {
            push(car(p1), $);
            push(X, $);
            integral($);
            p1 = cdr(p1);
        }
        add_terms($.stack.length - h, $);
        return;
    }

    if (car(F).equals(MULTIPLY)) {
        push(F, $);
        push(X, $);
        partition_term($);	// push const part then push var part
        F = pop($);		// pop var part
        integral_nib(F, X, $);
        multiply_factors(2, $);		// multiply by const part
        return;
    }

    integral_nib(F, X, $);
}

function integral_nib(F: U, X: U, $: ScriptVars): void {

    save_symbol(DOLLAR_A, $);
    save_symbol(DOLLAR_B, $);
    save_symbol(DOLLAR_X, $);

    set_symbol(DOLLAR_X, X, nil, $);

    // put constants in F(X) on the stack

    const h = $.stack.length;

    push_integer(1, $); // 1 is a candidate for a or b

    push(F, $);
    push(X, $);
    decomp($); // push const coeffs

    integral_lookup(h, F, $);

    restore_symbol($);
    restore_symbol($);
    restore_symbol($);
}

function integral_lookup(h: number, F: U, $: ScriptVars): void {

    const t = integral_classify(F);

    if ((t & 1) && integral_search(h, F, integral_tab_exp, integral_tab_exp.length, $, { useCaretForExponentiation: true, useParenForTensors: true }))
        return;

    if ((t & 2) && integral_search(h, F, integral_tab_log, integral_tab_log.length, $, { useCaretForExponentiation: true, useParenForTensors: true }))
        return;

    if ((t & 4) && integral_search(h, F, integral_tab_trig, integral_tab_trig.length, $, { useCaretForExponentiation: true, useParenForTensors: true }))
        return;

    if (car(F).equals(POWER)) {
        if (integral_search(h, F, integral_tab_power, integral_tab_power.length, $, { useCaretForExponentiation: true, useParenForTensors: true }))
            return;
    }
    else {
        if (integral_search(h, F, integral_tab, integral_tab.length, $, { useCaretForExponentiation: true, useParenForTensors: true })) {
            return;
        }
    }

    stopf("integral: no solution found");
}

function integral_classify(p: U): number {

    if (is_cons(p)) {
        let t = 0;
        while (is_cons(p)) {
            t |= integral_classify(car(p));
            p = cdr(p);
        }
        return t;
    }

    if (p.equals(DOLLAR_E)) {
        return 1;
    }

    if (p.equals(LOG)) {
        return 2;
    }

    if (p.equals(SIN) || p.equals(COS) || p.equals(TAN)) {
        return 4;
    }

    return 0;
}

/**
 * 
 * @param h 
 * @param F 
 * @param table 
 * @param n 
 * @param $ 
 * @param config A configuration which is appropriate for the table
 * @returns 
 */
function integral_search(h: number, F: U, table: string[], n: number, $: ScriptVars, config: EigenmathParseConfig): 0 | 1 {
    let i: number;
    let C: U;
    let I: U;

    for (i = 0; i < n; i += 3) {

        scan_integrals(table[i + 0], $, config); // integrand
        I = pop($);

        scan_integrals(table[i + 2], $, config); // condition
        C = pop($);

        if (integral_search_nib(h, F, I, C, $))
            break;
    }

    if (i >= n)
        return 0;

    $.stack.splice(h); // pop all

    scan_integrals(table[i + 1], $, config); // answer
    value_of($);

    return 1;
}

function integral_search_nib(h: number, F: U, I: U, C: U, $: ScriptVars): 0 | 1 {

    for (let i = h; i < $.stack.length; i++) {

        set_symbol(DOLLAR_A, $.stack[i], nil, $);

        for (let j = h; j < $.stack.length; j++) {

            set_symbol(DOLLAR_B, $.stack[j], nil, $);

            push(C, $);			// condition ok?
            value_of($);
            let p1 = pop($);
            if (iszero(p1))
                continue;		// no, go to next j

            push(F, $);			// F = I?
            push(I, $);
            value_of($);
            subtract($);
            p1 = pop($);
            if (iszero(p1))
                return 1;		// yes
        }
    }

    return 0;					// no
}

function eval_inv(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    inv($);
}

function inv($: ScriptVars): void {

    const p1 = pop($);

    if (!istensor(p1)) {
        push(p1, $);
        reciprocate($);
        return;
    }

    if (!issquarematrix(p1))
        stopf("inv: square matrix expected");

    push(p1, $);
    adj($);

    push(p1, $);
    det($);

    divide($);
}

function eval_kronecker(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    p1 = cddr(p1);
    while (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
        kronecker($);
        p1 = cdr(p1);
    }
}

function kronecker($: ScriptVars): void {

    const p2 = pop($);
    const p1 = pop($);

    if (!istensor(p1) || !istensor(p2)) {
        push(p1, $);
        push(p2, $);
        multiply($);
        return;
    }

    if (p1.ndim > 2 || p2.ndim > 2)
        stopf("kronecker");

    const m = p1.dims[0];
    const n = p1.ndim === 1 ? 1 : p1.dims[1];

    const p = p2.dims[0];
    const q = p2.ndim === 1 ? 1 : p2.dims[1];

    const p3 = alloc_tensor();

    // result matrix has (m * p) rows and (n * q) columns

    let h = 0;

    for (let i = 0; i < m; i++)
        for (let j = 0; j < p; j++)
            for (let k = 0; k < n; k++)
                for (let l = 0; l < q; l++) {
                    push(p1.elems[n * i + k], $);
                    push(p2.elems[q * j + l], $);
                    multiply($);
                    p3.elems[h++] = pop($);
                }

    // dim info

    p3.dims[0] = m * p;

    if (n * q > 1)
        p3.dims[1] = n * q;

    push(p3, $);
}

function eval_log(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    logfunc($);
}

function logfunc($: ScriptVars): void {

    let p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, logfunc, $), $);
        return;
    }

    // log of zero is not evaluated

    if (iszero(p1)) {
        push(LOG, $);
        push_integer(0, $);
        list(2, $);
        return;
    }

    if (is_flt(p1)) {
        const d = p1.toNumber();
        if (d > 0.0) {
            push_double(Math.log(d), $);
            return;
        }
    }

    // log(z) -> log(mag(z)) + i arg(z)

    if (is_flt(p1) || isdoublez(p1)) {
        push(p1, $);
        mag($);
        logfunc($);
        push(p1, $);
        arg($);
        push(imaginaryunit, $);
        multiply($);
        add($);
        return;
    }

    // log(1) -> 0

    if (isplusone(p1)) {
        push_integer(0, $);
        return;
    }

    // log(e) -> 1

    if (p1.equals(DOLLAR_E)) {
        push_integer(1, $);
        return;
    }

    if (is_num(p1) && isnegativenumber(p1)) {
        push(p1, $);
        negate($);
        logfunc($);
        push(imaginaryunit, $);
        push(Pi, $);
        multiply($);
        add($);
        return;
    }

    // log(10) -> log(2) + log(5)

    if (is_rat(p1)) {
        const h = $.stack.length;
        push(p1, $);
        factor_factor($);
        for (let i = h; i < $.stack.length; i++) {
            const p2 = $.stack[i];
            if (car(p2).equals(POWER)) {
                push(caddr(p2), $); // exponent
                push(LOG, $);
                push(cadr(p2), $); // base
                list(2, $);
                multiply($);
            }
            else {
                push(LOG, $);
                push(p2, $);
                list(2, $);
            }
            $.stack[i] = pop($);
        }
        add_terms($.stack.length - h, $);
        return;
    }

    // log(a ^ b) -> b log(a)

    if (car(p1).equals(POWER)) {
        push(caddr(p1), $);
        push(cadr(p1), $);
        logfunc($);
        multiply($);
        return;
    }

    // log(a * b) -> log(a) + log(b)

    if (car(p1).equals(MULTIPLY)) {
        const h = $.stack.length;
        p1 = cdr(p1);
        while (is_cons(p1)) {
            push(car(p1), $);
            logfunc($);
            p1 = cdr(p1);
        }
        add_terms($.stack.length - h, $);
        return;
    }

    push(LOG, $);
    push(p1, $);
    list(2, $);
}

function eval_mag(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    mag($);
}

/**
 * Returns a copy of the source Tensor with foo applied to each element.
 * @param source 
 * @param foo A function that is expected to pop a single value from the stack and push the result.
 */
function elementwise(source: Tensor, foo: ($: ScriptVars) => void, $: ScriptVars): Tensor {
    const T = copy_tensor(source);
    const n = T.nelem;
    for (let i = 0; i < n; i++) {
        push(T.elems[i], $);
        foo($);
        T.elems[i] = pop($);
    }
    return T;
}

function mag($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, mag, $), $);
        return;
    }

    // use numerator and denominator to handle (a + i b) / (c + i d)

    push(p1, $);
    numerator($);
    mag_nib($);

    push(p1, $);
    denominator($);
    mag_nib($);

    divide($);
}

function mag_nib($: ScriptVars): void {

    let p1 = pop($);

    if (is_num(p1)) {
        push(p1, $);
        absfunc($);
        return;
    }

    // -1 to a power

    if (car(p1).equals(POWER) && isminusone(cadr(p1))) {
        push_integer(1, $);
        return;
    }

    // exponential

    if (car(p1).equals(POWER) && cadr(p1).equals(DOLLAR_E)) {
        push(caddr(p1), $);
        real($);
        expfunc($);
        return;
    }

    // product

    if (car(p1).equals(MULTIPLY)) {
        p1 = cdr(p1);
        const h = $.stack.length;
        while (is_cons(p1)) {
            push(car(p1), $);
            mag($);
            p1 = cdr(p1);
        }
        multiply_factors($.stack.length - h, $);
        return;
    }

    // sum

    if (car(p1).equals(ADD)) {
        push(p1, $);
        rect($); // convert polar terms, if any
        p1 = pop($);
        push(p1, $);
        real($);
        const RE = pop($);
        push(p1, $);
        imag($);
        const IM = pop($);
        push(RE, $);
        push(RE, $);
        multiply($);
        push(IM, $);
        push(IM, $);
        multiply($);
        add($);
        push_rational(1, 2, $);
        power($);
        return;
    }

    // real

    push(p1, $);
}

function eval_minor(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);
    const p2 = pop($);

    push(caddr(p1), $);
    value_of($);
    const i = pop_integer($);

    push(cadddr(p1), $);
    value_of($);
    const j = pop_integer($);

    if (!istensor(p2) || p2.ndim !== 2 || p2.dims[0] !== p2.dims[1])
        stopf("minor");

    if (i < 1 || i > p2.dims[0] || j < 0 || j > p2.dims[1])
        stopf("minor");

    push(p2, $);

    minormatrix(i, j, $);

    det($);
}

function eval_minormatrix(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);
    const p2 = pop($);

    push(caddr(p1), $);
    value_of($);
    const i = pop_integer($);

    push(cadddr(p1), $);
    value_of($);
    const j = pop_integer($);

    if (!istensor(p2) || p2.ndim !== 2)
        stopf("minormatrix: matrix expected");

    if (i < 1 || i > p2.dims[0] || j < 0 || j > p2.dims[1])
        stopf("minormatrix: index err");

    push(p2, $);

    minormatrix(i, j, $);
}

function minormatrix(row: number, col: number, $: ScriptVars): void {

    const p1 = pop($) as Tensor;

    const n = p1.dims[0];
    const m = p1.dims[1];

    if (n === 2 && m === 2) {
        if (row === 1) {
            if (col === 1)
                push(p1.elems[3], $);
            else
                push(p1.elems[2], $);
        }
        else {
            if (col === 1)
                push(p1.elems[1], $);
            else
                push(p1.elems[0], $);
        }
        return;
    }

    let p2: Tensor;

    if (n === 2) {
        p2 = alloc_vector(m - 1);
    }
    else if (m === 2) {
        p2 = alloc_vector(n - 1);
    }
    else if (n > 2 && m > 2) {
        p2 = alloc_matrix(n - 1, m - 1);
    }
    else {
        stopf("minormatrix is undefined.");
    }

    row--;
    col--;

    let k = 0;

    for (let i = 0; i < n; i++) {

        if (i === row)
            continue;

        for (let j = 0; j < m; j++) {

            if (j === col)
                continue;

            p2.elems[k++] = p1.elems[m * i + j];
        }
    }

    push(p2, $);
}

function eval_mod(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    push(caddr(p1), $);
    value_of($);
    modfunc($);
}

function modfunc($: ScriptVars): void {

    const p2 = pop($);
    const p1 = pop($);

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            push(p2, $);
            modfunc($);
            p1.elems[i] = pop($);
        }
        push(p1, $);
        return;
    }

    if (!is_num(p1) || !is_num(p2) || iszero(p2)) {
        push(MOD, $);
        push(p1, $);
        push(p2, $);
        list(3, $);
        return;
    }

    if (is_rat(p1) && is_rat(p2)) {
        mod_rationals(p1, p2, $);
        return;
    }

    const d1 = p1.toNumber();
    const d2 = p2.toNumber();

    push_double(d1 % d2, $);
}

function mod_rationals(p1: Rat, p2: Rat, $: ScriptVars): void {
    if (isinteger(p1) && isinteger(p2)) {
        mod_integers(p1, p2, $);
        return;
    }
    push(p1, $);
    push(p1, $);
    push(p2, $);
    divide($);
    absfunc($);
    floorfunc($);
    push(p2, $);
    multiply($);
    if (p1.sign === p2.sign) {
        negate($);
    }
    add($);
}

function mod_integers(p1: Rat, p2: Rat, $: ScriptVars): void {
    const a = bignum_mod(p1.a, p2.a);
    const b = bignum_int(1);
    push_bignum(p1.sign, a, b, $);
}

function eval_multiply(p1: U, $: ScriptVars): void {
    const h = $.stack.length;
    $.expanding--; // undo expanding++ in evalf
    try {
        p1 = cdr(p1);
        while (is_cons(p1)) {
            push(car(p1), $);
            value_of($);
            p1 = cdr(p1);
        }
        // console.lg(`stack: ${$.stack}`);
        multiply_factors($.stack.length - h, $);
    }
    finally {
        $.expanding++;
    }
}

function eval_noexpand(p1: U, $: ScriptVars): void {
    const t = $.expanding;
    $.expanding = 0;

    push(cadr(p1), $);
    value_of($);

    $.expanding = t;
}

export function eval_nonstop($: ScriptVars): void {
    if ($.nonstop) {
        pop($);
        push(nil, $);
        return; // not reentrant
    }

    $.nonstop = 1;
    eval_nonstop_nib($);
    $.nonstop = 0;
}

function eval_nonstop_nib($: ScriptVars): void {
    const save_tos = $.stack.length - 1;
    const save_tof = $.frame.length;

    const save_eval_level = $.eval_level;
    const save_expanding = $.expanding;

    try {
        value_of($);
    }
    catch (errmsg) {

        $.stack.splice(save_tos);
        $.frame.splice(save_tof);

        $.eval_level = save_eval_level;
        $.expanding = save_expanding;

        push(nil, $); // return value
    }
}

function eval_not(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    evalp($);
    p1 = pop($);
    if (iszero(p1))
        push_integer(1, $);
    else
        push_integer(0, $);
}
const DELTA = 1e-6;
const EPSILON = 1e-9;

function eval_nroots(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);

    p1 = cddr(p1);

    if (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
    }
    else
        push(X_LOWER, $);

    nroots($);
}

function nroots($: ScriptVars): void {
    const cr: number[] = [];
    const ci: number[] = [];
    const tr: number[] = [];
    const ti: number[] = [];

    const X = pop($);
    const P = pop($);

    const h = $.stack.length;

    coeffs(P, X, $); // put coeffs on stack

    let n = $.stack.length - h; // number of coeffs on stack

    // convert coeffs to floating point

    for (let i = 0; i < n; i++) {

        push($.stack[h + i], $);
        real($);
        floatfunc($);
        const RE = pop($);

        push($.stack[h + i], $);
        imag($);
        floatfunc($);
        const IM = pop($);

        if (!is_flt(RE) || !is_flt(IM))
            stopf("nroots: coeffs");

        cr[i] = RE.d;
        ci[i] = IM.d;
    }

    $.stack.splice(h); // pop all

    // divide p(x) by leading coeff

    const xr = cr[n - 1];
    const xi = ci[n - 1];

    const d = xr * xr + xi * xi;

    for (let i = 0; i < n - 1; i++) {
        const yr = (cr[i] * xr + ci[i] * xi) / d;
        const yi = (ci[i] * xr - cr[i] * xi) / d;
        cr[i] = yr;
        ci[i] = yi;
    }

    cr[n - 1] = 1.0;
    ci[n - 1] = 0.0;

    // find roots

    while (n > 1) {

        nfindroot(cr, ci, n, tr, ti);

        let ar = tr[0];
        let ai = ti[0];

        if (Math.abs(ar) < DELTA * Math.abs(ai))
            ar = 0;

        if (Math.abs(ai) < DELTA * Math.abs(ar))
            ai = 0;

        // push root

        push_double(ar, $);
        push_double(ai, $);
        push(imaginaryunit, $);
        multiply($);
        add($);

        // divide p(x) by x - a

        nreduce(cr, ci, n, ar, ai);

        // note: leading coeff of p(x) is still 1

        n--;
    }

    n = $.stack.length - h; // number of roots on stack

    if (n === 0) {
        push(nil, $); // no roots
        return;
    }

    if (n === 1)
        return; // one root

    sort(n, $);

    const A = alloc_vector(n);

    for (let i = 0; i < n; i++)
        A.elems[i] = $.stack[h + i];

    $.stack.splice(h); // pop all

    push(A, $);
}

function nfindroot(cr: number[], ci: number[], n: number, par: number[], pai: number[]): void {
    const tr: number[] = [];
    const ti: number[] = [];

    // if const term is zero then root is zero

    // note: use exact zero, not "close to zero"

    // term will be exactly zero from coeffs(), no need for arbitrary cutoff

    if (cr[0] === 0.0 && ci[0] === 0.0) {
        par[0] = 0.0;
        pai[0] = 0.0;
        return;
    }

    // secant method

    for (let i = 0; i < 100; i++) {

        let ar = urandom();
        let ai = urandom();

        fata(cr, ci, n, ar, ai, tr, ti);

        let far = tr[0];
        let fai = ti[0];

        let br = ar;
        let bi = ai;

        let fbr = far;
        let fbi = fai;

        ar = urandom();
        ai = urandom();

        for (let j = 0; j < 1000; j++) {

            fata(cr, ci, n, ar, ai, tr, ti);

            far = tr[0];
            fai = ti[0];

            if (zabs(far, fai) < EPSILON) {
                par[0] = ar;
                pai[0] = ai;
                return;
            }

            if (zabs(far, fai) < zabs(fbr, fbi)) {

                let xr = ar;
                let xi = ai;

                ar = br;
                ai = bi;

                br = xr;
                bi = xi;

                xr = far;
                xi = fai;

                far = fbr;
                fai = fbi;

                fbr = xr;
                fbi = xi;
            }

            // dx = b - a

            const dxr = br - ar;
            const dxi = bi - ai;

            // df = fb - fa

            const dfr = fbr - far;
            const dfi = fbi - fai;

            // y = dx / df

            const d = dfr * dfr + dfi * dfi;

            if (d === 0.0)
                break;

            const yr = (dxr * dfr + dxi * dfi) / d;
            const yi = (dxi * dfr - dxr * dfi) / d;

            // a = b - y * fb

            ar = br - (yr * fbr - yi * fbi);
            ai = bi - (yr * fbi + yi * fbr);
        }
    }

    stopf("nroots: convergence error");
}

// compute f at a

function fata(cr: number[], ci: number[], n: number, ar: number, ai: number, far: number[], fai: number[]): void {

    let yr = cr[n - 1];
    let yi = ci[n - 1];

    for (let k = n - 2; k >= 0; k--) {

        // x = a * y

        const xr = ar * yr - ai * yi;
        const xi = ar * yi + ai * yr;

        // y = x + c

        yr = xr + cr[k];
        yi = xi + ci[k];
    }

    far[0] = yr;
    fai[0] = yi;
}

// divide by x - a

function nreduce(cr: number[], ci: number[], n: number, ar: number, ai: number): void {

    // divide

    for (let k = n - 1; k > 0; k--) {
        cr[k - 1] += cr[k] * ar - ci[k] * ai;
        ci[k - 1] += ci[k] * ar + cr[k] * ai;
    }

    if (zabs(cr[0], ci[0]) > DELTA)
        stopf("nroots: residual error"); // not a root

    // shift

    for (let k = 0; k < n - 1; k++) {
        cr[k] = cr[k + 1];
        ci[k] = ci[k + 1];
    }
}

function zabs(r: number, i: number): number {
    return Math.sqrt(r * r + i * i);
}

function urandom(): number {
    return 4.0 * Math.random() - 2.0;
}

function eval_number(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    p1 = pop($);

    if (is_num(p1))
        push_integer(1, $);
    else
        push_integer(0, $);
}

function eval_numerator(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    numerator($);
}

function numerator($: ScriptVars): void {
    let p1 = pop($);

    if (is_rat(p1)) {
        push_bignum(p1.sign, p1.a, bignum_int(1), $);
        return;
    }

    while (find_divisor(p1, $)) {
        push(p1, $);
        cancel_factor($);
        p1 = pop($);
    }

    push(p1, $);
}

function eval_or(p1: U, $: ScriptVars): void {
    p1 = cdr(p1);
    while (is_cons(p1)) {
        push(car(p1), $);
        evalp($);
        const p2 = pop($);
        if (!iszero(p2)) {
            push_integer(1, $);
            return;
        }
        p1 = cdr(p1);
    }
    push_integer(0, $);
}

function eval_outer(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    p1 = cddr(p1);
    while (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
        outer($);
        p1 = cdr(p1);
    }
}

function outer($: ScriptVars): void {

    const p2 = pop($);
    const p1 = pop($);

    if (!istensor(p1) || !istensor(p2)) {
        push(p1, $);
        push(p2, $);
        multiply($);
        return;
    }

    // sync diffs

    const nrow = p1.nelem;
    const ncol = p2.nelem;

    const p3 = alloc_tensor();

    for (let i = 0; i < nrow; i++)
        for (let j = 0; j < ncol; j++) {
            push(p1.elems[i], $);
            push(p2.elems[j], $);
            multiply($);
            p3.elems[i * ncol + j] = pop($);
        }

    // dim info

    let k = 0;

    let n = p1.ndim;

    for (let i = 0; i < n; i++)
        p3.dims[k++] = p1.dims[i];

    n = p2.ndim;

    for (let i = 0; i < n; i++)
        p3.dims[k++] = p2.dims[i];

    push(p3, $);
}

function eval_polar(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    polar($);
}

function polar($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, polar, $), $);
        return;
    }

    push(p1, $);
    mag($);
    push(imaginaryunit, $);
    push(p1, $);
    arg($);
    const p2 = pop($);
    if (is_flt(p2)) {
        push_double(p2.d / Math.PI, $);
        push(Pi, $);
        multiply_factors(3, $);
    }
    else {
        push(p2, $);
        multiply_factors(2, $);
    }
    expfunc($);
    multiply($);
}

function eval_power(expr: U, $: ScriptVars) {
    const powerExpr = assert_cons(expr);
    $.expanding--;
    try {
        push(powerExpr.base, $);
        push(powerExpr.expo, $);
        value_of($);
        dupl($);
        const expo = pop($);

        // if exponent is negative then evaluate base without expanding,
        // otherwise, evaluate the base normally.
        swap($);
        if (is_num(expo) && isnegativenumber(expo)) {
            const t = $.expanding;
            $.expanding = 0;
            try {
                value_of($);
            }
            finally {
                $.expanding = t;
            }
        }
        else {
            value_of($);
        }
        swap($);

        power($);
    }
    finally {
        $.expanding++;
    }
}

/**
 * Expects top elements of stack to be...
 * 
 * --------
 * | expo |
 * --------
 * | base |
 * --------
 * 
 * Both expressions have been evaluated.
 */
function power($: ScriptVars): void {

    const expo = pop($);
    let base = pop($);

    if (is_tensor(base) && istensor(expo)) {
        push(POWER, $);
        push(base, $);
        push(expo, $);
        list(3, $);
        return;
    }

    if (is_tensor(expo)) {
        const T = copy_tensor(expo);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(base, $);
            push(T.elems[i], $);
            power($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (is_tensor(base)) {
        const T = copy_tensor(base);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            push(expo, $);
            power($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (base.equals(DOLLAR_E) && is_flt(expo)) {
        push_double(Math.E, $);
        base = pop($);
    }

    if (base.equals(Pi) && is_flt(expo)) {
        push_double(Math.PI, $);
        base = pop($);
    }

    if (is_num(base) && is_num(expo)) {
        power_numbers(base, expo, $);
        return;
    }

    // expr^0

    if (iszero(expo)) {
        push_integer(1, $);
        return;
    }

    // 0^expr

    if (iszero(base)) {
        push(POWER, $);
        push(base, $);
        push(expo, $);
        list(3, $);
        return;
    }

    // 1^expr

    if (isplusone(base)) {
        push_integer(1, $);
        return;
    }

    // expr^1

    if (isplusone(expo)) {
        push(base, $);
        return;
    }

    // BASE is an integer?

    if (is_rat(base) && isinteger(base)) {
        // raise each factor in BASE to power EXPO
        // EXPO is not numerical, that case was handled by power_numbers() above
        const h = $.stack.length;
        push(base, $);
        factor_factor($);
        const n = $.stack.length - h;
        for (let i = 0; i < n; i++) {
            const p1 = $.stack[h + i];
            if (car(p1).equals(POWER)) {
                push(POWER, $);
                push(cadr(p1), $); // base
                push(caddr(p1), $); // expo
                push(expo, $);
                multiply($);
                list(3, $);
            }
            else {
                push(POWER, $);
                push(p1, $);
                push(expo, $);
                list(3, $);
            }
            $.stack[h + i] = pop($);
        }
        if (n > 1) {
            sort_factors(h, $);
            list(n, $);
            push(MULTIPLY, $);
            swap($);
            cons($); // prepend MULTIPLY to list
        }
        return;
    }

    // BASE is a numerical fraction?

    if (is_rat(base) && isfraction(base)) {
        // power numerator, power denominator
        // EXPO is not numerical, that case was handled by power_numbers() above
        push(base, $);
        numerator($);
        push(expo, $);
        power($);
        push(base, $);
        denominator($);
        push(expo, $);
        negate($);
        power($);
        multiply($);
        return;
    }

    // BASE = e ?

    if (base.equals(DOLLAR_E)) {
        power_natural_number(expo, $);
        return;
    }

    // (a + b) ^ c

    if (car(base).equals(ADD)) {
        power_sum(base, expo, $);
        return;
    }

    // (a1 * a2 * a3) ^ c  -->  (a1 ^ c) * (a2 ^ c) * (a3 ^ c)

    if (car(base).equals(MULTIPLY)) {
        const h = $.stack.length;
        let argList = cdr(base);
        while (is_cons(argList)) {
            push(car(argList), $);
            push(expo, $);
            power($);
            argList = cdr(argList);
        }
        multiply_factors($.stack.length - h, $);
        return;
    }

    // (a ^ b) ^ c  -->  a ^ (b * c)

    if (car(base).equals(POWER)) {
        push(cadr(base), $);
        push(caddr(base), $);
        push(expo, $);
        multiply_expand($); // always expand products of exponents
        power($);
        return;
    }

    // none of the above

    push(POWER, $);
    push(base, $);
    push(expo, $);
    list(3, $);
}

function eval_prefixform(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    p1 = pop($);
    const outbuf: string[] = [];
    prefixform(p1, outbuf);
    const s = outbuf.join('');
    push_string(s, $);
}

function eval_product(p1: U, $: ScriptVars): void {

    if (lengthf(p1) === 2) {
        push(cadr(p1), $);
        value_of($);
        p1 = pop($);
        if (!istensor(p1)) {
            push(p1, $);
            return;
        }
        const n = p1.nelem;
        for (let i = 0; i < n; i++)
            push(p1.elems[i], $);
        multiply_factors(n, $);
        return;
    }

    const p2 = cadr(p1);
    if (!(is_sym(p2) && $.hasUserFunction(p2)))
        stopf("product: symbol error");

    push(caddr(p1), $);
    value_of($);
    let j = pop_integer($);

    push(cadddr(p1), $);
    value_of($);
    const k = pop_integer($);

    p1 = caddddr(p1);

    save_symbol(p2, $);

    const h = $.stack.length;

    for (; ;) {
        push_integer(j, $);
        const p3 = pop($);
        set_symbol(p2, p3, nil, $);
        push(p1, $);
        value_of($);
        if (j === k)
            break;
        if (j < k)
            j++;
        else
            j--;
    }

    multiply_factors($.stack.length - h, $);

    restore_symbol($);
}

function eval_quote(p1: U, $: ScriptVars): void {
    push(cadr(p1), $); // not evaluated
}

function eval_rank(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    p1 = pop($);
    if (is_tensor(p1))
        push_integer(p1.ndim, $);
    else
        push_integer(0, $);
}

function eval_rationalize(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    rationalize($);
}

function rationalize($: ScriptVars): void {

    let p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, rationalize, $), $);
        return;
    }

    let p2: U = one;

    while (find_divisor(p1, $)) {
        const p0 = pop($);
        push(p0, $);
        push(p1, $);
        cancel_factor($);
        p1 = pop($);
        push(p0, $);
        push(p2, $);
        multiply_noexpand($);
        p2 = pop($);
    }

    push(p1, $);
    push(p2, $);
    reciprocate($);
    multiply_noexpand($);
}

function eval_real(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    real($);
}

function real($: ScriptVars): void {

    let p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, real, $), $);
        return;
    }

    push(p1, $);
    rect($);
    p1 = pop($);
    push(p1, $);
    push(p1, $);
    conjfunc($);
    add($);
    push_rational(1, 2, $);
    multiply($);
}

function eval_rect(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    rect($);
}

function rect($: ScriptVars): void {

    let p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, rect, $), $);
        return;
    }

    if (car(p1).equals(ADD)) {
        p1 = cdr(p1);
        const h = $.stack.length;
        while (is_cons(p1)) {
            push(car(p1), $);
            rect($);
            p1 = cdr(p1);
        }
        add_terms($.stack.length - h, $);
        return;
    }

    if (car(p1).equals(MULTIPLY)) {
        p1 = cdr(p1);
        const h = $.stack.length;
        while (is_cons(p1)) {
            push(car(p1), $);
            rect($);
            p1 = cdr(p1);
        }
        multiply_factors($.stack.length - h, $);
        return;
    }

    if (!car(p1).equals(POWER)) {
        push(p1, $);
        return;
    }

    const BASE = cadr(p1);
    const EXPO = caddr(p1);

    // handle sum in exponent

    if (car(EXPO).equals(ADD)) {
        p1 = cdr(EXPO);
        const h = $.stack.length;
        while (is_cons(p1)) {
            push(POWER, $);
            push(BASE, $);
            push(car(p1), $);
            list(3, $);
            rect($);
            p1 = cdr(p1);
        }
        multiply_factors($.stack.length - h, $);
        return;
    }

    // return mag(p1) * cos(arg(p1)) + i sin(arg(p1)))

    push(p1, $);
    mag($);

    push(p1, $);
    arg($);
    const p2 = pop($);

    push(p2, $);
    cosfunc($);

    push(imaginaryunit, $);
    push(p2, $);
    sinfunc($);
    multiply($);

    add($);

    multiply($);
}

function eval_roots(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);

    p1 = cddr(p1);

    if (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
    }
    else
        push(X_LOWER, $);

    roots($);
}

function roots($: ScriptVars): void {

    const X = pop($);
    const P = pop($);

    const h = $.stack.length;

    coeffs(P, X, $); // put coeffs on stack

    const k = $.stack.length;

    let n = k - h; // number of coeffs on stack

    // check coeffs

    for (let i = 0; i < n; i++)
        if (!is_rat($.stack[h + i]))
            stopf("roots: coeffs");

    // find roots

    while (n > 1) {

        if (findroot(h, n, $) === 0)
            break; // no root found

        // A is the root

        const A = $.stack[$.stack.length - 1];

        // divide p(x) by X - A

        reduce(h, n, A, $);

        n--;
    }

    n = $.stack.length - k; // number of roots on stack

    if (n === 0) {
        $.stack.length = h; // pop all
        push(nil, $); // no roots
        return;
    }

    sort(n, $); // sort roots

    // eliminate repeated roots

    for (let i = 0; i < n - 1; i++)
        if (equal($.stack[k + i], $.stack[k + i + 1])) {
            for (let j = i + 1; j < n - 1; j++)
                $.stack[k + j] = $.stack[k + j + 1];
            i--;
            n--;
        }

    if (n === 1) {
        const A = $.stack[k];
        $.stack.length = h; // pop all
        push(A, $); // one root
        return;
    }

    const A = alloc_vector(n);

    for (let i = 0; i < n; i++)
        A.elems[i] = $.stack[k + i];

    $.stack.length = h; // pop all

    push(A, $);
}

function findroot(h: number, n: number, $: ScriptVars): 1 | 0 {

    // check constant term

    if (iszero($.stack[h])) {
        push_integer(0, $); // root is zero
        return 1;
    }

    // eliminate denominators

    for (let i = 0; i < n; i++) {
        let C = $.stack[h + i];
        if (is_rat(C) && isinteger(C))
            continue;
        push(C, $);
        denominator($);
        C = pop($);
        for (let j = 0; j < n; j++) {
            push($.stack[h + j], $);
            push(C, $);
            multiply($);
            $.stack[h + j] = pop($);
        }
    }

    const p = $.stack.length;

    push($.stack[h], $);
    let m = pop_integer($);
    divisors(m, $); // divisors of constant term

    const q = $.stack.length;

    push($.stack[h + n - 1], $);
    m = pop_integer($);
    divisors(m, $); // divisors of leading coeff

    const r = $.stack.length;

    for (let i = p; i < q; i++) {
        for (let j = q; j < r; j++) {

            // try positive A

            push($.stack[i], $);
            push($.stack[j], $);
            divide($);
            let A = pop($);

            horner(h, n, A, $);

            let PA = pop($); // polynomial evaluated at A

            if (iszero(PA)) {
                $.stack.length = p; // pop all
                push(A, $);
                return 1; // root on stack
            }

            // try negative A

            push(A, $);
            negate($);
            A = pop($);

            horner(h, n, A, $);

            PA = pop($); // polynomial evaluated at A

            if (iszero(PA)) {
                $.stack.length = p; // pop all
                push(A, $);
                return 1; // root on stack
            }
        }
    }

    $.stack.length = p; // pop all

    return 0; // no root
}

// evaluate p(x) at x = A using horner's rule

function horner(h: number, n: number, A: U, $: ScriptVars): void {

    push($.stack[h + n - 1], $);

    for (let i = n - 2; i >= 0; i--) {
        push(A, $);
        multiply($);
        push($.stack[h + i], $);
        add($);
    }
}

// push all divisors of n

function divisors(n: number, $: ScriptVars): void {

    const h = $.stack.length;

    factor_int(n, $);

    const k = $.stack.length;

    // contruct divisors by recursive descent

    push_integer(1, $);

    divisors_nib(h, k, $);

    // move

    n = $.stack.length - k;

    for (let i = 0; i < n; i++)
        $.stack[h + i] = $.stack[k + i];

    $.stack.length = h + n; // pop all
}

//	Generate all divisors for a factored number
//
//	Input:		Factor pairs on stack (base, expo)
//
//			h	first pair
//
//			k	just past last pair
//
//	Output:		Divisors on stack
//
//	For example, the number 12 (= 2^2 3^1) has 6 divisors:
//
//	1, 2, 3, 4, 6, 12

function divisors_nib(h: number, k: number, $: ScriptVars): void {

    if (h === k)
        return;

    const ACCUM = pop($);

    const BASE = $.stack[h + 0];
    const EXPO = $.stack[h + 1];

    push(EXPO, $);
    const n = pop_integer($);

    for (let i = 0; i <= n; i++) {
        push(ACCUM, $);
        push(BASE, $);
        push_integer(i, $);
        power($);
        multiply($);
        divisors_nib(h + 2, k, $);
    }
}

// divide by X - A

function reduce(h: number, n: number, A: U, $: ScriptVars): void {

    for (let i = n - 1; i > 0; i--) {
        push(A, $);
        push($.stack[h + i], $);
        multiply($);
        push($.stack[h + i - 1], $);
        add($);
        $.stack[h + i - 1] = pop($);
    }

    if (!iszero($.stack[h]))
        stopf("roots: residual error"); // not a root

    // move

    for (let i = 0; i < n - 1; i++)
        $.stack[h + i] = $.stack[h + i + 1];
}

function eval_rotate(p1: Cons, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);
    const PSI = pop($);

    if (!istensor(PSI) || PSI.ndim > 1 || PSI.nelem > 32768 || (PSI.nelem & (PSI.nelem - 1)) !== 0)
        stopf("rotate error 1 first argument is not a vector or dimension error");

    let c = 0;

    p1 = cddr(p1);

    while (is_cons(p1)) {

        if (!is_cons(cdr(p1)))
            stopf("rotate error 2 unexpected end of argument list");

        const OPCODE = car(p1);
        push(cadr(p1), $);
        value_of($);
        let n = pop_integer($);

        if (n > 14 || (1 << n) >= PSI.nelem)
            stopf("rotate error 3 qubit number format or range");

        p1 = cddr(p1);

        if (OPCODE.equals(create_sym("C"))) {
            c |= 1 << n;
            continue;
        }

        if (OPCODE.equals(create_sym("H"))) {
            rotate_h(PSI, c, n, $);
            c = 0;
            continue;
        }

        if (OPCODE.equals(create_sym("P"))) {
            if (!is_cons(p1))
                stopf("rotate error 2 unexpected end of argument list");
            push(car(p1), $);
            p1 = cdr(p1);
            value_of($);
            push(imaginaryunit, $);
            multiply($);
            expfunc($);
            const PHASE = pop($);
            rotate_p(PSI, PHASE, c, n, $);
            c = 0;
            continue;
        }

        if (OPCODE.equals(create_sym("Q"))) {
            rotate_q(PSI, n, $);
            c = 0;
            continue;
        }

        if (OPCODE.equals(create_sym("V"))) {
            rotate_v(PSI, n, $);
            c = 0;
            continue;
        }

        if (OPCODE.equals(create_sym("W"))) {
            const m = n;
            if (!is_cons(p1))
                stopf("rotate error 2 unexpected end of argument list");
            push(car(p1), $);
            p1 = cdr(p1);
            value_of($);
            n = pop_integer($);
            if (n > 14 || (1 << n) >= PSI.nelem)
                stopf("rotate error 3 qubit number format or range");
            rotate_w(PSI, c, m, n, $);
            c = 0;
            continue;
        }

        if (OPCODE.equals(create_sym("X"))) {
            rotate_x(PSI, c, n, $);
            c = 0;
            continue;
        }

        if (OPCODE.equals(create_sym("Y"))) {
            rotate_y(PSI, c, n, $);
            c = 0;
            continue;
        }

        if (OPCODE.equals(create_sym("Z"))) {
            rotate_z(PSI, c, n, $);
            c = 0;
            continue;
        }

        stopf("rotate error 4 unknown rotation code");
    }

    push(PSI, $);
}

// hadamard

function rotate_h(PSI: Tensor, c: number, n: number, $: ScriptVars): void {
    n = 1 << n;
    for (let i = 0; i < PSI.nelem; i++) {
        if ((i & c) !== c)
            continue;
        if (i & n) {
            push(PSI.elems[i ^ n], $);		// KET0
            push(PSI.elems[i], $);		// KET1
            add($);
            push_rational(1, 2, $);
            sqrtfunc($);
            multiply($);
            push(PSI.elems[i ^ n], $);		// KET0
            push(PSI.elems[i], $);		// KET1
            subtract($);
            push_rational(1, 2, $);
            sqrtfunc($);
            multiply($);
            PSI.elems[i] = pop($);		// KET1
            PSI.elems[i ^ n] = pop($);	// KET0
        }
    }
}

// phase

function rotate_p(PSI: Tensor, PHASE: U, c: number, n: number, $: ScriptVars): void {
    n = 1 << n;
    for (let i = 0; i < PSI.nelem; i++) {
        if ((i & c) !== c)
            continue;
        if (i & n) {
            push(PSI.elems[i], $);		// KET1
            push(PHASE, $);
            multiply($);
            PSI.elems[i] = pop($);		// KET1
        }
    }
}

// swap

function rotate_w(PSI: Tensor, c: number, m: number, n: number, $: ScriptVars): void {
    m = 1 << m;
    n = 1 << n;
    for (let i = 0; i < PSI.nelem; i++) {
        if ((i & c) !== c)
            continue;
        if ((i & m) && !(i & n)) {
            push(PSI.elems[i], $);
            push(PSI.elems[i ^ m ^ n], $);
            PSI.elems[i] = pop($);
            PSI.elems[i ^ m ^ n] = pop($);
        }
    }
}

function rotate_x(PSI: Tensor, c: number, n: number, $: ScriptVars): void {
    n = 1 << n;
    for (let i = 0; i < PSI.nelem; i++) {
        if ((i & c) !== c)
            continue;
        if (i & n) {
            push(PSI.elems[i ^ n], $);		// KET0
            push(PSI.elems[i], $);		// KET1
            PSI.elems[i ^ n] = pop($);	// KET0
            PSI.elems[i] = pop($);		// KET1
        }
    }
}

function rotate_y(PSI: Tensor, c: number, n: number, $: ScriptVars): void {
    n = 1 << n;
    for (let i = 0; i < PSI.nelem; i++) {
        if ((i & c) !== c)
            continue;
        if (i & n) {
            push(imaginaryunit, $);
            negate($);
            push(PSI.elems[i ^ n], $);		// KET0
            multiply($);
            push(imaginaryunit, $);
            push(PSI.elems[i], $);		// KET1
            multiply($);
            PSI.elems[i ^ n] = pop($);	// KET0
            PSI.elems[i] = pop($);		// KET1
        }
    }
}

function rotate_z(PSI: Tensor, c: number, n: number, $: ScriptVars): void {
    n = 1 << n;
    for (let i = 0; i < PSI.nelem; i++) {
        if ((i & c) !== c)
            continue;
        if (i & n) {
            push(PSI.elems[i], $);		// KET1
            negate($);
            PSI.elems[i] = pop($);		// KET1
        }
    }
}

// quantum fourier transform

function rotate_q(PSI: Tensor, n: number, $: ScriptVars): void {
    for (let i = n; i >= 0; i--) {
        rotate_h(PSI, 0, i, $);
        for (let j = 0; j < i; j++) {
            push_rational(1, 2, $);
            push_integer(i - j, $);
            power($);
            push(imaginaryunit, $);
            push(Pi, $);
            value_of($);
            multiply_factors(3, $);
            expfunc($);
            const PHASE = pop($);
            rotate_p(PSI, PHASE, 1 << j, i, $);
        }
    }
    for (let i = 0; i < (n + 1) / 2; i++)
        rotate_w(PSI, 0, i, n - i, $);
}

// inverse qft

function rotate_v(PSI: Tensor, n: number, $: ScriptVars): void {
    for (let i = 0; i < (n + 1) / 2; i++)
        rotate_w(PSI, 0, i, n - i, $);
    for (let i = 0; i <= n; i++) {
        for (let j = i - 1; j >= 0; j--) {
            push_rational(1, 2, $);
            push_integer(i - j, $);
            power($);
            push(imaginaryunit, $);
            push(Pi, $);
            value_of($);
            multiply_factors(3, $);
            negate($);
            expfunc($);
            const PHASE = pop($);
            rotate_p(PSI, PHASE, 1 << j, i, $);
        }
        rotate_h(PSI, 0, i, $);
    }
}

function eval_assign(x: Cons, $: ScriptVars): void {

    push(nil, $); // return value

    if (caadr(x).equals(INDEX)) {
        setq_indexed(x, $);
        return;
    }

    if (is_cons(cadr(x))) {
        setq_usrfunc(x, $);
        return;
    }

    const sym = x.lhs;
    if (is_sym(sym) && $.hasUserFunction(sym)) {
        push(x.rhs, $);
        value_of($);
        const rhs = pop($);

        set_symbol(sym, rhs, nil, $);
    }
    else {
        stopf(`user symbol expected sym=${sym}`);
    }
}

// Example: a[1] = b
//
// p1----->cons--->cons------------------->cons
//         |       |                       |
//         setq    cons--->cons--->cons    b
//                 |       |       |
//                 index   a       1
//
// caadr(p1) = index
// cadadr(p1) = a
// caddr(p1) = b

function setq_indexed(p1: U, $: ScriptVars): void {

    const S = cadadr(p1);

    if (!(is_sym(S) && $.hasUserFunction(S))) {
        stopf(`user symbol expected S=${S}`);
    }

    push(S, $);
    value_of($);

    push(caddr(p1), $);
    value_of($);

    const RVAL = pop($);
    const LVAL = pop($);

    const h = $.stack.length;

    p1 = cddadr(p1);

    while (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
        p1 = cdr(p1);
    }

    set_component(LVAL, RVAL, h, $);

    set_symbol(S, LVAL, nil, $);
}

function set_component(LVAL: U, RVAL: U, h: number, $: ScriptVars): void {

    if (!istensor(LVAL))
        stopf("index error");

    // n is number of indices

    const n = $.stack.length - h;

    if (n < 1 || n > LVAL.ndim)
        stopf("index error");

    // k is combined index

    let k = 0;

    for (let i = 0; i < n; i++) {
        push($.stack[h + i], $);
        const t = pop_integer($);
        if (t < 1 || t > LVAL.dims[i])
            stopf("index error");
        k = k * LVAL.dims[i] + t - 1;
    }

    $.stack.splice(h); // pop all indices

    if (is_tensor(RVAL)) {
        let m = RVAL.ndim;
        if (n + m !== LVAL.ndim)
            stopf("index error");
        for (let i = 0; i < m; i++)
            if (LVAL.dims[n + i] !== RVAL.dims[i])
                stopf("index error");
        m = RVAL.nelem;
        for (let i = 0; i < m; i++)
            LVAL.elems[m * k + i] = RVAL.elems[i];
    }
    else {
        if (n !== LVAL.ndim)
            stopf("index error");
        LVAL.elems[k] = RVAL;
    }
}

// Example:
//
//      f(x,y)=x^y
//
// For this definition, p1 points to the following structure.
//
//     p1
//      |
//   ___v__    ______                        ______
//  |CONS  |->|CONS  |--------------------->|CONS  |
//  |______|  |______|                      |______|
//      |         |                             |
//   ___v__    ___v__    ______    ______    ___v__    ______    ______
//  |SETQ  |  |CONS  |->|CONS  |->|CONS  |  |CONS  |->|CONS  |->|CONS  |
//  |______|  |______|  |______|  |______|  |______|  |______|  |______|
//                |         |         |         |         |         |
//             ___v__    ___v__    ___v__    ___v__    ___v__    ___v__
//            |SYM f |  |SYM x |  |SYM y |  |POWER |  |SYM x |  |SYM y |
//            |______|  |______|  |______|  |______|  |______|  |______|
//
// We have
//
//	caadr(p1) points to f
//	cdadr(p1) points to the list (x y)
//	caddr(p1) points to (power x y)

function setq_usrfunc(p1: U, $: ScriptVars): void {

    const F = caadr(p1); // function name
    const A = cdadr(p1); // function args
    const B = caddr(p1); // function body

    if (is_sym(F) && $.hasUserFunction(F)) {
        if (lengthf(A) > 9) {
            stopf("more than 9 arguments");
        }

        push(B, $);
        convert_body(A, $);
        const C = pop($);

        set_symbol(F, B, C, $);
    }
    else {
        if (is_sym(F)) {
            stopf(`user symbol expected F=${F}`);
        }
        else {
            stopf(`symbol expected F=${F}`);
        }
    }

}

function convert_body(A: U, $: ScriptVars): void {
    if (!is_cons(A))
        return;

    push(car(A), $);
    push(ARG1, $);
    subst($);

    A = cdr(A);
    if (!is_cons(A))
        return;

    push(car(A), $);
    push(ARG2, $);
    subst($);

    A = cdr(A);
    if (!is_cons(A))
        return;

    push(car(A), $);
    push(ARG3, $);
    subst($);

    A = cdr(A);
    if (!is_cons(A))
        return;

    push(car(A), $);
    push(ARG4, $);
    subst($);

    A = cdr(A);
    if (!is_cons(A))
        return;

    push(car(A), $);
    push(ARG5, $);
    subst($);

    A = cdr(A);

    if (!is_cons(A))
        return;

    push(car(A), $);
    push(ARG6, $);
    subst($);

    A = cdr(A);
    if (!is_cons(A))
        return;

    push(car(A), $);
    push(ARG7, $);
    subst($);

    A = cdr(A);
    if (!is_cons(A))
        return;

    push(car(A), $);
    push(ARG8, $);
    subst($);

    A = cdr(A);
    if (!is_cons(A))
        return;

    push(car(A), $);
    push(ARG9, $);
    subst($);
}

function eval_sgn(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    sgn($);
}

function sgn($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, sgn, $), $);
        return;
    }

    if (!is_num(p1)) {
        push(SGN, $);
        push(p1, $);
        list(2, $);
        return;
    }

    if (iszero(p1)) {
        push_integer(0, $);
        return;
    }

    if (isnegativenumber(p1))
        push_integer(-1, $);
    else
        push_integer(1, $);
}

function eval_simplify(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    simplify($);
}

function simplify($: ScriptVars): void {
    const p1 = pop($);
    if (is_tensor(p1))
        simplify_tensor(p1, $);
    else
        simplify_scalar(p1, $);
}

function simplify_tensor(p1: Tensor, $: ScriptVars): void {
    p1 = copy_tensor(p1);
    push(p1, $);
    const n = p1.nelem;
    for (let i = 0; i < n; i++) {
        push(p1.elems[i], $);
        simplify($);
        p1.elems[i] = pop($);
    }
}

function simplify_scalar(p1: U, $: ScriptVars): void {

    // already simple?

    if (!is_cons(p1)) {
        push(p1, $);
        return;
    }

    const h = $.stack.length;
    push(car(p1), $);
    p1 = cdr(p1);

    while (is_cons(p1)) {
        push(car(p1), $);
        simplify($);
        p1 = cdr(p1);
    }

    list($.stack.length - h, $);
    value_of($);

    simplify_pass1($);
    simplify_pass2($); // try exponential form
    simplify_pass3($); // try polar form
}

function simplify_pass1($: ScriptVars): void {

    let p1 = pop($);

    // already simple?

    if (!is_cons(p1)) {
        push(p1, $);
        return;
    }

    let T: U;

    if (car(p1).equals(ADD)) {
        push(p1, $);
        rationalize($);
        T = pop($);
        if (car(T).equals(ADD)) {
            push(p1, $); // no change
            return;
        }
    }
    else
        T = p1;

    push(T, $);
    numerator($);
    let NUM = pop($);

    push(T, $);
    denominator($);
    value_of($); // to expand denominator
    let DEN = pop($);

    // if DEN is a sum then rationalize it

    if (car(DEN).equals(ADD)) {
        push(DEN, $);
        rationalize($);
        T = pop($);
        if (!car(T).equals(ADD)) {
            // update NUM
            push(T, $);
            denominator($);
            value_of($); // to expand denominator
            push(NUM, $);
            multiply($);
            NUM = pop($);
            // update DEN
            push(T, $);
            numerator($);
            DEN = pop($);
        }
    }

    // are NUM and DEN congruent sums?

    if (!car(NUM).equals(ADD) || !car(DEN).equals(ADD) || lengthf(NUM) !== lengthf(DEN)) {
        // no, but NUM over DEN might be simpler than p1
        push(NUM, $);
        push(DEN, $);
        divide($);
        T = pop($);
        if (complexity(T) < complexity(p1))
            p1 = T;
        push(p1, $);
        return;
    }

    push(cadr(NUM), $); // push first term of numerator
    push(cadr(DEN), $); // push first term of denominator
    divide($);

    const R = pop($); // provisional ratio

    push(R, $);
    push(DEN, $);
    multiply($);

    push(NUM, $);
    subtract($);

    T = pop($);

    if (iszero(T))
        p1 = R;

    push(p1, $);
}

// try exponential form

function simplify_pass2($: ScriptVars): void {

    const p1 = pop($);

    // already simple?

    if (!is_cons(p1)) {
        push(p1, $);
        return;
    }

    push(p1, $);
    circexp($);
    rationalize($);
    value_of($); // to normalize
    const p2 = pop($);

    if (complexity(p2) < complexity(p1)) {
        push(p2, $);
        return;
    }

    push(p1, $);
}

// try polar form

function simplify_pass3($: ScriptVars): void {

    const p1 = pop($);

    if (!car(p1).equals(ADD) || isusersymbolsomewhere(p1, $) || !findf(p1, imaginaryunit, $)) {
        push(p1, $);
        return;
    }

    push(p1, $);
    polar($);
    const p2 = pop($);

    if (!is_cons(p2)) {
        push(p2, $);
        return;
    }

    push(p1, $);
}

function eval_sin(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    sinfunc($);
}

function sinfunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, sinfunc, $), $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = Math.sin(d);
        push_double(d, $);
        return;
    }

    // sin(z) = -i/2 exp(i z) + i/2 exp(-i z)

    if (isdoublez(p1)) {
        push_double(-0.5, $);
        push(imaginaryunit, $);
        multiply($);
        push(imaginaryunit, $);
        push(p1, $);
        multiply($);
        expfunc($);
        push(imaginaryunit, $);
        negate($);
        push(p1, $);
        multiply($);
        expfunc($);
        subtract($);
        multiply($);
        return;
    }

    // sin(-x) = -sin(x)

    if (isnegativeterm(p1)) {
        push(p1, $);
        negate($);
        sinfunc($);
        negate($);
        return;
    }

    if (car(p1).equals(ADD)) {
        sinfunc_sum(p1, $);
        return;
    }

    // sin(arctan(y,x)) = y (x^2 + y^2)^(-1/2)

    if (car(p1).equals(ARCTAN)) {
        const X = caddr(p1);
        const Y = cadr(p1);
        push(Y, $);
        push(X, $);
        push(X, $);
        multiply($);
        push(Y, $);
        push(Y, $);
        multiply($);
        add($);
        push_rational(-1, 2, $);
        power($);
        multiply($);
        return;
    }

    // sin(arccos(x)) = sqrt(1 - x^2)

    if (car(p1).equals(ARCCOS)) {
        push_integer(1, $);
        push(cadr(p1), $);
        push_integer(2, $);
        power($);
        subtract($);
        push_rational(1, 2, $);
        power($);
        return;
    }

    // n Pi ?

    push(p1, $);
    push(Pi, $);
    divide($);
    let p2 = pop($);

    if (!is_num(p2)) {
        push(SIN, $);
        push(p1, $);
        list(2, $);
        return;
    }

    if (is_flt(p2)) {
        let d = p2.toNumber();
        d = Math.sin(d * Math.PI);
        push_double(d, $);
        return;
    }

    push(p2, $); // nonnegative by sin(-x) = -sin(x) above
    push_integer(180, $);
    multiply($);
    p2 = pop($);

    if (!(is_rat(p2) && isinteger(p2))) {
        push(SIN, $);
        push(p1, $);
        list(2, $);
        return;
    }

    push(p2, $);
    push_integer(360, $);
    modfunc($);
    const n = pop_integer($);

    switch (n) {
        case 0:
        case 180:
            push_integer(0, $);
            break;
        case 30:
        case 150:
            push_rational(1, 2, $);
            break;
        case 210:
        case 330:
            push_rational(-1, 2, $);
            break;
        case 45:
        case 135:
            push_rational(1, 2, $);
            push_integer(2, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 225:
        case 315:
            push_rational(-1, 2, $);
            push_integer(2, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 60:
        case 120:
            push_rational(1, 2, $);
            push_integer(3, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 240:
        case 300:
            push_rational(-1, 2, $);
            push_integer(3, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 90:
            push_integer(1, $);
            break;
        case 270:
            push_integer(-1, $);
            break;
        default:
            push(SIN, $);
            push(p1, $);
            list(2, $);
            break;
    }
}

// sin(x + n/2 Pi) = sin(x) cos(n/2 Pi) + cos(x) sin(n/2 Pi)

function sinfunc_sum(p1: U, $: ScriptVars): void {
    let p2 = cdr(p1);
    while (is_cons(p2)) {
        push_integer(2, $);
        push(car(p2), $);
        multiply($);
        push(Pi, $);
        divide($);
        let p3 = pop($);
        if (is_rat(p3) && isinteger(p3)) {
            push(p1, $);
            push(car(p2), $);
            subtract($);
            p3 = pop($);
            push(p3, $);
            sinfunc($);
            push(car(p2), $);
            cosfunc($);
            multiply($);
            push(p3, $);
            cosfunc($);
            push(car(p2), $);
            sinfunc($);
            multiply($);
            add($);
            return;
        }
        p2 = cdr(p2);
    }
    push(SIN, $);
    push(p1, $);
    list(2, $);
}

function eval_sinh(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    sinhfunc($);
}

function sinhfunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, sinhfunc, $), $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = Math.sinh(d);
        push_double(d, $);
        return;
    }

    // sinh(z) = 1/2 exp(z) - 1/2 exp(-z)

    if (isdoublez(p1)) {
        push_rational(1, 2, $);
        push(p1, $);
        expfunc($);
        push(p1, $);
        negate($);
        expfunc($);
        subtract($);
        multiply($);
        return;
    }

    if (iszero(p1)) {
        push_integer(0, $);
        return;
    }

    // sinh(-x) -> -sinh(x)

    if (isnegativeterm(p1)) {
        push(p1, $);
        negate($);
        sinhfunc($);
        negate($);
        return;
    }

    if (car(p1).equals(ARCSINH)) {
        push(cadr(p1), $);
        return;
    }

    push(SINH, $);
    push(p1, $);
    list(2, $);
}

function eval_sqrt(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    sqrtfunc($);
}

function sqrtfunc($: ScriptVars): void {
    push_rational(1, 2, $);
    power($);
}

function eval_status(expr: U, $: ScriptVars): void {
    push(nil, $);
}

function eval_stop(): never {
    stopf("stop");
}

function eval_subst(p1: U, $: ScriptVars): void {
    push(cadddr(p1), $);
    value_of($);
    push(caddr(p1), $);
    value_of($);
    push(cadr(p1), $);
    value_of($);
    subst($);
    value_of($); // normalize
}

function subst($: ScriptVars): void {

    const p3 = pop($); // new expr
    const p2 = pop($); // old expr

    if (p2.isnil || p3.isnil)
        return;

    let p1 = pop($); // expr

    if (is_tensor(p1)) {
        const T = copy_tensor(p1);
        const n = T.nelem;
        for (let i = 0; i < n; i++) {
            push(T.elems[i], $);
            push(p2, $);
            push(p3, $);
            subst($);
            T.elems[i] = pop($);
        }
        push(T, $);
        return;
    }

    if (equal(p1, p2)) {
        push(p3, $);
        return;
    }

    if (is_cons(p1)) {
        const h = $.stack.length;
        while (is_cons(p1)) {
            push(car(p1), $);
            push(p2, $);
            push(p3, $);
            subst($);
            p1 = cdr(p1);
        }
        list($.stack.length - h, $);
        return;
    }

    push(p1, $);
}

function eval_sum(p1: U, $: ScriptVars): void {

    if (lengthf(p1) === 2) {
        push(cadr(p1), $);
        value_of($);
        p1 = pop($);
        if (!istensor(p1)) {
            push(p1, $);
            return;
        }
        const n = p1.nelem;
        for (let i = 0; i < n; i++)
            push(p1.elems[i], $);
        add_terms(n, $);
        return;
    }

    const p2 = cadr(p1);
    if (!(is_sym(p2) && $.hasUserFunction(p2)))
        stopf("sum: symbol error");

    push(caddr(p1), $);
    value_of($);
    let j = pop_integer($);

    push(cadddr(p1), $);
    value_of($);
    const k = pop_integer($);

    p1 = caddddr(p1);

    save_symbol(p2, $);

    const h = $.stack.length;

    for (; ;) {
        push_integer(j, $);
        const p3 = pop($);
        set_symbol(p2, p3, nil, $);
        push(p1, $);
        value_of($);
        if (j === k)
            break;
        if (j < k)
            j++;
        else
            j--;
    }

    add_terms($.stack.length - h, $);

    restore_symbol($);
}

function eval_tan(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    tanfunc($);
}

function tanfunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, tanfunc, $), $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = Math.tan(d);
        push_double(d, $);
        return;
    }

    if (isdoublez(p1)) {
        push(p1, $);
        sinfunc($);
        push(p1, $);
        cosfunc($);
        divide($);
        return;
    }

    // tan(-x) = -tan(x)

    if (isnegativeterm(p1)) {
        push(p1, $);
        negate($);
        tanfunc($);
        negate($);
        return;
    }

    if (car(p1).equals(ADD)) {
        tanfunc_sum(p1, $);
        return;
    }

    if (car(p1).equals(ARCTAN)) {
        push(cadr(p1), $);
        push(caddr(p1), $);
        divide($);
        return;
    }

    // n Pi ?

    push(p1, $);
    push(Pi, $);
    divide($);
    let p2 = pop($);

    if (!is_num(p2)) {
        push(TAN, $);
        push(p1, $);
        list(2, $);
        return;
    }

    if (is_flt(p2)) {
        let d = p2.toNumber();
        d = Math.tan(d * Math.PI);
        push_double(d, $);
        return;
    }

    push(p2, $); // nonnegative by tan(-x) = -tan(x) above
    push_integer(180, $);
    multiply($);
    p2 = pop($);

    if (!(is_rat(p2) && isinteger(p2))) {
        push(TAN, $);
        push(p1, $);
        list(2, $);
        return;
    }

    push(p2, $);
    push_integer(360, $);
    modfunc($);
    const n = pop_integer($);

    switch (n) {
        case 0:
        case 180:
            push_integer(0, $);
            break;
        case 30:
        case 210:
            push_rational(1, 3, $);
            push_integer(3, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 150:
        case 330:
            push_rational(-1, 3, $);
            push_integer(3, $);
            push_rational(1, 2, $);
            power($);
            multiply($);
            break;
        case 45:
        case 225:
            push_integer(1, $);
            break;
        case 135:
        case 315:
            push_integer(-1, $);
            break;
        case 60:
        case 240:
            push_integer(3, $);
            push_rational(1, 2, $);
            power($);
            break;
        case 120:
        case 300:
            push_integer(3, $);
            push_rational(1, 2, $);
            power($);
            negate($);
            break;
        default:
            push(TAN, $);
            push(p1, $);
            list(2, $);
            break;
    }
}

// tan(x + n Pi) = tan(x)

function tanfunc_sum(p1: U, $: ScriptVars): void {
    let p2 = cdr(p1);
    while (is_cons(p2)) {
        push(car(p2), $);
        push(Pi, $);
        divide($);
        const p3 = pop($);
        if (is_rat(p3) && isinteger(p3)) {
            push(p1, $);
            push(car(p2), $);
            subtract($);
            tanfunc($);
            return;
        }
        p2 = cdr(p2);
    }
    push(TAN, $);
    push(p1, $);
    list(2, $);
}

function eval_tanh(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    tanhfunc($);
}

function tanhfunc($: ScriptVars): void {

    const p1 = pop($);

    if (is_tensor(p1)) {
        push(elementwise(p1, tanhfunc, $), $);
        return;
    }

    if (is_flt(p1)) {
        let d = p1.toNumber();
        d = Math.tanh(d);
        push_double(d, $);
        return;
    }

    if (isdoublez(p1)) {
        push(p1, $);
        sinhfunc($);
        push(p1, $);
        coshfunc($);
        divide($);
        return;
    }

    if (iszero(p1)) {
        push_integer(0, $);
        return;
    }

    // tanh(-x) = -tanh(x)

    if (isnegativeterm(p1)) {
        push(p1, $);
        negate($);
        tanhfunc($);
        negate($);
        return;
    }

    if (car(p1).equals(ARCTANH)) {
        push(cadr(p1), $);
        return;
    }

    push(TANH, $);
    push(p1, $);
    list(2, $);
}

function expect_n_arguments(x: Cons, n: number): void | never {
    const opr = assert_sym(x.opr);
    const argList = x.argList;
    if (argList.length !== n) {
        if (n > 1) {
            stopf(`Expecting ${n} argument(s) for ${opr.key()} but got ${argList.length}.`);
        }
        else if (n === 1) {
            stopf(`Expecting 1 argument for ${opr.key()} but got ${argList.length}.`);
        }
        else if (n === 0) {
            stopf(`Expecting 0 arguments for ${opr.key()} but got ${argList.length}.`);
        }
        else {
            throw new Error();
        }
    }
}

function eval_tau(x: Cons, $: ScriptVars): void {
    expect_n_arguments(x, 1);
    const argList = x.argList;
    const arg = argList.item(0);
    push(arg, $);
    value_of($);
    taufunc($);
}

function taufunc($: ScriptVars): void {
    const n = pop($);
    push(two, $);
    push(Pi, $);
    push(n, $);
    multiply_factors(3, $);
}

function eval_taylor(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);
    let F = pop($);

    push(caddr(p1), $);
    value_of($);
    const X = pop($);

    push(cadddr(p1), $);
    value_of($);
    const n = pop_integer($);

    p1 = cddddr(p1);

    if (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
    }
    else
        push_integer(0, $); // default expansion point

    const A = pop($);

    const h = $.stack.length;

    push(F, $);	// f(a)
    push(X, $);
    push(A, $);
    subst($);
    value_of($);

    push_integer(1, $);
    let C = pop($);

    for (let i = 1; i <= n; i++) {

        push(F, $);	// f = f'
        push(X, $);
        derivative($);
        F = pop($);

        if (iszero(F))
            break;

        push(C, $);	// c = c * (x - a)
        push(X, $);
        push(A, $);
        subtract($);
        multiply($);
        C = pop($);

        push(F, $);	// f(a)
        push(X, $);
        push(A, $);
        subst($);
        value_of($);

        push(C, $);
        multiply($);
        push_integer(i, $);
        factorial($);
        divide($);
    }

    add_terms($.stack.length - h, $);
}

function eval_tensor(p1: Tensor, $: ScriptVars): void {

    p1 = copy_tensor(p1);

    const n = p1.nelem;

    for (let i = 0; i < n; i++) {
        push(p1.elems[i], $);
        value_of($);
        p1.elems[i] = pop($);
    }

    push(p1, $);

    promote_tensor($);
}

function eval_test(p1: U, $: ScriptVars): void {
    p1 = cdr(p1);
    while (is_cons(p1)) {
        if (!is_cons(cdr(p1))) {
            push(car(p1), $); // default case
            value_of($);
            return;
        }
        push(car(p1), $);
        evalp($);
        const p2 = pop($);
        if (!iszero(p2)) {
            push(cadr(p1), $);
            value_of($);
            return;
        }
        p1 = cddr(p1);
    }
    push(nil, $);
}

function eval_testeq(p1: U, $: ScriptVars): void {
    push(cadr(p1), $);
    value_of($);
    push(caddr(p1), $);
    value_of($);
    subtract($);
    simplify($);
    p1 = pop($);
    if (iszero(p1))
        push_integer(1, $);
    else
        push_integer(0, $);
}

function eval_testge(p1: U, $: ScriptVars): void {
    if (cmp_args(p1, $) >= 0)
        push_integer(1, $);
    else
        push_integer(0, $);
}

function eval_testgt(p1: U, $: ScriptVars): void {
    if (cmp_args(p1, $) > 0)
        push_integer(1, $);
    else
        push_integer(0, $);
}

function eval_testle(p1: U, $: ScriptVars): void {
    if (cmp_args(p1, $) <= 0)
        push_integer(1, $);
    else
        push_integer(0, $);
}

function eval_testlt(p1: U, $: ScriptVars): void {
    if (cmp_args(p1, $) < 0)
        push_integer(1, $);
    else
        push_integer(0, $);
}

function cmp_args(p1: U, $: ScriptVars): 0 | 1 | -1 {
    push(cadr(p1), $);
    value_of($);
    push(caddr(p1), $);
    value_of($);
    subtract($);
    simplify($);
    floatfunc($);
    p1 = pop($);
    if (iszero(p1))
        return 0;
    if (!is_num(p1))
        stopf("compare err");
    if (isnegativenumber(p1))
        return -1;
    else
        return 1;
}

function eval_transpose(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);
    const p2 = pop($);
    push(p2, $);

    if (!istensor(p2) || p2.ndim < 2)
        return;

    p1 = cddr(p1);

    if (!is_cons(p1)) {
        transpose(1, 2, $);
        return;
    }

    while (is_cons(p1)) {

        push(car(p1), $);
        value_of($);
        const n = pop_integer($);

        push(cadr(p1), $);
        value_of($);
        const m = pop_integer($);

        transpose(n, m, $);

        p1 = cddr(p1);
    }
}

function transpose(n: number, m: number, $: ScriptVars): void {
    const index: number[] = [];

    const p1 = pop($) as Tensor;

    const ndim = p1.ndim;
    const nelem = p1.nelem;

    if (n < 1 || n > ndim || m < 1 || m > ndim)
        stopf("transpose: index error");

    n--; // make zero based
    m--;

    const p2 = copy_tensor(p1);

    // interchange indices n and m

    p2.dims[n] = p1.dims[m];
    p2.dims[m] = p1.dims[n];

    for (let i = 0; i < ndim; i++)
        index[i] = 0;

    for (let i = 0; i < nelem; i++) {

        let k = 0;

        for (let j = 0; j < ndim; j++) {
            if (j === n)
                k = k * p1.dims[m] + index[m];
            else if (j === m)
                k = k * p1.dims[n] + index[n];
            else
                k = k * p1.dims[j] + index[j];
        }

        p2.elems[k] = p1.elems[i];

        // increment index

        for (let j = ndim - 1; j >= 0; j--) {
            if (++index[j] < p1.dims[j])
                break;
            index[j] = 0;
        }
    }

    push(p2, $);
}

function eval_unit(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);

    const n = pop_integer($);

    if (n < 1)
        stopf("unit: index err");

    if (n === 1) {
        push_integer(1, $);
        return;
    }

    const M = alloc_matrix(n, n);

    for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
            if (i === j)
                M.elems[n * i + j] = one;
            else
                M.elems[n * i + j] = zero;

    push(M, $);
}

function eval_uom(p1: U, $: ScriptVars): void {

    push(cadr(p1), $);
    value_of($);

    const strname = pop($);
    if (is_str(strname)) {
        const name = strname.str;
        if (is_uom_name(name)) {
            const uom = create_uom(name);
            push(uom, $);
        }
        else {
            stopf(``);
        }
    }
    else {
        stopf(``);
    }
}

function eval_user_function(p1: U, $: ScriptVars): void {
    // console.lg(`eval_user_function(${p1})`);

    const FUNC_NAME = assert_sym(car(p1));
    let FUNC_ARGS = cdr(p1);

    const FUNC_DEFN = get_usrfunc(FUNC_NAME, $);

    // undefined function?

    if (FUNC_DEFN.isnil) {
        if (FUNC_NAME.equals(D_LOWER)) {
            $.expanding++;
            eval_derivative(p1, $);
            $.expanding--;
            return;
        }
        const h = $.stack.length;
        push(FUNC_NAME, $);
        while (is_cons(FUNC_ARGS)) {
            push(car(FUNC_ARGS), $);
            value_of($);
            FUNC_ARGS = cdr(FUNC_ARGS);
        }
        list($.stack.length - h, $);
        return;
    }

    push(FUNC_DEFN, $);

    // eval all args before changing bindings

    for (let i = 0; i < 9; i++) {
        push(car(FUNC_ARGS), $);
        value_of($);
        FUNC_ARGS = cdr(FUNC_ARGS);
    }

    save_symbol(ARG1, $);
    save_symbol(ARG2, $);
    save_symbol(ARG3, $);
    save_symbol(ARG4, $);
    save_symbol(ARG5, $);
    save_symbol(ARG6, $);
    save_symbol(ARG7, $);
    save_symbol(ARG8, $);
    save_symbol(ARG9, $);

    set_symbol(ARG9, pop($), nil, $);
    set_symbol(ARG8, pop($), nil, $);
    set_symbol(ARG7, pop($), nil, $);
    set_symbol(ARG6, pop($), nil, $);
    set_symbol(ARG5, pop($), nil, $);
    set_symbol(ARG4, pop($), nil, $);
    set_symbol(ARG3, pop($), nil, $);
    set_symbol(ARG2, pop($), nil, $);
    set_symbol(ARG1, pop($), nil, $);

    value_of($);

    restore_symbol($);
    restore_symbol($);
    restore_symbol($);
    restore_symbol($);
    restore_symbol($);
    restore_symbol($);
    restore_symbol($);
    restore_symbol($);
    restore_symbol($);
}

// TODO: It should be possible to type p1: Sym (changes to math-expression-atoms needed)
function eval_user_symbol(p1: U, $: ScriptVars): void {
    const p2 = get_binding(assert_sym(p1), $);
    if (p1.equals(p2)) {
        push(p1, $); // symbol evaluates to itself
    }
    else {
        push(p2, $); // evaluate symbol binding
        value_of($);
    }
}

function eval_zero(p1: U, $: ScriptVars): void {

    p1 = cdr(p1);
    const h = $.stack.length;
    let m = 1;

    while (is_cons(p1)) {
        push(car(p1), $);
        value_of($);
        dupl($);
        const n = pop_integer($);
        if (n < 2)
            stopf("zero: dim err");
        m *= n;
        p1 = cdr(p1);
    }

    const n = $.stack.length - h;

    if (n === 0) {
        push_integer(0, $); // scalar zero
        return;
    }

    const T = alloc_tensor();

    for (let i = 0; i < m; i++)
        T.elems[i] = zero;

    // dim info

    for (let i = 0; i < n; i++)
        T.dims[n - i - 1] = pop_integer($);

    push(T, $);
}

export function value_of($: ScriptVars): void {
    $.eval_level++;
    try {
        evalf_nib($);
    }
    finally {
        $.eval_level--;
    }
}

function evalf_nib($: ScriptVars): void {

    if ($.eval_level === 200) {
        stopf("circular definition?");
    }

    const p1 = pop($);

    const sym = car(p1);
    if (is_cons(p1) && issymbol(sym)) {
        if ($.hasBinding(sym)) {
            $.expanding++;
            try {
                const evalFunction = consFunctions.get(sym.key()) as ConsFunction;
                evalFunction(p1, $);
            }
            finally {
                $.expanding--;
            }
            return;
        }
        if ($.hasUserFunction(sym)) {
            eval_user_function(p1, $);
            return;
        }
    }

    if (is_sym(p1) && $.hasBinding(p1)) { // bare keyword
        push(p1, $);
        push(LAST, $); // default arg
        list(2, $);
        value_of($);
        return;
    }

    if (is_sym(p1) && $.hasUserFunction(p1)) {
        eval_user_symbol(p1, $);
        return;
    }

    if (is_tensor(p1)) {
        eval_tensor(p1, $);
        return;
    }

    push(p1, $); // rational, double, or string
}

function evalp($: ScriptVars): void {
    const p1 = pop($);
    if (is_cons(p1) && p1.opr.equals(ASSIGN)) {
        eval_testeq(p1, $);
    }
    else {
        push(p1, $);
        value_of($);
    }
}

function expand_sum_factors(h: number, $: ScriptVars): void {

    let n = $.stack.length;

    if (n - h < 2)
        return;

    // search for a sum factor
    let i: number;
    let p2: U = nil;

    for (i = h; i < n; i++) {
        p2 = $.stack[i];
        if (car(p2).equals(ADD))
            break;
    }

    if (i === n)
        return; // no sum factors

    // remove the sum factor

    $.stack.splice(i, 1);

    n = $.stack.length - h;

    if (n > 1) {
        sort_factors(h, $);
        list(n, $);
        push(MULTIPLY, $);
        swap($);
        cons($);
    }

    const p1 = pop($); // p1 is the multiplier

    p2 = cdr(p2); // p2 is the sum

    while (is_cons(p2)) {
        push(p1, $);
        push(car(p2), $);
        multiply($);
        p2 = cdr(p2);
    }

    add_terms($.stack.length - h, $);
}
// N is bignum, M is rational

function factor_bignum(N: BigInteger, M: U, $: ScriptVars): void {

    // greater than 31 bits?

    if (!bignum_issmallnum(N)) {
        push_bignum(1, N, bignum_int(1), $);
        if (isplusone(M))
            return;
        push(POWER, $);
        swap($);
        push(M, $);
        list(3, $);
        return;
    }

    const h = $.stack.length;

    let n = bignum_smallnum(N);

    factor_int(n, $);

    n = ($.stack.length - h) / 2; // number of factors on stack

    for (let i = 0; i < n; i++) {

        const BASE = $.stack[h + 2 * i + 0];
        let EXPO = $.stack[h + 2 * i + 1];

        push(EXPO, $);
        push(M, $);
        multiply($);
        EXPO = pop($);

        if (isplusone(EXPO)) {
            $.stack[h + i] = BASE;
            continue;
        }

        push(POWER, $);
        push(BASE, $);
        push(EXPO, $);
        list(3, $);
        $.stack[h + i] = pop($);
    }

    $.stack.splice(h + n); // pop all
}
// factors N or N^M where N and M are rational numbers, returns factors on stack

function factor_factor($: ScriptVars): void {

    const INPUT = pop($);

    if (car(INPUT).equals(POWER)) {

        const BASE = cadr(INPUT);
        const EXPO = caddr(INPUT);

        if (!is_rat(BASE) || !is_rat(EXPO)) {
            push(INPUT, $); // cannot factor
            return;
        }

        if (isminusone(BASE)) {
            push(INPUT, $); // -1 to the M
            return;
        }

        if (isnegativenumber(BASE)) {
            push(POWER, $);
            push_integer(-1, $);
            push(EXPO, $);
            list(3, $); // leave on stack
        }

        const numer = BASE.a;
        const denom = BASE.b;

        if (!bignum_equal(numer, 1))
            factor_bignum(numer, EXPO, $);

        if (!bignum_equal(denom, 1)) {
            // flip sign of exponent
            push(EXPO, $);
            negate($);
            const expo = pop($);
            factor_bignum(denom, expo, $);
        }

        return;
    }

    if (!is_rat(INPUT) || iszero(INPUT) || isplusone(INPUT) || isminusone(INPUT)) {
        push(INPUT, $);
        return;
    }

    if (isnegativenumber(INPUT))
        push_integer(-1, $);

    const numer = INPUT.a;
    const denom = INPUT.b;

    if (!bignum_equal(numer, 1))
        factor_bignum(numer, one, $);

    if (!bignum_equal(denom, 1))
        factor_bignum(denom, minusone, $);
}
const primetab = [
    2, 3, 5, 7, 11, 13, 17, 19,
    23, 29, 31, 37, 41, 43, 47, 53,
    59, 61, 67, 71, 73, 79, 83, 89,
    97, 101, 103, 107, 109, 113, 127, 131,
    137, 139, 149, 151, 157, 163, 167, 173,
    179, 181, 191, 193, 197, 199, 211, 223,
    227, 229, 233, 239, 241, 251, 257, 263,
    269, 271, 277, 281, 283, 293, 307, 311,
    313, 317, 331, 337, 347, 349, 353, 359,
    367, 373, 379, 383, 389, 397, 401, 409,
    419, 421, 431, 433, 439, 443, 449, 457,
    461, 463, 467, 479, 487, 491, 499, 503,
    509, 521, 523, 541, 547, 557, 563, 569,
    571, 577, 587, 593, 599, 601, 607, 613,
    617, 619, 631, 641, 643, 647, 653, 659,
    661, 673, 677, 683, 691, 701, 709, 719,
    727, 733, 739, 743, 751, 757, 761, 769,
    773, 787, 797, 809, 811, 821, 823, 827,
    829, 839, 853, 857, 859, 863, 877, 881,
    883, 887, 907, 911, 919, 929, 937, 941,
    947, 953, 967, 971, 977, 983, 991, 997,
    1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049,
    1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097,
    1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163,
    1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223,
    1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283,
    1289, 1291, 1297, 1301, 1303, 1307, 1319, 1321,
    1327, 1361, 1367, 1373, 1381, 1399, 1409, 1423,
    1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459,
    1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511,
    1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571,
    1579, 1583, 1597, 1601, 1607, 1609, 1613, 1619,
    1621, 1627, 1637, 1657, 1663, 1667, 1669, 1693,
    1697, 1699, 1709, 1721, 1723, 1733, 1741, 1747,
    1753, 1759, 1777, 1783, 1787, 1789, 1801, 1811,
    1823, 1831, 1847, 1861, 1867, 1871, 1873, 1877,
    1879, 1889, 1901, 1907, 1913, 1931, 1933, 1949,
    1951, 1973, 1979, 1987, 1993, 1997, 1999, 2003,
    2011, 2017, 2027, 2029, 2039, 2053, 2063, 2069,
    2081, 2083, 2087, 2089, 2099, 2111, 2113, 2129,
    2131, 2137, 2141, 2143, 2153, 2161, 2179, 2203,
    2207, 2213, 2221, 2237, 2239, 2243, 2251, 2267,
    2269, 2273, 2281, 2287, 2293, 2297, 2309, 2311,
    2333, 2339, 2341, 2347, 2351, 2357, 2371, 2377,
    2381, 2383, 2389, 2393, 2399, 2411, 2417, 2423,
    2437, 2441, 2447, 2459, 2467, 2473, 2477, 2503,
    2521, 2531, 2539, 2543, 2549, 2551, 2557, 2579,
    2591, 2593, 2609, 2617, 2621, 2633, 2647, 2657,
    2659, 2663, 2671, 2677, 2683, 2687, 2689, 2693,
    2699, 2707, 2711, 2713, 2719, 2729, 2731, 2741,
    2749, 2753, 2767, 2777, 2789, 2791, 2797, 2801,
    2803, 2819, 2833, 2837, 2843, 2851, 2857, 2861,
    2879, 2887, 2897, 2903, 2909, 2917, 2927, 2939,
    2953, 2957, 2963, 2969, 2971, 2999, 3001, 3011,
    3019, 3023, 3037, 3041, 3049, 3061, 3067, 3079,
    3083, 3089, 3109, 3119, 3121, 3137, 3163, 3167,
    3169, 3181, 3187, 3191, 3203, 3209, 3217, 3221,
    3229, 3251, 3253, 3257, 3259, 3271, 3299, 3301,
    3307, 3313, 3319, 3323, 3329, 3331, 3343, 3347,
    3359, 3361, 3371, 3373, 3389, 3391, 3407, 3413,
    3433, 3449, 3457, 3461, 3463, 3467, 3469, 3491,
    3499, 3511, 3517, 3527, 3529, 3533, 3539, 3541,
    3547, 3557, 3559, 3571, 3581, 3583, 3593, 3607,
    3613, 3617, 3623, 3631, 3637, 3643, 3659, 3671,
    3673, 3677, 3691, 3697, 3701, 3709, 3719, 3727,
    3733, 3739, 3761, 3767, 3769, 3779, 3793, 3797,
    3803, 3821, 3823, 3833, 3847, 3851, 3853, 3863,
    3877, 3881, 3889, 3907, 3911, 3917, 3919, 3923,
    3929, 3931, 3943, 3947, 3967, 3989, 4001, 4003,
    4007, 4013, 4019, 4021, 4027, 4049, 4051, 4057,
    4073, 4079, 4091, 4093, 4099, 4111, 4127, 4129,
    4133, 4139, 4153, 4157, 4159, 4177, 4201, 4211,
    4217, 4219, 4229, 4231, 4241, 4243, 4253, 4259,
    4261, 4271, 4273, 4283, 4289, 4297, 4327, 4337,
    4339, 4349, 4357, 4363, 4373, 4391, 4397, 4409,
    4421, 4423, 4441, 4447, 4451, 4457, 4463, 4481,
    4483, 4493, 4507, 4513, 4517, 4519, 4523, 4547,
    4549, 4561, 4567, 4583, 4591, 4597, 4603, 4621,
    4637, 4639, 4643, 4649, 4651, 4657, 4663, 4673,
    4679, 4691, 4703, 4721, 4723, 4729, 4733, 4751,
    4759, 4783, 4787, 4789, 4793, 4799, 4801, 4813,
    4817, 4831, 4861, 4871, 4877, 4889, 4903, 4909,
    4919, 4931, 4933, 4937, 4943, 4951, 4957, 4967,
    4969, 4973, 4987, 4993, 4999, 5003, 5009, 5011,
    5021, 5023, 5039, 5051, 5059, 5077, 5081, 5087,
    5099, 5101, 5107, 5113, 5119, 5147, 5153, 5167,
    5171, 5179, 5189, 5197, 5209, 5227, 5231, 5233,
    5237, 5261, 5273, 5279, 5281, 5297, 5303, 5309,
    5323, 5333, 5347, 5351, 5381, 5387, 5393, 5399,
    5407, 5413, 5417, 5419, 5431, 5437, 5441, 5443,
    5449, 5471, 5477, 5479, 5483, 5501, 5503, 5507,
    5519, 5521, 5527, 5531, 5557, 5563, 5569, 5573,
    5581, 5591, 5623, 5639, 5641, 5647, 5651, 5653,
    5657, 5659, 5669, 5683, 5689, 5693, 5701, 5711,
    5717, 5737, 5741, 5743, 5749, 5779, 5783, 5791,
    5801, 5807, 5813, 5821, 5827, 5839, 5843, 5849,
    5851, 5857, 5861, 5867, 5869, 5879, 5881, 5897,
    5903, 5923, 5927, 5939, 5953, 5981, 5987, 6007,
    6011, 6029, 6037, 6043, 6047, 6053, 6067, 6073,
    6079, 6089, 6091, 6101, 6113, 6121, 6131, 6133,
    6143, 6151, 6163, 6173, 6197, 6199, 6203, 6211,
    6217, 6221, 6229, 6247, 6257, 6263, 6269, 6271,
    6277, 6287, 6299, 6301, 6311, 6317, 6323, 6329,
    6337, 6343, 6353, 6359, 6361, 6367, 6373, 6379,
    6389, 6397, 6421, 6427, 6449, 6451, 6469, 6473,
    6481, 6491, 6521, 6529, 6547, 6551, 6553, 6563,
    6569, 6571, 6577, 6581, 6599, 6607, 6619, 6637,
    6653, 6659, 6661, 6673, 6679, 6689, 6691, 6701,
    6703, 6709, 6719, 6733, 6737, 6761, 6763, 6779,
    6781, 6791, 6793, 6803, 6823, 6827, 6829, 6833,
    6841, 6857, 6863, 6869, 6871, 6883, 6899, 6907,
    6911, 6917, 6947, 6949, 6959, 6961, 6967, 6971,
    6977, 6983, 6991, 6997, 7001, 7013, 7019, 7027,
    7039, 7043, 7057, 7069, 7079, 7103, 7109, 7121,
    7127, 7129, 7151, 7159, 7177, 7187, 7193, 7207,
    7211, 7213, 7219, 7229, 7237, 7243, 7247, 7253,
    7283, 7297, 7307, 7309, 7321, 7331, 7333, 7349,
    7351, 7369, 7393, 7411, 7417, 7433, 7451, 7457,
    7459, 7477, 7481, 7487, 7489, 7499, 7507, 7517,
    7523, 7529, 7537, 7541, 7547, 7549, 7559, 7561,
    7573, 7577, 7583, 7589, 7591, 7603, 7607, 7621,
    7639, 7643, 7649, 7669, 7673, 7681, 7687, 7691,
    7699, 7703, 7717, 7723, 7727, 7741, 7753, 7757,
    7759, 7789, 7793, 7817, 7823, 7829, 7841, 7853,
    7867, 7873, 7877, 7879, 7883, 7901, 7907, 7919,
    7927, 7933, 7937, 7949, 7951, 7963, 7993, 8009,
    8011, 8017, 8039, 8053, 8059, 8069, 8081, 8087,
    8089, 8093, 8101, 8111, 8117, 8123, 8147, 8161,
    8167, 8171, 8179, 8191, 8209, 8219, 8221, 8231,
    8233, 8237, 8243, 8263, 8269, 8273, 8287, 8291,
    8293, 8297, 8311, 8317, 8329, 8353, 8363, 8369,
    8377, 8387, 8389, 8419, 8423, 8429, 8431, 8443,
    8447, 8461, 8467, 8501, 8513, 8521, 8527, 8537,
    8539, 8543, 8563, 8573, 8581, 8597, 8599, 8609,
    8623, 8627, 8629, 8641, 8647, 8663, 8669, 8677,
    8681, 8689, 8693, 8699, 8707, 8713, 8719, 8731,
    8737, 8741, 8747, 8753, 8761, 8779, 8783, 8803,
    8807, 8819, 8821, 8831, 8837, 8839, 8849, 8861,
    8863, 8867, 8887, 8893, 8923, 8929, 8933, 8941,
    8951, 8963, 8969, 8971, 8999, 9001, 9007, 9011,
    9013, 9029, 9041, 9043, 9049, 9059, 9067, 9091,
    9103, 9109, 9127, 9133, 9137, 9151, 9157, 9161,
    9173, 9181, 9187, 9199, 9203, 9209, 9221, 9227,
    9239, 9241, 9257, 9277, 9281, 9283, 9293, 9311,
    9319, 9323, 9337, 9341, 9343, 9349, 9371, 9377,
    9391, 9397, 9403, 9413, 9419, 9421, 9431, 9433,
    9437, 9439, 9461, 9463, 9467, 9473, 9479, 9491,
    9497, 9511, 9521, 9533, 9539, 9547, 9551, 9587,
    9601, 9613, 9619, 9623, 9629, 9631, 9643, 9649,
    9661, 9677, 9679, 9689, 9697, 9719, 9721, 9733,
    9739, 9743, 9749, 9767, 9769, 9781, 9787, 9791,
    9803, 9811, 9817, 9829, 9833, 9839, 9851, 9857,
    9859, 9871, 9883, 9887, 9901, 9907, 9923, 9929,
    9931, 9941, 9949, 9967, 9973, 10007, 10009, 10037,
    10039, 10061, 10067, 10069, 10079, 10091, 10093, 10099,
    10103, 10111, 10133, 10139, 10141, 10151, 10159, 10163,
    10169, 10177, 10181, 10193, 10211, 10223, 10243, 10247,
    10253, 10259, 10267, 10271, 10273, 10289, 10301, 10303,
    10313, 10321, 10331, 10333, 10337, 10343, 10357, 10369,
    10391, 10399, 10427, 10429, 10433, 10453, 10457, 10459,
    10463, 10477, 10487, 10499, 10501, 10513, 10529, 10531,
    10559, 10567, 10589, 10597, 10601, 10607, 10613, 10627,
    10631, 10639, 10651, 10657, 10663, 10667, 10687, 10691,
    10709, 10711, 10723, 10729, 10733, 10739, 10753, 10771,
    10781, 10789, 10799, 10831, 10837, 10847, 10853, 10859,
    10861, 10867, 10883, 10889, 10891, 10903, 10909, 10937,
    10939, 10949, 10957, 10973, 10979, 10987, 10993, 11003,
    11027, 11047, 11057, 11059, 11069, 11071, 11083, 11087,
    11093, 11113, 11117, 11119, 11131, 11149, 11159, 11161,
    11171, 11173, 11177, 11197, 11213, 11239, 11243, 11251,
    11257, 11261, 11273, 11279, 11287, 11299, 11311, 11317,
    11321, 11329, 11351, 11353, 11369, 11383, 11393, 11399,
    11411, 11423, 11437, 11443, 11447, 11467, 11471, 11483,
    11489, 11491, 11497, 11503, 11519, 11527, 11549, 11551,
    11579, 11587, 11593, 11597, 11617, 11621, 11633, 11657,
    11677, 11681, 11689, 11699, 11701, 11717, 11719, 11731,
    11743, 11777, 11779, 11783, 11789, 11801, 11807, 11813,
    11821, 11827, 11831, 11833, 11839, 11863, 11867, 11887,
    11897, 11903, 11909, 11923, 11927, 11933, 11939, 11941,
    11953, 11959, 11969, 11971, 11981, 11987, 12007, 12011,
    12037, 12041, 12043, 12049, 12071, 12073, 12097, 12101,
    12107, 12109, 12113, 12119, 12143, 12149, 12157, 12161,
    12163, 12197, 12203, 12211, 12227, 12239, 12241, 12251,
    12253, 12263, 12269, 12277, 12281, 12289, 12301, 12323,
    12329, 12343, 12347, 12373, 12377, 12379, 12391, 12401,
    12409, 12413, 12421, 12433, 12437, 12451, 12457, 12473,
    12479, 12487, 12491, 12497, 12503, 12511, 12517, 12527,
    12539, 12541, 12547, 12553, 12569, 12577, 12583, 12589,
    12601, 12611, 12613, 12619, 12637, 12641, 12647, 12653,
    12659, 12671, 12689, 12697, 12703, 12713, 12721, 12739,
    12743, 12757, 12763, 12781, 12791, 12799, 12809, 12821,
    12823, 12829, 12841, 12853, 12889, 12893, 12899, 12907,
    12911, 12917, 12919, 12923, 12941, 12953, 12959, 12967,
    12973, 12979, 12983, 13001, 13003, 13007, 13009, 13033,
    13037, 13043, 13049, 13063, 13093, 13099, 13103, 13109,
    13121, 13127, 13147, 13151, 13159, 13163, 13171, 13177,
    13183, 13187, 13217, 13219, 13229, 13241, 13249, 13259,
    13267, 13291, 13297, 13309, 13313, 13327, 13331, 13337,
    13339, 13367, 13381, 13397, 13399, 13411, 13417, 13421,
    13441, 13451, 13457, 13463, 13469, 13477, 13487, 13499,
    13513, 13523, 13537, 13553, 13567, 13577, 13591, 13597,
    13613, 13619, 13627, 13633, 13649, 13669, 13679, 13681,
    13687, 13691, 13693, 13697, 13709, 13711, 13721, 13723,
    13729, 13751, 13757, 13759, 13763, 13781, 13789, 13799,
    13807, 13829, 13831, 13841, 13859, 13873, 13877, 13879,
    13883, 13901, 13903, 13907, 13913, 13921, 13931, 13933,
    13963, 13967, 13997, 13999, 14009, 14011, 14029, 14033,
    14051, 14057, 14071, 14081, 14083, 14087, 14107, 14143,
    14149, 14153, 14159, 14173, 14177, 14197, 14207, 14221,
    14243, 14249, 14251, 14281, 14293, 14303, 14321, 14323,
    14327, 14341, 14347, 14369, 14387, 14389, 14401, 14407,
    14411, 14419, 14423, 14431, 14437, 14447, 14449, 14461,
    14479, 14489, 14503, 14519, 14533, 14537, 14543, 14549,
    14551, 14557, 14561, 14563, 14591, 14593, 14621, 14627,
    14629, 14633, 14639, 14653, 14657, 14669, 14683, 14699,
    14713, 14717, 14723, 14731, 14737, 14741, 14747, 14753,
    14759, 14767, 14771, 14779, 14783, 14797, 14813, 14821,
    14827, 14831, 14843, 14851, 14867, 14869, 14879, 14887,
    14891, 14897, 14923, 14929, 14939, 14947, 14951, 14957,
    14969, 14983, 15013, 15017, 15031, 15053, 15061, 15073,
    15077, 15083, 15091, 15101, 15107, 15121, 15131, 15137,
    15139, 15149, 15161, 15173, 15187, 15193, 15199, 15217,
    15227, 15233, 15241, 15259, 15263, 15269, 15271, 15277,
    15287, 15289, 15299, 15307, 15313, 15319, 15329, 15331,
    15349, 15359, 15361, 15373, 15377, 15383, 15391, 15401,
    15413, 15427, 15439, 15443, 15451, 15461, 15467, 15473,
    15493, 15497, 15511, 15527, 15541, 15551, 15559, 15569,
    15581, 15583, 15601, 15607, 15619, 15629, 15641, 15643,
    15647, 15649, 15661, 15667, 15671, 15679, 15683, 15727,
    15731, 15733, 15737, 15739, 15749, 15761, 15767, 15773,
    15787, 15791, 15797, 15803, 15809, 15817, 15823, 15859,
    15877, 15881, 15887, 15889, 15901, 15907, 15913, 15919,
    15923, 15937, 15959, 15971, 15973, 15991, 16001, 16007,
    16033, 16057, 16061, 16063, 16067, 16069, 16073, 16087,
    16091, 16097, 16103, 16111, 16127, 16139, 16141, 16183,
    16187, 16189, 16193, 16217, 16223, 16229, 16231, 16249,
    16253, 16267, 16273, 16301, 16319, 16333, 16339, 16349,
    16361, 16363, 16369, 16381, 16411, 16417, 16421, 16427,
    16433, 16447, 16451, 16453, 16477, 16481, 16487, 16493,
    16519, 16529, 16547, 16553, 16561, 16567, 16573, 16603,
    16607, 16619, 16631, 16633, 16649, 16651, 16657, 16661,
    16673, 16691, 16693, 16699, 16703, 16729, 16741, 16747,
    16759, 16763, 16787, 16811, 16823, 16829, 16831, 16843,
    16871, 16879, 16883, 16889, 16901, 16903, 16921, 16927,
    16931, 16937, 16943, 16963, 16979, 16981, 16987, 16993,
    17011, 17021, 17027, 17029, 17033, 17041, 17047, 17053,
    17077, 17093, 17099, 17107, 17117, 17123, 17137, 17159,
    17167, 17183, 17189, 17191, 17203, 17207, 17209, 17231,
    17239, 17257, 17291, 17293, 17299, 17317, 17321, 17327,
    17333, 17341, 17351, 17359, 17377, 17383, 17387, 17389,
    17393, 17401, 17417, 17419, 17431, 17443, 17449, 17467,
    17471, 17477, 17483, 17489, 17491, 17497, 17509, 17519,
    17539, 17551, 17569, 17573, 17579, 17581, 17597, 17599,
    17609, 17623, 17627, 17657, 17659, 17669, 17681, 17683,
    17707, 17713, 17729, 17737, 17747, 17749, 17761, 17783,
    17789, 17791, 17807, 17827, 17837, 17839, 17851, 17863,
    17881, 17891, 17903, 17909, 17911, 17921, 17923, 17929,
    17939, 17957, 17959, 17971, 17977, 17981, 17987, 17989,
    18013, 18041, 18043, 18047, 18049, 18059, 18061, 18077,
    18089, 18097, 18119, 18121, 18127, 18131, 18133, 18143,
    18149, 18169, 18181, 18191, 18199, 18211, 18217, 18223,
    18229, 18233, 18251, 18253, 18257, 18269, 18287, 18289,
    18301, 18307, 18311, 18313, 18329, 18341, 18353, 18367,
    18371, 18379, 18397, 18401, 18413, 18427, 18433, 18439,
    18443, 18451, 18457, 18461, 18481, 18493, 18503, 18517,
    18521, 18523, 18539, 18541, 18553, 18583, 18587, 18593,
    18617, 18637, 18661, 18671, 18679, 18691, 18701, 18713,
    18719, 18731, 18743, 18749, 18757, 18773, 18787, 18793,
    18797, 18803, 18839, 18859, 18869, 18899, 18911, 18913,
    18917, 18919, 18947, 18959, 18973, 18979, 19001, 19009,
    19013, 19031, 19037, 19051, 19069, 19073, 19079, 19081,
    19087, 19121, 19139, 19141, 19157, 19163, 19181, 19183,
    19207, 19211, 19213, 19219, 19231, 19237, 19249, 19259,
    19267, 19273, 19289, 19301, 19309, 19319, 19333, 19373,
    19379, 19381, 19387, 19391, 19403, 19417, 19421, 19423,
    19427, 19429, 19433, 19441, 19447, 19457, 19463, 19469,
    19471, 19477, 19483, 19489, 19501, 19507, 19531, 19541,
    19543, 19553, 19559, 19571, 19577, 19583, 19597, 19603,
    19609, 19661, 19681, 19687, 19697, 19699, 19709, 19717,
    19727, 19739, 19751, 19753, 19759, 19763, 19777, 19793,
    19801, 19813, 19819, 19841, 19843, 19853, 19861, 19867,
    19889, 19891, 19913, 19919, 19927, 19937, 19949, 19961,
    19963, 19973, 19979, 19991, 19993, 19997, 20011, 20021,
    20023, 20029, 20047, 20051, 20063, 20071, 20089, 20101,
    20107, 20113, 20117, 20123, 20129, 20143, 20147, 20149,
    20161, 20173, 20177, 20183, 20201, 20219, 20231, 20233,
    20249, 20261, 20269, 20287, 20297, 20323, 20327, 20333,
    20341, 20347, 20353, 20357, 20359, 20369, 20389, 20393,
    20399, 20407, 20411, 20431, 20441, 20443, 20477, 20479,
    20483, 20507, 20509, 20521, 20533, 20543, 20549, 20551,
    20563, 20593, 20599, 20611, 20627, 20639, 20641, 20663,
    20681, 20693, 20707, 20717, 20719, 20731, 20743, 20747,
    20749, 20753, 20759, 20771, 20773, 20789, 20807, 20809,
    20849, 20857, 20873, 20879, 20887, 20897, 20899, 20903,
    20921, 20929, 20939, 20947, 20959, 20963, 20981, 20983,
    21001, 21011, 21013, 21017, 21019, 21023, 21031, 21059,
    21061, 21067, 21089, 21101, 21107, 21121, 21139, 21143,
    21149, 21157, 21163, 21169, 21179, 21187, 21191, 21193,
    21211, 21221, 21227, 21247, 21269, 21277, 21283, 21313,
    21317, 21319, 21323, 21341, 21347, 21377, 21379, 21383,
    21391, 21397, 21401, 21407, 21419, 21433, 21467, 21481,
    21487, 21491, 21493, 21499, 21503, 21517, 21521, 21523,
    21529, 21557, 21559, 21563, 21569, 21577, 21587, 21589,
    21599, 21601, 21611, 21613, 21617, 21647, 21649, 21661,
    21673, 21683, 21701, 21713, 21727, 21737, 21739, 21751,
    21757, 21767, 21773, 21787, 21799, 21803, 21817, 21821,
    21839, 21841, 21851, 21859, 21863, 21871, 21881, 21893,
    21911, 21929, 21937, 21943, 21961, 21977, 21991, 21997,
    22003, 22013, 22027, 22031, 22037, 22039, 22051, 22063,
    22067, 22073, 22079, 22091, 22093, 22109, 22111, 22123,
    22129, 22133, 22147, 22153, 22157, 22159, 22171, 22189,
    22193, 22229, 22247, 22259, 22271, 22273, 22277, 22279,
    22283, 22291, 22303, 22307, 22343, 22349, 22367, 22369,
    22381, 22391, 22397, 22409, 22433, 22441, 22447, 22453,
    22469, 22481, 22483, 22501, 22511, 22531, 22541, 22543,
    22549, 22567, 22571, 22573, 22613, 22619, 22621, 22637,
    22639, 22643, 22651, 22669, 22679, 22691, 22697, 22699,
    22709, 22717, 22721, 22727, 22739, 22741, 22751, 22769,
    22777, 22783, 22787, 22807, 22811, 22817, 22853, 22859,
    22861, 22871, 22877, 22901, 22907, 22921, 22937, 22943,
    22961, 22963, 22973, 22993, 23003, 23011, 23017, 23021,
    23027, 23029, 23039, 23041, 23053, 23057, 23059, 23063,
    23071, 23081, 23087, 23099, 23117, 23131, 23143, 23159,
    23167, 23173, 23189, 23197, 23201, 23203, 23209, 23227,
    23251, 23269, 23279, 23291, 23293, 23297, 23311, 23321,
    23327, 23333, 23339, 23357, 23369, 23371, 23399, 23417,
    23431, 23447, 23459, 23473, 23497, 23509, 23531, 23537,
    23539, 23549, 23557, 23561, 23563, 23567, 23581, 23593,
    23599, 23603, 23609, 23623, 23627, 23629, 23633, 23663,
    23669, 23671, 23677, 23687, 23689, 23719, 23741, 23743,
    23747, 23753, 23761, 23767, 23773, 23789, 23801, 23813,
    23819, 23827, 23831, 23833, 23857, 23869, 23873, 23879,
    23887, 23893, 23899, 23909, 23911, 23917, 23929, 23957,
    23971, 23977, 23981, 23993, 24001, 24007, 24019, 24023,
    24029, 24043, 24049, 24061, 24071, 24077, 24083, 24091,
    24097, 24103, 24107, 24109, 24113, 24121, 24133, 24137,
    24151, 24169, 24179, 24181, 24197, 24203, 24223, 24229,
    24239, 24247, 24251, 24281, 24317, 24329, 24337, 24359,
    24371, 24373, 24379, 24391, 24407, 24413, 24419, 24421,
    24439, 24443, 24469, 24473, 24481, 24499, 24509, 24517,
    24527, 24533, 24547, 24551, 24571, 24593, 24611, 24623,
    24631, 24659, 24671, 24677, 24683, 24691, 24697, 24709,
    24733, 24749, 24763, 24767, 24781, 24793, 24799, 24809,
    24821, 24841, 24847, 24851, 24859, 24877, 24889, 24907,
    24917, 24919, 24923, 24943, 24953, 24967, 24971, 24977,
    24979, 24989, 25013, 25031, 25033, 25037, 25057, 25073,
    25087, 25097, 25111, 25117, 25121, 25127, 25147, 25153,
    25163, 25169, 25171, 25183, 25189, 25219, 25229, 25237,
    25243, 25247, 25253, 25261, 25301, 25303, 25307, 25309,
    25321, 25339, 25343, 25349, 25357, 25367, 25373, 25391,
    25409, 25411, 25423, 25439, 25447, 25453, 25457, 25463,
    25469, 25471, 25523, 25537, 25541, 25561, 25577, 25579,
    25583, 25589, 25601, 25603, 25609, 25621, 25633, 25639,
    25643, 25657, 25667, 25673, 25679, 25693, 25703, 25717,
    25733, 25741, 25747, 25759, 25763, 25771, 25793, 25799,
    25801, 25819, 25841, 25847, 25849, 25867, 25873, 25889,
    25903, 25913, 25919, 25931, 25933, 25939, 25943, 25951,
    25969, 25981, 25997, 25999, 26003, 26017, 26021, 26029,
    26041, 26053, 26083, 26099, 26107, 26111, 26113, 26119,
    26141, 26153, 26161, 26171, 26177, 26183, 26189, 26203,
    26209, 26227, 26237, 26249, 26251, 26261, 26263, 26267,
    26293, 26297, 26309, 26317, 26321, 26339, 26347, 26357,
    26371, 26387, 26393, 26399, 26407, 26417, 26423, 26431,
    26437, 26449, 26459, 26479, 26489, 26497, 26501, 26513,
    26539, 26557, 26561, 26573, 26591, 26597, 26627, 26633,
    26641, 26647, 26669, 26681, 26683, 26687, 26693, 26699,
    26701, 26711, 26713, 26717, 26723, 26729, 26731, 26737,
    26759, 26777, 26783, 26801, 26813, 26821, 26833, 26839,
    26849, 26861, 26863, 26879, 26881, 26891, 26893, 26903,
    26921, 26927, 26947, 26951, 26953, 26959, 26981, 26987,
    26993, 27011, 27017, 27031, 27043, 27059, 27061, 27067,
    27073, 27077, 27091, 27103, 27107, 27109, 27127, 27143,
    27179, 27191, 27197, 27211, 27239, 27241, 27253, 27259,
    27271, 27277, 27281, 27283, 27299, 27329, 27337, 27361,
    27367, 27397, 27407, 27409, 27427, 27431, 27437, 27449,
    27457, 27479, 27481, 27487, 27509, 27527, 27529, 27539,
    27541, 27551, 27581, 27583, 27611, 27617, 27631, 27647,
    27653, 27673, 27689, 27691, 27697, 27701, 27733, 27737,
    27739, 27743, 27749, 27751, 27763, 27767, 27773, 27779,
    27791, 27793, 27799, 27803, 27809, 27817, 27823, 27827,
    27847, 27851, 27883, 27893, 27901, 27917, 27919, 27941,
    27943, 27947, 27953, 27961, 27967, 27983, 27997, 28001,
    28019, 28027, 28031, 28051, 28057, 28069, 28081, 28087,
    28097, 28099, 28109, 28111, 28123, 28151, 28163, 28181,
    28183, 28201, 28211, 28219, 28229, 28277, 28279, 28283,
    28289, 28297, 28307, 28309, 28319, 28349, 28351, 28387,
    28393, 28403, 28409, 28411, 28429, 28433, 28439, 28447,
    28463, 28477, 28493, 28499, 28513, 28517, 28537, 28541,
    28547, 28549, 28559, 28571, 28573, 28579, 28591, 28597,
    28603, 28607, 28619, 28621, 28627, 28631, 28643, 28649,
    28657, 28661, 28663, 28669, 28687, 28697, 28703, 28711,
    28723, 28729, 28751, 28753, 28759, 28771, 28789, 28793,
    28807, 28813, 28817, 28837, 28843, 28859, 28867, 28871,
    28879, 28901, 28909, 28921, 28927, 28933, 28949, 28961,
    28979, 29009, 29017, 29021, 29023, 29027, 29033, 29059,
    29063, 29077, 29101, 29123, 29129, 29131, 29137, 29147,
    29153, 29167, 29173, 29179, 29191, 29201, 29207, 29209,
    29221, 29231, 29243, 29251, 29269, 29287, 29297, 29303,
    29311, 29327, 29333, 29339, 29347, 29363, 29383, 29387,
    29389, 29399, 29401, 29411, 29423, 29429, 29437, 29443,
    29453, 29473, 29483, 29501, 29527, 29531, 29537, 29567,
    29569, 29573, 29581, 29587, 29599, 29611, 29629, 29633,
    29641, 29663, 29669, 29671, 29683, 29717, 29723, 29741,
    29753, 29759, 29761, 29789, 29803, 29819, 29833, 29837,
    29851, 29863, 29867, 29873, 29879, 29881, 29917, 29921,
    29927, 29947, 29959, 29983, 29989, 30011, 30013, 30029,
    30047, 30059, 30071, 30089, 30091, 30097, 30103, 30109,
    30113, 30119, 30133, 30137, 30139, 30161, 30169, 30181,
    30187, 30197, 30203, 30211, 30223, 30241, 30253, 30259,
    30269, 30271, 30293, 30307, 30313, 30319, 30323, 30341,
    30347, 30367, 30389, 30391, 30403, 30427, 30431, 30449,
    30467, 30469, 30491, 30493, 30497, 30509, 30517, 30529,
    30539, 30553, 30557, 30559, 30577, 30593, 30631, 30637,
    30643, 30649, 30661, 30671, 30677, 30689, 30697, 30703,
    30707, 30713, 30727, 30757, 30763, 30773, 30781, 30803,
    30809, 30817, 30829, 30839, 30841, 30851, 30853, 30859,
    30869, 30871, 30881, 30893, 30911, 30931, 30937, 30941,
    30949, 30971, 30977, 30983, 31013, 31019, 31033, 31039,
    31051, 31063, 31069, 31079, 31081, 31091, 31121, 31123,
    31139, 31147, 31151, 31153, 31159, 31177, 31181, 31183,
    31189, 31193, 31219, 31223, 31231, 31237, 31247, 31249,
    31253, 31259, 31267, 31271, 31277, 31307, 31319, 31321,
    31327, 31333, 31337, 31357, 31379, 31387, 31391, 31393,
    31397, 31469, 31477, 31481, 31489, 31511, 31513, 31517,
    31531, 31541, 31543, 31547, 31567, 31573, 31583, 31601,
    31607, 31627, 31643, 31649, 31657, 31663, 31667, 31687,
    31699, 31721, 31723, 31727, 31729, 31741, 31751, 31769,
    31771, 31793, 31799, 31817, 31847, 31849, 31859, 31873,
    31883, 31891, 31907, 31957, 31963, 31973, 31981, 31991,
    32003, 32009, 32027, 32029, 32051, 32057, 32059, 32063,
    32069, 32077, 32083, 32089, 32099, 32117, 32119, 32141,
    32143, 32159, 32173, 32183, 32189, 32191, 32203, 32213,
    32233, 32237, 32251, 32257, 32261, 32297, 32299, 32303,
    32309, 32321, 32323, 32327, 32341, 32353, 32359, 32363,
    32369, 32371, 32377, 32381, 32401, 32411, 32413, 32423,
    32429, 32441, 32443, 32467, 32479, 32491, 32497, 32503,
    32507, 32531, 32533, 32537, 32561, 32563, 32569, 32573,
    32579, 32587, 32603, 32609, 32611, 32621, 32633, 32647,
    32653, 32687, 32693, 32707, 32713, 32717, 32719, 32749,
    32771, 32779, 32783, 32789, 32797, 32801, 32803, 32831,
    32833, 32839, 32843, 32869, 32887, 32909, 32911, 32917,
    32933, 32939, 32941, 32957, 32969, 32971, 32983, 32987,
    32993, 32999, 33013, 33023, 33029, 33037, 33049, 33053,
    33071, 33073, 33083, 33091, 33107, 33113, 33119, 33149,
    33151, 33161, 33179, 33181, 33191, 33199, 33203, 33211,
    33223, 33247, 33287, 33289, 33301, 33311, 33317, 33329,
    33331, 33343, 33347, 33349, 33353, 33359, 33377, 33391,
    33403, 33409, 33413, 33427, 33457, 33461, 33469, 33479,
    33487, 33493, 33503, 33521, 33529, 33533, 33547, 33563,
    33569, 33577, 33581, 33587, 33589, 33599, 33601, 33613,
    33617, 33619, 33623, 33629, 33637, 33641, 33647, 33679,
    33703, 33713, 33721, 33739, 33749, 33751, 33757, 33767,
    33769, 33773, 33791, 33797, 33809, 33811, 33827, 33829,
    33851, 33857, 33863, 33871, 33889, 33893, 33911, 33923,
    33931, 33937, 33941, 33961, 33967, 33997, 34019, 34031,
    34033, 34039, 34057, 34061, 34123, 34127, 34129, 34141,
    34147, 34157, 34159, 34171, 34183, 34211, 34213, 34217,
    34231, 34253, 34259, 34261, 34267, 34273, 34283, 34297,
    34301, 34303, 34313, 34319, 34327, 34337, 34351, 34361,
    34367, 34369, 34381, 34403, 34421, 34429, 34439, 34457,
    34469, 34471, 34483, 34487, 34499, 34501, 34511, 34513,
    34519, 34537, 34543, 34549, 34583, 34589, 34591, 34603,
    34607, 34613, 34631, 34649, 34651, 34667, 34673, 34679,
    34687, 34693, 34703, 34721, 34729, 34739, 34747, 34757,
    34759, 34763, 34781, 34807, 34819, 34841, 34843, 34847,
    34849, 34871, 34877, 34883, 34897, 34913, 34919, 34939,
    34949, 34961, 34963, 34981, 35023, 35027, 35051, 35053,
    35059, 35069, 35081, 35083, 35089, 35099, 35107, 35111,
    35117, 35129, 35141, 35149, 35153, 35159, 35171, 35201,
    35221, 35227, 35251, 35257, 35267, 35279, 35281, 35291,
    35311, 35317, 35323, 35327, 35339, 35353, 35363, 35381,
    35393, 35401, 35407, 35419, 35423, 35437, 35447, 35449,
    35461, 35491, 35507, 35509, 35521, 35527, 35531, 35533,
    35537, 35543, 35569, 35573, 35591, 35593, 35597, 35603,
    35617, 35671, 35677, 35729, 35731, 35747, 35753, 35759,
    35771, 35797, 35801, 35803, 35809, 35831, 35837, 35839,
    35851, 35863, 35869, 35879, 35897, 35899, 35911, 35923,
    35933, 35951, 35963, 35969, 35977, 35983, 35993, 35999,
    36007, 36011, 36013, 36017, 36037, 36061, 36067, 36073,
    36083, 36097, 36107, 36109, 36131, 36137, 36151, 36161,
    36187, 36191, 36209, 36217, 36229, 36241, 36251, 36263,
    36269, 36277, 36293, 36299, 36307, 36313, 36319, 36341,
    36343, 36353, 36373, 36383, 36389, 36433, 36451, 36457,
    36467, 36469, 36473, 36479, 36493, 36497, 36523, 36527,
    36529, 36541, 36551, 36559, 36563, 36571, 36583, 36587,
    36599, 36607, 36629, 36637, 36643, 36653, 36671, 36677,
    36683, 36691, 36697, 36709, 36713, 36721, 36739, 36749,
    36761, 36767, 36779, 36781, 36787, 36791, 36793, 36809,
    36821, 36833, 36847, 36857, 36871, 36877, 36887, 36899,
    36901, 36913, 36919, 36923, 36929, 36931, 36943, 36947,
    36973, 36979, 36997, 37003, 37013, 37019, 37021, 37039,
    37049, 37057, 37061, 37087, 37097, 37117, 37123, 37139,
    37159, 37171, 37181, 37189, 37199, 37201, 37217, 37223,
    37243, 37253, 37273, 37277, 37307, 37309, 37313, 37321,
    37337, 37339, 37357, 37361, 37363, 37369, 37379, 37397,
    37409, 37423, 37441, 37447, 37463, 37483, 37489, 37493,
    37501, 37507, 37511, 37517, 37529, 37537, 37547, 37549,
    37561, 37567, 37571, 37573, 37579, 37589, 37591, 37607,
    37619, 37633, 37643, 37649, 37657, 37663, 37691, 37693,
    37699, 37717, 37747, 37781, 37783, 37799, 37811, 37813,
    37831, 37847, 37853, 37861, 37871, 37879, 37889, 37897,
    37907, 37951, 37957, 37963, 37967, 37987, 37991, 37993,
    37997, 38011, 38039, 38047, 38053, 38069, 38083, 38113,
    38119, 38149, 38153, 38167, 38177, 38183, 38189, 38197,
    38201, 38219, 38231, 38237, 38239, 38261, 38273, 38281,
    38287, 38299, 38303, 38317, 38321, 38327, 38329, 38333,
    38351, 38371, 38377, 38393, 38431, 38447, 38449, 38453,
    38459, 38461, 38501, 38543, 38557, 38561, 38567, 38569,
    38593, 38603, 38609, 38611, 38629, 38639, 38651, 38653,
    38669, 38671, 38677, 38693, 38699, 38707, 38711, 38713,
    38723, 38729, 38737, 38747, 38749, 38767, 38783, 38791,
    38803, 38821, 38833, 38839, 38851, 38861, 38867, 38873,
    38891, 38903, 38917, 38921, 38923, 38933, 38953, 38959,
    38971, 38977, 38993, 39019, 39023, 39041, 39043, 39047,
    39079, 39089, 39097, 39103, 39107, 39113, 39119, 39133,
    39139, 39157, 39161, 39163, 39181, 39191, 39199, 39209,
    39217, 39227, 39229, 39233, 39239, 39241, 39251, 39293,
    39301, 39313, 39317, 39323, 39341, 39343, 39359, 39367,
    39371, 39373, 39383, 39397, 39409, 39419, 39439, 39443,
    39451, 39461, 39499, 39503, 39509, 39511, 39521, 39541,
    39551, 39563, 39569, 39581, 39607, 39619, 39623, 39631,
    39659, 39667, 39671, 39679, 39703, 39709, 39719, 39727,
    39733, 39749, 39761, 39769, 39779, 39791, 39799, 39821,
    39827, 39829, 39839, 39841, 39847, 39857, 39863, 39869,
    39877, 39883, 39887, 39901, 39929, 39937, 39953, 39971,
    39979, 39983, 39989, 40009, 40013, 40031, 40037, 40039,
    40063, 40087, 40093, 40099, 40111, 40123, 40127, 40129,
    40151, 40153, 40163, 40169, 40177, 40189, 40193, 40213,
    40231, 40237, 40241, 40253, 40277, 40283, 40289, 40343,
    40351, 40357, 40361, 40387, 40423, 40427, 40429, 40433,
    40459, 40471, 40483, 40487, 40493, 40499, 40507, 40519,
    40529, 40531, 40543, 40559, 40577, 40583, 40591, 40597,
    40609, 40627, 40637, 40639, 40693, 40697, 40699, 40709,
    40739, 40751, 40759, 40763, 40771, 40787, 40801, 40813,
    40819, 40823, 40829, 40841, 40847, 40849, 40853, 40867,
    40879, 40883, 40897, 40903, 40927, 40933, 40939, 40949,
    40961, 40973, 40993, 41011, 41017, 41023, 41039, 41047,
    41051, 41057, 41077, 41081, 41113, 41117, 41131, 41141,
    41143, 41149, 41161, 41177, 41179, 41183, 41189, 41201,
    41203, 41213, 41221, 41227, 41231, 41233, 41243, 41257,
    41263, 41269, 41281, 41299, 41333, 41341, 41351, 41357,
    41381, 41387, 41389, 41399, 41411, 41413, 41443, 41453,
    41467, 41479, 41491, 41507, 41513, 41519, 41521, 41539,
    41543, 41549, 41579, 41593, 41597, 41603, 41609, 41611,
    41617, 41621, 41627, 41641, 41647, 41651, 41659, 41669,
    41681, 41687, 41719, 41729, 41737, 41759, 41761, 41771,
    41777, 41801, 41809, 41813, 41843, 41849, 41851, 41863,
    41879, 41887, 41893, 41897, 41903, 41911, 41927, 41941,
    41947, 41953, 41957, 41959, 41969, 41981, 41983, 41999,
    42013, 42017, 42019, 42023, 42043, 42061, 42071, 42073,
    42083, 42089, 42101, 42131, 42139, 42157, 42169, 42179,
    42181, 42187, 42193, 42197, 42209, 42221, 42223, 42227,
    42239, 42257, 42281, 42283, 42293, 42299, 42307, 42323,
    42331, 42337, 42349, 42359, 42373, 42379, 42391, 42397,
    42403, 42407, 42409, 42433, 42437, 42443, 42451, 42457,
    42461, 42463, 42467, 42473, 42487, 42491, 42499, 42509,
    42533, 42557, 42569, 42571, 42577, 42589, 42611, 42641,
    42643, 42649, 42667, 42677, 42683, 42689, 42697, 42701,
    42703, 42709, 42719, 42727, 42737, 42743, 42751, 42767,
    42773, 42787, 42793, 42797, 42821, 42829, 42839, 42841,
    42853, 42859, 42863, 42899, 42901, 42923, 42929, 42937,
    42943, 42953, 42961, 42967, 42979, 42989, 43003, 43013,
    43019, 43037, 43049, 43051, 43063, 43067, 43093, 43103,
    43117, 43133, 43151, 43159, 43177, 43189, 43201, 43207,
    43223, 43237, 43261, 43271, 43283, 43291, 43313, 43319,
    43321, 43331, 43391, 43397, 43399, 43403, 43411, 43427,
    43441, 43451, 43457, 43481, 43487, 43499, 43517, 43541,
    43543, 43573, 43577, 43579, 43591, 43597, 43607, 43609,
    43613, 43627, 43633, 43649, 43651, 43661, 43669, 43691,
    43711, 43717, 43721, 43753, 43759, 43777, 43781, 43783,
    43787, 43789, 43793, 43801, 43853, 43867, 43889, 43891,
    43913, 43933, 43943, 43951, 43961, 43963, 43969, 43973,
    43987, 43991, 43997, 44017, 44021, 44027, 44029, 44041,
    44053, 44059, 44071, 44087, 44089, 44101, 44111, 44119,
    44123, 44129, 44131, 44159, 44171, 44179, 44189, 44201,
    44203, 44207, 44221, 44249, 44257, 44263, 44267, 44269,
    44273, 44279, 44281, 44293, 44351, 44357, 44371, 44381,
    44383, 44389, 44417, 44449, 44453, 44483, 44491, 44497,
    44501, 44507, 44519, 44531, 44533, 44537, 44543, 44549,
    44563, 44579, 44587, 44617, 44621, 44623, 44633, 44641,
    44647, 44651, 44657, 44683, 44687, 44699, 44701, 44711,
    44729, 44741, 44753, 44771, 44773, 44777, 44789, 44797,
    44809, 44819, 44839, 44843, 44851, 44867, 44879, 44887,
    44893, 44909, 44917, 44927, 44939, 44953, 44959, 44963,
    44971, 44983, 44987, 45007, 45013, 45053, 45061, 45077,
    45083, 45119, 45121, 45127, 45131, 45137, 45139, 45161,
    45179, 45181, 45191, 45197, 45233, 45247, 45259, 45263,
    45281, 45289, 45293, 45307, 45317, 45319, 45329, 45337,
    45341, 45343, 45361, 45377, 45389, 45403, 45413, 45427,
    45433, 45439, 45481, 45491, 45497, 45503, 45523, 45533,
    45541, 45553, 45557, 45569, 45587, 45589, 45599, 45613,
    45631, 45641, 45659, 45667, 45673, 45677, 45691, 45697,
    45707, 45737, 45751, 45757, 45763, 45767, 45779, 45817,
    45821, 45823, 45827, 45833, 45841, 45853, 45863, 45869,
    45887, 45893, 45943, 45949, 45953, 45959, 45971, 45979,
    45989, 46021, 46027, 46049, 46051, 46061, 46073, 46091,
    46093, 46099, 46103, 46133, 46141, 46147, 46153, 46171,
    46181, 46183, 46187, 46199, 46219, 46229, 46237, 46261,
    46271, 46273, 46279, 46301, 46307, 46309, 46327, 46337,
];

function factor_int(n: number, $: ScriptVars): void {

    n = Math.abs(n);

    if (n < 2)
        return;

    for (let k = 0; k < primetab.length; k++) {

        const d = primetab[k];

        let m = 0;

        while (n % d === 0) {
            n /= d;
            m++;
        }

        if (m === 0)
            continue;

        push_integer(d, $);
        push_integer(m, $);

        if (n === 1)
            return;
    }

    push_integer(n, $);
    push_integer(1, $);
}
// returns 1 with divisor on stack, otherwise returns 0

function find_divisor(p: U, $: ScriptVars): 0 | 1 {
    if (car(p).equals(ADD)) {
        p = cdr(p);
        while (is_cons(p)) {
            if (find_divisor_term(car(p), $))
                return 1;
            p = cdr(p);
        }
        return 0;
    }

    return find_divisor_term(p, $);
}

function find_divisor_term(p: U, $: ScriptVars): 0 | 1 {
    if (car(p).equals(MULTIPLY)) {
        p = cdr(p);
        while (is_cons(p)) {
            if (find_divisor_factor(car(p), $))
                return 1;
            p = cdr(p);
        }
        return 0;
    }

    return find_divisor_factor(p, $);
}

function find_divisor_factor(p: U, $: ScriptVars): 0 | 1 {
    if (is_rat(p) && isinteger(p))
        return 0;

    if (is_rat(p)) {
        push(p, $);
        denominator($);
        return 1;
    }

    if (is_cons(p) && p.opr.equals(POWER) && !isminusone(cadr(p)) && isnegativeterm(caddr(p))) {
        if (isminusone(caddr(p)))
            push(cadr(p), $);
        else {
            push(POWER, $);
            push(cadr(p), $);
            push(caddr(p), $);
            negate($);
            list(3, $);
        }
        return 1;
    }

    return 0;
}
/**
 * Determines whether q is in p.
 * @param p 
 * @param q 
 * @returns 
 */
function findf(p: U, q: U, $: ScriptVars): 0 | 1 {

    if (equal(p, q))
        return 1;

    if (is_tensor(p)) {
        const n = p.nelem;
        for (let i = 0; i < n; i++) {
            if (findf(p.elems[i], q, $))
                return 1;
        }
        return 0;
    }

    while (is_cons(p)) {
        if (findf(car(p), q, $))
            return 1;
        p = cdr(p);
    }

    return 0;
}

function flatten_factors(start: number, $: ScriptVars): void {
    const end = $.stack.length;
    for (let i = start; i < end; i++) {
        let p1 = $.stack[i];
        if (car(p1).equals(MULTIPLY)) {
            p1 = cdr(p1);
            $.stack[i] = car(p1);
            p1 = cdr(p1);
            while (is_cons(p1)) {
                push(car(p1), $);
                p1 = cdr(p1);
            }
        }
    }
}

export function get_binding(sym: Sym, $: ScriptVars): U {
    if (!is_sym(sym)) {
        stopf(`get_binding(${sym}) argument must be a Sym.`);
    }
    if (!$.hasUserFunction(sym)) {
        stopf(`get_binding(${sym}) symbol error`);
    }
    const binding = $.getBinding(sym);
    // TODO: We shouldn't need these first two checks.
    if (typeof binding === 'undefined') {
        return sym;
    }
    else if (binding === null) {
        return sym;
    }
    else if (binding.isnil) {
        return sym; // symbol binds to itself
    }
    else {
        return binding;
    }
}

function get_usrfunc(sym: Sym, $: ScriptVars): U {
    if (!$.hasUserFunction(sym)) {
        stopf("symbol error");
    }
    const f = $.getUserFunction(sym);
    if (typeof f === 'undefined') {
        return nil;
    }
    else {
        return f;
    }
}

export const eigenmath_prolog: string[] = [
    "i = sqrt(-1)",
    "grad(f) = d(f,(x,y,z))",
    "cross(a,b) = (dot(a[2],b[3])-dot(a[3],b[2]),dot(a[3],b[1])-dot(a[1],b[3]),dot(a[1],b[2])-dot(a[2],b[1]))",
    "curl(u) = (d(u[3],y) - d(u[2],z),d(u[1],z) - d(u[3],x),d(u[2],x) - d(u[1],y))",
    "div(u) = d(u[1],x) + d(u[2],y) + d(u[3],z)",
    "laguerre(x,n,m) = (n + m)! sum(k,0,n,(-x)^k / ((n - k)! (m + k)! k!))",
    "legendre(f,n,m,x) = eval(1 / (2^n n!) (1 - x^2)^(m/2) d((x^2 - 1)^n,x,n + m),x,f)",
    "hermite(x,n) = (-1)^n exp(x^2) d(exp(-x^2),x,n)",
    "binomial(n,k) = n! / k! / (n - k)!",
    "choose(n,k) = n! / k! / (n - k)!",
];

function isalnum(s: string): boolean {
    return isalpha(s) || isdigit(s);
}

function isalpha(s: string): boolean {
    const c = s.charCodeAt(0);
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

function iscomplexnumber(p: U): boolean {
    return isimaginarynumber(p) || (lengthf(p) === 3 && car(p).equals(ADD) && is_num(cadr(p)) && isimaginarynumber(caddr(p)));
}

function isdenormalpolar(p: U, $: ScriptVars) {
    if (car(p).equals(ADD)) {
        p = cdr(p);
        while (is_cons(p)) {
            if (isdenormalpolarterm(car(p), $))
                return 1;
            p = cdr(p);
        }
        return 0;
    }

    return isdenormalpolarterm(p, $);
}

function isdenormalpolarterm(p: U, $: ScriptVars) {
    if (!car(p).equals(MULTIPLY))
        return 0;

    if (lengthf(p) === 3 && isimaginaryunit(cadr(p)) && caddr(p).equals(Pi))
        return 1; // exp(i Pi)

    if (lengthf(p) !== 4 || !is_num(cadr(p)) || !isimaginaryunit(caddr(p)) || !cadddr(p).equals(Pi))
        return 0;

    p = cadr(p); // p = coeff of term

    if (is_num(p) && isnegativenumber(p))
        return 1; // p < 0

    push(p, $);
    push_rational(-1, 2, $);
    add($);
    p = pop($);

    if (!(is_num(p) && isnegativenumber(p)))
        return 1; // p >= 1/2

    return 0;
}

function isdoublesomewhere(p: U) {
    if (is_flt(p))
        return 1;

    if (is_cons(p)) {
        p = cdr(p);
        while (is_cons(p)) {
            if (isdoublesomewhere(car(p)))
                return 1;
            p = cdr(p);
        }
    }

    return 0;
}

function isdoublez(p: U): 0 | 1 {
    if (car(p).equals(ADD)) {

        if (lengthf(p) !== 3)
            return 0;

        if (!is_flt(cadr(p))) // x
            return 0;

        p = caddr(p);
    }

    if (!car(p).equals(MULTIPLY))
        return 0;

    if (lengthf(p) !== 3)
        return 0;

    if (!is_flt(cadr(p))) // y
        return 0;

    p = caddr(p);

    if (!car(p).equals(POWER))
        return 0;

    if (!isminusone(cadr(p)))
        return 0;

    if (!isequalq(caddr(p), 1, 2))
        return 0;

    return 1;
}

function isimaginarynumber(p: U): boolean {
    return isimaginaryunit(p) || (lengthf(p) === 3 && car(p).equals(MULTIPLY) && is_num(cadr(p)) && isimaginaryunit(caddr(p)));
}

function isinteger1(p: Rat) {
    return isinteger(p) && isplusone(p);
}

function isminusoneoversqrttwo(p: U) {
    return lengthf(p) === 3 && car(p).equals(MULTIPLY) && isminusone(cadr(p)) && isoneoversqrttwo(caddr(p));
}

function isoneoversqrttwo(p: U): boolean {
    return car(p).equals(POWER) && isequaln(cadr(p), 2) && isequalq(caddr(p), -1, 2);
}

function isplusone(p: U): boolean {
    return isequaln(p, 1);
}

function isradical(p: U): boolean {
    if (car(p).equals(POWER)) {
        const base = cadr(p);
        const expo = caddr(p);
        return is_rat(base) && isposint(base) && is_rat(expo) && isfraction(expo);
    }
    else {
        return false;
    }
}

function issmallinteger(p: U): boolean {
    if (is_rat(p) && isinteger(p)) {
        return bignum_issmallnum(p.a);
    }

    if (is_flt(p))
        return p.d === Math.floor(p.d) && Math.abs(p.d) <= 0x7fffffff;

    return false;
}

function issquarematrix(p: Tensor): boolean {
    return istensor(p) && p.ndim === 2 && p.dims[0] === p.dims[1];
}

function isstring(p: U): p is Str {
    return is_str(p);
}

function issymbol(p: U): p is Sym {
    return is_sym(p);
}

function istensor(p: U): p is Tensor {
    return is_tensor(p);
}

function isusersymbolsomewhere(p: U, scope: EigenmathReadScope): 0 | 1 {
    if (is_sym(p) && scope.hasUserFunction(p) && !p.equalsSym(Pi) && !p.equalsSym(DOLLAR_E))
        return 1;

    if (is_cons(p)) {
        p = cdr(p);
        while (is_cons(p)) {
            if (isusersymbolsomewhere(car(p), scope))
                return 1;
            p = cdr(p);
        }
    }

    return 0;
}

export function iszero(p: U): boolean {

    if (is_rat(p))
        return bignum_iszero(p.a);

    if (is_flt(p))
        return p.d === 0;

    if (is_tensor(p)) {
        const n = p.nelem;
        for (let i = 0; i < n; i++) {
            if (!iszero(p.elems[i]))
                return false;
        }
        return true;
    }

    return false;
}

function lengthf(p: U): number {
    let n = 0;
    while (is_cons(p)) {
        n++;
        p = cdr(p);
    }
    return n;
}

function lessp(p1: U, p2: U): boolean {
    return cmp(p1, p2) < 0;
}

function list(n: number, $: ScriptVars): void {
    push(nil, $);
    for (let i = 0; i < n; i++)
        cons($);
}

/**
 * 
 */
export function lookup(sym: Sym, scope: EigenmathScope): Sym {
    if (!scope.hasBinding(sym)) {
        scope.defineUserSymbol(sym);
    }
    return sym;
}

/**
 * A convenience function for multiply_factors(2, $) factors on the stack.
 */
function multiply($: ScriptVars): void {
    multiply_factors(2, $);
}

/**
 * A convenience function for multiplying 2 factors on the stack with the expanding flag set.
 */
function multiply_expand($: ScriptVars): void {
    const t = $.expanding;
    $.expanding = 1;
    try {
        multiply($);
    }
    finally {
        $.expanding = t;
    }
}
/**
 * 
 * @param n number of factors on stack
 */
function multiply_factors(n: number, $: ScriptVars): void {

    if (n < 2) {
        return;
    }

    const start = $.stack.length - n;

    flatten_factors(start, $);

    // console.lg(`after flatten factors: ${$.stack}`);
    const uom = multiply_uom_factors(start, $);
    if (is_uom(uom)) {
        push(uom, $);
    }

    const B = multiply_blade_factors(start, $);
    if (is_blade(B)) {
        push(B, $);
    }

    const T = multiply_tensor_factors(start, $);


    // console.lg(`after multiply tensor factors: ${$.stack}`);

    multiply_scalar_factors(start, $);

    // console.lg(`after multiply scalar factors: ${$.stack}`);

    if (is_tensor(T)) {
        push(T, $);
        inner($);
    }
}

function multiply_noexpand($: ScriptVars): void {
    const t = $.expanding;
    $.expanding = 0;
    multiply($);
    $.expanding = t;
}

/**
 * ( -- Num)
 * @param p1 
 * @param p2 
 * @param $ 
 * @returns 
 */
function multiply_numbers(p1: Num, p2: Num, $: ScriptVars): void {

    if (is_rat(p1) && is_rat(p2)) {
        multiply_rationals(p1, p2, $);
        return;
    }

    const a = p1.toNumber();
    const b = p2.toNumber();

    push_double(a * b, $);
}

/**
 * ( -- Rat)
 * @param lhs 
 * @param rhs 
 * @param $ 
 */
function multiply_rationals(lhs: Rat, rhs: Rat, $: ScriptVars): void {
    const x: Rat = lhs.mul(rhs);
    push(x, $);
}

function multiply_scalar_factors(start: number, $: ScriptVars): void {

    let COEFF = combine_numerical_factors(start, one, $);

    // console.lg(`after combine numerical factors: ${$.stack}`);

    if (iszero(COEFF) || start === $.stack.length) {
        $.stack.splice(start); // pop all
        push(COEFF, $);
        return;
    }

    combine_factors(start, $);
    normalize_power_factors(start, $);

    // do again in case exp(1/2 i Pi) changed to i

    combine_factors(start, $);
    // console.lg(`after combine factors: ${$.stack}`);
    normalize_power_factors(start, $);

    COEFF = combine_numerical_factors(start, COEFF, $);

    if (iszero(COEFF) || start === $.stack.length) {
        $.stack.splice(start); // pop all
        push(COEFF, $);
        return;
    }

    COEFF = reduce_radical_factors(start, COEFF, $);

    if (!isplusone(COEFF) || is_flt(COEFF))
        push(COEFF, $);

    if ($.expanding)
        expand_sum_factors(start, $); // success leaves one expr on stack

    const n = $.stack.length - start;

    switch (n) {
        case 0:
            push_integer(1, $);
            break;
        case 1:
            break;
        default:
            sort_factors(start, $); // previously sorted provisionally
            list(n, $);
            push(MULTIPLY, $);
            swap($);
            cons($);
            break;
    }
}

/**
 * The return value is either nil (because there are no tensors) or is a tensor.
 * @param start The start index on the stack.
 */
function multiply_tensor_factors(start: number, $: ScriptVars): U {
    let T: U = nil;
    let end = $.stack.length;
    for (let i = start; i < end; i++) {
        const p1 = $.stack[i];
        if (!istensor(p1)) {
            continue;
        }
        if (is_tensor(T)) {
            push(T, $);
            push(p1, $);
            hadamard($);
            T = pop($);
        }
        else {
            // The first time through, T is nil.
            T = p1;
        }
        $.stack.splice(i, 1); // remove factor
        i--; // use same index again
        end--;
    }
    return T;
}

function multiply_blade_factors(start: number, $: ScriptVars): U {
    let B: U = nil;
    let end = $.stack.length;
    for (let i = start; i < end; i++) {
        const p1 = $.stack[i];
        if (!is_blade(p1)) {
            continue;
        }
        if (is_blade(B)) {
            B = B.mul(p1);
        }
        else {
            // The first time through, T is nil.
            B = p1;
        }
        $.stack.splice(i, 1); // remove factor
        i--; // use same index again
        end--;
    }
    return B;
}

function multiply_uom_factors(start: number, $: ScriptVars): U {
    let product: U = nil;
    let end = $.stack.length;
    for (let i = start; i < end; i++) {
        const p1 = $.stack[i];
        if (!is_uom(p1)) {
            continue;
        }
        if (is_uom(product)) {
            product = product.mul(p1);
        }
        else {
            // The first time through, T is nil.
            product = p1;
        }
        $.stack.splice(i, 1); // remove factor
        i--; // use same index again
        end--;
    }
    return product;
}

function negate($: ScriptVars): void {
    push_integer(-1, $);
    multiply($);
}

function normalize_polar(EXPO: U, $: ScriptVars): void {
    if (car(EXPO).equals(ADD)) {
        const h = $.stack.length;
        let p1 = cdr(EXPO);
        while (is_cons(p1)) {
            EXPO = car(p1);
            if (isdenormalpolarterm(EXPO, $))
                normalize_polar_term(EXPO, $);
            else {
                push(POWER, $);
                push(DOLLAR_E, $);
                push(EXPO, $);
                list(3, $);
            }
            p1 = cdr(p1);
        }
        multiply_factors($.stack.length - h, $);
    }
    else
        normalize_polar_term(EXPO, $);
}

function normalize_polar_term(EXPO: U, $: ScriptVars): void {

    // exp(i Pi) = -1

    if (lengthf(EXPO) === 3) {
        push_integer(-1, $);
        return;
    }

    const R = cadr(EXPO); // R = coeff of term

    if (is_rat(R))
        normalize_polar_term_rational(R, $);
    else
        normalize_polar_term_double(R as Flt, $);
}

function normalize_polar_term_rational(R: U, $: ScriptVars): void {

    // R = R mod 2

    push(R, $);
    push_integer(2, $);
    modfunc($);
    R = pop($);

    // convert negative rotation to positive

    if (is_num(R) && isnegativenumber(R)) {
        push(R, $);
        push_integer(2, $);
        add($);
        R = pop($);
    }

    push(R, $);
    push_integer(2, $);
    multiply($);
    floorfunc($);
    const n = pop_integer($); // number of 90 degree turns

    push(R, $);
    push_integer(n, $);
    push_rational(-1, 2, $);
    multiply($);
    add($);
    R = pop($); // remainder

    switch (n) {

        case 0:
            if (iszero(R))
                push_integer(1, $);
            else {
                push(POWER, $);
                push(DOLLAR_E, $);
                push(MULTIPLY, $);
                push(R, $);
                push(imaginaryunit, $);
                push(Pi, $);
                list(4, $);
                list(3, $);
            }
            break;

        case 1:
            if (iszero(R))
                push(imaginaryunit, $);
            else {
                push(MULTIPLY, $);
                push(imaginaryunit, $);
                push(POWER, $);
                push(DOLLAR_E, $);
                push(MULTIPLY, $);
                push(R, $);
                push(imaginaryunit, $);
                push(Pi, $);
                list(4, $);
                list(3, $);
                list(3, $);
            }
            break;

        case 2:
            if (iszero(R))
                push_integer(-1, $);
            else {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(POWER, $);
                push(DOLLAR_E, $);
                push(MULTIPLY, $);
                push(R, $);
                push(imaginaryunit, $);
                push(Pi, $);
                list(4, $);
                list(3, $);
                list(3, $);
            }
            break;

        case 3:
            if (iszero(R)) {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(imaginaryunit, $);
                list(3, $);
            }
            else {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(imaginaryunit, $);
                push(POWER, $);
                push(DOLLAR_E, $);
                push(MULTIPLY, $);
                push(R, $);
                push(imaginaryunit, $);
                push(Pi, $);
                list(4, $);
                list(3, $);
                list(4, $);
            }
            break;
    }
}

function normalize_polar_term_double(R: Flt, $: ScriptVars): void {

    let coeff = R.d;

    // coeff = coeff mod 2

    coeff = coeff % 2;

    // convert negative rotation to positive

    if (coeff < 0)
        coeff += 2;

    const n = Math.floor(2 * coeff); // number of 1/4 turns

    const r = coeff - n / 2; // remainder

    switch (n) {

        case 0:
            if (r === 0)
                push_integer(1, $);
            else {
                push(POWER, $);
                push(DOLLAR_E, $);
                push(MULTIPLY, $);
                push_double(r, $);
                push(imaginaryunit, $);
                push(Pi, $);
                list(4, $);
                list(3, $);
            }
            break;

        case 1:
            if (r === 0)
                push(imaginaryunit, $);
            else {
                push(MULTIPLY, $);
                push(imaginaryunit, $);
                push(POWER, $);
                push(DOLLAR_E, $);
                push(MULTIPLY, $);
                push_double(r, $);
                push(imaginaryunit, $);
                push(Pi, $);
                list(4, $);
                list(3, $);
                list(3, $);
            }
            break;

        case 2:
            if (r === 0)
                push_integer(-1, $);
            else {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(POWER, $);
                push(DOLLAR_E, $);
                push(MULTIPLY, $);
                push_double(r, $);
                push(imaginaryunit, $);
                push(Pi, $);
                list(4, $);
                list(3, $);
                list(3, $);
            }
            break;

        case 3:
            if (r === 0) {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(imaginaryunit, $);
                list(3, $);
            }
            else {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(imaginaryunit, $);
                push(POWER, $);
                push(DOLLAR_E, $);
                push(MULTIPLY, $);
                push_double(r, $);
                push(imaginaryunit, $);
                push(Pi, $);
                list(4, $);
                list(3, $);
                list(4, $);
            }
            break;
    }
}

function normalize_power_factors(h: number, $: ScriptVars): void {
    const k = $.stack.length;
    for (let i = h; i < k; i++) {
        let p1 = $.stack[i];
        if (car(p1).equals(POWER)) {
            push(cadr(p1), $);
            push(caddr(p1), $);
            power($);
            p1 = pop($);
            if (car(p1).equals(MULTIPLY)) {
                p1 = cdr(p1);
                $.stack[i] = car(p1);
                p1 = cdr(p1);
                while (is_cons(p1)) {
                    push(car(p1), $);
                    p1 = cdr(p1);
                }
            }
            else
                $.stack[i] = p1;
        }
    }
}

/**
 *  1   number
 *  2   number to power (root)
 *  3   -1 to power (imaginary)
 *  4   other factor (symbol, power, func, etc)
 *  5   exponential
 *  6   derivative
 * 
 * @param p 
 * @returns 
 */
function order_factor(p: U): 1 | 2 | 3 | 4 | 5 | 6 {
    if (is_num(p))
        return 1;

    if (p.equals(DOLLAR_E))
        return 5;

    if (car(p).equals(DERIVATIVE) || car(p).equals(D_LOWER))
        return 6;

    if (car(p).equals(POWER)) {

        p = cadr(p); // p = base

        if (isminusone(p))
            return 3;

        if (is_num(p))
            return 2;

        if (p.equals(DOLLAR_E))
            return 5;

        if (car(p).equals(DERIVATIVE) || car(p).equals(D_LOWER))
            return 6;
    }

    return 4;
}

function partition_term($: ScriptVars): void {

    const X = pop($);
    const F = pop($);

    // push const factors

    let h = $.stack.length;
    let p1 = cdr(F);
    while (is_cons(p1)) {
        if (!findf(car(p1), X, $))
            push(car(p1), $);
        p1 = cdr(p1);
    }

    let n = $.stack.length - h;

    if (n === 0)
        push_integer(1, $);
    else if (n > 1) {
        list(n, $);
        push(MULTIPLY, $);
        swap($);
        cons($); // makes MULTIPLY head of list
    }

    // push var factors

    h = $.stack.length;
    p1 = cdr(F);
    while (is_cons(p1)) {
        if (findf(car(p1), X, $))
            push(car(p1), $);
        p1 = cdr(p1);
    }

    n = $.stack.length - h;

    if (n === 0)
        push_integer(1, $);
    else if (n > 1) {
        list(n, $);
        push(MULTIPLY, $);
        swap($);
        cons($); // makes MULTIPLY head of list
    }
}
// https://github.com/ghewgill/picomath

function erf(x: number): number {
    if (x === 0)
        return 0;

    // constants
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    // Save the sign of x
    let sign = 1;
    if (x < 0)
        sign = -1;
    x = Math.abs(x);

    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}

function erfc(x: number): number {
    return 1.0 - erf(x);
}

function pop($: ScriptVars): U {
    if ($.stack.length === 0) {
        stopf("stack error");
    }
    return $.stack.pop() as U;
}

function assert_num_to_number(p: U): number | never {
    if (is_num(p)) {
        return p.toNumber();
    }
    else {
        stopf(`assert_num_to_number() number expected ${p}`);
    }
}

function pop_double($: ScriptVars): number {

    const p = pop($);

    if (is_num(p)) {
        return p.toNumber();
    }
    else {
        stopf("pop_double() number expected");
    }
}

function pop_integer($: ScriptVars): number {

    const p = pop($);

    if (!issmallinteger(p))
        stopf("small integer expected");

    let n: number;

    if (is_rat(p)) {
        const n = bignum_smallnum(p.a);
        if (isnegativenumber(p)) {
            return -n;
        }
        else {
            return n;
        }
    }
    else {
        return (p as Flt).d;
    }

    return n;
}

function power_complex_double(_BASE: U, EXPO: U, X: U, Y: U, $: ScriptVars): void {

    push(X, $);
    let x = pop_double($);

    push(Y, $);
    let y = pop_double($);

    push(EXPO, $);
    const expo = pop_double($);

    let r = Math.sqrt(x * x + y * y);
    let theta = Math.atan2(y, x);

    r = Math.pow(r, expo);
    theta = expo * theta;

    x = r * Math.cos(theta);
    y = r * Math.sin(theta);

    push_double(x, $);
    push_double(y, $);
    push(imaginaryunit, $);
    multiply($);
    add($);
}

function power_complex_minus(X: U, Y: U, n: number, $: ScriptVars): void {

    // R = X^2 + Y^2

    push(X, $);
    push(X, $);
    multiply($);
    push(Y, $);
    push(Y, $);
    multiply($);
    add($);
    const R = pop($);

    // X = X / R

    push(X, $);
    push(R, $);
    divide($);
    X = pop($);

    // Y = -Y / R

    push(Y, $);
    negate($);
    push(R, $);
    divide($);
    Y = pop($);

    let PX = X;
    let PY = Y;

    for (let i = 1; i < n; i++) {

        push(PX, $);
        push(X, $);
        multiply($);
        push(PY, $);
        push(Y, $);
        multiply($);
        subtract($);

        push(PX, $);
        push(Y, $);
        multiply($);
        push(PY, $);
        push(X, $);
        multiply($);
        add($);

        PY = pop($);
        PX = pop($);
    }

    // X + i*Y

    push(PX, $);
    push(imaginaryunit, $);
    push(PY, $);
    multiply($);
    add($);
}

function power_complex_number(BASE: U, EXPO: U, $: ScriptVars): void {
    let X: U;
    let Y: U;

    // prefixform(2 + 3 i) = (add 2 (multiply 3 (power -1 1/2)))

    // prefixform(1 + i) = (add 1 (power -1 1/2))

    // prefixform(3 i) = (multiply 3 (power -1 1/2))

    // prefixform(i) = (power -1 1/2)

    if (car(BASE).equals(ADD)) {
        X = cadr(BASE);
        if (caaddr(BASE).equals(MULTIPLY))
            Y = cadaddr(BASE);
        else
            Y = one;
    }
    else if (car(BASE).equals(MULTIPLY)) {
        X = zero;
        Y = cadr(BASE);
    }
    else {
        X = zero;
        Y = one;
    }

    if (is_flt(X) || is_flt(Y) || is_flt(EXPO)) {
        power_complex_double(BASE, EXPO, X, Y, $);
        return;
    }

    if (!(is_rat(EXPO) && isinteger(EXPO))) {
        power_complex_rational(BASE, EXPO, X, Y, $);
        return;
    }

    if (!issmallinteger(EXPO)) {
        push(POWER, $);
        push(BASE, $);
        push(EXPO, $);
        list(3, $);
        return;
    }

    push(EXPO, $);
    const n = pop_integer($);

    if (n > 0)
        power_complex_plus(X, Y, n, $);
    else if (n < 0)
        power_complex_minus(X, Y, -n, $);
    else
        push_integer(1, $);
}

function power_complex_plus(X: U, Y: U, n: number, $: ScriptVars): void {

    let PX = X;
    let PY = Y;

    for (let i = 1; i < n; i++) {

        push(PX, $);
        push(X, $);
        multiply($);
        push(PY, $);
        push(Y, $);
        multiply($);
        subtract($);

        push(PX, $);
        push(Y, $);
        multiply($);
        push(PY, $);
        push(X, $);
        multiply($);
        add($);

        PY = pop($);
        PX = pop($);
    }

    // X + i Y

    push(PX, $);
    push(imaginaryunit, $);
    push(PY, $);
    multiply($);
    add($);
}

function power_complex_rational(_BASE: U, EXPO: U, X: U, Y: U, $: ScriptVars): void {
    // calculate sqrt(X^2 + Y^2) ^ (1/2 * EXPO)

    push(X, $);
    push(X, $);
    multiply($);
    push(Y, $);
    push(Y, $);
    multiply($);
    add($);
    push_rational(1, 2, $);
    push(EXPO, $);
    multiply($);
    power($);

    // calculate (-1) ^ (EXPO * arctan(Y, X) / Pi)

    push(Y, $);
    push(X, $);
    arctan($);
    push(Pi, $);
    divide($);
    push(EXPO, $);
    multiply($);
    EXPO = pop($);
    power_minusone(EXPO, $);

    // result = sqrt(X^2 + Y^2) ^ (1/2 * EXPO) * (-1) ^ (EXPO * arctan(Y, X) / Pi)

    multiply($);
}

function power_minusone(expo: U, $: ScriptVars): void {
    // optimization for i

    if (isequalq(expo, 1, 2)) {
        push(imaginaryunit, $);
        return;
    }

    // root is an odd number?

    if (is_rat(expo) && bignum_odd(expo.b)) {
        if (bignum_odd(expo.a))
            push_integer(-1, $);
        else
            push_integer(1, $);
        return;
    }

    if (is_rat(expo)) {
        normalize_clock_rational(expo, $);
        return;
    }

    if (is_flt(expo)) {
        normalize_clock_double(expo, $);
        rect($);
        return;
    }

    push(POWER, $);
    push_integer(-1, $);
    push(expo, $);
    list(3, $);
}

function normalize_clock_rational(expo: U, $: ScriptVars): void {

    // R = EXPO mod 2

    push(expo, $);
    push_integer(2, $);
    modfunc($);
    let R = pop($);

    // convert negative rotation to positive

    if (is_num(R) && isnegativenumber(R)) {
        push(R, $);
        push_integer(2, $);
        add($);
        R = pop($);
    }

    push(R, $);
    push_integer(2, $);
    multiply($);
    floorfunc($);
    const n = pop_integer($); // number of 90 degree turns

    push(R, $);
    push_integer(n, $);
    push_rational(-1, 2, $);
    multiply($);
    add($);
    R = pop($); // remainder

    switch (n) {

        case 0:
            if (iszero(R))
                push_integer(1, $);
            else {
                push(POWER, $);
                push_integer(-1, $);
                push(R, $);
                list(3, $);
            }
            break;

        case 1:
            if (iszero(R))
                push(imaginaryunit, $);
            else {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(POWER, $);
                push_integer(-1, $);
                push(R, $);
                push_rational(-1, 2, $);
                add($);
                list(3, $);
                list(3, $);
            }
            break;

        case 2:
            if (iszero(R))
                push_integer(-1, $);
            else {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(POWER, $);
                push_integer(-1, $);
                push(R, $);
                list(3, $);
                list(3, $);
            }
            break;

        case 3:
            if (iszero(R)) {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(imaginaryunit, $);
                list(3, $);
            }
            else {
                push(POWER, $);
                push_integer(-1, $);
                push(R, $);
                push_rational(-1, 2, $);
                add($);
                list(3, $);
            }
            break;
    }
}

function normalize_clock_double(EXPO: Flt, $: ScriptVars): void {

    let expo = EXPO.d;

    // expo = expo mod 2

    expo = expo % 2;

    // convert negative rotation to positive

    if (expo < 0)
        expo += 2;

    const n = Math.floor(2 * expo); // number of 90 degree turns

    const r = expo - n / 2; // remainder

    switch (n) {

        case 0:
            if (r === 0)
                push_integer(1, $);
            else {
                push(POWER, $);
                push_integer(-1, $);
                push_double(r, $);
                list(3, $);
            }
            break;

        case 1:
            if (r === 0)
                push(imaginaryunit, $);
            else {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(POWER, $);
                push_integer(-1, $);
                push_double(r - 0.5, $);
                list(3, $);
                list(3, $);
            }
            break;

        case 2:
            if (r === 0)
                push_integer(-1, $);
            else {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(POWER, $);
                push_integer(-1, $);
                push_double(r, $);
                list(3, $);
                list(3, $);
            }
            break;

        case 3:
            if (r === 0) {
                push(MULTIPLY, $);
                push_integer(-1, $);
                push(imaginaryunit, $);
                list(3, $);
            }
            else {
                push(POWER, $);
                push_integer(-1, $);
                push_double(r - 0.5, $);
                list(3, $);
            }
            break;
    }
}

function power_natural_number(EXPO: U, $: ScriptVars): void {

    // exp(x + i y) = exp(x) (cos(y) + i sin(y))
    let x: number;
    let y: number;

    if (isdoublez(EXPO)) {
        if (car(EXPO).equals(ADD)) {
            x = (cadr(EXPO) as Flt).d;
            y = (cadaddr(EXPO) as Flt).d;
        }
        else {
            x = 0.0;
            y = (cadr(EXPO) as Flt).d;
        }
        push_double(Math.exp(x), $);
        push_double(y, $);
        cosfunc($);
        push(imaginaryunit, $);
        push_double(y, $);
        sinfunc($);
        multiply($);
        add($);
        multiply($);
        return;
    }

    // e^log(expr) = expr

    if (car(EXPO).equals(LOG)) {
        push(cadr(EXPO), $);
        return;
    }

    if (isdenormalpolar(EXPO, $)) {
        normalize_polar(EXPO, $);
        return;
    }

    push(POWER, $);
    push(DOLLAR_E, $);
    push(EXPO, $);
    list(3, $);
}
// BASE and EXPO are numbers

function power_numbers(BASE: Num, EXPO: Num, $: ScriptVars): void {

    // n^0

    if (iszero(EXPO)) {
        push_integer(1, $);
        return;
    }

    // 0^n

    if (iszero(BASE)) {
        if (isnegativenumber(EXPO))
            stopf("divide by zero");
        push_integer(0, $);
        return;
    }

    // 1^n

    if (isplusone(BASE)) {
        push_integer(1, $);
        return;
    }

    // n^1

    if (isplusone(EXPO)) {
        push(BASE, $);
        return;
    }

    if (is_flt(BASE) || is_flt(EXPO)) {
        power_double(BASE, EXPO, $);
        return;
    }

    // integer exponent?

    if (isinteger(EXPO)) {
        // TODO: Move this into Rat.pow(Rat)
        // We can forget about EXPO.b because EXPO is an integer.
        // It's crucial that we handle negative exponents carefully.
        if (EXPO.isNegative()) {
            // (a/b)^(-n) = (b/a)^n = (b^n)/(a^n)
            const n = EXPO.a.negate();
            const a = bignum_pow(BASE.a, n);
            const b = bignum_pow(BASE.b, n);
            const X = new Rat(b, a);
            push(X, $);
        }
        else {
            const n = EXPO.a;
            const a = bignum_pow(BASE.a, n);
            const b = bignum_pow(BASE.b, n);
            const X = new Rat(a, b);
            push(X, $);
        }
        return;
    }

    // exponent is a root

    const h = $.stack.length;

    // put factors on stack

    push(POWER, $);
    push(BASE, $);
    push(EXPO, $);
    list(3, $);

    factor_factor($);

    // normalize factors

    let n = $.stack.length - h; // fix n now, stack can grow

    for (let i = 0; i < n; i++) {
        const p1 = $.stack[h + i];
        if (car(p1).equals(POWER)) {
            BASE = cadr(p1) as Num;
            EXPO = caddr(p1) as Num;
            power_numbers_factor(BASE as Rat, EXPO as Rat, $);
            $.stack[h + i] = pop($); // fill hole
        }
    }

    // combine numbers (leaves radicals on stack)

    let p1: U = one;

    for (let i = h; i < $.stack.length; i++) {
        const p2 = $.stack[i];
        if (is_num(p2)) {
            push(p1, $);
            push(p2, $);
            multiply($);
            p1 = pop($);
            $.stack.splice(i, 1);
            i--;
        }
    }

    // finalize

    n = $.stack.length - h;

    if (n === 0 || !isplusone(p1)) {
        push(p1, $);
        n++;
    }

    if (n === 1)
        return;

    sort_factors(h, $);
    list(n, $);
    push(MULTIPLY, $);
    swap($);
    cons($);
}

// BASE is an integer

function power_numbers_factor(BASE: Rat, EXPO: Rat, $: ScriptVars): void {

    if (isminusone(BASE)) {
        power_minusone(EXPO, $);
        let p0 = pop($);
        if (car(p0).equals(MULTIPLY)) {
            p0 = cdr(p0);
            while (is_cons(p0)) {
                push(car(p0), $);
                p0 = cdr(p0);
            }
        }
        else
            push(p0, $);
        return;
    }

    if (isinteger(EXPO)) {

        const a = bignum_pow(BASE.a, EXPO.a);
        const b = bignum_int(1);

        if (isnegativenumber(EXPO))
            push_bignum(1, b, a, $); // reciprocate
        else
            push_bignum(1, a, b, $);

        return;
    }

    // EXPO.a          r
    // ------ => q + ------
    // EXPO.b        EXPO.b

    const q = bignum_div(EXPO.a, EXPO.b);
    const r = bignum_mod(EXPO.a, EXPO.b);

    // process q

    if (!bignum_iszero(q)) {

        const a = bignum_pow(BASE.a, q);
        const b = bignum_int(1);

        if (isnegativenumber(EXPO))
            push_bignum(1, b, a, $); // reciprocate
        else
            push_bignum(1, a, b, $);
    }

    // process r

    const n0 = bignum_smallnum(BASE.a);

    if (typeof n0 === 'number') {
        // BASE is 32 bits or less, hence BASE is a prime number, no root
        push(POWER, $);
        push(BASE, $);
        push_bignum(EXPO.sign, r, EXPO.b, $);
        list(3, $);
        return;
    }

    // BASE was too big to factor, try finding root

    const n1 = bignum_root(BASE.a, EXPO.b);

    if (n1 === null) {
        // no root
        push(POWER, $);
        push(BASE, $);
        push_bignum(EXPO.sign, r, EXPO.b, $);
        list(3, $);
        return;
    }

    // raise n to rth power

    const n = bignum_pow(n1, r);

    if (isnegativenumber(EXPO))
        push_bignum(1, bignum_int(1), n, $); // reciprocate
    else
        push_bignum(1, n, bignum_int(1), $);
}

function power_double(BASE: Num, EXPO: Num, $: ScriptVars) {

    const base = BASE.toNumber();
    const expo = EXPO.toNumber();

    if (base > 0 || expo === Math.floor(expo)) {
        const d = Math.pow(base, expo);
        push_double(d, $);
        return;
    }

    // BASE is negative and EXPO is fractional

    power_minusone(EXPO, $);

    if (base === -1)
        return;

    const d = Math.pow(-base, expo);
    push_double(d, $);

    multiply($);
}
// BASE is a sum of terms

function power_sum(BASE: U, EXPO: U, $: ScriptVars): void {

    if (iscomplexnumber(BASE) && is_num(EXPO)) {
        power_complex_number(BASE, EXPO, $);
        return;
    }

    if ($.expanding === 0 || !issmallinteger(EXPO) || (is_num(EXPO) && isnegativenumber(EXPO))) {
        push(POWER, $);
        push(BASE, $);
        push(EXPO, $);
        list(3, $);
        return;
    }

    push(EXPO, $);
    const n = pop_integer($);

    // square the sum first (prevents infinite loop through multiply)

    const h = $.stack.length;

    let p1 = cdr(BASE);

    while (is_cons(p1)) {
        let p2 = cdr(BASE);
        while (is_cons(p2)) {
            push(car(p1), $);
            push(car(p2), $);
            multiply($);
            p2 = cdr(p2);
        }
        p1 = cdr(p1);
    }

    add_terms($.stack.length - h, $);

    // continue up to power n

    for (let i = 2; i < n; i++) {
        push(BASE, $);
        multiply($);
    }
}

export function to_sexpr(expr: U): string {
    const outbuf: string[] = [];
    prefixform(expr, outbuf);
    return outbuf.join('');
}

/**
 * prefixform means SExpr.
 */
function prefixform(p: U, outbuf: string[]) {
    if (is_cons(p)) {
        outbuf.push("(");
        try {
            prefixform(car(p), outbuf);
            p = cdr(p);
            while (is_cons(p)) {
                outbuf.push(" ");
                prefixform(car(p), outbuf);
                p = cdr(p);
            }
        }
        finally {
            outbuf.push(")");
        }
    }
    else if (is_rat(p)) {
        if (isnegativenumber(p)) {
            outbuf.push('-');
        }
        outbuf.push(bignum_itoa(p.a));
        if (isfraction(p)) {
            outbuf.push("/" + bignum_itoa(p.b));
        }
    }
    else if (is_flt(p)) {
        let s = p.d.toPrecision(6);
        if (s.indexOf("E") < 0 && s.indexOf("e") < 0 && s.indexOf(".") >= 0) {
            // remove trailing zeroes
            while (s.charAt(s.length - 1) === "0") {
                s = s.substring(0, s.length - 1);
            }
            if (s.charAt(s.length - 1) === '.') {
                s += "0";
            }
        }
        outbuf.push(s);
    }
    else if (is_sym(p)) {
        if (Pi.equalsSym(p)) {
            outbuf.push('pi');
        }
        else {
            outbuf.push(p.key());
        }
    }
    else if (is_str(p)) {
        outbuf.push(JSON.stringify(p.str));
    }
    else if (is_tensor(p)) {
        // FIXME
        outbuf.push("[ ]");
    }
    else if (is_uom(p)) {
        outbuf.push(`${p.toListString()}`);
    }
    else if (is_atom(p)) {
        outbuf.push(`${p}`);
    }
    else if (p.isnil) {
        outbuf.push(`()`);
    }
    else {
        outbuf.push(" ? ");
    }
}

function promote_tensor($: ScriptVars): void {

    const p1 = pop($);

    if (!istensor(p1)) {
        push(p1, $);
        return;
    }

    const ndim1 = p1.ndim;
    const nelem1 = p1.nelem;

    // check

    let p2 = p1.elems[0];

    for (let i = 1; i < nelem1; i++) {
        const p3 = p1.elems[i];
        if (!compatible_dimensions(p2, p3))
            stopf("tensor dimensions");
    }

    if (!istensor(p2)) {
        push(p1, $);
        return; // all elements are scalars
    }

    const ndim2 = p2.ndim;
    const nelem2 = p2.nelem;

    // alloc

    const p3 = alloc_tensor();

    // merge dimensions

    let k = 0;

    for (let i = 0; i < ndim1; i++)
        p3.dims[k++] = p1.dims[i];

    for (let i = 0; i < ndim2; i++)
        p3.dims[k++] = p2.dims[i];

    // merge elements

    k = 0;

    for (let i = 0; i < nelem1; i++) {
        p2 = p1.elems[i];
        for (let j = 0; j < nelem2; j++)
            p3.elems[k++] = (p2 as Tensor).elems[j];
    }

    push(p3, $);
}

export function push(expr: U, $: ScriptVars): void {
    $.stack.push(expr);
}

function push_double(d: number, $: ScriptVars): void {
    push(new Flt(d), $);
}
/**
 * Pushes a Rat onto the stack.
 * @param n 
 */
function push_integer(n: number, $: ScriptVars): void {
    push_rational(n, 1, $);
}
/**
 * Pushes a Rat onto the stack.
 * @param a 
 * @param b 
 */
function push_rational(a: number, b: number, $: ScriptVars): void {
    push(create_rat(a, b), $);
}

export function push_string(s: string, $: ScriptVars) {
    push(new Str(s), $);
}

function reciprocate($: ScriptVars): void {
    push_integer(-1, $);
    power($);
}

function reduce_radical_double(h: number, COEFF: Flt, $: ScriptVars): Flt {

    let c = COEFF.d;

    let n = $.stack.length;

    for (let i = h; i < n; i++) {

        const p1 = $.stack[i];

        if (isradical(p1)) {

            push(cadr(p1), $); // base
            const a = pop_double($);

            push(caddr(p1), $); // exponent
            const b = pop_double($);

            c = c * Math.pow(a, b); // a > 0 by isradical above

            $.stack.splice(i, 1); // remove factor

            i--; // use same index again
            n--;
        }
    }

    push_double(c, $);
    const C = pop($) as Flt;

    return C;
}

function reduce_radical_factors(h: number, COEFF: Num, $: ScriptVars): Num {
    if (!any_radical_factors(h, $))
        return COEFF;

    if (is_rat(COEFF))
        return reduce_radical_rational(h, COEFF, $);
    else
        return reduce_radical_double(h, COEFF, $);
}

function reduce_radical_rational(h: number, COEFF: Rat, $: ScriptVars): Rat {

    if (isplusone(COEFF) || isminusone(COEFF))
        return COEFF; // COEFF has no factors, no cancellation is possible

    push(COEFF, $);
    absfunc($);
    let p1 = pop($);

    push(p1, $);
    numerator($);
    let NUMER = pop($);

    push(p1, $);
    denominator($);
    let DENOM = pop($);

    let k = 0;

    const n = $.stack.length;

    for (let i = h; i < n; i++) {
        p1 = $.stack[i];
        if (!isradical(p1))
            continue;
        const BASE = cadr(p1);
        const EXPO = caddr(p1);
        if (is_num(EXPO) && isnegativenumber(EXPO)) {
            mod_integers(NUMER as Rat, BASE as Rat, $);
            const p2 = pop($);
            if (iszero(p2)) {
                push(NUMER, $);
                push(BASE, $);
                divide($);
                NUMER = pop($);
                push(POWER, $);
                push(BASE, $);
                push_integer(1, $);
                push(EXPO, $);
                add($);
                list(3, $);
                $.stack[i] = pop($);
                k++;
            }
        }
        else {
            mod_integers(DENOM as Rat, BASE as Rat, $);
            const p2 = pop($);
            if (iszero(p2)) {
                push(DENOM, $);
                push(BASE, $);
                divide($);
                DENOM = pop($);
                push(POWER, $);
                push(BASE, $);
                push_integer(-1, $);
                push(EXPO, $);
                add($);
                list(3, $);
                $.stack[i] = pop($);
                k++;
            }
        }
    }

    if (k) {
        push(NUMER, $);
        push(DENOM, $);
        divide($);
        if (isnegativenumber(COEFF))
            negate($);
        COEFF = pop($) as Rat;
    }

    return COEFF;
}

export function restore_symbol($: ScriptVars): void {
    const p3 = $.frame.pop() as U;
    const p2 = $.frame.pop() as U;
    const p1 = assert_sym($.frame.pop() as U);
    set_symbol(p1, p2, p3, $);
}

export interface ScriptContentHandler {
    begin($: ScriptVars): void;
    output(value: U, input: U, $: ScriptVars): void;
    end($: ScriptVars): void;
}
export interface ScriptErrorHandler {
    error(inbuf: string, start: number, end: number, err: unknown, $: ScriptVars): void
}

export class PrintScriptErrorHandler implements ScriptErrorHandler {
    error(inbuf: string, start: number, end: number, err: unknown, $: ScriptVars): void {
        const s = html_escape_and_colorize(inbuf.substring(start, end) + "\nStop: " + err, ColorCode.RED);
        broadcast(s, $);
    }
}

/**
 * 
 * @param sourceText 
 * @param config 
 * @param errorHandler 
 * @param $ The scripting context, assumed to have been initialized.
 * @returns 
 */
export function parse_eigenmath_script(sourceText: string, config: EigenmathParseConfig, errorHandler: ScriptErrorHandler, $: ScriptVars): U[] {
    const exprs: U[] = [];
    try {
        $.inbuf = sourceText;

        let k = 0;

        for (; ;) {

            k = scan_inbuf(k, $, config);

            if (k === 0) {
                break; // end of input
            }

            const input = pop($);
            exprs.push(input);
        }
    }
    catch (errmsg) {
        if (errmsg instanceof Error) {
            if ($.trace1 < $.trace2 && $.inbuf[$.trace2 - 1] === '\n') {
                $.trace2--;
            }
            errorHandler.error($.inbuf, $.trace1, $.trace2, errmsg, $);
        }
        else if ((errmsg as string).length > 0) {
            if ($.trace1 < $.trace2 && $.inbuf[$.trace2 - 1] === '\n') {
                $.trace2--;
            }
            errorHandler.error($.inbuf, $.trace1, $.trace2, errmsg, $);
        }
    }
    finally {
        // term?
    }
    return exprs;
}

export function save_symbol(p: Sym, $: ScriptVars): void {
    $.frame.push(p);
    $.frame.push(get_binding(p, $));
    $.frame.push(get_usrfunc(p, $));
}
const T_INTEGER = 1001;
const T_DOUBLE = 1002;
const T_SYMBOL = 1003;
const T_FUNCTION = 1004;
const T_NEWLINE = 1005;
const T_STRING = 1006;
const T_GTEQ = 1007;
const T_LTEQ = 1008;
const T_EQ = 1009;
const T_EXPONENTIATION = 1010;
const T_END = 1011;

/**
 * TODO: Push into ScriptVars?
 */
let scanning_integrals: boolean = false;
let instring: string;
let scan_index: number;
let scan_level: number;
let token: number | string;
let token_index: number;
let token_buf: string;

function scan(s: string, k: number, $: ScriptVars, config: EigenmathParseConfig) {
    scanning_integrals = false;
    return scan_nib(s, k, $, config);
}

function scan_integrals(s: string, $: ScriptVars, config: EigenmathParseConfig): number {
    scanning_integrals = true;
    return scan_nib(s, 0, $, config);
}

function scan_nib(s: string, k: number, $: ScriptVars, config: EigenmathParseConfig): number {
    instring = s;
    scan_index = k;
    scan_level = 0;

    get_token_skip_newlines($, config);

    if (token === T_END)
        return 0;

    scan_stmt($, config);

    if (token !== T_NEWLINE && token !== T_END)
        scan_error("expected newline", $);

    return scan_index;
}

function scan_stmt($: ScriptVars, config: EigenmathParseConfig) {
    scan_relational_expr($, config);
    if (token === "=") {
        get_token_skip_newlines($, config); // get token after =
        push(ASSIGN, $);
        swap($);
        scan_relational_expr($, config);
        list(3, $);
    }
}

/**
 * 
 */
function scan_relational_expr($: ScriptVars, config: EigenmathParseConfig): void {
    scan_additive_expr($, config);
    switch (token) {
        case T_EQ:
            push(TESTEQ, $);
            break;
        case T_LTEQ:
            push(TESTLE, $);
            break;
        case T_GTEQ:
            push(TESTGE, $);
            break;
        case "<":
            push(TESTLT, $);
            break;
        case ">":
            push(TESTGT, $);
            break;
        default:
            return;
    }
    swap($);
    get_token_skip_newlines($, config); // get token after rel op
    scan_additive_expr($, config);
    list(3, $);
}

function scan_additive_expr($: ScriptVars, config: EigenmathParseConfig): void {
    const h = $.stack.length;
    let t = token;
    if (token === "+" || token === "-")
        get_token_skip_newlines($, config);
    scan_multiplicative_expr($, config);
    if (t === "-")
        static_negate($);
    while (token === "+" || token === "-") {
        t = token;
        get_token_skip_newlines($, config); // get token after + or -
        scan_multiplicative_expr($, config);
        if (t === "-")
            static_negate($);
    }
    if ($.stack.length - h > 1) {
        list($.stack.length - h, $);
        push(ADD, $);
        swap($);
        cons($);
    }
}

function scan_multiplicative_expr($: ScriptVars, config: EigenmathParseConfig): void {
    const h = $.stack.length;

    scan_power($, config);

    while (is_multiplicative_operator_or_factor_pending(config)) {

        const t = token;

        if (token === "*" || token === "/") {
            get_token_skip_newlines($, config);
        }

        scan_power($, config);

        if (t === "/") {
            static_reciprocate($);
        }
    }

    if ($.stack.length - h > 1) {
        list($.stack.length - h, $);
        push(MULTIPLY, $);
        swap($);
        cons($);
    }
}

/**
 * '*' | '/' | Sym | Function | Integer | Double | String | '[' | '('
 */
function is_multiplicative_operator_or_factor_pending(config: EigenmathParseConfig): boolean {
    if (config.useParenForTensors) {
        if (token === "(") {
            return true;
        }
    }
    else {
        if (token === "[") {
            return true;
        }
    }
    switch (token) {
        case "*":
        case "/":
        case T_SYMBOL:
        case T_FUNCTION:
        case T_INTEGER:
        case T_DOUBLE:
        case T_STRING:
            return true;
        default:
            break;
    }
    return false;
}

function scan_power($: ScriptVars, config: EigenmathParseConfig) {
    scan_factor($, config);

    if (config.useCaretForExponentiation) {
        if (token === "^") {
            get_token_skip_newlines($, config);
            push(POWER, $);
            swap($);
            scan_power($, config);
            list(3, $);
        }
    }
    else {
        if (token === T_EXPONENTIATION) {
            get_token_skip_newlines($, config);
            push(POWER, $);
            swap($);
            scan_power($, config);
            list(3, $);
        }
    }
}

function scan_factor($: ScriptVars, config: EigenmathParseConfig): void {

    const h = $.stack.length;

    switch (token) {
        // We should really be checking config.useParenForTensors here
        case "(":
        case "[":
            scan_subexpr($, config);
            break;

        case T_SYMBOL:
            scan_symbol($, config);
            break;

        case T_FUNCTION:
            scan_function_call($, config);
            break;

        case T_INTEGER: {
            const a = bignum_atoi(token_buf);
            const b = bignum_int(1);
            push_bignum(1, a, b, $);
            get_token($, config);
            break;
        }
        case T_DOUBLE: {
            const d = parseFloat(token_buf);
            push_double(d, $);
            get_token($, config);
            break;
        }
        case T_STRING:
            scan_string($, config);
            break;

        default:
            scan_error("expected operand", $);
    }

    // index

    if ((token as string) === "[") {

        scan_level++;

        get_token($, config); // get token after [
        push(INDEX, $);
        swap($);

        scan_additive_expr($, config);

        while (token as string === ",") {
            get_token($, config); // get token after ,
            scan_additive_expr($, config);
        }

        if (token as string !== "]")
            scan_error("expected ]", $);

        scan_level--;

        get_token($, config); // get token after ]

        list($.stack.length - h, $);
    }

    while ((token as string) === "!") {
        get_token($, config); // get token after !
        push(FACTORIAL, $);
        swap($);
        list(2, $);
    }
}

/**
 * See InputState.tokenToSym
 */
function scan_symbol($: ScriptVars, config: EigenmathParseConfig): void {
    if (scanning_integrals && token_buf.length === 1) {
        // When scanning inegrals, we don't make user symbols out of the special variables, a, b, and x.
        switch (token_buf[0]) {
            case "a":
                push(DOLLAR_A, $);
                break;
            case "b":
                push(DOLLAR_B, $);
                break;
            case "x":
                push(DOLLAR_X, $);
                break;
            default:
                push(lookup(create_sym(token_buf), $), $);
                break;
        }
    }
    else {
        push(lookup(create_sym(token_buf), $), $);
    }
    get_token($, config);
}

function scan_string($: ScriptVars, config: EigenmathParseConfig): void {
    push_string(token_buf, $);
    get_token($, config);
}

function scan_function_call($: ScriptVars, config: EigenmathParseConfig): void {
    const h = $.stack.length;
    scan_level++;
    push(lookup(create_sym(token_buf), $), $); // push function name
    get_token($, config); // get token after function name
    get_token($, config); // get token after (
    if (token === ")") {
        scan_level--;
        get_token($, config); // get token after )
        list(1, $); // function call with no args
        return;
    }
    scan_stmt($, config);
    while (token === ",") {
        get_token($, config); // get token after ,
        scan_stmt($, config);
    }
    if (token !== ")")
        scan_error("expected )", $);
    scan_level--;
    get_token($, config); // get token after )
    list($.stack.length - h, $);
}

function scan_subexpr($: ScriptVars, config: EigenmathParseConfig): void {
    const h = $.stack.length;

    scan_level++;

    get_token($, config); // get token after "(" or "["

    scan_stmt($, config);

    while (token === ",") {
        get_token($, config); // get token after ,
        scan_stmt($, config);
    }

    if (config.useParenForTensors) {
        if (token !== ")") {
            scan_error("expected )", $);
        }
    }
    else {
        if (token !== "]") {
            scan_error("expected ]", $);
        }
    }

    scan_level--;

    get_token($, config); // get token after ")" or "]""

    if ($.stack.length - h > 1) {
        vector(h, $);
    }
}

function get_token_skip_newlines($: ScriptVars, config: EigenmathParseConfig): void {
    scan_level++;
    get_token($, config);
    scan_level--;
}

function get_token($: ScriptVars, config: EigenmathParseConfig): void {
    get_token_nib($, config);

    if (scan_level)
        while (token === T_NEWLINE)
            get_token_nib($, config); // skip over newlines
}

export interface EigenmathParseConfig {
    useCaretForExponentiation: boolean;
    useParenForTensors: boolean;
}

function get_token_nib($: ScriptVars, config: EigenmathParseConfig): void {
    let c: string;

    // skip spaces

    for (; ;) {
        c = inchar();
        if (c === "" || c === "\n" || c === "\r" || (c.charCodeAt(0) > 32 && c.charCodeAt(0) < 127))
            break;
        scan_index++;
    }

    token_index = scan_index;

    // end of input?

    if (c === "") {
        token = T_END;
        return;
    }

    scan_index++;

    // newline?

    if (c === "\n" || c === "\r") {
        token = T_NEWLINE;
        return;
    }

    // comment?

    if (c === "#" || (c === "-" && inchar() === "-")) {

        while (inchar() !== "" && inchar() !== "\n")
            scan_index++;

        if (inchar() === "\n") {
            scan_index++;
            token = T_NEWLINE;
        }
        else {
            token = T_END;
        }

        return;
    }

    // number?

    if (isdigit(c) || c === ".") {

        while (isdigit(inchar()))
            scan_index++;

        if (inchar() === ".") {

            scan_index++;

            while (isdigit(inchar()))
                scan_index++;

            if (scan_index - token_index === 1)
                scan_error("expected decimal digit", $); // only a decimal point

            token = T_DOUBLE;
        }
        else {
            token = T_INTEGER;
        }

        update_token_buf(token_index, scan_index);

        return;
    }

    // symbol or function call?

    if (isalpha(c)) {

        while (isalnum(inchar()))
            scan_index++;

        if (inchar() === "(")
            token = T_FUNCTION;
        else
            token = T_SYMBOL;

        update_token_buf(token_index, scan_index);

        return;
    }

    // string ?

    if (c === "\"") {
        while (inchar() !== "" && inchar() !== "\n" && inchar() !== "\"")
            scan_index++;
        if (inchar() !== "\"") {
            token_index = scan_index; // no token
            scan_error("runaway string", $);
        }
        scan_index++;
        token = T_STRING;
        update_token_buf(token_index + 1, scan_index - 1); // don't include quote chars
        return;
    }

    // relational operator?

    if (c === "=" && inchar() === "=") {
        scan_index++;
        token = T_EQ;
        return;
    }

    if (c === "<" && inchar() === "=") {
        scan_index++;
        token = T_LTEQ;
        return;
    }

    if (c === ">" && inchar() === "=") {
        scan_index++;
        token = T_GTEQ;
        return;
    }

    // exponentiation
    if (config.useCaretForExponentiation) {
        // Do nothing
    }
    else {
        // We're using the ** exponentiation operator syntax.
        if (c === "*" && inchar() === "*") {
            scan_index++;
            token = T_EXPONENTIATION;
            return;
        }
    }

    // single char token

    token = c;
}

function update_token_buf(j: number, k: number): void {
    token_buf = instring.substring(j, k);
}

function scan_error(s: string, $: ScriptVars): never {
    let t = $.inbuf.substring($.trace1, scan_index);

    t += "\nStop: Syntax error, " + s;

    if (token_index < scan_index) {
        t += " instead of ";
        t += instring.substring(token_index, scan_index);
    }

    const escaped = html_escape_and_colorize(t, ColorCode.RED);

    broadcast(escaped, $);

    stopf("");
}

function inchar(): string {
    return instring.charAt(scan_index); // returns empty string if index out of range
}

export function scan_inbuf(k: number, $: ScriptVars, config: EigenmathParseConfig): number {
    $.trace1 = k;
    k = scan($.inbuf, k, $, config);
    if (k) {
        $.trace2 = k;
        trace_source_text($);
    }
    return k;
}

export function set_symbol(sym: Sym, binding: U, usrfunc: U, $: ScriptVars): void {
    if (!$.hasUserFunction(sym)) {
        stopf("symbol error");
    }
    $.setBinding(sym, binding);
    $.setUserFunction(sym, usrfunc);
}

export function set_binding(sym: Sym, binding: U, $: ScriptVars): void {
    if (!$.hasUserFunction(sym)) {
        stopf("symbol error");
    }
    $.setBinding(sym, binding);
}
export function set_user_function(sym: Sym, usrfunc: U, $: ScriptVars): void {
    if (!$.hasUserFunction(sym)) {
        stopf("symbol error");
    }
    $.setUserFunction(sym, usrfunc);
}

function sort(n: number, $: ScriptVars): void {
    const compareFn = (lhs: U, rhs: U) => cmp(lhs, rhs);
    const t = $.stack.splice($.stack.length - n).sort(compareFn);
    $.stack = $.stack.concat(t);
}

function sort_factors(h: number, $: ScriptVars): void {
    const compareFn = (lhs: U, rhs: U) => cmp_factors(lhs, rhs);
    const t = $.stack.splice(h).sort(compareFn);
    $.stack = $.stack.concat(t);
}

function sort_factors_provisional(h: number, $: ScriptVars): void {
    const compareFn = (lhs: U, rhs: U) => cmp_factors_provisional(lhs, rhs);
    const t = $.stack.splice(h).sort(compareFn);
    $.stack = $.stack.concat(t);
}

function static_negate($: ScriptVars): void {
    const p1 = pop($);

    if (is_num(p1)) {
        push(p1, $);
        negate($);
        return;
    }

    if (car(p1).equals(MULTIPLY)) {
        push(MULTIPLY, $);
        if (is_num(cadr(p1))) {
            push(cadr(p1), $);
            negate($);
            push(cddr(p1), $);
        }
        else {
            push_integer(-1, $);
            push(cdr(p1), $);
        }
        cons($);
        cons($);
        return;
    }

    push(MULTIPLY, $);
    push_integer(-1, $);
    push(p1, $);
    list(3, $);
}

function static_reciprocate($: ScriptVars): void {
    const p2 = pop($);
    const p1 = pop($);

    // save divide by zero error for runtime

    if (iszero(p2)) {
        if (!(is_rat(p1) && isinteger1(p1)))
            push(p1, $);
        push(POWER, $);
        push(p2, $);
        push_integer(-1, $);
        list(3, $);
        return;
    }

    if (is_num(p1) && is_num(p2)) {
        push(p1, $);
        push(p2, $);
        divide($);
        return;
    }

    if (is_num(p2)) {
        if (!(is_rat(p1) && isinteger1(p1)))
            push(p1, $);
        push(p2, $);
        reciprocate($);
        return;
    }

    if (car(p2).equals(POWER) && is_num(caddr(p2))) {
        if (!(is_rat(p1) && isinteger1(p1)))
            push(p1, $);
        push(POWER, $);
        push(cadr(p2), $);
        push(caddr(p2), $);
        negate($);
        list(3, $);
        return;
    }

    if (!(is_rat(p1) && isinteger1(p1)))
        push(p1, $);

    push(POWER, $);
    push(p2, $);
    push_integer(-1, $);
    list(3, $);
}

export function stopf(errmsg: string): never {
    throw new Error(errmsg);
}

function subtract($: ScriptVars): void {
    negate($);
    add($);
}

/**
 * ( x y => y x )
 */
function swap($: ScriptVars): void {
    const p2 = pop($);
    const p1 = pop($);
    push(p2, $);
    push(p1, $);
}

function trace_source_text($: ScriptVars): void {
    const p1 = get_binding(TRACE, $);
    if (!p1.equals(TRACE) && !iszero(p1)) {
        const escaped = html_escape_and_colorize(instring.substring($.trace1, $.trace2), ColorCode.BLUE);
        broadcast(escaped, $);
    }
}

/**
 * Sends the `text` to all output listeners.
 */
export function broadcast(text: string, $: ScriptVars): void {
    for (const listener of $.listeners) {
        listener.output(text);
    }
}

export interface ScriptOutputListener {
    output(output: string): void;
}

export class ScriptVars implements ExprContext {
    inbuf: string = "";
    /**
     * The start index into inbuf.
     */
    trace1: number = -1;
    /**
     * The end index into inbuf.
     */
    trace2: number = -1;
    stack: U[] = [];
    frame: U[] = [];
    // TODO: Change this to a Map
    binding: { [key: string]: U } = {};
    usrfunc: { [key: string]: U } = {};
    eval_level: number = -1;
    expanding: number = -1;
    drawing: number = -1;
    nonstop: number = -1;
    listeners: ScriptOutputListener[] = [];
    readonly #prolog: string[] = [];
    readonly #userFunctions: Map<string, UserFunction> = new Map();
    constructor() {
        this.defineUserSymbol(Pi);
        this.defineUserSymbol(DOLLAR_E);

        this.defineUserSymbol(LAST);
        this.defineUserSymbol(TRACE);
        this.defineUserSymbol(TTY);

        this.defineUserSymbol(D_LOWER);
        this.defineUserSymbol(I_LOWER);
        this.defineUserSymbol(J_LOWER);
        this.defineUserSymbol(X_LOWER);

        this.defineUserSymbol(DOLLAR_A);
        this.defineUserSymbol(DOLLAR_B);
        this.defineUserSymbol(DOLLAR_X);

        this.defineUserSymbol(ARG1);
        this.defineUserSymbol(ARG2);
        this.defineUserSymbol(ARG3);
        this.defineUserSymbol(ARG4);
        this.defineUserSymbol(ARG5);
        this.defineUserSymbol(ARG6);
        this.defineUserSymbol(ARG7);
        this.defineUserSymbol(ARG8);
        this.defineUserSymbol(ARG9);
    }
    init(): void {
        this.eval_level = 0;
        this.expanding = 1;
        this.drawing = 0;
        this.nonstop = 0;

        this.stack = [];
        this.frame = [];

        this.binding = {};
        this.usrfunc = {};

        push(POWER, this);
        push_integer(-1, this);
        push_rational(1, 2, this);
        list(3, this);
        imaginaryunit = pop(this);
    }
    executeProlog(script: string[]): void {
        // The configuration should match the syntax in the initialization script.
        const config: EigenmathParseConfig = { useCaretForExponentiation: true, useParenForTensors: true };
        const n = script.length;

        for (let i = 0; i < n; i++) {
            scan(script[i], 0, this, config);
            value_of(this);
            pop(this);
        }
    }
    defineUserSymbol(sym: Sym): void {
        this.#userFunctions.set(sym.key(), eval_user_symbol);
    }
    getBinding(sym: Sym): U {
        assert_sym(sym);
        return this.binding[sym.key()];
    }
    getUserFunction(sym: Sym): U {
        assert_sym(sym);
        return this.usrfunc[sym.key()];
    }
    hasBinding(sym: Sym): boolean {
        return consFunctions.has(sym.key());
    }
    hasUserFunction(sym: Sym): boolean {
        return this.#userFunctions.has(sym.key());
    }
    setBinding(sym: Sym, binding: U): void {
        this.binding[sym.key()] = binding;
    }
    setUserFunction(sym: Sym, usrfunc: U): void {
        this.usrfunc[sym.key()] = usrfunc;
    }
    valueOf(expr: U): U {
        push(expr, this);
        value_of(this);
        return pop(this);
    }
    /**
     * 
     */
    defineFunction(name: Sym, lambda: LambdaExpr): void {
        assert_sym(name);
        const handler: ConsFunction = (expr: Cons, $: ScriptVars) => {
            const retval = lambda(assert_cons(expr).argList, $);
            push(retval, $);
        };
        consFunctions.set(name.key(), handler);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addOutputListener(listener: ScriptOutputListener): void {
        this.listeners.push(listener);
    }
    removeOutputListener(listener: ScriptOutputListener): void {
        const index = this.listeners.findIndex((value) => value === listener);
        this.listeners.splice(index, 1);
    }
}

const zero: Rat = create_rat(0, 1);
const one: Rat = create_rat(1, 1);
const minusone: Rat = create_rat(-1, 1);
let imaginaryunit: U;

interface ConsFunction {
    (x: Cons, $: ScriptVars): void
}

interface UserFunction {
    (x: Sym, $: ScriptVars): void
}

/**
 * TODO: Move inside ScriptVars
 */
const consFunctions: Map<string, ConsFunction> = new Map();

export function define_cons_function(sym: Sym, func: ConsFunction): void {
    consFunctions.set(sym.key(), func);
}

define_cons_function(ABS, eval_abs);
define_cons_function(ADD, eval_add);
define_cons_function(ADJ, eval_adj);
define_cons_function(ALGEBRA, eval_algebra);
define_cons_function(ARCCOS, eval_arccos);
define_cons_function(ARCCOSH, eval_arccosh);
define_cons_function(ARCSIN, eval_arcsin);
define_cons_function(ARCSINH, eval_arcsinh);
define_cons_function(ARCTAN, eval_arctan);
define_cons_function(ARCTANH, eval_arctanh);
define_cons_function(AND, eval_and);
define_cons_function(ARG, eval_arg);
define_cons_function(BINDING, eval_binding);
define_cons_function(CEILING, eval_ceiling);
define_cons_function(CHECK, eval_check);
define_cons_function(CIRCEXP, eval_circexp);
define_cons_function(CLEAR, eval_clear);
define_cons_function(CLOCK, eval_clock);
define_cons_function(COFACTOR, eval_cofactor);
define_cons_function(CONJ, eval_conj);
define_cons_function(CONTRACT, eval_contract);
define_cons_function(COS, eval_cos);
define_cons_function(COSH, eval_cosh);
define_cons_function(DEFINT, eval_defint);
define_cons_function(DENOMINATOR, eval_denominator);
define_cons_function(DET, eval_det);
define_cons_function(DERIVATIVE, eval_derivative);
define_cons_function(DIM, eval_dim);
define_cons_function(DO, eval_do);
define_cons_function(DOT, eval_dot);
define_cons_function(EIGENVEC, eval_eigenvec);
define_cons_function(ERF, eval_erf);
define_cons_function(ERFC, eval_erfc);
define_cons_function(EVAL, eval_eval);
define_cons_function(EXIT, eval_exit);
define_cons_function(EXP, eval_exp);
define_cons_function(EXPCOS, eval_expcos);
define_cons_function(EXPCOSH, eval_expcosh);
define_cons_function(EXPSIN, eval_expsin);
define_cons_function(EXPSINH, eval_expsinh);
define_cons_function(EXPTAN, eval_exptan);
define_cons_function(EXPTANH, eval_exptanh);
define_cons_function(FACTORIAL, eval_factorial);
define_cons_function(FLOAT, eval_float);
define_cons_function(FLOOR, eval_floor);
define_cons_function(INTEGRAL, eval_integral);
define_cons_function(LOG, eval_log);
define_cons_function(MULTIPLY, eval_multiply);
define_cons_function(POWER, eval_power);
define_cons_function(ROTATE, eval_rotate);
define_cons_function(INDEX, eval_index);
define_cons_function(ASSIGN, eval_assign);
define_cons_function(SIN, eval_sin);
define_cons_function(SINH, eval_sinh);
define_cons_function(SQRT, eval_sqrt);
define_cons_function(TAN, eval_tan);
define_cons_function(TANH, eval_tanh);
define_cons_function(TAU, eval_tau);
define_cons_function(TESTEQ, eval_testeq);
define_cons_function(TESTGE, eval_testge);
define_cons_function(TESTGT, eval_testgt);
define_cons_function(TESTLE, eval_testle);
define_cons_function(TESTLT, eval_testlt);

define_cons_function(FOR, eval_for);
define_cons_function(HADAMARD, eval_hadamard);
define_cons_function(IMAG, eval_imag);
define_cons_function(INNER, eval_inner);
define_cons_function(INV, eval_inv);
define_cons_function(KRONECKER, eval_kronecker);
define_cons_function(MAG, eval_mag);
define_cons_function(MINOR, eval_minor);
define_cons_function(MINORMATRIX, eval_minormatrix);
define_cons_function(MOD, eval_mod);
define_cons_function(NOEXPAND, eval_noexpand);
define_cons_function(NOT, eval_not);
define_cons_function(NROOTS, eval_nroots);
define_cons_function(NUMBER, eval_number);
define_cons_function(NUMERATOR, eval_numerator);
define_cons_function(OR, eval_or);
define_cons_function(OUTER, eval_outer);
define_cons_function(POLAR, eval_polar);
define_cons_function(PREFIXFORM, eval_prefixform);
define_cons_function(PRODUCT, eval_product);
define_cons_function(QUOTE, eval_quote);
define_cons_function(RANK, eval_rank);
define_cons_function(RATIONALIZE, eval_rationalize);
define_cons_function(REAL, eval_real);
define_cons_function(RECT, eval_rect);
define_cons_function(ROOTS, eval_roots);
define_cons_function(SGN, eval_sgn);
define_cons_function(SIMPLIFY, eval_simplify);
define_cons_function(STATUS, eval_status);
define_cons_function(STOP, eval_stop);
define_cons_function(SUBST, eval_subst);
define_cons_function(SUM, eval_sum);
define_cons_function(TAYLOR, eval_taylor);
define_cons_function(TEST, eval_test);
define_cons_function(TRANSPOSE, eval_transpose);
define_cons_function(UNIT, eval_unit);
define_cons_function(UOM, eval_uom);
define_cons_function(ZERO, eval_zero);

function vector(h: number, $: ScriptVars): void {
    const n = $.stack.length - h;
    const v = new Tensor([n], $.stack.splice(h, n));
    push(v, $);
}