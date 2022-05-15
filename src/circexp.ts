import { imu } from './env/imu';
import { ExtensionEnv } from './env/ExtensionEnv';
import { exp } from './exp';
import { expcos } from './expcos';
import { expsin } from './expsin';
import { COS, COSH, SIN, SINH, TAN, TANH } from './runtime/constants';
import { stack_push } from './runtime/stack';
import { cadr } from './tree/helpers';
import { is_tensor } from './tree/tensor/is_tensor';
import { half, one, two } from './tree/rat/Rat';
import { car, is_cons, U } from './tree/tree';

/* circexp =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------

Returns expression x with circular and hyperbolic functions converted to exponential forms. Sometimes this will simplify an expression.

*/
export function Eval_circexp(p1: U, $: ExtensionEnv): void {
    const result = circexp($.valueOf(cadr(p1)), $);
    stack_push($.valueOf(result));
}

function circexp(p1: U, $: ExtensionEnv): U {
    if (car(p1).equals(COS)) {
        return expcos(cadr(p1), $);
    }

    if (car(p1).equals(SIN)) {
        return expsin(cadr(p1), $);
    }

    if (car(p1).equals(TAN)) {
        p1 = cadr(p1);
        const p2 = exp($.multiply(imu, p1), $);
        const p3 = exp($.negate($.multiply(imu, p1)), $);

        return $.divide($.multiply($.subtract(p3, p2), imu), $.add(p2, p3));
    }

    if (car(p1).equals(COSH)) {
        p1 = cadr(p1);
        return $.multiply($.add(exp(p1, $), exp($.negate(p1), $)), half);
    }

    if (car(p1).equals(SINH)) {
        p1 = cadr(p1);
        return $.multiply($.subtract(exp(p1, $), exp($.negate(p1), $)), half);
    }

    if (car(p1).equals(TANH)) {
        p1 = exp($.multiply(cadr(p1), two), $);
        return $.divide($.subtract(p1, one), $.add(p1, one));
    }

    if (is_cons(p1)) {
        return p1.map(function (x) {
            return circexp(x, $);
        });
    }

    if (is_tensor(p1)) {
        const elems = p1.mapElements(function (x) {
            return circexp(x, $);
        });
        return p1.withElements(elems);
    }

    return p1;
}
