# FH6 Conflicts & Recommendations

Compiled: 11 June 2026 (Cowork). Each conflict: positions, verdict, recommendation for the app. Verdicts here are research conclusions, not engine changes — Codex turns accepted recommendations into rule diffs + tests per AGENTS.md.

## 1. Brake balance semantics — RESOLVED

**Positions.** Forum users posted contradictory notation ("70% (Rear)" vs "% = frontness"). Guides were checked.

**Verdict.** Confirmed by four independent sources (ForzaTune guide, ForzaFire, Grindout, Apex Speed Craft): the FH5 inverted-slider bug is fixed in FH6; the slider works as labeled; **higher % = more front bias; 50% = equal split**. Typical road racing: 50–55% front.

**Recommendation.** No engine change needed if current behavior already treats higher = front. Verify that, then: (a) add an explicit "% front" direction label to UI copy and share text so exported tunes are unambiguous; (b) add a regression test asserting brake-balance direction semantics. Low effort, prevents the exact confusion seen on the forum.

## 2. Tire pressure: ~1.1 bar meta vs 1.8–2.0 bar guidance — DISPUTED, keep dual-track

**Positions.**
- Forum competitive claim: pressures rarely above 1.1 bar in FH6.
- Same thread, FFB-wheel user: runs 1.8/1.9 bar, distrusts the 1.1 meta without telemetry.
- ForzaFire: ~2.0 bar for rally compound mixed-use; stock pressures invalid after compound change.
- forza.guide: slicks want more pressure (stiffer sidewalls); heavier cars want more pressure.

**Verdict.** Genuinely unresolved. The very low pressure meta is plausibly an engine quirk favoring gamepad players and may be patched; the 1.8–2.2 bar band is the defensible clean baseline. Input device and compound both matter.

**Recommendation.** Keep current baseline pressures (clean band). Add a clearly labeled note in the tune result for road disciplines: "Community competitive meta runs much lower pressures (~1.1 bar); unverified, input-dependent, test via telemetry tire temps." Do not change defaults. Add this to the Feel Adjuster scope later only if Jeff's own test rides confirm it.

## 3. Rally tires on tarmac S1 — LEGITIMATE LABELED ALTERNATIVE

**Positions.** Forum meta builds run Rally compound on road S1 cars; forza.guide independently: rally compound costs between sport and semi-slick PI with cornering grip closer to slicks — efficient on light, powerful cars. ForzaFire frames compounds strictly per surface.

**Verdict.** Not an exploit — a PI-efficiency play. Confirmed by two independent source types.

**Recommendation.** Build Guide: for Road/Touge disciplines at A/S1 on light-powerful archetypes, offer "Rally compound (PI-efficient alternative)" as a labeled secondary option next to the default race/semi-slick advice, with one-line rationale and the caveat that pressure must be retuned for the compound. Requires a small rule in build-guide engine + scenario test.

## 4. Soft-front/stiff-rear vs balanced mildly-soft springs — DISPUTED, default to balanced

**Positions.** Forum thread: all cars soft front / stiff rear, extreme ARB splits. Grindout: current FH6 testing shows balanced, mildly soft setups beating front-soft/rear-stiff because that pattern makes turn-in inconsistent under trail-braking. forza.guide: springs at ⅓–½ of slider range, heavier end slightly higher — i.e. weight-distribution-led, near-balanced.

**Verdict.** The extreme split is competitive-exploit territory (consistent with the 1F/65R ARB exploit); the balanced weight-led approach is the defensible default and matches the app's existing percentage model.

**Recommendation.** No change to spring percentage model — it is independently validated. Document the exploit split only in COMMUNITY_META_NOTES. Review ARB advice ranges stay within the conservative 25–45-typical band for normal road modes (already the case per PROJECT_HANDOFF).

## 5. New FH6 stats not yet in app knowledge — ADD TO RESEARCH DOC

Mechanical Balance stat and Aero Balance stat (see COMMUNITY_META_NOTES) are new FH6 tuning-screen features. The app does not need to compute them, but advice copy can reference them as in-game verification aids ("check the Mechanical Balance stat moves toward front/rear as expected"). Update BUILD_GUIDE_RESEARCH.md sources accordingly; review whether improved.ts aero rules still assume the old front/rear aero meta.

## 6. Open verification items (need in-game checks by Jeff)

- Rally/Off-road transmission "faster at equal ratios" claim — single-source; needs a controlled in-game A/B before any rule.
- Front tire width PI-efficiency — confirm magnitude on one known car (screenshot of PI delta per width step).
- Whether the low-pressure meta survives current patch — telemetry tire temps at 1.1 vs 2.0 bar on one road build.
