(() => {
  'use strict';

  const form = document.getElementById('text-login');
  const password = document.getElementById('text-password');
  const submit = form.querySelector('button[type="submit"]');
  const status = document.getElementById('text-login-status');
  const privateText = document.getElementById('private-text');
  const content = document.getElementById('private-text-content');
  const downloads = document.getElementById('private-text-downloads');
  const logout = document.getElementById('text-logout');
  let attempt = 0;
  let busy = false;
  let downloadUrls = [];

  const decode = (base64) => Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

  function clearText(focus = false) {
    attempt += 1;
    privateText.hidden = true;
    content.replaceChildren();
    downloads.replaceChildren();
    downloadUrls.forEach((url) => URL.revokeObjectURL(url));
    downloadUrls = [];
    form.hidden = false;
    form.reset();
    status.textContent = '';
    password.removeAttribute('aria-invalid');
    busy = false;
    submit.disabled = !window.crypto?.subtle;
    form.removeAttribute('aria-busy');
    if (focus) password.focus();
  }

  if (!window.crypto?.subtle) {
    submit.disabled = true;
    status.textContent = 'Open deze pagina via HTTPS in een recente browser om in te loggen.';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !password.value || !window.crypto?.subtle) return;

    busy = true;
    const currentAttempt = ++attempt;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    password.removeAttribute('aria-invalid');
    status.textContent = 'Even geduld…';
    let phase = 'load';

    try {
      const response = await fetch('text.encrypted.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('De tekst kon niet worden geladen.');
      const encrypted = await response.json();
      const material = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password.value), 'PBKDF2', false, ['deriveKey']
      );
      password.value = '';
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: decode(encrypted.salt), iterations: encrypted.iterations, hash: 'SHA-256' },
        material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
      );
      phase = 'decrypt';
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: decode(encrypted.iv) }, key, decode(encrypted.ciphertext)
      );
      phase = 'read';
      const text = JSON.parse(new TextDecoder().decode(plaintext));
      if (currentAttempt !== attempt) return;

      content.innerHTML = text.html;
      for (const file of text.downloads) {
        const url = URL.createObjectURL(new Blob([decode(file.data)], { type: file.type }));
        downloadUrls.push(url);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.textContent = file.label;
        downloads.append(link);
      }
      form.hidden = true;
      privateText.hidden = false;
      status.textContent = '';
      content.focus();
    } catch {
      if (currentAttempt !== attempt) return;
      content.replaceChildren();
      downloads.replaceChildren();
      downloadUrls.forEach((url) => URL.revokeObjectURL(url));
      downloadUrls = [];
      if (phase === 'decrypt') {
        status.textContent = 'Het wachtwoord klopt niet. Probeer het opnieuw.';
        password.setAttribute('aria-invalid', 'true');
      } else {
        status.textContent = 'De tekst kon niet worden geopend. Vernieuw de pagina en probeer het opnieuw.';
      }
      password.value = '';
      password.focus();
    } finally {
      if (currentAttempt === attempt) {
        busy = false;
        submit.disabled = false;
        form.removeAttribute('aria-busy');
      }
    }
  });

  logout.addEventListener('click', () => clearText(true));
  window.addEventListener('pagehide', () => clearText());
})();
