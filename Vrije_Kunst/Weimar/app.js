const artists = [
  {
    id: "wendeline-jansen",
    name: "Wendeline Jansen",
    works: [],
    description: "",
    text: [
      "Vigevano, Pavia, Italië",
      "Interieur, exterieur. Beide onderwerpen fascineren mij, of het nu oude ruïnes zijn of strakke moderne architectuur. Het is ook toevallig het onderwerp om mee te dingen naar een wedstrijd.",
      "Ik vertelde een vriendin dat ik wilde meedoen aan de wedstrijd en op zoek was naar locaties in Nederland om te fotograferen als basis voor mijn schilderij. Zij kwam net uit Italië en, wetende dat ik ook Italiëfan ben, appte zij me foto’s die ze had gemaakt.",
      "Mijn naam is Wendeline Jansen, een autodidacte schilderes.",
      "Vigevano ligt ongeveer 35 km ten zuidwesten van Milaan."
    ]
  },
  { id: "petra-zwarts", name: "Petra Zwarts", works: [], description: "", text: [] },
  { id: "jos-van-niekerk", name: "Jos van Niekerk", works: [], description: "", text: [] },
  {
    id: "ank-de-boer",
    name: "Ank de Boer",
    works: [
      { src: "assets/artists/ank-de-boer/ank1r.jpg", alt: "Schilderij van een wandelpad onder grillige boomtakken" },
      { src: "assets/artists/ank-de-boer/ank2r.jpg", alt: "Schilderij van een boslandschap met een figuur op een rots" },
      { src: "assets/artists/ank-de-boer/ank3r.jpg", alt: "Schilderij van een kust met strand en grijze zee" },
      { src: "assets/artists/ank-de-boer/ank4r.jpg", alt: "Schilderij van een waterrijk landschap onder een lichte lucht" },
      { src: "assets/artists/ank-de-boer/ank5r.jpg", alt: "Stilleven met planten in een donkere pot tegen een roze achtergrond" },
      { src: "assets/artists/ank-de-boer/ank6r.jpg", alt: "Schilderij van een beschutte tuin met stoelen" },
      { src: "assets/artists/ank-de-boer/ank7r.jpg", alt: "Schilderij van water dat tussen zandbanken stroomt" }
    ],
    description: "",
    text: ["Dit doek ademt de herinnering aan talloze wandelingen door het vertrouwde duinlandschap."]
  },
  { id: "annemieke-jansen", name: "Annemieke Jansen", works: [], description: "", text: [] },
  { id: "joanne-de-mooij", name: "Joanne de Mooij", works: [], description: "", text: [] },
  {
    id: "thea-van-der-heijden",
    name: "Thea van der Heijden",
    works: [
      {
        src: "assets/artists/thea-van-der-heijden/2026 compositie XI.jpg",
        alt: "Abstract-geometrisch schilderij in groen, grijs en crème",
        title: "2026 compositie XI",
        meta: "Olieverf op doek · 40 × 40 cm",
        description: "Dit schilderij is bij toeval ontstaan; zoekend naar een nieuw project voor de cursus ‘Olieverf’. Intuïtief heb ik de lijnen (al dan niet bestaand) gevolgd die ik op het doek zag. De kleuren kies ik niet, die kiezen mij."
      },
      {
        src: "assets/artists/thea-van-der-heijden/2026 compositie XII.jpg",
        alt: "Abstract-geometrisch schilderij in rood, roze, grijs en crème",
        title: "2026 compositie XII",
        meta: "Olieverf op doek · 40 × 40 cm",
        description: "De totstandkoming van dit schilderij was een moeizaam proces. Ik vond dat ‘2026 compositie XI’ een vervolg moest krijgen. Zoekend naar een verbinding met ‘2026 compositie XI’ is dit het resultaat."
      },
      {
        src: "assets/artists/thea-van-der-heijden/2026 zonder titel.jpg",
        alt: "Abstract schilderij met groene, blauwe, witte en gele paletmesstreken",
        title: "Zonder titel",
        meta: "2026 · Olieverf op doek · 30 × 30 cm",
        description: "Na het maken van precieze vlakken, vrij werken met het paletmes. Na afronding zag ik mijn wandelingen langs de Prüm in Duitsland erin terug. Langs het water, de wind door de bomen, het zachte licht door de bladeren."
      }
    ],
    description: "",
    text: []
  },
  { id: "marleen-elders", name: "Marleen Elders", works: [], description: "", text: [] },
  {
    id: "machiel-van-soest",
    name: "Machiel van Soest",
    works: [
      {
        src: "assets/artists/machiel-van-soest/Machiel.jpg",
        alt: "Schilderij met twee figuren en een centraal abstract lichaam"
      },
      {
        src: "assets/artists/machiel-van-soest/IMG_1851.JPG",
        alt: "Het schilderij van Machiel van Soest op een ezel in het atelier",
        label: "Atelierbeeld"
      }
    ],
    description: "",
    text: []
  }
];

