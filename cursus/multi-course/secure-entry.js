// Login requires WebCrypto, which is unavailable on the public HTTP site.
// Keep local previews on HTTP; preserve the requested page and return address.
if (location.protocol === 'http:' &&
    ['machielvansoest.nl', 'www.machielvansoest.nl'].includes(location.hostname)) {
  const secureUrl = new URL(location.href);
  secureUrl.protocol = 'https:';
  location.replace(secureUrl.href);
}
