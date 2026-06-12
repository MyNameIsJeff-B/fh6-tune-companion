# Research Round 6 — EV-systeem, PI-cap-discrepantie & Transmissie-advies

Compiled: 11 June 2026 (Cowork). Bevat één potentieel fundamentele discrepantie (PI-caps), één compleet nieuw kennisgebied (EV-swaps) en kleinere Build Guide-verfijningen. Jeff's eerste in-game verificatie (tire pressure altijd instelbaar) staat in IN_GAME_VERIFIED.md — het capability-model klopt, de ForzaFire/F.A.T.T.Y-claims daarover zijn weerlegd.

## ⚠ PI-klassegrenzen: bronnen spreken elkaar fundamenteel tegen

ForzaFire's drivetrain-gids stelt expliciet: PI "now caps at A 700 and rolls into S1 at 701, after FH6's class rebalance". Bossdown meldde eerder hetzelfde ("elke klasse onder S2 is ~100 PI gezakt, de community ruziet over de exacte grens"). Daartegenover: gamingpromax, games.gg en egamersworld hanteren allemaal A 701–800 / S1 801–900 — de FH5-indeling. Dit is geen detail: onze CLASS_CAPS (A=800, S1=900) stuurt élk targetPi-budget in de Build Guide. Als ForzaFire gelijk heeft, zit elke cap behalve S2 er 100 naast. **Hoogste prioriteit op de verificatielijst — Jeff kan dit met één blik op een class-badge beantwoorden.** Tot die tijd: geen wijziging, wel een waarschuwingscomment bij CLASS_CAPS in Sprint A (uitbreiding van C6).

## Nieuw kennisgebied: het FH6 EV-systeem (D6)

FH6 heeft een nieuw EV motor swap-systeem dat de app volledig niet kent (bossdown EV Motor Swap Guide):

- Een EV-swap vervangt motor én drivetrain-aannames: instant torque vanaf nul, geen powerband om te managen, geen aspiratie-keuzes (turbo/super vervalt als beslislaag).
- **De batterij is de hoofdmassa** en de plaatsing beïnvloedt de balans; zwaardere batterijen schaden de power-to-weight — batterijkeuze is een gewicht/vermogen-afweging.
- De meta is nog aan het settelen; de community is de optimale motor/batterij-combo's per klasse nog aan het mappen. Bron adviseert expliciet eigen testdata boven het citeren van waardes "die volgende week stale zijn" — past precies bij onze telemetrie-aanpak.

App-impact: (1) Build Guide "Aspiration or Engine Swap" moet EV-swap als optie noemen met de batterij-gewichtsafweging; (2) de gearing-calculator leunt op redlineRpm/powerband — voor EV's (vaak 1 gear, vlakke levering) moet de gearing-sectie zich anders gedragen of onderdrukt worden; check hoe de app nu omgaat met gears=1; (3) de `ev`-vlag in cars.ts krijgt eindelijk een functie. Parkeren tot na Sprint B — meta te vers voor regels, wel adviestekst-materiaal.

## Transmissie-advies verfijnen (Build Guide)

ForzaFire drivetrain-gids, FH6-specifiek: **Sport Transmission is de sweet spot voor de meeste B- en veel A-builds** (Final Drive-tuning zonder Race-PI); Race Transmission kost doorgaans 2–8 PI méér en loont vooral bij vreemde stock-spacing (te lange 5e, te korte 3e) of grote vermogenswijzigingen. Onze Build Guide kiest Race al alleen bij Drag/Drift/Wangan/speed-focus/S1+, anders Sport ✓ — richting klopt, de detailtekst kan de PI-afweging (2–8 PI) en het stock-gearing-criterium overnemen. Plus uit forza.guide (Round 5): 8+ factory gears → transmissie stock laten.

## Stock-adjustable auto's

ForzaTune's eigen documentatie: "In some cases, cars are stock adjustable and you should *not* install a rally suspension." Race-/prototype-auto's komen vaak met volledig ontgrendelde tuning. Onze Build Guide adviseert onvoorwaardelijk Race suspension — voor stock-adjustable auto's (vermoedelijk veel R-klasse) is dat overbodig advies. Profile-veld `stock_adjustable` toevoegen aan build-profiles zodra in-game bevestigd (verificatievraag 7).

## Bronnen-status na zes rondes

- **OPTN-gids**: site is een JS-app zonder fetchbare content; de gids zelf (Google Doc) niet via zoeken gevonden. Route: OPTN Discord of Jeff opent optn.club en kopieert de doc-link. Open.
- **kboosting**: niet direct vindbaar; lineage volledig gedekt via forza.guide zelf. Gesloten als prioriteit.
- **HokiHoshi FH6** ("How To Build & Tune in Forza Horizon 6 | Basic Refresher & FH6 Changes Guide"): bestaat, ±1 maand oud, door Apex als workflow-referentie gebruikt. Transcript niet fetchbaar; samenvatting blijft open — optie: Jeff kijkt 'm (≈20 min) en roept de afwijkingen, of we wachten op secundaire bronnen die hem citeren.
- **Forum 832103**: hoofdcontent gemined (Rounds 1–3); forums sluiten binnenkort — geen verdere actie nodig nu kennis geëxtraheerd is.

## Stand van de backlog na zes rondes

Sprint A (klaar voor Codex): v4.1 + ROUND_3-addendum (A5, A6-definitief) + C6-uitbreiding met de PI-cap-waarschuwing uit deze ronde. Sprint B (wacht op Jeff's sessies): A1 (twee dempingformules om te A/B'en), A2 veren, C1/C2/C4, D2 diff-granulariteit, drift-branch-review, Touge-regels, Wangan-branch, drag-squat. Build Guide-backlog: D1 drivetrain-swaps, D3 widebody, D4 engine-swap-teksten, D6 EV, diff-type per discipline, transmissie-PI-afweging, drift-RWD-regel, stock-adjustable-veld. Verificatielijst: zie IN_GAME_VERIFIED.md.
