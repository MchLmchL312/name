const LEGACY_STORAGE_KEY = "pink-fluffy-stories-v1";
const ACCOUNTS_KEY = "pink-fluffy-accounts-v1";
const SESSION_KEY = "pink-fluffy-session-v1";
const LANGUAGE_KEY = "pink-fluffy-language-v1";
const BACKUP_KEY_PREFIX = "pink-fluffy-stories-backups-v1-";
const BACKUP_FORMAT = "pink-fluffy-stories-backup";
const MAX_AUTOMATIC_BACKUPS = 12;
const MAX_BACKUP_STORAGE_SIZE = 2500000;
const BACKUP_DELAY = 2500;
const CLOUD_SAVE_DELAY = 650;
const MAX_CLOUD_BACKUPS = 30;

const memoryStorage = new Map();
const storage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) || null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  },
};

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
    registerIntro: "Kies een e-mailadres, gebruikersnaam en wachtwoord voor je persoonlijke bibliotheek.",
    login: "Inloggen",
    register: "Account maken",
    email: "E-mailadres",
    username: "Gebruikersnaam",
    password: "Wachtwoord",
    confirmPassword: "Herhaal wachtwoord",
    localAccountNote: "Je account en verhalen worden veilig online gesynchroniseerd; lokale back-ups blijven beschikbaar.",
    downloadBackup: "Back-up downloaden",
    restoreBackupFile: "Back-upbestand herstellen",
    restorePreviousVersion: "Vorige versie herstellen",
    backupDownloaded: "Back-up gedownload",
    backupRestored: "Back-up hersteld",
    backupUnavailable: "Er is nog geen eerdere versie beschikbaar.",
    backupInvalid: "Dit is geen geldige Pink Fluffy Stories-back-up.",
    backupWrongAccount: "Deze back-up hoort bij een ander account.",
    restoreBackupConfirm: "De versie van {date} herstellen? Je huidige versie wordt eerst veilig bewaard.",
    myLibrary: "Mijn bibliotheek",
    newBook: "Nieuw boek",
    storiesSaved: "Jouw verhalen, veilig bewaard",
    saved: "Opgeslagen",
    saving: "Opslaan…",
    saveFailed: "Opslaan mislukt — download een back-up",
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
    invalidLogin: "E-mailadres of wachtwoord is niet juist.",
    accountCreated: "Account gemaakt. Welkom!",
    checkEmail: "Controleer je e-mail en bevestig je account voordat je inlogt.",
    cloudUnavailable: "Online inloggen is tijdelijk niet beschikbaar. Controleer je internetverbinding.",
    loggedOut: "Je bent uitgelogd.",
  },
  en: {
    writingSpace: "My writing space",
    welcomeEyebrow: "Welcome back",
    loginHeading: "Continue writing your story",
    loginIntro: "Log in to open your own books and chapters.",
    registerEyebrow: "Your story starts here",
    registerHeading: "Create your own writing space",
    registerIntro: "Choose an email address, username, and password for your personal library.",
    login: "Log in",
    register: "Create account",
    email: "Email address",
    username: "Username",
    password: "Password",
    confirmPassword: "Repeat password",
    localAccountNote: "Your account and stories are synced securely online; local backups remain available.",
    downloadBackup: "Download backup",
    restoreBackupFile: "Restore backup file",
    restorePreviousVersion: "Restore previous version",
    backupDownloaded: "Backup downloaded",
    backupRestored: "Backup restored",
    backupUnavailable: "No earlier version is available yet.",
    backupInvalid: "This is not a valid Pink Fluffy Stories backup.",
    backupWrongAccount: "This backup belongs to another account.",
    restoreBackupConfirm: "Restore the version from {date}? Your current version will be saved first.",
    myLibrary: "My library",
    newBook: "New book",
    storiesSaved: "Your stories, safely kept",
    saved: "Saved",
    saving: "Saving…",
    saveFailed: "Saving failed — download a backup",
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
    invalidLogin: "The email address or password is incorrect.",
    accountCreated: "Account created. Welcome!",
    checkEmail: "Check your email and confirm your account before logging in.",
    cloudUnavailable: "Online login is temporarily unavailable. Check your internet connection.",
    loggedOut: "You have been logged out.",
  },
};

