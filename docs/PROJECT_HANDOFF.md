# Project Handoff

Laatst bijgewerkt: 11 juni 2026

## Huidige status

FH6 Tune Companion `0.3.0` is een werkende mobiele PWA met:

- auto zoeken of handmatig invoeren;
- Build Guide op discipline, ondergrond, aandrijving, klasse en focus;
- Quick en Advanced invoer;
- acht tune-modi;
- verbeterd advies plus optionele TuneLab-vergelijking;
- Feel Adjuster;
- diagnose met uitlegbare, onveranderlijke revisies;
- lokale garage;
- JSON-export/import;
- leesbare deelkaart;
- offline gebruik na het eerste bezoek;
- ARB-startwaarden binnen conservatieve FH6-bereiken voor normale wegmodi;
- per-auto opgeslagen veer-slidergrenzen en percentageadvies zonder schijnwaarde;
- gearing alleen vanuit bevestigde Advanced-invoer.

Live:
<https://mynameisjeff-b.github.io/fh6-tune-companion/>

Repository:
<https://github.com/MyNameIsJeff-B/fh6-tune-companion>

## Versies en provenance

| Onderdeel | Versie |
| --- | --- |
| App | `0.3.0` |
| Eigen tune-engine | `fh6-companion-0.3.0` |
| TuneLab-baseline | `tunelab-1.7.0` |
| Build Guide | `build-guide-0.2.0` |
| Catalogus | `tunelab-v7+fh6-local-2026-06-10` |
| Lokale opslag | `fh6-tune-companion:v1:tunes` |

TuneLab is opnieuw geïmporteerd als MIT-baseline. De eigen correctieregels en Build
Guide staan daar los van. Zie `licenses/TUNELAB-MIT.txt` en
`docs/BUILD_GUIDE_RESEARCH.md`.

## Belangrijkste ontwerpbesluiten

- Visuele richting 2, intern aangeduid als Garage Rail, is door de gebruiker gekozen.
- De app is mobile-first met een maximale werkbreedte van 760 px.
- FH6-herkenbaarheid zit in hiërarchie, typografie, kleur en railnavigatie; bediening
  en leesbaarheid gaan voor pixel-perfect kopiëren.
- Er zijn geen officiële logo-assets in de interface nodig. De niet-gelieerde
  disclaimer blijft zichtbaar in documentatie.
- Bronbeelden:
  - `design/garage-rail-reference.png`
  - `design/build-guide-reference.png`
- Laatste implementatiebeelden:
  - `design/garage-rail-implementation.png`
  - `design/build-guide-implementation.png`

## Datastroom

1. `src/data/cars.ts` laadt `public/data/cars.json`.
2. De gebruiker kiest een auto en configureert of importeert een build.
3. `src/build-guide/engine.ts` maakt een upgradeplan en leidt capabilities af.
4. `src/engine/baseline.ts` maakt het TuneLab-resultaat.
5. `src/engine/improved.ts` past expliciete eigen correcties toe.
6. `src/engine/summaries.ts` ververst alle zichtbare samenvattingen.
7. `src/engine/diagnosis.ts` maakt op rijfeedback een nieuwe revisie.
8. `src/storage/tunes.ts` bewaart maximaal 50 tunes in `localStorage`.
9. `src/storage/carOverrides.ts` bewaart bevestigde veer-slidergrenzen per auto.

## Bewust bekende beperkingen

- De auto-catalogus bevat geen betrouwbare volledige upgradeset per auto.
- PI-kosten, eindgewicht, gewichtsverdeling en sliderbereiken moeten in FH6 worden
  gecontroleerd.
- Zonder bevestigde veergrenzen toont de app alleen een percentage van het
  in-game bereik; exacte `kgf/mm`- of `lb/in`-waarden worden dan bewust niet geschat.
- De huidige spring-percentages zijn primair voor wegauto's onderbouwd. Rally,
  dirt, mixed en snow tonen daarom een extra praktijkwaarschuwing.
- Quick mode berekent geen gearing. Advanced vraagt redline, topsnelheid,
  versnellingen en bandenmaat; piekkoppel-RPM is verwijderd omdat het niet werd gebruikt.
- `valuesConfirmed` verlaagt onzekerheid pas nadat de gebruiker buildwaarden heeft
  gecontroleerd.
- Het verbeterde model is technisch en scenario-matig getest, maar nog niet breed
  gevalideerd met echte FH6-ritten.
- Er is geen account, synchronisatie tussen apparaten of backend.
- Tunes op de desktop en telefoon zijn daarom aparte lokale collecties; JSON is de
  huidige overdrachtsmethode.
