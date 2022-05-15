import { CHANGED, ExtensionEnv, Operator, OperatorBuilder, TFLAGS } from "../../env/ExtensionEnv";
import { makeList } from "../../makeList";
import { MATH_MUL } from "../../runtime/ns_math";
import { Sym } from "../../tree/sym/Sym";
import { Cons, is_cons, U } from "../../tree/tree";
import { is_add_2_any_any } from "../add/is_add_2_any_any";
import { and } from "../helpers/and";
import { BCons } from "../helpers/BCons";
import { Function2X } from "../helpers/Function2X";
import { is_any } from "../helpers/is_any";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

type LHS = BCons<Sym, U, U>;
type RHS = U;
type EXP = BCons<Sym, LHS, RHS>;

function cross($: ExtensionEnv) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (lhs: LHS, rhs: RHS): boolean {
        return $.isExpanding();
    };
}

/**
 * Operation * is right-distributive over (or with respect to ) +
 * 
 * (A + B) * C => (A * C) + (A * B) 
 */
class Op extends Function2X<LHS, RHS> implements Operator<EXP> {
    readonly hash = '(* (+) U)';
    constructor($: ExtensionEnv) {
        super('mul_rhs_distrib_over_add_expand', MATH_MUL, and(is_cons, is_add_2_any_any), is_any, cross($), $);
    }
    isZero(expr: EXP): boolean {
        const $ = this.$;
        return $.isZero(expr.lhs) || $.isZero(expr.rhs);
    }
    transform2(opr: Sym, lhs: LHS, rhs: RHS): [TFLAGS, U] {
        const a = lhs.lhs;
        const b = lhs.rhs;
        const c = rhs;
        const ac = makeList(opr, a, c);
        const bc = makeList(opr, b, c);
        return [CHANGED, makeList(lhs.opr, ac, bc)];
    }
}

/**
 * Operation * is right-distributive over (or with respect to ) +
 * 
 * (A + B) * C => (A * C) + (A * B) 
 */
export const mul_rhs_distrib_over_add_expand = new Builder();
