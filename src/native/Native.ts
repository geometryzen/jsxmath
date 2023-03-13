/**
 * Natively implemented concepts.
 * Uppercase elements correspond to constants.
 * Lowercase elements correspond to functions.
 */
export enum Native {
    // Constants (upper case)
    E,
    IMU,
    MASH,
    NIL,
    PI,
    // Functions (lower case)
    abs,
    add,
    arctan,
    arg,
    conj,
    cos,
    divide,
    exp,
    imag,
    inner,
    inverse,
    is_complex,
    is_real,
    lco,
    log,
    multiply,
    outer,
    pow,
    real,
    rect,
    rco,
    sin,
    spread,
    subtract,
    succ,
    /**
     * tau(x) = 2 * PI * x
     */
    tau,
    test_eq,
    test_ge,
    test_gt,
    test_le,
    test_lt,
    test_ne,
}