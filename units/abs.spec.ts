import { assert } from "chai";
import { render_as_infix, render_as_sexpr } from "../index";
import { create_engine } from "../src/runtime/symengine";
import { assert_one_value_execute } from "./assert_one_value_execute";

describe("abs-sandbox", function () {
    it("", function () {
        const lines: string[] = [
            `implicate=0`,
            `autofactor=1`,
            `abs(exp(x))`,
        ];
        const engine = create_engine({
            dependencies: ['Imu'],
            useDefinitions: true
        });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_infix(value, $), "exp(x)");
        engine.release();
    });
});

describe("abs", function () {
    it("abs(x)", function () {
        const lines: string[] = [
            `abs(x)`,
        ];
        const engine = create_engine({});
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_infix(value, $), "(x**2)**(1/2)");
        engine.release();
    });
    it("abs(iy)", function () {
        const lines: string[] = [
            `abs(sqrt(-1)*y)`,
        ];
        const engine = create_engine();
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_infix(value, $), "(y**2)**(1/2)");
        engine.release();
    });
    it("abs(x+i*y)", function () {
        const lines: string[] = [
            `abs(x+i*y)`,
        ];
        const engine = create_engine({
            dependencies: ['Imu'],
            useDefinitions: true
        });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_sexpr(value, $), "(power (+ (power x 2) (power y 2)) 1/2)");
        assert.strictEqual(render_as_infix(value, $), "(x**2+y**2)**(1/2)");
        engine.release();
    });
    it("abs(a+i*b)", function () {
        const lines: string[] = [
            `abs(a+i*b)`,
        ];
        const engine = create_engine({
            dependencies: ['Imu'],
            useDefinitions: true
        });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_sexpr(value, $), "(power (+ (power a 2) (power b 2)) 1/2)");
        assert.strictEqual(render_as_infix(value, $), "(a**2+b**2)**(1/2)");
        engine.release();
    });
    it("abs(a+b+i*c)", function () {
        const lines: string[] = [
            `implicate=1`,
            `abs(a+b+i*c)`,
        ];
        const engine = create_engine({
            dependencies: ['Imu'],
            useDefinitions: true
        });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_infix(value, $), "(a**2+2*a*b+b**2+c**2)**(1/2)");
        engine.release();
    });
    it("x * i", function () {
        const lines: string[] = [
            `autofactor=0`,
            `prettyfmt=0`,
            `implicate=0`,
            `i=sqrt(-1)`,
            `x * i`,
        ];
        const engine = create_engine({ useDefinitions: false });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_infix(value, $), "x*i");
        engine.release();
    });
    it("-i * i * x * x", function () {
        const lines: string[] = [
            `autofactor=0`,
            `prettyfmt=0`,
            `implicate=0`,
            `i=sqrt(-1)`,
            `-i * i * x * x`,
        ];
        const engine = create_engine({ useDefinitions: false });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_infix(value, $), "x**2");
        engine.release();
    });
    it("(x-i*y)*(x+i*y)", function () {
        const lines: string[] = [
            `implicate=0`,
            `(x-i*y)*(x+i*y)`,
        ];
        const engine = create_engine({ useDefinitions: true });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_sexpr(value, $), "(+ (power x 2) (power y 2))");
        assert.strictEqual(render_as_infix(value, $), "x**2+y**2");
        engine.release();
    });
    it("(x-i*y)*(x+i*y)", function () {
        const lines: string[] = [
            `(x-i*y)*(x+i*y)`,
        ];
        const engine = create_engine({ useDefinitions: true });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_sexpr(value, $), "(+ (power x 2) (power y 2))");
        assert.strictEqual(render_as_infix(value, $), "x**2+y**2");
        engine.release();
    });
    it("abs(1+2.0*i)", function () {
        // FIXME
        const lines: string[] = [
            `implicate=0`,
            `i=sqrt(-1)`,
            `abs(1+2.0*i)`,
        ];
        const engine = create_engine({
            // FIXME: The absence of Imu causes this expression to loop.
            dependencies: ['Flt', 'Imu']
        });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_sexpr(value, $), "2.236068...");
        assert.strictEqual(render_as_infix(value, $), "2.236068...");
        engine.release();
    });
    it("exp(i*pi/3)", function () {
        const lines: string[] = [
            `implicate=0`,
            `exp(i*pi/3)`,
        ];
        const engine = create_engine({
            dependencies: ['Imu'],
            useDefinitions: true
        });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        // assert.strictEqual(print_list(value, $), "(power (+ (power x 2) (power y 2)) 1/2)");
        assert.strictEqual(render_as_infix(value, $), "1/2+(1/2*3**(1/2))*i");
        engine.release();
    });
    it("imaginary numbers with autofactor=1", function () {
        const lines: string[] = [
            `implicate=0`,
            `autofactor=1`,
            `i*a+i*c`,
        ];
        const engine = create_engine({
            dependencies: ['Imu'],
            useDefinitions: true
        });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_infix(value, $), "(a+c)*i");
        engine.release();
    });
    it("imaginary numbers with autofactor=0", function () {
        const lines: string[] = [
            `implicate=0`,
            `autofactor=0`,
            `i*a+i*c`,
        ];
        const engine = create_engine({
            dependencies: ['Imu'],
            useDefinitions: true
        });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(render_as_infix(value, $), "a*i+c*i");
        engine.release();
    });
});
