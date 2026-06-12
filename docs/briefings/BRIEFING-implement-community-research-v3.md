# Sprint Briefing — Implement Community Tuning Research (v3, supersedes v2)

Agent: Codex. Read `AGENTS.md` first, then `docs/research/COMMUNITY_META_NOTES.md` and `docs/research/CONFLICTS_AND_RECOMMENDATIONS.md`. Research is done; this sprint implements it. Forum archiving is dropped — knowledge is already extracted into the research docs.

## 1. Goal

Turn the accepted research recommendations into shipped, tested app behavior and updated source documentation.

## 2. Success criteria

- Brake balance: verified that higher % = front bias throughout engine, UI copy, and share text; an explicit "% front" direction label added where the value is shown/exported; one regression test asserting direction semantics.
- Build Guide: Road/Touge at A/S1 on light-powerful archetypes offers "Rally compound — PI-efficient alternative" as a labeled secondary option with one-line rationale plus a retune-pressure caveat; covered by a scenario test; `build-guide` version bumped.
- Tune result for road disciplines shows a clearly labeled, non-default community-meta note on low tire pressure (per CONFLICTS doc §2); does not alter computed values; covered by a test.
- Aero rules in `src/engine/improved.ts` reviewed against the new FH6 Aero Balance reality; if a rule still assumes the old max-front/min-rear meta, deliver a rule diff + test + engine version bump; if not, document the review outcome.
- `docs/BUILD_GUIDE_RESEARCH.md` updated with the new sources and the Mechanical Balance / Aero Balance findings; `maintenance_update_checklist.md` gains: ManteoMax FH6 sheets, F.A.T.T.Y changelog, Sepi FH6 video.
- Existing saved tunes untouched; lint, tests, Pages build green; live URL verified per AGENTS.md.

## 3. Constraints

- NIET DOEN: change default pressures, spring percentages, or ARB ranges (research validated current defaults); adopt exploit meta (max ride height, 1F/65R, one-wheel loading) anywhere in engine output; copy commercial formulas; silent rewrites of stored tunes; UI redesign.
- All advice-text additions in the app's existing tone and language conventions.

## 4. Stop rules

- If brake-balance semantics in the current engine turn out inverted, stop and report before fixing — that touches stored tunes.
- If the aero review implies changes to more than 2 rules, deliver the diff proposal only and ask.
- Ask before any new dependency.

## 5. Output

- Code + tests per above, committed as `[sprint-meta-1] implement community research recommendations`.
- Updated docs (BUILD_GUIDE_RESEARCH, maintenance checklist, PROJECT_HANDOFF status note).
- Short report: what shipped, what was reviewed-no-change, what still needs Jeff's in-game verification (transmission claim, front tire width magnitude, low-pressure telemetry test).
- Live Pages URL after deploy verification.
