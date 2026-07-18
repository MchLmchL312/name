const LEGACY_STORAGE_KEY = "pink-fluffy-stories-v1";
const ACCOUNTS_KEY = "pink-fluffy-accounts-v1";
const SESSION_KEY = "pink-fluffy-session-v1";
const LANGUAGE_KEY = "pink-fluffy-language-v1";

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const clone = (value) => (typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value)));
const folderPalette = ["#d98eaa", "#b88cc7", "#82a8c9", "#89b5a2", "#d8a26f", "#c77f84", "#8f9fc7", "#b39a7b"];

const translations = {
  nl: {
    writingSpace: "Mijn schrijfruimte",
    welcomeEyebrow: "Welkom terug",
    loginHeading: "Schrijf verder aan jouw verhaal",
    loginIntro: "Log in om je eigen boeken en hoofdstukken te openen.",
    registerEyebrow: "Jouw verhaal begint hier",
    registerHeading: "Maak je eigen schrijfruimte",
    registerIntro: "Kies een gebruikersnaam en wachtwoord voor je persoonlijke bibliotheek.",
    login: "Inloggen",
    register: "Account maken",
    username: "Gebruikersnaam",
    password: "Wachtwoord",
    confirmPassword: "Herhaal wachtwoord",
    localAccountNote: "Je account en verhalen worden alleen in deze browser opgeslagen.",
    myLibrary: "Mijn bibliotheek",
    newBook: "Nieuw boek",
    storiesSaved: "Jouw verhalen, veilig bewaard",
    saved: "Opgeslagen",
    saving: "Opslaan…",
    focus: "Focus",
    duplicateChapter: "Hoofdstuk dupliceren",
    clearFormatting: "Alle opmaak wissen",
    deleteChapter: "Hoofdstuk verwijderen",
    renameWorkspace: "Titel schrijfruimte aanpassen",
    logout: "Uitloggen",
    paragraph: "Alinea",
    heading1: "Kop 1",
    heading2: "Kop 2",
    quote: "Citaat",
    wordsOne: "woord",
    wordsMany: "woorden",
    characters: "tekens",
    readingTime: "min leestijd",
    wordsToday: "woorden vandaag",
    unnamedChapter: "Naamloos hoofdstuk",
    defaultChapter: "Hoofdstuk 1",
    defaultBook: "Mijn nieuwe boek",
    emptyBook: "Nieuw boek",
    newStory: "Nieuw verhaal",
    nameBook: "Geef je boek een naam",
    bookTitle: "Boektitel",
    create: "Maken",
    newChapter: "Nieuw hoofdstuk",
    nameChapter: "Hoe heet dit hoofdstuk?",
    chapterTitle: "Hoofdstuktitel",
    add: "Toevoegen",
    editBook: "Boek bewerken",
    renameBookHeading: "Nieuwe naam voor je boek",
    editChapter: "Hoofdstuk bewerken",
    renameChapterHeading: "Nieuwe naam voor je hoofdstuk",
    save: "Opslaan",
    cancel: "Annuleren",
    toggleFolder: "Map openen of sluiten",
    renameBook: "Boek hernoemen",
    addChapter: "Hoofdstuk toevoegen",
    dragChapter: "Sleep om de volgorde te veranderen",
    renameChapter: "Hoofdstuk hernoemen",
    deleteBook: "Boek verwijderen",
    folderColor: "Mapkleur aanpassen",
    customizeSpace: "Schrijfruimte aanpassen",
    nameWritingSpace: "Welke titel wil je gebruiken?",
    writingSpaceTitle: "Titel van de schrijfruimte",
    workspaceRenamed: "Titel aangepast",
    booksReordered: "Volgorde van boeken aangepast",
    bookCreated: "Nieuw boek gemaakt",
    chapterAdded: "Hoofdstuk toegevoegd",
    orderChanged: "Volgorde aangepast",
    chapterDuplicated: "Hoofdstuk gedupliceerd",
    formattingCleared: "Opmaak van selectie gewist",
    chapterDeleted: "Hoofdstuk verwijderd",
    bookDeleted: "Boek verwijderd",
    deleteChapterConfirm: "Wil je ‘{title}’ verwijderen?",
    deleteBookConfirm: "Wil je het boek ‘{title}’ en alle hoofdstukken verwijderen?",
    usernameTooShort: "Gebruik minimaal 3 tekens voor je gebruikersnaam.",
    passwordTooShort: "Gebruik minimaal 6 tekens voor je wachtwoord.",
    passwordsMismatch: "De wachtwoorden zijn niet hetzelfde.",
    usernameExists: "Deze gebruikersnaam bestaat al.",
    invalidLogin: "Gebruikersnaam of wachtwoord is niet juist.",
    accountCreated: "Account gemaakt. Welkom!",
    loggedOut: "Je bent uitgelogd.",
  },
  en: {
    writingSpace: "My writing space",
    welcomeEyebrow: "Welcome back",
    loginHeading: "Continue writing your story",
    loginIntro: "Log in to open your own books and chapters.",
    registerEyebrow: "Your story starts here",
    registerHeading: "Create your own writing space",
    registerIntro: "Choose a username and password for your personal library.",
    login: "Log in",
    register: "Create account",
    username: "Username",
    password: "Password",
    confirmPassword: "Repeat password",
    localAccountNote: "Your account and stories are stored only in this browser.",
    myLibrary: "My library",
    newBook: "New book",
    storiesSaved: "Your stories, safely kept",
    saved: "Saved",
    saving: "Saving…",
    focus: "Focus",
    duplicateChapter: "Duplicate chapter",
    clearFormatting: "Clear all formatting",
    deleteChapter: "Delete chapter",
    renameWorkspace: "Change writing space title",
    logout: "Log out",
    paragraph: "Paragraph",
    heading1: "Heading 1",
    heading2: "Heading 2",
    quote: "Quote",
    wordsOne: "word",
    wordsMany: "words",
    characters: "characters",
    readingTime: "min read",
    wordsToday: "words today",
    unnamedChapter: "Untitled chapter",
    defaultChapter: "Chapter 1",
    defaultBook: "My new book",
    emptyBook: "New book",
    newStory: "New story",
    nameBook: "Give your book a name",
    bookTitle: "Book title",
    create: "Create",
    newChapter: "New chapter",
    nameChapter: "What is this chapter called?",
    chapterTitle: "Chapter title",
    add: "Add",
    editBook: "Edit book",
    renameBookHeading: "Choose a new name for your book",
    editChapter: "Edit chapter",
    renameChapterHeading: "Choose a new name for your chapter",
    save: "Save",
    cancel: "Cancel",
    toggleFolder: "Open or close folder",
    renameBook: "Rename book",
    addChapter: "Add chapter",
    dragChapter: "Drag to change the order",
    renameChapter: "Rename chapter",
    deleteBook: "Delete book",
    folderColor: "Change folder color",
    customizeSpace: "Customize writing space",
    nameWritingSpace: "What title would you like to use?",
    writingSpaceTitle: "Writing space title",
    workspaceRenamed: "Title updated",
    booksReordered: "Book order updated",
    bookCreated: "New book created",
    chapterAdded: "Chapter added",
    orderChanged: "Order changed",
    chapterDuplicated: "Chapter duplicated",
    formattingCleared: "Formatting cleared from selection",
    chapterDeleted: "Chapter deleted",
    bookDeleted: "Book deleted",
    deleteChapterConfirm: "Do you want to delete ‘{title}’?",
    deleteBookConfirm: "Do you want to delete ‘{title}’ and all its chapters?",
    usernameTooShort: "Use at least 3 characters for your username.",
    passwordTooShort: "Use at least 6 characters for your password.",
    passwordsMismatch: "The passwords do not match.",
    usernameExists: "This username already exists.",
    invalidLogin: "The username or password is incorrect.",
    accountCreated: "Account created. Welcome!",
    loggedOut: "You have been logged out.",
  },
};

