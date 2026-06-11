# Sprint Briefing — Weekly Source & Game-Update Watch (self-maintenance)

Agent: Codex · Date: 2026-06-11 · Size: medium
Read `AGENTS.md` first. This briefing is self-contained.

## 1. Goal

Build an automation that checks weekly whether FH6 game updates or new/changed tuning sources require app maintenance, and reports findings as a single actionable GitHub issue — so the owner never has to hunt for updates himself.

## 2. Success criteria

- Runs automatically every week without any manual trigger.
- Watches a versioned watchlist file (`automation/sources.json`) containing at minimum:
  - https://forza.net/news (game updates, car drops, series changes)
  - https://support.forza.net/hc/en-us/articles/51744149102611 (Data Out docs)
  - https://www.forzafire.com/guides/forza-horizon-6-platform-and-handling-tuning-guide and the other five FH6 ForzaFire guides (check "Last Updated" date)
  - https://forzatune.com/guide/the-fully-updated-forza-tuning-guide/
  - TuneLab GitHub releases (baseline dependency)
  - https://www.manteomax.com/ (FH6 spreadsheets — currently not yet published; flag when they appear)
- Detects *meaningful* change (content/date diff vs stored snapshot), not page noise.
- On change: opens **one** GitHub issue (Dutch summary: what changed, why it matters for the app, proposed action), tagging `@codex` so a follow-up task can be started from the issue itself.
- No change → no issue, no notification. Max one issue per week.
- Owner's total effort: read the issue, reply "doe maar" or close it.

## 3. Constraints

- Choose the simplest reliable mechanism and document the choice: (a) GitHub Actions cron + fetch/diff script in this repo, optionally with `openai/codex-action`, or (b) a Codex cloud scheduled Automation. Verify current Codex automation/trigger capabilities yourself before choosing.
- Snapshots and scripts live in the repo (`automation/`), excluded from the PWA build.
- **DO NOT:** scrape content behind logins or paywalls (ForzaLabs accounts etc.); copy data from commercial databases; auto-merge anything to `main`; modify app source code in this sprint; add backend/services that cost money.

## 4. Stop rules

- If GitHub Actions cannot reach a source (bot-blocking), log it in the issue as "manual check needed" — do not build workarounds.
- If weekly scheduling proves impossible on this repo/plan, stop and report options instead of building a degraded version.
- Ask before adding any repository secrets.

## 5. Output

- `automation/` directory: watchlist, fetch/diff script, snapshots, README (Dutch) explaining how to add/remove a source by editing one JSON entry.
- Workflow file (if Actions-based) under `.github/workflows/`.
- Proof: one manually triggered test run with a real diff-detection and a sample issue.
- Report: update `docs/PROJECT_HANDOFF.md` (status + known limitations) and list executed checks per `AGENTS.md`.
