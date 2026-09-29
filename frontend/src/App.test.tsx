import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("App", () => {
  it("adds two numbers via the API and shows the result", async () => {
    const fetchFn = mockFetch(200, { result: 5 });
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("First number"), "2");
    await user.type(screen.getByLabelText("Second number"), "3");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(await screen.findByRole("status")).toHaveTextContent("= 5");
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ operation: "add", a: 2, b: 3 });
  });

  it("shows field errors and does not call the API for invalid input", async () => {
    const fetchFn = mockFetch(200, { result: 0 });
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("First number"), "abc");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(screen.getByText("Not a valid number")).toBeInTheDocument();
    expect(screen.getByText("Enter a number")).toBeInTheDocument();
    expect(screen.getByLabelText("First number")).toBeInvalid();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("catches division by zero before hitting the API", async () => {
    const fetchFn = mockFetch(200, { result: 0 });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Divide/ }));
    await user.type(screen.getByLabelText("First number"), "1");
    await user.type(screen.getByLabelText("Second number"), "0");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(screen.getByText("Cannot divide by zero")).toBeInTheDocument();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("hides the second field for square root", async () => {
    const fetchFn = mockFetch(200, { result: 12 });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Square root/ }));
    expect(screen.queryByLabelText("Second number")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Number"), "144");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(await screen.findByRole("status")).toHaveTextContent("= 12");
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ operation: "sqrt", a: 144 });
  });

  it("shows backend errors", async () => {
    mockFetch(422, { error: "result is not a finite number" });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Power/ }));
    await user.type(screen.getByLabelText("First number"), "0");
    await user.type(screen.getByLabelText("Exponent"), "-1");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("result is not a finite number");
  });

  it("shows a friendly message when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("down")));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("First number"), "1");
    await user.type(screen.getByLabelText("Second number"), "1");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Cannot reach"));
  });

  it("clears the previous result when the input changes", async () => {
    mockFetch(200, { result: 2 });
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("First number"), "1");
    await user.type(screen.getByLabelText("Second number"), "1");
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(await screen.findByRole("status")).toBeInTheDocument();

    await user.type(screen.getByLabelText("First number"), "0");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("labels the percentage inputs clearly", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Percent of/ }));
    expect(screen.getByLabelText("Percent")).toBeInTheDocument();
    expect(screen.getByLabelText("Of (value)")).toBeInTheDocument();
  });
});
