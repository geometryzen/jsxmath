import { ExtensionEnv, Operator, OperatorBuilder, TFLAGS, TFLAG_DIFF, TFLAG_HALT } from "../../env/ExtensionEnv";
import { hash_binop_atom_atom, HASH_RAT, HASH_SYM } from "../../hashing/hash_info";
import { MATH_POW } from "../../runtime/ns_math";
import { one, Rat } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { Cons, U } from "../../tree/tree";
import { Cons2 } from "../helpers/Cons2";
import { Function2 } from "../helpers/Function2";
import { is_rat } from "../rat/is_rat";
import { is_sym } from "../sym/is_sym";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

type LHS = Sym;
type RHS = Rat;
type EXPR = Cons2<Sym, LHS, RHS>;

class Op extends Function2<LHS, RHS> implements Operator<EXPR> {
    readonly #hash: string;
    constructor($: ExtensionEnv) {
        super('pow_2_sym_rat', MATH_POW, is_sym, is_rat, $);
        this.#hash = hash_binop_atom_atom(MATH_POW, HASH_SYM, HASH_RAT);
    }
    get hash(): string {
        return this.#hash;
    }
    transform2(opr: Sym, base: LHS, expo: RHS, expr: EXPR): [TFLAGS, U] {
        // No change in arguments
        if (expo.isOne()) {
            return [TFLAG_DIFF, base];
        }
        else if (expo.isZero()) {
            // TODO: Some debate here about how (pow 0 0) should be handled.
            return [TFLAG_DIFF, one];
        }
        else {
            return [TFLAG_HALT, expr];
        }
    }
}

export const pow_2_sym_rat = new Builder();