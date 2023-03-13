import { yyfactorpoly } from "../factorpoly";
import { hash_info } from "../hashing/hash_info";
import { is_poly_expanded_form } from "../is";
import { Native } from "../native/Native";
import { native_sym } from "../native/native_sym";
import { is_boo } from "../operators/boo/is_boo";
import { is_lambda } from "../operators/lambda/is_lambda";
import { is_rat } from "../operators/rat/is_rat";
import { is_sym } from "../operators/sym/is_sym";
import { wrap_as_transform } from "../operators/wrap_as_transform";
import { FUNCTION } from "../runtime/constants";
import { createSymTab, SymTab } from "../runtime/symtab";
import { SystemError } from "../runtime/SystemError";
import { Lambda } from "../tree/lambda/Lambda";
import { negOne, Rat } from "../tree/rat/Rat";
import { Sym } from "../tree/sym/Sym";
import { cons, Cons, is_cons, is_nil, items_to_cons, U } from "../tree/tree";
import { Eval_user_function } from "../userfunc";
import { DirectiveStack } from "./DirectiveStack";
import { CompareFn, Directive, ExprComparator, ExtensionEnv, FEATURE, KeywordRunner, LambdaExpr, LegacyExpr, MODE_EXPANDING, MODE_FACTORING, MODE_FLAGS_ALL, MODE_SEQUENCE, Operator, OperatorBuilder, PrintHandler, Sign, SymbolProps, TFLAGS, TFLAG_DIFF, TFLAG_HALT, TFLAG_NONE } from "./ExtensionEnv";
import { NoopPrintHandler } from "./NoopPrintHandler";
import { operator_from_keyword_runner } from "./operator_from_keyword_runner";
import { hash_from_match, operator_from_legacy_transformer, opr_from_match } from "./operator_from_legacy_transformer";
import { UnknownOperator } from "./UnknownOperator";

const ADD = native_sym(Native.add);
const MULTIPLY = native_sym(Native.multiply);
const POWER = native_sym(Native.pow);
const ISCOMPLEX = native_sym(Native.is_complex);
const ISREAL = native_sym(Native.is_real);

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
    disable?: ('expand' | 'factor')[];
    noOptimize?: boolean;
    useCaretForExponentiation?: boolean;
    useDefinitions?: boolean;
}

export interface EnvConfig {
    assumes: { [name: string]: Partial<SymbolProps> };
    dependencies: FEATURE[];
    disable: ('expand' | 'factor')[];
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

    let printHandler: PrintHandler = new NoopPrintHandler();

    const native_directives = new DirectiveStack();
    const custom_directives: { [directive: string]: boolean } = {};

    /**
     * Override printname(s) for symbols used during rendering.
     */
    const sym_key_to_printname: { [key: string]: string } = {};

    const sym_order: Record<string, ExprComparator> = {};

