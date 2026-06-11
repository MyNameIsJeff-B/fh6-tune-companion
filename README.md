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

De ingebouwde Build Guide maakt een discipline- en aandrijvingsspecifiek
upgradeplan, leidt verstelbare tuningvelden af uit de geselecteerde onderdelen en
markeert onzekerheden. De bronkeuzes en beperkingen staan in
`docs/BUILD_GUIDE_RESEARCH.md`.

Voor volgende ontwikkelsessies staan de bindende werkinstructies in `AGENTS.md`
en de actuele status en roadmap in `docs/PROJECT_HANDOFF.md`.

## Starten

```powershell
npm.cmd install
npm.cmd run dev
```

## Controle

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build -- --mode pages
```

## Model

- Baseline: TuneLab `1.7.0`, MIT-gelicentieerd.
- Zichtbaar advies: `fh6-companion-0.3.0`.
- Build Guide: `build-guide-0.2.0`.
- Catalogus: actuele TuneLab v7-data plus de lokale FH6-kennislaag van 10 juni 2026.
- Tunes worden lokaal opgeslagen met engine- en catalogusversie.

De app is niet gelieerd aan Microsoft, Xbox, Turn 10 of Playground Games.

Inter en Barlow Condensed worden lokaal gebundeld onder de SIL Open Font
License 1.1; zie `licenses/FONTS-OFL-1.1.txt`.