let language = localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "nl";
let currentUser = getValidSession();
let state = currentUser ? loadState() : createInitialState(language);
let saveTimer;
let toastTimer;
let dialogAction = null;
let draggedChapter = null;
let draggedBookId = null;
let savedEditorRange = null;
let authMode = "login";

const els = {
  authScreen: document.querySelector("#authScreen"),
  authForm: document.querySelector("#authForm"),
  authHeading: document.querySelector("#authHeading"),
  authIntro: document.querySelector("#authIntro"),
  authError: document.querySelector("#authError"),
  authSubmit: document.querySelector("#authSubmit"),
  loginTab: document.querySelector("#loginTab"),
  registerTab: document.querySelector("#registerTab"),
  usernameInput: document.querySelector("#usernameInput"),
  passwordInput: document.querySelector("#passwordInput"),
  confirmPasswordInput: document.querySelector("#confirmPasswordInput"),
  confirmPasswordGroup: document.querySelector("#confirmPasswordGroup"),
  togglePassword: document.querySelector("#togglePassword"),
  authLanguageSwitch: document.querySelector("#authLanguageSwitch"),
  languageSwitch: document.querySelector("#languageSwitch"),
  accountButton: document.querySelector("#accountButton"),
  accountAvatar: document.querySelector("#accountAvatar"),
  accountName: document.querySelector("#accountName"),
  appTitle: document.querySelector("#appTitle"),
  logoutButton: document.querySelector("#logoutButton"),
  renameWorkspace: document.querySelector("#renameWorkspace"),
  bookTree: document.querySelector("#bookTree"),
  editor: document.querySelector("#editor"),
  chapterTitle: document.querySelector("#chapterTitle"),
  breadcrumb: document.querySelector("#breadcrumb"),
  saveState: document.querySelector("#saveState"),
  toolbar: document.querySelector("#toolbar"),
  fontName: document.querySelector("#fontName"),
  blockFormat: document.querySelector("#blockFormat"),
  textColor: document.querySelector("#textColor"),
  highlightColor: document.querySelector("#highlightColor"),
  wordCount: document.querySelector("#wordCount"),
  characterCount: document.querySelector("#characterCount"),
  readingTime: document.querySelector("#readingTime"),
  progressText: document.querySelector("#progressText"),
  progressFill: document.querySelector("#progressFill"),
  addBookButton: document.querySelector("#addBookButton"),
  newBookButton: document.querySelector("#newBookButton"),
  focusButton: document.querySelector("#focusButton"),
  moreButton: document.querySelector("#moreButton"),
  moreMenu: document.querySelector("#moreMenu"),
  duplicateChapter: document.querySelector("#duplicateChapter"),
  clearFormatting: document.querySelector("#clearFormatting"),
  deleteChapter: document.querySelector("#deleteChapter"),
  openSidebar: document.querySelector("#openSidebar"),
  closeSidebar: document.querySelector("#closeSidebar"),
  sidebarBackdrop: document.querySelector("#sidebarBackdrop"),
  dialogBackdrop: document.querySelector("#dialogBackdrop"),
  nameDialog: document.querySelector("#nameDialog"),
  dialogEyebrow: document.querySelector("#dialogEyebrow"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogLabel: document.querySelector("#dialogLabel"),
  nameInput: document.querySelector("#nameInput"),
  confirmDialog: document.querySelector("#confirmDialog"),
  cancelDialog: document.querySelector("#cancelDialog"),
  toast: document.querySelector("#toast"),
};

function t(key, values = {}) {
  let result = translations[language][key] || translations.nl[key] || key;
  Object.entries(values).forEach(([name, value]) => {
    result = result.replace(`{${name}}`, value);
  });
  return result;
}

function normalizeUsername(value) {
  return value.trim().toLocaleLowerCase("en-US");
}

function getAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getValidSession() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  return getAccounts().some((account) => account.key === session) ? session : null;
}

