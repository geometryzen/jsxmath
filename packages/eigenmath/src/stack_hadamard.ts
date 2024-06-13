import { is_tensor } from "@stemcmicro/atoms";
import { ProgramControl, ProgramEnv, ProgramStack } from "@stemcmicro/stack";
import { Cons, is_cons } from "@stemcmicro/tree";
import { copy_tensor, multiply, stopf, value_of } from "./eigenmath";

export function stack_hadamard(expr: Cons, env: ProgramEnv, ctrl: ProgramControl, $: ProgramStack): void {
    const argList = expr.argList;
    try {
        const head = argList.head;
        try {
            $.push(head);
            value_of(env, ctrl, $);
            let xs = argList.rest;
            try {
                while (is_cons(xs)) {
                    const x = xs.head;
                    try {
                        $.push(x);
                        value_of(env, ctrl, $);
                        hadamard(env, ctrl, $);
                        const rest = xs.rest;
                        xs.release();
                        xs = rest;
                    } finally {
                        x.release();
                    }
                }
            } finally {
                xs.release();
            }
        } finally {
            head.release();
        }
    } finally {
        argList.release();
    }
}

export function hadamard(env: ProgramEnv, ctrl: ProgramControl, $: ProgramStack): void {
    const rhs = $.pop();
    const lhs = $.pop();
    try {
        if (!is_tensor(lhs) || !is_tensor(rhs)) {
            $.push(lhs);
            $.push(rhs);
            multiply(env, ctrl, $);
            return;
        }

        if (lhs.ndim !== rhs.ndim) {
            stopf("hadamard");
        }

        const ndim = lhs.ndim;

        for (let i = 0; i < ndim; i++) {
            if (lhs.dims[i] !== rhs.dims[i]) {
                stopf("hadamard");
            }
        }

        const H = copy_tensor(lhs);
        try {
            const nelem = H.nelem;

            for (let i = 0; i < nelem; i++) {
                $.push(lhs.elems[i]);
                $.push(rhs.elems[i]);
                multiply(env, ctrl, $);
                H.elems[i] = $.pop();
            }

            $.push(H);
        } finally {
            H.release();
        }
    } finally {
        lhs.release();
        rhs.release();
    }
}
