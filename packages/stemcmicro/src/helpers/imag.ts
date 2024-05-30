import { ExprContext } from "@stemcmicro/context";
import { Native, native_sym } from "@stemcmicro/native";
import { items_to_cons, U } from "@stemcmicro/tree";

const IMAG = native_sym(Native.imag);

export function imag(arg: U, env: Pick<ExprContext, "valueOf">): U {
    const raw = items_to_cons(IMAG, arg);
    try {
        return env.valueOf(raw);
    } finally {
        raw.release();
    }
}
