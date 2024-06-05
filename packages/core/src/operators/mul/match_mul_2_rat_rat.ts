import { is_rat, Rat } from "@stemcmicro/atoms";
import { Cons, is_cons, U } from "@stemcmicro/tree";
import { is_mul_2_any_any } from "./is_mul_2_any_any";

export function match_mul_2_rat_rat(expr: U): { expr: Cons; lhs: Rat; rhs: Rat } | undefined {
    if (is_cons(expr) && is_mul_2_any_any(expr)) {
        const lhs = expr.lhs;
        const rhs = expr.rhs;
        if (is_rat(lhs) && is_rat(rhs)) {
            return { expr, lhs, rhs };
        } else {
            return void 0;
        }
    } else {
        return void 0;
    }
}