import { check } from "../src/check";

describe("product", function () {
    it("001", function () {
        // check("product([1,2,3,4])", "24");
        check("product(x+j,j,1,3)", "6+11*x+6*x**2+x**3");
    });
});
