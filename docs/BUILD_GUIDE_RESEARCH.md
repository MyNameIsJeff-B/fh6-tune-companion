# Build Guide Research

Laatst gecontroleerd: 12 juni 2026

PR Stunt-laag en de veilige research-backlog verwerkt in appversie `0.8.0`,
tune-engine `fh6-companion-0.6.0` en Build Guide `build-guide-0.6.0`.

## Productbesluit

De Build Guide geeft een autospecifiek startprofiel plus een uitlegbaar
upgradeplan op basis van discipline, ondergrond, doelklasse, aandrijving en
voorkeur. De zichtbare Build Guide gebruikt Engelse FH6-termen om verwarring met
de Engelstalige game-interface te voorkomen.

De profielset wordt reproduceerbaar gegenereerd uit
`data/derived/car_build_recommendations.csv` en bevat 618 profielen. Zij combineert
officiële identiteit, TuneLab-basisdata, archetyperegels en lokale presets. Dit
maakt strategie en volgorde autospecifiek, maar is nadrukkelijk geen exacte
upgradecatalogus. Bronaliassen worden conservatief gematcht; onzekere varianten
vallen terug op het algemene profiel.

De uitvoerbare buildstappen volgen nu de gekozen discipline. Voor Race, Touge en
All-round wordt de autospecifieke profielvolgorde vertaald naar de zes zichtbare
stappen; Rally, Drag, Drift, Wangan en Rain hebben een disciplinevolgorde die
voorrang krijgt op een mogelijk conflicterend autoprofiel.

PR Stunt is een apart Build Guide-doel bovenop de acht bestaande tune-modi.
De subtypekeuze bewaart daardoor oude tunes en imports:

- Speed Trap gebruikt Wangan als basis met de nieuwe Speed-variant;
- Speed Zone gebruikt Race met speed-bias en Aero Balance `0,40-0,45`;
- Danger Sign gebruikt een Road/All-round-basis met de nieuwe Jump-variant;
- Drift Zone gebruikt Drift plus een harde RWD- en assists-regel;
- Trailblazer gebruikt Rally/Cross Country met Off-Road Tires en Suspension.

Iedere subtype-uitvoer bevat techniekadvies. De app importeert bewust geen
database met alle 111 locaties of stertargets.

Seizoen is een aparte context naast ondergrond. FH6 bevestigt Spring, Summer,
Autumn en Winter, met hete zomers, sneeuwrijke winters en een speelwereld die per
seizoen verandert. De app forceert niet dat iedere herfstrit nat of iedere
winterrit besneeuwd is. `Surface` blijft daarom apart staan; Snow Tires worden
alleen gekozen wanneer de gebruiker ook daadwerkelijk `Snow` selecteert.

FH6 heeft voor zover publiek verifieerbaar geen officiële complete API voor:

- upgrades per auto;
- PI-kosten per upgrade;
- het eindgewicht en de gewichtsverdeling na montage;
- beschikbare tuning-sliderbereiken.

Daarom moeten beschikbaarheid, PI, gewicht en gewichtsverdeling in de game worden
gecontroleerd voordat de tune als betrouwbaar wordt behandeld.

De app bewaart hiervoor `valuesConfirmed` in het toegepaste buildplan. Zolang die
bevestiging ontbreekt, verlaagt het tune-resultaat de zekerheid en toont het een
expliciete waarschuwing.

## Bronnen

### Officieel

