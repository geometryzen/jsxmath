import { check } from "./check";

describe("exp", function () {
    it("001", function () {
        check("exp(sqrt(-1)*pi)", "-1");
    });
});