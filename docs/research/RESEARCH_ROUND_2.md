# Research Round 2 — Telemetry, Provenance & Sources

Compiled: 11 June 2026 (Cowork). Extends FOUNDATION_AUDIT.md. Contains one audit correction, one provenance finding, the telemetry validation recipe, and source-landscape updates.

## Correction on audit item A4 (language)

The NL/EN mix is **intentional**: Jeff plays FH6 in English. Rule going forward: **explanations in Dutch, all game terms in English** (tire pressure, rebound, Race Brakes, Final Drive, seasons names, compound names, etc.). A4 is therefore narrower than the audit stated: the full-English explanation sentences in `improved.ts` ("Summer baseline uses slightly higher pressure to slow heat buildup", "Snow Tires are only appropriate when…") must become Dutch explanations that keep their English game terms. Existing Dutch strings should be checked the other way: translated game terms (e.g. "Veren", "Stabilisatorstangen", "Eindoverbrenging", "Bandenspanning" as labels) may stay as section labels if Jeff prefers, but new advice text follows the rule. Add the rule to AGENTS.md so every future agent applies it.

## Provenance finding — TuneLab contains decompiled ForzaTune Pro constants

TuneLab's own README states its frequency polynomial is "validated against ForzaTune Pro's decompiled constants" and that "physics constants [are] partially derived from ForzaTune Pro decompiled source (math formulas are not copyrightable)". Implications for us:

1. Our app never imported the PI-frequency polynomial (baseline.ts uses fixed slider percentages), so exposure is limited to the **damping ratios** (0.70/0.52 × 1.10) and possibly mode branch values traced from TuneLab's PHYSICS block.
2. The damping ratios themselves are generic public knowledge (every guide publishes "bump 50–70% of rebound"), so practical risk is low — but our project rule is explicit: no commercial-derived data. Replacing the damping model (audit A1) now also cleans the provenance. Document this in BUILD_GUIDE_RESEARCH's TuneLab entry.
3. Sprint B's own-derivation approach (weight-led, telemetry-validated) makes the app independent of this lineage entirely.

Related: Sepi's FH5 tuning spreadsheet (linked from his video) is the likely era-source of slider-percentage targets like ours. If our 88–92.5/69–73.5% targets trace to FH5-era sheets, that is one more reason A2 needs FH6 re-validation rather than trust.

## Sepi — "The Tuning Disaster of Racing Games" (25 May 2026, 14 min)

Meta-critique, no formulas. Claims relevant to us: accurate tuning info is scarce to non-existent; most tuning guides are repackaged real-car guides; most calculators are "scams"; public tunes are mostly clickbait; the only valid test is comparing lap times, not feel or placements; "realism is meaningless" — game physics is its own system. This independently validates the project's core philosophy (honest confidence, explainability, percentage approach, telemetry validation) and condemns exactly the pattern we found in A1 (real-world critical-damping math that cancels itself out — repackaged realism). Use as a north-star reference in PROJECT_HANDOFF's principles, not as a data source.

## F.A.T.T.Y — downgraded as independent source

Nexus mod page confirms: logic is "based on the publicly available forza.guide FH6 Tuning Cheat Sheet, cross-referenced against kboosting, forzafire, and gamingpromax", the app is "purely vibe-coded", download requires Nexus login, no public repo found. So F.A.T.T.Y is a *derivative* of sources we already use, not independent signal. Keep only its changelog corrections (rally diff 8/15 RWD, 10/8 AWD, rally final drive +0.50, circuit springs softer than road) as forza.guide-lineage data points; drop it as a cross-check authority. Upstream source to mine directly instead: the **forza.guide FH6 Tuning Cheat Sheet** itself, plus the **OPTN FH6 tuning guide** (confirmed: OPTN has FH6 setup formatters and an open Google-Docs tuning guide — genuinely independent, community-run, open-tune philosophy).

## Telemetry — validation recipe for Jeff's three sessions

Official Data Out (support.forza.net): one-way UDP at game frame rate, fixed single packet format (no format selector unlike Motorsport), localhost supported, settings under SETTINGS > HUD AND GAMEPLAY (Data Out on, IP, port). FH6 packet = Motorsport "Dash" layout **plus** CarGroup, SmashableVelDiff, SmashableMass (inserted after NumCylinders, before PositionX) and **minus** TireWear and TrackOrdinal. Fields cover speed, RPM, tire temps, slip, suspension travel, G-force — exactly what the A1/A2 validation needs.

Ready-made open tools (no logger to build):
- **viunow/fh6-telemetry** (GitHub): Node receiver, session manager with rewind handling, browser dashboard, full-session JSON export — best fit for capturing validation laps.
- **TheBanHammer/fh6-tel** (GitHub): dashboard + sessions.db + analysis charts with lap markers; includes per-corner temp/slip/suspension widgets.
- **Ojansen/co-driver** (GitHub): telemetry workspace with FH6-correct, build-aware auto-baseline calculator — interesting to compare its baseline against ours.

⚠ Known Windows gotcha (documented by co-driver): **start the listener before enabling Data Out**. If Forza streams to a port nobody is listening on, Windows' ICMP port-unreachable response permanently wedges Forza's Data Out socket — toggling Data Out won't fix it, only a full game restart. Put this in the validation session instructions.

Session recipe (feeds FORMULA_ANALYSIS validation plan): enable Data Out → 127.0.0.1 or LAN IP of the laptop running viunow/fh6-telemetry → drive 3 consistent laps per variant → export JSON → compare suspension-travel oscillation (A1), slider-position lap times (A2), tire temps at 1.1 vs 2.0 bar (C8 follow-up).

## Competitive landscape (context, not to copy)

fh6.tech: commercial telemetry auto-tuner (subscription) — solves springs/gearing/pressure/aero/diff/braking from user laps. ForzaLabs (labsgg): commercial; notable feature ideas — per-route surface split (road/dirt/snow %), elevation profile, banking/angle-rate analysis for tune targeting; also reads telemetry for exact gearing. FH6 TuneLab desktop (Nexus 186): separate desktop variant with live telemetry. Our niche remains: free, explainable, honest confidence, PWA, own validated rules. Track-data-aware tuning (surface split per event route) is a strong future feature candidate once core is validated.

## New maintenance-checklist items

forza.guide FH6 Tuning Cheat Sheet (direct mine + change watch) · OPTN FH6 tuning guide & setup formatter · viunow/fh6-telemetry and co-driver releases · Sepi channel for FH6 follow-ups · ManteoMax FH6 sheets (still pending).
