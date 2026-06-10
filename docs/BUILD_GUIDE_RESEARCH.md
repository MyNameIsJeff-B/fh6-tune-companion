# Build Guide Research

Laatst gecontroleerd: 10 juni 2026

## Productbesluit

De Build Guide geeft een generiek, uitlegbaar upgradeplan op basis van discipline,
ondergrond, doelklasse, aandrijving en voorkeur. De app beweert niet dat een
onderdeel voor iedere auto beschikbaar is en rekent geen verzonnen PI-kosten uit.

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

### Calculators en gidsen

- [ForzaTune tuning guide](https://forzatune.com/guide/the-fully-updated-forza-tuning-guide/)
  onderbouwt de rol van bandencontact, gewicht, veren, ARB's, demping en
  differentieel. De gids bevestigt ook dat verstelbare race-onderdelen nodig zijn
  om relevante tuningvelden vrij te geven.
- [ForzaTune Pro](https://play.google.com/store/apps/details?id=com.flamefrontstudios.forzatune7)
  vermeldt FH6-ondersteuning als beta op 4 juni 2026. De app wordt alleen als
  product- en workflowreferentie gebruikt; gesloten formules zijn niet overgenomen.
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

- [OPTN Club](https://github.com/OPTN-Club/optn.club) is gebruikt als referentie
  voor open, controleerbare build- en tunegegevens.
- [TuneLab](https://github.com/super-android/tunelab) blijft de MIT-gelicentieerde
  rekenbaseline. De Build Guide is een aparte lokale regelset.

## Regelhiërarchie

1. Kies het juiste bandentype voor ondergrond en discipline.
2. Ontgrendel alleen de afstellingen die de gekozen onderdelen beschikbaar maken.
3. Prioriteer instelbaarheid, tractie en balans voordat vermogen wordt toegevoegd.
4. Laat bandenbreedte aansluiten op de aangedreven as.
5. Gebruik gewichtsreductie als brede prestatiewinst, maar controleer de PI-efficiëntie.
6. Kies onderstel op ondergrond: race voor asfalt, rally voor losse ondergrond,
   drift voor drift.
7. Voeg remmen eerder toe bij zware, snelle of controlegerichte builds.
8. Voeg aero pas toe als high-speed bochtengrip de topsnelheidsstraf waard is.
9. Behandel engine- en drivetrain-swaps als een nieuwe build met lagere zekerheid.
10. Controleer de uiteindelijke waarden altijd opnieuw in FH6.

## Niet overgenomen

- Geen commerciële database of preset is gekopieerd.
- Geen review of marketingclaim wordt als bewijs voor een exacte formule gebruikt.
- Geen AI-gegenereerde upgradebeschikbaarheid wordt als catalogusfeit opgeslagen.
