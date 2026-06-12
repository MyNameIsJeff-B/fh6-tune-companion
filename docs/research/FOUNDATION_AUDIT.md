# FH6 Tune Companion — Foundation Audit

Compiled: 11 June 2026 (Cowork). Full audit of the knowledge layer: tune engine, build guide, seasons, data, class system, tests. Supersedes nothing; FORMULA_ANALYSIS.md, COMMUNITY_META_NOTES.md and CONFLICTS_AND_RECOMMENDATIONS.md remain the detail documents. This is the master list: every found error, verdict, and fix, prioritised.

Test status at audit time: 56/56 passing (engine 24, build-guide 26, profiles 4, storage 2). Build quality is fine — every issue below is knowledge-layer, not code-quality.

---

## P0 — foundation errors (fix before building anything else)

**A1. Damping is weight-independent and front/rear identical.** TuneLab's critical-damping math cancels itself out in its own slider normalisation; output = ratio × 10 for every car. Our baseline reproduces that. A Peel and an SUV get identical damping; front always equals rear. Detail + proposed per-axle weight-led formula: FORMULA_ANALYSIS F1. Requires Jeff validation before promoting; ship as experimental rule.

**A2. Spring slider targets likely too stiff and wrongly ordered.** Current 88–92.5% front / 69–73.5% rear vs FH6 community ⅓–½ of range with the heavier end higher; both captured community tunes (mid-engine) run front softer than rear. Detail + proposed weight-led targets: FORMULA_ANALYSIS F2. Ship as labeled alternative, A/B by Jeff decides default.

**A3. Misleading warning.** "Gewicht ontbreekt: demping is minder betrouwbaar" — weight is never used in the damping formula. Either implement A1 (making the warning true) or reword. Confidence theater contradicts the project's own honesty principle.

**A4. Mixed-language output.** `improved.ts` emits English corrections/warnings ("Summer baseline uses slightly higher pressure…", "Snow Tires are only appropriate…") between Dutch ones. All user-facing engine strings must be Dutch. Pure consistency fix, zero risk.

## P1 — wrong or outdated advice (fix in the same sprint)

**B1. Race Brakes underweighted for FH6.** Currently "recommend" only at S1+/control-focus/profile-required. FH6 evidence: stock brakes cause lockup and instability on touge/Tokyo streets; brakes and front tire width move the needle significantly more than in previous titles; race brakes are the standard for A-class and higher road builds (ForzaFire + gamingpromax). Fix: promote Race Brakes to "recommend" for Road race builds at A and above.

**B2. Winter is treated as "snow events only" — but winter measurably reduces tarmac grip.** Controlled community test (EZG, Series 1 Winter): same car, same track — summer tire temps 100°F+, winter temps dropped to the 70s°F or lower, costing 0.4 s/lap through reduced mechanical grip. Current seasonal pressure delta (−0.05 bar winter) has the correct direction but the guidance text ignores cold-tarmac grip entirely. Fix: (a) winter delta to −0.10 bar metric to help tires build temperature; (b) seasons.ts Winter guidance + engine warning: cold tires = less grip on dry tarmac too, expect longer braking distances first laps; (c) winter compound note: a compound that actually reaches temperature can beat a theoretically grippier one. Summer logic (+0.05) validated, keep.

**B3. Gearing aims exactly at the limiter.** Final-drive math is dimensionally correct but sizes top gear to hit redline exactly at top speed. Fix: calculate with redline × 0.97 (ForzaTune's documented margin method). FORMULA_ANALYSIS F3.

**B4. Front toe conflicts with Jeff's own verified FH6 finding.** App road default −0.1°; Jeff's cross-project rule: toe is buggy in FH6, keep 0.0. Fix: road front toe default 0.0; rear stability response (+0.1 at high feelStability) stays. FORMULA_ANALYSIS F4.

**B5. Brake balance direction must be locked in.** Confirmed: FH6 slider fixed, higher % = more front bias, 50% = equal. Engine already outputs "% voor" — correct. Fix: add a regression test asserting direction semantics + keep the explicit label in share/export text. (CONFLICTS §1.)

## P2 — improvements & gaps (next sprint, lower risk)

**C1. Rally compound as labeled road alternative.** Confirmed legitimate PI-efficiency play at A/S1 on light-powerful cars (forum meta + forza.guide + ForzaFire "acceptable on tarmac, the all-around choice for mixed lobbies"). Add as optional labeled upgrade in tireChoice for Road race A/S1, gated on power-to-weight, with retune-pressure caveat. (CONFLICTS §3.)

**C2. Front tire width priority.** FH6 buffed front-width grip effect; one of the most PI-efficient investments. Current width logic (driven axle first) stays, but: promote the secondary front-width option for RWD road race at A+ from grip-focus-only to a general "recommend"-candidate, and mention the FH6 buff in the detail text.

**C3. Class-jump warning.** Community principle with test backing: a car barely tuned into a class loses to native cars of that class; stay within 1–2 classes of original. Build Guide currently allows any jump silently. Fix: warning when targetClass is ≥2 classes above the car's native class.

**C4. Aero advice is passthrough + pre-Aero-Balance.** Tune engine echoes input aero values without advice; texts still imply the old rear-biased thinking. FH6 introduced an Aero Balance stat and killed the max-front/min-rear meta. Fix: review the two aero detail texts; add a tune-result tip referencing the in-game Aero Balance stat as verification aid. No numeric rules until telemetry.

**C5. FH6 dirt penalty note.** FH6 penalises Race Slicks (and lesser extent Sport/Semi-Slick) on dirt harder than FH5 — supports existing compound logic; add one line to the rally/off-road tire detail and the sources file.

**C6. Afgehandeld op 12 juni 2026.** De officiële FH6-carlist bevestigt via
aangrenzende voorbeelden dat S2 eindigt op 900, R begint op 901 en R eindigt op
998. De app gebruikt niet langer de voorlopige S2 998/R 999-grens.

**C7. Wangan mode has no own engine branch.** Listed in TUNE_MODES but falls through to road defaults. TuneLab has Wangan freqMult (f 1.04 / r 0.97) and the mode implies gearing/aero emphasis. Low priority: either give Wangan a minimal branch (slightly stiffer front, top-speed-biased gearing note) or document that it intentionally equals Race for now.

**C8. Low-pressure meta note.** Per CONFLICTS §2: labeled informational note on road tune results; defaults unchanged.

## Validated — explicitly checked, no change needed

Road ARB ranges (conservative ForzaFire bands) · AWD center diff 70–78% rear (Apex 70–75; early community meta ~70/30 rear split agrees) · brake balance baseline values (50–56% front band matches all guides) · drag/drift/rally/rain branch values (match TuneLab line-for-line) · camber/caster defaults · diagnosis-engine direction logic (soften the problem end) · percent-of-range spring philosophy as such (forza.guide slider-position method; TuneLab's own FORZA_SCALE=9 TODO confirms absolute values are unreliable) · geometric gear progression · seasonal pressure direction · officiële FH6 PI-caps D400/C500/B600/A700/S1 800/S2 900/R998 · Build Guide stage ordering incl. discipline overrides · profile matching logic (normalisation incl. Forza/Touge Edition suffixes).

## Sequencing

Sprint A (no in-game data needed): A3, A4, B1, B2, B3, B4, B5, C3, C5, C6-comment, C8 — plus docs updates. Sprint B (experimental rules + Jeff's 3 validation sessions per FORMULA_ANALYSIS): A1, A2, C1, C2, C4, C7. Every changed value: rule diff, test, engine/build-guide version bump, correction text naming the source.
