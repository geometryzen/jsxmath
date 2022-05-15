import { Cons, makeList } from "../tree/tree";

/**
 * TODO: This si a dangerous utility because it could be assumed that the reversion goes all the way down.
 * (op a b) => (op b a)
 */
export function reverse_binop(expr: Cons): Cons {
    const opr = expr.opr;
    const lhs = expr.lhs;
    const rhs = expr.rhs;
    return makeList(opr, rhs, lhs);
}
