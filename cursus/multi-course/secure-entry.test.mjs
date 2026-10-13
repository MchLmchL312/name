import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { findStudentCourses } from './student-access.js';

const source = readFileSync(new URL('secure-entry.js', import.meta.url), 'utf8');

function open(url) {
  const location = new URL(url);
  const redirects = [];
  location.replace = href => redirects.push(href);
  runInNewContext(source, { location, URL });
  return redirects;
}

test('Public HTTP login upgrades to HTTPS and preserves the return address', () => {
  for (const hostname of ['machielvansoest.nl', 'www.machielvansoest.nl']) {
    const address = `${hostname}/cursus/?terug=%2Fcursus%2Fles%2F#login`;
    assert.deepEqual(open(`http://${address}`), [`https://${address}`]);
  }
});

test('Secure pages and local previews do not redirect', () => {
  for (const url of ['https://www.machielvansoest.nl/cursus/',
    'http://localhost:8124/cursus/', 'http://127.0.0.1:8124/cursus/']) {
    assert.deepEqual(open(url), []);
  }
});

test('HTTP browsers receive an HTTPS instruction before checking any course', async () => {
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  const contextDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'isSecureContext');
  Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });
  Object.defineProperty(globalThis, 'isSecureContext', { value: false, configurable: true });
  try {
    await assert.rejects(findStudentCourses('invalid-test-password', () => {
      assert.fail('No course requests should be made when WebCrypto is unavailable');
    }), /HTTPS/);
    Object.defineProperty(globalThis, 'isSecureContext', { value: true, configurable: true });
    await assert.rejects(findStudentCourses('invalid-test-password'), /actuele browser/);
  } finally {
    if (cryptoDescriptor) Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
    else delete globalThis.crypto;
    if (contextDescriptor) Object.defineProperty(globalThis, 'isSecureContext', contextDescriptor);
    else delete globalThis.isSecureContext;
  }
});
