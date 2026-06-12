import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

describe("App revision workflow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("scrollTo", vi.fn());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ version: 1, cars: [] }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires test context and exposes the saved revision history", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Handmatig invoeren" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Verder naar doel" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Bereken tune" }));
    fireEvent.click(screen.getByRole("button", { name: "Diagnose" }));

    const diagnosis = screen.getByRole("button", { name: /Power-overstuur/ });
    expect(diagnosis).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Testlocatie"), {
      target: { value: "Horizon Mexico Circuit" },
    });
    fireEvent.change(screen.getByLabelText("Testritnotitie"), {
      target: { value: "Onrustig bij het uitkomen van bocht 7." },
    });

    expect(diagnosis).toBeEnabled();
    fireEvent.click(diagnosis);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Historie (2)" }),
      ).toBeVisible(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Historie (2)" }));

    expect(screen.getByRole("dialog", { name: "Tunegeschiedenis" })).toHaveTextContent(
      "2 revisies",
    );
    expect(screen.getByText("Power-overstuur")).toBeVisible();
    expect(screen.getByText(/Horizon Mexico Circuit · 3 ronden/)).toBeVisible();
    expect(
      screen.getByText(/Onrustig bij het uitkomen van bocht 7/),
    ).toBeVisible();
    expect(screen.getByText("Basisadvies")).toBeVisible();
  });

  it("shows concrete mobile installation instructions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<App />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "Menu openen" }));

    expect(screen.getByText("Installeer op je telefoon")).toBeVisible();
    expect(screen.getByText(/open in Safari/)).toBeVisible();
    expect(screen.getByText(/Android: open het Chrome-menu/)).toBeVisible();
  });
});
