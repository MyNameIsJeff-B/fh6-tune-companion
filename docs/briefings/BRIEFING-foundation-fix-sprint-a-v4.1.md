# Sprint Briefing — Foundation Fix Sprint A (v4.1, supersedes v4)

Agent: Codex. Read `AGENTS.md`, then `docs/research/FOUNDATION_AUDIT.md` (master list) and `docs/research/RESEARCH_ROUND_2.md` (contains an amendment to audit item A4 and a provenance note). Detail references: FORMULA_ANALYSIS.md, CONFLICTS_AND_RECOMMENDATIONS.md, COMMUNITY_META_NOTES.md. All research and decisions are done — implement Sprint A exactly as specified.

Only change vs v4: criterion A4 reworded per RESEARCH_ROUND_2, plus two doc tasks added (language rule in AGENTS.md, TuneLab provenance note).

## 1. Goal

Fix every P0/P1 foundation error that needs no in-game validation, so the knowledge layer is trustworthy before further feature work.

## 2. Success criteria (audit item IDs)

- A3: damping warning no longer claims weight-dependence it doesn't have (reword; A1 lands in Sprint B).
- A4 (amended): all user-facing advice/warning/correction text uses **Dutch explanations with English game terms** (tire pressure, rebound, Race Brakes, Final Drive, compound names, season names). The full-English sentences in `improved.ts` are rewritten to this rule. Add the language rule to AGENTS.md so future agents apply it. Add a test guarding against the known full-English strings.
- B1: Race Brakes "recommend" for Road race builds at A-class and above; test updated.
- B2: winter handling — pressure delta −0.10 bar (metric) with imperial equivalent; Winter guidance covers cold-tarmac grip loss (colder tire temps, longer braking first laps, compound must reach temperature); summer unchanged; tests for both seasons.
- B3: final-drive calculation uses redline × 0.97; gearing tests updated; new test asserts top gear no longer sits exactly on redline.
- B4: road front toe default 0.0°; rear stability behavior unchanged; test added.
- B5: regression test asserting brake-balance direction (higher % = front) plus "% voor"/"% front" label present in share/export text.
- C3: Build Guide warning when targetClass is ≥2 classes above the car's native class.
- C5: dirt-penalty line added to rally/off-road tire detail + sources entry.
- C6: code comment at CLASS_CAPS documenting the R-class ambiguity + maintenance-checklist item for in-game verification.
- C8: labeled informational low-pressure community-meta note on Road tune results; computed values unchanged; test asserts values unchanged.
- Docs: BUILD_GUIDE_RESEARCH.md gains the new sources (forum 832103, Apex Speed Craft, EZG winter test, gamingpromax mechanical/aero balance, forza.guide cheat sheet, OPTN FH6 guide, official Data Out documentation) **and** a provenance note on TuneLab's decompiled-ForzaTune-Pro lineage per RESEARCH_ROUND_2 (our exposure: damping ratios; resolved by Sprint B). F.A.T.T.Y is recorded as forza.guide-derivative, not an independent source. PROJECT_HANDOFF status updated. Maintenance checklist gains the items listed at the end of RESEARCH_ROUND_2.
- ENGINE_VERSION and BUILD_GUIDE_VERSION bumped; every changed value carries a correction/warning naming its source; all tests green; Pages deploy verified per AGENTS.md.

## 3. Constraints

- NIET DOEN: anything from Sprint B (A1 damping rewrite, A2 spring targets, C1 rally-road compound, C2 width priority, C4 aero rules, C7 Wangan branch) — those wait for Jeff's telemetry validation sessions (recipe in RESEARCH_ROUND_2); exploit meta in engine output; changes to stored tunes; UI redesign; new dependencies without asking.
- Where the audit gives exact values (0.97, −0.10 bar), use them; otherwise match existing code style and tone.

## 4. Stop rules

- If brake-balance semantics anywhere turn out inverted relative to "higher % = front", stop and report before fixing.
- If a success criterion conflicts with an existing test's intent, report the conflict instead of deleting the test.

## 5. Output

- Code + tests, committed as `[sprint-foundation-a] fix P0/P1 knowledge-layer errors per FOUNDATION_AUDIT`.
- Updated docs as above.
- Short report: per audit ID — done/blocked/notes; list of everything waiting on Jeff's validation sessions.
- Live Pages URL after deploy verification.
