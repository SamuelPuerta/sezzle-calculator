import type { OperationDef } from "./operations";

// Plain decimal numbers with optional sign and exponent: -12, 3.5, .5, 1e10.
// Stricter than Number(), which accepts "", " ", "0x10" and "Infinity".
const NUMBER_RE = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

export type ParseResult = { value: number } | { error: string };

export function parseOperand(raw: string): ParseResult {
  const text = raw.trim();
  if (text === "") return { error: "Enter a number" };
  if (!NUMBER_RE.test(text)) return { error: "Not a valid number" };
  const value = Number(text);
  if (!Number.isFinite(value)) return { error: "Number is too large" };
  return { value };
}

export interface FieldErrors {
  a?: string;
  b?: string;
}

export type ValidationResult =
  | { ok: true; a: number; b?: number }
  | { ok: false; errors: FieldErrors };

export function validateInputs(op: OperationDef, rawA: string, rawB: string): ValidationResult {
  const errors: FieldErrors = {};
  const a = parseOperand(rawA);
  if ("error" in a) errors.a = a.error;

  let b: ParseResult | undefined;
  if (!op.unary) {
    b = parseOperand(rawB);
    if ("error" in b) errors.b = b.error;
  }

  // Cheap client-side checks that give instant feedback; the backend
  // remains the authority and re-validates everything.
  if (!errors.a && !errors.b) {
    const av = (a as { value: number }).value;
    const bv = b && "value" in b ? b.value : undefined;
    if (op.id === "divide" && bv === 0) errors.b = "Cannot divide by zero";
    if (op.id === "sqrt" && av < 0) errors.a = "Cannot take the square root of a negative number";
  }

  if (errors.a || errors.b) return { ok: false, errors };
  return {
    ok: true,
    a: (a as { value: number }).value,
    b: b && "value" in b ? b.value : undefined,
  };
}

/** Trims float noise (0.1 + 0.2 -> 0.3) without losing meaningful precision. */
export function formatResult(n: number): string {
  return String(Number(n.toPrecision(12)));
}
