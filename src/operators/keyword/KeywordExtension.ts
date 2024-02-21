import { create_sym, is_keyword, Keyword, Sym } from "math-expression-atoms";
import { ExprContext } from "math-expression-context";
import { Cons, nil, U } from "math-expression-tree";
import { diagnostic, Diagnostics } from "../../diagnostics/diagnostics";
import { Extension, ExtensionEnv, FEATURE, mkbuilder, TFLAGS, TFLAG_NONE } from "../../env/ExtensionEnv";
import { hash_for_atom } from "../../hashing/hash_info";

function verify_keyword(x: Keyword): Keyword | never {
    if (is_keyword(x)) {
        return x;
    }
    else {
        throw new Error();
    }
}

class KeywordExtension implements Extension<Keyword> {
    readonly #hash = hash_for_atom(new Keyword('a', 'ns'));
    constructor() {
        // Nothing to see here.
    }
    phases?: number | undefined;
    dependencies?: FEATURE[] | undefined;
    test(atom: Keyword, opr: Sym): boolean {
        throw new Error(`${this.name}.test(${atom},${opr}) method not implemented.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    binL(atom: Keyword, opr: Sym, rhs: U, expr: ExprContext): U {
        return nil;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    binR(atom: Keyword, opr: Sym, lhs: U, expr: ExprContext): U {
        return nil;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dispatch(target: Keyword, opr: Sym, argList: Cons, env: ExprContext): U {
        return diagnostic(Diagnostics.Poperty_0_does_not_exist_on_type_1, opr, create_sym(target.type));
    }
    iscons(): false {
        return false;
    }
    operator(): never {
        throw new Error();
    }
    get hash(): string {
        return this.#hash;
    }
    get name(): string {
        return 'KeywordExtension';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    valueOf(keyword: Keyword, $: ExtensionEnv): U {
        verify_keyword(keyword);
        return keyword;
    }
    isKind(keyword: U): keyword is Keyword {
        if (is_keyword(keyword)) {
            return true;
        }
        else {
            return false;
        }
    }
    subst(expr: Keyword, oldExpr: U, newExpr: U): U {
        if (is_keyword(oldExpr)) {
            if (expr.equals(oldExpr)) {
                return newExpr;
            }
        }
        return expr;
    }
    toHumanString(keyword: Keyword): string {
        return keyword.key();
    }
    toInfixString(keyword: Keyword): string {
        return keyword.key();
    }
    toLatexString(keyword: Keyword): string {
        return keyword.key();
    }
    toListString(keyword: Keyword): string {
        return keyword.key();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    evaluate(expr: Keyword, argList: Cons, $: ExtensionEnv): [number, U] {
        throw new Error("Method not implemented.");
    }
    transform(expr: Keyword): [TFLAGS, U] {
        return [TFLAG_NONE, expr];
    }
}

export const keyword_extension_builder = mkbuilder(KeywordExtension);
