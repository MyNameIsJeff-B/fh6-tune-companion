# Review — FH6 Tune Companion, oplevering 1 (v0.2.0)

Datum — 11 juni 2026
Reviewer — Cowork (PM-rol)
Agent — Codex (uitvoerder)
Basis — volledige code-review van `src/`, `docs/`, praktijkfeedback van Jeff, en extern bronnenonderzoek (zie bronnenlijst onderaan)

---

## Wat goed is

- **Architectuur is schoon en houdt zich aan AGENTS.md.** Baseline, improved, diagnosis en summaries zijn netjes gescheiden. Versioning (engine/baseline/catalogus) zit consequent in elke opgeslagen tune. Revisies zijn immutable met `parentRevisionId`.
- **Het onzekerheidsmodel is eerlijk.** Confidence per waarde, warnings bij ontbrekend gewicht, `valuesConfirmed`-mechanisme. Dit is precies de juiste houding: geen schijnprecisie.
- **PWA-fundament werkt.** Offline, GitHub Pages, lokale opslag, JSON-rondreis — allemaal aantoonbaar getest volgens PROJECT_HANDOFF.
- **Documentatie-discipline is hoog.** AGENTS.md, PROJECT_HANDOFF.md en BUILD_GUIDE_RESEARCH.md zijn actueel en bruikbaar als bindend kader.

## Wat ontbreekt of fout is

Praktijkfeedback van Jeff bevestigd tegen de code en externe bronnen. Vier hoofdproblemen, in volgorde van ernst.

### 1. Springs zijn onbruikbaar (bevestigd — unit- én methodefout)

Praktijk: Jeff kan niets met de veerwaarden; FH6 toont metrisch **kgf/mm**, de app toont "N/mm".

Wat er in de code gebeurt:

- `baseline.ts` regel ~107: `metric ? round((nPerM / 1000) * 9)` — TuneLab's "omstreden 9× metrische schaal".
- `improved.ts` regel ~50: deelt diezelfde waarde weer door 9 en labelt het resultaat "N/mm".
- Netto-effect: een fysisch correcte N/mm-waarde met het verkeerde label, die vervolgens nergens tegen het **per-auto sliderbereik** wordt gehouden.

Het kernprobleem is groter dan de unit: **FH6 spring-sliders hebben per auto een eigen min/max-bereik.** Een absoluut getal zonder kennis van dat bereik valt regelmatig buiten de slider en is dan letterlijk niet in te stellen. De community lost dit op met de slider-percentage-methode: `Rate = min + %(max − min)`, met klasse-afhankelijke percentages en een correctie van ±4 kgf/mm per 1% gewichtsverdeling-afwijking van 50/50 (ForzaFire FH6 Platform & Handling guide, bijgewerkt 20 mei 2026).

Let op bij de fix: Forza's metrische display is intern afwijkend (forum-discussie "Metric spring rates issue": de getoonde kgf/mm is feitelijk per-cm, ~10× de SI-waarde). Niet zelf blind converteren vanuit de frequentie-formule; valideer tegen in-game waarden.

**Aanbevolen fix:** vraag de gebruiker éénmalig per auto de in-game min/max van de spring-slider (twee getallen, simpel af te lezen — veel makkelijker dan de dyno-grafiek) en geef het advies als percentage van het bereik plus de berekende kgf/mm-waarde. Sla die min/max op bij de auto (sluit aan op roadmap P2, per-auto overrideschema).

### 2. ARB-waarden slaan nergens op (bevestigd — gewichtsverdeling wordt genegeerd)

De ARB-berekening in `baseline.ts` (regels ~126-152) gebruikt drivetrain en een power-norm, maar **negeert `frontWeightPercent` volledig** — terwijl gewichtsverdeling volgens elke serieuze bron de primaire input is.

Concreet voorbeeld uit de code: race RWD geeft front 8-22 / rear 45-63. Externe referenties:

- ForzaFire FH6: RWD typisch **front 18-25 / rear 25-35**; AWD 22-30 / 28-38; FWD 8-15 / 25-40.
- Klassieke community-formule (HokiHoshi/diamondlobby): front = 64 × gewichtsverdeling% + 0.5, rear = 64 × (1−gewichtsverdeling%) + 1. Bij 52/48 → ~34/31.

Een achterkant die 2-5× stijver is dan de voorkant op een RWD-raceauto produceert snap-oversteer. Dit verklaart Jeff's ervaring een-op-een. De bestaande tests in `engine.test.ts` codificeren vermoedelijk deze foute verwachtingen en moeten mee.

**Aanbevolen fix:** herbouw de ARB-regel rond gewichtsverdeling (één van beide formules hierboven als basis, ForzaFire heeft ook een klasse-afhankelijke variant), met discipline-modifiers er bovenop. Schrijf tests met de extern gepubliceerde targetranges als acceptatiegrens.

### 3. Gearing-invoer vraagt waarden die niet goed af te lezen zijn — en gebruikt er één niet eens

