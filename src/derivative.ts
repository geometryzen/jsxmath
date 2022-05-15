import { besselj } from './besselj';
import { bessely } from './bessely';
import { rational } from './bignum';
import { add_terms } from './calculators/add/add_terms';
import { ycosh } from './cosh';
import { dirac } from './dirac';
import { ExtensionEnv } from './env/ExtensionEnv';
import { exp } from './exp';
import { guess } from './guess';
import { hermite } from './hermite';
import { integral } from './integral';
import { length_of_cons_otherwise_zero } from './length_of_cons_or_zero';
import { logarithm } from './log';
import { makeList } from './makeList';
import { multiply_items } from './multiply';
import { nativeInt } from './nativeInt';
import { is_sym } from './operators/sym/is_sym';
import { is_num } from './predicates/is_num';
import {
    ARCCOS,
    ARCCOSH,
    ARCSIN,
    ARCSINH,
    ARCTAN,
    ARCTANH,
    BESSELJ,
    BESSELY,
    COS,
    COSH,
    DERIVATIVE,
    ERF,
    ERFC,
    HERMITE,
    INTEGRAL,
    LOG,
    MULTIPLY,
    POWER,
    SECRETX,
    SGN,
    SIN,
    SINH,
    TAN,
    TANH
} from './runtime/constants';
import { DynamicConstants } from './runtime/defs';
import { is_abs, is_add } from './runtime/helpers';
import { stack_push } from './runtime/stack';
import { sgn } from './sgn';
import { simplify } from './simplify';
import { sine } from './sin';
import { ysinh } from './sinh';
import { subst } from './subst';
import { Err } from './tree/err/Err';
import { caddr, cadr } from './tree/helpers';
import { integer, negOne, one, two, zero } from './tree/rat/Rat';
import { Sym } from './tree/sym/Sym';
import { car, cdr, is_cons, NIL, U } from './tree/tree';

// derivative

//define F p3
//define X p4
//define N p5

export function Eval_derivative(p1: U, $: ExtensionEnv): void {
    // evaluate 1st arg to get function F
    p1 = cdr(p1);
    let F = $.valueOf(car(p1));

    // evaluate 2nd arg and then...

    // example  result of 2nd arg  what to do
    //
    // d(f)      NIL    guess X, N = NIL
    // d(f,2)    2      guess X, N = 2
    // d(f,x)    x      X = x, N = NIL
    // d(f,x,2)  x      X = x, N = 2
    // d(f,x,y)  x      X = x, N = y

    p1 = cdr(p1);

    let X: U, N: U;
    const p2 = $.valueOf(car(p1));
    if (NIL.equals(p2)) {
        X = guess(F);
        N = NIL;
    }
    else if (is_num(p2)) {
        X = guess(F);
        N = p2;
    }
    else {
        X = p2;
        p1 = cdr(p1);
        N = $.valueOf(car(p1));
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
        // p5 (N) might be a symbol instead of a number
        let n: number;
        if (is_num(N)) {
            n = nativeInt(N);
            if (isNaN(n)) {
                stack_push(new Err('nth derivative: check n'));
                return;
            }
        }
        else {
            n = 1;
        }

        let temp = F;
        if (n >= 0) {
            for (let i = 0; i < n; i++) {
                temp = $.derivative(temp, X);
            }
        }
        else {
            n = -n;
            for (let i = 0; i < n; i++) {
                temp = integral(temp, X, $);
            }
        }

        F = temp;

        // if p5 (N) is NIL then arglist is exhausted
        if (NIL === N) {
            break;
        }

        // otherwise...

        // N    arg1    what to do
        //
        // number  NIL    break
        // number  number    N = arg1, continue
        // number  symbol    X = arg1, N = arg2, continue
        //
        // symbol  NIL    X = N, N = NIL, continue
        // symbol  number    X = N, N = arg1, continue
        // symbol  symbol    X = N, N = arg1, continue

        if (is_num(N)) {
            p1 = cdr(p1);
            N = $.valueOf(car(p1));
            if (NIL === N) {
                break; // arglist exhausted
            }
            if (!is_num(N)) {
                X = N;
                p1 = cdr(p1);
                N = $.valueOf(car(p1));
            }
        }
        else {
            X = N;
            p1 = cdr(p1);
            N = $.valueOf(car(p1));
        }
    }

    stack_push(F); // final result
}

export function d_scalar_scalar(p1: U, p2: U, $: ExtensionEnv): U {
    if (is_sym(p2)) {
        return d_scalar_scalar_1(p1, p2, $);
    }

    // Example: d(sin(cos(x)),cos(x))
    // Replace cos(x) <- X, find derivative, then do X <- cos(x)
    const arg1 = subst(p1, p2, SECRETX, $); // p1: sin(cos(x)), p2: cos(x), SECRETX: X => sin(cos(x)) -> sin(X)
    return subst($.derivative(arg1, SECRETX), SECRETX, p2, $); // p2:  cos(x)  =>  cos(X) -> cos(cos(x))
}

