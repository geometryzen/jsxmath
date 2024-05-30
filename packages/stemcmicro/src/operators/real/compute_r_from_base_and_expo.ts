import { ExprContext } from "@stemcmicro/context";
import { exp, log, multiply, real } from "@stemcmicro/native";
import { U } from "@stemcmicro/tree";

export function compute_r_from_base_and_expo(base: U, expo: U, $: Pick<ExprContext, "valueOf">): U {
    const a = log(base);
    try {
        const b = multiply(expo, a);
        try {
            const c = real(b);
            try {
                const r = exp(c);
                try {
                    return $.valueOf(r);
                } finally {
                    r.release();
                }
            } finally {
                c.release();
            }
        } finally {
            b.release();
        }
    } finally {
        a.release();
    }
}
