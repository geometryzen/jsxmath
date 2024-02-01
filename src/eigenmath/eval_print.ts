import { create_sym } from "math-expression-atoms";
import { car, cdr, is_cons, nil, U } from "math-expression-tree";
import { get_binding, ScriptVars, value_of } from "./eigenmath";
import { isimaginaryunit } from "./isimaginaryunit";
import { make_should_annotate } from "./make_should_annotate";
import { print_value_and_input_as_svg_or_infix } from "./print_value_and_input_as_svg_or_infix";
import { EmitContext } from "./render_svg";
import { should_render_svg } from "./should_eigenmath_render_svg";

const I_LOWER = create_sym("i");
const J_LOWER = create_sym("j");

export function eval_print(p1: U, $: ScriptVars): void {
    p1 = cdr(p1);
    while (is_cons(p1)) {
        $.stack.push(car(p1));
        $.stack.push(car(p1));
        value_of($);
        const result = $.stack.pop()!;
        const input = $.stack.pop()!;
        const ec: EmitContext = {
            useImaginaryI: isimaginaryunit(get_binding(I_LOWER, $)),
            useImaginaryJ: isimaginaryunit(get_binding(J_LOWER, $))
        };
        print_value_and_input_as_svg_or_infix(result, input, should_render_svg($), ec, $.listeners, make_should_annotate($), $);
        p1 = cdr(p1);
    }
    $.stack.push(nil);
}
