import { create_sym } from "math-expression-atoms";
import { get_binding, ScriptVars } from "./eigenmath";
import { iszero } from "./iszero";

const TTY = create_sym("tty");

export function should_render_svg($: ScriptVars): boolean {
    const tty = get_binding(TTY, $);
    if (tty.equals(TTY) || iszero(tty)) {
        return true;
    }
    else {
        return false;
    }
}
