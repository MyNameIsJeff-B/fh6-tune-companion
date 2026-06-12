# Project Handoff

Laatst bijgewerkt: 12 juni 2026

## Huidige status

FH6 Tune Companion `0.8.4` is een werkende mobiele PWA met:

- een reproduceerbare bronlaag onder `automation/data`;
- een wekelijkse GitHub Actions-bronbewaker met `data-update`,
  `review-required` en `signal`;
- veilige automatische voorstellen via één langlevende pull request, zonder
  auto-merge;
- één onderhoudsissue voor patches, bronwijzigingen, communitysignalen en
  onbereikbare bronnen;
- een afzonderlijke wekelijkse Codex-researchautomatisering voor open-ended
  onderzoek, zonder toestemming om appcode of rekenwaarden te wijzigen;
- auto zoeken of handmatig invoeren;
- Nederlandstalige Build Guide met per-auto profiel, discipline, ondergrond,
  aandrijving, klasse en focus;
- 618 reproduceerbaar gegenereerde buildprofielen met upgradevolgorde en
  vermijd-lijst;
- discipline- en profielgestuurde actieve buildstappen;
- actuele `R`-topklasse met migratie van oude opgeslagen `X`-builds;
- gecorrigeerde FH6-caps `D400/C500/B600/A700/S1 800/S2 900/R998`;
- centrale PI-naar-klasse afleiding en begrenzing van oude ongeldige builddoelen;
- exact 618 officiële catalogusauto's zonder genormaliseerde aliasdubbelen;
- officiële stock class/PI als bronwaarheid, met TuneLab alleen als technische aanvulling;
- veldniveau-provenance voor drive, weight, gearing en EV-status;
- onafhankelijke rosterchecks via FH6Hub, FH6Cars en PC Gamer;
- strikte special-edition profielmatching voor Welcome Pack en Forza Edition;
- afzonderlijke Rally Tires voor Dirt en Off-Road Tires voor Cross Country;
- seizoenskeuze voor Spring, Summer, Autumn en Winter, los van de route-ondergrond;
- `+0,05 bar` Summer- en `-0,10 bar` Winter-correctie op tire pressure, met
  koud-asfaltwaarschuwingen;
- Quick en Advanced invoer;
- acht tune-modi;
- één duidelijk, eigen advies zonder TuneLab-vergelijking in de interface;
- PR Stunt-doel met Speed Trap, Speed Zone, Danger Sign, Drift Zone en
  Trailblazer;
- stunt-specifieke buildrecepten, mismatchwaarschuwingen, tunevarianten en
  techniekadvies;
- Feel Adjuster;
- diagnose met uitlegbare, onveranderlijke revisies;
- lokale garage;
- JSON-export/import;
- leesbare deelkaart;
- offline gebruik na het eerste bezoek;
- ARB-startwaarden binnen conservatieve FH6-bereiken voor normale wegmodi;
- per-auto opgeslagen veer-slidergrenzen en percentageadvies zonder schijnwaarde;
- gearing alleen vanuit bevestigde Advanced-invoer.
- `3%` RPM-marge onder de limiter voor Final Drive;
- neutrale `0,0°` road toe als FH6-default;
- bump op maximaal `50%` van rebound voor normale road modes;
- Race Brakes vanaf A-class voor Road-builds;
- klassesprongwaarschuwing bij minimaal twee klassen boven native;
- expliciete Brake Balance-richting in gedeelde tunes.
- Sport Differential met acceleration-only output en volledige
  Race/Rally/Off-Road/Drift Differential-capabilities;
- Rally- en Off-Road-compounds met verschillende pressure-banden;
- compound-aware road camber en Aero Balance-doel `0,40-0,45`;
- Touge-, Wangan-, Drag-, AWD- en Drift-specifieke waarschuwingen;
- widebody-, drivetrain-, engine- en EV-swaptrade-offs;
- EV/1-speed bescherming tegen ongeldige combustion gearing;
- Rally compound als gelabeld Road-alternatief en extra front tire width-prioriteit
  voor geschikte RWD A/S1-builds;
- zichtbare aankoop- en onzekerheidswaarschuwingen vóór de upgradekeuze;
- directe samenvatting van de tuningtoegang van geselecteerde onderdelen;
- exclusieve keuze tussen Sport en volledige Differential-tier, ook in handmatige
  invoer;
