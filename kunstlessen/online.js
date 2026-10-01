/* Online cursussen: vormen, prijzen en inschrijving.
 * De hoofdpagina, de cursuspagina's en het inschrijfformulier lezen allemaal uit dit blok,
 * dus een prijs of vorm hoef je maar op één plek aan te passen.
 *
 * ================= PAS HIER AAN =================
 */
const ONLINE = {
  // Adres van de Google Sheets-koppeling (eindigt op /exec, zie inschrijvingen/LEESMIJ.md).
  // Leeg maken ("") = inschrijvingen gaan weer via Formspree naar je mailbox.
  // Spreadsheet: https://docs.google.com/spreadsheets/d/1Iv0csoZ6Ul0guls-PrSVyLlluriyryCisr2vkhIBlkQ/edit
  inschrijfUrl: "https://script.google.com/macros/s/AKfycbwTf2ZhIJ8JGqfxQTOei12EkzvVs3gJIi1yzy8x0LHSeJkGSNk00C6kdc554z5TkbTt/exec",

  cursussen: [
    {
      id: "drie-piramides",
      naam: "Grip op schilderen",
      pagina: "online-cursus-drie-piramides.html",
    },
  ],

  // Uit hoeveel lessen kan iemand kiezen?
  pakketten: [4, 8, 12],

  // prijsPerLes: bedrag in euro's (bijvoorbeeld 25) of null zolang de prijs nog niet vastligt.
  // begeleiding: 1, 2 of 3 stippen op de meter.
  vormen: [
    {
      naam: "Zelfstandig",
      ondertitel: "Zonder feedback",
      omschrijving: "Je volgt de lessen met uitleg, voorbeelden en opdrachten en werkt in je eigen tempo.",
      begeleiding: 1,
      prijsPerLes: null,
    },
    {
      naam: "Feedback per e-mail",
      ondertitel: "Schriftelijke feedback",
      omschrijving: "Je stuurt per les een foto van je werk in en krijgt persoonlijke feedback per e-mail.",
      begeleiding: 2,
      prijsPerLes: null,
    },
    {
      naam: "Feedback via Zoom",
      ondertitel: "Persoonlijk gesprek",
      omschrijving: "Je bespreekt je werk samen met mij in een Zoom-meeting en krijgt direct feedback.",
      begeleiding: 3,
      prijsPerLes: null,
    },
  ],
};
/* ============ HIERONDER NIETS AANPASSEN ============ */
{
  const FORMSPREE_URL = "https://formspree.io/f/mzzvdvzr";
  // € 25 voor hele bedragen, € 22,50 als er centen zijn.
  const euro = (waarde) => {
    const afgerond = Math.round(waarde * 100) / 100;
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: Number.isInteger(afgerond) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(afgerond);
  };

  const esc = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const bedrag = (vorm, lessen) =>
    typeof vorm.prijsPerLes === "number" ? euro(vorm.prijsPerLes * lessen) : null;

  const stippen = (aantal) => {
    const rondjes = [1, 2, 3].map((i) => `<i${i <= aantal ? ' class="on"' : ""}></i>`).join("");
    return `<span class="dots" role="img" aria-label="${aantal} van 3">${rondjes}</span>`;
  };

  // Tegels met de vormen.
  document.querySelectorAll("[data-vormen]").forEach((grid) => {
    grid.innerHTML = ONLINE.vormen
      .map((vorm) => {
        const perLes = bedrag(vorm, 1);
        return `<article class="feature-tile">
          <p class="label">${esc(vorm.ondertitel)}</p>
          <h3>${esc(vorm.naam)}</h3>
          <p>${esc(vorm.omschrijving)}</p>
          <p class="meter">Persoonlijke begeleiding ${stippen(vorm.begeleiding)}</p>
          <p class="price">${perLes ? `<strong>${perLes}</strong> per les` : "<strong>Prijs volgt</strong>"}</p>
        </article>`;
      })
      .join("");
  });

  // Prijstabel: per les en per pakket, voor elke vorm.
  document.querySelectorAll("[data-prijstabel]").forEach((table) => {
    const rij = (label, lessen) =>
      `<tr><th scope="row">${label}</th>${ONLINE.vormen.map((v) => `<td>${bedrag(v, lessen) || "volgt"}</td>`).join("")}</tr>`;
    const pakketten = ONLINE.pakketten.filter((n) => n > 1).map((n) => rij(`${n} lessen`, n));
    const bijschrift = table.querySelector("caption");
    table.innerHTML = `<thead><tr><th scope="col">Aantal lessen</th>${ONLINE.vormen
      .map((v) => `<th scope="col">${esc(v.naam)}</th>`)
      .join("")}</tr></thead><tbody>${rij("Per les", 1)}${pakketten.join("")}</tbody>`;
    if (bijschrift) table.prepend(bijschrift);
  });

  // Inschrijfformulier in een venster.
  const dialog = document.getElementById("inschrijven");
  const form = document.getElementById("inschrijfForm");

  if (dialog && form) {
    const lessenKeuze = form.elements.lessen;
    const samenvatting = form.querySelector("[data-samenvatting]");
    const status = form.querySelector(".form-status");
    const bedankt = dialog.querySelector("[data-bedankt]");

    form.elements.cursus.innerHTML = ONLINE.cursussen
      .map((c) => `<option value="${esc(c.naam)}"${c.id === form.dataset.cursus ? " selected" : ""}>${esc(c.naam)}</option>`)
      .join("");
    lessenKeuze.innerHTML = ONLINE.pakketten.map((n) => `<option value="${n} lessen">${n} lessen</option>`).join("");
    form.querySelector("[data-vorm-keuze]").innerHTML = ONLINE.vormen
      .map((v) => {
        const perLes = bedrag(v, 1);
        return `<label class="choice-card">
          <input type="radio" name="vorm" value="${esc(v.naam)}" required>
          <span><strong>${esc(v.naam)}</strong><small>${esc(v.ondertitel)}${perLes ? ` · ${perLes} per les` : ""}</small></span>
        </label>`;
      })
      .join("");

    const werkSamenvattingBij = () => {
      const lessen = parseInt(lessenKeuze.value, 10);
      const vorm = ONLINE.vormen.find((v) => v.naam === form.elements.vorm.value);
      let tekst = "Kies een vorm om de prijs te zien.";
      if (vorm) {
        const totaal = bedrag(vorm, lessen);
        tekst = `${lessen} lessen · ${vorm.naam} · ${totaal ? `totaal ${totaal}` : "prijs volgt"}`;
      }
      samenvatting.textContent = tekst;
      form.elements.prijs.value = vorm ? tekst : "";
    };
    form.addEventListener("change", werkSamenvattingBij);
    werkSamenvattingBij();

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

      werkSamenvattingBij();
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
