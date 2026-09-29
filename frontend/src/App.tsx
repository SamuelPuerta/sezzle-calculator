import { useState, type FormEvent } from "react";
import { ApiError, calculate } from "./api";
import { OPERATIONS, getOperation, type OperationId } from "./operations";
import { formatResult, validateInputs, type FieldErrors } from "./validation";

export default function App() {
  const [opId, setOpId] = useState<OperationId>("add");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const op = getOperation(opId);

  function clearFeedback() {
    setFieldErrors({});
    setServerError(null);
    setResult(null);
  }

  function selectOperation(id: OperationId) {
    setOpId(id);
    clearFeedback();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearFeedback();

    const validation = validateInputs(op, a, b);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const value = await calculate({ operation: op.id, a: validation.a, b: validation.b });
      setResult(formatResult(value));
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <main className="layout">
        <div className="controls">
          <h1>Calculator</h1>

          <form onSubmit={handleSubmit} noValidate>
            <div className="ops" role="group" aria-label="Operation">
              {OPERATIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={o.id === opId ? "op active" : "op"}
                  aria-pressed={o.id === opId}
                  onClick={() => selectOperation(o.id)}
                >
                  <span aria-hidden="true">{o.symbol}</span> {o.label}
                </button>
              ))}
            </div>

            <Field
              id="a"
              label={op.unary ? "Number" : op.id === "percentage" ? "Percent" : "First number"}
              value={a}
              error={fieldErrors.a}
              onChange={(v) => {
                setA(v);
                clearFeedback();
              }}
            />
            {!op.unary && (
              <Field
                id="b"
                label={op.hintB ?? "Second number"}
                value={b}
                error={fieldErrors.b}
                onChange={(v) => {
                  setB(v);
                  clearFeedback();
                }}
              />
            )}

            <button type="submit" className="submit" disabled={loading}>
              {loading ? "Calculating…" : "Calculate"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="output" aria-live="polite">
            {result !== null && (
              <p className="result" role="status">
                = <strong>{result}</strong>
              </p>
            )}
            {serverError && (
              <p className="error" role="alert">
                {serverError}
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <a href="https://samuel-puerta.vercel.app/" target="_blank" rel="noopener noreferrer">
          Samuel Puerta
        </a>
      </footer>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function Field({ id, label, value, error, onChange }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}
