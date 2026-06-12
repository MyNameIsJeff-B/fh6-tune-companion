# Research Round 5 — Disciplines, Tweede Dempingformule & Capability-vragen

Compiled: 11 June 2026 (Cowork). Grote ronde: ForzaTune-gids, drag, drift, Touge, Wangan, plus harde bevestigingen voor lopende audit-items. Voedt Sprint B en de Build Guide-backlog.

## Toe: derde onafhankelijke bevestiging — A6 wordt definitief

ForzaTune's eigen gids (de bron achter de commerciële calculator): "Toe settings cause less predictable results in Forza Horizon… leave toe settings at zero in Forza Horizon. Set front and rear toe to 0 degrees." Dat is naast Jeffs eigen bevinding en het forza.guide-signconflict de derde bron. Besluit aangescherpt: **front én rear toe 0.0 als Horizon-default; de feelStability rear-toe-regel wordt verwijderd, niet gepauzeerd** (het ARB-deel van die regel blijft). De toe-sign-screenshotcheck blijft op de verificatielijst voor het diagnoselaag-scenario "RWD snapt los → rear toe-in", maar de default is beslist.

## Demping: tweede gewichtsformule + derde "te slap"-bevestiging

- **ForzaTune-vuistregel** (per-as, gewichtsverdeling): "voor elke procent frontgewicht minder: −0.2 van front rebound en damping, +0.2 op rear." Een lineaire slope van 0.2 sliderpunt per gewichtsprocent — tweede onafhankelijke gewichtsgeleide methode naast de forza.guide-formule (MinBump + FrontWeight/200lb × 0.1, rebound = bump ÷ 0.4). Richting identiek, slope verschilt; de telemetriesessies kiezen.
- **Grindout race-baseline: rebound ~18 / bump ~6** (ratio 33% ✓ in het 30–55-venster). Derde bron die impliceert dat onze rebound (~8 voor elke auto) veel te laag staat: forza.guide-zone 12–16, grindout 18, wij 8. A1 blijft de belangrijkste Sprint B-fix.

## Camber wordt compound-bewust (nieuw klein verbeterpunt)

ForzaFire: road race front −1.0° tot −2.0°, rear −0.5° tot −1.0°; **richting −2.0 bij slicks, richting −1.0 bij sport tires**. Onze vaste −1.5/−1.0 zit netjes in het midden, maar een compound-afhankelijke schaal (sport → milder, slick → agressiever) is een goedkope, gesourcete regelverbetering. P2.

## Twee capability-vragen voor in-game verificatie

1. **Suspension-tiers**: ForzaFire stelt dat Street én Sport Springs & Dampers alignment/springs/damping/ride height gelockt houden, en dat Street "usually" alleen de tire pressure slider ontgrendelt — wat impliceert dat **volledig stock suspension mogelijk zelfs tire pressure locked houdt**. F.A.T.T.Y v2.2 bevestigt: "Street and Sport lock all spring and damping sliders." Onze capability-model zet `tires: true` altijd aan. Jeff-check: één stock auto, kijk of de pressure-slider beweegt. Zo nee → capability-model aanpassen.
2. **Rally/Off-Road Differential tier** bestaat op sommige chassis: zelfde unlock-structuur als Race maar waardes geoptimaliseerd voor los. Build Guide adviseert nu generiek "Race differential" — moet per discipline het juiste diff-type noemen (Race voor road, Rally/Off-Road voor dirt/CC, Drift diff voor drift).

## Drag — branch mist squat-logica, plus drie verrassingen

forza.guide drag-sectie + bossdown: **soft rear springs voor squat** (gewicht op de aangedreven as bij launch) — onze drag-branch gebruikt dezelfde class-gebaseerde veerpercentages als road, geen squat-differentiatie. Drie gesourcete verrassingen voor de Build Guide-teksten: (1) **Rally suspension is vaak een prima drag-startpunt**; (2) **Race brakes zijn op drag een gewichtsbesparing** — lichter dan stock, remkracht irrelevant op een rechte lijn; (3) **skip chassis-bracing** (gewicht voor handling die je niet nodig hebt) en pak een lichtere hood. Transmissie: 4-speed (drift box) makkelijker te tunen, elke race box geeft clutchless shifts; basis-diffs gedragen zich op drag vrijwel identiek. Onze drag improved-regel (front pressure 3.45 bar voor rolweerstand) is FH5-carryover — werkt vermoedelijk nog, telemetrie-verificatie laag-prio.