- verplichte testlocatie plus optionele testritcontext bij diagnose: schone ronden,
  besturing, assists en notities;
- teruglaadbare tunegeschiedenis per auto en discipline, inclusief de basisrevisie;
- volledige garage-export als één herimporteerbaar JSON-bestand.
- browsergestuurde PWA-installknop waar ondersteund, met concrete iOS- en
  Android-instructies als fallback.

Live:
<https://mynameisjeff-b.github.io/fh6-tune-companion/>

Repository:
<https://github.com/MyNameIsJeff-B/fh6-tune-companion>

## Versies en provenance

| Onderdeel | Versie |
| --- | --- |
| App | `0.8.4` |
| Eigen tune-engine | `fh6-companion-0.7.0` |
| TuneLab-baseline | `tunelab-1.7.0` |
| Build Guide | `build-guide-0.7.2` |
| Catalogus | `fh6-official-618+field-provenance-v2-2026-06-12` |
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

1. `automation/generate-data.mjs` genereert de publieke datasets uit de
   versieerbare invoer onder `automation/data`.
2. `src/data/cars.ts` laadt `public/data/cars.json`.
3. `src/build-guide/profiles.ts` koppelt de auto conservatief aan
   `public/data/build-profiles.json`.
4. De gebruiker kiest een normale build of PR Stunt, daarna discipline/subtype,
   klasse, focus en buildbeperkingen.
5. `src/build-guide/engine.ts` combineert profiel en keuzes tot een upgradeplan en
   leidt capabilities af.
6. `src/engine/baseline.ts` maakt het TuneLab-resultaat.
7. `src/engine/improved.ts` past expliciete eigen correcties toe.
8. `src/engine/summaries.ts` ververst alle zichtbare samenvattingen.
9. `src/engine/diagnosis.ts` maakt op rijfeedback een nieuwe revisie.
10. `src/storage/tunes.ts` bewaart maximaal 50 tunes in `localStorage`.
11. `src/storage/carOverrides.ts` bewaart bevestigde veer-slidergrenzen per auto.

## Automatisch onderhoud

- `.github/workflows/weekly-source-watch.yml` draait maandag om 06:17 UTC en kan
  handmatig worden gestart.
- `automation/sources.json` is de expliciete watchlist. De watcher ontdekt zelf
  geen nieuwe bronnen.
- Officiële auto-identiteit en MIT-gelicentieerde TuneLab-data mogen alleen via
  een geteste PR veranderen.
- Tuninggidsen, release notes en formuleclaims worden uitsluitend gerapporteerd.
- Bij physics-relevante release notes vraagt het onderhoudsissue hard om een
  extra handmatige Codex-researchrun.
- Support-bronnen krijgen één retry; botblokkade wordt `unreachable` en breekt de
  rest van de run niet.
- De Codex-researchrun draait aanvankelijk wekelijks. Na drie opeenvolgende
  magere runs moet hij voorstellen het ritme naar maandelijks te verlagen.

## Bewust bekende beperkingen

- De auto-catalogus bevat geen betrouwbare volledige upgradeset per auto.
- De 618 buildprofielen zijn afgeleide strategieprofielen. Zij bewijzen geen
  onderdeelbeschikbaarheid of PI-kosten.
- De gebundelde catalogus bevat exact de 618 officiële rosterrecords. TuneLab
  levert alleen technische aanvulling; onzekere profielmatches vallen terug op
  generiek advies.
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
- De nieuwe PR Stunt-richtingen zijn bron- en scenariogestuurd. Exacte ride-height
  stappen, ramp speed en locatiegebonden targets wachten op praktijkvalidatie.
- Damping is nog niet gewichtsgeleid en de huidige road spring-percentages zijn
  nog niet via telemetry gevalideerd. Dit zijn de eerstvolgende fundamentele fixes.
- De PI-class caps en R-range zijn via de officiële carlist vastgesteld op
  `D400/C500/B600/A700/S1 800/S2 900/R998`.
- Er is geen account, synchronisatie tussen apparaten of backend.
- Tunes op de desktop en telefoon zijn daarom aparte lokale collecties; JSON is de
  huidige overdrachtsmethode.
- De repository is openbaar omdat het gebruikte GitHub-account anders geen Pages
  ondersteunt. Er staan geen persoonlijke tunes of geheimen in de repository.
