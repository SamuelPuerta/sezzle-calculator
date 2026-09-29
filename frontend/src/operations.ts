// Single source of truth for the operations the UI offers.
// `id` values match the backend's `operation` field.
export type OperationId =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "power"
  | "sqrt"
  | "percentage";

export interface OperationDef {
  id: OperationId;
  label: string;
  symbol: string;
  unary: boolean;
  /** Label of the second field when it means something specific. */
  hintB?: string;
}

export const OPERATIONS: readonly OperationDef[] = [
  { id: "add", label: "Add", symbol: "+", unary: false },
  { id: "subtract", label: "Subtract", symbol: "−", unary: false },
  { id: "multiply", label: "Multiply", symbol: "×", unary: false },
  { id: "divide", label: "Divide", symbol: "÷", unary: false },
  { id: "power", label: "Power", symbol: "xʸ", unary: false, hintB: "Exponent" },
  { id: "sqrt", label: "Square root", symbol: "√", unary: true },
  { id: "percentage", label: "Percent of", symbol: "%", unary: false, hintB: "Of (value)" },
];

export const getOperation = (id: OperationId): OperationDef =>
  OPERATIONS.find((o) => o.id === id)!;
