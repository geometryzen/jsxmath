
import { ExtensionEnv, MODE_EXPANDING, Operator, TFLAGS, TFLAG_DIFF } from "../../env/ExtensionEnv";
import { HASH_ANY, hash_binop_atom_cons } from "../../hashing/hash_info";
import { is_cons_opr_eq_sym } from "../../predicates/is_cons_opr_eq_sym";
import { Sym } from "../../tree/sym/Sym";
import { Cons, is_cons, items_to_cons, U } from "../../tree/tree";
import { BCons } from "../helpers/BCons";
import { Function2 } from "../helpers/Function2";
import { is_any } from "../helpers/is_any";

type LHS = U;
type RHS = Cons;
type EXPR = BCons<Sym, LHS, RHS>;

function make_is_cons_and_opr_eq_sym(lower: Sym) {
    return function (expr: U): expr is Cons {
        return is_cons(expr) && is_cons_opr_eq_sym(expr, lower);
    };
}

/**
 * (upper A (lower x1 x2 x3 ...))
 */
export class DistributiveLawExpandLeft extends Function2<LHS, RHS> implements Operator<EXPR> {
    readonly hash: string;
    readonly phases = MODE_EXPANDING;
    constructor($: ExtensionEnv, upper: Sym, lower: Sym) {
        super(`${upper} left-distributive over ${lower}`, upper, is_any, make_is_cons_and_opr_eq_sym(lower), $);
        this.hash = hash_binop_atom_cons(upper, HASH_ANY, lower);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transform2(opr: Sym, lhs: LHS, rhs: RHS, orig: EXPR): [TFLAGS, U] {
        const add = rhs.opr;
        const A = lhs;
        const xs = rhs.tail();
        const terms = xs.map(function (x) {
            return items_to_cons(opr, A, x);
        });
        const retval = items_to_cons(add, ...terms);
        return [TFLAG_DIFF, retval];
    }
}