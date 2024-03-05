
import assert from "assert";
import { is_str } from "math-expression-atoms";
import { js_parse } from "../src/javascript/js_parse";
import { create_script_context } from "../src/runtime/script_engine";
import { assert_one_value } from "./assert_one_value";
import { assert_one_value_execute } from "./assert_one_value_execute";

describe("jsparse", function () {
    it("should be able to parse a user symbol", function () {
        const lines: string[] = [
            `x`
        ];

        const engine = create_script_context();
        const actual = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(engine.renderAsSExpr(actual), "x");

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "x");
        const value = assert_one_value(engine.evaluate(tree));
        assert.strictEqual(engine.renderAsSExpr(value), "x");
        engine.release();
    });
    it("should be able to parse a Rat", function () {
        const lines: string[] = [
            `12345`
        ];
        const engine = create_script_context();
        const actual = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(engine.renderAsSExpr(actual), "12345");

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "12345");
        const value = assert_one_value(engine.evaluate(tree));
        assert.strictEqual(engine.renderAsSExpr(value), "12345");
        engine.release();
    });
    it("should be able to parse a Flt", function () {
        const lines: string[] = [
            `12345.0`
        ];
        const engine = create_script_context({
        });
        const actual = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(engine.renderAsSExpr(actual), "12345.0", "A");

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "12345.0", "B");
        const value = assert_one_value(engine.evaluate(tree));
        assert.strictEqual(engine.renderAsSExpr(value), "12345.0", "C");
        engine.release();
    });
    it("should be able to parse a Str", function () {
        const lines: string[] = [
            `"Hello"`
        ];
        const engine = create_script_context();
        const actual = assert_one_value_execute(lines.join('\n'), engine);
        // The result here would be different in version 1.x
        assert.strictEqual(engine.renderAsSExpr(actual), '"Hello"');
        assert.strictEqual(is_str(actual), true);
        if (is_str(actual)) {
            assert.strictEqual(actual.str, 'Hello');
        }

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(is_str(tree), true);
        if (is_str(tree)) {
            assert.strictEqual(tree.str, 'Hello');
        }
        assert.strictEqual(engine.renderAsSExpr(tree), '"Hello"');
        const value = assert_one_value(engine.evaluate(tree));
        assert.strictEqual(engine.renderAsSExpr(value), '"Hello"');
        engine.release();
    });
    it("should be able to parse an additive (+) expression", function () {
        const lines: string[] = [
            `a+b`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(+ a b)");
        const value = assert_one_value(engine.evaluate(tree));
        assert.strictEqual(engine.renderAsInfix(value), "a+b");
        engine.release();
    });
    it("should be able to parse an additive (-) expression", function () {
        const lines: string[] = [
            `a-b`
        ];

        const engine = create_script_context();
        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(- a b)");
        // const value = assert_one_value(evaluate_tree(tree, $));
        // assert.strictEqual(print_expr(value,$), "a-b");
        engine.release();
    });
    it("should be able to parse an multiplicative (*) expression", function () {
        const lines: string[] = [
            `a*b`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(* a b)");
        const value = assert_one_value(engine.evaluate(tree));
        assert.strictEqual(engine.renderAsInfix(value), "a*b");
        engine.release();
    });
    it("should be able to parse an multiplicative (/) expression", function () {
        const lines: string[] = [
            `a/b`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(/ a b)");
        // const value = assert_one_value(evaluate_tree(tree, $));
        // assert.strictEqual(print_expr(value,$), "a*b");
        engine.release();
    });
    it("should be able to parse an outer product (^) expression", function () {
        const lines: string[] = [
            `a^b`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(^ a b)");
        const value = assert_one_value(engine.evaluate(tree));
        assert.strictEqual(engine.renderAsInfix(value), "a^b");
        engine.release();
    });
    it("should be able to parse a left contraction(<<) expression", function () {
        const lines: string[] = [
            `a<<b`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(<< a b)");
        // const value = assert_one_value(evaluate_tree(tree, $));
        // assert.strictEqual(print_expr(value,$), "a<<b");
        engine.release();
    });
    it("should be able to parse a right contraction(>>) expression", function () {
        const lines: string[] = [
            `a>>b`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(>> a b)");
        // const value = assert_one_value(evaluate_tree(tree, $));
        // assert.strictEqual(print_expr(value,$), "a<<b");
        engine.release();
    });
    it("should be able to parse an exponentiation (**) expression", function () {
        const lines: string[] = [
            `a**b`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(pow a b)");
        const value = assert_one_value(engine.evaluate(tree));
        assert.strictEqual(engine.renderAsInfix(value), "a**b");
        engine.release();
    });
    it("should be able to parse an assignment expression", function () {
        const lines: string[] = [
            `x = 3`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(= x 3)");
        // const value = assert_one_value(evaluate_tree(tree, $));
        // assert.strictEqual(print_expr(value,$), "x=3");
        engine.release();
    });
    it("should be able to parse a let expression", function () {
        const lines: string[] = [
            `let a`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(def a)");
        // const value = assert_one_value(evaluate_tree(tree, $));
        // assert.strictEqual(print_expr(value,$), "x=3");
        engine.release();
    });
    it("should be able to parse a let expression with assignment", function () {
        const lines: string[] = [
            `let a = b`
        ];

        const engine = create_script_context();

        const tree = js_parse(lines.join('\n'));
        assert.strictEqual(engine.renderAsSExpr(tree), "(def (= a b))");
        // const value = assert_one_value(evaluate_tree(tree, $));
        // assert.strictEqual(print_expr(value,$), "x=3");
        engine.release();
    });
});