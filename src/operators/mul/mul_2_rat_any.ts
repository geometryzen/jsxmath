
import { CHANGED, ExtensionEnv, NOFLAGS, Operator, OperatorBuilder, TFLAGS } from "../../env/ExtensionEnv";
import { MATH_MUL } from "../../runtime/ns_math";
import { is_rat } from "../../tree/rat/is_rat";
import { Rat } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { Cons, U } from "../../tree/tree";
import { BCons } from "../helpers/BCons";
import { Function2 } from "../helpers/Function2";
import { is_any } from "../helpers/is_any";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

type LHS = Rat;
type RHS = U;
type EXPR = BCons<Sym, LHS, RHS>;

/**
 * Rat * X
 */
class Op extends Function2<LHS, RHS> implements Operator<EXPR> {
    constructor($: ExtensionEnv) {
        super('mul_2_rat_any', MATH_MUL, is_rat, is_any, $);
    }
    isImag(expr: EXPR): boolean {
        const $ = this.$;
        return $.isImag(expr.rhs);
    }
    isReal(expr: EXPR): boolean {
        const $ = this.$;
        return $.isReal(expr.rhs);
    }
    isScalar(expr: EXPR): boolean {
        const $ = this.$;
        return $.isScalar(expr.rhs);
    }
    isVector(expr: EXPR): boolean {
        const $ = this.$;
        return $.isVector(expr.rhs);
    }
    transform2(opr: Sym, lhs: LHS, rhs: RHS, expr: EXPR): [TFLAGS, U] {
        if (lhs.isZero()) {
            return [CHANGED, lhs];
        }
        else if (lhs.isOne()) {
            return [CHANGED, rhs];
        }
        return [NOFLAGS, expr];
    }
}

export const mul_2_rat_any = new Builder();
