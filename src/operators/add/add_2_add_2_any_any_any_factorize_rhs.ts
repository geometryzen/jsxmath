import { do_factorize_rhs } from "../../calculators/factorize/do_factorize_rhs";
import { is_factorize_rhs } from "../../calculators/factorize/is_factorize_rhs";
import { CHANGED, ExtensionEnv, Operator, OperatorBuilder, TFLAGS } from "../../env/ExtensionEnv";
import { MATH_ADD } from "../../runtime/ns_math";
import { one } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { Cons, is_cons, makeList, U } from "../../tree/tree";
import { and } from "../helpers/and";
import { BCons } from "../helpers/BCons";
import { Function2X } from "../helpers/Function2X";
import { is_any } from "../helpers/is_any";
import { is_add_2_any_any } from "./is_add_2_any_any";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

type LHS = BCons<Sym, U, U>;
type RHS = U;
type EXPR = BCons<Sym, LHS, RHS>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cross($: ExtensionEnv) {
    return function (lhs: LHS, rhs: RHS): boolean {
        // A problem with this is that we have performed the tree transformation either twice
        // if is successful, or partially if it fails.
        return is_factorize_rhs(lhs.rhs, rhs);
    };
}

/**
 * (X + Y) + Z => (X + m * A) + n * A => X + (m + n) * A, where Y = m * A, and Z = n * A.
 */
class Op extends Function2X<LHS, RHS> implements Operator<EXPR> {
    constructor($: ExtensionEnv) {
        super('add_2_add_2_any_any_any_factorize_rhs', MATH_ADD, and(is_cons, is_add_2_any_any), is_any, cross($), $);
    }
    transform2(opr: Sym, lhs: LHS, rhs: RHS, orig: EXPR): [TFLAGS, U] {
        const $ = this.$;
        const X = lhs.lhs;
        const Y = lhs.rhs;
        const Z = rhs;
        const mnA = do_factorize_rhs(Y, Z, one, orig, $)[1];
        return [CHANGED, $.valueOf(makeList(MATH_ADD, X, mnA))];
    }
}

export const add_2_add_2_any_any_any_factorize_rhs = new Builder();
