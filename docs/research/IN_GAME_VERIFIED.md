# In-Game Verified Facts — door Jeff bevestigd

Dit log bevat feiten die Jeff zelf in FH6 heeft geverifieerd. Deze wegen zwaarder dan elke guide of community-bron. Agents: bij conflict tussen een bron en dit log wint dit log, en wordt de bron-claim in het betreffende research-doc gemarkeerd als weerlegd.

## Geverifieerd

| # | Feit | Datum | Weerlegt |
|---|------|-------|----------|
| V1 | **Tire pressure is altijd instelbaar, ook op volledig stock banden/suspension.** | 11 jun 2026 | ForzaFire-claim dat Street S&D "usually" pas de pressure-slider ontgrendelt; F.A.T.T.Y-implicatie idem. Capability-model `tires: true` (altijd) is correct — geen wijziging nodig. |

## Open verificatievragen (aflopende prioriteit)

1. **PI-klassegrenzen**: cap A-klasse op 700 of 800? Bronnen spreken elkaar hard tegen (ForzaFire + bossdown: A=700/S1 vanaf 701 na class-rebalance; gamingpromax/games.gg/egamers: A=701–800/S1 801–900). Raakt CLASS_CAPS en alle targetPi-logica in de Build Guide. Eén blik op een class-badge + PI in-game beslist dit.
2. **Toe-sign-conventie**: screenshot van het alignment-scherm — betekent positief toe-out of toe-in? (Bepaalt of de diagnose-optie "rear toe-in bij snap-oversteer" als negatieve of positieve waarde moet worden geadviseerd. Default blijft 0.0 ongeacht uitkomst.)
3. **R-klasse-definitie**: aparte PI-range boven 998, gedeelde 998-cap, of autotype-klasse? Class-badge van een R-auto + PI-getal.
4. **Mechanical Balance-stat**: bevestig dat de stat live meebeweegt met ARB/springs/compound en dat het venster 0,55–0,65 klopt met het gevoel (komt vanzelf in de validatiesessies).
5. **Aero Balance-stat**: bevestig richting (hoger = meer front) en het 0,40–0,45-venster.
6. **Rally/Off-Road Differential tier**: bestaat op welke chassis, en is het PI-neutraal t.o.v. Race diff?
7. **Stock-adjustable auto's**: komen race-/prototype-auto's (R-klasse) met volledig ontgrendelde tuning zonder upgrades? (Build Guide moet dan geen Race suspension adviseren.)

Telemetrie-validatiesessies (A1 demping, A2 veren, C8 bandenspanning) staan apart beschreven in FORMULA_ANALYSIS.md (validatieplan) en RESEARCH_ROUND_2.md (telemetrie-recept incl. Windows-listener-valkuil).
