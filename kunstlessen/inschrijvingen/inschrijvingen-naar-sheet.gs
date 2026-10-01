/**
 * Inschrijvingen online cursussen -> Google Spreadsheet
 *
 * Plak deze code in je spreadsheet via Extensies > Apps Script
 * en zet hem online als web-app. De stappen staan in LEESMIJ.md.
 *
 * Door de regel hieronder mag het script alleen bij déze spreadsheet, niet bij je andere bestanden.
 * @OnlyCurrentDoc
 */

// Stuur jezelf een e-mail bij elke nieuwe inschrijving (true = ja, false = nee).
const MAIL_BIJ_INSCHRIJVING = true;

const KOLOMMEN = [
  "Tijdstip",
  "Naam",
  "E-mail",
  "Cursus",
  "Aantal lessen",
  "Vorm",
  "Prijsindicatie",
  "Opmerking",
  "Akkoord gegevens",
  "Pagina",
  "Betaald",
  "Toegang gegeven",
];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Dit verborgen veld vullen alleen spamrobots in.
  if (p._gotcha) {
    return antwoord({ ok: true });
  }
  if (!p.naam || !p.email) {
    return antwoord({ ok: false, fout: "Naam en e-mail zijn verplicht." });
  }

  const slot = LockService.getScriptLock();
  slot.waitLock(10000);
  try {
    const blad = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (blad.getLastRow() === 0) {
      blad.appendRow(KOLOMMEN);
      blad.setFrozenRows(1);
      blad.getRange(1, 1, 1, KOLOMMEN.length).setFontWeight("bold");
    }
    blad.appendRow([
      new Date(),
      veilig(p.naam),
      veilig(p.email),
      veilig(p.cursus),
      veilig(p.lessen),
      veilig(p.vorm),
      veilig(p.prijs),
      veilig(p.opmerking),
      veilig(p.akkoord),
      veilig(p.pagina),
      "",
      "",
    ]);
  } finally {
    slot.releaseLock();
  }

  if (MAIL_BIJ_INSCHRIJVING) {
    try {
      MailApp.sendEmail({
        to: Session.getEffectiveUser().getEmail(),
        replyTo: p.email,
        subject: "Nieuwe inschrijving: " + (p.cursus || "online cursus"),
        body: [
          "Er is een nieuwe inschrijving binnengekomen.",
          "",
          "Naam: " + p.naam,
          "E-mail: " + p.email,
          "Cursus: " + (p.cursus || "-"),
          "Aantal lessen: " + (p.lessen || "-"),
          "Vorm: " + (p.vorm || "-"),
          "Prijsindicatie: " + (p.prijs || "-"),
          "",
          "Opmerking:",
          p.opmerking || "-",
          "",
          "Alle inschrijvingen: " + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
        ].join("\n"),
      });
    } catch (fout) {
      // De inschrijving staat al in de spreadsheet; een mislukte mail mag het formulier niet blokkeren.
    }
  }

  return antwoord({ ok: true });
}

// Open je de web-app-link in je browser, dan zie je deze melding: de koppeling werkt.
function doGet() {
  return ContentService.createTextOutput("De inschrijfkoppeling werkt.");
}

// Voorkomt dat tekst die met = + - of @ begint als formule wordt uitgevoerd.
function veilig(waarde) {
  const tekst = String(waarde || "").slice(0, 2000);
  return /^[=+\-@]/.test(tekst) ? "'" + tekst : tekst;
}

function antwoord(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
