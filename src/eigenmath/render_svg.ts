import { Blade, Boo, create_flt, create_sym, Flt, is_blade, is_boo, is_flt, is_num, is_rat, is_str, is_sym, is_tensor, is_uom, Num, Rat, Str, Sym, Tensor, Uom } from "math-expression-atoms";
import { is_native, Native, native_sym } from "math-expression-native";
import { car, cdr, Cons, cons as create_cons, is_atom, is_cons, is_nil, nil, U } from "math-expression-tree";
import { is_imu } from "../operators/imu/is_imu";
import { cadddr, caddr, cadr, cddddr, cddr } from "../tree/helpers";
import { Imu } from "../tree/imu/Imu";
import { bignum_itoa } from "./bignum_itoa";
import { count_denominators } from "./count_denominators";
import { find_denominator } from "./find_denominator";
import { fmtnum } from "./fmtnum";
import { isdenominator } from "./isdenominator";
import { isdigit } from "./isdigit";
import { isfraction } from "./isfraction";
import { isimaginaryunit } from "./isimaginaryunit";
import { isinteger } from "./isinteger";
import { isminusone } from "./isminusone";
import { isnegativenumber } from "./isnegativenumber";
import { isnegativeterm } from "./isnegativeterm";
import { isnumerator } from "./isnumerator";
import { isposint } from "./isposint";
import { printname_from_symbol } from "./printname_from_symbol";

const ADD = native_sym(Native.add);
const ASSIGN = native_sym(Native.assign);
const DERIVATIVE = native_sym(Native.derivative);
const FACTORIAL = native_sym(Native.factorial);
const INDEX = native_sym(Native.component);
const MULTIPLY = native_sym(Native.multiply);
const POWER = native_sym(Native.pow);
const TESTEQ = native_sym(Native.testeq);
const TESTGE = native_sym(Native.testge);
const TESTGT = native_sym(Native.testgt);
const TESTLE = native_sym(Native.testle);
const TESTLT = native_sym(Native.testlt);

const DOLLAR_E = create_sym("$e");

const HPAD = 10;
const VPAD = 10;

const TABLE_HSPACE = 12;
const TABLE_VSPACE = 10;

const DELIM_STROKE = 0.09;
const FRAC_STROKE = 0.07;

const LEFT_PAREN = 40;
const RIGHT_PAREN = 41;
const LESS_SIGN = 60;
const EQUALS_SIGN = 61;
const GREATER_SIGN = 62;
const LOWER_F = 102;
const LOWER_N = 110;

const PLUS_SIGN = 177;
const MINUS_SIGN = 178;
const MULTIPLY_SIGN = 179;
const GREATEREQUAL = 180;
const LESSEQUAL = 181;

const EMIT_SPACE = 1;
const EMIT_CHAR = 2;
const EMIT_LIST = 3;
const EMIT_SUPERSCRIPT = 4;
const EMIT_SUBSCRIPT = 5;
const EMIT_SUBEXPR = 6;
const EMIT_SMALL_SUBEXPR = 7;
const EMIT_FRACTION = 8;
const EMIT_SMALL_FRACTION = 9;
const EMIT_TABLE = 10;

const FONT_SIZE = 24;
const SMALL_FONT_SIZE = 18;

const FONT_CAP_HEIGHT = 1356;
const FONT_DESCENT = 443;
const FONT_XHEIGHT = 916;

const ROMAN_FONT = 1;
const ITALIC_FONT = 2;
const SMALL_ROMAN_FONT = 3;
const SMALL_ITALIC_FONT = 4;

function list(n: number, $: StackContext): void {
    $.stack.push(nil);
    for (let i = 0; i < n; i++) {
        cons($);
    }
}
function cons($: StackContext): void {
    const pop1 = $.stack.pop()!;
    const pop2 = $.stack.pop()!;
    $.stack.push(create_cons(pop2, pop1));
}

function get_cap_height(font_num: number): number {
    switch (font_num) {
        case ROMAN_FONT:
        case ITALIC_FONT:
            return FONT_CAP_HEIGHT * FONT_SIZE / 2048;
        case SMALL_ROMAN_FONT:
        case SMALL_ITALIC_FONT:
            return FONT_CAP_HEIGHT * SMALL_FONT_SIZE / 2048;
        default: throw new Error();
    }
}

function get_descent(font_num: number): number {
    switch (font_num) {
        case ROMAN_FONT:
        case ITALIC_FONT:
            return FONT_DESCENT * FONT_SIZE / 2048;
        case SMALL_ROMAN_FONT:
        case SMALL_ITALIC_FONT:
            return FONT_DESCENT * SMALL_FONT_SIZE / 2048;
        default: throw new Error();
    }
}

