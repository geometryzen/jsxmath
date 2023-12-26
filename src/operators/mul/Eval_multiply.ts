import { contains_single_blade } from "../../calculators/compare/contains_single_blade";
import { extract_single_blade } from "../../calculators/compare/extract_single_blade";
import { multiply_num_num } from "../../calculators/mul/multiply_num_num";
import { remove_factors } from "../../calculators/remove_factors";
import { ExtensionEnv, SIGN_GT, SIGN_LT } from "../../env/ExtensionEnv";
import { render_as_infix } from "../../print/render_as_infix";
import { OPERATOR } from "../../runtime/constants";
import { is_add, is_multiply, is_power } from "../../runtime/helpers";
import { MATH_MUL } from "../../runtime/ns_math";
import { cddr } from "../../tree/helpers";
import { Num } from "../../tree/num/Num";
import { one, zero } from "../../tree/rat/Rat";
import { car, cdr, cons, Cons, is_cons, is_nil, items_to_cons, U } from "../../tree/tree";
import { is_blade } from "../blade/is_blade";
import { is_num } from "../num/is_num";
import { is_rat } from "../rat/is_rat";
import { is_tensor } from "../tensor/is_tensor";
import { is_uom } from "../uom/is_uom";

/**
 * TODO: A better name might be transform_multiplicative_expr
 * @param expr
 */
export function Eval_multiply(expr: Cons, $: ExtensionEnv): U {
    // The only reason we should be here is that all other handlers for this multiplication do not match.
    // console.log($.toSExprString(expr));
    const args = expr.argList;
    const vals = args.map($.valueOf);
    if (vals.equals(args)) {
        // For multiplication, the expression (*) evaluates to 1.
        if (is_nil(vals)) {
            return one;
        }
        else {
            // const factors = [...vals];
            // flatten factors
            // sort
            // perform pairwise multiplication
            // recombine
            const retval = vals.car;
            const remaining = vals.cdr;
            if (is_cons(remaining)) {
                return [...remaining].reduce((prev: U, curr: U) => multiply(prev, curr, $), retval);
            }
            return retval;
        }
    }
    else {
        // Evaluation of the arguments has produced changes so we give other operators a chance to evaluate.
        return $.valueOf(cons(expr.car, vals));
    }
}

/**
 * 
 * @param lhs 
 * @param rhs 
 * @param $ 
 * @returns 
 */
