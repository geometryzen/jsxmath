import { ExprContext, Sign, SIGN_EQ } from "@stemcmicro/context";
import { Cons } from "@stemcmicro/tree";
import { compare_term_term } from "./compare_term_term";

export function compare_cons_cons(lhs: Cons, rhs: Cons, $: ExprContext): Sign {
    return compare_cons_cons_args(lhs, rhs, $, 0);
}

/**
 * FIXME: Needs more testing.
 */
export function compare_cons_cons_args(lhs: Cons, rhs: Cons, $: ExprContext, index: number): Sign {
    // console.lg("compare_cons_cons", $.toInfixString(lhs), $.toInfixString(rhs));
    if (index < lhs.length) {
        // Fall through.
    } else {
        return SIGN_EQ;
    }
    if (index < rhs.length) {
        // Fall through.
    } else {
        return SIGN_EQ;
    }
    const indexSign = compare_term_term(lhs.item(index), rhs.item(index), $);
    switch (indexSign) {
        case SIGN_EQ: {
            return compare_cons_cons_args(lhs, rhs, $, index + 1);
        }
        default: {
            return indexSign;
        }
    }
}
