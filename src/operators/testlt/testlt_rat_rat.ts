import { ExtensionEnv, Operator, OperatorBuilder, TFLAGS, TFLAG_DIFF } from "../../env/ExtensionEnv";
import { hash_binop_atom_atom, HASH_RAT } from "../../hashing/hash_info";
import { predicate_return_value } from "../../helpers/predicate_return_value";
import { Native } from "../../native/Native";
import { native_sym } from "../../native/native_sym";
import { Rat } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { U } from "../../tree/tree";
import { BCons } from "../helpers/BCons";
import { Function2 } from "../helpers/Function2";
import { is_rat } from "../rat/is_rat";

export const MATH_LT = native_sym(Native.test_lt);

class Builder implements OperatorBuilder<U> {
    create($: ExtensionEnv): Operator<U> {
        return new Op($);
    }
}

type LHS = Rat;
type RHS = Rat;
type EXPR = BCons<Sym, LHS, RHS>;

class Op extends Function2<LHS, RHS> implements Operator<EXPR> {
    readonly hash: string;
    constructor($: ExtensionEnv) {
        super('testlt_rat_rat', MATH_LT, is_rat, is_rat, $);
        this.hash = hash_binop_atom_atom(MATH_LT, HASH_RAT, HASH_RAT);
    }
    transform2(opr: Sym, lhs: LHS, rhs: RHS): [TFLAGS, U] {
        return [TFLAG_DIFF, predicate_return_value(lhs.compare(rhs) < 0, this.$)];
    }
}

export const testlt_rat_rat = new Builder();
