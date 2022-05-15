import { assert } from "chai";
import { print_expr } from "../src/print";
import { createSymEngine } from "../src/runtime/symengine";
import { assert_one_value_execute } from "./assert_one_value_execute";

describe("inner", function () {
    it("Conjugate Symmetry", function () {
        const lines: string[] = [
            `conj(y|x)`,
        ];
        const engine = createSymEngine({ treatAsVectors: ['x', 'y', 'z'], useCaretForExponentiation: false });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(print_expr(value, $), "x|y");
        engine.release();
    });
    it("Linearity in Second Argument", function () {
        const lines: string[] = [
            `x|(a*y+b*z)`,
        ];
        const engine = createSymEngine({ treatAsVectors: ['x', 'y', 'z'], useCaretForExponentiation: false });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(print_expr(value, $), "a*x|y+b*x|z");
        engine.release();
    });
    it("Linearity in Second Argument", function () {
        const lines: string[] = [
            `x|(a*y)`,
        ];
        const engine = createSymEngine({ treatAsVectors: ['x', 'y', 'z'], useCaretForExponentiation: false });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(print_expr(value, $), "a*x|y");
        engine.release();
    });
    it("Linearity in Second Argument", function () {
        const lines: string[] = [
            `x|(y*a)`,
        ];
        const engine = createSymEngine({ treatAsVectors: ['x', 'y'], useCaretForExponentiation: false });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(print_expr(value, $), "a*x|y");
        engine.release();
    });
    it("Conjugate Linearity in First Argument", function () {
        // a and b are now treated as real numbers. 
        const lines: string[] = [
            `(a*x+b*y)|z`,
        ];
        const engine = createSymEngine({ treatAsVectors: ['x', 'y', 'z'], useCaretForExponentiation: false });
        const $ = engine.$;
        const value = assert_one_value_execute(lines.join('\n'), engine);
        assert.strictEqual(print_expr(value, $), "a*x|z+b*y|z");
        engine.release();
    });
});
