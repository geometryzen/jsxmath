import { ExtensionEnv } from "../../env/ExtensionEnv";
import { HASH_ANY, HASH_BOO, hash_unaop_atom } from "../../hashing/hash_info";
import { Sym } from "../../tree/sym/Sym";
import { Cons, is_cons, U } from "../../tree/tree";
import { Function1 } from "../helpers/Function1";
import { UCons } from "../helpers/UCons";

export abstract class AbstractPredicateCons extends Function1<Cons> {
    readonly hash: string;
    constructor(predicateOpr: Sym, private readonly innerOpr: Sym, $: ExtensionEnv) {
        super(`${predicateOpr.text}(expr: (${innerOpr.text}) => ${HASH_ANY}) => ${HASH_BOO}`, predicateOpr, is_cons, $);
        this.hash = hash_unaop_atom(this.opr, HASH_ANY);
    }
    isKind(expr: U): expr is UCons<Sym, Cons> {
        if (super.isKind(expr)) {
            const innerExpr = expr.arg;
            if (is_cons(innerExpr)) {
                return innerExpr.opr.equals(this.innerOpr);
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
}