import { create_sym, is_tensor } from "math-expression-atoms";
import { ExprContext } from "math-expression-context";
import { Native, native_sym } from "math-expression-native";
import { Cons, is_atom, is_cons, U } from "math-expression-tree";
import { diagnostic, Diagnostics } from "../../diagnostics/diagnostics";
import { dispatch_eval_1_arg } from "../../dispatch/dispatch_eval_1_arg";
import { det } from "./det";

const DET = native_sym(Native.det);

export function eval_det(expr: Cons, env: ExprContext): U {
    return dispatch_eval_1_arg(expr, determinant, env);
}

function determinant(expr: U, env: ExprContext): U {
    if (is_tensor(expr)) {
        return det(expr, env);
    }
    else {
        return diagnostic(Diagnostics.Poperty_0_does_not_exist_on_type_1, DET, create_sym(diagnostic_type(expr)));
    }
}

function diagnostic_type(expr: U): string {
    if (is_atom(expr)) {
        return expr.type;
    }
    else if (is_cons(expr)) {
        return 'cons';
    }
    else {
        return 'nil';
    }
}
