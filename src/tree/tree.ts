
/**
 * It's incredibly painful to program the symbolic code with only unknown types.
 * We require any type that works with the tree to implement an interface.
 * This seems like a burden when you might want to use primitive string, number, or boolean,
 * or even some other type that does not support this interface. However, it will be useful
 * for a parsed tree so contain information that allows it to reference into the source text.
 * This will require an object wrapper. So we may as well accept the fact that any object we use
 * with the tree will need to be wrapped. Further we may as well make the information consistent
 * by defining it here. Finally, there's no point in alaiasing the interface so we'll give it a nice short
 * name that indicates the universal type. 
 */
export interface U {
    readonly name: string;
    contains(needle: U): boolean;
    equals(other: U): boolean;
    isCons(): boolean;
    isNil(): boolean;
    readonly pos?: number;
    readonly end?: number;
}

/**
 * Determines whether a Cons expression contains a single item.
 * @param expr 
 * @returns 
 */
export function is_singleton(expr: Cons): boolean {
    if (NIL === expr) {
        // Nope, it's the empty list.
        return false;
    }
    const cdr_expr = expr.cdr;
    if (NIL === cdr_expr) {
        return true;
    }
    else {
        return false;
    }
}

/**
 * Symbolic expressions are built by connecting Cons structs.
 *
 * For example, (a * b + c) is built like this:
 * 
 * The car links go downwards, the cdr links go to the right.
 *
 *           _______      _______                                            _______      _______
 *          |CONS   |--->|CONS   |----------------------------------------->|CONS   |--->|NIL    |
 *          |       |    |       |                                          |       |    |       |
 *          |_______|    |_______|                                          |_______|    |_______|       
 *              |            |                                                  |
 *           ___v___      ___v___      _______      _______      _______     ___v___
 *          |SYM +  |    |CONS   |--->|CONS   |--->|CONS   |--->|NIL    |   |SYM c  |
 *          |       |    |       |    |       |    |       |    |       |   |       |
 *          |_______|    |_______|    |_______|    |_______|    |_______|   |_______|
 *                           |            |            |
 *                        ___v___      ___v___      ___v___
 *                       |SYM *  |    |SYM a  |    |SYM b  |
 *                       |       |    |       |    |       |
 *                       |_______|    |_______|    |_______|
 * 
 * A non-NIL SYM is never a cdr. There will be a CONS with a NIL cdr and a car containing the SYM.
 * 
 */
