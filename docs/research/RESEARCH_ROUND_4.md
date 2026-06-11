# Research Round 4 — Aero Balance, Patches, Drivetrain & Build Guide Gaps

Compiled: 11 June 2026 (Cowork). Input for Sprint B planning and the Build Guide backlog. No Sprint A changes.

## Aero Balance target found — resolves audit item C4

Grindout (FH6-specific, post-launch testing): set front/rear downforce so the in-game **Aero Balance stat reads 0.40–0.45** (higher = more front); overall level by build goal — time attack/circuit near max downforce, sprint/speed builds lower. Combined with the Mechanical Balance window (0.55–0.65, ~0.60) we now have concrete in-game verification numbers for both new FH6 stats. C4 implementation: aero section advice text gets the 0.40–0.45 window + goal-based level guidance; still no computed numeric values until telemetry.

Their full tuning order (tires → springs → ride height → alignment → ARBs → damping → brakes → differential → aero → gearing) matches forza.guide's workflow — candidate for a "tuning order" hint in the result screen (P2, UI text only).

## Patch status — knowledge is currently stable

FH6 updates so far: Day 1 patch, Series 1 Hotfix 1 (18 May, version 360.259), Series 1 Hotfix 2 (27 May, 364.933). All performance/stability/audio/progression fixes — **no physics or tuning balance changes yet**. Everything researched since launch is patch-current. Risk: the first real balance pass (likely Series 2) can invalidate meta claims (AWD dominance, low-pressure exploit, 1/65 ARB). Maintenance checklist: watch support.forza.net release notes every series rollover; re-verify COMMUNITY_META_NOTES claims after any note mentioning handling, tires, PI, or drivetrain.

## Drivetrain swap knowledge — fills a Build Guide blind spot (D1)

The Build Guide has only a keepStockDrivetrain boolean + generic warning. ForzaFire's drivetrain & conversion guides (FH6-specific) give implementable rules:

- **Stock AWD → keep.** Factory AWD systems (quattro, GT-R, Evo, WRX/STI, xDrive) are well-tuned in FH6 and need little adjustment.
- **AWD swap on RWD/FWD**: worth it for Road race at S1/S2, Dirt, and Cross Country; **not** in D/C (PI cost eats the budget). FH6 AWD carries an **inherent understeer bias** — note in tune output that diff and ARB must compensate (our AWD ARB rear-stiffer baseline already points the right way).
- **RWD swap on stock AWD**: rarely useful except drift builds or preserving chassis feel at B/A.
- **RWD powerbuild** as labeled archetype: weak tires + big power, very high top end relative to class; claims many fastest Rivals times; skill-demanding. Fits the "speed/acceleration" focus path as an optional labeled strategy.
- AWD-vs-RWD is condition-dependent (dtgre): AWD consistency vs RWD peak speed; rain shifts traction-distribution behavior — supports keeping this advisory, not prescriptive.

## Differential capability model is too coarse (D2)

FH6 diff tiers per ForzaFire: **Stock = no sliders · Sport = Acceleration only (AWD: front+rear accel, no decel, no center) · Race = everything.** Our `capabilities.differential` is a boolean — it cannot represent a Sport diff build, so the tune result would show decel/center values the user cannot set. Fix mirrors the existing gearing pattern: `differential: "none" | "accel" | "full"`, with section filtering like the gearing `final` case. Also: Race Diff is no longer always 0 PI in FH6 — some cars see a small cost; soften the Build Guide detail text accordingly.

## Widebody is missing from the Build Guide (D3)

FH6 reality (ggwtb): widebody kits unlock front aero and wider tires but add weight, drag, and PI — "if you do not need extra tire width, skip the kit." The Build Guide currently has no widebody/bodykit concept at all. Add as an "optional" upgrade in the aero or tires stage with exactly that trade-off text, gated to builds that selected width upgrades or front aero.

## Engine swap guidance (D4)

Apex Tune Hub + ggwtb, consistent: avoid swaps that consume PI while creating traction problems; a swap can push the car into a class without PI room left for tires/brakes/weight; heavy swaps (e.g. 6.2L V8) suit power tracks, think twice on tight layouts; after any swap retune gearing + differential and compare against the pre-swap baseline; remove the swap if it ruins the class target. This becomes the detail text for the existing "Aspiration or Engine Swap" upgrade — currently one generic line.

## Drift branch — low-confidence conflict (D5)

mmogah's FH6 drift guide: ARBs both ~8 (slightly above min), springs ~400 lb/in both ends, damping ~4, optional light front aero. Our drift branch (TuneLab lineage): front ARB 10–18, **rear ARB 28–48** — a completely different philosophy (stiff rear for rotation vs soft-everything Formula Drift style). One source is not enough to overturn the branch; drift tuning is famously style-dependent. Park as "needs drift-community check" — OPTN Discord or a dedicated FH6 drift source. Do not change yet.

## Diff value spread — context note

Across sources, road race diff decel ranges 6–12% (forum competitive) to 20–30% (fh6wiki); accel 60–90%. Our RWD road output (accel 55–75, decel 10–18) sits inside the union and near the conservative middle ✓. No change; recorded so future agents don't "fix" it toward whichever single source they read last.

## Open after this round

OPTN's actual guide doc (their site confirms FH6 formatters but the guide itself wasn't directly fetchable this round — mine via their site navigation or Discord), kboosting guide (last F.A.T.T.Y lineage source not yet read), dedicated FH6 drift/drag community sources (D5), and the in-game verification list (toe sign screenshot, R-class, Mechanical/Aero Balance behavior during Jeff's sessions).
