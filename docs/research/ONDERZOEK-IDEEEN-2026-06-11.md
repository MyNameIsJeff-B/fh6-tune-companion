# Onderzoek & ideeën — FH6 Tune Companion

Datum — 11 juni 2026
Auteur — Cowork (PM/onderzoek), Codex is uitvoerder
Uitgangspunt — Jeff wil de app gebruiken en af en toe iets noteren. Alles hieronder is gerangschikt op effort-voor-Jeff, laag naar hoog. Niets hiervan is een opdracht; het is voer voor toekomstige sprints.

---

## A. Onderzoeksbevindingen (nieuw sinds oplevering 1)

### A1. FH6 heeft officiële telemetrie-output ("Data Out")

Forza Support publiceert officiële documentatie voor FH6 Data Out: een UDP-stream met o.a. `CurrentEngineRpm`, `EngineMaxRpm`, snelheid, slip, suspension travel en G-krachten, instelbaar onder Settings → HUD and Gameplay. Kanttekening uit de community: `EngineMaxRpm` is het absolute plafond; de echte redline ligt 100-500 RPM lager.

Dit is de structurele oplossing voor het "grafiek aflezen"-probleem. Open-source referenties: `TheBanHammer/fh6-tel` (FH6 telemetrie-dashboard) en `richstokes/Forza-data-tools`.

### A2. Er bestaat al een commerciële telemetrie-autotuner: fh6.tech

fh6.tech leest Data Out en genereert tunes per auto/ondergrond/doel ($4,99 p/m, beta gratis). Relevant om twee redenen: het bewijst dat het concept werkt, en het laat zien waar onze app zich onderscheidt — lokaal, gratis, geen account, eigen data. Niet kopiëren, wel als benchmark gebruiken voor welke telemetrievelden nuttig zijn (zij gebruiken: speed, slip, tire temps, suspension travel, gearing, G-force).

### A3. ForzaFire heeft zes FH6-specifieke tuning-guides

Met per-klasse slider-percentages, formules voor springs/damping/ARB en — belangrijk — het unlock-gedrag per upgrade-tier. Laatste update 20 mei 2026. Dit is nu de beste openbare FH6-bron en hoort in `BUILD_GUIDE_RESEARCH.md` en in de wekelijkse watchlist.

### A4. Per-auto databronnen, stand van zaken

- **ManteoMax-spreadsheets**: dé klassieke bron voor per-auto data; FH6-sheets zijn nog niet gepubliceerd (forum bevestigt dit ~mei 2026). Zodra ze er zijn: downloadbare Google Sheets, vrij te gebruiken — de kortste route naar per-auto redlines, gewichten en upgradedata. In de watchlist zetten.
- **ForzaLabs** claimt 575+ FH6-auto's met upgradedata, maar accountgebonden/commercieel → niet kopiëren (conform AGENTS.md).
- **calculators.games/en/forza-horizon-6**: FH6 cardatabase + meta-tuning, bijgewerkt voor mei 2026-release. Bruikbaarheid en licentie nog niet beoordeeld.
- **F.A.T.T.Y** (Forza Automotive Tuning Tool) op Nexus Mods voor FH6 — open modding-hoek, mogelijk inzicht in hoe anderen sliderranges aanpakken.

### A5. De eigen kennislaag wordt niet benut

De FH6-knowledgebase (map boven de repo) bevat al `car_archetype_tags.csv`, `build_presets.csv`, `car_build_recommendations.csv`, `meta_top_cars_by_class.csv` en `tunelab_*_defaults.csv`. De app gebruikt hier niets van. Dit is gratis diepte voor de Build Guide — de data is er al, alleen de koppeling ontbreekt.

## B. Ideeën, gerangschikt op effort voor Jeff

### B1. Vrijwel nul effort — kandidaten voor sprint 3+

1. **Notitieknop in de app.** Eén veld per tune/revisie: "wat zat niet lekker". Exporteerbaar als kant-en-klare feedbacktekst (of GitHub issue-body) die Jeff alleen hoeft te plakken. Dit maakt Jeff's gewenste workflow (rijden → noteren → terugkoppelen) onderdeel van de app zelf.
2. **Slider-min/max één keer per auto vastleggen.** Bij de eerste tune van een auto vraagt de app de in-game min/max van de spring-slider (2 getallen). Bouwt vanzelf een eigen per-auto override-database op — precies roadmap P2, zonder aparte invoersessies.
3. **Telemetrie-afleeshulp.** Korte uitleg in de UI hoe je redline/piekkoppel via de in-game telemetrie-overlay afleest (ForzaTune-methode), in plaats van de dyno-grafiek turen.

### B2. Laag effort — één klein hulpmiddel installeren

4. **Lokaal "car snapshot"-scriptje (Data Out).** Een mini-tool (Python/Node, door Codex te bouwen) die luistert naar FH6 Data Out en per auto één JSON maakt: max RPM gezien, aantal gears, topsnelheid op een pull. Jeff importeert die JSON in de app → gearing-invoer volledig automatisch. Eénmalige setup (Data Out aanzetten + script starten), daarna passief.

### B3. Middel effort — grotere sprints, pas na validatie van de basis

5. **Telemetrie-gedreven diagnose.** Zelfde Data Out-stream, maar dan suspension travel/slip per rit loggen en de bestaande diagnosis-engine voeden met gemeten data in plaats van gevoel. Dit is in feite een lokale, gratis fh6.tech. Groot, pas doen als de rekenregels kloppen.
6. **Kennislaag-import in de Build Guide.** Archetype-tags en build-presets uit de knowledgebase als startpunt per auto (zie A5). Vereist een bewuste keuze welke CSV's mee de app in gaan (omvang/licentie).
7. **ManteoMax-import zodra FH6-sheets verschijnen.** Per-auto redline, gewicht, gewichtsverdeling → Quick mode wordt in één klap accuraat zonder enige invoer.

## C. Bewust niet doen (bevestigt bestaande roadmap)

- Cloud, accounts, publieke tunedatabase — staat al terecht onder "Later" in PROJECT_HANDOFF.
- Data kopiëren van ForzaLabs/ForzaTune Pro — licentie-risico, en AGENTS.md verbiedt het al.
- Een eigen scraper voor commerciële sites — de wekelijkse watch (zie briefing) dekt het signaal, niet de data.

## Bronnen

- FH6 Data Out documentatie: https://support.forza.net/hc/en-us/articles/51744149102611-Forza-Horizon-6-Data-Out-Documentation
- fh6.tech: https://fh6.tech/
- TheBanHammer/fh6-tel: https://github.com/TheBanHammer/fh6-tel
- richstokes/Forza-data-tools: https://github.com/richstokes/Forza-data-tools
- ForzaFire FH6-guides (index): https://www.forzafire.com/guides
- ManteoMax: https://www.manteomax.com/ (FH6 nog niet gepubliceerd; forumdiscussie: https://forums.forza.net/t/car-spreadsheets-with-in-depth-stats/828066)
- calculators.games FH6: https://calculators.games/en/forza-horizon-6
- F.A.T.T.Y op Nexus Mods: https://www.nexusmods.com/forzahorizon6/mods/113
- ForzaTune, waarden aflezen zonder grafiek: https://forzatune.com/tuning-a-car-that-doesnt-have-a-power-and-torque-graph/
