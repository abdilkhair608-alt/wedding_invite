const storageKey = 'wedding-invite.browser-id.v1';
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

export function getBrowserId(storage, crypto = globalThis.crypto) {
  try {
    storage ??= globalThis.localStorage;
    const existing = storage.getItem(storageKey);
    if (uuidPattern.test(existing)) return existing;

    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    storage.setItem(storageKey, id);
    if (storage.getItem(storageKey) !== id) throw new Error('ID browser tidak tersimpan.');
    return id;
  } catch {
    throw new Error(
      'Izinkan penyimpanan situs di browser, lalu muat ulang untuk mengonfirmasi kehadiran.',
    );
  }
}
