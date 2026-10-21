export const guestNameLimit = 120;

export function normalizeGuestName(name = '') {
  const printable = Array.from(name, (character) => {
    const code = character.codePointAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');
  return Array.from(printable.replace(/\s+/g, ' ').trim()).slice(0, guestNameLimit).join('');
}

export function readGuestName(url) {
  return normalizeGuestName(new URL(url).searchParams.get('to') || '');
}

export function buildGuestLink(baseUrl, name) {
  const guest = normalizeGuestName(name);
  if (!guest) throw new Error('Masukkan nama tamu terlebih dahulu.');
  const url = new URL(baseUrl);
  url.search = '';
  url.hash = '';
  url.searchParams.set('to', guest);
  return url.href;
}

export function buildInvitationMessage(name, link) {
  return `Assalamu’alaikum warahmatullahi wabarakatuh.

Kepada Yth. ${normalizeGuestName(name)}

Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada pernikahan kami, Ai & Cici.

Detail acara dan konfirmasi kehadiran dapat dilihat melalui tautan berikut:
${link}

Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.

Terima kasih atas doa dan restunya.
Wassalamu’alaikum warahmatullahi wabarakatuh.

Salam hangat,
Ai & Cici`;
}
