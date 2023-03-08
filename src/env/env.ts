import { binop } from "../calculators/binop";
import { yyfactorpoly } from "../factorpoly";
import { hash_info } from "../hashing/hash_info";
import { is_poly_expanded_form } from "../is";
import { useCaretForExponentiation } from "../modes/modes";
import { is_boo } from "../operators/boo/is_boo";
import { MATH_EXP } from "../operators/exp/MATH_EXP";
import { value_of } from "../operators/helpers/valueOf";
import { is_num } from "../operators/num/is_num";
import { is_sym } from "../operators/sym/is_sym";
import { FUNCTION, PREDICATE_IS_REAL } from "../runtime/constants";
import { MATH_ADD, MATH_E, MATH_IMU, MATH_INNER, MATH_LCO, MATH_MUL, MATH_NIL, MATH_OUTER, MATH_PI, MATH_POW, MATH_RCO } from "../runtime/ns_math";
import { createSymTab, SymTab } from "../runtime/symtab";
import { SystemError } from "../runtime/SystemError";
import { negOne, Rat, zero } from "../tree/rat/Rat";
import { Sym } from "../tree/sym/Sym";
import { cons, Cons, is_cons, is_nil, items_to_cons, U } from "../tree/tree";
import { Eval_user_function } from "../userfunc";
import { CompareFn, decodeMode, ExprComparator, ExtensionEnv, FEATURE, LambdaExpr, MODE, MODE_EXPANDING, MODE_FACTORING, MODE_FLAGS_ALL, MODE_SEQUENCE, Operator, OperatorBuilder, PrintHandler, Sign, SymbolProps, TFLAGS, TFLAG_DIFF, TFLAG_HALT, TFLAG_NONE } from "./ExtensionEnv";
import { make_pluggable_function_operator } from "./make_pluggable_function_operator";
import { make_pluggable_keyword_operator } from "./make_pluggable_keyword_operator";
import { NoopPrintHandler } from "./NoopPrintHandler";
import { UnknownOperator } from "./UnknownOperator";

