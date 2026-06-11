# FH6 Community Meta Notes

Compiled: 11 June 2026 (Cowork). Sources: forums.forza.net thread 832103 "FH6: The Physics of Tuning" (30 May 2026, competitive tuner), Apex Speed Craft FH6 Tuning Reference (Apr 2026, refreshed May 2026), ForzaFire FH6 guides, forza.guide, Grindout FH6 tuning guide, gamingpromax, F.A.T.T.Y changelog (Nexus mod 113), EZG tuning guide.

Purpose: document what the competitive community actually does, separately from clean explainable tuning. Nothing here ships into the engine without a labeled rule diff + test. Confidence labels: **confirmed** (2+ independent sources), **disputed** (sources conflict), **single-source** (one source, unverified).

## New FH6 mechanics relevant to the app

- **Mechanical Balance stat** — live stat in the FH6 tuning screen showing front-vs-rear mechanical grip as one number; moves with ARB, springs, tire compound/width, weight distribution. *Confirmed* (gamingpromax explainer + forum thread discusses mechanical balance as a 0–1 "fronted-ness" scale). App impact: our summaries could mirror this concept; users can use the in-game stat to verify our advice.
- **Aero Balance stat** — new in FH6; the old "max front, min rear" aero meta no longer applies. *Confirmed* (Grindout + forum thread). App impact: review aero rules in improved.ts.
- **Front tire width buff** — front tire width has a measurable grip impact in FH6 and is described as one of the most PI-efficient investments. *Confirmed* (gamingpromax + forum "wheel width buffs" claim). App impact: Build Guide upgrade ordering may underweight front width.
- **Brake balance slider fixed** — higher % = more front bias, as labeled. 50% = equal. *Confirmed* (ForzaTune, ForzaFire, Grindout, Apex). Already consistent with app behavior; keep an explicit direction label in the UI copy.
- **Brakes matter more than in FH5** — stock brakes cause lockup/instability on touge and Tokyo streets; upgrade brakes earlier. *Single-source* (gamingpromax), plausible; cross-check.

## Competitive / exploit meta (label, never default)

From forum thread 832103 unless noted:

- **Max ride height, front slightly higher** — claimed engine quirk ("thinks the car is going downhill while accelerating"). *Single-source*, exploit. Contradicts every guide (low = better). Do not adopt; optionally document as labeled exploit context.
- **Body roll onto one wheel** — concentrate load on one wheel because traction is "shared between both wheels" in the engine; explains Peel/Reliant drag dominance. *Single-source*, exploit-flavored physics claim.
- **AWD strongly preferred** due to wheel-slip modeling; diff can be biased 100% either way but free-wheeling slip on FWD/RWD cannot be tuned away. *Confirmed direction* (forum + EZG "AWD standard answer for S1+"), though the wheel-slip mechanism itself is single-source.
- **1F/65R ARB exploit** for competitive AWD lobbies to break understeer. *Confirmed as meta practice* (Apex calls it "highly dominant"). Clean-tune guides warn against extremes (ForzaFire: typical 25–45). Exploit, label only.
- **Rally/Off-road transmission "faster"** at equal ratios; "don't use anything else, 6/7-speed or 4-speed". *Single-source*, unexplained. Needs verification before any rule.
- **Rally tire compound on tarmac S1 builds** — used in competitive road builds; forza.guide independently notes rally tires cost between sport and semi-slick but corner closer to slicks → efficient on light powerful cars. *Confirmed as legitimate option*, not just exploit. Candidate for a labeled Build Guide alternative.
- **Very low tire pressure meta (~1.1 bar)** — "rarely any situation TP should be above 16 PSI/1.1 bar". *Disputed*: a wheel/simulation user in the same thread runs 1.8/1.9 bar pending telemetry checks; ForzaFire advises ~2.0 bar for rally compound mixed use. See CONFLICTS doc.
- **Diff baseline 75–90% accel / 6–12% decel across axles** as forum starting point. Compare with F.A.T.T.Y audited rally corrections (RWD rally 8% accel/15% decel; AWD rally 10/8) and Apex center diff 70–75% rear road / 80–85% offroad. Ranges differ by discipline — capture per-discipline, don't average.
- **Toe-out <1° front effective** when balance is right; default camber often adequate. *Single-source* but consistent with FH5 carryover knowledge. Note: app currently defaults toe 0.0 — keep, but diagnosis layer may suggest small toe-out as labeled option.
- **Tire pressure/photo-mode time-attack exploit** (EZG, *single-source*): out of scope, ignore.

## Driving-input caveat

Forum participants explicitly note meta differs between gamepad+assists and FFB wheel simulation mode. Any community value adopted must record which input context it came from. The app currently has no input-context field; consider adding it to diagnosis notes (P1 roadmap, testritnotities).

## Channels worth monitoring

- Sepi (YouTube) — "The Tuning Disaster of Racing Games" discusses FH6 physics idiosyncrasies; referenced as authoritative by forum users. Summarize claims in a follow-up.
- forums.forza.net closes soon — knowledge extracted into this doc; check archive.org later for thread 832103 permanence.
- ManteoMax FH6 spreadsheets: not yet published as of early June 2026. Add to weekly maintenance checklist.
- F.A.T.T.Y (Nexus mod 113): open tool, goal profiles audited against forza.guide/kboosting/forzafire/gamingpromax; useful ongoing cross-check for improved.ts rules.
