import { create_str, create_sym, Err, is_err, Sym } from "math-expression-atoms";
import { ExprContext } from "math-expression-context";
import { is_native, Native } from "math-expression-native";
import { cons, Cons, nil, U } from 'math-expression-tree';
import { diagnostic, Diagnostics } from "../../diagnostics/diagnostics";
import { Extension, ExtensionEnv, mkbuilder, TFLAGS, TFLAG_HALT, TFLAG_NONE } from "../../env/ExtensionEnv";
import { hash_for_atom } from "../../hashing/hash_info";
import { infix } from "../../helpers/infix";
import { ProgrammingError } from "../../programming/ProgrammingError";

export class ErrExtension implements Extension<Err> {
    readonly #hash = hash_for_atom(new Err(nil));
    constructor() {
        // Nothing to see here.
    }
    get hash(): string {
        return this.#hash;
    }
    get name(): string {
        return 'ErrExtension';
    }
    test(atom: Err, opr: Sym): boolean {
        if (is_native(opr, Native.iszero)) {
            return false;
        }
        throw new Error(`${this.name}.test(${atom},${opr}) method not implemented.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    binL(lhs: Err, opr: Sym, rhs: U, expr: ExprContext): U {
        // Do we make a hierarchy of causes?
        return lhs;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    binR(rhs: Err, opr: Sym, lhs: U, expr: ExprContext): U {
        // Do we make a hierarchy of causes?
        return rhs;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dispatch(target: Err, opr: Sym, argList: Cons, env: ExprContext): U {
        switch (opr.id) {
            case Native.grade: {
                return target;
            }
            case Native.ascii: {
                return create_str(this.toAsciiString(target, env));
            }
            case Native.human: {
                return create_str(this.toHumanString(target, env));
            }
            case Native.infix: {
                return create_str(this.toInfixString(target, env));
            }
            case Native.latex: {
                return create_str(this.toLatexString(target, env));
            }
            case Native.sexpr: {
                return create_str(this.toListString(target, env));
            }
            case Native.simplify: {
                return target;
            }
        }
        return diagnostic(Diagnostics.Poperty_0_does_not_exist_on_type_1, opr, create_sym(target.type));
    }
    iscons(): false {
        return false;
    }
    operator(): never {
        throw new ProgrammingError();
    }
    evaluate(expr: Err, argList: Cons): [TFLAGS, U] {
        return this.transform(cons(expr, argList));
    }
    transform(expr: U): [TFLAGS, U] {
        return [expr instanceof Err ? TFLAG_HALT : TFLAG_NONE, expr];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    valueOf(expr: Err, $: ExtensionEnv): U {
        throw new Error("ErrExtension.valueOf method not implemented.");
    }
    isKind(arg: U): arg is Err {
        return is_err(arg);
    }
    subst(expr: Err, oldExpr: U, newExpr: U): U {
        if (this.isKind(oldExpr)) {
            if (expr.equals(oldExpr)) {
                return newExpr;
            }
        }
        return expr;
    }
    toAsciiString(err: Err, $: ExprContext): string {
        const cause = err.cause;
        try {
            return infix(cause, $);
        }
        finally {
            cause.release();
        }
    }
    toHumanString(err: Err, $: ExprContext): string {
        const cause = err.cause;
        try {
            return infix(cause, $);
        }
        finally {
            cause.release();
        }
    }
    toInfixString(err: Err, $: ExprContext): string {
        const cause = err.cause;
        try {
            return infix(cause, $);
        }
        finally {
            cause.release();
        }
    }
    toLatexString(err: Err, $: ExprContext): string {
        const cause = err.cause;
        try {
            return infix(cause, $);
        }
        finally {
            cause.release();
        }
    }
    toListString(err: Err, $: ExprContext): string {
        const cause = err.cause;
        try {
            return infix(cause, $);
        }
        finally {
            cause.release();
        }
    }
}

export const err_extension_builder = mkbuilder(ErrExtension);
