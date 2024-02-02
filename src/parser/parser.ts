import { bigInt, BigInteger, Boo, Char, create_sym_ns, create_tensor, Flt, is_str, Keyword, Map, Rat, Set, Str, Sym, Tag, Timestamp, Uuid } from "math-expression-atoms";
import { pos_end_items_to_cons, U } from "math-expression-tree";
import { STEMCParseOptions, stemc_parse } from "../algebrite/algebrite_parse";
import { EigenmathErrorHandler } from "../api";
import { EDNListParser, ParseConfig } from "../edn";
import { EigenmathParseConfig, parse_eigenmath_script, ScriptVars } from "../eigenmath/eigenmath";

export enum SyntaxKind {
    /**
     * STEMC Scripting Language.
     */
    STEMCscript = 1,
    /**
     * ClojureScript Programming Language.
     */
    ClojureScript = 2,
    /**
     * Eigenmath Scripting Language by George Weigt.
     */
    Eigenmath = 3,
    // PythonScript = 4,
}

export function human_readable_syntax_kind(syntaxKind: SyntaxKind): string {
    if (syntaxKind) {
        switch (syntaxKind) {
            case SyntaxKind.STEMCscript: return "STEMCscript";
            case SyntaxKind.ClojureScript: return "ClojureScript";
            case SyntaxKind.Eigenmath: return "Eigenmath";
            // case SyntaxKind.PythonScript: return "PythonScript";
        }
    }
    else {
        throw new Error("syntaxKind MUST be specified.");
    }
}

export const syntaxKinds: SyntaxKind[] = [SyntaxKind.STEMCscript, SyntaxKind.ClojureScript, SyntaxKind.Eigenmath/*, SyntaxKind.PythonScript*/];

export interface ParseOptions {
    catchExceptions?: boolean,
    syntaxKind?: SyntaxKind;
    /**
     * Determines whether the caret symbol '^' is used to denote exponentiation.
     * The alternative is to use '**', which frees the caret symbol to denote the outer product.
     */
    useCaretForExponentiation?: boolean;
    useParenForTensors?: boolean;
    /**
     * Determines whether the parser makes associativity explicit or implicit in additive expressions.
     */
    explicitAssocAdd?: boolean;
    /**
     * Determines whether the parser makes associativity explicit or implicit in multiplicative expressions.
     */
    explicitAssocMul?: boolean;
}

export function parse_expr(sourceText: string, options?: ParseOptions): U {
    const { trees, errors } = delegate_parse_script(sourceText, options);
    if (errors.length == 0) {
        if (trees.length > 0) {
            return trees[0];
        }
        else {
            throw new Error();
        }
    }
    else {
        throw errors[1];
    }
}

interface ClojureScriptParseOptions {
    lexicon?: { [key: string]: Sym };
}

/**
 * ClojureScript parsing based upon the extensible data notation parser.
 * 
 * @see https://github.com/edn-format/edn?tab=readme-ov-file
 * 
 * @param sourceText 
 * @param options 
 * @returns 
 */
export function clojurescript_parse(sourceText: string, options: ClojureScriptParseOptions = {}): { trees: U[], errors: Error[] } {
    // options.useCaretForExponentiation;
    // options.useParenForTensors;
    const parseConfig: ParseConfig<U> = {
        bigIntAs: (value: string, pos: number, end: number) => {
            return new Rat(new BigInteger(BigInt(value)), bigInt.one, pos, end);
        },
        booAs: (value: boolean, pos: number, end: number) => new Boo(value, pos, end),
        charAs: (ch: string, pos: number, end: number) => new Char(ch, pos, end),
        fltAs: (value: number, pos: number, end: number) => new Flt(value, pos, end),
        intAs: (value: number, pos: number, end: number) => {
            return new Rat(new BigInteger(BigInt(value)), bigInt.one, pos, end);
        },
        keywordAs: (localName: string, namespace: string, pos: number, end: number) => new Keyword(localName, namespace, pos, end),
        listAs: (items: U[], pos: number, end: number) => pos_end_items_to_cons(pos, end, ...items),
        mapAs: (entries: [key: U, value: U][], pos: number, end: number) => {
            return new Map(entries, pos, end);
        },
        nilAs: (pos: number, end: number) => {
            return pos_end_items_to_cons(pos, end, ...[]);
            // return new Cons(void 0, void 0, pos, end);
        },
        setAs: (members: U[], pos: number, end: number) => {
            return new Set(members, pos, end);
        },
        strAs: (value: string, pos: number, end: number) => new Str(value, pos, end),
        symAs: (localName: string, namespace: string, pos: number, end: number) => {
            const sym = create_sym_ns(localName, namespace, pos, end);
            if (options.lexicon) {
                const key = sym.key();
                const meaning = options.lexicon[key];
                if (meaning) {
                    return meaning;
                }
            }
            return sym;
        },
        tagAs: (tag: string, value: U, pos: number, end: number) => new Tag(tag, value, pos, end),
        vectorAs: (values: U[], pos: number, end: number) => create_tensor(values, pos, end),
        tagHandlers: {
            'inst': (value: U) => {
                if (is_str(value)) {
                    return new Timestamp(new Date(value.str), value.pos, value.end);
                }
                else {
                    throw new Error("");
                }
            },
            'uuid': (value: U) => {
                if (is_str(value)) {
                    return new Uuid(value.str, value.pos, value.end);
                }
                else {
                    throw new Error("");
                }
            }
        }
    };
    const parser: EDNListParser<U> = new EDNListParser(parseConfig);
    const trees = parser.next(sourceText);
    const errors: Error[] = [];
    return { trees, errors };
}

