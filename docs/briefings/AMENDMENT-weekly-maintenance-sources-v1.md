# Amendment — weekly-maintenance-automation: verplichte bronnenlijst & signal-tier

Agent: Codex. Dit amendement hoort bij jouw plan "Zelf-updatende FH6-kennislaag" en is bindend bovenop dat plan. Het plan zelf is goedgekeurd (architectuur, drie uitkomsten, PR-discipline, geen auto-merge, geen geschatte data). Drie aanvullingen:

## 1. Verplichte watchlist in `automation/sources.json`

De vage categorie "overige toegestane openbare gidsen" wordt vervangen door deze expliciete lijst. Elke regel: ID, tier, wat te detecteren.

**Tier `data-update` (mag automatisch records wijzigen, via PR):**
- `forza-official-news` — forza.net nieuws + Series-pagina's: nieuwe auto's, autolijsten.
- `tunelab-releases` — github.com/super-android/tunelab releases (GitHub API): nieuwe versies, gewijzigde databestanden. Provenance-note (gedecompileerde ForzaTune-constanten, zie RESEARCH_ROUND_2) blijft verplicht bij elke import.

**Tier `review-required` (alleen rapporteren, nooit automatisch verwerken):**
- `forza-release-notes` — support.forza.net release notes: trefwoorden handling, tires, tyre, PI, drivetrain, physics, suspension, balance → reviewrapport + verplichte hercheck-flag op COMMUNITY_META_NOTES-claims.
- `forza-dataout-doc` — support.forza.net Data Out-documentatie (artikel 51744149102611): packet-formaatwijzigingen.
- `forza-guide-cheatsheet` — forza.guide FH6 Tuning Guide. Dit is de upstream-bron van het halve ecosysteem (F.A.T.T.Y, meerdere apps); elke inhoudelijke wijziging hier is per definitie review-waardig.
- `manteomax-fh6` — ManteoMax spreadsheet-index: detecteer of de FH6-sheets gepubliceerd zijn (status-check, geen inhoud-diff). Bij publicatie: issue met hoge prioriteit — dit is een lang openstaand kennisgat.
- `optn-fh6` — OPTN FH6 setup-formatter/gids-pagina: wijzigingen of nieuwe gidspublicatie.
- `fatty-changelog` — Nexus mod 113 publieke changelog-tekst: nieuwe correcties op forza.guide-lineage waardes.
- `forzafire-guides` — de vijf gebruikte ForzaFire-gidsen (platform & handling, tires & rims, aero, drivetrain, conversions): inhoudelijke wijzigingen.
- `forzatune-horizon-guide` — ForzaTune's openbare Horizon-gidspagina's: formule- of advieswijzigingen (signaal; nooit waardes overnemen — commercieel).

**Tier `signal` (nieuw, derde type: RSS-gebaseerd, alleen nieuwe-item-detectie, alleen melden):**
- `reddit-forzahorizon` — RSS-feed van r/ForzaHorizon (en r/ForzaOpenTunes indien actief voor FH6): nieuwe posts met trefwoorden tune, tuning, setup, meta, patch, PI in de titel. Wekelijkse top, max 10 items in het rapport.
- `sepi-youtube` — YouTube-kanaal-RSS van Sepi: nieuwe video's met Forza/FH6 in de titel.
- `hokihoshi-youtube` — idem HokiHoshi.
Signal-items verschijnen uitsluitend in `automation/report.json` en het onderhoudsissue; geen snapshots-diffing van volledige pagina's, geen datawijzigingen, ooit.

**Geschrapt:** forums.forza.net (sluit binnenkort; kennis is geëxtraheerd in docs/research/). Eénmalige optionele check of thread 832103 op archive.org staat mag in de eerste run, daarna verwijderen.

## 2. Bekende bot-detectie

support.forza.net blokkeert geautomatiseerde fetches aantoonbaar (bot-detectie geconstateerd op 12 jun 2026). Behandel beide support.forza.net-bronnen als bekend-flaky: nette User-Agent, één retry met backoff, en `unreachable` zonder de run te laten falen. Documenteer in sources.json per bron het verwachte faalgedrag.

## 3. Expliciete non-goal: bron-ontdekking

De pijplijn bewaakt bekende bronnen; hij ontdekt geen nieuwe. Nieuwe gidsen, tools en community-bronnen vinden blijft een periodieke handmatige researchronde (Cowork/Jeff). Zet deze zin letterlijk in de README van `automation/` zodat niemand de pijplijn verwart met een zoekmachine, en voeg een terugkerende regel toe aan het maandelijkse onderhoudsissue: "Overweeg een nieuwe Cowork-researchronde als er >6 weken geen is geweest."

## Acceptatie bovenop het bestaande testplan

- sources.json bevat alle bovengenoemde IDs met tier en detectiebeleid; schema-validatie dekt het nieuwe `signal`-type.
- Proefrun toont: een gesimuleerde ManteoMax-publicatie → hoge-prioriteit-issue; een gesimuleerde Reddit-RSS-item-match → signal-regel in rapport; support.forza.net-block → unreachable zonder run-failure.
- Rapport en issue blijven Nederlands, game-termen Engels, conform AGENTS.md.