- De repository is openbaar omdat het gebruikte GitHub-account anders geen Pages
  ondersteunt. Er staan geen persoonlijke tunes of geheimen in de repository.

## Laatst uitgevoerde kwaliteitscontrole

Op 11 juni 2026 voor Sprint 2:

- ESLint schoon.
- 45 Vitest-tests geslaagd.
- Pages-productiebuild geslaagd.
- Golden tests dekken lichte RWD, zware AWD en voor-zware FWD ARB-bereiken.
- Veerinterpolatie, FWD-omkering, ontbrekende/ongeldige grenzen, Quick/Advanced
  gearing en oude JSON-import zijn afgedekt.
- Build uitgevoerd in `C:\tmp` omdat npm-installatie in de Google Drive-map door
  bestandslocks beschadigd raakte.
- Lokale browsercontrole geslaagd op 390 x 844 en 320 x 844 zonder horizontale
  overflow of consolefouten.
- Gecontroleerde flow: per-auto veergrenzen bewaren, Quick zonder gearing,
  Advanced met redline-uitleg en berekende final drive.
- De ingebouwde Codex-browser kon door een Windows-runtimefout niet starten;
  dezelfde controles zijn uitgevoerd met de Playwright CLI-fallback.
- GitHub Pages workflow `27345829984` en deployment zijn geslaagd vanaf releasecommit
  `ff6e475`.
- De echte live URL is getest op 390 x 844: gewijzigde invoerflow, autodatabase,
  lokale fonts, assets, service worker en console zijn in orde.
- Na een eerste online bezoek herlaadt de live app met autodatabase ook offline.

## Eerstvolgende productstap

De hoogste prioriteit is **praktijkvalidatie**, niet meer generieke formulebouw.

Leg per testrit minimaal vast:

- auto, klasse en PI;
- upgrades en bevestigde sliderbereiken;
- discipline en testlocatie;
- controller/stuur en assists;
- probleemfase: remmen, insturen, middenbocht, uitkomen of hoge snelheid;
- huidige tune en gewijzigde waarde;
- effect na minimaal enkele consistente ronden.

Zet bewezen correcties daarna om in:

1. een klein, expliciet rule-verschil;
2. een scenario- of regressietest;
3. een engineversieverhoging wanneer bestaand advies verandert;
4. een korte wijzigingsnotitie in dit document.

## Roadmap

### P0 - Betrouwbaarheid

- Test bekende probleemauto's van de gebruiker.
- Voeg golden fixtures toe voor echte, bevestigde builds.
- Vergelijk de nieuwe ARB- en veeradviezen met echte in-game slidergrenzen.
- Maak onzekerheid per sectie nog zichtbaarder.

### P1 - Dagelijks gebruik

- Voeg testritnotities en rondesfeedback per revisie toe.
- Voeg een duidelijke tunegeschiedenis per auto toe.
- Maak export/import van de volledige garage mogelijk.
- Voeg een installatiewenk toe voor iOS en Android.

### P2 - Betere builddata

- Introduceer een versieerbaar per-auto overrideschema.
- Sla alleen handmatig bevestigde upgradebeschikbaarheid en slidergrenzen op.
- Voeg bron en verificatiedatum aan iedere override toe.
- Bouw beheer hiervoor eerst lokaal; geen onbewezen crowdsourcing.

### Later, alleen na expliciete keuze

- Cloudsync of accounts.
- Publieke distributie of gedeelde tune-database.
- AI-integratie.
- PaintLab, liveries, events of bredere companionfuncties.

## Publicatie

Normale route:

1. Werk op een gerichte branch wanneer de wijziging groter is.
2. Voer lint, tests en Pages-build uit.
3. Merge of push naar `main`.
4. Controleer workflow `Publiceer app`.
5. Controleer de live URL en offlinegedrag.

Bindend oplevercontract:

- Appwerk is pas afgerond wanneer er een bereikbare, geteste URL beschikbaar is
  voor een normale telefoonbrowser.
- Houd de laatst werkende live versie intact tijdens ontwikkeling.
- Publiceer een volledig gecontroleerde kandidaat in dezelfde taak; gebruik voor
  bewust onaf werk een aparte test-URL.
- Een lokale preview of geslaagde build zonder bereikbare URL is geen afgeronde
  app-oplevering.

GitHub Pages verwacht de submap `/fh6-tune-companion/`. Wijzig de repositorynaam
niet zonder ook `vite.config.ts` en deze documentatie bij te werken.
