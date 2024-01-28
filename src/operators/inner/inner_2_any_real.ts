import { ExtensionEnv, Operator, OperatorBuilder, TFLAGS, TFLAG_DIFF } from "../../env/ExtensionEnv";
import { items_to_cons } from "../../makeList";
import { MATH_INNER, MATH_MUL } from "../../runtime/ns_math";
import { one } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { Cons, U } from "../../tree/tree";
import { Cons2 } from "../helpers/Cons2";
import { Function2 } from "../helpers/Function2";
import { is_any } from "../helpers/is_any";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

type LHS = U;
type RHS = U;
type EXP = Cons2<Sym, LHS, RHS>;

function is_real($: ExtensionEnv) {
    return function (expr: LHS): expr is U {
        if ($.isone(expr)) {
            return false;
        }
        const retval = $.isreal(expr);
        return retval;
    };
}

/**
 * X | Y => (X|1) * Y, when Y is real.
 */
class Op extends Function2<LHS, RHS> implements Operator<EXP> {
    constructor($: ExtensionEnv) {
        super('inner_2_any_real', MATH_INNER, is_any, is_real($), $);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transform2(opr: Sym, lhs: LHS, rhs: RHS, expr: EXP): [TFLAGS, U] {
        const $ = this.$;
        const A = $.valueOf(items_to_cons(opr, lhs, one));
        const B = $.valueOf(items_to_cons(MATH_MUL, A, rhs));
        return [TFLAG_DIFF, B];
    }
}

export const inner_2_any_real = new Builder();
