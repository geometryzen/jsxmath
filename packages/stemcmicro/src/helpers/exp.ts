import { ExprContext } from "@stemcmicro/context";
import { Native, native_sym } from "@stemcmicro/native";
import { items_to_cons, U } from "@stemcmicro/tree";

const EXP = native_sym(Native.exp);

export function exp(arg: U, env: Pick<ExprContext, "valueOf">): U {
    const raw = items_to_cons(EXP, arg);
    try {
        return env.valueOf(raw);
    } finally {
        raw.release();
    }
}
