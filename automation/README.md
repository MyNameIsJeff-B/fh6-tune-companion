# FH6 bronbewaker

Deze map bevat de reproduceerbare bronlaag en de wekelijkse bronbewaker.

De pijplijn bewaakt bekende bronnen; hij ontdekt geen nieuwe. Nieuwe gidsen,
tools en community-bronnen vinden blijft een periodieke researchronde.

## Werking

- `sources.json` bepaalt per bron de tier en detectiemethode.
- `data/` bevat de versioned invoer voor de app-datasets.
- `snapshots/` bewaart alleen genormaliseerde, relevante broninhoud.
- `report.json` bevat het laatste machineleesbare resultaat.
- `watch-sources.mjs` controleert bronnen en werkt veilige data-invoer bij.
- `generate-data.mjs` genereert `public/data/cars.json` en
  `public/data/build-profiles.json` deterministisch.

Tiers:

- `data-update`: officiële identiteit en MIT-gelicentieerde TuneLab-data mogen
  via een pull request wijzigen.
- `review-required`: alleen rapporteren; nooit automatisch appregels aanpassen.
- `signal`: alleen nieuwe RSS-items melden.

Voeg een bron toe door één object aan `sources.json` toe te voegen en de
configuratietest uit te breiden wanneer een nieuwe detectiemethode nodig is.

## Lokaal

```powershell
npm.cmd run automation:test
npm.cmd run automation:watch -- --dry-run
npm.cmd run data:generate
```

De watcher gebruikt geen repository secrets of betaalde diensten. Een
onbereikbare bron wordt gerapporteerd, maar maakt de overige controles niet
ongeldig.
