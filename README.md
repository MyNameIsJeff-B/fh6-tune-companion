# FH6 Tune Companion

## Online openen

Open op telefoon of computer:

<https://mynameisjeff-b.github.io/fh6-tune-companion/>

De app kan daarna via de browser aan het beginscherm worden toegevoegd en blijft
na het eerste bezoek ook offline bruikbaar.

## Openen

Dubbelklik op `Start-FH6-Tune.cmd`. De app opent daarna lokaal in je browser en heeft geen account of internetverbinding nodig.

Mobiel geoptimaliseerde, offline-first PWA voor persoonlijke FH6-tunes.

## Build Guide

De Nederlandstalige Build Guide koppelt de gekozen auto aan een lokaal profiel met
archetype, waarschijnlijke rollen, upgradevolgorde en vermijd-lijst. Daarna maakt
de app een discipline- en aandrijvingsspecifiek upgradeplan, leidt verstelbare
tuningvelden af en toont aankoopwaarschuwingen en de tuningtoegang van de
geselecteerde onderdelen. De bronkeuzes en beperkingen staan in
`docs/BUILD_GUIDE_RESEARCH.md`.

Voor PR Stunts zijn er aparte recepten voor Speed Trap, Speed Zone, Danger Sign,
Drift Zone en Trailblazer, inclusief mismatchwaarschuwingen en techniekadvies.

Na een testrit kan een diagnose als nieuwe revisie worden opgeslagen met
testlocatie, schone ronden, besturing, assists en notities. De volledige
geschiedenis per auto en discipline blijft teruglaadbaar en de garage kan als één
JSON-bestand worden geëxporteerd.

Voor volgende ontwikkelsessies staan de bindende werkinstructies in `AGENTS.md`
en de actuele status en roadmap in `docs/PROJECT_HANDOFF.md`.

## Starten

```powershell
npm.cmd install
npm.cmd run dev
```

## Controle

```powershell
npm.cmd run automation:validate
npm.cmd run automation:test
npm.cmd run data:generate
npm.cmd run lint
npm.cmd test
npm.cmd run build -- --mode pages
```

## Automatisch brononderhoud

De publieke datasets worden reproduceerbaar gegenereerd uit `automation/data`.
Een wekelijkse GitHub Actions-workflow bewaakt bekende officiële, open-source en
communitybronnen. Veilige datawijzigingen komen als pull request; tuningclaims
worden alleen als onderhoudsissue gemeld.

De automatisering merged niets zelfstandig en importeert geen commerciële
databases of gesloten formules.

## Model

- Baseline: TuneLab `1.7.0`, MIT-gelicentieerd.
- Zichtbaar advies: `fh6-companion-0.7.0`.
- Build Guide: `build-guide-0.7.0`.
- Catalogus: actuele TuneLab v7-data plus de lokale FH6-kennislaag van 10 juni 2026.
- Tunes worden lokaal opgeslagen met engine- en catalogusversie.

De app is niet gelieerd aan Microsoft, Xbox, Turn 10 of Playground Games.

Inter en Barlow Condensed worden lokaal gebundeld onder de SIL Open Font
License 1.1; zie `licenses/FONTS-OFL-1.1.txt`.