const cloudClient = window.supabase && window.SUPABASE_CONFIG
  ? window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.publishableKey, {
      auth: {
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

let language = storage.getItem(LANGUAGE_KEY) === "en" ? "en" : "nl";
let currentCloudUser = null;
let currentUser = cloudClient ? null : getValidSession();
let state = currentUser ? loadState() : createInitialState(language);
let saveTimer;
let cloudSaveTimer;
let cloudSaveChain = Promise.resolve();
let backupTimer;
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
  emailInput: document.querySelector("#emailInput"),
  usernameLabel: document.querySelector("#usernameLabel"),
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
  downloadBackupButton: document.querySelector("#downloadBackupButton"),
  restoreBackupButton: document.querySelector("#restoreBackupButton"),
  restorePreviousButton: document.querySelector("#restorePreviousButton"),
  backupFileInput: document.querySelector("#backupFileInput"),
  renameWorkspace: document.querySelector("#renameWorkspace"),
  bookTree: document.querySelector("#bookTree"),
  editor: document.querySelector("#editor"),
  chapterTitle: document.querySelector("#chapterTitle"),
  breadcrumb: document.querySelector("#breadcrumb"),
  saveState: document.querySelector("#saveState"),
  toolbar: document.querySelector("#toolbar"),
  fontName: document.querySelector("#fontName"),
  fontSize: document.querySelector("#fontSize"),
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
    const accounts = JSON.parse(storage.getItem(ACCOUNTS_KEY) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  storage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getValidSession() {
  const session = storage.getItem(SESSION_KEY);
  if (!session) return null;
  return getAccounts().some((account) => account.key === session) ? session : null;
}

function userStorageKey(userKey) {
  return `pink-fluffy-stories-user-${encodeURIComponent(userKey)}`;
}

function backupStorageKey(userKey) {
  return `${BACKUP_KEY_PREFIX}${encodeURIComponent(userKey)}`;
}

function getAutomaticBackups(userKey = currentUser) {
  if (!userKey) return [];
  try {
    const backups = JSON.parse(storage.getItem(backupStorageKey(userKey)) || "[]");
    return Array.isArray(backups) ? backups.filter((backup) => backup?.state?.books?.length) : [];
  } catch {
    return [];
  }
}

function saveAutomaticBackups(userKey, backups) {
  const trimmed = backups.slice(0, MAX_AUTOMATIC_BACKUPS);
  while (trimmed.length > 1 && JSON.stringify(trimmed).length > MAX_BACKUP_STORAGE_SIZE) trimmed.pop();

  while (trimmed.length) {
    try {
      storage.setItem(backupStorageKey(userKey), JSON.stringify(trimmed));
      return true;
    } catch {
      if (trimmed.length === 1) return false;
      trimmed.pop();
    }
  }
  return false;
}

function cloudUsername(user = currentCloudUser) {
  return user?.user_metadata?.username?.trim() || user?.email?.split("@")[0] || "Account";
}

async function syncStateToCloud(stateSnapshot = clone(state)) {
  if (!cloudClient || !currentCloudUser) return false;
  try {
    const { error } = await cloudClient.from("writing_spaces").upsert(
      {
        user_id: currentCloudUser.id,
        username: cloudUsername(),
        state: stateSnapshot,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    els.saveState.classList.remove("saving", "save-error");
    els.saveState.lastElementChild.textContent = t("saved");
    return true;
  } catch (error) {
    console.warn("Cloud save failed", error?.message || error);
    els.saveState.classList.remove("saving");
    els.saveState.classList.add("save-error");
    els.saveState.lastElementChild.textContent = t("saveFailed");
    return false;
  }
}

function scheduleCloudSave() {
  if (!cloudClient || !currentCloudUser) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => {
    const snapshot = clone(state);
    cloudSaveChain = cloudSaveChain.then(() => syncStateToCloud(snapshot));
  }, CLOUD_SAVE_DELAY);
}

async function saveCloudBackup(reason, backupState) {
  if (!cloudClient || !currentCloudUser) return;
  try {
    const userId = currentCloudUser.id;
    const { error } = await cloudClient.from("writing_backups").insert({ user_id: userId, state: backupState });
    if (error) throw error;

    const { data: surplus } = await cloudClient
      .from("writing_backups")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(MAX_CLOUD_BACKUPS, MAX_CLOUD_BACKUPS + 99);
    if (surplus?.length) await cloudClient.from("writing_backups").delete().in("id", surplus.map((backup) => backup.id));
  } catch (error) {
    console.warn(`Cloud backup failed (${reason})`, error?.message || error);
  }
}

async function loadCloudState(user) {
  const { data, error } = await cloudClient
    .from("writing_spaces")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (isValidBackupState(data?.state)) return clone(data.state);

  const username = cloudUsername(user);
  try {
    const localState = JSON.parse(storage.getItem(userStorageKey(normalizeUsername(username))) || "null");
    if (isValidBackupState(localState)) return localState;
  } catch {
    // Continue with the older standalone storage format.
  }

  try {
    const legacyState = JSON.parse(storage.getItem(LEGACY_STORAGE_KEY) || "null");
    if (isValidBackupState(legacyState)) return legacyState;
  } catch {
    // Start with a clean writing space when no valid local state exists.
  }
  return createInitialState(language);
}

async function enterCloudSession(user) {
  currentCloudUser = user;
  currentUser = user.id;
  state = await loadCloudState(user);
  showApp();
  await syncStateToCloud(clone(state));
}

async function handleCloudAuth(username, email, password) {
  if (!cloudClient) {
    els.authError.textContent = t("cloudUnavailable");
    return;
  }

  els.authSubmit.disabled = true;
  try {
    if (authMode === "register") {
      const { data, error } = await cloudClient.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: window.SUPABASE_CONFIG.siteUrl,
        },
      });
      if (error) throw error;
      if (!data.session) {
        setAuthMode("login");
        els.emailInput.value = email;
        els.authError.classList.add("success");
        els.authError.textContent = t("checkEmail");
        return;
      }
      await enterCloudSession(data.user);
      showToast(t("accountCreated"));
      return;
    }

    const { data, error } = await cloudClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await enterCloudSession(data.user);
  } catch (error) {
    els.authError.classList.remove("success");
    els.authError.textContent = authMode === "login" ? t("invalidLogin") : error?.message || t("cloudUnavailable");
  } finally {
    els.authSubmit.disabled = false;
  }
}

function createAutomaticBackup(reason = "automatic", force = false) {
  if (!currentUser || !state?.books?.length) return false;
  const backups = getAutomaticBackups();
  const serializedState = JSON.stringify(state);
  if (!force && backups[0] && JSON.stringify(backups[0].state) === serializedState) return true;

  const backupState = JSON.parse(serializedState);
  backups.unshift({
    version: 1,
    createdAt: new Date().toISOString(),
    reason,
    state: backupState,
  });
  const localSaved = saveAutomaticBackups(currentUser, backups);
  if (currentCloudUser) void saveCloudBackup(reason, backupState);
  return localSaved || Boolean(currentCloudUser);
}

function scheduleAutomaticBackup() {
  if (!currentUser) return;
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => createAutomaticBackup(), BACKUP_DELAY);
}

