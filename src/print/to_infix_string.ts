import { ExtensionEnv } from '../env/ExtensionEnv';
import { print_multiplicative_expr, sign_of_term } from "./print";
import { U } from "../tree/tree";

/**
 * Computes the infix representation of the expression.
 * Infix notation is the notation commonly used in arithmetical and logical formulae and statements.
 * It is characterized by the placement of operators between operands.
 * @param expr The expression for which the infix notation is required. MUST be defined.
 */
export function to_infix_string(expr: U, $: ExtensionEnv): string {
    // The following deserves explaination.
    // Does print_term not print signs?. How would it know not to?
    if (sign_of_term(expr) === '-') {
        return `-${print_multiplicative_expr(expr, $)}`;
    }
    else {
        return print_multiplicative_expr(expr, $);
    }
}
