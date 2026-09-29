import { ApiError, calculate } from "./api";

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("calculate", () => {
  it("posts the request as JSON and returns the result", async () => {
    const fetchFn = vi.fn().mockReturnValue(json({ result: 5 }));
    await expect(calculate({ operation: "add", a: 2, b: 3 }, fetchFn)).resolves.toBe(5);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("/api/v1/calculate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ operation: "add", a: 2, b: 3 });
  });

  it("surfaces the backend error message", async () => {
    const fetchFn = vi.fn().mockReturnValue(json({ error: "division by zero" }, 422));
    await expect(calculate({ operation: "divide", a: 1, b: 0 }, fetchFn)).rejects.toThrow(
      "division by zero",
    );
  });

  it("falls back to a generic message when the error body is unusable", async () => {
    const fetchFn = vi.fn().mockReturnValue(json({}, 500));
    await expect(calculate({ operation: "add", a: 1, b: 1 }, fetchFn)).rejects.toThrow(
      "Request failed (500).",
    );
  });

  it("handles network failures", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(calculate({ operation: "add", a: 1, b: 1 }, fetchFn)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("handles non-JSON responses", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("<html>oops</html>", { status: 502 }));
    await expect(calculate({ operation: "add", a: 1, b: 1 }, fetchFn)).rejects.toThrow(
      "Unexpected server response (502).",
    );
  });

  it("rejects a 200 response without a numeric result", async () => {
    const fetchFn = vi.fn().mockReturnValue(json({ result: "5" }));
    await expect(calculate({ operation: "add", a: 1, b: 1 }, fetchFn)).rejects.toThrow(
      "Unexpected server response.",
    );
  });
});
