const fs = require('node:fs');
const assert = require('node:assert/strict');
const { webcrypto, randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const url = 'https://www.machielvansoest.nl/boards/index-links.html';
const replacements = [
  ['Outside richt de blik op de resten en sporen die de wereld achterlaat.', 'QR verbindt de installatie met audio, visuele en tekstuele projecten op internet, die samenkomen en worden gedocumenteerd op de + pagina.'],
  ['Entropy beschrijft het moment waarop vaste vorm instabiel wordt. Taal valt uiteen in klank en herhaling. Beeld wordt ruis. Objecten verliezen hun functie en verschijnen als resten.', 'Entropy beschrijft het moment waarop vaste vorm instabiel wordt. Taal valt uiteen in klank en herhaling. Beeld wordt ruis. In QR verspreidt het werk zich over audio, beelden en teksten op internet en wordt het via documentatie opnieuw verbonden.'],
  ['In het grid verbindt Entropy Text, Noise en Outside.', 'In het grid verbindt Entropy Text, Noise en QR.'],
  ['PTP, Object en Outside bewegen van symbolische samenstelling naar directe werkelijkheid en vervolgens naar rest en spoor.', 'PTP, Object en QR bewegen van samenstelling naar directe werkelijkheid en vervolgens naar de verspreiding en documentatie van multimedia op internet.'],
  ['Op positie 7 worden werken samengebracht en ontstaan nieuwe verbanden. Object introduceert objecten die uit de werkelijkheid zelf afkomstig zijn. Outside toont wat na menselijk handelen achterblijft: afval, resten en toevallige objecten op straat of grond.', 'Op positie 7 worden werken samengebracht en ontstaan nieuwe verbanden. Object introduceert objecten die uit de werkelijkheid zelf afkomstig zijn. QR opent de installatie naar audio, visuele en tekstuele projecten op internet. De + pagina brengt deze multimediaprojecten samen en documenteert hun onderlinge verbanden.'],
  ['De kolom Entropy verbindt Text, Noise en Outside.', 'De kolom Entropy verbindt Text, Noise en QR.'],
  ['In Text valt taal uiteen en wordt zij materiaal. In Noise valt het beeld uiteen in trilling en materie. In Outside verliezen objecten hun functie en worden zij resten. Dezelfde beweging voltrekt zich op drie niveaus: betekenis, beeld en wereld.', 'In Text valt taal uiteen en wordt zij materiaal. In Noise valt het beeld uiteen in trilling en materie. In QR verplaatst het werk zich naar een digitaal veld van geluid, beeld en tekst. De vorm raakt verspreid over verschillende dragers en projecten; via de + pagina ontstaan nieuwe samenstellingen en blijft het werk gedocumenteerd.'],
  ['9. Outside', '9. QR'],
  ['Outside richt de blik naar beneden.', 'QR verbindt de fysieke installatie met multimediaprojecten op internet.'],
  ['Afval, verpakkingen, resten en toevallige objecten op straat, gras of stoep worden fotografisch geregistreerd.', 'Audio, visuele en tekstuele projecten op internet komen samen en worden gedocumenteerd op ' + url + '.'],
  ['Deze foto’s tonen de publieke huid van de wereld: een oppervlak waarop de sporen van menselijk handelen achterblijven.', 'Een QR-code fungeert als afbeelding én als toegang. Door de code te scannen of aan te klikken, opent de bezoeker de + pagina.'],
  ['Objecten hebben hun functie verloren en zijn rest geworden, maar juist daardoor kunnen zij opnieuw als beeld verschijnen.', 'Via het scherm kunnen geluid, video, beeld en tekst nieuwe verbanden aangaan met de schilderijen en objecten in de ruimte. Documentatie wordt daarmee een actieve laag van het project.'],
  ['Op het kruispunt van Pain en Entropy wordt de wereld zichtbaar als residu: als spoor van gebruik, verlies, beweging en verval.', 'Op het kruispunt van Pain en Entropy opent QR een digitaal veld waarin lichamelijke, persoonlijke en historische ervaringen via verschillende media kunnen circuleren. Het werk verlaat zijn vaste drager en kan in nieuwe verbindingen opnieuw verschijnen.'],
  ['De fysieke installatie kan zich bovendien uitbreiden naar tekst, fotografie, geluid, video, websites, QR-codes en schermen. Die digitale en auditieve lagen zijn geen los technisch supplement, maar kunnen voortkomen uit hetzelfde principe van samenstelling.', 'De fysieke installatie breidt zich via QR uit naar audio, visuele en tekstuele projecten op internet. De + pagina brengt deze multimediaprojecten samen en documenteert ze. Die digitale en auditieve lagen komen voort uit hetzelfde principe van samenstelling: het werk krijgt nieuwe relaties via beeld, geluid, tekst en scherm.']
];

(async () => {
  const file = 'PTP/text.encrypted.json';
  const encrypted = JSON.parse(fs.readFileSync(file, 'utf8'));
  const derive = async salt => {
    const material = await webcrypto.subtle.importKey('raw', Buffer.from('PTP'), 'PBKDF2', false, ['deriveKey']);
    return webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: encrypted.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };
  const oldKey = await derive(Buffer.from(encrypted.salt, 'base64'));
  const original = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(encrypted.iv, 'base64') }, oldKey, Buffer.from(encrypted.ciphertext, 'base64'));
  const text = JSON.parse(Buffer.from(original).toString());
  const txt = text.downloads.find(f => f.name.endsWith('.txt'));
  let plainText = Buffer.from(txt.data, 'base64').toString();
  for (const [old, replacement] of process.argv.includes('--odt-only') ? [] : replacements) {
    assert(text.html.includes(old), old);
    const bookNames = value => value.replace(/\bSymbol\b/g, 'Emblem').replace(/\bObject\b/g, 'Actual');
    const bookOld = plainText.includes(old) ? old : bookNames(old);
    const bookNew = bookOld === old ? replacement : bookNames(replacement);
    assert(plainText.includes(bookOld), bookOld);
    text.html = text.html.replaceAll(old, replacement);
    plainText = plainText.replaceAll(bookOld, bookNew);
  }
  if (!process.argv.includes('--odt-only')) text.html = text.html.replaceAll(url, '<a href="' + url + '">de + pagina</a>');
  assert(!text.html.includes('Outside'));
  assert(!plainText.includes('Outside'));
  txt.data = Buffer.from(plainText).toString('base64');
  const odt = text.downloads.find(f => f.name.endsWith('.odt'));
  const child = spawnSync('C:/Users/machi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe', ['.ptp-qr.py', process.argv.includes('--odt-only') ? 'odt-only' : 'odt'], { input: JSON.stringify({ data: odt.data, replacements }), encoding: 'utf8', maxBuffer: 1024 * 1024 });
  assert.equal(child.status, 0, child.stderr);
  const updated = JSON.parse(child.stdout);
  odt.data = updated.data;
  const payload = Buffer.from(JSON.stringify(text));
  const salt = randomBytes(16), iv = randomBytes(12);
  const key = await derive(salt);
  const cipher = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload);
  const roundtrip = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  assert(Buffer.from(roundtrip).equals(payload));
  fs.writeFileSync(file + '.tmp', JSON.stringify({ version: encrypted.version, iterations: encrypted.iterations, salt: salt.toString('base64'), iv: iv.toString('base64'), ciphertext: Buffer.from(cipher).toString('base64') }) + '\n');
  fs.renameSync(file + '.tmp', file);
  if (process.argv.includes('--odt-only')) {
    console.log(JSON.stringify({ odtRemainingParagraphs: updated.edits, roundtrip: 'ok' }));
    return;
  }
  fs.writeFileSync('PTP/board9.txt', 'QR\n\nQR verbindt de fysieke PTP-installatie met audio, visuele en tekstuele projecten op internet. De QR-code opent de + pagina, waar deze multimediaprojecten samenkomen en worden gedocumenteerd:\n\n' + url + '\n\nBeeld, geluid, video en tekst kunnen via het scherm nieuwe verbanden aangaan met de schilderijen, objecten en teksten in de installatie. Binnen het PTP-grid staat QR op positie 9, bij Pain / Entropy: een toegang tot de verspreiding, verandering en nieuwe samenstelling van het werk in de digitale ruimte.\n');
  const nl = '**Pain / pijn** gaat over trauma en confrontatie met het rauwe: Actual-werken, outside-foto’s en conceptuele werken.';
  const nlNew = '**Pain / pijn** gaat over trauma en confrontatie met het rauwe: Actual-werken, conceptuele werken en QR als toegang tot audio, visuele en tekstuele projecten op internet. Deze multimediaprojecten komen samen en worden gedocumenteerd op de + pagina: ' + url + '.';
  const en = '**Pain / pain** addresses trauma and confrontation with the raw: readymades, outside photographs, and conceptual works.';
  const enNew = '**Pain / pain** addresses trauma and confrontation with the raw: readymades, conceptual works, and QR as access to audio, visual and textual projects on the internet. These multimedia projects come together and are documented on the + page: ' + url + '.';
  for (const [files, old, replacement] of [
    [['PTP/7/nl.html', 'PTP/7/board1.txt'], nl, nlNew],
    [['PTP/7/eng.html', 'PTP/7/board1 - eng.txt'], en, enNew]
  ]) {
    for (const name of files) {
      const before = fs.readFileSync(name, 'utf8');
      assert(before.includes(old), name);
      fs.writeFileSync(name, before.replace(old, replacement));
    }
  }
  console.log(JSON.stringify({ editedParagraphs: replacements.length, odtParagraphs: updated.edits, plaintextExportUpdated: true, password: 'unchanged', roundtrip: 'ok' }));
})().catch(error => { console.error(error); process.exitCode = 1; });
