# Inschrijvingen ontvangen in een spreadsheet (Excel)

> **Status: ingesteld op 1 oktober 2026.**
> - Spreadsheet: [Inschrijvingen online cursussen](https://docs.google.com/spreadsheets/d/1Iv0csoZ6Ul0guls-PrSVyLlluriyryCisr2vkhIBlkQ/edit)
>   (in de Google Drive van machielvsoest@gmail.com)
> - Script: Apps Script-project "Inschrijvingen online cursussen" (via de spreadsheet: Extensies → Apps Script)
> - Het web-app-adres staat in `kunstlessen/online.js` bij `inschrijfUrl`.
>
> De stappen hieronder heb je alleen nodig als je de koppeling opnieuw wilt opzetten.

Het inschrijfformulier op de cursuspagina kan elke inschrijving automatisch als nieuwe regel
in een Google Spreadsheet zetten. Die spreadsheet kun je altijd openen, en downloaden als
Excel-bestand.

Zolang dit nog niet is ingesteld, komen inschrijvingen via Formspree in je mailbox
(hetzelfde Formspree-formulier als het oude interesseformulier).

## Eenmalig instellen (ongeveer 10 minuten)

1. Ga naar <https://sheets.google.com> en maak een nieuwe, lege spreadsheet.
   Noem hem bijvoorbeeld "Inschrijvingen online cursussen".
2. Kies in het menu **Extensies → Apps Script**.
3. Verwijder de voorbeeldcode en plak de volledige inhoud van
   `inschrijvingen-naar-sheet.gs` (in deze map). Klik op **Opslaan**.
4. Klik rechtsboven op **Implementeren → Nieuwe implementatie**:
   - klik op het tandwiel bij "Type selecteren" en kies **Web-app**;
   - Uitvoeren als: **Ik**;
   - Wie heeft toegang: **Iedereen** (anders kunnen bezoekers zonder Google-account
     zich niet inschrijven; de spreadsheet zelf blijft privé);
   - klik op **Implementeren**.
5. Google vraagt om toestemming. Kies je account. Zie je "Google heeft deze app niet
   geverifieerd"? Dat is normaal voor een eigen script: klik op **Geavanceerd →
   Ga naar … (niet veilig)** en daarna op **Toestaan**.
6. Kopieer de **URL van de web-app** (die eindigt op `/exec`).
7. Open `kunstlessen/online.js` en plak de URL bij `inschrijfUrl`, tussen de aanhalingstekens:

   ```js
   inschrijfUrl: "https://script.google.com/macros/s/.../exec",
   ```

8. Testen: open de web-app-URL in je browser. Je ziet dan "De inschrijfkoppeling werkt.".
   Vul daarna het formulier op de cursuspagina één keer in: er verschijnt een regel in de
   spreadsheet en je krijgt een mail.

## Inschrijvingen bekijken

- Open de spreadsheet in Google Drive. Elke inschrijving is een regel, de nieuwste onderaan.
- Een Excel-bestand nodig? Kies **Bestand → Downloaden → Microsoft Excel (.xlsx)**.
- De kolommen **Betaald** en **Toegang gegeven** zijn voor jezelf: vul daar bijvoorbeeld
  "ja" in als iemand betaald heeft of de inloggegevens heeft gekregen.

## Een nieuwe online cursus toevoegen

1. Kopieer `online-cursus-drie-piramides.html` naar een nieuwe naam, bijvoorbeeld
   `online-cursus-kleur.html`, en pas de teksten aan. Geef het formulier onderaan
   (`data-cursus="..."`) een nieuwe, korte naam, bijvoorbeeld `kleur`.
2. Voeg de cursus toe bij `cursussen` in `online.js`, met dezelfde korte naam als `id`.
   Dan staat hij meteen in het inschrijfformulier.
3. Zet een tegel voor de cursus op `online-cursussen.html` (kopieer een bestaande tegel).

## Aanpassen

- Geen mail meer bij elke inschrijving? Zet in het script `MAIL_BIJ_INSCHRIJVING = false`.
- Het script gewijzigd? Kies **Implementeren → Implementaties beheren → potloodje →
  Versie: Nieuwe versie → Implementeren**. De URL blijft hetzelfde.
- De prijs en de startdatum van de volgende klas pas je aan bovenin `kunstlessen/online.js`.
  Die verschijnen dan automatisch op het overzicht, de cursuspagina en in het formulier.