- [Forza Horizon 6 Cars List](https://forza.net/news/forza-horizon-6-cars-list)
  wordt alleen gebruikt om auto-identiteit en modeljaar te bevestigen. De lijst
  bevat geen volledige upgradecompatibiliteit.
- [Forza Horizon 6 Data Out](https://support.forza.net/hc/en-us/articles/51744149102611-Forza-Horizon-6-Data-Out-Documentation)
  bevestigt dat FH6 onder andere actuele RPM, maximale motor-RPM, koppel, snelheid,
  versnelling en voertuigidentiteit via een lokale UDP-stream kan uitsturen. De
  huidige sprint bouwt nog geen telemetrie-import, maar houdt het invoermodel
  daarvoor open.
- [Xbox Wire: FH6 Japan Setting and Changing Seasons](https://news.xbox.com/en-us/2025/09/25/forza-horizon-6-japan-setting-2026/)
  bevestigt de vier seizoenen, hete zomers, sneeuwrijke winters en dat seizoenen
  de speelwereld merkbaar veranderen. De bron bevestigt niet dat ieder event
  binnen een seizoen hetzelfde weer heeft.

### Calculators en gidsen

- [ForzaTune tuning guide](https://forzatune.com/guide/the-fully-updated-forza-tuning-guide/)
  onderbouwt de rol van bandencontact, gewicht, veren, ARB's, demping en
  differentieel. De gids bevestigt ook dat verstelbare race-onderdelen nodig zijn
  om relevante tuningvelden vrij te geven.
- [ForzaTune Pro](https://play.google.com/store/apps/details?id=com.flamefrontstudios.forzatune7)
  vermeldt FH6-ondersteuning als beta op 4 juni 2026. De app wordt alleen als
  product- en workflowreferentie gebruikt; gesloten formules zijn niet overgenomen.
- [ForzaTune: power/torque graph ontbreekt](https://forzatune.com/tuning-a-car-that-doesnt-have-a-power-and-torque-graph/)
  onderbouwt de handmatige telemetriemethode voor redline: zoek de begrenzer tijdens
  een testrit en trek circa 100-200 RPM af. De app toont dit als invoerhulp.
- [ForzaFire FH6 Platform & Handling](https://www.forzafire.com/guides/forza-horizon-6-platform-and-handling-tuning-guide)
  levert de gebruikte conservatieve ARB-bereiken per aandrijving en de
  klasse-afhankelijke spring-sliderpercentages. De gids bevestigt ook de nieuwe
  `R`-topklasse in plaats van `X`. De intern tegenstrijdige ARB-formule verderop
  in dezelfde gids is bewust niet overgenomen.
- [ForzaFire FH6 Tires & Rims](https://www.forzafire.com/guides/forza-horizon-6-tires-and-rims-tuning-guide)
  onderscheidt Rally Tires voor Dirt van Off-Road Tires voor Cross Country. De
  Build Guide gebruikt dat onderscheid, maar blijft beschikbaarheid en PI-kosten
  per auto in de game laten bevestigen.
  Dezelfde gids onderbouwt dat hogere druk warmteopbouw afremt en lagere druk
  koude banden sneller helpt opwarmen. De droge weg-baseline gebruikt `+0,05 bar`
  in Summer en `-0,10 bar` in Winter. De sterkere Winter-correctie volgt ook de
  gecontroleerde EZG-test waarin tire temperatures en rondetijd op koud asfalt
  duidelijk terugliepen.
- [ForzaFire FH6 Platform & Handling](https://www.forzafire.com/guides/forza-horizon-6-platform-and-handling-tuning-guide)
  ondersteunt conservatieve ARB-bereiken en het eerder inzetten van Race Brakes
  bij snelle wegbuilds. De app adviseert Race Brakes daarom vanaf A-class op Road.
- [QuickTune Pro](https://forzaquicktune.com/guides/) laat zien dat een
  build-assistent alle gekozen upgrades moet meenemen en ongeschikte combinaties
  moet signaleren. De publieke informatie bevestigt op 10 juni 2026 nog geen
  FH6-ondersteuning, dus er zijn geen FH6-feiten uit overgenomen.
- [ForzaLabs Upgrade Guide](https://forza.labsgg.com/upgrade-guide) benadrukt
  dat motorvermogen alleen niet genoeg is en dat een build vermogen en handling
  moet balanceren. De site claimt een grote FH6-upgradedatabase, maar exacte
  builddata en calculators zijn accountgebonden en zijn niet gekopieerd.
- [Tune It Yourself](https://www.tuneityourself.co.uk/) werkt in vaste
  meetstappen voor trackanalyse, rijhoogte, onderstel, remmen en gearing. De
  methode ondersteunt onze stapsgewijze diagnose; FH6-ondersteuning is niet
  bevestigd.

### Open community

- BossDown PR Stunt-gidsen onderbouwen de techniek per subtype: lange run-up en
  drafting voor Speed Traps, een rechte ramp-hit voor Danger Signs, assists uit
  voor Drift Zones en lijnkeuze door terrein voor Trailblazers.
- gamingpromax bevestigt dat stuntdisciplines om dedicated buildarchetypes vragen
  en dat een goede race-auto niet automatisch een goede stunt-auto is.
- games.gg is alleen gebruikt voor het bereik van Danger Sign-targets en de rol
  van launch speed; de locatiedatabase is niet overgenomen.
- ForzaFire aero-richting ondersteunt minimum downforce voor top speed en het
  vermijden van nutteloze race-aero op jumps en ruig Cross Country-terrein.
- fh6wiki ondersteunt voor landingsproblemen de volgorde: eerst bump verzachten,
  daarna rebound licht verlagen.
- Game8 ondersteunt onafhankelijk een Aero Balance-startpunt rond `0,45`.
- [OPTN Club](https://github.com/OPTN-Club/optn.club) is gebruikt als referentie
  voor open, controleerbare build- en tunegegevens. Een afzonderlijke FH6-guide
  is nog niet rechtstreeks opgehaald en blijft daarom een onderhoudspunt.
- De FH6 `forza.guide` Tuning Cheat Sheet is de primaire open bron voor
  sliderposities, bump/rebound-verhouding, gearing-workflow en Mechanical Balance.
  De app gebruikt nu maximaal `50%` bump ten opzichte van rebound; de volledige
  gewichtsgeleide damping- en springmodellen wachten op telemetry-validatie.
- Forumthread `832103`, *FH6: The Physics of Tuning*, is als competitief
  community-signaal bewaard. Claims over circa `1,1 bar` tire pressure en andere
  exploit-meta worden alleen gelabeld getoond en niet als standaardwaarde gebruikt.
- Apex Speed Craft bevestigt dat hogere Brake Balance-percentages in FH6 meer
  front bias betekenen en dat de oude omgekeerde sliderbug is opgelost.
- gamingpromax is gebruikt als aanvullend signaal voor het grotere belang van
  Race Brakes en front tire width en voor de nieuwe Mechanical/Aero Balance-stats.
- De gecontroleerde EZG Winter-test is gebruikt voor koud-asfaltgedrag:
  lagere tire temperatures, minder mechanical grip en langere braking distances.
- [TuneLab](https://github.com/super-android/tunelab) blijft de MIT-gelicentieerde
  rekenbaseline. TuneLab vermeldt zelf dat een deel van zijn physics-constanten
  is vergeleken met gedecompileerde ForzaTune Pro-constanten. Deze app importeerde
  de PI-frequency-polynomial niet; de resterende blootstelling zit vooral in de
  legacy damping-ratio's en enkele modewaarden. De ratio is in deze sprint al
  begrensd met openbare FH6-bronnen; volledige vervanging wacht op eigen telemetry.
- F.A.T.T.Y is gebaseerd op forza.guide en andere reeds gebruikte bronnen. Het
  geldt daarom als afgeleide implementatie, niet als onafhankelijke bevestiging.

### Lokale afgeleide kennislaag

- `car_build_recommendations.csv` levert per auto het archetype, waarschijnlijke
  rollen, aanbevolen upgradevolgorde, benodigde verstelbaarheid, optionele
  onderdelen, vermijd-lijst en risicovlaggen.
- `scripts/generate-build-profiles.mjs` zet deze bron om naar
  `public/data/build-profiles.json`.
- De app gebruikt deze informatie alleen als strategie- en prioriteitslaag.
  Exacte beschikbaarheid, PI-kosten en eindwaarden blijven in-game controles.

## Regelhiërarchie

1. Kies het juiste bandentype voor ondergrond en discipline.
2. Ontgrendel alleen de afstellingen die de gekozen onderdelen beschikbaar maken.
3. Prioriteer instelbaarheid, tractie en balans voordat vermogen wordt toegevoegd.
4. Laat bandenbreedte aansluiten op de aangedreven as.
5. Gebruik gewichtsreductie als brede prestatiewinst, maar controleer de PI-efficiëntie.
6. Kies onderstel en banden op discipline: race voor asfalt, Rally Tires en
   Rally suspension voor Dirt, Off-Road Tires en Off-Road suspension voor Cross
   Country, en drift-onderdelen voor Drift.
7. Voeg remmen eerder toe bij zware, snelle of controlegerichte builds.
8. Voeg aero pas toe als high-speed bochtengrip de topsnelheidsstraf waard is.
9. Behandel engine- en drivetrain-swaps als een nieuwe build met lagere zekerheid.
10. Controleer de uiteindelijke waarden altijd opnieuw in FH6.
11. Gebruik seizoen als verwachte context, niet als garantie voor het exacte
    eventweer; ondergrond en eventtype blijven leidend.
12. Waarschuw wanneer een target class minimaal twee klassen boven de native class
    ligt; een native-class auto gebruikt het PI-budget doorgaans efficiënter.
13. Houd front en rear toe standaard op `0,0°` in Horizon totdat een specifieke,
    in-game bevestigde diagnose een afwijking rechtvaardigt.
14. Bereken Final Drive met `3%` marge onder de limiter.
15. Modelleer Differential-capabilities per tier: Stock = geen sliders, Sport =
    acceleration-only, Race/discipline-differential = volledige sliders.
16. Houd Rally compound en Off-Road Tires in verschillende pressure-banden.
17. Gebruik compound-aware road camber en toon Aero Balance `0,40-0,45` als
    in-game verificatiedoel, zonder onbevestigde aero-sliderwaarden te verzinnen.
18. Behandel widebody, drivetrain-, engine- en EV-swaps als expliciete
    trade-offs in gewicht, drag, PI, balans en opnieuw afstellen.
19. Behandel PR Stunts als subtype-modifiers: minimum Aero en lange gearing voor
    Speed Trap; Race-grip met speed-bias voor Speed Zone; zachtere landing en
    extra ride height voor Danger Sign; RWD voor Drift Zone; Off-Road/AWD en
    herstelacceleratie voor Trailblazer.

## Niet overgenomen

- Geen commerciële database of preset is gekopieerd.
- Geen review of marketingclaim wordt als bewijs voor een exacte formule gebruikt.
- Geen AI-gegenereerde upgradebeschikbaarheid wordt als catalogusfeit opgeslagen.
- De betwiste FH6 PI-caps en de definitie van R-class blijven ongewijzigd totdat
  Jeff de class badges in-game heeft bevestigd.
- De oude Motorsport-forumclaim over een 10× fout in metrische veerweergave geldt
  niet als bewezen FH6-feit. Ingevoerde sliderwaarden worden daarom letterlijk als
  gamewaarden behandeld en niet fysisch omgerekend.
