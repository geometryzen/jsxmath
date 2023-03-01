import { ExtensionEnv, Sign, SIGN_EQ, SIGN_GT, SIGN_LT } from "../../env/ExtensionEnv";
import { compare_blade_blade } from "../../operators/blade/blade_extension";
import { is_blade } from "../../operators/blade/is_blade";
import { is_imu } from "../../operators/imu/is_imu";
import { is_num } from "../../operators/num/is_num";
import { is_str } from "../../operators/str/is_str";
import { strcmp } from "../../operators/str/str_extension";
import { is_sym } from "../../operators/sym/is_sym";
import { is_tensor } from "../../operators/tensor/is_tensor";
import { is_uom } from "../../operators/uom/is_uom";
import { car, cdr, is_cons, is_nil, U } from "../../tree/tree";
import { compare_num_num } from "./compare_num_num";
import { compare_sym_sym } from "./compare_sym_sym";
import { compare_tensors } from "./compare_tensors";

/**
 * NIL, Num, Str, Sym, Tensor, Cons, Blade, Imu, Hyp, Uom
 */
export function cmp_expr(lhs: U, rhs: U, $: ExtensionEnv): Sign {
    // console.lg("ENTERING cmp_expr", "lhs", render_as_sexpr(lhs, $), "rhs", render_as_sexpr(rhs, $));
    let n: Sign = SIGN_EQ;

    if (lhs === rhs) {
        return SIGN_EQ;
    }

    if (is_nil(lhs) && is_nil(rhs)) {
        return SIGN_EQ;
    }

    if (is_nil(lhs)) {
        return SIGN_LT;
    }

    if (is_nil(rhs)) {
        return SIGN_GT;
    }

    if (is_num(lhs) && is_num(rhs)) {
        return compare_num_num(lhs, rhs);
    }

    if (is_num(lhs)) {
        return SIGN_LT;
    }

    if (is_num(rhs)) {
        return SIGN_GT;
    }

    if (is_str(lhs) && is_str(rhs)) {
        return strcmp(lhs.str, rhs.str);
    }

    if (is_str(lhs)) {
        return SIGN_LT;
    }

    if (is_str(rhs)) {
        return SIGN_GT;
    }

    if (is_sym(lhs) && is_sym(rhs)) {
        return compare_sym_sym(lhs, rhs);
    }

    if (is_sym(lhs)) {
        return SIGN_LT;
    }

    if (is_sym(rhs)) {
        return SIGN_GT;
    }

    if (is_tensor(lhs) && is_tensor(rhs)) {
        return compare_tensors(lhs, rhs, $);
    }

    if (is_tensor(lhs)) {
        return SIGN_LT;
    }

    if (is_tensor(rhs)) {
        return SIGN_GT;
    }

    if (is_uom(lhs) && is_uom(rhs)) {
        return SIGN_EQ;
    }

    if (is_uom(lhs)) {
        return SIGN_GT;
    }

    if (is_uom(rhs)) {
        return SIGN_LT;
    }

    if (is_blade(lhs) && is_blade(rhs)) {
        return compare_blade_blade(lhs, rhs);
    }

    if (is_blade(lhs)) {
        return SIGN_GT;
    }

    if (is_blade(rhs)) {
        return SIGN_LT;
    }

    if (is_imu(lhs) && is_imu(rhs)) {
        return SIGN_EQ;
    }

    if (is_imu(lhs)) {
        return SIGN_GT;
    }

    if (is_imu(rhs)) {
        return SIGN_LT;
    }

    // recursion here
    while (is_cons(lhs) && is_cons(rhs)) {
        n = cmp_expr(car(lhs), car(rhs), $);
        if (n !== 0) {
            return n;
        }
        lhs = cdr(lhs);
        rhs = cdr(rhs);
    }

    if (is_cons(rhs)) {
        return SIGN_LT;
    }

    if (is_cons(lhs)) {
        return SIGN_GT;
    }

    return SIGN_EQ;
}