    function currentOps(): { [key: string]: Operator<U>[] } {
        if (native_directives.get(Directive.expand)) {
            const ops = ops_by_mode[MODE_EXPANDING];
            if (typeof ops === 'undefined') {
                throw new Error(`currentOps(${MODE_EXPANDING})`);
            }
            return ops;
        }
        if (native_directives.get(Directive.factor)) {
            const ops = ops_by_mode[MODE_FACTORING];
            if (typeof ops === 'undefined') {
                throw new Error(`currentOps(${MODE_FACTORING})`);
            }
            return ops;
        }
        return {};
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
            // eslint-disable-next-line no-console
            console.warn("expand", native_directives.get(Directive.expand));
            // eslint-disable-next-line no-console
            console.warn("factor", native_directives.get(Directive.factor));
            throw new SystemError(`No operators for key ${key} in current mode}`);
        }
    }

    /**
     * The environment return value and environment for callbacks.
     */
    const $: ExtensionEnv = {
        getPrintHandler(): PrintHandler {
            return printHandler;
        },
        setPrintHandler(handler: PrintHandler): void {
            if (handler) {
                printHandler = handler;
            }
            else {
                printHandler = new NoopPrintHandler();
            }
        },
        add(...args: U[]): U {
            return $.evaluate(Native.add, ...args);
        },
        arctan(expr: U): U {
            return $.evaluate(Native.arctan, expr);
        },
        arg(expr: U): U {
            return $.evaluate(Native.arg, expr);
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
        defineLegacyTransformer(opr: Sym, transformer: LegacyExpr): void {
            $.defineOperator(operator_from_legacy_transformer(opr, transformer));
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        defineFunction(match: U, impl: LambdaExpr): void {
            // $.defineOperator(operator_from_modern_transformer(match, impl));
            const opr = opr_from_match(match);
            const hash = hash_from_match(match);
            $.setSymbolValue(opr, new Lambda(impl, hash));
        },
        defineKeyword(sym: Sym, runner: KeywordRunner): void {
            $.defineOperator(operator_from_keyword_runner(sym, runner));
        },
        defineOperator(builder: OperatorBuilder<U>): void {
            builders.push(builder);
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        defineAssociative(opr: Sym, id: Rat): void {
            // Do nothing.
        },
        divide(lhs: U, rhs: U): U {
            return $.multiply(lhs, $.power(rhs, negOne));
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
        conj(expr: U): U {
            return $.evaluate(Native.conj, expr);
        },
        cos(expr: U): U {
            return $.evaluate(Native.cos, expr);
        },
        evaluate(opr: Native, ...args: U[]): U {
            const argList = items_to_cons(...args);
            const expr = cons(native_sym(opr), argList);
            return $.valueOf(expr);
        },
        exp(expr: U): U {
            return $.evaluate(Native.exp, expr);
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
            return native_directives.get(Directive.expand);
        },
        isFactoring(): boolean {
            return native_directives.get(Directive.factor);
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
        is_complex(expr: U): boolean {
            return $.is(ISCOMPLEX, expr);
        },
        is_real(expr: U): boolean {
            return $.is(ISREAL, expr);
        },
        isScalar(expr: U): boolean {
            const op = $.operatorFor(expr);
            const retval = op.isScalar(expr);
            // console.lg(`${op.name} isScalar ${$.toInfixString(expr)} => ${retval}`);
            return retval;
        },
        is_zero(expr: U): boolean {
            // TODO: This should be done using predicate functions rather than hard-coding
            // predicates into the operators.
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
        getCustomDirective(directive: string): boolean {
            return !!custom_directives[directive];
        },
        getNativeDirective(directive: Directive): boolean {
            return native_directives.get(directive);
        },
        getSymbolPrintName(sym: Sym): string {
            const token = sym_key_to_printname[sym.key()];
            if (typeof token === 'string') {
                return token;
            }
            else {
                return sym.key();
            }
        },
        imag(expr: U): U {
            return $.evaluate(Native.imag, expr);
        },
        inner(lhs: U, rhs: U): U {
            // console.lg(`inner lhs=${print_list(lhs, $)} rhs=${print_list(rhs, $)} `);
            const value_lhs = $.valueOf(lhs);
            const value_rhs = $.valueOf(rhs);
            const inner_lhs_rhs = items_to_cons(native_sym(Native.inner), value_lhs, value_rhs);
            const value_inner_lhs_rhs = $.valueOf(inner_lhs_rhs);
            return value_inner_lhs_rhs;
        },
        multiply(lhs: U, rhs: U): U {
            return $.evaluate(Native.multiply, lhs, rhs);
        },
        /**
         * The universal unary minus function meaning multiplication by -1.
         */
        negate(x: U): U {
            return $.multiply(negOne, x);
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
            return $.evaluate(Native.outer, lhs, rhs);
        },
        power(base: U, expo: U): U {
            return $.evaluate(Native.pow, base, expo);
        },
        real(expr: U): U {
            return $.evaluate(Native.real, expr);
        },
        remove(varName: Sym): void {
            symTab.delete(varName);
        },
        setCustomDirective(directive: string, value: boolean): void {
            custom_directives[directive] = value;
        },
        pushNativeDirective(directive: Directive, value: boolean): void {
            native_directives.push(directive, value);
        },
        popNativeDirective(): void {
            native_directives.pop();
        },
        setSymbolOrder(sym: Sym, order: ExprComparator): void {
            sym_order[sym.key()] = order;
        },
        setSymbolProps(sym: Sym, overrides: Partial<SymbolProps>): void {
            symTab.setProps(sym, overrides);
        },
        setSymbolPrintName(sym: Sym, printname: string): void {
            sym_key_to_printname[sym.key()] = printname;
        },
        setSymbolValue(sym: Sym, value: U): void {
            symTab.setValue(sym, value);
        },
        sin(expr: U): U {
            return $.evaluate(Native.sin, expr);
        },
        subtract(lhs: U, rhs: U): U {
            return $.add(lhs, $.negate(rhs));
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
            // console.lg("transform", expr.toString(), "is_sym", is_sym(expr));
            if (expr.meta === TFLAG_HALT) {
                return [TFLAG_HALT, expr];
            }
            // We short-circuit some expressions in order to improve performance.
            if (is_cons(expr)) {
                // TODO: As an evaluation technique, I should be able to pick any item in the list and operate
                // to the left or right. This implies that I have distinct right and left evaluations.
                const head = expr.head;
                if (is_sym(head)) {
                    // The generalization here is that a symbol may have multiple bindings that we need to disambiguate.
                    const value = $.getSymbolValue(head);
                    if (is_lambda(value)) {
                        return wrap_as_transform(value.evaluate(expr.argList, $), expr);
                    }
                }
                else if (is_rat(head)) {
                    // We know that the key and hash are both 'Rat'
                    const ops: Operator<U>[] = currentOps()['Rat'];
                    // TODO: The operator will be acting on the argList, not the entire expression.
                    const op = unambiguous_operator(expr.argList, ops, $);
                    if (op) {
                        // console.lg(`We found the ${op.name} operator!`);
                        return op.evaluate(head, expr.argList);
                    }
                    else {
                        // eslint-disable-next-line no-console
                        console.warn(`No unique operators found for Rat from ${ops.length} choice(s).`);
                    }
                }
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
                // If it's not a list or nil, then it's an atom.
                const op = $.operatorFor(expr);
                return op.transform(expr);
            }
        },
        valueOf(expr: U): U {
            return $.transform(expr)[1];
        }
    };

    // TODO: Consistency in names used for symbols in symbolic expressions.
    $.setSymbolPrintName(ADD, '+');        // changing will break  82 cases.
    $.setSymbolPrintName(MULTIPLY, '*');  // changing will break 113 cases.
    $.setSymbolPrintName(POWER, 'expt');
    $.setSymbolPrintName(native_sym(Native.rco), '>>');
    $.setSymbolPrintName(native_sym(Native.lco), '<<');
    $.setSymbolPrintName(native_sym(Native.inner), '|');
    $.setSymbolPrintName(native_sym(Native.outer), '^');
    $.setSymbolPrintName(native_sym(Native.abs), 'abs');

    $.setSymbolPrintName(native_sym(Native.E), 'e');
    $.setSymbolPrintName(native_sym(Native.PI), 'pi');
    $.setSymbolPrintName(native_sym(Native.NIL), '()');
    $.setSymbolPrintName(native_sym(Native.IMU), 'i');
    $.setSymbolPrintName(native_sym(Native.exp), 'exp');

    // Backwards compatible, but we should simply set this to false, or leave undefined.
    $.pushNativeDirective(Directive.useCaretForExponentiation, config.useCaretForExponentiation);

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function unambiguous_operator(expr: Cons, ops: Operator<U>[], $: ExtensionEnv): Operator<U> | undefined {
    // console.lg(`unambiguous_operator for ${$.toInfixString(expr)} from ${ops.length} choice(s).`);
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
        // console.warn(`Ambiguous operators for expression ${$.toInfixString(expr)} ${JSON.stringify(candidates.map((candidate) => candidate.name))}`);
        const using = candidates[0];
        // eslint-disable-next-line no-console
        // console.warn(`Using ${JSON.stringify(using.name)}`);
        return using;
    }
    else {
        return void 0;
    }
}

