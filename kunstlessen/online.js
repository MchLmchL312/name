/* Online cursussen: prijs, startdatum en inschrijving.
 * Het overzicht, de cursuspagina en het inschrijfformulier lezen allemaal uit dit blok,
 * dus de prijs en de startdatum pas je maar op één plek aan.
 *
 * Er is één vorm: 6 weken, elke week een lesvideo, drie opdrachten van twee weken,
 * drie online besprekingen via Google Meet en maximaal 8 cursisten.
 *
 * ================= PAS HIER AAN =================
 */
const ONLINE = {
  // Adres van de Google Sheets-koppeling (eindigt op /exec, zie inschrijvingen/LEESMIJ.md).
  // Leeg maken ("") = inschrijvingen gaan weer via Formspree naar je mailbox.
  // Spreadsheet: https://docs.google.com/spreadsheets/d/1Iv0csoZ6Ul0guls-PrSVyLlluriyryCisr2vkhIBlkQ/edit
  inschrijfUrl: "https://script.google.com/macros/s/AKfycbwTf2ZhIJ8JGqfxQTOei12EkzvVs3gJIi1yzy8x0LHSeJkGSNk00C6kdc554z5TkbTt/exec",

  // Prijs van de hele cursus (6 weken) in euro's, bijvoorbeeld 195. null = "Prijs volgt".
  prijs: null,

  // Startdatum van de volgende klas, bijvoorbeeld "maandag 11 januari 2027". Leeg = "volgt".
  volgendeStart: "",

  // De cursussen waarvoor je je kunt inschrijven. Een nieuwe cursus: voeg hem hier toe,
  // maak een eigen cursuspagina en zet een tegel op online-cursussen.html.
  cursussen: [
    {
      id: "drie-piramides",
      naam: "Grip op schilderen",
      pagina: "online-cursus-drie-piramides.html",
    },
  ],
};
/* ============ HIERONDER NIETS AANPASSEN ============ */
{
  const FORMSPREE_URL = "https://formspree.io/f/mzzvdvzr";
  // € 195 voor hele bedragen, € 192,50 als er centen zijn.
  const euro = (waarde) => {
    const afgerond = Math.round(waarde * 100) / 100;
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: Number.isInteger(afgerond) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(afgerond);
  };
  const prijsTekst = typeof ONLINE.prijs === "number" ? euro(ONLINE.prijs) : "Prijs volgt";
  const startTekst = ONLINE.volgendeStart || "volgt";

  document.querySelectorAll("[data-prijs]").forEach((el) => {
    el.textContent = prijsTekst;
  });
  document.querySelectorAll("[data-start]").forEach((el) => {
    el.textContent = startTekst;
  });

  // Inschrijfformulier in een venster.
  const dialog = document.getElementById("inschrijven");
  const form = document.getElementById("inschrijfForm");

  if (dialog && form) {
    const status = form.querySelector(".form-status");
    const bedankt = dialog.querySelector("[data-bedankt]");
    const cursus = ONLINE.cursussen.find((c) => c.id === form.dataset.cursus) || ONLINE.cursussen[0];
    const samenvatting = `${cursus.naam} · 6 weken · start ${startTekst} · ${prijsTekst.toLowerCase()}`;

    form.elements.cursus.value = cursus.naam;
    form.elements.prijs.value = samenvatting;
    form.querySelector("[data-samenvatting]").textContent = samenvatting;

    const openVenster = () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    };
    document.querySelectorAll("[data-open-inschrijving]").forEach((knop) => {
      knop.addEventListener("click", (event) => {
        event.preventDefault();
        openVenster();
      });
    });
    dialog.querySelectorAll("[data-sluit]").forEach((knop) => knop.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    // Een link naar ...#inschrijven opent het venster direct; daarna mag de #inschrijven weer uit de adresbalk.
    if (location.hash === "#inschrijven") {
      history.replaceState(null, "", location.pathname + location.search);
      openVenster();
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const knop = form.querySelector('[type="submit"]');
      const knopTekst = knop.textContent;

      form.elements.pagina.value = location.href;
      status.hidden = true;
      knop.disabled = true;
      knop.textContent = "Versturen...";

      try {
        const response = await fetch(ONLINE.inschrijfUrl || FORMSPREE_URL, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const antwoord = await response.json().catch(() => ({}));
        if (!response.ok || antwoord.ok === false) throw new Error(antwoord.fout || "Versturen mislukt");
        form.hidden = true;
        bedankt.hidden = false;
      } catch (error) {
        status.textContent = "Versturen is niet gelukt. Probeer het later opnieuw of mail naar machielvansoest@outlook.com.";
        status.hidden = false;
      } finally {
        knop.disabled = false;
        knop.textContent = knopTekst;
      }
    });
  }
}