function userStorageKey(userKey) {
  return `pink-fluffy-stories-user-${encodeURIComponent(userKey)}`;
}

async function hashPassword(username, password) {
  const input = `${normalizeUsername(username)}:${password}:pink-fluffy-stories`;
  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  let fallback = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    fallback ^= input.charCodeAt(index);
    fallback = Math.imul(fallback, 16777619);
  }
  return `fallback-${(fallback >>> 0).toString(16)}`;
}

function createInitialState(selectedLanguage = "nl") {
  const english = selectedLanguage === "en";
  return {
    appTitle: "Pink Fluffy Stories",
    activeBookId: "book-1",
    activeChapterId: "chapter-2",
    dailyStartWords: 0,
    books: [
      {
        id: "book-1",
        title: english ? "The garden of lost dreams" : "De tuin van verloren dromen",
        color: "#d98eaa",
        collapsed: false,
        chapters: [
          {
            id: "chapter-1",
            title: english ? "Prologue" : "Proloog",
            content: english ? "<p>Every dream begins as a whisper.</p>" : "<p>Elke droom begint als een fluistering.</p>",
          },
          {
            id: "chapter-2",
            title: english ? "Chapter 1 — The pink door" : "Hoofdstuk 1 — De roze deur",
            content: english
              ? "<p>The door had not been there yesterday.</p><p>Elara was certain. She knew every stone in the old garden wall, every crack where moss grew in soft clouds. But now a narrow pink door stood there, with a shining knob shaped like a rose.</p><blockquote>Every story waits for someone brave enough to open it.</blockquote>"
              : "<p>De deur was er gisteren nog niet geweest.</p><p>Elara wist dat zeker. Ze kende elke steen in de oude tuinmuur, elke kier waar het mos in zachte wolkjes groeide. Maar nu stond daar een smalle, roze deur, met een glanzende knop in de vorm van een roos.</p><blockquote>Alle verhalen wachten op iemand die dapper genoeg is om ze te openen.</blockquote>",
          },
          { id: "chapter-3", title: english ? "Chapter 2 — A strange letter" : "Hoofdstuk 2 — Een vreemde brief", content: "" },
        ],
      },
      {
        id: "book-2",
        title: english ? "Short stories" : "Korte verhalen",
        color: "#b88cc7",
        collapsed: true,
        chapters: [{ id: "chapter-4", title: english ? "The star station" : "Het sterrenstation", content: "" }],
      },
    ],
  };
}

function createBlankBook() {
  const chapter = { id: uid(), title: t("defaultChapter"), content: "" };
  return { id: uid(), title: t("emptyBook"), color: nextFolderColor(), collapsed: false, chapters: [chapter] };
}

function loadState() {
  try {
    const stored = localStorage.getItem(userStorageKey(currentUser));
    if (!stored) return createInitialState(language);
    const parsed = JSON.parse(stored);
    if (!parsed.books?.length) return createInitialState(language);
    parsed.appTitle ||= "Pink Fluffy Stories";
    parsed.books.forEach((book, index) => {
      book.color ||= folderPalette[index % folderPalette.length];
    });
    return parsed;
  } catch {
    return createInitialState(language);
  }
}

