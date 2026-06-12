# FH6 Formula Analysis — engine vs TuneLab vs community

Compiled: 11 June 2026 (Cowork). Method: line-level comparison of `src/engine/baseline.ts` / `improved.ts` / `diagnosis.ts` against TuneLab source (`super-android/tunelab`, App.jsx physics block) and FH6 community sources (forza.guide, Grindout, ForzaFire, Apex Speed Craft, forum thread 832103 example tunes).

Verdicts are proposals. Nothing changes in the engine without Jeff's in-game validation + tests + version bump.

## F1 — Damping collapses to a constant. Biggest finding.

TuneLab builds a full critical-damping apparatus (`critDamp = 2√(K·m)` per axle) and then normalizes the slider value *against the same critical damping*:

```
mapDampF(critDampF × rebRatio) = rebRatio × 10 × dampMod
```

The physics cancels out. TuneLab's damping output is `ratio × 10 × multiplier` for every car — identical front and rear, independent of weight, springs, or distribution. Our `baseline.ts` reproduces exactly this effective behavior (`reboundRatio * 10 * responseMod`), so the import is faithful — but faithful to decorative math.

Consequences in our app today: `reboundFront === reboundRear` and `bumpFront === bumpRear` always; a 600 kg Peel and a 2,600 kg SUV get the same damping; the warning "Gewicht ontbreekt: demping is minder betrouwbaar" is misleading because weight is never used.

This is only correct if FH6's 1–20 damper slider is internally normalized per car (like the spring slider ranges are). No source confirms that. The classic FH5 community method (justLou72/Sepi lineage) is weight-distribution-led: `rebound_axle ≈ 20 × axleWeight% × factor`, `bump ≈ 0.5–0.6 × rebound` — front ≠ rear.

**Proposal (experimental rule, engine bump):** per-axle damping from weight distribution: `reboundF = clamp(20 × frontPct × k_mode, 1, 20)`, `reboundR = clamp(20 × rearPct × k_mode, 1, 20)`, `bump = 0.55 × rebound` road / `0.42×` rally, with `k_mode` calibrated so a 50/50 road car lands near the current output (continuity). Validate via telemetry suspension oscillation before promoting from experimental.

## F2 — Spring slider targets conflict with FH6 community. Test first.

Current targets: front 88–92.5% / rear 69–73.5% of slider range (FWD swapped). Two problems:

1. **Level.** forza.guide (FH6-specific): springs at ⅓–½ of slider range. Grindout: "balanced, mildly soft setups are winning in current FH6 testing." Our targets sit at 69–92.5% — far stiffer.
2. **Ordering.** Targets ignore weight distribution except the FWD swap. forza.guide: "heavier end a little higher." Both complete community tunes captured from forum thread 832103 (mid-engine Huracán, two independent users) run front springs clearly softer than rear — our model gives every RWD/AWD car a much stiffer front position, which is backwards for mid/rear-engined cars.

Note: percent-of-range ≠ absolute stiffness (Forza scales each axle's range to corner weight — forza.guide confirms, and this validates our percentage model as such). But the *positions* and *ordering* are in question.

**Proposal:** weight-led targets: base position 40% of range; heavier axle `+min(15, (heavyPct−50)×1.2)` pp; lighter axle `−` the same; multiply front/rear by the TuneLab `freqMult` f/r ratio per mode to keep discipline skew (Race f1.10/r1.01 etc.). Ship as a labeled "balanced (community)" alternative next to the current "stiff (legacy)" targets; A/B by Jeff decides the default.

## F3 — Gearing: sound, add limiter margin.

The final-drive math (`redline × circumference` vs top speed) checks out dimensionally and the geometric gear progression matches the community "logarithmic curve" guidance. One gap: top gear is sized to hit redline exactly at top speed → limiter-bouncing. ForzaTune's documented method (already a project source): subtract 100–200 RPM. **Proposal:** use `redline × 0.97` in the final-drive calculation. Small, safe, testable.

## F4 — Toe: three-way conflict, default to 0.0.

App: front −0.1°, rear +0.1/0.2° on road. Jeff's verified cross-project finding: toe is buggy in FH6 → keep 0.0 unless a specific residual problem requires it. Forum: small front toe-out helps when balance is right (exploit-meta context). **Proposal:** road default front toe 0.0; rear toe stays a stability-feel response only (improved.ts already does `Math.max(v, 0.1)` on high stability — keep, it's deliberate); document toe-out as a diagnosis-layer option, never a default.

## F5 — TuneLab provenance worth keeping.

`baseFreq = 7.35e-7 × (PI−100)² + 2.65 Hz` with per-mode f/r multipliers; TuneLab claims May 2026 telemetry validation of the multipliers (suspension std-dev targeting). The f/r *ratios* are the most defensible part — reuse them in F2. TuneLab's `FORZA_SCALE = 9.0` for kgf/mm display (with a TODO admitting it needs telemetry validation) independently confirms why our percent-of-range approach is the right call: absolute spring numbers in Forza are unreliable.

## F6 — Validated as-is, no change.

Road ARB ranges (conservative ForzaFire bands), AWD center diff 70–78% rear (Apex: 70–75 neutral), brake balance direction (higher % = front, slider fixed in FH6), drag/drift/rally branch values (match TuneLab line-for-line), camber/caster defaults, diagnosis-engine direction logic (soften the problem end first — consistent with all sources).

## Validation plan (Jeff, ~3 test sessions)

1. **Springs A/B** — one front-heavy FWD, one ~50/50 RWD, one mid-engine RWD. Same build, run current targets vs F2 balanced targets, 3 consistent laps each, note lap time + turn-in feel. This decides the default.
2. **Damping** — same cars, current constant damping vs F1 weight-led values; telemetry: does the car stop oscillating after one compression?
3. **Toe** — front 0.0 vs −0.1 on the RWD car only; if no measurable difference, F4 ships.

Codex implements F3 immediately (low risk); F1/F2/F4 land as experimental labeled rules behind an engine version bump, promoted only after the test sessions.
