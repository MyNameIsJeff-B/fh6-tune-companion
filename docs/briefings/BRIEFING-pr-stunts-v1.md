# Sprint Briefing — PR Stunt Builds & Tunes (v1)

Agent: Codex. Read `AGENTS.md`, then `docs/research/RESEARCH_ROUND_7_PR_STUNTS.md` — that document is the complete knowledge model for this sprint; this briefing only frames scope and acceptance. Detail context where referenced: FOUNDATION_AUDIT.md (open items), RESEARCH_ROUND_5.md (Drift Zone RWD rule, drift-branch review status D5).

## 1. Goal

Users can pick a PR Stunt type (Speed Trap, Speed Zone, Danger Sign, Drift Zone, Trailblazer) and get a fitting build recipe plus tune, including technique tips — because a good race car is not a good stunt car.

## 2. Success criteria

- Build Guide offers a "PR Stunt" goal with the 5 subtypes; mappings per RESEARCH_ROUND_7 §Voorgesteld app-model (trailblazer→Cross Country, drift_zone→Drift + hard RWD requirement, speed_zone→Road race speed-focus, speed_trap→new Top Speed recipe, danger_sign→new Jump recipe).
- Drivetrain/build mismatch warnings: AWD or FWD selected for Drift Zone (RWD required for scoring), non-off-road build for Trailblazer, assists note for Drift Zone.
- Tune engine: new "Speed" variant (minimum aero both ends, longest gearing with headroom, pressure high within compound band, stability bias) and "Jump" variant (bump softened, rebound slightly reduced, ride height one step up, minimum aero, gearing headroom at ramp speed) — exact directions and sources in the research doc. Speed Zone = Race mode with speed lean (longer gearing, Aero Balance window 0.40–0.45 in advice text). Drift Zone and Trailblazer reuse existing branches; Trailblazer adds the CC stunt deltas from the research doc (ride height 5–7 in guidance, +1.0 rebound vs race, diff −10%, center 60–70% rear, shorter gearing).
- Every stunt result includes its technique tips (run-up 1–2 km / drafting / downhill / traffic setting for traps; straight ramp hit + run-up in road segments for signs; assists off for drift; terrain-line note for trailblazers). Dutch explanations, English game terms, sources named per AGENTS.md.
- Tests: per subtype at least one scenario test covering the mismatch warning, the aero/gearing direction, and (danger_sign) the landing-damping deltas. All existing tests stay green.
- ENGINE_VERSION and BUILD_GUIDE_VERSION bumped; PROJECT_HANDOFF and BUILD_GUIDE_RESEARCH updated (new sources: bossdown PR-stunt guides, gamingpromax PR guide, games.gg danger signs, fandomwire, ForzaFire aero guide, fh6wiki landing fix, game8 aero balance ~0.45).
- Pages deploy verified per AGENTS.md.

## 3. Constraints

- NIET DOEN: touch the Sprint B reserved items (A1 damping model, A2 spring targets, drift-branch value rewrite D5 — the drift stunt recipe references the existing branch and inherits the future review outcome); import per-location stunt databases (111 locations out of scope); exploit meta; new dependencies without asking; UI redesign beyond what the new goal/subtype selection requires.
- If the Jump variant's ride-height step conflicts with a class minimum, clamp and add a correction note rather than skipping.

## 4. Stop rules

- If the Build Guide type system cannot express a stunt subtype cleanly without breaking existing discipline typing, deliver a written design proposal instead of forcing it.
- If any existing test must change meaning to pass, report the conflict.

## 5. Output

- Code + tests, committed as `[sprint-pr-stunts] add PR stunt build & tune layer`.
- Updated docs as above.
- Short report: per subtype — implemented mapping, warnings, open questions; explicit list of anything deferred to the drift-branch review (D5) or Jeff validation.
- Live Pages URL after deploy verification.
