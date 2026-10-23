import { gift, giftAccounts, giftTypes } from '../data/gift.js';

export function buildGiftConfirmationUrl({ sender, type, bankId, amount = '' }) {
  const name = sender.trim();
  if (!name || name.length > 80 || !Object.hasOwn(giftTypes, type)) {
    throw new Error('Lengkapi nama dan jenis hadiah Anda.');
  }
  const lines = [
    'Assalamu’alaikum, Ai & Cici.',
    'Saya ingin mengonfirmasi hadiah pernikahan.',
    '',
    `Nama pengirim: ${name}`,
    `Jenis hadiah: ${giftTypes[type]}`,
  ];
  if (type !== 'parcel') {
    const account = giftAccounts.find((item) => item.id === bankId);
    if (!account) throw new Error('Pilih rekening tujuan.');
    lines.push(`Rekening tujuan: ${account.bank} ${account.number} a.n. ${gift.recipient}`);
    if (amount !== '') {
      if (!/^\d{1,12}$/.test(String(amount)) || Number(amount) < 1) {
        throw new Error('Masukkan nominal dalam rupiah tanpa titik atau koma.');
      }
      lines.push(`Nominal: Rp${Number(amount).toLocaleString('id-ID')}`);
    }
  }
  if (type !== 'transfer') lines.push(`Alamat kirim kado: ${gift.address}`);
  lines.push('', 'Terima kasih.');
  const url = new URL(`https://wa.me/${gift.whatsapp}`);
  url.searchParams.set('text', lines.join('\n'));
  return url.href;
}