## Drift — derde en vierde datapunt tegen de huidige branch

Naast mmogah's soft-soft ARB (~8/8): **brake balance ~70% front** geadviseerd waar onze drift-branch 46% (rear-biased) uitstuurt, en "Formula Drift cars in FH6 run ARBs fully soft". Plus een harde game-regel met Build Guide-impact: **RWD is verplicht voor Drift Zone-scoring — AWD telt niet mee**, en stability/traction control moeten uit. De drift-branch (TuneLab/FH5-lineage: stijve rear ARB 28–48, rear-biased brakes) wijkt nu op drie punten af van FH6-bronnen. D5 geüpgraded van "low-confidence conflict" naar "branch-review vereist": drift-communitycheck (OPTN Discord) + één testsessie. Build Guide krijgt sowieso: drift build → RWD vereist (Drift Zones), assists-uit-advies.

## Touge — eindelijk eigen identiteit voor de branch

FH6 heeft vijf class-restricted Touge Battle-routes (o.a. Mt. Haruna B600 — Initial D's Akina; Hakone hairpins; Hokkaido sneeuw/nat). Gesourcete Touge-tuning afwijkend van onze huidige road-behandeling: **sport compound boven race-compound voor warm-up speed op koude bergtemperaturen** (koppelt aan de winter-bevinding B2!); front splitter + minimale rear wing — "touge punishes drag, not downforce"; soft front ARB / iets stijvere rear voor hairpin-rotatie; RWD diff ~60% accel / **~30% decel** voor stabiele downhill-entries (onze road-decel is 10–18); kortere gearing want topsnelheid wordt zelden gehaald. Lichtgewicht RWD domineert. Dit zijn vijf concrete Touge-regels voor Sprint B/C — de branch verdient meer dan de huidige bump-verlaging.

## Wangan — C7 heeft nu inhoud

Wangan-advies (FH6-wiki's): langere gearing voor expressway-topsnelheid, individuele gears gelijkmatig gespatieerd in de peak-power RPM-band, lage downforce. Samen met TuneLab's Wangan freqMult (f 1.04 / r 0.97) is er genoeg voor een minimale eigen branch: tallere FD-bias, lage-aero-advies, stabiliteitsnoot. 

## Bronnen-status

- **HokiHoshi heeft een FH6-video**: "How To Build & Tune in Forza Horizon 6 | Basic Refresher & FH6 Changes Guide" (±1 maand oud) — door Apex Tune Hub gebruikt als standaard workflow-referentie. Claims samenvatten is een open taak (transcript of Jeff kijkt 'm).
- **kboosting**: niet direct gevonden in deze ronde; F.A.T.T.Y-lineage verder volledig gedekt via forza.guide zelf. Laag-prio.
- **EV-specifieke tuning**: niets gevonden — FH6-bronnen behandelen EV's niet apart. De `ev`-vlag in cars.ts blijft vooralsnog zonder engine-gevolg; gearing-secties zouden bij EV's (1 gear) wel onderdrukt moeten worden — check of de app dat al doet via gears-input. Open item.
- **OPTN-gids**: nog steeds niet direct gefetcht; route via Discord of site-navigatie. Open.

## Implicatie-overzicht voor sprintplanning

Sprint A addendum blijft zoals in ROUND_3 (A5, A6 — waarbij A6 nu definitief de rear-toe-regel verwijdert). Sprint B groeit: A1 (demping, nu met twee formules om te A/B'en), A2 (veren), C1/C2/C4, D2 (diff-granulariteit), drift-branch-review, Touge-regels, Wangan-branch, drag-squat. Build Guide-backlog: D1 (drivetrain), D3 (widebody), diff-type per discipline, drift-RWD-regel, drag-teksten.
