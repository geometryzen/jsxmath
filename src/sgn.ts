import { ExtensionEnv } from './env/ExtensionEnv';
import { is_complex_number, is_negative_term } from './is';
import { makeList } from './makeList';
import { mmul } from './mmul';
import { abs } from './operators/abs/abs';
import { SGN } from './runtime/constants';
import { stack_push } from './runtime/stack';
import { is_flt } from './tree/flt/is_flt';
import { cadr } from './tree/helpers';
import { is_rat } from './tree/rat/is_rat';
import { negOne, one, zero } from './tree/rat/Rat';
import { U } from './tree/tree';

//-----------------------------------------------------------------------------
//s
//  Author : philippe.billet@noos.fr
//
//  sgn sign function
//
//
//-----------------------------------------------------------------------------
export function Eval_sgn(p1: U, $: ExtensionEnv): void {
    const result = sgn($.valueOf(cadr(p1)), $);
    stack_push(result);
}

export function sgn(X: U, $: ExtensionEnv): U {
    if (is_flt(X)) {
        if (X.d > 0) {
            return one;
        }
        if (X.d === 0) {
            return one;
        }
        return negOne;
    }

    if (is_rat(X)) {
        const ab = mmul(X.a, X.b);
        if (ab.isNegative()) {
            return negOne;
        }
        if (ab.isZero()) {
            return zero;
        }
        return one;
    }

    if (is_complex_number(X)) {
        return $.multiply($.power(negOne, abs(X, $)), X);
    }

    if (is_negative_term(X)) {
        return $.multiply(makeList(SGN, $.negate(X)), negOne);
    }

    return makeList(SGN, X);
}