function multiply(lhs: U, rhs: U, $: ExtensionEnv): U {
    // TODO: Optimize handling of numbers, 0, 1.

    // TODO: This function should not known anything about Flt(s) and Rat(s).
    // These optimizations should be introduced by extensions to multiplication.
    if (is_num(lhs) && is_num(rhs)) {
        return multiply_num_num(lhs, rhs);
    }
    // TODO: Move these out, just like Flt.
    if (is_rat(lhs)) {
        if (lhs.isZero()) {
            return lhs;
        }
    }
    if (is_rat(rhs)) {
        if (rhs.isZero()) {
            return rhs;
        }
    }

    // Distributive Law  (x1 + x2 + ...) * R => x1 * R + x2 * R + ...
    if ($.isExpanding() && is_add(lhs)) {
        return lhs
            .tail()
            .reduce((a: U, b: U) => $.add(a, multiply(b, rhs, $)), zero);
    }

    // Distributive Law  L * (x1 + x2 + ...) => L * x1 + L * x2 + ...
    if ($.isExpanding() && is_add(rhs)) {
        return rhs
            .tail()
            .reduce((a: U, b: U) => $.add(a, multiply(lhs, b, $)), zero);
    }

    const compareFactors = $.compareFn(MATH_MUL);

    // Dealing with Blades avoids issues with non-commutativity later on.
    if (contains_single_blade(lhs) && contains_single_blade(rhs)) {
        const bladeL = extract_single_blade(lhs);
        const bladeR = extract_single_blade(rhs);
        const blade = bladeL.mul(bladeR);
        const residueL = remove_factors(lhs, is_blade);
        const residueR = remove_factors(rhs, is_blade);
        return $.multiply($.multiply(residueL, residueR), blade);
    }

    // Units of Measure shortcut.
    if (is_uom(lhs) && is_uom(rhs)) {
        return lhs.mul(rhs);
    }

    // scalar times tensor?
    if (!is_tensor(lhs) && is_tensor(rhs)) {
        // return scalar_times_tensor(lhs, rhs);
        return $.multiply(lhs, rhs);
    }

    // tensor times scalar?
    if (is_tensor(lhs) && !is_tensor(rhs)) {
        // return tensor_times_scalar(lhs, rhs);
        return $.multiply(lhs, rhs);
    }

    // console.lg("lhs", lhs.toString());
    // console.lg("rhs", rhs.toString());

    // adjust operands - they are both now lists.
    let p1: Cons = is_multiply(lhs) ? lhs.cdr : items_to_cons(lhs);
    let p2: Cons = is_multiply(rhs) ? rhs.cdr : items_to_cons(rhs);

    // console.lg("p1", p1.toString());
    // console.lg("p2", p2.toString());

    const factors: U[] = [];

    // handle numerical coefficients
    const c1 = p1.head;
    const c2 = p2.head;
    if (is_num(c1) && is_num(c2)) {
        factors.push(multiply_num_num(c1, c2));
        p1 = p1.cdr;
        p2 = p2.cdr;
    }
    else if (is_num(c1)) {
        // console.lg("c1", render_as_sexpr(c1, $));
        factors.push(c1);
        p1 = p1.cdr;
    }
    else if (is_num(c2)) {
        // console.lg("c2", render_as_sexpr(c2, $));
        factors.push(c2);
        p2 = p2.cdr;
    }
    else {
        factors.push(one);
    }

    while (is_cons(p1) && is_cons(p2)) {
        const head1 = p1.car;
        const head2 = p2.car;
        if (car(head1).equals(OPERATOR) && car(head2).equals(OPERATOR)) {
            factors.push(cons(OPERATOR, append(cdr(head1), cdr(head2))));
            p1 = p1.cdr;
            p2 = p2.cdr;
            continue;
        }

        const [baseL, expoL] = base_and_expo(head1, $);
        const [baseR, expoR] = base_and_expo(head2, $);

        // We can get the ordering wrong here. e.g. lhs = (pow 2 1/2), rhs = imu
        // We end up comparing 2 and i and the 2 gets pushed first and the i waits
        // for the next loop iteration.
        // console.lg("head1", render_as_infix(head1, $));
        // console.lg("head2", render_as_infix(head2, $));
        // console.lg("baseL", baseL.toString());
        // console.lg("baseR", baseR.toString());
        // console.lg("expoL", expoL.toString());
        // console.lg("expoR", expoR.toString());

        // If the head elements are the same then the bases will be the same.
        // On the other hand, the heads can be different but the bases the same.
        // e.g. head1 = x, head2 = 1/x = (pow x -1)
        if (is_both_bases_equal(baseL, baseR, $)) {
            combine_exponentials_with_common_base(factors, baseL, expoL, expoR, $);
            p1 = p1.cdr;
            p2 = p2.cdr;
        }
        // TODO: There should be a check here that baseL and baseR commute under multiplication...
        else if ($.isFactoring() && is_both_expos_minus_one(expoL, expoR)) {
            combine_exponentials_with_common_expo(factors, baseL, baseR, expoL, $);
            p1 = p1.cdr;
            p2 = p2.cdr;
        }
        else {
            switch (compareFactors(head1, head2)) {
                case SIGN_LT: {
                    factors.push(head1);
                    p1 = p1.cdr;
                    break;
                }
                case SIGN_GT: {
                    factors.push(head2);
                    p2 = p2.cdr;
                    break;
                }
                default: {
                    // Equality here means stable sorting of the head elements.
                    // If we end up here then we already know that the bases are different.
                    // So we definitely can't combine assuming base equality.
                    // This can happen for non-commuting elements. e.g. Blade(s), Tensor(s).
                    // Remove factors that don't commute earlier? Or do we handle them here?
                    throw new Error(`${render_as_infix(baseL, $)} ${render_as_infix(expoL, $)} ${render_as_infix(baseR, $)} ${render_as_infix(expoR, $)}`);
                }
            }
        }
    }

    // push remaining factors, if any
    if (is_cons(p1)) {
        factors.push(...p1);
    }
    if (is_cons(p2)) {
        factors.push(...p2);
    }

    // normalize radical factors
    // example: 2*2(-1/2) -> 2^(1/2)
    // must be done after merge because merge may produce radical
    // example: 2^(1/2-a)*2^a -> 2^(1/2)
    __normalize_radical_factors(factors);

    if ($.isExpanding()) {
        for (let i = 0; i < factors.length; i++) {
            if (is_add(factors[i])) {
                return multiply_all(factors, $);
            }
        }
    }

    // n is the number of result factors on the stack
    const n = factors.length;
    if (n === 1) {
        const retval = assert_not_undefined(factors.pop());
        // console.lg("retval 1", $.toSExprString(retval));
        return retval;
    }

    // discard integer 1
    const first = factors[0];
    if (is_rat(first) && first.isOne()) {
        if (n === 2) {
            const retval = assert_not_undefined(factors.pop());
            // console.lg("retval 2", $.toSExprString(retval));
            return retval;
        }
        else {
            // factors[0] is Rat(1) so we'll just replace it with the multiplication operand
            // so that we can easily built the multiplicative expression from the factors.
            // But before we do that we'll sort the factors to ensure that they are in canonical order.
            // We must do this because, despite our previous efforts, symbols can be shunted in front
            // of exponentials where they later create new exponentials that must be reordered.
            // e.g. a^n * b * b => b * a^n * b = b * b * a^n => b^2 * a^n.
            factors.splice(0, 1);  // remove the Rat(1)
            factors.sort(compareFactors);
            const retval = items_to_cons(MATH_MUL, ...factors);
            // console.lg("retval 3", $.toSExprString(retval));
            return retval;
        }
    }

    const retval = cons(MATH_MUL, items_to_cons(...factors));
    // console.lg("retval 3", $.toSExprString(retval));
    return retval;
}

