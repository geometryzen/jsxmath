import { assert } from "chai";
import { print_expr } from "../src/print";
import { createSymEngine } from "../src/runtime/symengine";

describe("breakdown", function () {
    xit("(e1, e1)", function () {
        const lines: string[] = [
            `G11 = algebra([1, 1], ["L1", "L2"])`,
            `b1 = G11[1]`,
            `b2 = G11[2]`,
            `X = b1 + b1`,
            `X`
        ];
        const engine = createSymEngine({ version: 2 });
        const actual = engine.run(lines.join('\n'));
        assert.strictEqual(actual, "2*L1");
        engine.release();
    });
    it("", function () {
        const lines: string[] = [
            `G11 = algebra([1, 1], ["L1", "L2"])`,
            `b1 = G11[1]`,
            `b2 = G11[2]`,
            `X = b1 + b2`,
            `X`
        ];
        const engine = createSymEngine();
        const $ = engine.$;
        const scan = engine.scanSourceText(lines.join('\n'));
        assert.strictEqual(scan.trees.length, 5);
        engine.transformTree(scan.trees[0]);
        engine.transformTree(scan.trees[1]);
        engine.transformTree(scan.trees[2]);
        engine.transformTree(scan.trees[3]);
        const data0 = scan.trees[4];
        $.setExpanding(true);
        const data1 = engine.transformTree(data0);
        $.setFactoring(true);
        const data2 = engine.transformTree(data1.value);
        assert.strictEqual(print_expr(data2.value, $), 'L1+L2');
        engine.release();
    });
});
