import bigInt from 'big-integer';
import { mdiv, mmul } from './mmul';
import { mpow } from './mpow';
import { is_flt } from './operators/flt/is_flt';
import { is_rat } from './operators/rat/is_rat';
import { create_flt, Flt } from './tree/flt/Flt';
import { Num } from './tree/num/Num';
import { one, Rat } from './tree/rat/Rat';
import { U } from './tree/tree';

export function mint(a: number): bigInt.BigInteger {
    return bigInt(a);
}

export function makePositive(a: bigInt.BigInteger): bigInt.BigInteger {
    if (a.isNegative()) {
        return a.multiply(bigInt(-1));
    }
    return a;
}

export function makeSignSameAs(a: bigInt.BigInteger, b: bigInt.BigInteger): bigInt.BigInteger {
    if (a.isPositive()) {
        if (b.isNegative()) {
            return a.multiply(bigInt(-1));
        }
    }
    else {
        // a is negative
        if (b.isPositive()) {
            return a.multiply(bigInt(-1));
        }
    }
    return a;
}

export function setSignTo(a: bigInt.BigInteger, b: 1 | -1 | 0): bigInt.BigInteger {
    if (a.isPositive()) {
        if (b < 0) {
            return a.multiply(bigInt(-1));
        }
    }
    else {
        // a is negative
        if (b > 0) {
            return a.multiply(bigInt(-1));
        }
    }
    return a;
}

/**
 * TODO: Move to the NumExtension
 */
export function divide_numbers(lhs: Num, rhs: Num): Num {
    if (is_rat(lhs) && is_rat(rhs)) {
        return lhs.div(rhs);
    }

    if (rhs.isZero()) {
        throw new Error('divide by zero');
    }

    const a = is_flt(lhs) ? lhs.d : lhs.toNumber();
    const b = is_flt(rhs) ? rhs.d : rhs.toNumber();

    return create_flt(a / b);
}

/**
 * Move to NumExtension
 */
export function invert_number(p1: Num): Num {
    if (p1.isZero()) {
        // TODO: This error could/should be part of the inv() methods?
        throw new Error('divide by zero');
    }

    if (is_flt(p1)) {
        return p1.inv();
    }

    if (is_rat(p1)) {
        return p1.inv();
    }

    throw new Error();
}

export function bignum_truncate(p1: Rat): Rat {
    const a = mdiv(p1.a, p1.b);
    return new Rat(a, bigInt.one);
}

export function mp_numerator(p1: U): Rat {
    if (is_rat(p1)) {
        return p1.numer();
    }
    else {
        return one;
    }
}

export function mp_denominator(p1: U): Rat {
    if (is_rat(p1)) {
        return p1.denom();
    }
    else {
        return one;
    }
}

// expo is an integer
export function bignum_power_number(base: Rat, expo: number): Rat {
    let a = mpow(base.a, Math.abs(expo));
    let b = mpow(base.b, Math.abs(expo));

    if (expo < 0) {
        // swap a and b
        const t = a;
        a = b;
        b = t;

        a = makeSignSameAs(a, b);
        b = setSignTo(b, 1);
    }

    return new Rat(a, b);
}

export function convert_rat_to_number(p: Rat): number {
    const a_div_b = p.a.divmod(p.b);
    const result =
        a_div_b.quotient.toJSNumber() +
        a_div_b.remainder.toJSNumber() / p.b.toJSNumber();

    return result;
}

export function rational(a: number | bigInt.BigInteger, b: number | bigInt.BigInteger): Rat {
    // `as any as number` cast added because bigInt(number) and bigInt(bigInt.BigInteger)
    // are both accepted signatures, but bigInt(number|bigInt.BigInteger) is not
    return new Rat(bigInt((a as unknown) as number), bigInt((b as unknown) as number));
}

export function nativeDouble(p1: U): number {
    if (is_rat(p1)) {
        return p1.toNumber();
    }
    else if (is_flt(p1)) {
        return p1.toNumber();
    }
    else {
        return 0;
    }
}

export function rat_to_flt(n: Rat): Flt {
    const d = n.toNumber();
    return create_flt(d);
}

// n is an int
export function bignum_factorial(n: number): Rat {
    return new Rat(__factorial(n), bigInt.one);
}

// n is an int
function __factorial(n: number): bigInt.BigInteger {
    let a: bigInt.BigInteger;

    if (n === 0 || n === 1) {
        a = bigInt(1);
        return a;
    }

    a = bigInt(2);

    let b = bigInt(0);

    if (3 <= n) {
        for (let i = 3; i <= n; i++) {
            b = bigInt(i);
            a = mmul(a, b);
        }
    }

    return a;
}