- De bronbewaker is geen zoekmachine. Volledig nieuwe bronnen blijven afhankelijk
  van de afzonderlijke researchautomatisering.
- Een officiële auto zonder TuneLab-match behoudt officiële klasse, PI en
  aandrijving, maar krijgt geen verzonnen gewicht of gearing; ontbrekende
  technische waarden moeten in-game worden bevestigd.

## PWA-incident 11 juni 2026

Release `61b4083` kon bij bestaande mobiele installaties een grijs scherm geven.
De oude service worker cachete HTML eerst, cachete gehashte JavaScriptbundels niet
atomair mee en verwijderde de vorige cache direct. Omdat GitHub Pages `index.html`
nog maximaal tien minuten kon cachen, kon oude HTML verwijzen naar een bundel die
na deployment niet meer bestond. De fetch-fallback antwoordde bij die mislukte
JavaScriptrequest bovendien met HTML.

Herstel vanaf cache `fh6-tune-v6`:

- de actuele HTML en alle daarin genoemde gehashte assets worden tijdens installatie
  als één release gecachet;
- navigatie gebruikt netwerk-eerst en omzeilt de HTTP-cache;
- niet-navigatierequests krijgen nooit meer `index.html` als foutfallback;
- service-workerregistratie staat in `index.html`, zodat updates ook werken wanneer
  de React-bundel niet start;
- open clients worden na de v6-activatie eenmaal herladen;
- de vorige bundel `public/assets/index-YQYEjLgL.js` blijft tijdelijk beschikbaar
  om bestaande v5-clients te laten herstellen.

## Laatst uitgevoerde kwaliteitscontrole

Op 12 juni 2026 voor app `0.8.0`:

- ESLint schoon in een schone tijdelijke runtime.
- 95 Vitest-tests geslaagd, inclusief vijf subtype-scenario's, Speed- en
  Jump-varianten, Drift Zone RWD, Trailblazer Cross Country en de nieuwe UI-flow.
- Pages-productiebuild geslaagd.
- TuneLab-tab, vergelijkingsknop, vergelijkingsmodal en bijbehorende UI-state zijn
  verwijderd; de MIT-licentie en interne compatibele baseline blijven behouden.
- Service-workercache `fh6-tune-v11` staat klaar voor de atomaire update.
- De lokale render-QA corrigeerde Danger Sign van een te brede Mixed/Rally-basis
  naar Road/All-round met een expliciete stuntvolgorde.
- Browserbeleid aangescherpt: behandel `CreateProcessWithLogonW failed: 267` als
  een historische/omgevinggebonden fout, test de ingebouwde Browser iedere sessie
  opnieuw en gebruik Playwright alleen na een verse mislukking. In deze workspace-
  sessie faalde ook de schone hertest, waarna de Pages-achtige kandidaat met de
  Playwright CLI is gecontroleerd.
- Pages-achtige render-QA geslaagd op 390 x 844 voor de volledige RX-7 -> PR Stunt
  -> Danger Sign -> resultaatflow; techniekkaart, Jump-waarschuwingen en het enige
  persoonlijke advies zijn zichtbaar zonder consolefouten.
- Op 320 x 844 is geen horizontale overflow; autodatabase, buildprofielen, lokale
  assets en fonts laden.
- Een bestaande sessie migreerde na vervanging van de release naar de nieuwe
  gehashte asset zonder leeg scherm. Na een eerste online bezoek herlaadt de app
  met service-worker cache `fh6-tune-v11` volledig offline.

Op 11 juni 2026 voor Build Guide `0.5.0`:

- ESLint schoon.
- 77 Vitest-tests geslaagd in de gezonde tijdelijke runtime.
- Pages-productiebuild geslaagd.
- `R`-klasse, oude `X`-migratie, profielvolgorde en Cross Country-banden zijn
  afgedekt met regressietests.
- Seizoen blijft gescheiden van eventondergrond; zomer-/winterdruk, Rain-compound,
  Winter zonder geforceerde Snow Tires en legacy-import zijn afgedekt.
- Profielgenerator levert 618 versieerbare buildprofielen.
- Catalogus en profielset bevatten dezelfde 618 officiële identiteiten; iedere
  stock class/PI-combinatie wordt tijdens generatie hard gevalideerd.