function d_scalar_scalar_1(p1: U, p2: Sym, $: ExtensionEnv): U {
    // d(x,x)?
    if (p1.equals(p2)) {
        return one;
    }

    // d(a,x)?
    if (!is_cons(p1)) {
        return zero;
    }

    // TODO: The generalization here would seem to be that we delegate the task to a binary operation implemented by the
    // operator that matches.
    if (is_abs(p1)) {
        return dabs(p1, p2, $);
    }
    if (is_add(p1)) {
        return dsum(p1, p2, $);
    }

    switch (car(p1)) {
        case MULTIPLY:
            return dproduct(p1, p2, $);
        case POWER:
            return dpower(p1, p2, $);
        case DERIVATIVE:
            return dd(p1, p2, $);
        case LOG:
            return dlog(p1, p2, $);
        case SIN:
            return dsin(p1, p2, $);
        case COS:
            return dcos(p1, p2, $);
        case TAN:
            return dtan(p1, p2, $);
        case ARCSIN:
            return darcsin(p1, p2, $);
        case ARCCOS:
            return darccos(p1, p2, $);
        case ARCTAN:
            return darctan(p1, p2, $);
        case SINH:
            return dsinh(p1, p2, $);
        case COSH:
            return dcosh(p1, p2, $);
        case TANH:
            return dtanh(p1, p2, $);
        case ARCSINH:
            return darcsinh(p1, p2, $);
        case ARCCOSH:
            return darccosh(p1, p2, $);
        case ARCTANH:
            return darctanh(p1, p2, $);
        case SGN:
            return dsgn(p1, p2, $);
        case HERMITE:
            return dhermite(p1, p2, $);
        case ERF:
            return derf(p1, p2, $);
        case ERFC:
            return derfc(p1, p2, $);
        case BESSELJ:
            return dbesselj(p1, p2, $);
        case BESSELY:
            return dbessely(p1, p2, $);
        default:
        // pass through
    }

    if (car(p1) === INTEGRAL && caddr(p1) === p2) {
        return derivative_of_integral(p1);
    }

    return dfunction(p1, p2, $);
}

function dsum(p1: U, p2: Sym, $: ExtensionEnv): U {
    const toAdd = is_cons(p1) ? p1.tail().map((el) => $.derivative(el, p2)) : [];
    return add_terms(toAdd, $);
}

function dproduct(p1: U, p2: Sym, $: ExtensionEnv): U {
    const n = length_of_cons_otherwise_zero(p1) - 1;
    const toAdd: U[] = [];
    for (let i = 0; i < n; i++) {
        const arr: U[] = [];
        let p3 = cdr(p1);
        for (let j = 0; j < n; j++) {
            let temp = car(p3);
            if (i === j) {
                temp = $.derivative(temp, p2);
            }
            arr.push(temp);
            p3 = cdr(p3);
        }
        toAdd.push(multiply_items(arr, $));
    }
    return add_terms(toAdd, $);
}

//-----------------------------------------------------------------------------
//
//       v
//  y = u
//
//  log y = v log u
//
//  1 dy   v du           dv
//  - -- = - -- + (log u) --
//  y dx   u dx           dx
//
//  dy    v  v du           dv
//  -- = u  (- -- + (log u) --)
//  dx       u dx           dx
//
//-----------------------------------------------------------------------------

function dpower(p1: U, p2: Sym, $: ExtensionEnv): U {
    // v/u
    const arg1 = $.divide(caddr(p1), cadr(p1));

    // du/dx
    const deriv_1 = $.derivative(cadr(p1), p2);

    // log u
    const log_1 = logarithm(cadr(p1), $);

    // dv/dx
    const deriv_2 = $.derivative(caddr(p1), p2);

    // u^v
    return $.multiply($.add($.multiply(arg1, deriv_1), $.multiply(log_1, deriv_2)), p1);
}

function dlog(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.divide(deriv, cadr(p1));
}

//  derivative of derivative
//
//  example: d(d(f(x,y),y),x)
//
//  p1 = d(f(x,y),y)
//
//  p2 = x
//
//  cadr(p1) = f(x,y)
//
//  caddr(p1) = y
function dd(p1: U, p2: Sym, $: ExtensionEnv): U {
    // d(f(x,y),x)
    const p3 = $.derivative(cadr(p1), p2);

    if (car(p3) === DERIVATIVE) {
        // handle dx terms
        const caddr_p3 = caddr(p3);
        const caddr_p1 = caddr(p1);
        const cadr_p3 = cadr(p3);
        // Determine whether we should be comparing as terms or factors. I think it is as terms.
        if ($.compare(caddr_p3, caddr_p1) < 0) {
            return makeList(DERIVATIVE, makeList(DERIVATIVE, cadr_p3, caddr_p3), caddr_p1);
        }
        else {
            return makeList(DERIVATIVE, makeList(DERIVATIVE, cadr_p3, caddr_p1), caddr_p3);
        }
    }

    return $.derivative(p3, caddr(p1));
}

