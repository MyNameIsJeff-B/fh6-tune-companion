# In-Game Verified Facts — door Jeff bevestigd

Dit log bevat feiten die Jeff zelf in FH6 heeft geverifieerd. Deze wegen zwaarder dan elke guide of community-bron. Agents: bij conflict tussen een bron en dit log wint dit log, en wordt de bron-claim in het betreffende research-doc gemarkeerd als weerlegd.

## Geverifieerd

| # | Feit | Datum | Weerlegt |
|---|------|-------|----------|
| V1 | **Tire pressure is altijd instelbaar, ook op volledig stock banden/suspension.** | 11 jun 2026 | ForzaFire-claim dat Street S&D "usually" pas de pressure-slider ontgrendelt; F.A.T.T.Y-implicatie idem. Capability-model `tires: true` (altijd) is correct — geen wijziging nodig. |
| V2 | **Officiële FH6 PI-ranges: D 100-400, C 401-500, B 501-600, A 601-700, S1 701-800, S2 801-900 en R 901-998.** | 12 jun 2026 | De oude FH5-caps in Build Guide, handmatige klasseafleiding en voorlopige R/X-aannames. Bevestigd via aangrenzende waarden in de officiële Forza-carlist. |

## Open verificatievragen (aflopende prioriteit)

1. **Toe-sign-conventie**: screenshot van het alignment-scherm — betekent positief toe-out of toe-in? (Bepaalt of de diagnose-optie "rear toe-in bij snap-oversteer" als negatieve of positieve waarde moet worden geadviseerd. Default blijft 0.0 ongeacht uitkomst.)
2. **Mechanical Balance-stat**: bevestig dat de stat live meebeweegt met ARB/springs/compound en dat het venster 0,55–0,65 klopt met het gevoel (komt vanzelf in de validatiesessies).
3. **Aero Balance-stat**: bevestig richting (hoger = meer front) en het 0,40–0,45-venster.
4. **Rally/Off-Road Differential tier**: bestaat op welke chassis, en is het PI-neutraal t.o.v. Race diff?
5. **Stock-adjustable auto's**: komen race-/prototype-auto's (R-klasse) met volledig ontgrendelde tuning zonder upgrades? (Build Guide moet dan geen Race suspension adviseren.)

Telemetrie-validatiesessies (A1 demping, A2 veren, C8 bandenspanning) staan apart beschreven in FORMULA_ANALYSIS.md (validatieplan) en RESEARCH_ROUND_2.md (telemetrie-recept incl. Windows-listener-valkuil).