/**
 * Decomposes an expression into a base and power (pow may be one).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function base_and_expo(expr: U, $: ExtensionEnv): [base: U, expo: U] {
    // console.lg("base_and_power", render_as_infix(expr, $));
    if (is_power(expr)) {
        return [expr.base, expr.expo];
    }
    else {
        return [expr, one];
    }
}

export function append(p1: U, p2: U): U {
    // from https://github.com/gbl08ma/eigenmath/blob/8be989f00f2f6f37989bb7fd2e75a83f882fdc49/src/append.cpp
    const arr: U[] = [];
    if (is_cons(p1)) {
        arr.push(...p1);
    }
    if (is_cons(p2)) {
        arr.push(...p2);
    }
    return items_to_cons(...arr);
}
export function multiply_all(n: U[], $: ExtensionEnv): U {
    if (n.length === 1) {
        return n[0];
    }
    if (n.length === 0) {
        return one;
    }
    let temp = n[0];
    for (let i = 1; i < n.length; i++) {
        temp = multiply(temp, n[i], $);
    }
    return temp;
}

/**
 * Computes base^(expoL+expoR) then finds the most efficient way to add the result to the list of factors.
 */
function combine_exponentials_with_common_base(factors: U[], base: U, expoL: U, expoR: U, $: ExtensionEnv): void {
    const X = $.power(base, $.add(expoL, expoR));
    combine_with_factors(factors, X);
}

/**
 * Computes (baseL*baseR)^expo then finds the most efficient way to add the result to the list of factors.
 */
function combine_exponentials_with_common_expo(factors: U[], baseL: U, baseR: U, expo: U, $: ExtensionEnv): void {
    const X = $.power($.multiply(baseL, baseR), expo);
    combine_with_factors(factors, X);
}

function combine_with_factors(factors: U[], X: U): void {
    if (is_num(X)) {
        factors[0] = multiply_num_num(assert_is_num(factors[0]), X);
    }
    else if (is_multiply(X)) {
        // power can return number * factor (i.e. -1 * i)
        const argList = X.argList;
        const lhs = argList.head;
        // We now look to see if this multiplication is a binary expression with the lhs being a number.
        // This will allow us to make a simplification.
        if (is_num(lhs) && is_nil(cddr(argList))) {
            const rhs = X.rhs;
            factors[0] = multiply_num_num(assert_is_num(factors[0]), lhs);
            factors.push(rhs);
        }
        else {
            factors.push(X);
        }
    }
    else {
        factors.push(X);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function is_both_bases_equal(baseL: U, baseR: U, $: ExtensionEnv): boolean {
    return baseL.equals(baseR);
}

/**
 * By restricting to the case that both exponents are -1 we avoid issues over whether the bases commute under multiplication.
 * e.g. a^(-n) * b^(-n) = 1/(a*a*a...) * 1/(b*b*b...) which is not generally the same as 1/(ab)^(-n) = 1/(ab*ab*ab...).
 * N.B. power_v1 is trying to go in the other direction when $.isFactoring().
 * @param expoL 
 * @param expoR 
 * @param $ 
 * @returns 
 */
function is_both_expos_minus_one(expoL: U, expoR: U): boolean {
    return is_rat(expoL) && is_rat(expoR) && expoL.isMinusOne() && expoR.isMinusOne();
}

/**
 * A runtime check to ensure that a value is not undefined.
 */
function assert_not_undefined<T>(arg: T | undefined): T {
    if (typeof arg === 'undefined') {
        throw new Error();
    }
    else {
        return arg;
    }
}

function assert_is_num(expr: U): Num {
    if (is_num(expr)) {
        return expr;
    }
    else {
        throw new Error();
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function __normalize_radical_factors(factors: U[]): void {
    // TODO
}