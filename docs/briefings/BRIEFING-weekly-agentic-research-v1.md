# Standing Briefing — Weekly Agentic Research Round (v1)

Agent: Codex (scheduled cloud automation, weekly, with web access). This is a RECURRING briefing: every run follows it from scratch. It codifies the research method used in docs/research/ rounds 1–7. The deterministic source-watcher (GitHub Actions, see AMENDMENT-weekly-maintenance-sources-v1) handles change detection on known sources; THIS automation does open-ended research. Do not duplicate the watcher's job.

## 1. Goal

Find FH6 knowledge that is NEW relative to the repo's research corpus — community tuning insights, meta shifts, new guides/tools/sources, patch-driven changes — and deliver it as a research document plus concrete proposals. Never change engine values directly.

## 2. Method (mandatory, in this order)

1. **Load the corpus first.** Read docs/research/ (all files), BUILD_GUIDE_RESEARCH.md, and IN_GAME_VERIFIED.md before searching. Build a mental list of: known claims, open questions, resolved conflicts, downgraded sources (e.g. F.A.T.T.Y = forza.guide-derivative), and Jeff-verified facts (these outrank every web source).
2. **Work the open-questions list.** Start every round with the explicit open items (currently: HokiHoshi FH6 video claims, OPTN guide content, EV tuning sources, drift-branch community check D5, R-class definition, post-patch meta re-verification). Progress on an open item beats novelty.
3. **Then sweep for new signal.** Community first — Reddit (r/ForzaHorizon and related), Discords' public summaries, YouTube (Sepi, HokiHoshi, new channels), new guide sites, new open-source tools. Forums and community posts often carry more truth than polished guides, but also more noise: treat accordingly.
4. **Grade every claim.** Confidence labels are mandatory: confirmed (2+ independent sources), disputed (sources conflict — name both sides), single-source (unverified). Independence matters: check lineage before counting a source as independent (much of the FH6 ecosystem derives from forza.guide).
5. **Conflicts are findings, not problems.** When sources disagree, document both positions and propose how to resolve (telemetry test, Jeff in-game check, wait for more sources). Never average a conflict away.
6. **Respect the source policy.** Open/public sources may be mined; commercial databases and closed formulas (ForzaTune Pro internals, ForzaLabs data) may only be referenced as signal, never imported. Note provenance on everything.
7. **Dedupe ruthlessly.** A claim already in the corpus is only worth reporting if its confidence changed (new confirming/contradicting source) or a patch may have invalidated it.

## 3. Output (every run)

- `docs/research/WEEKLY_RESEARCH_<date>.md` — findings in the established format: per finding a claim, sources, confidence label, conflict status, and app impact (which engine rule, Build Guide item, or doc it touches). Dutch explanations, English game terms.
- Updates to the open-questions list: items progressed, closed, or newly added.
- If findings warrant action: a proposal section with concrete rule-diff sketches (no code changes) tagged Sprint-ready / needs-Jeff-validation / needs-more-sources.
- If a run finds nothing new: a three-line report saying so, with which queries were tried. No padding, no re-reporting known facts to look productive.
- Add a compact yield block: number of new claims, confidence changes, closed open questions, and concrete sprint proposals.
- Track low-yield runs. After two consecutive low-yield runs, mention that the next run will trigger a cadence review. After three consecutive low-yield runs, explicitly recommend changing the automation from weekly to monthly. Never change the schedule yourself.
- Commit as `[weekly-research] <date>` on a branch + PR labeled `research`, never direct to main.

## 4. Guardrails & stop rules

- NEVER edit src/, package files, or workflows. Research documents and the maintenance checklist only.
- NEVER present exploit meta as default advice; label it as in COMMUNITY_META_NOTES.
- NEVER overrule IN_GAME_VERIFIED facts with web claims — flag the contradiction instead.
- If a patch/release note mentions handling, tires, PI, drivetrain, or physics: top priority becomes re-verifying which corpus claims still hold; list each affected claim explicitly.
- If the round's findings would imply rewriting a whole engine branch, stop at a written proposal and flag for a human-supervised sprint.
- Budget: aim for a focused round (~the depth of one RESEARCH_ROUND document), not an endless crawl. Depth on open questions beats breadth.
