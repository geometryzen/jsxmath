import { is_mul } from "../../operators/mul/is_mul";
import { one } from "../../tree/rat/Rat";
import { Cons, is_nil, U } from "../../tree/tree";

export function canonicalize_mul(expr: Cons): U {
    const L0 = expr;
    if (is_mul(L0)) {
        const L1 = L0.cdr;
        if (is_nil(L1)) {
            return one;
        }
        else if (is_nil(L1.cdr)) {
            return L1.car;
        }
        else {
            return L0;
        }
    }
    else {
        return L0;
    }
}