import { ExtensionEnv } from "../../../env/ExtensionEnv";
import { logarithm } from "../../../log";
import { caddr, cadr } from "../../../tree/helpers";
import { Cons, U } from "../../../tree/tree";
import { derivative } from "../derivative";
//-----------------------------------------------------------------------------
//
//       v
//  y = u                         (1)
//
//  take log of #1
//
//  log y = v log u               (2)
//
// differentiate #2 wrt x
//
//  1 dy   v du           dv
//  - -- = - -- + (log u) --
//  y dx   u dx           dx
//
//  dy    v  v du           dv
//  -- = u  (- -- + (log u) --)
//  dx       u dx           dx
//
//-----------------------------------------------------------------------------
export function dpower(u_pow_v: Cons, x: U, $: ExtensionEnv): U {
    const u = cadr(u_pow_v);
    const v = caddr(u_pow_v);
    // v/u
    const v_div_u = $.divide(v, u);

    // du/dx
    const du_by_dx = derivative(u, x, $);

    // log u
    const log_u = logarithm(u, $);

    // dv/dx
    const dv_by_dx = derivative(v, x, $);

    // u^v
    return $.multiply($.add($.multiply(v_div_u, du_by_dx), $.multiply(log_u, dv_by_dx)), u_pow_v);
}
