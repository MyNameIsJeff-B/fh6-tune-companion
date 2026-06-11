# Sprint Briefing — Community Tuning Research & Knowledge Hardening

Agent: Codex. Read `AGENTS.md` first. This is a research-first sprint: gather, verify, document. Engine changes only where explicitly allowed below.

## 1. Goal

Harden the FH6 knowledge layer with community-sourced tuning intelligence (forums, Reddit, open tools), resolve three known conflicts, and archive critical forum content before forums.forza.net shuts down.

## 2. Success criteria

- All FH6 tuning/physics threads worth keeping from forums.forza.net are saved as HTML/Markdown under `docs/research/forum-archive/` with URL + capture date. Start with thread 832103 ("FH6: The Physics of Tuning"). The forums close soon; treat this as the highest-priority task of the sprint.
- A new `docs/research/COMMUNITY_META_NOTES.md` documents the competitive/exploit meta separately from clean-tune guidance, each claim labeled: source, date, confidence (confirmed / disputed / single-source), and whether it conflicts with current app rules.
- Three conflicts investigated and written up with a recommendation: (a) tire pressure: ~1.1 bar forum meta vs 1.8–2.0 bar guide advice; (b) brake balance semantics: confirm whether the FH6 slider percentage means front or rear (community posts contradict each other); (c) rally tire compound on tarmac S1 builds as a legitimate labeled alternative to race compounds.
- `docs/BUILD_GUIDE_RESEARCH.md` updated with new sources: forums thread 832103, Apex Speed Craft tuning reference (Apr/May 2026), F.A.T.T.Y (Nexus mod 113, open source — cross-check its audited goal profiles against our improved.ts rules), forza.guide spring slider-position method (validates our percentage approach — note this), ManteoMax FH6 status (sheets not yet published; add to maintenance checklist).
- Any proposed rule change delivered as a written diff proposal in `docs/research/`, each with a scenario test sketch. No silent engine edits.

## 3. Constraints

- NIET DOEN: change `src/engine/*` values without an accompanying test and engine version bump proposal; copy commercial databases (ForzaLabs, ForzaTune Pro formulas); treat exploit meta as default advice; scrape behind logins; touch the live PWA or service worker.
- Exploit meta may only ever surface in the app as clearly labeled optional context — this sprint documents it, does not ship it.

## 4. Stop rules

- If forums.forza.net is already offline, check archive.org, save what exists, and log the gap.
- If a conflict cannot be resolved from public sources, mark it "needs in-game verification by user" and list the exact screenshot/telemetry needed.
- Ask before adding any new runtime dependency.

## 5. Output

- `docs/research/forum-archive/` (raw captures + index file)
- `docs/research/COMMUNITY_META_NOTES.md`
- `docs/research/CONFLICTS_AND_RECOMMENDATIONS.md`
- Updated `docs/BUILD_GUIDE_RESEARCH.md` and `maintenance_update_checklist.md`
- Short report: what was archived, what changed, what needs Jeff's in-game verification. Commit as `[sprint-research] community tuning research + forum archive`. No Pages deploy needed this sprint.

---

## Annex — research leads (verified 11 June 2026 by Cowork)

**Forum thread 832103 key claims (competitive tuner, 30 May 2026):** max ride height with front slightly higher exploits an engine quirk; body roll concentrated on one wheel improves traction; AWD preferred due to wheel-slip modeling; rally/offroad transmission allegedly faster at equal ratios; rally compound viable on tarmac S1; tire pressure rarely above 1.1 bar; soft-front/stiff-rear ARB extremes; diff baseline 75–90% accel / 6–12% decel; toe-out <1° effective; default camber often fine. All of this is exploit-meta flavored — verify and label, don't adopt.

**Apex Speed Craft reference (May 2026):** brake balance bug from previous titles fixed in FH6, slider works as labeled, 51–53% front advised; 1F/65R ARB exploit dominant in competitive AWD lobbies; spring absolute values floored above realistic rates — tune ratios, not real-world numbers.

**F.A.T.T.Y (nexusmods.com/forzahorizon6/mods/113):** open tuning tool, goal profiles audited against forza.guide / kboosting / forzafire / gamingpromax. Notable corrections: rally RWD diff 8% accel / 15% decel (was 40/8), rally AWD 10/8, rally final drive +0.50 over road, circuit springs slightly softer than road baseline, front downforce clamped to slider minimum. Cross-check against our improved rules.

**forza.guide:** FH6-specific, has Reddit feedback thread; spring advice in slider position (⅓–½ up the range, heavier end higher; rally/off-road near soft end, balance via diff + dampers) — independently validates our percentage-of-range model. Off-road ARBs near minimum.

**ForzaFire tires guide:** rally tires 2.0 bar for mixed online; race slicks on dirt slower due to PI penalty; stock pressure invalid after compound change.

**Open items to monitor:** ManteoMax FH6 sheets (not yet live), Sepi's FH6 video "The Tuning Disaster of Racing Games" (summarize claims), QuickTune Pro FH6 support status, OPTN Club FH6 data.