const dialog = document.querySelector("#artist-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogIndex = document.querySelector("#dialog-index");
const dialogWork = document.querySelector("#dialog-work");
const dialogDescription = document.querySelector("#dialog-description");
const dialogText = document.querySelector("#dialog-text");
const closeButton = document.querySelector(".dialog-close");
let returnFocus = null;

function appendParagraphs(container, paragraphs) {
  container.replaceChildren();
  const items = Array.isArray(paragraphs) ? paragraphs : paragraphs ? [paragraphs] : [];
  items.forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    container.append(p);
  });
}

function renderWorks(works) {
  dialogWork.replaceChildren();
  dialogWork.classList.toggle("is-empty", works.length === 0);

  works.forEach((work) => {
    const figure = document.createElement("figure");
    figure.className = "catalogue-work";

    const image = document.createElement("img");
    image.src = work.src;
    image.alt = work.alt || "";
    image.loading = "lazy";
    figure.append(image);

    if (work.title || work.meta || work.description || work.label) {
      const caption = document.createElement("figcaption");
      if (work.title) {
        const title = document.createElement("h4");
        title.textContent = work.title;
        caption.append(title);
      }
      if (work.meta || work.label) {
        const meta = document.createElement("p");
        meta.className = "work-meta";
        meta.textContent = work.meta || work.label;
        caption.append(meta);
      }
      if (work.description) {
        const description = document.createElement("p");
        description.textContent = work.description;
        caption.append(description);
      }
      figure.append(caption);
    }

    dialogWork.append(figure);
  });
}

function openArtist(artistId, updateHash = true) {
  const artistIndex = artists.findIndex((artist) => artist.id === artistId);
  if (artistIndex === -1) return;

  const artist = artists[artistIndex];
  dialogTitle.textContent = artist.name;
  dialogIndex.textContent = `Deelnemer ${String(artistIndex + 1).padStart(2, "0")} / ${String(artists.length).padStart(2, "0")}`;
  renderWorks(artist.works);
  appendParagraphs(dialogDescription, artist.description);
  appendParagraphs(dialogText, artist.text);

  if (!dialog.open) dialog.showModal();
  closeButton.focus();

  if (updateHash) history.pushState({ artist: artist.id }, "", `#${artist.id}`);
}

function closeArtist(updateHash = true) {
  if (!dialog.open) return;
  dialog.close();

  if (updateHash) history.pushState({}, "", `${window.location.pathname}${window.location.search}#deelnemers`);
  if (returnFocus) returnFocus.focus();
}

document.querySelectorAll(".artist-card").forEach((button) => {
  button.addEventListener("click", () => {
    returnFocus = button;
    openArtist(button.dataset.artist);
  });
});

closeButton.addEventListener("click", () => closeArtist());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeArtist();
});

dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeArtist();
});

window.addEventListener("popstate", () => {
  const artistId = window.location.hash.slice(1);
  if (artists.some((artist) => artist.id === artistId)) {
    openArtist(artistId, false);
  } else if (dialog.open) {
    closeArtist(false);
  }
});

const initialArtist = window.location.hash.slice(1);
if (artists.some((artist) => artist.id === initialArtist)) {
  openArtist(initialArtist, false);
}
