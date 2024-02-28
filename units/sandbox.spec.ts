import assert from 'assert';
import { is_nil, U } from 'math-expression-tree';
import { create_engine, EngineConfig, ExprEngine, ParseConfig, RenderConfig } from '../src/api/api';

const engineConfig: Partial<EngineConfig> = {
};

function strip_whitespace(s: string): string {
    return s.replace(/\s/g, '');
}

const parseConfig: Partial<ParseConfig> = {
    useCaretForExponentiation: true,
    useParenForTensors: false
};

const renderConfig: RenderConfig = {
    format: 'Infix',
    useCaretForExponentiation: true,
    useParenForTensors: false
};

describe("sandbox", function () {
    it("det(A)", function () {
        const lines: string[] = [
            `A=[[a,b],[c,d]]`,
            `det(A)`
        ];
        const sourceText = lines.join('\n');
        const engine: ExprEngine = create_engine(engineConfig);
        const { trees, errors } = engine.parse(sourceText, parseConfig);
        assert.strictEqual(errors.length, 0);
        const values: U[] = [];
        for (const tree of trees) {
            const x = engine.valueOf(tree);
            const value = engine.simplify(x);
            if (!is_nil(value)) {
                values.push(value);
            }
        }
        assert.strictEqual(values.length, 1);
        // A DistributiveLawExpandRight is breaking apart the determinant before multiplying by the inverse.
        // The result is correct but requires factoring to discover the simplification
        assert.strictEqual(strip_whitespace(engine.renderAsString(values[0], renderConfig)), strip_whitespace("a*d-b*c"));
        engine.release();
    });
    it("det(A) * inv(A)", function () {
        const lines: string[] = [
            `A=[[a,b],[c,d]]`,
            `det(A) * inv(A)`
        ];
        const sourceText = lines.join('\n');
        const engine: ExprEngine = create_engine(engineConfig);
        const { trees, errors } = engine.parse(sourceText, parseConfig);
        assert.strictEqual(errors.length, 0);
        const values: U[] = [];
        for (const tree of trees) {
            const value = engine.simplify(engine.valueOf(tree));
            if (!is_nil(value)) {
                values.push(value);
            }
        }
        assert.strictEqual(values.length, 1);
        // A DistributiveLawExpandRight is breaking apart the determinant before multiplying by the inverse.
        // The result is correct but requires factoring to discover the simplification
        assert.strictEqual(strip_whitespace(engine.renderAsString(values[0], renderConfig)), strip_whitespace("[[d,-b],[-c,a]]"));
        engine.release();
    });
});