- Mobiele Build Guide gecontroleerd op 390 x 844 en 320 x 844.
- Geen horizontale overflow op 320 px en geen consolefouten.
- Gecontroleerde flow: 1992 Mazda RX-7 Type R toont het juiste profiel; wijziging
  naar Rally + Mixed houdt de gebruikerskeuze leidend en toont Rally suspension.
- Bronkaarten, Nederlandse confidence-labels en Engelse FH6-onderdeelnamen
  gecontroleerd.
- Service-worker cache `fh6-tune-v8` laadt de app, autodatabase en het RX-7-profiel
  na een volledig offline herladen.
- Golden tests dekken lichte RWD, zware AWD en voor-zware FWD ARB-bereiken.
- Veerinterpolatie, FWD-omkering, ontbrekende/ongeldige grenzen, Quick/Advanced
  gearing en oude JSON-import zijn afgedekt.
- Build en echte testuitvoer uitgevoerd in `C:\tmp` omdat de npm-shims in de
  Google Drive-map beschadigd zijn en daar processen alleen schijnbaar starten.
- Lokale browsercontrole geslaagd op 390 x 844 en 320 x 844 zonder horizontale
  overflow of consolefouten.
- Gecontroleerde flow: per-auto veergrenzen bewaren, Quick zonder gearing,
  Advanced met redline-uitleg en berekende final drive.
- De ingebouwde Codex-browser kon door een Windows-runtimefout niet starten;
  in die sessie zijn dezelfde controles uitgevoerd met de Playwright CLI-fallback.
- GitHub Pages workflow `27345829984` en deployment zijn geslaagd vanaf releasecommit
  `ff6e475`.
- De echte live URL is getest op 390 x 844: gewijzigde invoerflow, autodatabase,
  lokale fonts, assets, service worker en console zijn in orde.
- Na een eerste online bezoek herlaadt de live app met autodatabase ook offline.
- De uitgebreide research-backlog en Build Guide-UI hebben 77 groene Vitest-tests,
  schone ESLint en
  een geslaagde Pages-build in de gezonde tijdelijke runtime.
- De componenttest dekt zichtbare waarschuwingen, capability-labels en exclusieve
  Sport/Race Differential-selectie.
- Er is voor deze laatste UI-ronde geen nieuwe visuele browser-QA uitgevoerd,
  omdat de ingebouwde Codex-browser in die sessie faalde met Windows-fout
  `CreateProcessWithLogonW failed: 267`.
- Service-workercache `fh6-tune-v10` forceert een atomaire update naar app `0.7.0`.
- De diagnoseflow bewaart vanaf `0.7.0` de voorgaande revisie, koppelt testcontext
  aan de nieuwe revisie en toont de volledige keten terug in de app.
- De volledige garage kan vanaf `0.7.0` als één JSON-bestand worden geëxporteerd
  en via de bestaande import worden hersteld.
- 82 Vitest-tests zijn groen, inclusief React-interactietests van handmatige invoer
  via diagnose naar een geschiedenis met twee revisies en van de mobiele
  installatie-instructies.
- De in-app Browser kon in die sessie op 12 juni 2026 niet starten door Windows-fout
  `CreateProcessWithLogonW failed: 267`; er is toen geen externe fallback gebruikt.

### Foundation Fix Sprint A

Op 11 juni 2026 zijn audititems A3-A6, B1-B5, C3, C5, C6 en C8 verwerkt:

- 65 Vitest-tests geslaagd in `C:\tmp\fh6-tune-runtime`;
- ESLint schoon;
- Pages-productiebuild geslaagd;
- TuneLab-baseline blijft apart; de FH6-correcties staan in `improved.ts`;
- de in-app Browser-runtime startte in die sessie niet door Windows-fout
  `CreateProcessWithLogonW failed: 267`, waardoor geautomatiseerde render-QA
  lokaal niet opnieuw kon worden uitgevoerd.

Wacht nog op Jeffs in-game of telemetry-validatie:

- gewichtsgeleide damping (A1);
- lagere, gewichtsgeleide spring targets (A2);
- volledige numerieke Drift- en Drag-suspension/brake-branchcorrecties;
- promotie van Mechanical/Aero Balance van verificatietip naar rekenregel;
- rear toe-in sign voor diagnose.

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

De oorspronkelijke P1-items voor testritcontext, geschiedenis, garage-export en
mobiele installatiehulp zijn in app `0.7.0` verwerkt.

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