// derivative of a generic function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dfunction(p1: U, p2: Sym, $: ExtensionEnv): U {
    const p3 = cdr(p1); // p3 is the argument list for the function

    if (NIL === p3 || p3.contains(p2)) {
        return makeList(DERIVATIVE, p1, p2);
    }
    return zero;
}

function dsin(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(deriv, $.cos(cadr(p1)));
}

function dcos(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.negate($.multiply(deriv, sine(cadr(p1), $)));
}

function dtan(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(deriv, $.power($.cos(cadr(p1)), integer(-2)));
}

function darcsin(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(
        deriv,
        $.power($.subtract(one, $.power(cadr(p1), two)), rational(-1, 2))
    );
}

function darccos(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.negate(
        $.multiply(
            deriv,
            $.power(
                $.subtract(one, $.power(cadr(p1), two)),
                rational(-1, 2)
            )
        )
    );
}

//        Without simplify  With simplify
//
//  d(arctan(y/x),x)  -y/(x^2*(y^2/x^2+1))  -y/(x^2+y^2)
//
//  d(arctan(y/x),y)  1/(x*(y^2/x^2+1))  x/(x^2+y^2)
function darctan(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return simplify(
        $.multiply(deriv, $.inverse($.add(one, $.power(cadr(p1), two)))), $
    );
}

function dsinh(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(deriv, ycosh(cadr(p1), $));
}

function dcosh(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(deriv, ysinh(cadr(p1), $));
}

function dtanh(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(deriv, $.power(ycosh(cadr(p1), $), integer(-2)));
}

function darcsinh(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(
        deriv,
        $.power($.add($.power(cadr(p1), two), one), rational(-1, 2))
    );
}

function darccosh(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(
        deriv,
        $.power($.add($.power(cadr(p1), two), negOne), rational(-1, 2))
    );
}

function darctanh(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(
        deriv,
        $.inverse($.subtract(one, $.power(cadr(p1), two)))
    );
}

function dabs(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(deriv, sgn(cadr(p1), $));
}

function dsgn(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply($.multiply(deriv, dirac(cadr(p1), $)), two);
}

function dhermite(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(
        $.multiply(deriv, $.multiply(two, caddr(p1))),
        hermite(cadr(p1), $.add(caddr(p1), negOne), $)
    );
}

function derf(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(
        $.multiply(
            $.multiply(
                exp($.multiply($.power(cadr(p1), two), negOne), $),
                $.power(DynamicConstants.Pi(), rational(-1, 2))
            ),
            two
        ),
        deriv
    );
}

function derfc(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(
        $.multiply(
            $.multiply(
                exp($.multiply($.power(cadr(p1), two), negOne), $),
                $.power(DynamicConstants.Pi(), rational(-1, 2))
            ),
            integer(-2)
        ),
        deriv
    );
}

function dbesselj(p1: U, p2: Sym, $: ExtensionEnv): U {
    if ($.isZero(caddr(p1))) {
        return dbesselj0(p1, p2, $);
    }
    return dbesseljn(p1, p2, $);
}

function dbesselj0(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(
        $.multiply(deriv, besselj(cadr(p1), one, $)),
        negOne
    );
}

function dbesseljn(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    const A = $.add(caddr(p1), negOne);
    const B = $.multiply(caddr(p1), negOne);
    const C = besselj(cadr(p1), A, $);
    const D = $.divide(B, cadr(p1));
    const E = besselj(cadr(p1), caddr(p1), $);
    const F = $.multiply(D, E);
    const G = $.add(C, F);
    return $.multiply(deriv, G);
}

function dbessely(p1: U, p2: Sym, $: ExtensionEnv): U {
    if ($.isZero(caddr(p1))) {
        return dbessely0(p1, p2, $);
    }
    return dbesselyn(p1, p2, $);
}

function dbessely0(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    return $.multiply(
        $.multiply(deriv, besselj(cadr(p1), one, $)),
        negOne
    );
}

function dbesselyn(p1: U, p2: Sym, $: ExtensionEnv): U {
    const deriv = $.derivative(cadr(p1), p2);
    const A = $.add(caddr(p1), negOne);
    const B = $.multiply(caddr(p1), negOne);
    const C = $.divide(B, cadr(p1));
    const D = bessely(cadr(p1), caddr(p1), $);
    const E = bessely(cadr(p1), A, $);
    const F = $.multiply(C, D);
    const G = $.add(E, F);
    return $.multiply(deriv, G);
}

function derivative_of_integral(p1: U): U {
    return cadr(p1);
}
