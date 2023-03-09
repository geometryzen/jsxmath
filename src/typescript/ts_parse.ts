import {
    BinaryExpression,
    createSourceFile,
    EndOfFileToken,
    ExpressionStatement,
    Identifier,
    Node,
    ScriptKind,
    ScriptTarget,
    SourceFile,
    StringLiteral,
    SyntaxKind,
    TypeReferenceNode,
    VariableDeclaration,
    VariableDeclarationList,
    visitNode,
    Visitor
} from 'typescript';
import { IntTokenParser } from '../operators/int/IntTokenParser';
import { ASSIGN } from '../runtime/constants';
import { MATH_ADD, MATH_DIV, MATH_HAS_TYPE, MATH_INNER, MATH_LCO, MATH_MUL, MATH_OUTER, MATH_POW, MATH_RCO, MATH_SUB } from '../runtime/ns_math';
// import { init } from '../../runtime/init';
import { stack_pop, stack_push } from '../runtime/stack';
import { Flt } from '../tree/flt/Flt';
import { Str } from '../tree/str/Str';
import { create_sym } from '../tree/sym/Sym';
import { items_to_cons, U } from '../tree/tree';

export interface TsParseOptions {
    /**
     * Determines whether the parser makes associativity explicit or implicit in additive expressions.
     */
    explicitAssocAdd?: boolean;
    /**
     * Determines whether the parser makes associativity explicit or implicit in multiplicative expressions.
     */
    explicitAssocMul?: boolean;
}

/**
 * Constructs a source tree using the TypeScript parser.
 * @param fileName The name of the file containing the source text. 
 * @param sourceText The source text.
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ts_parse(fileName: string, sourceText: string, options?: TsParseOptions): U {
    // console.lg(`create_source_tree(fileName => ${JSON.stringify(fileName)}, sourceText => ${JSON.stringify(sourceText)})`)
    const languageVersion = ScriptTarget.Latest;
    const setParentNodes = true;
    const scriptKind = ScriptKind.TS;
    /**
     * The sourceFile is itself a Node, meaning that the sourceText has been parsed.
     */
    const sourceFile: SourceFile = createSourceFile(fileName, sourceText, languageVersion, setParentNodes, scriptKind);
    /**
     * The visitor callback must return something that extends Node.
     */
    const visitor: Visitor = function (node: Node) {
        switch (node.kind) {
            case SyntaxKind.AsteriskAsteriskToken: {
                stack_push(MATH_POW.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.AsteriskToken: {
                stack_push(MATH_MUL.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.BarToken: {
                stack_push(MATH_INNER.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.CaretToken: {
                stack_push(MATH_OUTER.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.BinaryExpression: {
                const bin = node as BinaryExpression;
                visitNode(bin.operatorToken, visitor);
                visitNode(bin.left, visitor);
                visitNode(bin.right, visitor);
                const rhs = stack_pop();
                const lhs = stack_pop();
                const opr = stack_pop();
                stack_push(items_to_cons(opr, lhs, rhs));
                break;
            }
            case SyntaxKind.EndOfFileToken: {
                const eof = node as EndOfFileToken;
                eof.forEachChild(function (child) {
                    visitNode(child, visitor);
                });
                break;
            }
            case SyntaxKind.ExpressionStatement: {
                const stmt = node as ExpressionStatement;
                stmt.forEachChild(function (child) {
                    visitNode(child, visitor);
                });
                break;
            }
            case SyntaxKind.FirstAssignment: {
                stack_push(ASSIGN.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.FirstLiteralToken: {
                const text = node.getText(sourceFile);
                if (text.indexOf('.') > 0) {
                    stack_push(new Flt(parseFloat(text), node.pos, node.end));
                }
                else {
                    // TODO: Inject this as part of the configuration...
                    const parser = new IntTokenParser();
                    const value = parser.parse(text, node.pos, node.end);
                    stack_push(value);
                }

                // There don't appear to be any children.
                node.forEachChild(function (child) {
                    visitNode(child, visitor);
                });
                break;
            }
            case SyntaxKind.FirstStatement: {
                node.forEachChild(function (child) {
                    visitNode(child, visitor);
                });
                break;
            }
            case SyntaxKind.GreaterThanGreaterThanToken: {
                stack_push(MATH_RCO.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.Identifier: {
                const ident = node as Identifier;
                // The sourceFile argument to getText() does not seem to be needed, but we provide it anyway.
                const printname = ident.getText(sourceFile);
                // console.lg(`Identifier => escapedText: ${ident.escapedText} text: ${ident.getText(sourceFile)} pos: ${ident.pos} end: ${ident.end}`);
                // TODO: We could use range {pos, end}?
                // eslint-disable-next-line no-console
                // console.lg(`push_usr_symbol(${text})`);
                stack_push(create_sym(printname));
                ident.forEachChild(function (child) {
                    visitNode(child, visitor);
                });
                break;
            }
            case SyntaxKind.LessThanLessThanToken: {
                stack_push(MATH_LCO.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.MinusToken: {
                stack_push(MATH_SUB.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.PlusToken: {
                stack_push(MATH_ADD.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.SlashToken: {
                stack_push(MATH_DIV.clone(node.pos, node.end));
                break;
            }
            case SyntaxKind.StringLiteral: {
                const str = node as StringLiteral;
                const text = str.getText(sourceFile);
                // TODO: Need to remove delimiters and escaping (robustly).
                const parsedText = text.substring(1, text.length - 1);
                stack_push(new Str(parsedText, node.pos, node.end));
                break;
            }
            case SyntaxKind.SourceFile: {
                const sourceFile = node as SourceFile;
                sourceFile.forEachChild(function (child) {
                    visitNode(child, visitor);
                });
                break;
            }
            case SyntaxKind.TypeReference: {
                const tref = node as TypeReferenceNode;
                visitNode(tref.typeName, visitor);
                break;
            }
            case SyntaxKind.VariableDeclaration: {
                const decl = node as VariableDeclaration;
                visitNode(decl.name, visitor);
                visitNode(decl.type, visitor);
                if (decl.initializer) {
                    visitNode(decl.initializer, visitor);
                    const init = stack_pop();
                    const type = stack_pop();
                    const name = stack_pop();
                    const X = items_to_cons(MATH_HAS_TYPE, name, type);
                    stack_push(items_to_cons(ASSIGN, X, init));
                }
                else {
                    const type = stack_pop();
                    const name = stack_pop();
                    stack_push(items_to_cons(MATH_HAS_TYPE, name, type));
                }
                break;
            }
            case SyntaxKind.VariableDeclarationList: {
                const decls = node as VariableDeclarationList;
                decls.forEachChild(function (decl) {
                    visitNode(decl, visitor);
                });
                break;
            }
            default: {
                // eslint-disable-next-line no-console
                console.warn(`Unhandled: ${SyntaxKind[node.kind]}`);
            }
        }
        return node;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const test = function (node: Node): boolean {
        throw new Error();
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lift = function (node: readonly Node[]): Node {
        throw new Error();
    };
    // Note that test and lift are only called when producing Node(s) with the visitor, which we do not do.
    visitNode(sourceFile, visitor, test, lift);
    return stack_pop();
}