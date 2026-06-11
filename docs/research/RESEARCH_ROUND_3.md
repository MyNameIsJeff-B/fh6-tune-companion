# Research Round 3 — forza.guide Cheat Sheet Deep-Dive

Compiled: 11 June 2026 (Cowork). Source: full fetch of the forza.guide FH6 Tuning Guide (the upstream source most FH6 tools derive from). Contains two NEW errors found in our app, one ready-to-adopt damping formula, and a Sprint A addendum at the bottom.

## NEW ERROR 1 — Bump/rebound ratio is wrong, and contradicts our own tip

Our engine outputs bump at ~74% of rebound (bumpRatio 0.52×1.1 vs reboundRatio 0.70×1.1). Every source puts the ceiling lower: forza.guide "bump should be 30–55% of rebound, most cars ~40%"; TuneLab's own AI prompt says 30–55%; Apex says 55–65%. No source supports 74%. Worse: our own tip text says "Bump hoort duidelijk lager te blijven dan rebound" while the values barely differ. Internal inconsistency + unanimous external disagreement = fix now. Conservative Sprint A correction: set bump = 0.50 × rebound (inside every source's range); Sprint B replaces the whole model (below).

## NEW ERROR 2 — Rear toe sign is ambiguous and possibly inverted

forza.guide writes rear stability as toe-IN expressed as a NEGATIVE slider value ("RWD snaps loose → add −0.1 to −0.2° rear toe-in") and its cheat table says rear toe-in (increasing) = rear stability. Our engine outputs rear toe **+0.1/+0.2** for road, and the stability feel rule pushes it to ≥ +0.1 — if the FH6 slider follows the positive-is-toe-out convention, we are dialing in rear toe-OUT, which *destabilises*: the exact opposite of the intent. TuneLab writes "add 0.1° toe-in" as a positive number, so the lineage is contaminated by notation ambiguity. Resolution: one in-game screenshot of the FH6 alignment screen settles the sign convention. Until then, rear toe default 0.0 (consistent with front toe decision B4) and the stability rule paused.

## Ready to adopt — forza.guide damping formula (replaces A1 proposal)

The cheat sheet gives a concrete, public, FH6-specific, weight-led method — better than my earlier sketch, adopt this for Sprint B:

- **Front bump** = MinBump + (FrontWeight / 200 lb) × 0.1, where FrontWeight = TotalWeight × frontPct + front downforce. MinBump by car type: street/sports/race 4.4–5.0; utility/race truck 5.0–5.2; rally/off-road 1.0 (slider floor — and do NOT derive rebound from ÷0.4 off-road; firm front-biased rebound by feel).
- **Front rebound** = Front bump ÷ 0.4 (landing zone 12–16 for typical road cars).
- **Rear dampers** = front values, both bump and rebound shifted toward whichever end has the stiffer springs.

Sanity check vs current engine: a 1,360 kg / 55%-front road car gets bump ≈ 5.2, rebound ≈ 13 under this formula; our engine currently outputs rebound ≈ 7.7–8.5 for *every* car. So we are not only weight-blind — our rebound level is roughly half of what the FH6-specific source recommends. This makes the A1/A2 telemetry validation sessions even more decisive.

## ARB methodology conflict — revise "validated as-is"

FOUNDATION_AUDIT marked our conservative ARB bands as validated (ForzaFire 25–45 typical). forza.guide teaches the opposite workflow: **max both ARBs, then soften the problem end until the in-game Mechanical Balance readout sits at 0.55–0.65 (sweet spot ~0.60)**; high-power RWD drops the rear below the front; off-road/rally starts near minimum instead (our rally branch already does this ✓). Two legitimate philosophies — conservative bands (predictable, beginner-safe) vs max-and-soften (faster ceiling, uses the new FH6 stat). Decision: keep our bands as computed values, but add the Mechanical Balance window (0.55–0.65, ~0.60) as a verification tip on the ARB section — it is a concrete in-game number the user can check, fully aligned with our explainability principle. Revisit defaults after Jeff's sessions.

## Smaller confirmations & gaps

- **Pressure bands by compound** (psi): Slick 28–32.5 · Semi-Slick 27–29.5 · Stock/Street/Rally 24–26.5 · Off-Road 15.5–21. Our road/slick/street values land inside their bands ✓. Gap: our Off-Road compound lands ~21–24.7 psi depending on surface — at or above the top of the 15.5–21 band. Lower the Off-Road compound delta so loose-surface builds land mid-band (~17–19 psi / 1.2–1.3 bar). Note rally compound belongs in the *street* pressure band per this source (ForzaFire's 2.0 bar agrees), not the off-road band.
- **Camber**: start 0 to −1.0 both ends, front slightly more negative; needing more than −2.0 front → raise caster instead. Our −1.5/−1.0 road defaults are slightly aggressive but inside reason; add the "caster before more camber" tip.
- **Caster**: 6.5–7.0, most cars near max 7 ✓ (our road value). Gap: off-road buggies/race trucks want ~2.0 — our rally branch keeps 7. Profile-gated fix (cross_country preset → low caster).
- **Gearing**: final-drive-only is the default workflow; individual ratios usually stay stock; 8+ factory gears → leave transmission stock; top gear sized to highest speed actually reached +10–20 mph headroom (slipstream margin); RWD: slightly longer low gears for throttle control. Our geometric progression matches their "logarithmic curve" ✓; the 0.97 limiter margin (B3) is consistent ✓. Add the FD-only note + 8-gear rule to Build Guide transmission advice.
- **Mechanical Balance window 0.55–0.65** is the second concrete use of the new FH6 stat (after ARB) — also useful in the diagnosis flow ("check Mechanical Balance after applying this fix").
- forza.guide's fix-it cards match our diagnosis engine's directions everywhere they overlap ✓ (entry/mid/exit understeer & oversteer, wheelspin, bouncy) — plus richer levers (caster for entry understeer, ride height options) worth importing into the diagnosis layer later (P2).

## SPRINT A ADDENDUM (Codex: apply on top of briefing v4.1)

Two extra success criteria, same constraints and output rules:

- **A5 (new):** bump damping ratio corrected so bump = 0.50 × rebound on road modes (rally/drift branch ratios scaled to preserve their current relative softness); tip text and values now consistent; test asserts bump/rebound ≤ 0.55 on road modes. Source: forza.guide 30–55% rule + TuneLab prompt + Apex (all ≤65%).
- **A6 (new):** rear toe road default 0.0; the feelStability rear-toe rule is disabled pending sign verification (keep the ARB part of that rule); warning text explains rear toe awaits in-game sign confirmation; test updated. Source: forza.guide sign convention vs our +0.1 output (RESEARCH_ROUND_3, New Error 2).
- Maintenance checklist: add "FH6 alignment screen screenshot — confirm toe sign convention" as Jeff verification item.