function isValidBackupState(candidate) {
  return (
    candidate &&
    Array.isArray(candidate.books) &&
    candidate.books.length > 0 &&
    candidate.books.every(
      (book) =>
        typeof book?.id === "string" &&
        typeof book.title === "string" &&
        Array.isArray(book.chapters) &&
        book.chapters.length > 0 &&
        book.chapters.every(
          (chapter) => typeof chapter?.id === "string" && typeof chapter.title === "string" && typeof chapter.content === "string",
        ),
    )
  );
}

function formatBackupDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(language === "en" ? "en-GB" : "nl-NL", { dateStyle: "medium", timeStyle: "short" });
}

function applyBackupState(backupState, createdAt) {
  if (!window.confirm(t("restoreBackupConfirm", { date: formatBackupDate(createdAt) }))) return;
  flushState();
  createAutomaticBackup("before-restore", true);
  state = clone(backupState);
  writeState();
  renderActiveChapter();
  createAutomaticBackup("restored", true);
  els.moreMenu.classList.remove("open");
  showToast(t("backupRestored"));
}

function downloadBackup() {
  flushState();
  createAutomaticBackup("download", true);
  const account = getCurrentAccount();
  const exportedAt = new Date().toISOString();
  const backup = {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt,
    account: { key: currentUser, username: account?.username || currentUser },
    state: clone(state),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeUsername = (account?.username || currentUser).replace(/[^a-z0-9_-]+/gi, "-");
  link.href = url;
  link.download = `${safeUsername}-pink-fluffy-stories-${exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  els.moreMenu.classList.remove("open");
  showToast(t("backupDownloaded"));
}

async function restorePreviousBackup() {
  flushState();
  const currentState = JSON.stringify(state);
  let backup = getAutomaticBackups().find((entry) => JSON.stringify(entry.state) !== currentState);
  if (!backup && cloudClient && currentCloudUser) {
    const { data } = await cloudClient
      .from("writing_backups")
      .select("state, created_at")
      .eq("user_id", currentCloudUser.id)
      .order("created_at", { ascending: false })
      .limit(MAX_CLOUD_BACKUPS);
    const cloudBackup = data?.find((entry) => JSON.stringify(entry.state) !== currentState);
    if (cloudBackup) backup = { state: cloudBackup.state, createdAt: cloudBackup.created_at };
  }
  if (!backup) {
    els.moreMenu.classList.remove("open");
    showToast(t("backupUnavailable"));
    return;
  }
  applyBackupState(backup.state, backup.createdAt);
}

async function restoreBackupFile(event) {
  const [file] = event.target.files;
  event.target.value = "";
  if (!file) return;

  try {
    if (file.size > 10000000) throw new Error("invalid");
    const backup = JSON.parse(await file.text());
    if (backup?.format !== BACKUP_FORMAT || !isValidBackupState(backup.state)) throw new Error("invalid");
    const backupUsername = normalizeUsername(backup.account?.username || backup.account?.key || "");
    const belongsToCurrentAccount =
      backup.account?.key === currentUser ||
      (currentCloudUser && backupUsername === normalizeUsername(cloudUsername()));
    if (!belongsToCurrentAccount) {
      showToast(t("backupWrongAccount"));
      return;
    }
    applyBackupState(backup.state, backup.exportedAt);
  } catch {
    showToast(t("backupInvalid"));
  } finally {
    els.moreMenu.classList.remove("open");
  }
}

function legacyPasswordHash(username, password) {
  const input = `${normalizeUsername(username)}:${password}:pink-fluffy-stories`;
  let fallback = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    fallback ^= input.charCodeAt(index);
    fallback = Math.imul(fallback, 16777619);
  }
  return `fallback-${(fallback >>> 0).toString(16)}`;
}

function sha256Fallback(value) {
  const encoded = unescape(encodeURIComponent(value));
  const bytes = Uint8Array.from(encoded, (character) => character.charCodeAt(0));
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const data = new Uint8Array(paddedLength);
  const view = new DataView(data.buffer);
  data.set(bytes);
  data[bytes.length] = 0x80;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const rotateRight = (number, places) => (number >>> places) | (number << (32 - places));

  for (let offset = 0; offset < data.length; offset += 64) {
    const words = new Uint32Array(64);
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4);
    for (let index = 16; index < 64; index += 1) {
      const first = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const second = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + first + words[index - 7] + second) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sumOne = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temporaryOne = (h + sumOne + choice + constants[index] + words[index]) >>> 0;
      const sumZero = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporaryTwo = (sumZero + majority) >>> 0;
      [a, b, c, d, e, f, g, h] = [(temporaryOne + temporaryTwo) >>> 0, a, b, c, (d + temporaryOne) >>> 0, e, f, g];
    }

    [a, b, c, d, e, f, g, h].forEach((value, index) => {
      hash[index] = (hash[index] + value) >>> 0;
    });
  }

  return hash.map((value) => value.toString(16).padStart(8, "0")).join("");
}

async function hashPassword(username, password) {
  const input = `${normalizeUsername(username)}:${password}:pink-fluffy-stories`;
  if (window.crypto?.subtle) {
    try {
      const bytes = new TextEncoder().encode(input);
      const digest = await window.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    } catch {
      // Some local browser contexts expose SubtleCrypto but do not allow digest().
    }
  }
  return sha256Fallback(input);
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
    const stored = storage.getItem(userStorageKey(currentUser));
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
  if (!userKey) return false;
  const storageKey = userStorageKey(userKey);
  const serializedState = JSON.stringify(state);
  try {
    storage.setItem(storageKey, serializedState);
    scheduleCloudSave();
    return true;
  } catch {
    const backups = getAutomaticBackups(userKey);
    const backupsKey = backupStorageKey(userKey);
    while (backups.length) {
      backups.pop();
      try {
        if (backups.length) storage.setItem(backupsKey, JSON.stringify(backups));
        else storage.removeItem(backupsKey);
        storage.setItem(storageKey, serializedState);
        scheduleCloudSave();
        return true;
      } catch {
        // Keep removing the oldest recovery point until the current work fits.
      }
    }
    return false;
  }
}

function saveState(showIndicator = true) {
  if (!currentUser) return;
  clearTimeout(saveTimer);
  const userAtSave = currentUser;
  const stored = writeState(userAtSave);
  if (!stored) {
    els.saveState.classList.remove("saving");
    els.saveState.classList.add("save-error");
    els.saveState.lastElementChild.textContent = t("saveFailed");
    return;
  }
  els.saveState.classList.remove("save-error");
  scheduleAutomaticBackup();
  if (showIndicator) {
    els.saveState.classList.add("saving");
    els.saveState.lastElementChild.textContent = t("saving");
  }
  if (!currentCloudUser) {
    saveTimer = setTimeout(() => {
      els.saveState.classList.remove("saving");
      els.saveState.lastElementChild.textContent = t("saved");
    }, showIndicator ? 350 : 0);
  }
}

function flushState() {
  if (!currentUser) return;
  clearTimeout(saveTimer);
  const chapter = getActiveChapter();
  if (chapter) {
    chapter.content = els.editor.innerHTML;
    chapter.title = els.chapterTitle.value.trim() || t("unnamedChapter");
  }
  const stored = writeState();
  if (stored) createAutomaticBackup("autosave");
  if (stored && currentCloudUser) {
    clearTimeout(cloudSaveTimer);
    const snapshot = clone(state);
    cloudSaveChain = cloudSaveChain.then(() => syncStateToCloud(snapshot));
  }
  els.saveState.classList.remove("saving");
  els.saveState.classList.toggle("save-error", !stored);
  els.saveState.lastElementChild.textContent = t(stored ? "saved" : "saveFailed");
}

function getActiveBook() {
  return state.books.find((book) => book.id === state.activeBookId) || state.books[0];
}

function getActiveChapter() {
  const book = getActiveBook();
  return book?.chapters.find((chapter) => chapter.id === state.activeChapterId) || book?.chapters[0];
}

function getCurrentAccount() {
  if (currentCloudUser) return { key: currentCloudUser.id, username: cloudUsername() };
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
  els.emailInput.hidden = !cloudClient;
  els.emailInput.disabled = !cloudClient;
  els.emailInput.required = Boolean(cloudClient);
  const hideUsername = Boolean(cloudClient) && !registering;
  els.usernameLabel.hidden = hideUsername;
  els.usernameInput.hidden = hideUsername;
  els.usernameInput.disabled = hideUsername;
  els.usernameInput.required = !hideUsername;
  els.confirmPasswordInput.required = registering;
  els.confirmPasswordInput.disabled = !registering;
  document.querySelector(".auth-copy .eyebrow").textContent = t(registering ? "registerEyebrow" : "welcomeEyebrow");
  els.authHeading.textContent = t(registering ? "registerHeading" : "loginHeading");
  els.authIntro.textContent = t(registering ? "registerIntro" : "loginIntro");
  els.authSubmit.textContent = t(registering ? "register" : "login");
  els.passwordInput.autocomplete = registering ? "new-password" : "current-password";
}

function setAuthMode(mode) {
  authMode = mode;
  els.authError.classList.remove("success");
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
  setAuthMode(cloudClient || getAccounts().length ? "login" : "register");
  setTimeout(() => (cloudClient ? els.emailInput : els.usernameInput).focus(), 50);
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  els.authError.textContent = "";
  const username = els.usernameInput.value.trim();
  const email = els.emailInput.value.trim();
  const userKey = normalizeUsername(username);
  const password = els.passwordInput.value;

  if (password.length < 6) {
    els.authError.textContent = t("passwordTooShort");
    return;
  }

  if (cloudClient) {
    if (authMode === "register" && username.length < 3) {
      els.authError.textContent = t("usernameTooShort");
      return;
    }
    if (authMode === "register" && password !== els.confirmPasswordInput.value) {
      els.authError.textContent = t("passwordsMismatch");
      return;
    }
    await handleCloudAuth(username, email, password);
    return;
  }

  if (username.length < 3) {
    els.authError.textContent = t("usernameTooShort");
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
    storage.setItem(SESSION_KEY, currentUser);

    let migrated = null;
    if (accounts.length === 1) {
      try {
        migrated = JSON.parse(storage.getItem(LEGACY_STORAGE_KEY));
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

  const passwordHash = await hashPassword(username, password);
  const validPassword = existing && [passwordHash, legacyPasswordHash(username, password)].includes(existing.passwordHash);
  if (!validPassword) {
    els.authError.textContent = t("invalidLogin");
    return;
  }

  if (existing.passwordHash !== passwordHash) {
    existing.passwordHash = passwordHash;
    saveAccounts(accounts);
  }

  currentUser = existing.key;
  storage.setItem(SESSION_KEY, currentUser);
  state = loadState();
  showApp();
}

async function logout() {
  persistEditor();
  clearTimeout(saveTimer);
  clearTimeout(backupTimer);
  clearTimeout(cloudSaveTimer);
  writeState();
  createAutomaticBackup("logout", true);
  if (cloudClient && currentCloudUser) {
    await cloudSaveChain;
    await syncStateToCloud(clone(state));
    await saveCloudBackup("logout", clone(state));
    await cloudClient.auth.signOut();
    currentCloudUser = null;
  }
  currentUser = null;
  storage.removeItem(SESSION_KEY);
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
  state.activeChapterId = chapter.id;
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
  createAutomaticBackup("before-delete", true);
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
  persistEditor();
  createAutomaticBackup("before-delete", true);
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
  restoreEditorSelection();
  document.execCommand(command, false, value);
  persistEditor();
  updateToolbarState();
}

function restoreEditorSelection() {
  if (!savedEditorRange) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedEditorRange);
}

function runFontSize(value) {
  const size = Math.min(48, Math.max(12, Number(value) || 16));
  els.editor.focus();
  restoreEditorSelection();
  document.execCommand("fontSize", false, "7");
  els.editor.querySelectorAll('font[size="7"]').forEach((fontElement) => {
    fontElement.removeAttribute("size");
    fontElement.style.fontSize = `${size}px`;
  });
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
  storage.setItem(LANGUAGE_KEY, language);
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
els.fontSize.addEventListener("change", () => runFontSize(els.fontSize.value));
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
  createAutomaticBackup("before-formatting", true);
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
els.downloadBackupButton.addEventListener("click", downloadBackup);
els.restoreBackupButton.addEventListener("click", () => els.backupFileInput.click());
els.restorePreviousButton.addEventListener("click", restorePreviousBackup);
els.backupFileInput.addEventListener("change", restoreBackupFile);
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
  flushState();
});

window.addEventListener("pagehide", flushState);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushState();
});

async function initializeApp() {
  applyTranslations();
  if (!cloudClient) {
    if (currentUser) showApp();
    else showLogin();
    return;
  }

  try {
    const { data, error } = await cloudClient.auth.getSession();
    if (error) throw error;
    if (data.session?.user) await enterCloudSession(data.session.user);
    else showLogin();
  } catch (error) {
    console.warn("Cloud initialization failed", error?.message || error);
    showLogin();
    els.authError.textContent = t("cloudUnavailable");
  }
}

void initializeApp();