export class Cons implements U {
    constructor(private readonly $car: U | undefined, private readonly $cdr: U | undefined, readonly pos?: number, readonly end?: number) {
        // Nothing to see here.
    }
    get name(): 'Cons' | 'Nil' {
        if (this.$car) {
            return 'Cons';
        }
        else {
            return 'Nil';
        }
    }
    /**
     * Returns the car property if it is defined, otherwise NIL.
     */
    get car(): U {
        if (this.$car) {
            return this.$car;
        }
        else {
            return NIL;
        }
    }
    /**
     * Returns the cdr property if it is defined, otherwise NIL.
     */
    get cdr(): U {
        if (this.$cdr) {
            return this.$cdr;
        }
        else {
            return NIL;
        }
    }
    /**
     * Exactly the same as the cdr property. Used for code-as-documentation.
     */
    get argList(): U {
        return this.cdr;
    }
    contains(needle: U): boolean {
        if (this === needle || this.equals(needle)) {
            return true;
        }
        if (this.$car && this.$cdr) {
            return this.$car.contains(needle) || this.$cdr.contains(needle);
        }
        return false;
    }
    equals(other: U): boolean {
        if (this === other) {
            return true;
        }
        if (is_cons(other)) {
            return equal_cons_cons(this, other);
        }
        else {
            return false;
        }
    }
    isCons(): boolean {
        if (this.$car) {
            return true;
        }
        else {
            return false;
        }
    }
    isNil(): boolean {
        if (this.$car) {
            return false;
        }
        else {
            return true;
        }
    }
    public toString(): string {
        // If you call car or cdr you get an infinite loop because NIL is a Cons.
        const head = this.$car;
        const tail = this.$cdr;
        if (head) {
            return `(${head} ${tail})`;
        }
        else {
            return '()';
        }
    }
    /**
     * Provides an iterator over the Cons.
     * The first element returned will be car(cons).
     * The subsequent elements are obtained from walking the cdr's.
     */
    public *[Symbol.iterator]() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let u: U = this;
        while (is_cons(u)) {
            yield u.car;
            u = u.cdr;
        }
    }
    /**
     * Exactly the same as the car property. Used for code-as-documentation.
     */
    get head(): U {
        return this.car;
    }
    /**
     * Return everything except the first item in the list.
     */
    tail(): U[] {
        if (this !== NIL) {
            const cdr = this.$cdr;
            if (cdr && is_cons(cdr)) {
                return [...cdr];
            }
            else {
                return [];
            }
        }
        throw new Error("tail property is not allowed for the empty list.");
    }
    /**
     * Maps the elements of the list using a mapping function.
     */
    map(f: (a: U) => U): Cons {
        if (this !== NIL) {
            const a = this.car;
            const b = this.cdr;
            return new Cons(f(a), is_cons(b) ? b.map(f) : b);
        }
        else {
            return NIL;
        }
    }
    /**
     * Returns the length of the list.
     */
    get length(): number {
        if (this !== NIL) {
            const argList = this.argList;
            if (is_cons(argList)) {
                return argList.length + 1;
            }
            else {
                return 1;
            }
        }
        else {
            return 0;
        }
    }
    get opr(): U {
        return this.item(0);
    }
    get arg(): U {
        return this.item(1);
    }
    get lhs(): U {
        return this.item(1);
    }
    get rhs(): U {
        return this.item(2);
    }
    /**
     * Returns the item at the specified index.
     */
    item(index: number): U {
        if (index >= 0 && this !== NIL) {
            if (index === 0) {
                return this.car;
            }
            else {
                const argList = this.argList;
                if (is_cons(argList)) {
                    return argList.item(index - 1);
                }
            }
        }
        throw new Error("index out of bounds.");
    }
}

export function cons(car: U, cdr: U): Cons {
    return new Cons(car, cdr);
}

export function makeList(...items: U[]): Cons {
    let node: Cons = NIL;
    // Iterate in reverse order so that we build up a NIL-terminated list from the right (NIL).
    for (let i = items.length - 1; i >= 0; i--) {
        node = new Cons(items[i], node);
    }
    return node;
}

/**
 * The empty list.
 */
export const NIL = new Cons(void 0, void 0);

/**
 * Returns true if arg is a Cons and is not NIL.
 * For NIL testing, test for identical equality to NIL.
 */
export function is_cons(arg: U): arg is Cons {
    // TODO: This may be useful for catching bugs.
    // How to define it in one place?
    // It MUST respect freedom of extensions.
    if (typeof arg === 'undefined') {
        throw new Error("is_cons(arg); arg must be defined.");
    }
    else {
        if (arg instanceof Cons) {
            return arg !== NIL;
        }
        else {
            return false;
        }
    }
}

export function is_nil(arg: U): boolean {
    return arg.equals(NIL);
}

/**
 * Returns the car property of the tree node if it is a Cons.
 * Otherwise, returns NIL.
 */
export function car(node: U): U {
    if (is_cons(node)) {
        return node.car;
    }
    else {
        return NIL;
    }
}

/**
 * Returns the cdr property of the tree node if it is a Cons.
 * Otherwise, returns NIL.
 */
export function cdr(node: U): U {
    if (is_cons(node)) {
        return node.cdr;
    }
    else {
        return NIL;
    }
}

function equal_cons_cons(lhs: Cons, rhs: Cons): boolean {
    let p1: U = lhs;
    let p2: U = rhs;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (is_cons(p1) && is_cons(p2)) {
            if (p1.car.equals(p2.car)) {
                p1 = p1.cdr;
                p2 = p2.cdr;
                continue;
            }
            else {
                return false;
            }
        }
        if (is_cons(p1)) {
            return false;
        }
        if (is_cons(p2)) {
            return false;
        }
        if (p1.equals(p2)) {
            // They are equal if there is nowhere else to go.
            return true;
        }
        else {
            return false;
        }
    }
}
