import { BCons } from "../operators/helpers/BCons";
import { is_pow_2_rat_rat } from "../operators/pow/is_pow_2_rat_rat";
import { Rat } from "../tree/rat/Rat";
import { Sym } from "../tree/sym/Sym";
import { is_cons, U } from "../tree/tree";

/**
 * Determines whether expr is the imaginary unit (imu), (power -1 1/2).
 * @param expr The expression to test.
 */
export function is_imu(expr: U): expr is BCons<Sym, Rat, Rat> {
    if (is_cons(expr) && is_pow_2_rat_rat(expr)) {
        const base = expr.lhs;
        const expo = expr.rhs;
        return base.isMinusOne() && expo.isHalf();
    }
    return false;
}