export function delegate_parse_script(sourceText: string, options?: ParseOptions): { trees: U[], errors: Error[] } {
    const syntaxKind = script_kind_from_options(options);
    switch (syntaxKind) {
        case SyntaxKind.STEMCscript: {
            return stemc_parse(sourceText, stemc_parse_options(options));
        }
        case SyntaxKind.ClojureScript: {
            return clojurescript_parse(sourceText, clojurescript_parse_options(options));
        }
        case SyntaxKind.Eigenmath: {
            const emErrorHandler = new EigenmathErrorHandler();
            const scriptVars = new ScriptVars();
            scriptVars.init();
            const trees: U[] = parse_eigenmath_script(sourceText, eigenmath_parse_options(options), emErrorHandler, scriptVars);
            return { trees, errors: emErrorHandler.errors };
        }
        /*
        case SyntaxKind.PythonScript: {
            return pythonscript_parse(sourceText, python_parse_options(options));
        }
        */
        default: {
            throw new Error(`options.syntaxKind ${syntaxKind} must be one of ${JSON.stringify(syntaxKinds.map(human_readable_syntax_kind).sort())}.`);
        }
    }
}

function stemc_parse_options(options?: ParseOptions): STEMCParseOptions {
    if (options) {
        return {
            explicitAssocAdd: options.explicitAssocAdd,
            explicitAssocMul: options.explicitAssocMul,
            useCaretForExponentiation: options.useCaretForExponentiation,
            useParenForTensors: options.useParenForTensors
        };
    }
    else {
        return {};
    }
}

function clojurescript_parse_options(options?: ParseOptions): ClojureScriptParseOptions {
    if (options) {
        return {
            // explicitAssocAdd: options.explicitAssocAdd,
            // explicitAssocMul: options.explicitAssocMul,
            // useCaretForExponentiation: options.useCaretForExponentiation,
            // useParenForTensors: options.useParenForTensors,
            lexicon: {}
        };
    }
    else {
        return {
            lexicon: {}
        };
    }
}

function eigenmath_parse_options(options?: ParseOptions): EigenmathParseConfig {
    if (options) {
        return {
            useCaretForExponentiation: !!options.useCaretForExponentiation,
            useParenForTensors: !!options.useParenForTensors
        };
    }
    else {
        return {
            useCaretForExponentiation: true,
            useParenForTensors: true
        };
    }
}
/*
function python_parse_options(options?: ParseOptions): PythonScriptParseOptions {
    if (options) {
        if (options.useCaretForExponentiation) {
            throw new Error("useCaretForExponentiation is not supported by the Python parser.");
        }
        if (options.useParenForTensors) {
            throw new Error("useParenForTensors is not supported by the Python parser.");
        }
        return {
            explicitAssocAdd: options.explicitAssocAdd,
            explicitAssocMul: options.explicitAssocMul
        };
    }
    else {
        return {};
    }
}
*/
function script_kind_from_options(options?: ParseOptions): SyntaxKind {
    if (options) {
        if (options.syntaxKind) {
            return options.syntaxKind;
        }
        else {
            return SyntaxKind.STEMCscript;
        }
    }
    else {
        return SyntaxKind.STEMCscript;
    }
}
