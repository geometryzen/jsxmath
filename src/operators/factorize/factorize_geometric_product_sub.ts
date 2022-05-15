import { CHANGED, ExtensionEnv, NOFLAGS, Operator, OperatorBuilder, TFLAGS } from "../../env/ExtensionEnv";
import { MATH_ADD, MATH_MUL } from "../../runtime/ns_math";
import { Rat } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { Cons, is_cons, makeList, U } from "../../tree/tree";
import { and } from "../helpers/and";
import { BCons } from "../helpers/BCons";
import { Function2X } from "../helpers/Function2X";
import { is_inner_2_sym_sym } from "../inner/is_inner_2_sym_sym";
import { is_mul_2_rat_outer_2_sym_sym } from "../mul/is_mul_2_rat_outer_2_sym_sym";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

/**
 * Match a|b - a^b, ensuring a,b are vectors and that the appropriate parts are equal. 
 */
function cross($: ExtensionEnv) {
    return function (lhs: BCons<Sym, Sym, Sym>, rhs: BCons<Sym, Rat, BCons<Sym, Sym, Sym>>): boolean {
        const ai = lhs.lhs;
        const bi = lhs.rhs;
        const num = rhs.lhs;
        const ao = rhs.rhs.lhs;
        const bo = rhs.rhs.rhs;
        if (num.isMinusOne(), ai.equalsSym(ao) && bi.equals(bo)) {
            return $.treatAsVector(ai) && $.treatAsVector(bi);
        }
        return false;
    };
}

/**
 * (a|b)-(a^b) => b*a
 * (+ (| a b) (* -1 (^ a b))) => b * a
 */
class Op extends Function2X<BCons<Sym, Sym, Sym>, BCons<Sym, Rat, BCons<Sym, Sym, Sym>>> implements Operator<Cons> {
    readonly hash: string;
    constructor($: ExtensionEnv) {
        super('factorize_geometric_product_sub', MATH_ADD, and(is_cons, is_inner_2_sym_sym), and(is_cons, is_mul_2_rat_outer_2_sym_sym), cross($), $);
        this.hash = `(+ (|) (*))`;
    }
    transform2(opr: Sym, lhs: BCons<Sym, U, U>, rhs: BCons<Sym, U, U>, orig: BCons<Sym, BCons<Sym, U, U>, BCons<Sym, U, U>>): [TFLAGS, U] {
        const $ = this.$;
        if ($.isFactoring()) {
            const a = lhs.lhs;
            const b = lhs.rhs;
            return [CHANGED, makeList(MATH_MUL.clone(opr.pos, opr.end), b, a)];
        }
        return [NOFLAGS, orig];
    }
}

export const factorize_geometric_product_sub = new Builder();
