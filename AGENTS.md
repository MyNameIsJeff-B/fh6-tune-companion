# FH6 Tune Companion - Agent Instructions

Deze instructies gelden voor iedere agent die in deze repository werkt.

## Productwaarheid

- Dit is een mobiele, offline-first FH6 Tune Companion voor persoonlijk gebruik.
- De actuele live app staat op:
  <https://mynameisjeff-b.github.io/fh6-tune-companion/>
- De gekozen visuele richting is **Garage Rail / richting 2**. Behoud de huidige
  look, compacte mobiele flow, grote touchvlakken en FH6-achtige hiërarchie.
- Herontwerp of versimpel de UI niet zonder expliciete toestemming van de gebruiker.
- Nederlands is de hoofdtaal. Engelse FH6-termen mogen blijven waar ze invoer in
  de game herkenbaarder maken.
- De gebruiker wil dat technische stappen zoveel mogelijk door de agent worden
  uitgevoerd. Vraag alleen om handmatige actie als account-, browser- of
  permissie-interactie echt niet kan worden overgenomen.

## Betrouwbaarheid boven schijnprecisie

- TuneLab is een wiskundige baseline, niet de eindwaarheid.
- Toon het verbeterde advies standaard en houd de baseline optioneel vergelijkbaar.
- Verzin nooit voertuigdata, upgradebeschikbaarheid, PI-kosten of sliderbereiken.
- Markeer ontbrekende of onbevestigde waarden als onzeker.
- Praktijkfeedback van de gebruiker met concrete auto/build/discipline weegt
  zwaarder dan generieke calculatorregels. Leg wijzigingen wel vast in tests.
- Commerciële databases, gesloten formules en accountgebonden presets mogen niet
  worden gekopieerd.
- Behoud TuneLabs MIT-vermelding in `licenses/TUNELAB-MIT.txt`.
- Gebruik voor definitieve merkbeelden alleen officiële of aantoonbaar echte
  bronnen. AI-beelden zijn geen huisstijlwaarheid.

## Centrale versies

Pas modelversies alleen aan wanneer het gedrag of de brondata daadwerkelijk
wijzigt:

- App/package: `package.json`
- Tune-engine, baseline en catalogus: `src/domain/defaults.ts`
- Build Guide: `src/build-guide/engine.ts`
- Opslagsleutel: `src/storage/tunes.ts`
- Onderzoeksdatum en bronnen: `docs/BUILD_GUIDE_RESEARCH.md`

Een gewijzigde engine mag bestaande opgeslagen tunes niet stilzwijgend herschrijven.
Tunes bewaren hun eigen engine-, baseline- en catalogusversie.

## Architectuurgrenzen

- `src/engine/baseline.ts`: TuneLab-baseline en resultaatopbouw.
- `src/engine/improved.ts`: eigen uitlegbare correctieregels.
- `src/engine/diagnosis.ts`: voorspelbare feedbackaanpassingen en revisies.
- `src/engine/summaries.ts`: samenvattingen opnieuw afleiden na iedere wijziging.
- `src/build-guide/engine.ts`: upgradevolgorde en capability-afleiding.
- `src/build-guide/sources.ts`: bronnen met expliciete beperkingen.
- `src/domain/types.ts`: gedeelde data-contracten.
- `src/storage/tunes.ts`: lokale opslag, import/export en deeltekst.
- `src/App.tsx`: hoofdflow en schermcoördinatie; stop nieuwe rekenregels hier niet in.

Houd calculator, brondata en correctieregels gescheiden. Voeg nieuwe regels toe in
de juiste engine en dek ze af met tests.

## Functionele contracten

- Flow: auto -> build -> doel/geavanceerde invoer -> advies -> diagnose -> opslaan/delen.
- Acht modi blijven ondersteund: Race, Touge, Wangan, Drift, Drag, Rally,
  All-round en Rain.
- Resultaatvolgorde blijft: banden, gearing, alignment, ARB, springs, damping,
  aero, brakes en differential.
