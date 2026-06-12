import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DEFAULT_INPUT } from "../domain/defaults";
import { BuildGuide } from "./BuildGuide";

describe("BuildGuide UI", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          version: "test",
          source: "test",
          generated: "2026-06-11",
          profiles: [],
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows plan warnings and switches differential tiers exclusively", async () => {
    const input = {
      ...DEFAULT_INPUT,
      carClass: "C",
      pi: 600,
    };
    render(
      <BuildGuide input={input} onApply={vi.fn()} onManual={vi.fn()} />,
    );

    expect(
      screen.getByRole("region", { name: "Buildwaarschuwingen" }),
    ).toHaveTextContent(
      "Controleer in FH6 of de onderdelen beschikbaar zijn en wat ze werkelijk aan PI kosten.",
    );
    expect(screen.getByText(/Differential: accel/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Basis/ }));
    const sport = screen.getByLabelText(/Sport Differential/);
    const race = screen.getByLabelText(/Race Differential/);

    expect(sport).toBeChecked();
    expect(race).not.toBeChecked();
    expect(screen.getByText(/Ontgrendelt: Differential Acceleration/)).toBeVisible();

    fireEvent.click(race);

    expect(race).toBeChecked();
    expect(sport).not.toBeChecked();
    expect(screen.getByText(/Differential: full/)).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByText(/Generiek profiel actief/),
      ).toBeInTheDocument(),
    );
  });

  it("offers all PR Stunt types and shows technique guidance", async () => {
    render(
      <BuildGuide input={DEFAULT_INPUT} onApply={vi.fn()} onManual={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText(/Generiek profiel actief/)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "PR Stunt" }));

    expect(screen.getByRole("button", { name: /Speed Trap/ })).toHaveClass(
      "is-active",
    );
    expect(screen.getByRole("button", { name: /Danger Sign/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Trailblazer/ })).toBeVisible();
    expect(screen.getByText("Speed Trap-recept")).toBeVisible();
    expect(screen.getByText(/1-2 km run-up/)).toBeVisible();
  });
});
