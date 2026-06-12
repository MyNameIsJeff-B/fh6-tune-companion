# Research Round 7 — PR Stunts: builds, tunes & community-aanpak

Compiled: 12 June 2026 (Cowork). Doel: kennismodel voor een PR Stunt-laag in de app (Build Guide + tune engine). Bronnen: bossdown PR-stuntgidsen (3-star techniek per type), gamingpromax PR-stuntgids, games.gg Danger Signs-database, fandomwire top-10 stuntauto's, ForzaFire aero-gids, fh6wiki, Grindout, game8.

## Het landschap

FH6 telt **111 PR Stunts in 5 typen**: Speed Zones, Drift Zones, Danger Signs, Speed Traps, Trailblazers — gelockt achter Wristband-tiers; hogere tiers vragen S2/X-klasse voor de zwaarste traps en signs. (Bossdown rekent ook Time Attack Circuits en Horizon Rush tot de skill-challenges — buiten scope voor nu, wel noteren als toekomstige subtypes.)

**De community-aanpak bevestigt Jeffs observatie exact**: een goede race-auto is geen goede stunt-auto. De standaardoplossing is een klein dedicated stunt-garageje — "vijf goed getunede auto's dekken elk stunttype": Jesko Absolut (traps + signs), Agera RS / 911 GT3 RS (zones), Silvia S15 / Formula Drift Supra (drift zones), Ariel Nomad / Alumicraft buggy (trailblazers). Archetypes, geen voorschrift — de app moet per stunttype een build-recept geven voor de auto die de gebruiker hééft.

## Per stunttype: scoring → build → tune → techniek

### Speed Trap — momentane topsnelheid bij de camera
- **Scoring**: snelheid op één punt. Het enige type waar pure topsnelheid alles is.
- **Build**: max vermogen; minimale aero; drivetrain vrij (stabiliteit boven alles op de run-up).
- **Tune**: beide downforce-sliders naar minimum; langste gearing (top gear ruim boven verwachte trapsnelheid); hogere druk binnen compound-band voor lage rolweerstand (drag-verwantschap).
- **Techniek** (adviestekst): run-up van 1–2 km op de langste rechte aanloop; drafting achter AI-verkeer geeft slipstream-bonus; heuvelaf aanvliegen waar mogelijk; verkeer op minimum in difficulty-settings; niet remmen vóór de camera — de bocht erna is een probleem voor later.

### Speed Zone — gemiddelde snelheid over een traject mét bochten
- **Scoring**: gemiddelde over het hele vak → snelheid én grip tellen.
- **Build**: road-racebuild met speed-bias; aero juist wél (anders dan bij traps); S1/S2-archetype met handling (Agera RS / GT3 RS; Evija FE op bochtenrijke zones).
- **Tune**: race-tune met langere gearing; aero op het gevalideerde venster (Aero Balance 0,40–0,45; game8 bevestigt onafhankelijk ~0,45 als startpunt); stabiele ARB-balans boven agressieve rotatie.

### Danger Sign — afstand na de schans
- **Scoring**: meters na launch (3-ster-targets 213–640 m). Twee factoren beslissen alles: **exitsnelheid en de schans recht raken** — een paar graden yaw zet voorwaartse snelheid om in zijwaartse drift en kost tientallen meters.
- **Build**: vermogen + acceleratie (aanlopen zijn vaak korter dan bij traps), AWD voor grip op de run-up; minimale aero — downforce drukt het vliegtraject plat en race-aero "helpt niet over jumps" (ForzaFire, CC-context).
- **Tune**: gearing lang genoeg dat de top gear niet limiteert op schanssnelheid; **landing-afstemming**: bij stuiterende of instabiele landingen eerst bump verzachten, daarna rebound licht verlagen (fh6wiki); ride height een stap omhoog voor travel-reserve bij de landing.
- **Techniek**: run-up meten in wegsegmenten, niet in autolengtes; recht raken > harder aankomen; rewind bij verkeer.

### Drift Zone — score uit hoek × snelheid
- **Scoring**: driftpunten; **RWD is verplicht voor scoring (AWD telt niet)** — al geverifieerd in Round 5; assists (TC/stability) uit.
- **Build/Tune**: bestaande Drift-mode van de app + RWD-vereiste als harde Build Guide-regel. Let op: de drift-branch staat al onder review (D5: soft-soft ARB ~8 en ~70% front brake balance vs onze FH5-lineage waardes) — de stuntlaag verwijst naar de branch en erft straks de uitkomst van die review, niet andersom.

### Trailblazer — punt-naar-punt over open terrein, op tijd
- **Scoring**: tijd; geen route — velden, bossen, rivieren. **Off-road build verplicht.**
- **Build**: maps op Cross Country: Off-Road suspension + Off-Road tires, AWD; géén race-aero (gewicht zonder nut over ruig terrein — ForzaFire noemt het expliciet verspilde PI op CC-builds); lichtgewicht/wendbaar archetype wint op open terrein van brute kracht (Nomad-les).
- **Tune**: CC-branch + ride height hoog (5–7 in per Grindout), zachte ARB/springs, +1,0 rebound t.o.v. race-baseline, diff ~10% lager over de hele linie met center 60–70% rear, kortere gearing voor herstel na jumps en langzame secties, lage druk binnen off-road-band (let op audit-item: onze Off-Road-druk zat al aan de hoge kant).

## Dwarsverbanden met bestaande kennis

- AWD + minimum rear downforce (FH6-meta, ForzaFire: drivetrain levert al rear traction) — relevant voor Speed Zone/Trap-recepten op AWD én een algemene aero-regelkandidaat (raakt C4).
- Drag-kennis (minimale aero, launch) is herbruikbaar voor Speed Trap; CC-kennis voor Trailblazer; Drift voor Drift Zone. **Alleen Danger Sign en Speed Trap/Zone hebben echt nieuwe receptelementen** (landing-demping, min-aero-top-speed, average-speed-balans).
- Stunt-targets per locatie (games.gg databases met afstanden/snelheden per stunt) bestaan — bewust buiten scope: de app adviseert recepten, geen 111-locatiedatabase. Eventueel later: gebruiker voert target in, app zegt of de build het aankan.

## Voorgesteld app-model (bouwstenen voor Codex)

1. **Build Guide**: nieuw goal-niveau "PR Stunt" met subtype-keuze (5 typen). Mapping: trailblazer→Cross Country-profiel, drift_zone→Drift-profiel + RWD-regel, speed_zone→Road race + speed-focus, speed_trap→nieuw "Top Speed"-recept (drag-verwant, wel handlingminimum), danger_sign→nieuw "Jump"-recept. Per subtype een warning als de huidige auto/het drivetrain fundamenteel niet past (AWD in drift zone, straatauto in trailblazer).
2. **Tune engine**: twee nieuwe mode-varianten — "Speed" (min aero, langste gearing, druk hoog-in-band, stabiliteits-bias) en "Jump" (landing-demping: bump zachter, rebound licht lager, ride height +1 stap, min aero, gearing headroom); Speed Zone als Race-mode met speed-lean; Drift Zone en Trailblazer hergebruiken bestaande branches met stunt-specifieke adviesteksten.
3. **Techniektips per subtype** in het resultaat (run-up, drafting, recht raken, assists uit, verkeer-setting) — past bij het advies-karakter van de app.
4. **Tests**: per subtype een scenario-test (drivetrain-warning, aero-richting, gearing-richting, landing-demping aanwezig).