function writeState(userKey = currentUser) {
  if (!userKey) return;
  localStorage.setItem(userStorageKey(userKey), JSON.stringify(state));
}

function saveState(showIndicator = true) {
  if (!currentUser) return;
  clearTimeout(saveTimer);
  const userAtSave = currentUser;
  if (showIndicator) {
    els.saveState.classList.add("saving");
    els.saveState.lastElementChild.textContent = t("saving");
  }
  saveTimer = setTimeout(() => {
    writeState(userAtSave);
    els.saveState.classList.remove("saving");
    els.saveState.lastElementChild.textContent = t("saved");
  }, showIndicator ? 350 : 0);
}

function getActiveBook() {
  return state.books.find((book) => book.id === state.activeBookId) || state.books[0];
}

function getActiveChapter() {
  const book = getActiveBook();
  return book?.chapters.find((chapter) => chapter.id === state.activeChapterId) || book?.chapters[0];
}

function getCurrentAccount() {
  return getAccounts().find((account) => account.key === currentUser);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function nextFolderColor() {
  return folderPalette[state?.books?.length % folderPalette.length] || folderPalette[0];
}

function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : folderPalette[0];
}

function renderAppTitle() {
  const title = state.appTitle?.trim() || "Pink Fluffy Stories";
  els.appTitle.textContent = title;
  document.title = title;
}

function applyTranslations() {
  document.documentElement.lang = language;
  els.languageSwitch.value = language;
  els.authLanguageSwitch.value = language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  els.cancelDialog.textContent = t("cancel");
  els.editor.dataset.placeholder = language === "en" ? "Start writing here..." : "Begin hier met schrijven...";
  updateAuthModeText();
  if (currentUser) {
    renderAppTitle();
    renderActiveChapter();
    els.saveState.lastElementChild.textContent = t("saved");
  }
}

function updateAuthModeText() {
  const registering = authMode === "register";
  els.authForm.classList.toggle("registering", registering);
  els.loginTab.classList.toggle("active", !registering);
  els.registerTab.classList.toggle("active", registering);
  els.loginTab.setAttribute("aria-selected", String(!registering));
  els.registerTab.setAttribute("aria-selected", String(registering));
  els.confirmPasswordInput.required = registering;
  document.querySelector(".auth-copy .eyebrow").textContent = t(registering ? "registerEyebrow" : "welcomeEyebrow");
  els.authHeading.textContent = t(registering ? "registerHeading" : "loginHeading");
  els.authIntro.textContent = t(registering ? "registerIntro" : "loginIntro");
  els.authSubmit.textContent = t(registering ? "register" : "login");
  els.passwordInput.autocomplete = registering ? "new-password" : "current-password";
}

function setAuthMode(mode) {
  authMode = mode;
  els.authError.textContent = "";
  updateAuthModeText();
}

function showApp() {
  const account = getCurrentAccount();
  document.body.classList.add("authenticated");
  els.accountName.textContent = account?.username || currentUser;
  els.accountAvatar.textContent = (account?.username || "A").charAt(0);
  renderAppTitle();
  renderActiveChapter();
  saveState(false);
}

function showLogin() {
  document.body.classList.remove("authenticated", "sidebar-open", "focus-mode");
  els.moreMenu.classList.remove("open");
  els.authForm.reset();
  els.authError.textContent = "";
  setAuthMode(getAccounts().length ? "login" : "register");
  setTimeout(() => els.usernameInput.focus(), 50);
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  els.authError.textContent = "";
  const username = els.usernameInput.value.trim();
  const userKey = normalizeUsername(username);
  const password = els.passwordInput.value;

  if (username.length < 3) {
    els.authError.textContent = t("usernameTooShort");
    return;
  }
  if (password.length < 6) {
    els.authError.textContent = t("passwordTooShort");
    return;
  }

  const accounts = getAccounts();
  const existing = accounts.find((account) => account.key === userKey);

  if (authMode === "register") {
    if (password !== els.confirmPasswordInput.value) {
      els.authError.textContent = t("passwordsMismatch");
      return;
    }
    if (existing) {
      els.authError.textContent = t("usernameExists");
      return;
    }

    const passwordHash = await hashPassword(username, password);
    accounts.push({ key: userKey, username, passwordHash });
    saveAccounts(accounts);
    currentUser = userKey;
    localStorage.setItem(SESSION_KEY, currentUser);

    let migrated = null;
    if (accounts.length === 1) {
      try {
        migrated = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
      } catch {
        migrated = null;
      }
    }
    state = migrated?.books?.length ? migrated : createInitialState(language);
    writeState();
    showApp();
    showToast(t("accountCreated"));
    return;
  }

  if (!existing || existing.passwordHash !== (await hashPassword(username, password))) {
    els.authError.textContent = t("invalidLogin");
    return;
  }

  currentUser = existing.key;
  localStorage.setItem(SESSION_KEY, currentUser);
  state = loadState();
  showApp();
}

