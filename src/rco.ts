import { U } from "./tree/tree";
import { is_vec } from "./tree/vec/Algebra";

/**
 * Right Contraction (>>)
 * 
 * @param lhs The left hand side operand. 
 * @param rhs The right hand side operand.
 * @returns lhs >> rhs
 */
export function rco(lhs: U, rhs: U): U {
    if (is_vec(lhs)) {
        if (is_vec(rhs)) {
            return lhs.__rshift__(rhs);
        }
        else {
            throw new Error(`${lhs},${rhs}`);
        }
    }
    else {
        // TODO: It is possible to raise an error and it gets lost. How come?
        throw new Error(`${lhs},${rhs}`);
    }
}
