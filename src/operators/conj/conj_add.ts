import { ExtensionEnv, Operator, OperatorBuilder, TFLAGS, TFLAG_DIFF } from "../../env/ExtensionEnv";
import { Native } from "../../native/Native";
import { native_sym } from "../../native/native_sym";
import { Sym } from "../../tree/sym/Sym";
import { Cons, items_to_cons, U } from "../../tree/tree";
import { CompositeOperator } from "../CompositeOperator";

const conj = native_sym(Native.conj);
const add = native_sym(Native.add);

class Builder implements OperatorBuilder<U> {
    create($: ExtensionEnv): Operator<U> {
        return new Op($);
    }
}

/**
 * conj(a + b + c ...) = conj(a) + conj(b) + conj(c) + ...
 */
class Op extends CompositeOperator {
    constructor($: ExtensionEnv) {
        super(conj, add, $);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transform1(opr: Sym, innerExpr: Cons, outerExpr: Cons): [TFLAGS, U] {
        const $ = this.$;
        const terms = innerExpr.tail();
        const mapped = terms.map(function (term) {
            return $.conj(term);
        });
        return [TFLAG_DIFF, $.valueOf(items_to_cons(add, ...mapped))];
    }
}

export const conj_add = new Builder();