class StableExprComparator implements ExprComparator {
    constructor(private readonly opr: Sym) {
        // 
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    compare(lhs: U, rhs: U, $: ExtensionEnv): Sign {
        throw new Error(`(compare ${this.opr} ${lhs} ${rhs})`);
        // return SIGN_EQ;
    }
}

export interface EnvOptions {
    assumes?: { [name: string]: Partial<SymbolProps> };
    dependencies?: FEATURE[];
    disable?: ('factorize' | 'implicate')[];
    noOptimize?: boolean;
    useCaretForExponentiation?: boolean;
    useDefinitions?: boolean;
}

export interface EnvConfig {
    assumes: { [name: string]: Partial<SymbolProps> };
    dependencies: FEATURE[];
    disable: ('factorize' | 'implicate')[];
    noOptimize: boolean;
    useCaretForExponentiation: boolean;
    useDefinitions: boolean;
}

function config_from_options(options: EnvOptions | undefined): EnvConfig {
    if (options) {
        const config: EnvConfig = {
            assumes: options.assumes ? options.assumes : {},
            dependencies: Array.isArray(options.dependencies) ? options.dependencies : [],
            disable: Array.isArray(options.disable) ? options.disable : [],
            noOptimize: typeof options.noOptimize === 'boolean' ? options.noOptimize : false,
            useCaretForExponentiation: typeof options.useCaretForExponentiation === 'boolean' ? options.useCaretForExponentiation : false,
            useDefinitions: typeof options.useDefinitions === 'boolean' ? options.useDefinitions : false
        };
        return config;
    }
    else {
        const config: EnvConfig = {
            assumes: {},
            dependencies: [],
            disable: [],
            noOptimize: false,
            useCaretForExponentiation: false,
            useDefinitions: false
        };
        return config;
    }
}

interface Assoc {
    lhs: boolean;
    rhs: boolean;
}

export function create_env(options?: EnvOptions): ExtensionEnv {

    const config: EnvConfig = config_from_options(options);

    // console.lg(`config: ${JSON.stringify(config, null, 2)}`);

    const symTab: SymTab = createSymTab();

    const builders: OperatorBuilder<U>[] = [];
    /**
     * The operators in buckets that are determined by the phase and operator.
     */
    const ops_by_mode: { [key: string]: Operator<U>[] }[] = [];
    for (const mode of MODE_SEQUENCE) {
        ops_by_mode[mode] = {};
    }

    const assocs: { [key: string]: Assoc } = {};

    const chains: Map<string, Map<string, LambdaExpr>> = new Map();

    let current_mode: number = MODE_EXPANDING;

    let fieldKind: 'R' | undefined = 'R';

    let printHandler: PrintHandler = new NoopPrintHandler();

    /**
     * Modes flags of the environment.
     */
    const mode_flag: { [mode: string]: boolean } = {};
    /**
     * Override tokens for symbols used during rendering.
     */
    const sym_token: { [key: string]: string } = {};

    const sym_order: Record<string, ExprComparator> = {};

    function currentOps(): { [key: string]: Operator<U>[] } {
        switch (current_mode) {
            case MODE_EXPANDING:
            case MODE_FACTORING: {
                const ops = ops_by_mode[current_mode];
                if (typeof ops === 'undefined') {
                    throw new Error(`currentOps(${current_mode})`);
                }
                return ops;
            }
            default: {
                return {};
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function reverseAssocs() {
        const keys = Object.keys(assocs);
        for (const key of keys) {
            const assoc = assocs[key];
            assoc.lhs = !assoc.lhs;
            assoc.rhs = !assoc.rhs;
        }
    }

    function selectOperator(key: string, expr: U): Operator<U> {
        const ops = currentOps()[key];
        if (Array.isArray(ops) && ops.length > 0) {
            for (const op of ops) {
                if (op.isKind(expr)) {
                    return op;
                }
            }
            throw new SystemError(`No matching operator for key ${key}`);
        }
        else {
            throw new SystemError(`No operators for key ${key} in mode ${JSON.stringify(decodeMode(current_mode))}`);
        }
    }

    /**
     * The environment return value and environment for callbacks.
     */
    const $: ExtensionEnv = {
        getPrintHandler(): PrintHandler {
            return printHandler;
        },
        setField(kind: 'R' | undefined): void {
            fieldKind = kind;
        },
        setPrintHandler(handler: PrintHandler): void {
            if (handler) {
                printHandler = handler;
            }
            else {
                printHandler = new NoopPrintHandler();
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        treatAsReal(sym: Sym): boolean {
            if (fieldKind === 'R') {
                return true;
            }
            else {
                return false;
            }
        },
        add(lhs: U, rhs: U): U {
            return binop(MATH_ADD, lhs, rhs, $);
        },
        clearOperators(): void {
            builders.length = 0;
            for (const phase of MODE_SEQUENCE) {
                const ops = ops_by_mode[phase];
                for (const key in ops) {
                    ops[key] = [];
                }
            }
        },
        defineTransform(opr: Sym, transformer: (expr: Cons, $: ExtensionEnv) => U): void {
            this.defineOperator(make_pluggable_function_operator(opr, transformer));
        },
        defineKeyword(sym: Sym, runner: ($: ExtensionEnv) => void): void {
            $.defineOperator(make_pluggable_keyword_operator(sym, runner));
        },
        defineOperator(builder: OperatorBuilder<U>): void {
            builders.push(builder);
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        defineAssociative(opr: Sym, id: Rat): void {
            // Do nothing.
        },
        clearBindings(): void {
            symTab.clear();
        },
        compareFn(sym: Sym): CompareFn {
            const order = sym_order[sym.key()];
            if (order) {
                // TODO: Cache
                return function (lhs: U, rhs: U): Sign {
                    return order.compare(lhs, rhs, $);
                };
            }
            else {
                return function (lhs: U, rhs: U): Sign {
                    return new StableExprComparator(sym).compare(lhs, rhs, $);
                };
            }
        },
        getSymbolProps(sym: Sym | string): SymbolProps {
            return symTab.getProps(sym);
        },
        getSymbolValue(sym: Sym | string): U {
            return symTab.getValue(sym);
        },
        getSymbolsInfo() {
            return symTab.entries();
        },
        getChain(outer: Sym, inner: Sym): LambdaExpr {
            const outerKey = outer.key();
            const map = chains.get(outerKey);
            if (map) {
                const innerKey = inner.key();
                const lambda = map.get(innerKey);
                if (lambda) {
                    return lambda;
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            return function (argList: Cons, $: ExtensionEnv): U {
                const i = cons(inner, argList);
                return items_to_cons(outer, i);
            };
        },
        setChain(outer: Sym, inner: Sym, lambda: (argList: Cons, $: ExtensionEnv) => U): void {
            const outerKey = outer.key();
            const ensureOuterMap = function () {
                const found = chains.get(outerKey);
                if (found) {
                    return found;
                }
                else {
                    const minted = new Map<string, (argList: Cons, $: ExtensionEnv) => U>();
                    chains.set(outerKey, minted);
                    return minted;
                }

            };
            const map = ensureOuterMap();
            const innerKey = inner.key();
            map.set(innerKey, lambda);
        },
        getMode(): number {
            return current_mode;
        },
        buildOperators(): void {
            for (const builder of builders) {
                const op = builder.create($, config);
                if (dependencies_satisfied(op.dependencies, config.dependencies)) {
                    // No problem.
                }
                else {
                    // console.lg(`Ignoring ${op.name} which depends on ${JSON.stringify(op.dependencies)}`);
                    continue;
                }
                // If an operator does not restrict the modes to which it applies then it applies to all modes.
                const phaseFlags = typeof op.phases === 'number' ? op.phases : MODE_FLAGS_ALL;
                for (const phase of MODE_SEQUENCE) {
                    if (phaseFlags & phase) {
                        const ops = ops_by_mode[phase];
                        if (op.hash) {
                            if (!Array.isArray(ops[op.hash])) {
                                ops[op.hash] = [op];
                            }
                            else {
                                ops[op.hash].push(op);
                            }
                        }
                        else {
                            if (op.key) {
                                if (!Array.isArray(ops[op.key])) {
                                    ops[op.key] = [op];
                                }
                                else {
                                    ops[op.key].push(op);
                                }
                            }
                            else {
                                throw new SystemError(`${op.name} has no key and nohash`);
                            }
                        }

                    }
                }
            }
            // Inspect which operators are assigned to which buckets...
            /*
            for (const key in keydOps) {
                const ops = keydOps[key];
                console.lg(`${key} ${ops.length}`);
                if (ops.length > 5) {
                    for (const op of ops) {
                        console.lg(`${key} ${op.name}  <<<<<<<`);
                    }
                }
            }
            */
        },
        isExpanding(): boolean {
            return current_mode == MODE_EXPANDING;
        },
        isFactoring(): boolean {
            return current_mode === MODE_FACTORING;
        },
        is_imag(expr: U): boolean {
            const op = $.operatorFor(expr);
            const retval = op.isImag(expr);
            // console.lg(`${op.name} isImag ${render_as_infix(expr, $)} => ${retval}`);
            return retval;
        },
        isMinusOne(expr: U): boolean {
            return $.operatorFor(expr).isMinusOne(expr);
        },
        isOne(expr: U): boolean {
            return $.operatorFor(expr).isOne(expr);
        },
        is(predicate: Sym, expr: U): boolean {
            // In the new way we don't require every operator to provide the answer.
            const question = items_to_cons(predicate, expr);
            const response = $.valueOf(question);
            if (is_boo(response)) {
                return response.isTrue();
            }
            else {
                throw new Error(`Unable to determine ${$.toInfixString(predicate)}(${$.toInfixString(expr)})`);
            }
        },
        is_real(expr: U): boolean {
            return this.is(PREDICATE_IS_REAL, expr);
        },
        isScalar(expr: U): boolean {
            const op = $.operatorFor(expr);
            const retval = op.isScalar(expr);
            // console.lg(`${op.name} isScalar ${$.toInfixString(expr)} => ${retval}`);
            return retval;
        },
        isVector(expr: U): boolean {
            return $.operatorFor(expr).isVector(expr);
        },
        isZero(expr: U): boolean {
            const op = $.operatorFor(expr);
            const retval = op.isZero(expr);
            // console.lg(`${op.name} isZero ${expr} => ${retval}`);
            return retval;
        },
        equals(lhs: U, rhs: U): boolean {
            return lhs.equals(rhs);
        },
        factorize(p: U, x: U): U {
            // console.lg(`factorize p=${render_as_infix(p, $)} in variable ${render_as_infix(x, $)}`);
            if (!p.contains(x)) {
                // console.lg(`Giving up b/c the polynomial does not contain the variable.`);
                return p;
            }

            if (!is_poly_expanded_form(p, x, $)) {
                // console.lg(`Giving up b/c the polynomial is not in expanded form.`);
                return p;
            }

            if (is_sym(x)) {
                return yyfactorpoly(p, x, $);
            }
            else {
                // console.lg(`Giving up b/c the variable is not a symbol.`);
                return p;
            }
        },
        getModeFlag(mode: MODE): boolean {
            return !!mode_flag[mode];
        },
        getSymbolToken(sym: Sym): string {
            const token = sym_token[sym.key()];
            // console.lg("getSymbolToken", JSON.stringify(sym), "=>", token);
            return token;
        },
        inner(lhs: U, rhs: U): U {
            // console.lg(`inner lhs=${print_list(lhs, $)} rhs=${print_list(rhs, $)} `);
            const value_lhs = $.valueOf(lhs);
            const value_rhs = $.valueOf(rhs);
            const inner_lhs_rhs = items_to_cons(MATH_INNER, value_lhs, value_rhs);
            const value_inner_lhs_rhs = $.valueOf(inner_lhs_rhs);
            return value_inner_lhs_rhs;
        },
        multiply(lhs: U, rhs: U): U {
            if (is_num(lhs)) {
                if (lhs.isZero()) {
                    return zero;
                }
                if (lhs.isOne()) {
                    return rhs;
                }
            }
            if (is_num(rhs)) {
                if (rhs.isZero()) {
                    return zero;
                }
                if (rhs.isOne()) {
                    return lhs;
                }
            }
            return binop(MATH_MUL, lhs, rhs, $);
        },
        /**
         * The universal unary minus function meaning multiplication by -1.
         */
        negate(x: U): U {
            return binop(MATH_MUL, negOne, x, $);
        },
        operatorFor(expr: U): Operator<U> {
            /*
            if (is_imu(expr)) {
                // This is not good 
                return selectOperator(MATH_POW.key());
            }
            */
            if (is_cons(expr)) {
                const keys = hash_info(expr);
                for (const key of keys) {
                    const ops = currentOps()[key];
                    if (Array.isArray(ops)) {
                        for (const op of ops) {
                            if (op.isKind(expr)) {
                                // console.lg("op", render_as_infix(expr, $), op.name);
                                return op;
                            }
                        }
                    }
                }
                return new UnknownOperator(expr, $);
                // We can end up here for user-defined functions.
                // The consumer is trying to answer a question
                // throw new SystemError(`${expr}, current_phase = ${current_focus} keys = ${JSON.stringify(keys)}`);
            }
            else {
                return selectOperator(expr.name, expr);
            }
        },
        outer(lhs: U, rhs: U): U {
            return binop(MATH_OUTER, lhs, rhs, $);
        },
        power(base: U, expo: U): U {
            const b = value_of(base, $);
            const e = value_of(expo, $);
            const p = items_to_cons(MATH_POW, b, e);
            return value_of(p, $);
        },
        remove(varName: Sym): void {
            symTab.delete(varName);
        },
        setMode(focus: number): void {
            // console.lg(`ExtensionEnv.setFocus(focus=${decodePhase(focus)})`);
            current_mode = focus;
        },
        setModeFlag(mode: MODE, value: boolean): void {
            mode_flag[mode] = value;
        },
        setSymbolOrder(sym: Sym, order: ExprComparator): void {
            sym_order[sym.key()] = order;
        },
        setSymbolProps(sym: Sym, overrides: Partial<SymbolProps>): void {
            symTab.setProps(sym, overrides);
        },
        setSymbolToken(sym: Sym, token: string): void {
            sym_token[sym.key()] = token;
        },
        setSymbolValue(sym: Sym, value: U): void {
            symTab.setValue(sym, value);
        },
        subtract(lhs: U, rhs: U): U {
            const A = $.negate(rhs);
            const B = binop(MATH_ADD, lhs, A, $);
            return B;
        },
        toInfixString(expr: U): string {
            const op = $.operatorFor(expr);
            return op.toInfixString(expr);
        },
        toLatexString(expr: U): string {
            const op = $.operatorFor(expr);
            return op.toLatexString(expr);
        },
        toSExprString(expr: U): string {
            const op = $.operatorFor(expr);
            return op.toListString(expr);
        },
        transform(expr: U): [TFLAGS, U] {
            // console.lg("transform", render_as_sexpr(expr, $), "is_sym", is_sym(expr));
            if (expr.meta === TFLAG_HALT) {
                return [TFLAG_HALT, expr];
            }
            // We short-circuit some expressions in order to improve performance.
            if (is_cons(expr)) {
                // let changedExpr = false;
                const pops = currentOps();
                // keys are the buckets we should look in for operators from specific to generic.
                const keys = hash_info(expr);
                // console.lg("keys", JSON.stringify(keys));
                for (const key of keys) {
                    const ops = pops[key];
                    // console.lg(`Looking for key: ${JSON.stringify(key)} curExpr: ${curExpr} choices: ${Array.isArray(ops) ? ops.length : 'None'}`);
                    // Determine whether there are handlers in the bucket.
                    if (Array.isArray(ops)) {
                        const op = unambiguous_operator(expr, ops, $);
                        if (op) {
                            const composite = op.transform(expr);
                            // console.lg(`${op.name} ${$.toSExprString(expr)} => ${$.toSExprString(composite[1])} flags: ${composite[0]}`);
                            // console.lg(`${op.name} ${$.toInfixString(expr)} => ${$.toInfixString(composite[1])} flags: ${composite[0]}`);
                            return composite;
                        }
                    }
                    else {
                        // If there were no handlers registered for the given key, look for a user-defined function.
                        if (is_cons(expr)) {
                            const opr = expr.opr;
                            if (is_sym(opr)) {
                                const binding = $.getSymbolValue(opr);
                                if (!is_nil(binding)) {
                                    if (is_cons(binding) && FUNCTION.equals(binding.opr)) {
                                        const newExpr = Eval_user_function(expr, $);
                                        // console.lg(`USER FUNC oldExpr: ${render_as_infix(curExpr, $)} newExpr: ${render_as_infix(newExpr, $)}`);
                                        return [TFLAG_DIFF, newExpr];
                                    }
                                }
                            }
                        }
                    }
                }
                // Once an expression has been transformed into a stable condition, it should not be transformed until a different phase.
                expr.meta = TFLAG_HALT;
                return [TFLAG_NONE, expr];
            }
            else if (is_nil(expr)) {
                return [TFLAG_NONE, expr];
            }
            else {
                const op = $.operatorFor(expr);
                return op.transform(expr);
            }
        },
        valueOf(expr: U): U {
            return $.transform(expr)[1];
        }
    };

    // TODO: Consistency in names used for symbols in symbolic expressions.
    $.setSymbolToken(MATH_ADD, '+');        // changing will break  82 cases.
    $.setSymbolToken(MATH_MUL, '*');        // changing will break 113 cases.
    $.setSymbolToken(MATH_POW, 'expt');
    $.setSymbolToken(MATH_RCO, '>>');
    $.setSymbolToken(MATH_LCO, '<<');
    $.setSymbolToken(MATH_INNER, '|');
    $.setSymbolToken(MATH_OUTER, '^');

    $.setSymbolToken(MATH_E, 'e');
    $.setSymbolToken(MATH_PI, 'pi');
    $.setSymbolToken(MATH_NIL, '()');
    $.setSymbolToken(MATH_IMU, 'i');
    $.setSymbolToken(MATH_EXP, 'exp');

    // Backwards compatible, but we should simply set this to false, or leave undefined.
    $.setModeFlag(useCaretForExponentiation, config.useCaretForExponentiation);

    return $;
}

function dependencies_satisfied(deps: FEATURE[] | undefined, includes: FEATURE[]): boolean {
    if (Array.isArray(deps)) {
        for (const dep of deps) {
            if (dep.startsWith('~')) {
                const s = dep.substring(1) as FEATURE;
                if (includes.indexOf(s) >= 0) {
                    return false;
                }
            }
            else {
                if (includes.indexOf(dep) < 0) {
                    return false;
                }
            }
        }
        return true;
    }
    else {
        return true;
    }
}
function unambiguous_operator(expr: Cons, ops: Operator<U>[], $: ExtensionEnv): Operator<U> | undefined {
    const candidates: Operator<U>[] = [];
    for (const op of ops) {
        if (op.isKind(expr)) {
            candidates.push(op);
        }
    }
    if (candidates.length === 1) {
        return candidates[0];
    }
    else if (candidates.length > 0) {
        // The alternative here is that the first operator wins.
        // eslint-disable-next-line no-console
        console.warn(`Ambiguous operators for expression ${$.toInfixString(expr)} ${JSON.stringify(candidates.map((candidate) => candidate.name))}`);
        return candidates[0];
    }
    else {
        return void 0;
    }
}

