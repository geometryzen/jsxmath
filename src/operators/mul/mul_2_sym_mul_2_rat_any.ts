import { ExtensionEnv, Operator, OperatorBuilder, SIGN_GT, TFLAGS, TFLAG_DIFF, TFLAG_NONE } from "../../env/ExtensionEnv";
import { hash_binop_atom_cons, HASH_SYM } from "../../hashing/hash_info";
import { items_to_cons } from "../../makeList";
import { MATH_MUL } from "../../runtime/ns_math";
import { Rat } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { Cons, is_cons, U } from "../../tree/tree";
import { and } from "../helpers/and";
import { Cons2 } from "../helpers/Cons2";
import { Function2 } from "../helpers/Function2";
import { is_sym } from "../sym/is_sym";
import { is_mul_2_rat_any } from "./is_mul_2_rat_any";

class Builder implements OperatorBuilder<Cons> {
    create($: ExtensionEnv): Operator<Cons> {
        return new Op($);
    }
}

export const mul_2_sym_mul_2_rat_any = new Builder();

type LHS = Sym;
type RHS = Cons2<Sym, Rat, U>;
type EXP = Cons2<Sym, LHS, RHS>

/**
 * a * (n * X) => n * (a * X), where n is a number, a is a symbol, and X is anything.
 */
class Op extends Function2<LHS, RHS> implements Operator<EXP> {
    readonly #hash: string;
    constructor($: ExtensionEnv) {
        super('mul_2_sym_mul_2_rat_any', MATH_MUL, is_sym, and(is_cons, is_mul_2_rat_any), $);
        this.#hash = hash_binop_atom_cons(MATH_MUL, HASH_SYM, MATH_MUL);
    }
    get hash(): string {
        return this.#hash;
    }
    transform2(opr: Sym, lhs: LHS, rhs: RHS, expr: EXP): [TFLAGS, U] {
        const $ = this.$;
        const a = lhs;
        const n = rhs.lhs;
        const X = rhs.rhs;
        switch ($.compareFn(opr)(a, n)) {
            case SIGN_GT: {
                const aX = $.valueOf(items_to_cons(rhs.opr, a, X));
                const naX = $.valueOf(items_to_cons(opr, n, aX));
                return [TFLAG_DIFF, naX];
            }
            default: {
                return [TFLAG_NONE, expr];
            }
        }
    }
}
