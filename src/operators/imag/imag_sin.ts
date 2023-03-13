import { ExtensionEnv, Operator, OperatorBuilder, TFLAGS, TFLAG_DIFF, TFLAG_NONE } from "../../env/ExtensionEnv";
import { Native } from "../../native/Native";
import { native_sym } from "../../native/native_sym";
import { zero } from "../../tree/rat/Rat";
import { Sym } from "../../tree/sym/Sym";
import { Cons, U } from "../../tree/tree";
import { CompositeOperator } from "../CompositeOperator";

const SIN = native_sym(Native.sin);
const IMAG = native_sym(Native.imag);

class Builder implements OperatorBuilder<U> {
    create($: ExtensionEnv): Operator<U> {
        return new Op($);
    }
}

/**
 * imag(sin(z)) = 0 when z is real
 */
class Op extends CompositeOperator {
    constructor($: ExtensionEnv) {
        super(IMAG, SIN, $);
    }
    transform1(opr: Sym, innerExpr: Cons, outerExpr: Cons): [TFLAGS, U] {
        const $ = this.$;
        const z = innerExpr.argList.head;
        if ($.is_real(z)) {
            return [TFLAG_DIFF, zero];
        }
        else {
            return [TFLAG_NONE, outerExpr];
        }
    }
}

export const imag_sin = new Builder();
