import { getOperation } from "./operations";
import { formatResult, parseOperand, validateInputs } from "./validation";

describe("parseOperand", () => {
  it.each(["5", "-5", "+5", "3.14", ".5", "5.", "1e3", "1E-3", "  7  "])("accepts %j", (raw) => {
    expect(parseOperand(raw)).toHaveProperty("value");
  });

  it.each(["", "   ", "abc", "1,5", "0x10", "Infinity", "NaN", "1e", "--1", "1 2"])(
    "rejects %j",
    (raw) => {
      expect(parseOperand(raw)).toHaveProperty("error");
    },
  );

  it("rejects numbers that overflow to Infinity", () => {
    expect(parseOperand("1e999")).toEqual({ error: "Number is too large" });
  });

  it("parses the value", () => {
    expect(parseOperand(" -2.5 ")).toEqual({ value: -2.5 });
  });
});

describe("validateInputs", () => {
  it("returns both operands for binary operations", () => {
    expect(validateInputs(getOperation("add"), "2", "3")).toEqual({ ok: true, a: 2, b: 3 });
  });

  it("ignores b for unary operations", () => {
    expect(validateInputs(getOperation("sqrt"), "9", "garbage")).toEqual({
      ok: true,
      a: 9,
      b: undefined,
    });
  });

  it("reports errors per field", () => {
    const res = validateInputs(getOperation("add"), "", "x");
    expect(res).toEqual({ ok: false, errors: { a: "Enter a number", b: "Not a valid number" } });
  });

  it("blocks division by zero", () => {
    const res = validateInputs(getOperation("divide"), "1", "0");
    expect(res).toEqual({ ok: false, errors: { b: "Cannot divide by zero" } });
  });

  it("allows zero as a dividend", () => {
    expect(validateInputs(getOperation("divide"), "0", "5").ok).toBe(true);
  });

  it("blocks negative square roots", () => {
    const res = validateInputs(getOperation("sqrt"), "-4", "");
    expect(res.ok).toBe(false);
  });
});

describe("formatResult", () => {
  it("removes floating point noise", () => {
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
  });
  it("keeps integers and negatives intact", () => {
    expect(formatResult(1024)).toBe("1024");
    expect(formatResult(-7.5)).toBe("-7.5");
  });
});
