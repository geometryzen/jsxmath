import { ExtensionEnv, Operator, OperatorBuilder, TFLAGS, TFLAG_DIFF } from "../../env/ExtensionEnv";
import { HASH_ANY, hash_binop_atom_atom, HASH_RAT } from "../../hashing/hash_info";
import { MATH_INNER, MATH_MUL } from "../../runtime/ns_math";
import { Rat } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { Cons, items_to_cons, U } from "../../tree/tree";
import { BCons } from "../helpers/BCons";
import { Function2 } from "../helpers/Function2";
import { is_any } from "../helpers/is_any";
import { is_rat } from "../rat/is_rat";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

type LHS = Rat;
type RHS = U;
type EXP = BCons<Sym, LHS, RHS>;

/**
 * 
 */
class Op extends Function2<LHS, RHS> implements Operator<EXP> {
    readonly hash: string;
    constructor($: ExtensionEnv) {
        super('inner_2_rat_any', MATH_INNER, is_rat, is_any, $);
        this.hash = hash_binop_atom_atom(MATH_INNER, HASH_RAT, HASH_ANY);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transform2(opr: Sym, lhs: LHS, rhs: RHS, orig: EXP): [TFLAGS, U] {
        if (lhs.isOne()) {
            return [TFLAG_DIFF, rhs];
        }
        else {
            return [TFLAG_DIFF, items_to_cons(MATH_MUL.clone(opr.pos, opr.end), lhs, rhs)];
        }
    }
}

export const inner_2_rat_any = new Builder();