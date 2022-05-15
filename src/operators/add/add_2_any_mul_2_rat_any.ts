import { CHANGED, ExtensionEnv, Operator, OperatorBuilder, TFLAGS } from "../../env/ExtensionEnv";
import { MATH_ADD, MATH_MUL } from "../../runtime/ns_math";
import { is_rat } from "../../tree/rat/is_rat";
import { Rat, zero } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { Cons, is_cons, makeList, U } from "../../tree/tree";
import { and } from "../helpers/and";
import { BCons } from "../helpers/BCons";
import { Function2X } from "../helpers/Function2X";
import { is_any } from "../helpers/is_any";
import { is_opr_2_lhs_any } from "../helpers/is_opr_2_lhs_any";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

function lhs_equals_rhs_rhs(lhs: U, rhs: BCons<Sym, Rat, U>): boolean {
    return lhs.equals(rhs.rhs);
}

/**
 * X + (Rat * X) => (1 + Rat) * X
 */
class Op extends Function2X<U, BCons<Sym, Rat, U>> implements Operator<Cons> {
    constructor($: ExtensionEnv) {
        super('add_2_any_mul_2_rat_any', MATH_ADD, is_any, and(is_cons, is_opr_2_lhs_any(MATH_MUL, is_rat)), lhs_equals_rhs_rhs, $);
    }
    transform2(opr: Sym, lhs: Sym, rhs: BCons<Sym, Rat, Sym>): [TFLAGS, U] {
        const succ = rhs.lhs.succ();
        if (succ.isZero()) {
            return [CHANGED, zero];
        }
        if (succ.isOne()) {
            return [CHANGED, lhs];
        }
        return [CHANGED, makeList(rhs.opr, succ, lhs)];
    }
}

export const add_2_any_mul_2_rat_any = new Builder();
