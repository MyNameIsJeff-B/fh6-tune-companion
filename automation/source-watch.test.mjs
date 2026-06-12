import test from "node:test";
import assert from "node:assert/strict";
import {
  extractOfficialCars,
  mergeCatalogRecords,
  normaliseHtml,
  renderIssue,
  runWatch,
} from "./source-watch.mjs";

test("cosmetische HTML-ruis verdwijnt uit de vergelijking", () => {
  const first = normaliseHtml("<nav>menu 1</nav><h1>Guide</h1><p>Race tires</p>");
  const second = normaliseHtml("<nav>menu 2</nav><h1>Guide</h1><p>Race tires</p>");
  assert.equal(first, second);
});

test("officiële auto-identiteit wordt zonder technische waarden gelezen", () => {
  const cars = extractOfficialCars(
    "<h4>2026 Example Motors Test Car</h4><p>Available June 18.</p>",
  );
  assert.deepEqual(cars, [
    { year: "2026", make: "Example", model: "Motors Test Car" },
  ]);
});

test("nieuwe officiële auto krijgt geen geschatte technische data", () => {
  const { catalog, added } = mergeCatalogRecords(
    { version: 7, cars: [] },
    [{ year: "2026", make: "Example", model: "Test Car" }],
  );
  assert.equal(added.length, 1);
  assert.deepEqual(catalog.cars[0], {
    year: "2026",
    make: "Example",
    model: "Test Car",
    dataStatus: "identity-only",
    provenance: ["forza-official-news"],
  });
  assert.equal("drive" in catalog.cars[0], false);
});

test("physicsmelding vraagt hard om een extra researchrun", () => {
  const issue = renderIssue({
    checkedAt: "2026-06-12T00:00:00.000Z",
    physicsResearchRequired: true,
    dataUpdates: [],
    reviewRequired: [{ sourceId: "forza-release-notes", summary: "physics" }],
    signals: [],
    unreachable: [],
  });
  assert.match(issue, /start extra researchrun/i);
  assert.match(issue, /COMMUNITY_META_NOTES/);
});

test("gesimuleerde signalen en een geblokkeerde supportbron breken de run niet", async () => {
  const report = await runWatch({
    dryRun: true,
    sourceIds: [
      "manteomax-fh6",
      "reddit-forzahorizon",
      "forza-release-notes",
      "forza-dataout-doc",
    ],
    fixtureResults: {
      "manteomax-fh6": { content: { found: true, evidence: ["fh6"] } },
      "reddit-forzahorizon": {
        content: [{ title: "FH6 tuning meta", link: "https://example.test/post" }],
      },
      "forza-release-notes": { content: { text: "physics balance", physicsKeywords: ["physics", "balance"] } },
      "forza-dataout-doc": new Error("HTTP 403"),
    },
  });
  assert.equal(
    report.reviewRequired.find((item) => item.sourceId === "manteomax-fh6")
      ?.priority,
    "high",
  );
  assert.equal(report.signals[0].items[0].title, "FH6 tuning meta");
  assert.equal(report.physicsResearchRequired, true);
  assert.equal(report.unreachable[0].sourceId, "forza-dataout-doc");
  assert.equal(report.unreachable[0].expected, true);
});

test("TuneLab-wijziging wordt als veilige data-update gerapporteerd", async () => {
  const report = await runWatch({
    dryRun: true,
    sourceIds: ["tunelab-releases"],
    fixtureResults: {
      "tunelab-releases": {
        content: { tag: "v1.8.0", dataHash: "changed" },
        data: { version: 8, updated: "2026-06-12", cars: [] },
      },
    },
  });
  assert.match(report.dataUpdates[0].summary, /TuneLab-data gewijzigd/);
});
