import { cmp_terms } from "../../calculators/compare/cmp_terms";
import { ExtensionEnv, MODE_EXPLICATE, MODE_FLAGS_ALL, MODE_IMPLICATE, Operator, OperatorBuilder, TFLAGS, TFLAG_DIFF, TFLAG_NONE } from "../../env/ExtensionEnv";
import { HASH_ANY, hash_binop_cons_atom } from "../../hashing/hash_info";
import { MATH_ADD } from "../../runtime/ns_math";
import { Sym } from "../../tree/sym/Sym";
import { Cons, is_cons, items_to_cons, U } from "../../tree/tree";
import { and } from "../helpers/and";
import { BCons } from "../helpers/BCons";
import { Function2X } from "../helpers/Function2X";
import { is_any } from "../helpers/is_any";
import { is_add } from "./is_add";
import { is_add_2_any_any } from "./is_add_2_any_any";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

type LL = U;
type LR = U;
type LHS = BCons<Sym, LL, LR>;
type RHS = U;
type EXP = BCons<Sym, LHS, RHS>;

function cross($: ExtensionEnv) {
    return function (lhs: LHS, rhs: RHS): boolean {
        // If the right hand side is an addition then the ordering will be indeterminate.
        if (is_cons(rhs) && is_add(rhs)) {
            return false;
        }
        else {
            const sign = cmp_terms(lhs.rhs, rhs, $);
            // console.lg(`add_2_assoc_lhs_canonical_ordering lhs.rhs=${render_as_infix(lhs.rhs, $)} rhs=${render_as_infix(rhs, $)} sign=${sign}`);
            return sign > 0;
        }
    };
}

/**
 * (X + Z) + A => (X + A) + Z
 */
class Op extends Function2X<LHS, RHS> implements Operator<EXP> {
    readonly hash: string;
    readonly phases = MODE_FLAGS_ALL & (~MODE_EXPLICATE) & (~MODE_IMPLICATE);
    constructor($: ExtensionEnv) {
        super('add_2_assoc_lhs_canonical_ordering', MATH_ADD, and(is_cons, is_add_2_any_any), is_any, cross($), $);
        this.hash = hash_binop_cons_atom(MATH_ADD, MATH_ADD, HASH_ANY);
    }
    transform2(opr: Sym, lhs: LHS, rhs: RHS, orig: EXP): [TFLAGS, U] {
        const $ = this.$;
        if ($.isAssociationExplicit()) {
            const X = lhs.lhs;
            const z = lhs.rhs;
            const a = rhs;
            const Xa = items_to_cons(lhs.opr, X, a);
            const retval = items_to_cons(opr, Xa, z);
            return [TFLAG_DIFF, retval];
        }
        else {
            return [TFLAG_NONE, orig];
        }
    }
}

export const add_2_assoc_lhs_canonical_ordering = new Builder();
