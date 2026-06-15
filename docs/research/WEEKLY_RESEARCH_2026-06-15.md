# Weekly FH6 Research - 15 juni 2026

Eenmalige proefrun van `Wekelijkse FH6 research`. De corpusbasis bestond uit
alle researchdocumenten tot en met Round 7, `BUILD_GUIDE_RESEARCH.md` en
`IN_GAME_VERIFIED.md`. Jeffs geverifieerde feiten blijven leidend.

## Open vragen eerst

### 1. HokiHoshi FH6-video

De open video is exact geidentificeerd als
[How To Build & Tune in Forza Horizon 6 | Basic Refresher & FH6 Changes Guide](https://www.youtube.com/watch?v=I9bUB3mcqso)
(`I9bUB3mcqso`). YouTube levert voor deze video geen publieke captions; de
inhoud kon daarom niet brongetrouw als transcript worden gemined.

**Status:** voortgang, niet gesloten. Communityreacties bevestigen dat de video
afwijkt van delen van `forza.guide`, maar zulke reacties zijn geen vervanging
voor de primaire video.

### 2. OPTN-guide en open tool

Primaire inspectie van [OPTN-Club/optn.club](https://github.com/OPTN-Club/optn.club)
bevestigt een publieke FH6 tune formatter sinds 2 mei 2026. De formatter bevat
volledige build- en tunevelden, waaronder `Motor and Battery`, maar de repository
bevat geen gepubliceerde FH6 Tuning Academy of afzonderlijke tuning guide.

**Claim:** OPTN is momenteel een open uitwissel- en formattertool, niet een
onafhankelijke bron voor FH6-formules.

**Confidence:** **single-source** (primaire repository-inspectie).

**Conflict:** geen inhoudelijk conflict; wel een correctie op de eerdere
verwachting dat de publieke repo ook guide-content zou bevatten.

**App-impact:** OPTN mag als workflow- en schemareferentie blijven staan, maar
niet als tweede bevestiging voor tune-waarden.

De formatter biedt zowel `R 998` als `X 999` aan. Dat botst met Jeffs en de
officiele carlist-verificatie dat de FH6-doelklassen eindigen bij `R 998`.

**Claim:** de actuele OPTN-klassekeuze is voor deze app niet betrouwbaar.

**Confidence:** **disputed** (OPTN-implementatie versus officiele carlist en V2).

**Resolutie:** V2 blijft leidend; geen appwijziging. Een upstream correctie bij
OPTN is wenselijk.

### 3. EV tuning

OPTN bevestigt onafhankelijk van de eerder gemijnde BossDown-guide dat FH6 een
afzonderlijke `Motor and Battery`-upgradecategorie heeft. Het bevestigt niet de
eerdere claims over battery placement, massa, one-gear tuning of optimale
motor/battery-combinaties.

**Claim:** `Motor and Battery` hoort als expliciete EV-buildcategorie in een
open FH6 buildformat.

**Confidence:** **confirmed** (BossDown + OPTN, verschillende publicatievormen).

**Conflict:** geen.

**App-impact:** bevestigt de bestaande D6-richting; geen nieuwe enginewaarden.
EV-gearing en battery trade-offs blijven open wegens gebrek aan onafhankelijke
technische bronnen.

### 4. Drift-branch D5

De actuele [forza.guide](https://forza.guide/) bevat nu een volledige Drift
Tuning-sectie met soft-soft ARBs rond `8`, springs rond `400 lb/in`, bump en
rebound rond `4`, circa `70%` front Brake Balance en `100%` acceleration lock.
Dit komt inhoudelijk vrijwel exact overeen met de eerder gemijnde mmogah/D5-
richting en staat tegenover de legacy TuneLab-branch met een veel stijvere rear
ARB en rear-biased brakes.

De guide publiceert echter geen controleerbare bronlijst. In de gekoppelde
[Reddit-thread](https://www.reddit.com/r/ForzaHorizon/comments/1tf19d0/i_made_a_forza_horizon_tuning_guidecheat_sheet/)
zegt de maker dat webartikelen en YouTube-video's zijn samengevoegd en met AI
zijn gekruist; reacties wijzen bovendien op HokiHoshi als waarschijnlijke
nummerbron. Onafhankelijkheid ten opzichte van de al bekende bronnen is dus niet
aangetoond.

**Claim:** de soft-soft Drift-richting heeft nu breder publiek draagvlak, maar
nog geen tweede aantoonbaar onafhankelijke bron.

**Confidence:** **single-source** (confidence omhoog binnen dezelfde of onbekende
lineage, niet naar confirmed).

**Conflict:** actueel `forza.guide`/mmogah versus legacy TuneLab-branch.

**App-impact:** D5 blijft een human-supervised branch-review. Geen waarden
overnemen zonder drift-testsessie en bronlineagecontrole.

### 5. R-class definitie

Geen nieuwe onzekerheid. V2 (`R 901-998`) blijft gesloten en leidend. De OPTN
`X 999`-optie is een bronfout of carry-over, geen reden om de vraag te heropenen.

### 6. Post-patch meta

Open webresearch vond sinds de corpuscheck van 12 juni geen release note met
handling-, tire-, PI-, drivetrain-, suspension- of physicswijzigingen. De
officiele Support-site bleef zoals verwacht bot-blocked. Wel is een recente
save/sync-fix gemeld; die raakt geen tuningclaim.

**Status:** geen aanleiding om bestaande meta-claims te downgraden. Series 2
start op 18 juni 2026 en blijft het eerstvolgende logische hercheckmoment.

## Nieuwe communitysignalen

### Four-wheel steering blijft mogelijk behouden na suspension-upgrade

Een FH6-gebruiker meldt in de `forza.guide`-thread dat de FH5-regel "Race
suspension verwijdert factory four-wheel steering" niet meer geldt: in FH6 zou
four-wheel steering behouden blijven. De guide-auteur heeft de correctie
geaccepteerd voor een volgende update.

**Confidence:** **single-source**.

**Conflict:** FH5-carry-over versus een specifieke FH6-praktijkmelding.

**App-impact:** voeg dit toe aan Jeffs in-game verificatielijst voordat de Build
Guide ooit suspension-upgrades op four-wheel-steering auto's afraadt.

### Aero Balance-doel is niet voor iedere bodykit haalbaar

Een gebruiker rapporteert dat een 2020 GT-R met Chargespeed-kit niet lager kwam
dan `0,51`, zelfs met minimum front en maximum rear. De actuele `forza.guide`
geeft inmiddels geen universeel `0,40-0,45`-doel meer, maar adviseert maximum
front downforce en rear downforce op high-speed stability af te stemmen.

**Confidence:** **disputed**. Grindout + Game8 ondersteunen `0,40-0,45` als
startdoel; de specifieke bodykit-melding en de gewijzigde guide beperken de
universele toepasbaarheid.

**App-impact:** behandel `0,40-0,45` als `target-if-reachable`, niet als harde
acceptatiegrens. Bij een beperkt sliderbereik geldt de dichtst haalbare stabiele
balans. Jeff-validatie blijft nodig.

## Geen nieuwe opbrengst

- Geen onafhankelijk EV-gearingmodel of battery-combinatiedata gevonden.
- Geen aantoonbaar onafhankelijke tweede bron voor de exacte D5 Drift-waarden.
- Geen nieuwe commits sinds 11 juni in `viunow/fh6-telemetry`,
  `TheBanHammer/fh6-tel`, `Ojansen/co-driver` of TuneLab die het kennismodel
  veranderen.
- Geen publiek transcript of bronlijst voor de HokiHoshi-video.

## Voorstellen

1. **needs-Jeff-validation:** test op een factory four-wheel-steering auto of
   Race suspension de achterwielbesturing inderdaad behoudt.
2. **needs-Jeff-validation:** test op twee aero-kits of `0,40-0,45` haalbaar is;
   noteer het minimale/maximale bereik en gebruik anders de dichtst stabiele
   waarde.
3. **needs-more-sources:** behandel de actuele `forza.guide` Drift-sectie als
   D5-signaal, niet als onafhankelijke bevestiging; zoek een gedocumenteerde
   OPTN/AR12/drift-communitybron voordat de branch wordt herschreven.
4. **Sprint-ready (onderhoud):** meld OPTN upstream dat `X 999` naast `R 998`
   niet overeenkomt met de officiele FH6-klassen.

## Open vragen na deze run

- HokiHoshi: inhoudelijke claims wachten op handmatige videobeoordeling of een
  later gepubliceerd transcript.
- OPTN: guide/Tuning Academy nog niet publiek in de repository; formatter wel.
- EV: one-gear tuning, battery placement en optimale combinaties blijven open.
- D5: richting sterker, exacte waarden en onafhankelijkheid blijven open.
- Post-patch: opnieuw controleren bij Series 2 op 18 juni 2026.
- Nieuw: four-wheel-steering na suspension-upgrade in-game bevestigen.
- Nieuw: Aero Balance-doel per bodykit als bereik, niet alleen als doelwaarde,
  valideren.

## Yield

- Nieuwe claims: **3**
- Confidence-wijzigingen: **2**
- Gesloten open vragen: **0** (R-class was voor deze run al gesloten)
- Concrete sprintvoorstellen: **4**
- Low-yield: **nee**
