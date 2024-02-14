import { create_sym } from 'math-expression-atoms';
import { Native, native_sym } from 'math-expression-native';
import { nil } from 'math-expression-tree';
import { eval_approxratio } from '../approxratio';
import { MulComparator } from '../calculators/compare/compare_factor_factor';
import { AddComparator } from '../calculators/compare/compare_term_term';
import { eval_choose } from '../choose';
import { eval_clear, eval_clearall } from '../clear';
import { stack_abs, stack_add, stack_adj, stack_and, stack_arccos, stack_arccosh, stack_arcsin, stack_arcsinh, stack_arctan, stack_arctanh, stack_arg, stack_binding, stack_check, stack_circexp, stack_clock, stack_conj, stack_cos, stack_cosh, stack_denominator, stack_derivative, stack_det, stack_exp, stack_expcos, stack_expcosh, stack_expsin, stack_expsinh, stack_exptan, stack_exptanh, stack_floor, stack_imag, stack_index, stack_inv, stack_kronecker, stack_log, stack_minor, stack_minormatrix, stack_mod, stack_noexpand, stack_not, stack_nroots, stack_numerator, stack_outer, stack_polar, stack_power, stack_rank, stack_rationalize, stack_real, stack_rect, stack_simplify, stack_sin, stack_sinh, stack_sqrt, stack_testge, stack_testgt, stack_testlt, stack_transpose, stack_unit } from '../eigenmath/eigenmath';
import { stack_infixform } from '../eigenmath/stack_infixform';
import { eval_filter } from '../filter';
import { eval_leading } from '../leading';
import { eval_lookup } from '../lookup';
import { algebra_2_tensor_tensor } from '../operators/algebra/algebra_2_mat_mat';
import { assign_any_any } from '../operators/assign/assign_any_any';
import { assign_sym_any } from '../operators/assign/assign_sym_any';
import { cell_extension_builder } from '../operators/atom/atom_extension';
import { atom_builder } from '../operators/atom/eval_atom';
import { besselj_varargs } from '../operators/besselj/besselj_varargs';
import { bessely_varargs } from '../operators/bessely/bessely_varargs';
import { binomial_varargs } from '../operators/binomial/binomial_varargs';
import { blade_extension_builder } from '../operators/blade/blade_extension';
import { boo_extension } from '../operators/boo/boo_extension';
import { ceiling_cons } from '../operators/ceiling/ceiling_cons';
import { ceiling_flt } from '../operators/ceiling/ceiling_flt';
import { ceiling_rat } from '../operators/ceiling/ceiling_rat';
import { coeff_varargs } from '../operators/coeff/coeff_varargs';
import { eval_coefficients } from '../operators/coeff/eval_coefficients';
import { cofactor_varargs } from '../operators/cofactor/cofactor_varargs';
import { complex_2_any_any } from '../operators/complex/complex_2_any_any';
import { condense_varargs } from '../operators/condense/condense_varargs';
import { cons_extension_builder } from '../operators/cons/cons_extension';
import { contract_varargs } from '../operators/contract/contract_varargs';
import { cross_any_any } from '../operators/cross/cross_any_any';
import { cross_blade_blade_builder } from '../operators/cross/cross_blade_blade';
import { MATH_VECTOR_CROSS_PRODUCT } from '../operators/cross/MATH_VECTOR_CROSS_PRODUCT';
import { def_sym_builder } from '../operators/def/def_sym';
import { def_sym_doc_init_builder } from '../operators/def/def_sym_doc_init';
import { def_sym_init_builder } from '../operators/def/def_sym_init';
import { defint_builder } from '../operators/defint/defint';
import { defn_builder } from '../operators/defn/eval_defn';
import { eval_deg } from '../operators/degree/degree';
import { deref_builder } from '../operators/deref/eval_deref';
import { d_to_derivative_builder } from '../operators/derivative/d_to_derivative';
import { map_extension_builder } from '../operators/dictionary/dictionary_extension';
import { dim_varargs } from '../operators/dim/dim_varargs';
import { dirac_varargs } from '../operators/dirac/dirac_varargs';
import { make_lhs_distrib_expand_law, make_rhs_distrib_expand_law } from '../operators/distrib/make_distrib_expand_law';
import { eval_divisors } from '../operators/divisors/divisors_varargs';
import { do_varargs } from '../operators/do/do_varargs';
import { dotdot_builder } from '../operators/dotdot/eval_dotdot';
import { eval_draw } from '../operators/draw/eval_draw';
import { eigenval_varargs } from '../operators/eigen/eigenval_varargs';
import { eigenvec_varargs } from '../operators/eigen/eigenvec_varargs';
import { eigen_varargs } from '../operators/eigen/eigen_varargs';
import { erf_varargs } from '../operators/erf/erf_varargs';
import { erfc_varargs } from '../operators/erfc/erfc_varargs';
import { err_extension_builder } from '../operators/err/err_extension';
import { eval_varargs } from '../operators/eval/eval_varargs';
import { expand_extension } from '../operators/expand/expand_extension';
import { factor_varargs } from '../operators/factor/factor_varargs';
import { factorial_varargs } from '../operators/factorial/factorial_varargs';
import { float_varargs } from '../operators/float/float_varargs';
import { flt_extension_builder } from '../operators/flt/flt_extension';
import { for_varargs } from '../operators/for/for_varargs';
import { gamma_varargs } from '../operators/gamma/gamma_varargs';
import { gcd_varargs } from '../operators/gcd/gcd_varargs';
import { stack_hadamard } from '../operators/hadamard/stack_hadamard';
import { hermite_varargs } from '../operators/hermite/hermite_varargs';
import { eval_hilbert } from '../operators/hilbert/hilbert_varargs';
import { hyp_extension_builder } from '../operators/hyp/hyp_extension';
import { infinitesimal_1_str } from '../operators/hyp/infinitesimal_1_str';
import { imu_extension_builder } from '../operators/imu/Imu_extension';
import { eval_inner } from '../operators/inner/eval_inner';
import { inner_product_builder } from '../operators/inner/inner';
import { inner_2_any_imu } from '../operators/inner/inner_2_any_imu';
import { inner_2_any_rat } from '../operators/inner/inner_2_any_rat';
import { inner_2_any_real } from '../operators/inner/inner_2_any_real';
import { inner_2_blade_blade } from '../operators/inner/inner_2_blade_blade';
import { inner_2_imu_any } from '../operators/inner/inner_2_imu_any';
import { inner_2_imu_imu } from '../operators/inner/inner_2_imu_imu';
import { inner_2_imu_rat } from '../operators/inner/inner_2_imu_rat';
import { inner_2_num_num } from '../operators/inner/inner_2_num_num';
import { inner_2_rat_any_builder } from '../operators/inner/inner_2_rat_any';
import { inner_2_rat_imu } from '../operators/inner/inner_2_rat_imu';
import { inner_2_rat_sym } from '../operators/inner/inner_2_rat_sym';
import { inner_2_real_any } from '../operators/inner/inner_2_real_any';
import { inner_2_sym_sym } from '../operators/inner/inner_2_sym_sym';
import { inner_2_vec_scalar } from '../operators/inner/inner_2_vec_scalar';
import { integral_varargs } from '../operators/integral/integral_varargs';
import { inv_any } from '../operators/inv/inv_any';
import { inv_inv } from '../operators/inv/inv_inv';
import { is_complex_any } from '../operators/iscomplex/is_complex_any';
import { is_complex_sym } from '../operators/iscomplex/is_complex_sym';
import { isinfinitesimal_any } from '../operators/isinfinitesimal/isinfinitesimal_any';
import { isinfinitesimal_hyp } from '../operators/isinfinitesimal/isinfinitesimal_hyp';
import { isinfinitesimal_mul } from '../operators/isinfinitesimal/isinfinitesimal_mul';
import { isinfinitesimal_rat } from '../operators/isinfinitesimal/isinfinitesimal_rat';
import { isinfinitesimal_sym } from '../operators/isinfinitesimal/isinfinitesimal_sym';
import { ispositive_any } from '../operators/ispositive/ispositive_any';
import { ispositive_exp } from '../operators/ispositive/ispositive_exp';
import { ispositive_flt } from '../operators/ispositive/ispositive_flt';
import { ispositive_rat } from '../operators/ispositive/ispositive_rat';
import { ispositive_sym } from '../operators/ispositive/ispositive_sym';
import { isprime_varargs } from '../operators/isprime/isprime_varargs';
import { is_real_pow_any_negone } from '../operators/isreal/isreal_pow_any_negone';
import { is_real_abs } from '../operators/isreal/is_real_abs';
import { is_real_add } from '../operators/isreal/is_real_add';
import { is_real_any } from '../operators/isreal/is_real_any';
import { isreal_holomorphic, is_real_cos } from '../operators/isreal/is_real_cos';
import { is_real_flt } from '../operators/isreal/is_real_flt';
import { is_real_imag } from '../operators/isreal/is_real_imag';
import { is_real_imu } from '../operators/isreal/is_real_imu';
import { is_real_mul } from '../operators/isreal/is_real_mul';
import { is_real_pow_e_sym } from '../operators/isreal/is_real_pow_e_syml';
import { is_real_pow_imu_rat } from '../operators/isreal/is_real_pow_imu_rat';
import { is_real_pow_rat_rat } from '../operators/isreal/is_real_pow_rat_rat';
import { is_real_pow_sym_rat } from '../operators/isreal/is_real_pow_sym_rat';
import { is_real_rat } from '../operators/isreal/is_real_rat';
import { is_real_real } from '../operators/isreal/is_real_real';
import { is_real_sin } from '../operators/isreal/is_real_sin';
import { make_predicate_sym_extension } from '../operators/isreal/is_real_sym';
import { iszero_any } from '../operators/iszero/iszero_any';
import { iszero_flt_builder } from '../operators/iszero/iszero_flt';
import { iszero_rat_builder } from '../operators/iszero/iszero_rat';
import { iszero_sym_builder } from '../operators/iszero/iszero_sym';
import { iszero_tensor_builder } from '../operators/iszero/iszero_tensor';
import { jsobject_extension_builder } from '../operators/jsobject/JsObjectExtension';
import { keyword_extension_builder } from '../operators/keyword/KeywordExtension';
import { laguerre_varargs } from '../operators/laguerre/laguerre_varargs';
import { lcm_varargs } from '../operators/lcm/lcm_varargs';
import { lco_2_any_any } from '../operators/lco/lco_2_any_any';
import { lco_2_blade_blade } from '../operators/lco/lco_2_blade_blade';
import { legendre_varargs } from '../operators/legendre/legendre_varargs';
import { let_varargs } from '../operators/let/let_varargs';
import { stack_mag } from '../operators/mag/stack_mag';
import { eval_multiply } from '../operators/mul/eval_multiply';
import { mul_2_tensor_tensor } from '../operators/mul/mul_2_tensor_tensor';
import { nil_extension_builder } from '../operators/nil/nil_extension';
import { or_varargs } from '../operators/or/or_varargs';
import { outer_2_any_any } from '../operators/outer/outer_2_any_any';
import { outer_2_any_mul_2_scalar_any } from '../operators/outer/outer_2_any_mul_2_scalar_any';
import { outer_2_blade_blade } from '../operators/outer/outer_2_blade_blade';
import { outer_2_mul_2_scalar_any_any } from '../operators/outer/outer_2_mul_2_scalar_any_any';
import { outer_2_sym_sym } from '../operators/outer/outer_2_sym_sym';
import { outer_2_tensor_tensor } from '../operators/outer/outer_2_tensor_tensor';
import { pred_any } from '../operators/pred/pred_any';
import { pred_rat } from '../operators/pred/pred_rat';
import { make_printmode_function } from '../operators/printing/make_printmode_keyword';
import { make_printmode_operator } from '../operators/printing/make_printmode_operator';
import { product_varargs } from '../operators/product/product_varargs';
import { eval_quote } from '../operators/quote/quote_varargs';
import { eval_rank } from '../operators/rank/rank';
import { rat_extension_builder } from '../operators/rat/rat_extension';
import { rco_2_any_any } from '../operators/rco/rco_2_any_any';
import { rco_2_any_mul_2_scalar_any } from '../operators/rco/rco_2_any_mul_2_scalar_any';
import { rco_2_blade_blade } from '../operators/rco/rco_2_blade_blade';
import { rco_2_mul_2_scalar_any_any } from '../operators/rco/rco_2_mul_2_scalar_any_any';
import { reaction_builder } from '../operators/reaction/eval_reaction';
import { reset_builder } from '../operators/reset/eval_reset';
import { stack_rotate } from '../operators/rotate/stack_rotate';
import { eval_round } from '../operators/round/round';
import { script_last_0 } from '../operators/script_last/script_last';
import { sgn_any_builder } from '../operators/sgn/sgn_any';
import { sgn_flt_builder } from '../operators/sgn/sgn_flt';
import { sgn_rat_builder } from '../operators/sgn/sgn_rat';
import { eval_shape } from '../operators/shape/shape';
import { stack_st } from '../operators/st/stack_st';
import { st_add_2_any_hyp } from '../operators/st/st_add_2_any_hyp';
import { st_any } from '../operators/st/st_any';
import { st_hyp } from '../operators/st/st_hyp';
import { st_mul_2_rat_any } from '../operators/st/st_mul_2_rat_any';
import { st_rat } from '../operators/st/st_rat';
import { st_sym } from '../operators/st/st_sym';
import { str_extension_builder } from '../operators/str/str_extension';
import { eval_subst } from '../operators/subst/eval_subst';
import { succ_any } from '../operators/succ/succ_any';
import { succ_rat } from '../operators/succ/succ_rat';
import { eval_sum } from '../operators/sum/sum';
import { sym_extension_builder } from '../operators/sym/sym_extension';
import { sym_math_add_builder } from '../operators/sym/sym_math_add';
import { sym_math_mul_builder } from '../operators/sym/sym_math_mul';
import { sym_math_pi_builder } from '../operators/sym/sym_math_pi';
import { sym_math_pow_builder } from '../operators/sym/sym_math_pow';
import { symbol_varargs } from '../operators/symbol/symbol_varargs';
import { eval_tan } from '../operators/tan/tan';
import { eval_tanh } from '../operators/tanh/tanh';
import { tau_builder } from '../operators/tau/tau';
import { eval_taylor } from '../operators/taylor/taylor';
import { tensor_extension_builder } from '../operators/tensor/tensor_extension';
import { eval_typeof } from '../operators/typeof/eval_typeof';
import { stack_uom } from '../operators/uom/stack_uom';
import { uom_extension_builder } from '../operators/uom/uom_extension';
import { eval_zero } from '../operators/zero/zero';
import { eval_prime } from '../prime';
import { get_last_print_mode_symbol } from '../print/print';
import { render_using_print_mode } from '../print/render_using_print_mode';
import { store_text_in_binding } from '../print/store_text_in_binding';
import { eval_quotient } from '../quotient';
import { eval_roots } from '../roots';
import { AND, APPROXRATIO, CHECK, CHOOSE, CLEAR, CLEARALL, DOT, FACTOR, ISREAL, QUOTE, RANK, UOM } from '../runtime/constants';
import { defs, PRINTMODE_ASCII, PRINTMODE_HUMAN, PRINTMODE_INFIX, PRINTMODE_LATEX, PRINTMODE_SEXPR } from '../runtime/defs';
import { RESERVED_KEYWORD_LAST } from '../runtime/ns_script';
import { eval_and, eval_test, eval_testeq, eval_testle, eval_testne } from '../test';
import { one, zero } from '../tree/rat/Rat';
import { ExtensionEnv } from "./ExtensionEnv";