- `peakTorqueRpm` wordt in de UI gevraagd (App.tsx ~regel 607) maar **wordt in geen enkele engine-berekening gebruikt** (alleen types/defaults/App). Een veld dat moeilijk af te lezen is én niets doet, moet weg of nut krijgen.
- `redlineRpm` is wél nodig voor final drive, maar de dyno-grafiek in FH6 is slecht afleesbaar. Alternatieven, in oplopende ambitie:
  1. **In-game telemetrie-methode** (ForzaTune documenteert dit): testrit op een drag strip met telemetrie-overlay aan; redline = RPM waar de begrenzer ingrijpt minus 100-200; piekkoppel = RPM van de eerste koppel-daling. Dit kan nu al — alleen een UI-hint/uitleg in de app nodig.
  2. **FH6 Data Out (UDP-telemetrie)** — officieel gedocumenteerd door Forza Support. Velden o.a. `CurrentEngineRpm` en `EngineMaxRpm` (let op: `EngineMaxRpm` is het absolute plafond, de echte redline ligt lager). Een klein lokaal hulpscript kan dit per auto vastleggen; zie het onderzoeksdocument.
  3. **Final-drive-only modus**: voor gebruikers zonder zin in RPM-gedoe; de app heeft dit pad al (`gearing: "final"`), maar Quick mode zou er beter op kunnen leunen in plaats van een gegokte 7500 RPM default.

### 4. Build Guide is te ondiep (bevestigd — volledig generiek)

`build-guide/engine.ts` genereert voor elke auto exact hetzelfde plan; alleen drivetrain, klasse en discipline variëren de tekst. De catalogus (`cars.json`) wordt uitsluitend voor identiteit gebruikt. Daarnaast:

- De **lokale FH6-kennislaag wordt niet aangesloten**: `data/derived/car_archetype_tags.csv`, `car_build_recommendations.csv`, `build_presets.csv` en `meta_top_cars_by_class.csv` bestaan al in de knowledgebase-map en bevatten precies de per-auto/per-archetype diepte die nu ontbreekt.
- Het **tier/unlock-model moet gevalideerd worden tegen FH6**: volgens de ForzaFire FH6-guide unlockt Street suspension doorgaans alleen bandenspanning, Sport vrijwel niets extra, en geven alleen Race/Rally/Off-Road de volledige suite. De app kent bovendien geen Off-Road suspension-tier en geen Cross Country-pad naast Rally.
- Brake-tiers: alleen Race brakes unlocken balance/pressure — check of de capability-mapping dit correct afdwingt.

## Wat ik adviseer

1. **Sprint 2 = de vier punten hierboven, in deze volgorde: ARB → springs → gearing-invoer → build guide-diepte.** ARB en springs zijn pure rekenregel-fixes met externe referentiewaarden als testgrens; relatief klein werk, grootste praktijkwinst.
2. **Acceptatiecriterium per fix:** advies valt binnen de extern gepubliceerde targetranges voor minimaal 3 referentie-auto's (licht RWD, zware AWD, FWD hot hatch), vastgelegd als golden-fixture tests.
3. **Engineversie ophogen** (naar `fh6-companion-0.3.0`) — bestaand advies verandert, dus verplicht volgens AGENTS.md.
4. **BUILD_GUIDE_RESEARCH.md uitbreiden** met de nieuwe bronnen (ForzaFire FH6-guides, FH6 Data Out-documentatie, forums-thread over metric springs).
5. De automatiseringsbriefing (`docs/briefings/BRIEFING-weekly-maintenance-automation.md`) als aparte taak ná sprint 2 oppakken.

## Sprint-restlijst

- [ ] ARB-regel herbouwen op gewichtsverdeling + discipline; tests met gesourcete targetranges
- [ ] Springs: kgf/mm-label, slider-min/max-invoer per auto, percentage-van-bereik output; persist per auto
- [ ] `peakTorqueRpm` schrappen of daadwerkelijk gebruiken; telemetrie-afleeshulp in de UI; Quick mode naar final-drive-only
- [ ] Build Guide koppelen aan archetype/preset-data uit de kennislaag; tier-unlock model valideren tegen FH6 (Off-Road tier toevoegen)
- [ ] Engineversie + changelog + BUILD_GUIDE_RESEARCH.md bijwerken
- [ ] Regressie: bestaande opgeslagen tunes blijven leesbaar (geen stille herschrijving)

## Bronnen

- ForzaFire — FH6 Platform & Handling Tuning Guide (20 mei 2026): https://www.forzafire.com/guides/forza-horizon-6-platform-and-handling-tuning-guide
- ForzaFire — FH6 Drivetrain Tuning Guide: https://www.forzafire.com/guides/forza-horizon-6-drivetrain-tuning-guide
- Forza Support — FH6 "Data Out" Documentation: https://support.forza.net/hc/en-us/articles/51744149102611-Forza-Horizon-6-Data-Out-Documentation
- ForzaTune — torque/redline aflezen zonder grafiek: https://forzatune.com/tuning-a-car-that-doesnt-have-a-power-and-torque-graph/
- DiamondLobby — ARB-formule op gewichtsverdeling: https://diamondlobby.com/forza-horizon-5/best-tuning-setups-for-forza-horizon-5/
- Forza Forums — Metric spring rates issue: https://forums.forza.net/t/metric-spring-rates-issue/650663
