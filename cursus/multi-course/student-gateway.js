import { findStudentCourses, rememberStudentAccess } from './student-access.js';

const form = document.getElementById('student-login-form');
if (form) {
  const message = document.getElementById('login-message');
  const passwordInput = form.querySelector('input[name="password"]');
  const submit = form.querySelector('button[type="submit"]');
  const forwarded = new WeakSet();
  const choices = document.createElement('div');
  choices.className = 'lesson-list';
  form.after(choices);
  passwordInput.addEventListener('input', () => choices.replaceChildren());
  const label = form.querySelector('label[for="season-password"]');
  if (label) label.textContent = 'Cursuswachtwoord';
  const introduction = document.querySelector('#login-panel > p');
  if (introduction) introduction.textContent = 'Vul je cursuswachtwoord in. Je wordt automatisch naar de juiste cursus geleid.';

  // Keep remembered atelier sessions working. Allow another password to be
  // entered on a shared device without clearing the existing atelier key.
  const lessonPanel = document.getElementById('lesson-panel');
  if (lessonPanel) {
    const change = document.createElement('button');
    change.type = 'button'; change.className = 'button secondary'; change.textContent = 'Andere cursus openen';
    change.addEventListener('click', () => {
      document.getElementById('login-panel')?.classList.remove('hidden');
      lessonPanel.classList.add('hidden'); message.textContent = ''; passwordInput.focus();
    });
    lessonPanel.prepend(change);
  }

  function openAtelier() {
    const event = new Event('submit', { bubbles: true, cancelable: true });
    forwarded.add(event);
    // The unchanged atelier handler performs its normal login, remembers the
    // key and renders its original lesson list. No new atelier storage writes.
    const handled = !form.dispatchEvent(event);
    // The original runtime skips its submit listener when an existing atelier
    // key already opened the list. Reloading lets that same session reopen it.
    if (!handled) location.assign('/cursus/');
  }

  async function openCourse(match) {
    choices.replaceChildren();
    if (match.course.legacy) { openAtelier(); return; }
    message.textContent = 'Je cursus wordt geopend…';
    const href = await rememberStudentAccess(match);
    passwordInput.value = '';
    location.assign(href);
  }

  async function submitPassword(event) {
    if (forwarded.has(event)) { forwarded.delete(event); return; }
    event.preventDefault(); event.stopImmediatePropagation();
    if (submit.disabled) return;
    submit.disabled = true; choices.replaceChildren(); message.textContent = 'Je cursus wordt gezocht…';
    try {
      const { matches, incomplete } = await findStudentCourses(passwordInput.value);
      if (!matches.length) throw new Error(incomplete
        ? 'Niet alle cursussen konden worden geladen. Probeer het later opnieuw.'
        : 'Het cursuswachtwoord is niet juist.');
      if (matches.length === 1) await openCourse(matches[0]);
      else {
        message.textContent = 'Dit wachtwoord geeft toegang tot meerdere cursussen. Kies je cursus:';
        for (const match of matches) {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'button secondary'; button.textContent = match.course.name;
          button.addEventListener('click', async () => {
            submit.disabled = true;
            try { await openCourse(match); }
            catch (error) { message.textContent = error.message || 'De cursus kon niet worden geopend.'; }
            finally { submit.disabled = false; }
          });
          choices.append(button);
        }
      }
    } catch (error) { message.textContent = error.message || 'Inloggen is niet gelukt.'; }
    finally { submit.disabled = false; }
  }
  // Capture the submission before the atelier listener, regardless of script
  // scheduling. Only a verified atelier password is passed through unchanged.
  form.addEventListener('submit', submitPassword, true);
}
