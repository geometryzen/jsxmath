import { check } from "../src/check";

xdescribe("eigenval", function () {
    it("001", function () {
        check("coefficients(a*x**2+b*x+c,x)", "[c,b,a]");
    });
});
