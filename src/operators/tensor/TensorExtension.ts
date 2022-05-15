import { CostTable } from "../../env/CostTable";
import { Extension, ExtensionEnv, NOFLAGS, TFLAGS } from "../../env/ExtensionEnv";
import { to_infix_string } from "../../print/to_infix_string";
import { MAXDIM } from "../../runtime/constants";
import { subst } from "../../subst";
import { is_tensor } from "../../tree/tensor/is_tensor";
import { Tensor } from "../../tree/tensor/Tensor";
import { Cons, NIL, U } from "../../tree/tree";
import { ExtensionOperatorBuilder } from "../helpers/ExtensionOperatorBuilder";

function equal_elements(as: U[], bs: U[], $: ExtensionEnv): boolean {
    const length = as.length;
    for (let i = 0; i < length; i++) {
        const cmp = $.equals(as[i], bs[i]);
        if (!cmp) {
            return false;
        }
    }
    return true;
}

export function equal_mat_mat(p1: Tensor, p2: Tensor, $: ExtensionEnv): boolean {
    if (p1.ndim < p2.ndim) {
        return false;
    }

    if (p1.ndim > p2.ndim) {
        return false;
    }

    for (let i = 0; i < p1.ndim; i++) {
        if (p1.dim(i) < p2.dim(i)) {
            return false;
        }
        if (p1.dim(i) > p2.dim(i)) {
            return false;
        }
    }

    for (let i = 0; i < p1.nelem; i++) {
        const cmp = $.equals(p1.elem(i), p2.elem(i));
        if (!cmp) {
            return false;
        }
    }

    return true;
}

export function add_mat_mat(A: Tensor, B: Tensor, $: ExtensionEnv): Cons | Tensor {
    if (!A.sameDimensions(B)) {
        return NIL;
    }
    return A.map(function (a, i) {
        return $.add(a, B.elem(i));
    });
}

export function outer_mat_mat(lhs: Tensor, rhs: Tensor, $: ExtensionEnv): Tensor {
    const ndim = lhs.ndim + rhs.ndim;
    if (ndim > MAXDIM) {
        throw new Error('outer: rank of result exceeds maximum');
    }

    const sizes = [...lhs.copyDimensions(), ...rhs.copyDimensions()];

    let k = 0;
    const iLen = lhs.nelem;
    const jLen = rhs.nelem;
    const elems = new Array<U>(iLen * jLen);
    for (let i = 0; i < iLen; i++) {
        for (let j = 0; j < jLen; j++) {
            elems[k++] = $.multiply(lhs.elem(i), rhs.elem(j));
        }
    }
    return new Tensor(sizes, elems);
}

class TensorExtension implements Extension<Tensor> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor($: ExtensionEnv) {
        // Nothing to see here.
    }
    get key(): string {
        return 'Tensor';
    }
    get name(): string {
        return 'TensorExtension';
    }
    cost(expr: Tensor<U>, costs: CostTable, depth: number, $: ExtensionEnv): number {
        // I'm adding 1 to the cost of the matrix for the matrix itself.
        // We might favor operations that replace a matrix?
        return expr
            .mapElements(function (elem) {
                return $.cost(elem, depth);
            })
            .reduce(function (prev, curr) {
                return prev + curr;
            }, 1);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isImag(expr: Tensor): boolean {
        return false;
    }
    isKind(arg: unknown): arg is Tensor {
        return arg instanceof Tensor;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isMinusOne(arg: Tensor): boolean {
        // TODO: What about the square matrix identity element for multiplication? 
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOne(arg: Tensor): boolean {
        // TODO: What about the square matrix identity element for multiplication? 
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isReal(expr: Tensor): boolean {
        return false;
    }
    isScalar(): boolean {
        return false;
    }
    isVector(): boolean {
        return false;
    }
    isZero(arg: Tensor, $: ExtensionEnv): boolean {
        return arg.everyElement(function (element) {
            return $.isZero(element);
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    one(zero: Tensor, $: ExtensionEnv): Tensor {
        throw new Error();
    }
    subst(expr: Tensor, oldExpr: U, newExpr: U, $: ExtensionEnv): U {
        if (is_tensor(oldExpr) && expr.equals(oldExpr)) {
            return newExpr;
        }
        const elems = expr.mapElements((elem) => {
            const result = subst(elem, oldExpr, newExpr, $);
            return result;
        });
        if (equal_elements(expr.copyElements(), elems, $)) {
            return expr;
        }
        else {
            return expr.withElements(elems);
        }
    }
    toInfixString(matrix: Tensor, $: ExtensionEnv): string {
        return to_infix_string(matrix, $);
    }
    toListString(matrix: Tensor, $: ExtensionEnv): string {
        return to_infix_string(matrix, $);
    }
    transform(expr: U): [TFLAGS, U] {
        return [NOFLAGS, expr];
    }
    valueOf(expr: Tensor, $: ExtensionEnv): U {
        // const old_elements = expr.copyElements();
        const new_elements = expr.mapElements(function (element) {
            return $.valueOf(element);
        });
        // TODO: We should only create a new expression if the elements have changed.
        // To do this...
        // 1. zip the ols and new elements together.
        // 2. Determine if there have been changes.
        // 3. Possibly construct a new matrix.
        return expr.withElements(new_elements);
    }
}

export const mat = new ExtensionOperatorBuilder(function ($: ExtensionEnv) {
    return new TensorExtension($);
});