const roman_descent_tab = [

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    //	  ! " # $ % & ' ( ) * + , - . / 0 1 2 3 4 5 6 7 8 9 : ; < = > ?
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    //	@ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [   ] ^ _
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1,

    //	` a b c d e f g h i j k l m n o p q r s t u v w x y z { | } ~
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0,

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // upper case greek
    0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, // lower case greek

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const italic_descent_tab = [

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    //	  ! " # $ % & ' ( ) * + , - . / 0 1 2 3 4 5 6 7 8 9 : ; < = > ?
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    //	@ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [   ] ^ _
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1,

    //	` a b c d e f g h i j k l m n o p q r s t u v w x y z { | } ~
    0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0,

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // upper case greek
    0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, // lower case greek

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

function get_char_depth(font_num: number, char_num: number) {
    switch (font_num) {
        case ROMAN_FONT:
        case SMALL_ROMAN_FONT:
            return get_descent(font_num) * roman_descent_tab[char_num];
        case ITALIC_FONT:
        case SMALL_ITALIC_FONT:
            return get_descent(font_num) * italic_descent_tab[char_num];
        default: throw new Error();
    }
}

const roman_width_tab = [

    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,

    512, 682, 836, 1024, 1024, 1706, 1593, 369,		// printable ascii
    682, 682, 1024, 1155, 512, 682, 512, 569,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 569, 569, 1155, 1155, 1155, 909,
    1886, 1479, 1366, 1366, 1479, 1251, 1139, 1479,
    1479, 682, 797, 1479, 1251, 1821, 1479, 1479,
    1139, 1479, 1366, 1139, 1251, 1479, 1479, 1933,
    1479, 1479, 1251, 682, 569, 682, 961, 1024,
    682, 909, 1024, 909, 1024, 909, 682, 1024,
    1024, 569, 569, 1024, 569, 1593, 1024, 1024,
    1024, 1024, 682, 797, 569, 1024, 1024, 1479,
    1024, 1024, 909, 983, 410, 983, 1108, 1593,

    1479, 1366, 1184, 1253, 1251, 1251, 1479, 1479,	// upper case greek
    682, 1479, 1485, 1821, 1479, 1317, 1479, 1479,
    1139, 1192, 1251, 1479, 1497, 1479, 1511, 1522,

    1073, 1042, 905, 965, 860, 848, 1071, 981,		// lower case greek
    551, 1032, 993, 1098, 926, 913, 1024, 1034,
    1022, 1104, 823, 1014, 1182, 909, 1282, 1348,

    1024, 1155, 1155, 1155, 1124, 1124, 1012, 909,		// other symbols

    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
    909, 909, 909, 909, 909, 909, 909, 909,
];

const italic_width_tab = [

    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,

    512, 682, 860, 1024, 1024, 1706, 1593, 438,		// printable ascii
    682, 682, 1024, 1382, 512, 682, 512, 569,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 682, 682, 1382, 1382, 1382, 1024,
    1884, 1251, 1251, 1366, 1479, 1251, 1251, 1479,
    1479, 682, 909, 1366, 1139, 1706, 1366, 1479,
    1251, 1479, 1251, 1024, 1139, 1479, 1251, 1706,
    1251, 1139, 1139, 797, 569, 797, 864, 1024,
    682, 1024, 1024, 909, 1024, 909, 569, 1024,
    1024, 569, 569, 909, 569, 1479, 1024, 1024,
    1024, 1024, 797, 797, 569, 1024, 909, 1366,
    909, 909, 797, 819, 563, 819, 1108, 1593,

    1251, 1251, 1165, 1253, 1251, 1139, 1479, 1479,	// upper case greek
    682, 1366, 1237, 1706, 1366, 1309, 1479, 1479,
    1251, 1217, 1139, 1139, 1559, 1251, 1440, 1481,

    1075, 1020, 807, 952, 807, 829, 1016, 1006,		// lower case greek
    569, 983, 887, 1028, 909, 877, 1024, 1026,
    983, 1010, 733, 940, 1133, 901, 1272, 1446,

    1024, 1382, 1382, 1382, 1124, 1124, 1012, 1024,	// other symbols

    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
];

function get_char_width(font_num: number, char_num: number): number {
    switch (font_num) {
        case ROMAN_FONT:
            return FONT_SIZE * roman_width_tab[char_num] / 2048;
        case ITALIC_FONT:
            return FONT_SIZE * italic_width_tab[char_num] / 2048;
        case SMALL_ROMAN_FONT:
            return SMALL_FONT_SIZE * roman_width_tab[char_num] / 2048;
        case SMALL_ITALIC_FONT:
            return SMALL_FONT_SIZE * italic_width_tab[char_num] / 2048;
        default: throw new Error();
    }
}

function get_xheight(font_num: number): number {
    switch (font_num) {
        case ROMAN_FONT:
        case ITALIC_FONT:
            return FONT_XHEIGHT * FONT_SIZE / 2048;
        case SMALL_ROMAN_FONT:
        case SMALL_ITALIC_FONT:
            return FONT_XHEIGHT * SMALL_FONT_SIZE / 2048;
        default: throw new Error();
    }
}

function get_operator_height(font_num: number): number {
    return get_cap_height(font_num) / 2;
}

let emit_level: number;

export function set_emit_small_font(): void {
    emit_level = 1;
}

interface StackContext {
    stack: U[];
}

class SvgStackContext implements StackContext {
    readonly stack: U[] = [];
}

export interface SvgRenderConfig {
    useImaginaryI: boolean;
    useImaginaryJ: boolean;
}

export function render_svg(expr: U, options: SvgRenderConfig): string {
    const $ = new SvgStackContext();

    emit_level = 0;

    emit_list(expr, $, options);

    const codes = $.stack.pop()!;

    const h0 = height(codes);
    const d0 = depth(codes);
    const w0 = width(codes);

    const x = HPAD;
    const y = Math.round(h0 + VPAD);

    const h = Math.round(h0 + d0 + 2 * VPAD);
    const w = Math.round(w0 + 2 * HPAD);

    const heq = "height='" + h + "'";
    const weq = "width='" + w + "'";

    const outbuf: string[] = [];

    outbuf.push("<svg " + heq + weq + ">");

    draw_formula(x, y, codes, outbuf);

    outbuf.push("</svg>");
    return outbuf.join('');
}

/**
 * Converts an expression into an encoded form with opcode, height, depth, width, and data (depends on opcode).
 */
export function emit_list(expr: U, $: StackContext, ec: SvgRenderConfig): void {
    const t = $.stack.length;
    emit_expr(expr, $, ec);
    emit_update_list(t, $);
}

function emit_expr(p: U, $: StackContext, ec: SvgRenderConfig): void {
    if (isnegativeterm(p) || (car(p).equals(ADD) && isnegativeterm(cadr(p)))) {
        emit_roman_char(MINUS_SIGN, $);
        emit_thin_space($);
    }

    if (car(p).equals(ADD))
        emit_expr_nib(p, $, ec);
    else
        emit_term(p, $, ec);
}

function emit_expr_nib(p: U, $: StackContext, ec: SvgRenderConfig): void {
    p = cdr(p);
    emit_term(car(p), $, ec);
    p = cdr(p);
    while (is_cons(p)) {
        if (isnegativeterm(car(p)))
            emit_infix_operator(MINUS_SIGN, $);
        else
            emit_infix_operator(PLUS_SIGN, $);
        emit_term(car(p), $, ec);
        p = cdr(p);
    }
}

function emit_args(p: U, $: StackContext, ec: SvgRenderConfig): void {

    p = cdr(p);

    if (!is_cons(p)) {
        emit_roman_string("(", $);
        emit_roman_string(")", $);
        return;
    }

    const t = $.stack.length;

    emit_expr(car(p), $, ec);

    p = cdr(p);

    while (is_cons(p)) {
        emit_roman_string(",", $);
        emit_thin_space($);
        emit_expr(car(p), $, ec);
        p = cdr(p);
    }

    emit_update_list(t, $);

    emit_update_subexpr($);
}

function emit_base(p: U, $: StackContext, ec: SvgRenderConfig): void {
    if (is_num(p) && isnegativenumber(p) || (is_rat(p) && isfraction(p)) || is_flt(p) || car(p).equals(ADD) || car(p).equals(MULTIPLY) || car(p).equals(POWER))
        emit_subexpr(p, $, ec);
    else
        emit_expr(p, $, ec);
}

function emit_denominators(p: Cons, $: StackContext, ec: SvgRenderConfig) {

    const t = $.stack.length;
    const n = count_denominators(p);
    p = cdr(p);

    while (is_cons(p)) {

        let q = car(p);
        p = cdr(p);

        if (!isdenominator(q))
            continue;

        if ($.stack.length > t)
            emit_medium_space($);

        if (is_rat(q)) {
            const s = bignum_itoa(q.b);
            emit_roman_string(s, $);
            continue;
        }

        if (isminusone(caddr(q))) {
            q = cadr(q);
            if (car(q).equals(ADD) && n === 1)
                emit_expr(q, $, ec); // parens not needed
            else
                emit_factor(q, $, ec);
        }
        else {
            emit_base(cadr(q), $, ec);
            emit_numeric_exponent(caddr(q) as Num, $); // sign is not emitted
        }
    }

    emit_update_list(t, $);
}

function emit_double(p: Flt, $: StackContext): void {
    let i: number;
    let j: number;

    const s = fmtnum(p.d);

    let k = 0;

    while (k < s.length && s.charAt(k) !== "." && s.charAt(k) !== "E" && s.charAt(k) !== "e")
        k++;

    emit_roman_string(s.substring(0, k), $);

    // handle trailing zeroes

    if (s.charAt(k) === ".") {

        i = k++;

        while (k < s.length && s.charAt(k) !== "E" && s.charAt(k) !== "e")
            k++;

        j = k;

        while (s.charAt(j - 1) === "0")
            j--;

        if (j - i > 1)
            emit_roman_string(s.substring(i, j), $);
    }

    if (s.charAt(k) !== "E" && s.charAt(k) !== "e")
        return;

    k++;

    emit_roman_char(MULTIPLY_SIGN, $);

    emit_roman_string("10", $);

    // superscripted exponent

    emit_level++;

    const t = $.stack.length;

    // sign of exponent

    if (s.charAt(k) === "+")
        k++;
    else if (s.charAt(k) === "-") {
        emit_roman_char(MINUS_SIGN, $);
        emit_thin_space($);
        k++;
    }

    // skip leading zeroes in exponent

    while (s.charAt(k) === "0")
        k++;

    emit_roman_string(s.substring(k), $);

    emit_update_list(t, $);

    emit_level--;

    emit_update_superscript($);
}

function emit_exponent(p: U, $: StackContext, ec: SvgRenderConfig): void {
    if (is_num(p) && !isnegativenumber(p)) {
        emit_numeric_exponent(p, $); // sign is not emitted
        return;
    }

    emit_level++;
    emit_list(p, $, ec);
    emit_level--;

    emit_update_superscript($);
}

function emit_factor(p: U, $: StackContext, ec: SvgRenderConfig) {
    if (is_rat(p)) {
        emit_rational(p, $);
        return;
    }

    if (is_flt(p)) {
        emit_double(p, $);
        return;
    }

    if (is_sym(p)) {
        emit_symbol(p, $);
        return;
    }

    if (is_str(p)) {
        emit_string(p, $);
        return;
    }

    if (is_tensor(p)) {
        emit_tensor(p, $, ec);
        return;
    }

    if (is_uom(p)) {
        emit_uom(p, $);
        return;
    }

    if (is_boo(p)) {
        emit_boo(p, $);
        return;
    }

    if (is_blade(p)) {
        emit_blade(p, $);
        return;
    }

    if (is_imu(p)) {
        emit_imaginary_unit(p, $, ec);
        return;
    }

    if (is_cons(p)) {
        if (car(p).equals(POWER)) {
            emit_power(p, $, ec);
        }
        else if (car(p).equals(ADD) || car(p).equals(MULTIPLY)) {
            emit_subexpr(p, $, ec);
        }
        else {
            emit_function(p, $, ec);
        }
        return;
    }

    if (is_nil(p)) {
        throw new Error();
    }

    if (is_atom(p)) {
        emit_atom(p, $);
        return;
    }
}

function emit_fraction(p: Cons, $: StackContext, ec: SvgRenderConfig): void {
    emit_numerators(p, $, ec);
    emit_denominators(p, $, ec);
    emit_update_fraction($);
}

function emit_function(p: U, $: StackContext, ec: SvgRenderConfig): void {
    // d(f(x),x)

    if (car(p).equals(DERIVATIVE)) {
        emit_roman_string("d", $);
        emit_args(p, $, ec);
        return;
    }

    // n!

    if (car(p).equals(FACTORIAL)) {
        p = cadr(p);
        if (is_rat(p) && isposint(p) || is_sym(p))
            emit_expr(p, $, ec);
        else
            emit_subexpr(p, $, ec);
        emit_roman_string("!", $);
        return;
    }

    // A[1,2]

    if (car(p).equals(INDEX)) {
        p = cdr(p);
        const leading = car(p);
        if (is_sym(leading))
            emit_symbol(leading, $);
        else
            emit_subexpr(leading, $, ec);
        emit_indices(p, $, ec);
        return;
    }

    if (is_cons(p) && (p.opr.equals(ASSIGN) || p.opr.equals(TESTEQ))) {
        emit_expr(cadr(p), $, ec);
        emit_infix_operator(EQUALS_SIGN, $);
        emit_expr(caddr(p), $, ec);
        return;
    }

    if (car(p).equals(TESTGE)) {
        emit_expr(cadr(p), $, ec);
        emit_infix_operator(GREATEREQUAL, $);
        emit_expr(caddr(p), $, ec);
        return;
    }

    if (car(p).equals(TESTGT)) {
        emit_expr(cadr(p), $, ec);
        emit_infix_operator(GREATER_SIGN, $);
        emit_expr(caddr(p), $, ec);
        return;
    }

    if (car(p).equals(TESTLE)) {
        emit_expr(cadr(p), $, ec);
        emit_infix_operator(LESSEQUAL, $);
        emit_expr(caddr(p), $, ec);
        return;
    }

    if (car(p).equals(TESTLT)) {
        emit_expr(cadr(p), $, ec);
        emit_infix_operator(LESS_SIGN, $);
        emit_expr(caddr(p), $, ec);
        return;
    }

    // default

    const leading = car(p);
    if (is_sym(leading))
        emit_symbol(leading, $);
    else
        emit_subexpr(leading, $, ec);

    emit_args(p, $, ec);
}

function emit_indices(p: U, $: StackContext, ec: SvgRenderConfig): void {
    emit_roman_string("[", $);

    p = cdr(p);

    if (is_cons(p)) {
        emit_expr(car(p), $, ec);
        p = cdr(p);
        while (is_cons(p)) {
            emit_roman_string(",", $);
            emit_thin_space($);
            emit_expr(car(p), $, ec);
            p = cdr(p);
        }
    }

    emit_roman_string("]", $);
}

function emit_infix_operator(char_num: number, $: StackContext): void {
    emit_thick_space($);
    emit_roman_char(char_num, $);
    emit_thick_space($);
}

function emit_italic_char(char_num: number, $: StackContext): void {
    let font_num: number;

    if (emit_level === 0)
        font_num = ITALIC_FONT;
    else
        font_num = SMALL_ITALIC_FONT;

    const h = get_cap_height(font_num);
    const d = get_char_depth(font_num, char_num);
    const w = get_char_width(font_num, char_num);

    $.stack.push(create_flt(EMIT_CHAR));
    $.stack.push(create_flt(h));
    $.stack.push(create_flt(d));
    $.stack.push(create_flt(w));
    $.stack.push(create_flt(font_num));
    $.stack.push(create_flt(char_num));

    list(6, $);

    if (char_num === LOWER_F)
        emit_thin_space($);
}

function emit_italic_string(s: 'i' | 'j', $: StackContext): void {
    for (let i = 0; i < s.length; i++)
        emit_italic_char(s.charCodeAt(i), $);
}

function emit_matrix(p: Tensor, d: number, k: number, $: StackContext, ec: SvgRenderConfig): void {

    if (d === p.ndim) {
        emit_list(p.elems[k], $, ec);
        return;
    }

    // compute element span

    let span = 1;

    let n = p.ndim;

    for (let i = d + 2; i < n; i++)
        span *= p.dims[i];

    n = p.dims[d];		// number of rows
    const m = p.dims[d + 1];	// number of columns

    for (let i = 0; i < n; i++)
        for (let j = 0; j < m; j++)
            emit_matrix(p, d + 2, k + (i * m + j) * span, $, ec);

    emit_update_table(n, m, $);
}

function emit_medium_space($: StackContext): void {
    let w: number;

    if (emit_level === 0)
        w = 0.5 * get_char_width(ROMAN_FONT, LOWER_N);
    else
        w = 0.5 * get_char_width(SMALL_ROMAN_FONT, LOWER_N);

    $.stack.push(create_flt(EMIT_SPACE));
    $.stack.push(create_flt(0.0));
    $.stack.push(create_flt(0.0));
    $.stack.push(create_flt(w));

    list(4, $);
}

function emit_numerators(p: Cons, $: StackContext, ec: SvgRenderConfig): void {

    const t = $.stack.length;
    const n = count_numerators(p);
    p = cdr(p);

    while (is_cons(p)) {

        const q = car(p);
        p = cdr(p);

        if (!isnumerator(q))
            continue;

        if ($.stack.length > t)
            emit_medium_space($);

        if (is_rat(q)) {
            const s = bignum_itoa(q.a);
            emit_roman_string(s, $);
            continue;
        }

        if (car(q).equals(ADD) && n === 1)
            emit_expr(q, $, ec); // parens not needed
        else
            emit_factor(q, $, ec);
    }

    if ($.stack.length === t)
        emit_roman_string("1", $); // no numerators

    emit_update_list(t, $);
}

// p is rational or double, sign is not emitted

function emit_numeric_exponent(p: Num, $: StackContext) {

    emit_level++;

    const t = $.stack.length;

    if (is_rat(p)) {
        let s = bignum_itoa(p.a);
        emit_roman_string(s, $);
        if (isfraction(p)) {
            emit_roman_string("/", $);
            s = bignum_itoa(p.b);
            emit_roman_string(s, $);
        }
    }
    else {
        emit_double(p, $);
    }

    emit_update_list(t, $);

    emit_level--;

    emit_update_superscript($);
}

function emit_power(p: U, $: StackContext, ec: SvgRenderConfig): void {
    if (cadr(p).equals(DOLLAR_E)) {
        emit_roman_string("exp", $);
        emit_args(cdr(p), $, ec);
        return;
    }

    if (isimaginaryunit(p)) {
        if (ec.useImaginaryJ) {
            emit_italic_string("j", $);
            return;
        }
        if (ec.useImaginaryI) {
            emit_italic_string("i", $);
            return;
        }
    }

    const X = caddr(p);
    if (is_num(X) && isnegativenumber(X)) {
        emit_reciprocal(p, $, ec);
        return;
    }

    emit_base(cadr(p), $, ec);
    emit_exponent(caddr(p), $, ec);
}

function emit_rational(p: Rat, $: StackContext): void {

    if (isinteger(p)) {
        const s = bignum_itoa(p.a);
        emit_roman_string(s, $);
        return;
    }

    emit_level++;

    let t = $.stack.length;
    let s = bignum_itoa(p.a);
    emit_roman_string(s, $);
    emit_update_list(t, $);

    t = $.stack.length;
    s = bignum_itoa(p.b);
    emit_roman_string(s, $);
    emit_update_list(t, $);

    emit_level--;

    emit_update_fraction($);
}

// p = y^x where x is a negative number

function emit_reciprocal(p: U, $: StackContext, ec: SvgRenderConfig): void {

    emit_roman_string("1", $); // numerator

    const t = $.stack.length;

    if (isminusone(caddr(p)))
        emit_expr(cadr(p), $, ec);
    else {
        emit_base(cadr(p), $, ec);
        emit_numeric_exponent(caddr(p) as Num, $); // sign is not emitted
    }

    emit_update_list(t, $);

    emit_update_fraction($);
}

function emit_roman_char(char_num: number, $: StackContext): void {
    let font_num: number;

    if (emit_level === 0)
        font_num = ROMAN_FONT;
    else
        font_num = SMALL_ROMAN_FONT;

    const h = get_cap_height(font_num);
    const d = get_char_depth(font_num, char_num);
    const w = get_char_width(font_num, char_num);

    $.stack.push(create_flt(EMIT_CHAR));
    $.stack.push(create_flt(h));
    $.stack.push(create_flt(d));
    $.stack.push(create_flt(w));
    $.stack.push(create_flt(font_num));
    $.stack.push(create_flt(char_num));

    list(6, $);
}

function emit_roman_string(s: string, $: StackContext): void {

    for (let i = 0; i < s.length; i++) {
        emit_roman_char(s.charCodeAt(i), $);
    }
}

function emit_string(p: Str, $: StackContext): void {
    emit_roman_string(p.str, $);
}

function emit_subexpr(p: U, $: StackContext, ec: SvgRenderConfig): void {
    emit_list(p, $, ec);
    emit_update_subexpr($);
}

function emit_symbol(sym: Sym, $: StackContext): void {
    if (is_native(sym, Native.PI)) {
        emit_symbol_as_fragments('pi', $);
    }
    else if (sym.key() === 'Ω') {
        emit_symbol_as_fragments('Omega', $);
    }
    else {
        return emit_symbol_roman(sym, $);
    }
}

/**
 * Used to render symbols as Roman fonts.
 * This is the standard for most mathematics. 
 */
function emit_symbol_roman(sym: Sym, $: StackContext): void {

    if (sym.equalsSym(DOLLAR_E)) {
        emit_roman_string("exp(1)", $);
        return;
    }

    const s = printname_from_symbol(sym);

    emit_roman_string(s, $);
}

/**
 * Used to render symbols as a leading character then a suffix.
 * We use this when there is some cue that the symbol.
 */
export function emit_symbol_as_fragments(s: string, $: StackContext): void {

    let k = emit_symbol_fragment(s, 0, $);

    if (k === s.length) {
        return;
    }

    // emit subscript

    emit_level++;

    const t = $.stack.length;

    while (k < s.length) {
        k = emit_symbol_fragment(s, k, $);
    }

    emit_update_list(t, $);

    emit_level--;

    emit_update_subscript($);
}

const symbol_name_tab = [

    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu",
    "Nu",
    "Xi",
    "Omicron",
    "Pi",
    "Rho",
    "Sigma",
    "Tau",
    "Upsilon",
    "Phi",
    "Chi",
    "Psi",
    "Omega",

    "alpha",
    "beta",
    "gamma",
    "delta",
    "epsilon",
    "zeta",
    "eta",
    "theta",
    "iota",
    "kappa",
    "lambda",
    "mu",
    "nu",
    "xi",
    "omicron",
    "pi",
    "rho",
    "sigma",
    "tau",
    "upsilon",
    "phi",
    "chi",
    "psi",
    "omega",

    "hbar",
];

const symbol_italic_tab = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    0,
];

function emit_symbol_fragment(s: string, k: number, $: StackContext): number {
    let i: number;
    let t: string = "";

    const n = symbol_name_tab.length;

    for (i = 0; i < n; i++) {
        t = symbol_name_tab[i];
        if (s.startsWith(t, k))
            break;
    }

    if (i === n) {
        if (isdigit(s.charAt(k)))
            emit_roman_char(s.charCodeAt(k), $);
        else
            emit_italic_char(s.charCodeAt(k), $);
        return k + 1;
    }

    const char_num = i + 128;

    if (symbol_italic_tab[i])
        emit_italic_char(char_num, $);
    else
        emit_roman_char(char_num, $);

    return k + t.length;
}

function emit_blade(blade: Blade, $: StackContext): void {
    const str = blade.toInfixString();
    emit_roman_string(str, $);
}

function emit_atom(atom: U, $: StackContext): void {
    const str = atom.toString();
    emit_roman_string(str, $);
}

function emit_imaginary_unit(imu: Imu, $: StackContext, ec: SvgRenderConfig): void {
    if (ec.useImaginaryI) {
        emit_italic_string("i", $);
    }
    else if (ec.useImaginaryJ) {
        emit_italic_string("j", $);
    }
    else {
        emit_italic_string("i", $);
    }
}

function emit_tensor(p: Tensor, $: StackContext, ec: SvgRenderConfig): void {
    if (p.ndim % 2 === 1)
        emit_vector(p, $, ec); // odd rank
    else
        emit_matrix(p, 0, 0, $, ec); // even rank
}

function emit_boo(boo: Boo, $: StackContext): void {
    if (boo.isTrue()) {
        emit_roman_string('true', $);
    }
    else if (boo.isFalse()) {
        emit_roman_string('false', $);
    }
    else {
        emit_roman_string('fuzzy', $);
    }
}

function emit_uom(uom: Uom, $: StackContext): void {
    const str = uom.toInfixString();
    const sym = create_sym(str);
    emit_symbol(sym, $);
    // emit_roman_string(str, $);
}

function emit_term(p: U, $: StackContext, ec: SvgRenderConfig): void {
    if (is_cons(p) && p.opr.equals(MULTIPLY))
        emit_term_nib(p, $, ec);
    else
        emit_factor(p, $, ec);
}

function emit_term_nib(p: Cons, $: StackContext, ec: SvgRenderConfig): void {
    if (find_denominator(p)) {
        emit_fraction(p, $, ec);
        return;
    }

    // no denominators

    p = cdr(p);

    if (isminusone(car(p)) && !is_flt(car(p)))
        p = cdr(p); // sign already emitted

    emit_factor(car(p), $, ec);

    p = cdr(p);

    while (is_cons(p)) {
        emit_medium_space($);
        emit_factor(car(p), $, ec);
        p = cdr(p);
    }
}

function emit_thick_space($: StackContext): void {
    let w: number;

    if (emit_level === 0)
        w = get_char_width(ROMAN_FONT, LOWER_N);
    else
        w = get_char_width(SMALL_ROMAN_FONT, LOWER_N);

    $.stack.push(create_flt(EMIT_SPACE));
    $.stack.push(create_flt(0.0));
    $.stack.push(create_flt(0.0));
    $.stack.push(create_flt(w));

    list(4, $);
}

function emit_thin_space($: StackContext): void {
    let w: number;

    if (emit_level === 0)
        w = 0.25 * get_char_width(ROMAN_FONT, LOWER_N);
    else
        w = 0.25 * get_char_width(SMALL_ROMAN_FONT, LOWER_N);

    $.stack.push(create_flt(EMIT_SPACE));
    $.stack.push(create_flt(0.0));
    $.stack.push(create_flt(0.0));
    $.stack.push(create_flt(w));

    list(4, $);
}

function emit_update_fraction($: StackContext): void {

    const p2 = $.stack.pop()!; // denominator
    const p1 = $.stack.pop()!; // numerator

    let h = height(p1) + depth(p1);
    let d = height(p2) + depth(p2);
    let w = Math.max(width(p1), width(p2));

    let opcode: number;
    let font_num: number;

    if (emit_level === 0) {
        opcode = EMIT_FRACTION;
        font_num = ROMAN_FONT;
    }
    else {
        opcode = EMIT_SMALL_FRACTION;
        font_num = SMALL_ROMAN_FONT;
    }

    const m = get_operator_height(font_num);

    const v = 0.75 * m; // extra vertical space

    h += v + m;
    d += v - m;

    w += get_char_width(font_num, LOWER_N) / 2; // make horizontal line a bit wider

    $.stack.push(create_flt(opcode));
    $.stack.push(create_flt(h));
    $.stack.push(create_flt(d));
    $.stack.push(create_flt(w));
    $.stack.push(p1);
    $.stack.push(p2);

    list(6, $);
}

function emit_update_list(t: number, $: StackContext): void {

    if ($.stack.length - t === 1) {
        return;
    }

    let h = 0;
    let d = 0;
    let w = 0;

    let p1: U;

    for (let i = t; i < $.stack.length; i++) {
        p1 = $.stack[i];
        h = Math.max(h, height(p1));
        d = Math.max(d, depth(p1));
        w += width(p1);
    }

    list($.stack.length - t, $);
    p1 = $.stack.pop()!;

    $.stack.push(create_flt(EMIT_LIST));
    $.stack.push(create_flt(h));
    $.stack.push(create_flt(d));
    $.stack.push(create_flt(w));
    $.stack.push(p1);

    list(5, $);
}

function emit_update_subexpr($: StackContext): void {

    const p1 = $.stack.pop()!;

    let h = height(p1);
    let d = depth(p1);
    let w = width(p1);

    let opcode: number;
    let font_num: number;

    if (emit_level === 0) {
        opcode = EMIT_SUBEXPR;
        font_num = ROMAN_FONT;
    }
    else {
        opcode = EMIT_SMALL_SUBEXPR;
        font_num = SMALL_ROMAN_FONT;
    }

    h = Math.max(h, get_cap_height(font_num));
    d = Math.max(d, get_descent(font_num));

    // delimiters have vertical symmetry (h - m === d + m)

    if (h > get_cap_height(font_num) || d > get_descent(font_num)) {
        const m = get_operator_height(font_num);
        h = Math.max(h, d + 2 * m) + 0.5 * m; // plus a little extra
        d = h - 2 * m; // by symmetry
    }

    w += 2 * get_char_width(font_num, LEFT_PAREN);

    $.stack.push(create_flt(opcode));
    $.stack.push(create_flt(h));
    $.stack.push(create_flt(d));
    $.stack.push(create_flt(w));
    $.stack.push(p1);

    list(5, $);
}

function emit_update_subscript($: StackContext): void {

    const p1 = $.stack.pop()!;

    let font_num: number;

    if (emit_level === 0)
        font_num = ROMAN_FONT;
    else
        font_num = SMALL_ROMAN_FONT;

    const t = get_char_width(font_num, LOWER_N) / 6;

    const h = get_cap_height(font_num);
    let d = depth(p1);
    const w = t + width(p1);

    const dx = t;
    const dy = h / 2;

    d += dy;

    $.stack.push(create_flt(EMIT_SUBSCRIPT));
    $.stack.push(create_flt(h));
    $.stack.push(create_flt(d));
    $.stack.push(create_flt(w));
    $.stack.push(create_flt(dx));
    $.stack.push(create_flt(dy));
    $.stack.push(p1);

    list(7, $);
}

function emit_update_superscript($: StackContext): void {

    const p2 = $.stack.pop()!; // exponent
    const p1 = $.stack.pop()!; // base

    let font_num: number;

    if (emit_level === 0)
        font_num = ROMAN_FONT;
    else
        font_num = SMALL_ROMAN_FONT;

    const t = get_char_width(font_num, LOWER_N) / 6;

    let h = height(p2);
    let d = depth(p2);
    let w = t + width(p2);

    // y is height of base

    let y = height(p1);

    // adjust

    y -= (h + d) / 2;

    y = Math.max(y, get_xheight(font_num));

    let dx = t;
    const dy = -(y + d);

    h = y + h + d;
    d = 0;

    if (opcode(p1) === EMIT_SUBSCRIPT) {
        dx = -width(p1) + t;
        w = Math.max(0, w - width(p1));
    }

    $.stack.push(p1); // base

    $.stack.push(create_flt(EMIT_SUPERSCRIPT));
    $.stack.push(create_flt(h));
    $.stack.push(create_flt(d));
    $.stack.push(create_flt(w));
    $.stack.push(create_flt(dx));
    $.stack.push(create_flt(dy));
    $.stack.push(p2);

    list(7, $);
}

function emit_update_table(n: number, m: number, $: StackContext): void {

    let total_height = 0;
    let total_width = 0;

    const t = $.stack.length - n * m;

    // max height for each row

    for (let i = 0; i < n; i++) { // for each row
        let h = 0;
        for (let j = 0; j < m; j++) { // for each column
            const p1 = $.stack[t + i * m + j];
            h = Math.max(h, height(p1));
        }
        $.stack.push(create_flt(h));
        total_height += h;
    }

    list(n, $);
    const p2 = $.stack.pop()!;

    // max depth for each row

    for (let i = 0; i < n; i++) { // for each row
        let d = 0;
        for (let j = 0; j < m; j++) { // for each column
            const p1 = $.stack[t + i * m + j];
            d = Math.max(d, depth(p1));
        }
        $.stack.push(create_flt(d));
        total_height += d;
    }

    list(n, $);
    const p3 = $.stack.pop()!;

    // max width for each column

    for (let j = 0; j < m; j++) { // for each column
        let w = 0;
        for (let i = 0; i < n; i++) { // for each row
            const p1 = $.stack[t + i * m + j];
            w = Math.max(w, width(p1));
        }
        $.stack.push(create_flt(w));
        total_width += w;
    }

    list(m, $);
    const p4 = $.stack.pop()!;

    // padding

    total_height += n * 2 * TABLE_VSPACE;
    total_width += m * 2 * TABLE_HSPACE;

    // h, d, w for entire table

    const h = total_height / 2 + get_operator_height(ROMAN_FONT);
    const d = total_height - h;
    const w = total_width + 2 * get_char_width(ROMAN_FONT, LEFT_PAREN);

    list(n * m, $);
    const p1 = $.stack.pop()!;

    $.stack.push(create_flt(EMIT_TABLE));
    $.stack.push(create_flt(h));
    $.stack.push(create_flt(d));
    $.stack.push(create_flt(w));
    $.stack.push(create_flt(n));
    $.stack.push(create_flt(m));
    $.stack.push(p1);
    $.stack.push(p2);
    $.stack.push(p3);
    $.stack.push(p4);

    list(10, $);
}

function emit_vector(p: Tensor, $: StackContext, ec: SvgRenderConfig): void {
    // compute element span

    let span = 1;

    let n = p.ndim;

    for (let i = 1; i < n; i++)
        span *= p.dims[i];

    n = p.dims[0]; // number of rows

    for (let i = 0; i < n; i++)
        emit_matrix(p, 1, i * span, $, ec);

    emit_update_table(n, 1, $); // n rows, 1 column
}

function opcode(p: U): number {
    return (car(p) as Flt).d;
}

export function height(p: U): number {
    return (cadr(p) as Flt).d;
}

function depth(p: U): number {
    return (caddr(p) as Flt).d;
}

export function width(p: U): number {
    return (cadddr(p) as Flt).d;
}

function val1(p: U): number {
    return (car(p) as Flt).d;
}

function val2(p: U): number {
    return (cadr(p) as Flt).d;
}

export function draw_formula(x: number, y: number, codes: U, outbuf: string[]): void {
    if (isNaN(x)) {
        throw new Error("x is NaN");
    }
    if (isNaN(y)) {
        throw new Error("y is NaN");
    }

    const k = opcode(codes);
    const h = height(codes);
    const d = depth(codes);
    const w = width(codes);

    const data = cddddr(codes);

    let font_num: number;
    let char_num: number;

    switch (k) {

        case EMIT_SPACE:
            break;

        case EMIT_CHAR:
            font_num = val1(data);
            char_num = val2(data);
            draw_char(x, y, font_num, char_num, outbuf);
            break;

        case EMIT_LIST: {
            let p = car(data);
            while (is_cons(p)) {
                draw_formula(x, y, car(p), outbuf);
                x += width(car(p));
                p = cdr(p);
            }
            break;
        }
        case EMIT_SUPERSCRIPT:
        case EMIT_SUBSCRIPT: {
            const dx = val1(data);
            const dy = val2(data);
            const p = caddr(data);
            draw_formula(x + dx, y + dy, p, outbuf);
            break;
        }
        case EMIT_SUBEXPR: {
            draw_delims(x, y, h, d, w, FONT_SIZE * DELIM_STROKE, ROMAN_FONT, outbuf);
            const dx = get_char_width(ROMAN_FONT, LEFT_PAREN);
            draw_formula(x + dx, y, car(data), outbuf);
            break;
        }
        case EMIT_SMALL_SUBEXPR: {
            draw_delims(x, y, h, d, w, SMALL_FONT_SIZE * DELIM_STROKE, SMALL_ROMAN_FONT, outbuf);
            const dx = get_char_width(SMALL_ROMAN_FONT, LEFT_PAREN);
            draw_formula(x + dx, y, car(data), outbuf);
            break;
        }
        case EMIT_FRACTION:
            draw_fraction(x, y, h, d, w, FONT_SIZE * FRAC_STROKE, ROMAN_FONT, data, outbuf);
            break;

        case EMIT_SMALL_FRACTION:
            draw_fraction(x, y, h, d, w, SMALL_FONT_SIZE * FRAC_STROKE, SMALL_ROMAN_FONT, data, outbuf);
            break;

        case EMIT_TABLE: {
            draw_delims(x, y, h, d, w, 1.2 * FONT_SIZE * DELIM_STROKE, ROMAN_FONT, outbuf);
            const dx = get_char_width(ROMAN_FONT, LEFT_PAREN);
            draw_table(x + dx, y - h, data, outbuf);
            break;
        }
    }
}

const html_name_tab = [

    "&Alpha;",
    "&Beta;",
    "&Gamma;",
    "&Delta;",
    "&Epsilon;",
    "&Zeta;",
    "&Eta;",
    "&Theta;",
    "&Iota;",
    "&Kappa;",
    "&Lambda;",
    "&Mu;",
    "&Nu;",
    "&Xi;",
    "&Omicron;",
    "&Pi;",
    "&Rho;",
    "&Sigma;",
    "&Tau;",
    "&Upsilon;",
    "&Phi;",
    "&Chi;",
    "&Psi;",
    "&Omega;",

    "&alpha;",
    "&beta;",
    "&gamma;",
    "&delta;",
    "&epsilon;",
    "&zeta;",
    "&eta;",
    "&theta;",
    "&iota;",
    "&kappa;",
    "&lambda;",
    "&mu;",
    "&nu;",
    "&xi;",
    "&omicron;",
    "&pi;",
    "&rho;",
    "&sigma;",
    "&tau;",
    "&upsilon;",
    "&phi;",
    "&chi;",
    "&psi;",
    "&omega;",

    "&hbar;",	// 176

    "&plus;",	// 177
    "&minus;",	// 178
    "&times;",	// 179
    "&ge;",		// 180
    "&le;",		// 181
];

// https://www.ascii-code.com
const ASCII_CODE_MIDDOT = 183;

function draw_char(x: number, y: number, font_num: number, char_num: number, outbuf: string[]): void {
    let s: string;
    let t: string;

    if (char_num === ASCII_CODE_MIDDOT) {
        s = "&middot;";
    }
    else if (char_num < 32 || char_num > 181) {
        // console.lg(`char_num => ${char_num}`);
        s = "?";
    }
    else if (char_num === 34)
        s = "&quot;";
    else if (char_num === 38)
        s = "&amp;";
    else if (char_num === 60)
        s = "&lt;";
    else if (char_num === 62)
        s = "&gt;";
    else if (char_num < 128)
        s = String.fromCharCode(char_num);
    else
        s = html_name_tab[char_num - 128];

    t = "<text style='font-family:\"Times New Roman\";";

    switch (font_num) {
        case ROMAN_FONT:
            t += "font-size:" + FONT_SIZE + "px;";
            break;
        case ITALIC_FONT:
            t += "font-size:" + FONT_SIZE + "px;font-style:italic;";
            break;
        case SMALL_ROMAN_FONT:
            t += "font-size:" + SMALL_FONT_SIZE + "px;";
            break;
        case SMALL_ITALIC_FONT:
            t += "font-size:" + SMALL_FONT_SIZE + "px;font-style:italic;";
            break;
    }

    const xeq = "x='" + x + "'";
    const yeq = "y='" + y + "'";

    t += "'" + xeq + yeq + ">" + s + "</text>";

    outbuf.push(t);
}

function draw_delims(x: number, y: number, h: number, d: number, w: number, stroke_width: number, font_num: number, outbuf: string[]): void {

    const ch = get_cap_height(font_num);
    const cd = get_char_depth(font_num, LEFT_PAREN);
    const cw = get_char_width(font_num, LEFT_PAREN);

    if (h > ch || d > cd) {
        draw_left_delim(x, y, h, d, cw, stroke_width, outbuf);
        draw_right_delim(x + w - cw, y, h, d, cw, stroke_width, outbuf);
    }
    else {
        draw_char(x, y, font_num, LEFT_PAREN, outbuf);
        draw_char(x + w - cw, y, font_num, RIGHT_PAREN, outbuf);
    }
}

function draw_left_delim(x: number, y: number, h: number, d: number, w: number, stroke_width: number, outbuf: string[]): void {

    const x1 = Math.round(x + 0.5 * w);
    const x2 = x1 + Math.round(0.5 * w);

    const y1 = Math.round(y - h);
    const y2 = Math.round(y + d);

    draw_stroke(x1, y1, x1, y2, stroke_width, outbuf); // stem stroke
    draw_stroke(x1, y1, x2, y1, stroke_width, outbuf); // top stroke
    draw_stroke(x1, y2, x2, y2, stroke_width, outbuf); // bottom stroke
}

function draw_right_delim(x: number, y: number, h: number, d: number, w: number, stroke_width: number, outbuf: string[]): void {

    const x1 = Math.round(x + 0.5 * w);
    const x2 = x1 - Math.round(0.5 * w);

    const y1 = Math.round(y - h);
    const y2 = Math.round(y + d);

    draw_stroke(x1, y1, x1, y2, stroke_width, outbuf); // stem stroke
    draw_stroke(x1, y1, x2, y1, stroke_width, outbuf); // top stroke
    draw_stroke(x1, y2, x2, y2, stroke_width, outbuf); // bottom stroke
}

function draw_stroke(x1: number, y1: number, x2: number, y2: number, stroke_width: number, outbuf: string[]): void {

    const x1eq = "x1='" + x1 + "'";
    const x2eq = "x2='" + x2 + "'";

    const y1eq = "y1='" + y1 + "'";
    const y2eq = "y2='" + y2 + "'";

    const s = "<line " + x1eq + y1eq + x2eq + y2eq + "style='stroke:black;stroke-width:" + stroke_width + "'/>";

    outbuf.push(s);
}

function draw_fraction(x: number, y: number, h: number, d: number, w: number, stroke_width: number, font_num: number, p: U, outbuf: string[]): void {

    // horizontal line

    let dy = get_operator_height(font_num);

    draw_stroke(x, y - dy, x + w, y - dy, stroke_width, outbuf);

    // numerator

    let dx = (w - width(car(p))) / 2;
    dy = h - height(car(p));
    draw_formula(x + dx, y - dy, car(p), outbuf);

    // denominator

    p = cdr(p);
    dx = (w - width(car(p))) / 2;
    dy = d - depth(car(p));
    draw_formula(x + dx, y + dy, car(p), outbuf);
}

function draw_table(x: number, y: number, p: U, outbuf: string[]): void {

    const n = val1(p);
    const m = val2(p);

    p = cddr(p);

    let table = car(p);
    let h = cadr(p);
    let d = caddr(p);

    for (let i = 0; i < n; i++) { // for each row

        const row_height = val1(h);
        const row_depth = val1(d);

        y += TABLE_VSPACE + row_height;

        let dx = 0;

        let w = cadddr(p);

        for (let j = 0; j < m; j++) { // for each column

            const column_width = val1(w);
            const elem_width = width(car(table));
            const cx = x + dx + TABLE_HSPACE + (column_width - elem_width) / 2; // center horizontal
            draw_formula(cx, y, car(table), outbuf);
            dx += column_width + 2 * TABLE_HSPACE;
            table = cdr(table);
            w = cdr(w);
        }

        y += row_depth + TABLE_VSPACE;

        h = cdr(h);
        d = cdr(d);
    }
}

function count_numerators(p: Cons): number {
    let n = 0;
    p = cdr(p);
    while (is_cons(p)) {
        if (isnumerator(car(p)))
            n++;
        p = cdr(p);
    }
    return n;
}