export interface DefineStandardOperatorsConfig {
    /**
     * Scripting Engines will use 'd' as a shorthand for 'derivative'.
     */
    useDerivativeShorthandLowerD: boolean;
}

export function define_std_operators($: ExtensionEnv, config: DefineStandardOperatorsConfig) {
    // 
    const MATH_ADD = native_sym(Native.add);        // +
    const MATH_INNER = native_sym(Native.inner);    // |
    const MATH_LCO = native_sym(Native.lco);        // <<
    const MATH_MUL = native_sym(Native.multiply);   // *
    const MATH_OUTER = native_sym(Native.outer);    // ^
    const MATH_RCO = native_sym(Native.rco);        // >>

    const COS = native_sym(Native.cos);
    const EXP = native_sym(Native.exp);
    const FACTORIAL = native_sym(Native.factorial);
    const FILTER = native_sym(Native.filter);
    const LEADING = native_sym(Native.leading);
    const LOOKUP = native_sym(Native.lookup);
    const PRIME = native_sym(Native.prime);
    const TEST = native_sym(Native.test);

    // Addition (+)
    $.setSymbolOrder(MATH_ADD, new AddComparator());
    $.defineAssociative(MATH_ADD, zero);
    $.defineStackFunction(MATH_ADD, stack_add);

    // Exponentiation (pow)
    $.defineStackFunction(native_sym(Native.pow), stack_power);

    // Multiplication (*)
    $.setSymbolOrder(MATH_MUL, new MulComparator());
    $.defineAssociative(MATH_MUL, one);
    $.defineExtension(make_lhs_distrib_expand_law(MATH_MUL, MATH_ADD));
    $.defineExtension(make_rhs_distrib_expand_law(MATH_MUL, MATH_ADD));
    $.defineExtension(mul_2_tensor_tensor);
    $.defineEvalFunction(MATH_MUL, eval_multiply);

    $.defineEvalFunction(APPROXRATIO, eval_approxratio);
    $.defineExtension(binomial_varargs);

    $.defineStackFunction(CHECK, stack_check);

    $.defineEvalFunction(CHOOSE, eval_choose);

    $.defineEvalFunction(CLEAR, eval_clear);
    $.defineKeyword(CLEARALL, eval_clearall);

    $.defineStackFunction(native_sym(Native.conj), stack_conj);

    $.defineEvalFunction(native_sym(Native.deg), eval_deg);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // TODO: I don't think we should be using defineKeyword for (factor n) and factor(p, x)
    $.defineKeyword(FACTOR, function ($: ExtensionEnv): void {
        const last = $.getBinding(RESERVED_KEYWORD_LAST, nil);
        const factored = $.factor(last);
        $.setBinding(RESERVED_KEYWORD_LAST, factored);

        const str = render_using_print_mode(factored, defs.printMode, $);
        const printHandler = $.getPrintHandler();
        printHandler.print(str);

        store_text_in_binding(str, get_last_print_mode_symbol(defs.printMode), $);
    });

    $.defineEvalFunction(FILTER, eval_filter);

    $.defineExtension(gamma_varargs);

    $.defineExtension(gcd_varargs);

    $.defineExtension(hermite_varargs);

    $.defineStackFunction(create_sym("infixform"), stack_infixform);

    // Inner Product (|)
    $.defineExtension(make_lhs_distrib_expand_law(MATH_INNER, MATH_ADD));
    $.defineExtension(make_rhs_distrib_expand_law(MATH_INNER, MATH_ADD));
    $.defineExtension(inner_2_num_num);
    $.defineExtension(inner_2_rat_imu);
    $.defineExtension(inner_2_rat_sym);
    $.defineExtension(inner_2_rat_any_builder);
    $.defineExtension(inner_2_imu_rat);
    $.defineExtension(inner_2_imu_imu);
    $.defineExtension(inner_2_imu_any);
    $.defineExtension(inner_2_sym_sym);
    $.defineExtension(inner_2_vec_scalar);
    $.defineOperator(inner_2_blade_blade);
    $.defineOperator(inner_2_real_any);
    $.defineOperator(inner_2_any_real);
    $.defineOperator(inner_2_any_rat);
    $.defineExtension(inner_2_any_imu);
    $.defineExtension(inner_product_builder);

    $.defineStackFunction(native_sym(Native.kronecker), stack_kronecker);

    $.defineExtension(laguerre_varargs);

    $.defineExtension(lcm_varargs);

    $.defineEvalFunction(LEADING, eval_leading);

    // Left Contraction (<<)
    $.defineExtension(lco_2_blade_blade);
    $.defineExtension(make_lhs_distrib_expand_law(MATH_LCO, MATH_ADD));
    $.defineExtension(make_rhs_distrib_expand_law(MATH_LCO, MATH_ADD));
    $.defineExtension(lco_2_any_any);

    $.defineExtension(legendre_varargs);
    $.defineExtension(let_varargs);

    $.defineStackFunction(native_sym(Native.log), stack_log);
    $.defineStackFunction(native_sym(Native.mag), stack_mag);

    $.defineEvalFunction(LOOKUP, eval_lookup);

    $.defineStackFunction(native_sym(Native.mod), stack_mod);
    $.defineStackFunction(native_sym(Native.noexpand), stack_noexpand);

    // Outer Product (^)
    $.defineExtension(outer_2_blade_blade);
    $.defineExtension(outer_2_tensor_tensor);
    $.defineExtension(make_lhs_distrib_expand_law(MATH_OUTER, MATH_ADD));
    $.defineExtension(make_rhs_distrib_expand_law(MATH_OUTER, MATH_ADD));
    $.defineExtension(outer_2_mul_2_scalar_any_any);
    $.defineExtension(outer_2_sym_sym);
    $.defineExtension(outer_2_any_mul_2_scalar_any);
    $.defineExtension(outer_2_any_any);
    $.defineAssociative(MATH_OUTER, one);
    $.defineStackFunction(MATH_OUTER, stack_outer);

    $.defineEvalFunction(PRIME, eval_prime);

    $.defineEvalFunction(RANK, eval_rank);
    $.defineStackFunction(RANK, stack_rank);

    $.defineExtension(rco_2_blade_blade);
    $.defineExtension(make_lhs_distrib_expand_law(MATH_RCO, MATH_ADD));
    $.defineExtension(make_rhs_distrib_expand_law(MATH_RCO, MATH_ADD));
    $.defineExtension(rco_2_mul_2_scalar_any_any);
    $.defineExtension(rco_2_any_mul_2_scalar_any);
    $.defineExtension(rco_2_any_any);

    $.defineExtension(boo_extension);
    $.defineExtension(rat_extension_builder);
    $.defineExtension(flt_extension_builder);
    $.defineExtension(str_extension_builder);
    $.defineExtension(jsobject_extension_builder);

    $.defineStackFunction(native_sym(Native.abs), stack_abs);
    $.defineStackFunction(native_sym(Native.adj), stack_adj);

    $.defineExtension(algebra_2_tensor_tensor);

    $.defineEvalFunction(AND, eval_and);
    $.defineStackFunction(create_sym("and"), stack_and);

    $.defineStackFunction(native_sym(Native.arccos), stack_arccos);
    $.defineStackFunction(native_sym(Native.arccosh), stack_arccosh);
    $.defineStackFunction(native_sym(Native.arcsin), stack_arcsin);
    $.defineStackFunction(native_sym(Native.arcsinh), stack_arcsinh);
    $.defineStackFunction(native_sym(Native.arctan), stack_arctan);
    $.defineStackFunction(native_sym(Native.arctanh), stack_arctanh);
    $.defineStackFunction(native_sym(Native.arg), stack_arg);

    $.defineExtension(assign_sym_any);
    $.defineExtension(assign_any_any);

    $.defineExtension(atom_builder);
    $.defineExtension(reaction_builder);

    $.defineExtension(besselj_varargs);
    $.defineExtension(bessely_varargs);

    $.defineStackFunction(native_sym(Native.binding), stack_binding);

    $.defineExtension(ceiling_flt);
    $.defineExtension(ceiling_rat);
    $.defineExtension(ceiling_cons);

    $.defineStackFunction(native_sym(Native.circexp), stack_circexp);

    $.defineStackFunction(native_sym(Native.clock), stack_clock);

    $.defineExtension(coeff_varargs);
    $.defineEvalFunction(native_sym(Native.coefficients), eval_coefficients);
    $.defineExtension(cofactor_varargs);
    $.defineExtension(complex_2_any_any);
    $.defineExtension(condense_varargs);
    $.defineExtension(contract_varargs);

    $.defineStackFunction(native_sym(Native.cos), stack_cos);
    $.defineStackFunction(native_sym(Native.cosh), stack_cosh);

    $.defineExtension(cross_blade_blade_builder);
    $.defineExtension(make_lhs_distrib_expand_law(MATH_VECTOR_CROSS_PRODUCT, MATH_ADD));
    $.defineExtension(make_rhs_distrib_expand_law(MATH_VECTOR_CROSS_PRODUCT, MATH_ADD));
    $.defineExtension(cross_any_any);

    $.defineExtension(def_sym_builder);
    $.defineExtension(def_sym_init_builder);
    $.defineExtension(def_sym_doc_init_builder);
    $.defineExtension(defint_builder);

    $.defineStackFunction(native_sym(Native.denominator), stack_denominator);

    $.defineExtension(defn_builder);

    $.defineExtension(deref_builder);

    if (config.useDerivativeShorthandLowerD) {
        // console.lg("Installing d_to_derivative");
        $.defineExtension(d_to_derivative_builder);
    }
    else {
        // console.lg("NOT installing d_to_derivative");
    }

    $.defineStackFunction(native_sym(Native.derivative), stack_derivative);
    $.defineStackFunction(native_sym(Native.det), stack_det);

    $.defineOperator(dotdot_builder);

    $.defineOperator(dim_varargs);
    $.defineOperator(dirac_varargs);
    $.defineEvalFunction(create_sym("divisors"), eval_divisors);

    $.defineOperator(do_varargs);

    $.defineEvalFunction(DOT, eval_inner);

    $.defineEvalFunction(create_sym("draw"), eval_draw);

    $.defineOperator(eigen_varargs);
    $.defineOperator(eigenval_varargs);
    $.defineOperator(eigenvec_varargs);

    $.defineOperator(erf_varargs);
    $.defineExtension(erfc_varargs);

    $.defineExtension(eval_varargs);

    $.defineStackFunction(native_sym(Native.exp), stack_exp);

    $.defineExtension(expand_extension);

    $.defineStackFunction(native_sym(Native.expcos), stack_expcos);
    $.defineStackFunction(native_sym(Native.expcosh), stack_expcosh);
    $.defineStackFunction(native_sym(Native.expsin), stack_expsin);
    $.defineStackFunction(native_sym(Native.expsinh), stack_expsinh);
    $.defineStackFunction(native_sym(Native.exptan), stack_exptan);
    $.defineStackFunction(native_sym(Native.exptanh), stack_exptanh);

    $.defineOperator(factor_varargs);
    $.defineOperator(factorial_varargs);
    $.defineOperator(float_varargs);

    $.defineStackFunction(create_sym("floor"), stack_floor);

    $.defineOperator(for_varargs);

    $.defineStackFunction(native_sym(Native.hadamard), stack_hadamard);
    $.defineEvalFunction(native_sym(Native.hilbert), eval_hilbert);
    $.defineStackFunction(native_sym(Native.imag), stack_imag);

    $.defineStackFunction(native_sym(Native.component), stack_index);

    $.defineOperator(infinitesimal_1_str);

    $.defineOperator(integral_varargs);

    $.defineOperator(inv_inv);
    $.defineOperator(inv_any);
    $.defineStackFunction(native_sym(Native.inv), stack_inv);

    $.defineOperator(is_complex_sym);
    $.defineOperator(is_complex_any);

    $.defineOperator(isinfinitesimal_hyp);
    $.defineOperator(isinfinitesimal_mul);
    $.defineOperator(isinfinitesimal_rat);
    $.defineOperator(isinfinitesimal_sym);
    $.defineOperator(isinfinitesimal_any);

    $.defineOperator(ispositive_exp);
    $.defineOperator(ispositive_flt);
    $.defineOperator(ispositive_rat);
    $.defineOperator(ispositive_sym);
    $.defineOperator(ispositive_any);

    $.defineOperator(isprime_varargs);

    $.defineOperator(is_real_abs);
    $.defineOperator(is_real_add);
    $.defineExtension(isreal_holomorphic(COS));
    $.defineExtension(isreal_holomorphic(EXP));
    $.defineExtension(isreal_holomorphic(FACTORIAL));
    $.defineExtension(is_real_cos);
    $.defineOperator(is_real_flt);
    $.defineOperator(is_real_imag);
    $.defineOperator(is_real_imu);
    $.defineOperator(is_real_mul);
    $.defineOperator(is_real_pow_e_sym);
    $.defineOperator(is_real_pow_rat_rat);
    $.defineOperator(is_real_pow_sym_rat);
    $.defineOperator(is_real_pow_imu_rat);
    $.defineOperator(is_real_pow_any_negone);
    $.defineOperator(is_real_rat);
    $.defineOperator(is_real_real);
    $.defineOperator(is_real_sin);
    $.defineExtension(make_predicate_sym_extension(ISREAL));
    $.defineOperator(is_real_any);

    $.defineOperator(iszero_flt_builder);
    $.defineOperator(iszero_rat_builder);
    $.defineOperator(iszero_sym_builder);
    $.defineOperator(iszero_tensor_builder);
    $.defineOperator(iszero_any);

    $.defineStackFunction(native_sym(Native.minor), stack_minor);
    $.defineStackFunction(native_sym(Native.minormatrix), stack_minormatrix);
    $.defineStackFunction(native_sym(Native.not), stack_not);

    $.defineStackFunction(native_sym(Native.numerator), stack_numerator);
    $.defineStackFunction(native_sym(Native.nroots), stack_nroots);

    $.defineExtension(or_varargs);

    $.defineExtension(pred_rat);
    $.defineExtension(pred_any);

    $.defineStackFunction(native_sym(Native.polar), stack_polar);

    $.defineExtension(make_printmode_operator('print', () => defs.printMode));
    $.defineExtension(make_printmode_operator('printascii', () => PRINTMODE_ASCII));
    $.defineExtension(make_printmode_operator('printhuman', () => PRINTMODE_HUMAN));
    $.defineExtension(make_printmode_operator('printinfix', () => PRINTMODE_INFIX));
    $.defineExtension(make_printmode_operator('printlatex', () => PRINTMODE_LATEX));
    $.defineExtension(make_printmode_operator('printsexpr', () => PRINTMODE_SEXPR));

    $.defineExtension(make_printmode_function('print', () => defs.printMode));
    $.defineExtension(make_printmode_function('printascii', () => PRINTMODE_ASCII));
    $.defineExtension(make_printmode_function('printhuman', () => PRINTMODE_HUMAN));
    $.defineExtension(make_printmode_function('printinfix', () => PRINTMODE_INFIX));
    $.defineExtension(make_printmode_function('printlatex', () => PRINTMODE_LATEX));
    $.defineExtension(make_printmode_function('printsexpr', () => PRINTMODE_SEXPR));

    $.defineExtension(product_varargs);

    $.defineEvalFunction(QUOTE, eval_quote);
    $.defineEvalFunction(create_sym("quotient"), eval_quotient);

    $.defineStackFunction(native_sym(Native.rationalize), stack_rationalize);
    $.defineStackFunction(native_sym(Native.real), stack_real);
    $.defineStackFunction(native_sym(Native.rect), stack_rect);

    $.defineExtension(reset_builder);

    $.defineEvalFunction(native_sym(Native.roots), eval_roots);

    $.defineEvalFunction(create_sym("round"), eval_round);
    $.defineStackFunction(native_sym(Native.rotate), stack_rotate);

    $.defineExtension(script_last_0);

    $.defineExtension(sgn_flt_builder);
    $.defineExtension(sgn_rat_builder);
    $.defineExtension(sgn_any_builder);

    $.defineEvalFunction(native_sym(Native.shape), eval_shape);
    $.defineStackFunction(native_sym(Native.simplify), stack_simplify);

    $.defineStackFunction(native_sym(Native.sin), stack_sin);
    $.defineStackFunction(native_sym(Native.sinh), stack_sinh);

    $.defineExtension(succ_rat);
    $.defineExtension(succ_any);

    $.defineStackFunction(native_sym(Native.sqrt), stack_sqrt);

    // Standard part function
    // https://en.wikipedia.org/wiki/Standard_part_function
    $.defineExtension(st_any);
    $.defineExtension(st_add_2_any_hyp);
    $.defineExtension(st_mul_2_rat_any);
    $.defineExtension(st_rat);
    $.defineExtension(st_sym);
    $.defineExtension(st_hyp);
    $.defineStackFunction(native_sym(Native.st), stack_st);

    $.defineEvalFunction(native_sym(Native.subst), eval_subst);
    $.defineEvalFunction(native_sym(Native.taylor), eval_sum);

    $.defineExtension(symbol_varargs);

    $.defineEvalFunction(native_sym(Native.taylor), eval_taylor);

    $.defineEvalFunction(native_sym(Native.tan), eval_tan);
    $.defineEvalFunction(native_sym(Native.tanh), eval_tanh);
    $.defineExtension(tau_builder);

    $.defineEvalFunction(create_sym('typeof'), eval_typeof);

    $.defineEvalFunction(TEST, eval_test);
    $.defineEvalFunction(native_sym(Native.testeq), eval_testeq);
    $.defineEvalFunction(native_sym(Native.testle), eval_testle);
    $.defineStackFunction(native_sym(Native.testlt), stack_testlt);
    $.defineStackFunction(native_sym(Native.testge), stack_testge);
    $.defineStackFunction(native_sym(Native.testgt), stack_testgt);
    $.defineEvalFunction(native_sym(Native.testne), eval_testne);
    $.defineStackFunction(native_sym(Native.transpose), stack_transpose);

    $.defineExtension(sym_math_add_builder);
    $.defineExtension(sym_math_mul_builder);
    $.defineExtension(sym_math_pow_builder);
    $.defineExtension(sym_math_pi_builder);

    $.defineExtension(sym_extension_builder);
    $.defineExtension(tensor_extension_builder);
    $.defineExtension(blade_extension_builder);
    $.defineExtension(cell_extension_builder);
    $.defineExtension(uom_extension_builder);
    $.defineExtension(hyp_extension_builder);
    $.defineExtension(err_extension_builder);
    $.defineExtension(imu_extension_builder);
    $.defineExtension(keyword_extension_builder);
    $.defineExtension(map_extension_builder);

    $.defineStackFunction(native_sym(Native.unit), stack_unit);
    $.defineStackFunction(UOM, stack_uom);

    $.defineEvalFunction(native_sym(Native.zero), eval_zero);

    // NIL is implemented as an empty Cons, so it has to be defined before the generic Cons operator.
    $.defineExtension(nil_extension_builder);

    // There is no fallback. We migrate everything.
    $.defineExtension(cons_extension_builder);
}