- Alleen onderdelen die door de gekozen build verstelbaar zijn worden als
  beschikbaar getoond.
- Autowissel wist het vorige Build Guide-plan en herstelt standaard capabilities.
- Diagnose maakt een nieuwe revisie met `parentRevisionId`; muteer het oude
  resultaat niet.
- Opslag blijft lokaal. Er is geen account, backend of cloudsync in de huidige versie.
- JSON-import moet oude geldige tunes blijven accepteren of een expliciete migratie
  krijgen.

## PWA en publicatie

- GitHub Pages draait vanuit de openbare repository
  `MyNameIsJeff-B/fh6-tune-companion`.
- Iedere afgeronde app-taak moet eindigen met een gewone, bereikbare en geteste
  URL waarop de gebruiker dezelfde avond kan spelen en praktijkfeedback kan
  verzamelen. Alleen een lokale build, map, screenshot of buildbestand geldt niet
  als oplevering.
- Bescherm de laatst werkende live versie totdat de nieuwe kandidaat lint, tests,
  Pages-build en relevante mobiele controles heeft doorstaan. Publiceer daarna
  dezelfde taak nog naar GitHub Pages en verifieer de echte URL.
- Is werk bewust nog niet geschikt voor `main`, werk dan geïsoleerd en lever vóór
  het beëindigen van de taak een aparte bereikbare test-URL. Laat onaf werk nooit
  de laatst werkende test- of liveversie vervangen.
- Stop alleen zonder publicatie wanneer de gebruiker dat expliciet vraagt of een
  externe blokkade publicatie onmogelijk maakt. Leg die blokkade dan concreet vast.
- Pushes naar `main` starten `.github/workflows/pages.yml`.
- De Pages-build gebruikt `npm run build -- --mode pages`.
- `vite.config.ts`, `manifest.webmanifest`, `src/main.tsx`, databestandpaden en
  `public/sw.js` moeten zowel `/` lokaal als `/fh6-tune-companion/` online ondersteunen.
- Verhoog de cacheversie in `public/sw.js` wanneer shell-assets of offlinegedrag
  ingrijpend wijzigen.
- Commit `dist/` en `node_modules/` niet.

## Windows en Google Drive

- Gebruik in PowerShell `npm.cmd` en `npx.cmd`.
- De repository staat in een gesynchroniseerde Google Drive-map. npm kan daar
  soms vastlopen op bestandslocks.
- Als dat gebeurt, gebruik een tijdelijke runtimekopie onder
  `C:\tmp\fh6-tune-runtime`, maar behandel de repository als bronwaarheid en kopieer
  alleen bewuste bronwijzigingen terug.
- Gebruik `apply_patch` voor handmatige bronwijzigingen.

## Verplichte controle voor een push

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build -- --mode pages
```

Controleer bij UI-, PWA- of datapadwijzigingen ook:

1. De live of preview-app op ongeveer 390 x 844.
2. Geen horizontale overflow op 320 px.
3. Autodatabase en lokale fonts laden.
4. Service worker bestuurt de pagina na herladen.
5. De app opent na een eerste online bezoek ook offline.
6. Opslaan, herladen, JSON-export/import en delen blijven werken als die code is geraakt.

Na een geslaagde push:

1. Wacht tot workflow `Publiceer app` is geslaagd.
2. Open de echte Pages-URL, niet alleen een lokale preview.
3. Controleer minimaal paginalading, mobiele breedte, gewijzigde hoofdflow,
   asset- en datalading en relevante consolefouten.
4. Rapporteer de werkende URL als onderdeel van de oplevering.

## Documentatie bij wijzigingen

- Werk `docs/PROJECT_HANDOFF.md` bij als status, roadmap, publicatie of bekende
  beperkingen veranderen.
- Werk `docs/BUILD_GUIDE_RESEARCH.md` bij wanneer bronnen of bronclaims wijzigen.
- Houd README kort en gebruikersgericht.
- Laat de repository na afronding schoon achter en rapporteer de live link plus
  uitgevoerde controles.
