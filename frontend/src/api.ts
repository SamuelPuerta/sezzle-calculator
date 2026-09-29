import type { OperationId } from "./operations";

export interface CalculateParams {
  operation: OperationId;
  a: number;
  b?: number;
}

export class ApiError extends Error {}

const ENDPOINT = "/api/v1/calculate";

/** Calls the backend and returns the numeric result, or throws ApiError with a user-safe message. */
export async function calculate(
  params: CalculateParams,
  fetchFn: typeof fetch = fetch,
): Promise<number> {
  let res: Response;
  try {
    res = await fetchFn(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.");
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(`Unexpected server response (${res.status}).`);
  }

  const body = data as { result?: unknown; error?: unknown };
  if (!res.ok) {
    throw new ApiError(typeof body.error === "string" ? body.error : `Request failed (${res.status}).`);
  }
  if (typeof body.result !== "number") {
    throw new ApiError("Unexpected server response.");
  }
  return body.result;
}
