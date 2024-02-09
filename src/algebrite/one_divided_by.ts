import { Err, is_flt, is_rat, negOne, one } from "math-expression-atoms";
import { items_to_cons, U } from "math-expression-tree";
import { Native } from "../native/Native";
import { native_sym } from "../native/native_sym";
import { oneAsFlt } from "../tree/flt/Flt";

/**
 * Constructs (divide 1 expr) without any further evaluation.
 */
export function one_divided_by(expr: U): U {
    if (is_rat(expr)) {
        if (expr.isZero()) {
            return new Err(items_to_cons(native_sym(Native.divide), one, expr));
        }
        else {
            return expr.inv();
        }
    }
    else if (is_flt(expr)) {
        if (expr.isZero()) {
            return new Err(items_to_cons(native_sym(Native.divide), oneAsFlt, expr));
        }
        else {
            return expr.inv();
        }
    }
    else {
        return items_to_cons(native_sym(Native.pow).clone(expr.pos, expr.end), expr, negOne);
    }
}