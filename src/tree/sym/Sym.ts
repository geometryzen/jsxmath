import { Atom } from "../atom/Atom";
import { U } from "../tree";

function strcmp(str1: string, str2: string): 0 | 1 | -1 {
    if (str1 === str2) {
        return 0;
    }
    else if (str1 > str2) {
        return 1;
    }
    else {
        return -1;
    }
}

const secretToEnforceUsingCreateSym: number = Math.random();

export function create_sym(text: string, pos?: number, end?: number): Sym {
    return new Sym(secretToEnforceUsingCreateSym, text, pos, end);
}

export class Sym extends Atom {
    /**
     * Use create_sym to create a new Sym instance.
     */
    constructor(secret: number, public readonly text: string, pos?: number, end?: number) {
        super('Sym', pos, end);
        if (secret !== secretToEnforceUsingCreateSym) {
            throw new Error("Sym instances must be created using the create_sym function.");
        }
    }
    compare(other: Sym): 1 | -1 | 0 {
        // console.lg("compare", "this", this.ln, "other", other.ln);
        return strcmp(this.text, other.text);
    }
    contains(needle: U): boolean {
        if (needle instanceof Sym) {
            return this.containsSym(needle);
        }
        return false;
    }
    /**
     * Determines whether other lives in the namespace defined by this.
     */
    containsSym(other: Sym): boolean {
        if (this.equalsSym(other)) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Creates a new symbol with exactly the same local name and namespace as this symbol.
     * However it allows scanning information to be carried along with the new instance.
     * @param pos The start position of the symbol in the source text.
     * @param end The end position of the symbol in the source text.
     */
    clone(pos: number | undefined, end: number | undefined): Sym {
        return create_sym(this.text, pos, end);
    }
    equals(other: U): boolean {
        if (other instanceof Sym) {
            return this.equalsSym(other);
        }
        return false;
    }
    equalsSym(other: Sym): boolean {
        if (this === other) {
            return true;
        }
        else {
            return this.text === other.text;
        }
    }
    key(): string {
        return this.text;
    }
    toString(): string {
        return this.key();
    }
}
