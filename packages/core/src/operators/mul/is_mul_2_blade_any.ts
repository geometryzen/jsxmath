import { Blade, is_blade } from "@stemcmicro/atoms";
import { is_mul_2_any_any } from "@stemcmicro/helpers";
import { Sym } from "../../tree/sym/Sym";
import { Cons, U } from "../../tree/tree";
import { Cons2 } from "../helpers/Cons2";

export function is_mul_2_blade_any(expr: Cons): expr is Cons2<Sym, Blade, U> {
    return is_mul_2_any_any(expr) && is_blade(expr.lhs);
}
