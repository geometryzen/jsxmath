import { U } from "math-expression-tree";
import { TFLAGS, TFLAG_DIFF, TFLAG_NONE } from "../env/ExtensionEnv";

/**
 * A convenience function.
 */
export function wrap_as_transform(newExpr: U, oldExpr: U): [TFLAGS, U] {
    const flags = newExpr.equals(oldExpr) ? TFLAG_NONE : TFLAG_DIFF;
    return [flags, newExpr];
}
