import { Atom } from "math-expression-atoms";
import { LambdaExpr } from 'math-expression-context';
import { Cons, U } from "math-expression-tree";
import { ExtensionEnv } from "../../env/ExtensionEnv";

export class Lambda extends Atom {
    readonly #hash: string;
    readonly #impl: LambdaExpr;
    constructor(impl: LambdaExpr, hash: string, pos?: number, end?: number) {
        super('Lambda', pos, end);
        this.#impl = impl;
        this.#hash = hash;
    }
    get hash(): string {
        return this.#hash;
    }
    evaluate(argList: Cons, $: ExtensionEnv): U {
        return this.#impl(argList, $);
    }
    override equals(other: U): boolean {
        if (this === other) {
            return true;
        }
        if (other instanceof Lambda) {
            return true;
        }
        else {
            return false;
        }
    }
    override toString(): string {
        return '(lambda ...)';
    }
}