function logout() {
  persistEditor();
  clearTimeout(saveTimer);
  writeState();
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  state = createInitialState(language);
  showLogin();
}

function renderTree() {
  els.bookTree.innerHTML = state.books
    .map(
      (book) => `
        <section class="book ${book.collapsed ? "collapsed" : ""}" data-book-id="${book.id}">
          <div class="book-row" data-action="toggle-book" title="${t("toggleFolder")}" draggable="true">
            <span class="book-drag-handle" aria-hidden="true">⠿</span>
            <span class="book-toggle">▾</span>
            <span class="folder-icon" aria-hidden="true" style="--folder-color: ${safeColor(book.color)}"></span>
            <span class="row-label">${escapeHtml(book.title)}</span>
            <label class="book-color-control" title="${t("folderColor")}">
              <input class="book-color-input" type="color" value="${safeColor(book.color)}" data-action="book-color" aria-label="${t("folderColor")}" />
            </label>
            <button class="row-action" data-action="rename-book" title="${t("renameBook")}" aria-label="${t("renameBook")}">✎</button>
            <button class="row-action" data-action="add-chapter" title="${t("addChapter")}" aria-label="${t("addChapter")}">＋</button>
            <button class="row-action danger" data-action="delete-book" title="${t("deleteBook")}" aria-label="${t("deleteBook")}">×</button>
          </div>
          <div class="chapter-list">
            ${book.chapters
              .map(
                (chapter) => `
                  <div class="chapter-row ${chapter.id === state.activeChapterId ? "selected" : ""}" data-chapter-id="${chapter.id}" draggable="true" title="${t("dragChapter")}">
                    <span class="drag-handle" aria-hidden="true">⠿</span>
                    <span class="chapter-icon" aria-hidden="true">${chapter.id === state.activeChapterId ? "♥" : "◇"}</span>
                    <span class="row-label">${escapeHtml(chapter.title)}</span>
                    <button class="row-action" data-action="rename-chapter" title="${t("renameChapter")}" aria-label="${t("renameChapter")}">✎</button>
                    <button class="row-action danger" data-action="delete-chapter" title="${t("deleteChapter")}" aria-label="${t("deleteChapter")}">×</button>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      `,
    )
    .join("");
}

function renderActiveChapter() {
  let book = getActiveBook();
  if (!book) {
    book = createBlankBook();
    state.books = [book];
    state.activeBookId = book.id;
  }
  let chapter = getActiveChapter();

  if (!chapter) {
    chapter = { id: uid(), title: t("defaultChapter"), content: "" };
    book.chapters.push(chapter);
    state.activeChapterId = chapter.id;
  }

  state.activeBookId = book.id;
  renderAppTitle();
  els.chapterTitle.value = chapter.title;
  els.breadcrumb.textContent = `${book.title} / ${chapter.title}`;
  els.editor.innerHTML = chapter.content;
  updateStats();
  renderTree();
}

function selectChapter(bookId, chapterId) {
  persistEditor();
  state.activeBookId = bookId;
  state.activeChapterId = chapterId;
  const book = getActiveBook();
  book.collapsed = false;
  renderActiveChapter();
  saveState(false);
  document.body.classList.remove("sidebar-open");
}

function persistEditor() {
  if (!currentUser) return;
  const chapter = getActiveChapter();
  if (!chapter) return;
  chapter.content = els.editor.innerHTML;
  chapter.title = els.chapterTitle.value.trim() || t("unnamedChapter");
  saveState();
}

function updateStats() {
  const text = els.editor.innerText.replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  const characters = text.length;
  const minutes = words ? Math.max(1, Math.ceil(words / 220)) : 0;
  const today = Math.max(0, words - (state.dailyStartWords || 0));

  els.wordCount.textContent = `${words} ${words === 1 ? t("wordsOne") : t("wordsMany")}`;
  els.characterCount.textContent = `${characters} ${t("characters")}`;
  els.readingTime.textContent = `${minutes} ${t("readingTime")}`;
  els.progressText.textContent = `${today} ${t("wordsToday")}`;
  els.progressFill.style.width = `${Math.min(100, (today / 500) * 100)}%`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function openDialog(type, bookId = null, chapterId = null) {
  const config = {
    newBook: ["newStory", "nameBook", "bookTitle", "defaultBook", "create"],
    newChapter: ["newChapter", "nameChapter", "chapterTitle", "defaultChapter", "add"],
    renameBook: ["editBook", "renameBookHeading", "bookTitle", "", "save"],
    renameChapter: ["editChapter", "renameChapterHeading", "chapterTitle", "", "save"],
    renameWorkspace: ["customizeSpace", "nameWritingSpace", "writingSpaceTitle", "", "save"],
  }[type];

  if (!config) return;
  dialogAction = { type, bookId, chapterId };
  els.dialogEyebrow.textContent = t(config[0]);
  els.dialogTitle.textContent = t(config[1]);
  els.dialogLabel.textContent = t(config[2]);
  els.nameInput.placeholder = config[3] ? t(config[3]) : "";
  els.confirmDialog.textContent = t(config[4]);
  els.cancelDialog.textContent = t("cancel");

  if (type === "renameWorkspace") {
    els.nameInput.value = state.appTitle || "Pink Fluffy Stories";
  } else if (type === "renameBook") {
    els.nameInput.value = state.books.find((book) => book.id === bookId)?.title || "";
  } else if (type === "renameChapter") {
    const book = state.books.find((item) => item.id === bookId);
    els.nameInput.value = book?.chapters.find((chapter) => chapter.id === chapterId)?.title || "";
  } else {
    els.nameInput.value = "";
  }

  els.dialogBackdrop.classList.add("open");
  setTimeout(() => els.nameInput.focus(), 50);
}

function closeDialog() {
  els.dialogBackdrop.classList.remove("open");
  dialogAction = null;
}

function handleDialogSubmit(event) {
  event.preventDefault();
  const title = els.nameInput.value.trim();
  if (!title || !dialogAction) return;
  const { type, bookId, chapterId } = dialogAction;

  if (type === "newBook") {
    persistEditor();
    const newBook = { id: uid(), title, color: nextFolderColor(), collapsed: false, chapters: [{ id: uid(), title: t("defaultChapter"), content: "" }] };
    state.books.push(newBook);
    state.activeBookId = newBook.id;
    state.activeChapterId = newBook.chapters[0].id;
    renderActiveChapter();
    showToast(t("bookCreated"));
  }

  if (type === "newChapter") {
    persistEditor();
    const book = state.books.find((item) => item.id === bookId);
    if (book) {
      const chapter = { id: uid(), title, content: "" };
      book.chapters.push(chapter);
      book.collapsed = false;
      state.activeBookId = book.id;
      state.activeChapterId = chapter.id;
      renderActiveChapter();
      showToast(t("chapterAdded"));
    }
  }

  if (type === "renameBook") {
    const book = state.books.find((item) => item.id === bookId);
    if (book) book.title = title;
    renderActiveChapter();
  }

  if (type === "renameChapter") {
    const book = state.books.find((item) => item.id === bookId);
    const chapter = book?.chapters.find((item) => item.id === chapterId);
    if (chapter) chapter.title = title;
    renderActiveChapter();
  }

  if (type === "renameWorkspace") {
    state.appTitle = title;
    renderAppTitle();
    showToast(t("workspaceRenamed"));
  }

  saveState();
  closeDialog();
}

function deleteBook(bookId) {
  const book = state.books.find((item) => item.id === bookId);
  if (!book || !window.confirm(t("deleteBookConfirm", { title: book.title }))) return;
  persistEditor();
  const index = state.books.findIndex((item) => item.id === bookId);
  state.books.splice(index, 1);
  if (!state.books.length) state.books.push(createBlankBook());
  const nextBook = state.books[Math.min(index, state.books.length - 1)];
  state.activeBookId = nextBook.id;
  state.activeChapterId = nextBook.chapters[0].id;
  renderActiveChapter();
  saveState();
  showToast(t("bookDeleted"));
}

function deleteChapterFromBook(bookId, chapterId) {
  const book = state.books.find((item) => item.id === bookId);
  const chapter = book?.chapters.find((item) => item.id === chapterId);
  if (!book || !chapter || !window.confirm(t("deleteChapterConfirm", { title: chapter.title }))) return;
  const index = book.chapters.findIndex((item) => item.id === chapterId);
  book.chapters.splice(index, 1);
  if (!book.chapters.length) book.chapters.push({ id: uid(), title: t("defaultChapter"), content: "" });

  if (state.activeChapterId === chapterId) {
    state.activeBookId = book.id;
    state.activeChapterId = book.chapters[Math.min(index, book.chapters.length - 1)].id;
    renderActiveChapter();
  } else {
    renderTree();
  }
  saveState();
  els.moreMenu.classList.remove("open");
  showToast(t("chapterDeleted"));
}

function moveChapter(sourceBookId, sourceChapterId, targetBookId, targetChapterId) {
  const sourceBook = state.books.find((book) => book.id === sourceBookId);
  const targetBook = state.books.find((book) => book.id === targetBookId);
  if (!sourceBook || !targetBook) return;
  const sourceIndex = sourceBook.chapters.findIndex((chapter) => chapter.id === sourceChapterId);
  const targetIndex = targetBook.chapters.findIndex((chapter) => chapter.id === targetChapterId);
  if (sourceIndex < 0 || targetIndex < 0) return;

  const [moved] = sourceBook.chapters.splice(sourceIndex, 1);
  targetBook.chapters.splice(targetIndex, 0, moved);
  if (!sourceBook.chapters.length) sourceBook.chapters.push({ id: uid(), title: t("defaultChapter"), content: "" });
  state.activeBookId = targetBook.id;
  state.activeChapterId = moved.id;
  renderActiveChapter();
  saveState();
  showToast(t("orderChanged"));
}

function moveBook(sourceBookId, targetBookId) {
  const sourceIndex = state.books.findIndex((book) => book.id === sourceBookId);
  const targetIndex = state.books.findIndex((book) => book.id === targetBookId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
  const [moved] = state.books.splice(sourceIndex, 1);
  state.books.splice(targetIndex, 0, moved);
  renderTree();
  saveState();
  showToast(t("booksReordered"));
}

function runCommand(command, value = null) {
  els.editor.focus();
  if (savedEditorRange) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedEditorRange);
  }
  document.execCommand(command, false, value);
  persistEditor();
  updateToolbarState();
}

function updateToolbarState() {
  els.toolbar.querySelectorAll("button[data-command]").forEach((button) => {
    const command = button.dataset.command;
    if (["undo", "redo"].includes(command)) return;
    try {
      button.classList.toggle("active", document.queryCommandState(command));
    } catch {
      button.classList.remove("active");
    }
  });
}

function changeLanguage(value) {
  language = value === "en" ? "en" : "nl";
  localStorage.setItem(LANGUAGE_KEY, language);
  applyTranslations();
}

els.authForm.addEventListener("submit", handleAuthSubmit);
els.loginTab.addEventListener("click", () => setAuthMode("login"));
els.registerTab.addEventListener("click", () => setAuthMode("register"));
els.togglePassword.addEventListener("click", () => {
  const reveal = els.passwordInput.type === "password";
  els.passwordInput.type = reveal ? "text" : "password";
  els.confirmPasswordInput.type = reveal ? "text" : "password";
});
els.authLanguageSwitch.addEventListener("change", () => changeLanguage(els.authLanguageSwitch.value));
els.languageSwitch.addEventListener("change", () => changeLanguage(els.languageSwitch.value));

els.bookTree.addEventListener("click", (event) => {
  const bookElement = event.target.closest(".book");
  if (!bookElement) return;
  const bookId = bookElement.dataset.bookId;
  const chapterElement = event.target.closest(".chapter-row");
  const action = event.target.closest("[data-action]")?.dataset.action;

  if (action === "add-chapter") return openDialog("newChapter", bookId);
  if (action === "book-color") return;
  if (action === "rename-book") return openDialog("renameBook", bookId);
  if (action === "delete-book") return deleteBook(bookId);
  if (action === "rename-chapter" && chapterElement) return openDialog("renameChapter", bookId, chapterElement.dataset.chapterId);
  if (action === "delete-chapter" && chapterElement) return deleteChapterFromBook(bookId, chapterElement.dataset.chapterId);
  if (chapterElement) return selectChapter(bookId, chapterElement.dataset.chapterId);
  if (action === "toggle-book") {
    const book = state.books.find((item) => item.id === bookId);
    book.collapsed = !book.collapsed;
    renderTree();
    saveState(false);
  }
});

els.bookTree.addEventListener("input", (event) => {
  const colorInput = event.target.closest('[data-action="book-color"]');
  const bookElement = event.target.closest(".book");
  if (!colorInput || !bookElement) return;
  const book = state.books.find((item) => item.id === bookElement.dataset.bookId);
  if (!book) return;
  book.color = safeColor(colorInput.value);
  bookElement.querySelector(".folder-icon").style.setProperty("--folder-color", book.color);
  saveState();
});

els.bookTree.addEventListener("dragstart", (event) => {
  const row = event.target.closest(".chapter-row");
  const book = event.target.closest(".book");
  if (!book) return;

  if (row) {
    draggedChapter = { bookId: book.dataset.bookId, chapterId: row.dataset.chapterId };
    row.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.dataset.chapterId);
    return;
  }

  const bookRow = event.target.closest(".book-row");
  if (!bookRow || event.target.closest("button, input, label")) {
    event.preventDefault();
    return;
  }
  draggedBookId = book.dataset.bookId;
  book.classList.add("dragging-book");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedBookId);
});

els.bookTree.addEventListener("dragover", (event) => {
  if (draggedBookId) {
    const targetBook = event.target.closest(".book");
    if (!targetBook || targetBook.dataset.bookId === draggedBookId) return;
    event.preventDefault();
    els.bookTree.querySelectorAll(".book-drag-over").forEach((item) => item.classList.remove("book-drag-over"));
    targetBook.classList.add("book-drag-over");
    return;
  }

  const row = event.target.closest(".chapter-row");
  if (!row || !draggedChapter) return;
  event.preventDefault();
  els.bookTree.querySelectorAll(".drag-over").forEach((item) => item.classList.remove("drag-over"));
  row.classList.add("drag-over");
});

els.bookTree.addEventListener("drop", (event) => {
  event.preventDefault();
  if (draggedBookId) {
    const targetBook = event.target.closest(".book");
    if (targetBook) moveBook(draggedBookId, targetBook.dataset.bookId);
    return;
  }

  const row = event.target.closest(".chapter-row");
  const book = event.target.closest(".book");
  if (!row || !book || !draggedChapter) return;
  moveChapter(draggedChapter.bookId, draggedChapter.chapterId, book.dataset.bookId, row.dataset.chapterId);
});

els.bookTree.addEventListener("dragend", () => {
  els.bookTree.querySelectorAll(".dragging, .drag-over, .dragging-book, .book-drag-over").forEach((item) => item.classList.remove("dragging", "drag-over", "dragging-book", "book-drag-over"));
  draggedChapter = null;
  draggedBookId = null;
});

els.editor.addEventListener("input", () => {
  persistEditor();
  updateStats();
});
els.editor.addEventListener("keyup", updateToolbarState);
els.editor.addEventListener("mouseup", updateToolbarState);

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (els.editor.contains(range.commonAncestorContainer)) savedEditorRange = range.cloneRange();
});

els.chapterTitle.addEventListener("input", () => {
  const chapter = getActiveChapter();
  if (!chapter) return;
  chapter.title = els.chapterTitle.value;
  els.breadcrumb.textContent = `${getActiveBook().title} / ${chapter.title}`;
  renderTree();
  saveState();
});

els.chapterTitle.addEventListener("blur", () => {
  if (!els.chapterTitle.value.trim()) {
    els.chapterTitle.value = t("unnamedChapter");
    persistEditor();
    renderTree();
  }
});

els.toolbar.addEventListener("mousedown", (event) => {
  if (event.target.closest("button")) event.preventDefault();
});
els.toolbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-command]");
  if (button) runCommand(button.dataset.command);
});
els.fontName.addEventListener("change", () => runCommand("fontName", els.fontName.value));
els.blockFormat.addEventListener("change", () => runCommand("formatBlock", `<${els.blockFormat.value}>`));
els.textColor.addEventListener("input", () => runCommand("foreColor", els.textColor.value));
els.highlightColor.addEventListener("input", () => runCommand("hiliteColor", els.highlightColor.value));

[els.addBookButton, els.newBookButton].forEach((button) => button.addEventListener("click", () => openDialog("newBook")));
els.nameDialog.addEventListener("submit", handleDialogSubmit);
els.cancelDialog.addEventListener("click", closeDialog);
els.dialogBackdrop.addEventListener("click", (event) => {
  if (event.target === els.dialogBackdrop) closeDialog();
});

els.focusButton.addEventListener("click", () => {
  document.body.classList.toggle("focus-mode");
  els.focusButton.classList.toggle("active", document.body.classList.contains("focus-mode"));
  els.focusButton.querySelector("span:first-child").textContent = document.body.classList.contains("focus-mode") ? "☀" : "☾";
});

[els.moreButton, els.accountButton].forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    els.moreMenu.classList.toggle("open");
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".document-actions")) els.moreMenu.classList.remove("open");
});

els.duplicateChapter.addEventListener("click", () => {
  persistEditor();
  const book = getActiveBook();
  const chapter = getActiveChapter();
  const index = book.chapters.findIndex((item) => item.id === chapter.id);
  const copy = { ...chapter, id: uid(), title: `${chapter.title} (${language === "en" ? "copy" : "kopie"})` };
  book.chapters.splice(index + 1, 0, copy);
  state.activeChapterId = copy.id;
  renderActiveChapter();
  saveState();
  els.moreMenu.classList.remove("open");
  showToast(t("chapterDuplicated"));
});

els.clearFormatting.addEventListener("click", () => {
  runCommand("removeFormat");
  els.moreMenu.classList.remove("open");
  showToast(t("formattingCleared"));
});

els.deleteChapter.addEventListener("click", () => {
  const book = getActiveBook();
  const chapter = getActiveChapter();
  if (book && chapter) deleteChapterFromBook(book.id, chapter.id);
});
els.renameWorkspace.addEventListener("click", () => {
  els.moreMenu.classList.remove("open");
  openDialog("renameWorkspace");
});
els.logoutButton.addEventListener("click", logout);

els.openSidebar.addEventListener("click", () => document.body.classList.add("sidebar-open"));
els.closeSidebar.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
els.sidebarBackdrop.addEventListener("click", () => document.body.classList.remove("sidebar-open"));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDialog();
    els.moreMenu.classList.remove("open");
    document.body.classList.remove("sidebar-open");
  }
});

window.addEventListener("beforeunload", () => {
  if (!currentUser) return;
  const chapter = getActiveChapter();
  if (chapter) {
    chapter.content = els.editor.innerHTML;
    chapter.title = els.chapterTitle.value.trim() || t("unnamedChapter");
  }
  writeState();
});

applyTranslations();
if (currentUser) showApp();
else showLogin();
