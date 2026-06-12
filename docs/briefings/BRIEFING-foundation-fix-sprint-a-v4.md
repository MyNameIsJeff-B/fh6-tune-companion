# Sprint Briefing — Foundation Fix Sprint A (v4, supersedes v2 & v3)

Agent: Codex. Read `AGENTS.md`, then `docs/research/FOUNDATION_AUDIT.md` (master list), with FORMULA_ANALYSIS.md, CONFLICTS_AND_RECOMMENDATIONS.md and COMMUNITY_META_NOTES.md as detail references. All research and decisions are done — this sprint implements Sprint A exactly as specified in the audit's Sequencing section.

## 1. Goal

Fix every P0/P1 foundation error that needs no in-game validation, so the knowledge layer is trustworthy before further feature work.

## 2. Success criteria (audit item IDs)

- A3: damping warning no longer claims weight-dependence it doesn't have (reword; A1 lands later in Sprint B).
- A4: every user-facing engine string (corrections, warnings, tips) is Dutch; add a test that scans engine output for the known English strings.
- B1: Race Brakes "recommend" for Road race builds at A-class and above; test updated.
- B2: winter handling — pressure delta −0.10 bar (metric) with imperial equivalent, Winter guidance text covers cold-tarmac grip loss (longer braking first laps, compound must reach temperature); summer unchanged; tests for both seasons.
- B3: final-drive calculation uses redline × 0.97; existing gearing test updated, new test asserts top gear no longer sits exactly on redline.
- B4: road front toe default 0.0°; rear stability behavior unchanged; test added.
- B5: regression test asserting brake-balance direction (higher % = front) plus "% voor" label present in share/export text.
- C3: Build Guide warning when targetClass ≥2 classes above the car's native class.
- C5: dirt-penalty line added to rally/off-road tire detail + sources entry.
- C6: code comment at CLASS_CAPS documenting the R-class ambiguity + add to maintenance checklist as in-game verification item.
- C8: labeled informational low-pressure community-meta note on Road tune results; computed values unchanged; test asserts values unchanged.
- Docs: BUILD_GUIDE_RESEARCH.md gains the new sources (forum 832103, Apex Speed Craft, F.A.T.T.Y, EZG winter test, gamingpromax mechanical/aero balance); PROJECT_HANDOFF status updated; maintenance checklist gains ManteoMax FH6 sheets, F.A.T.T.Y changelog, Sepi FH6 video, R-class verification.
- ENGINE_VERSION and BUILD_GUIDE_VERSION bumped; every changed value carries a correction/warning text naming its source; all tests green; Pages deploy verified per AGENTS.md.

## 3. Constraints

- NIET DOEN: anything from Sprint B (A1 damping rewrite, A2 spring targets, C1 rally-road compound, C2 width priority, C4 aero rules, C7 Wangan branch) — those wait for Jeff's validation sessions; exploit meta in engine output; changes to stored tunes; UI redesign; new dependencies without asking.
- Where the audit gives exact values (0.97, −0.10 bar), use them; where it gives intent, match existing code style and tone.

## 4. Stop rules

- If brake-balance semantics anywhere in the codebase turn out inverted relative to "higher % = front", stop and report before fixing.
- If a success criterion conflicts with an existing test's intent, report the conflict instead of deleting the test.

## 5. Output

- Code + tests, committed as `[sprint-foundation-a] fix P0/P1 knowledge-layer errors per FOUNDATION_AUDIT`.
- Updated docs as above.
- Short report: per audit ID — done/blocked/notes; list of everything now waiting on Jeff's three validation sessions (FORMULA_ANALYSIS, Validation plan).
- Live Pages URL after deploy verification.
