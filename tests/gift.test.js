import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gift, giftAccounts } from '../src/data/gift.js';
import { groomName, reception } from '../src/data/wedding.js';
import { buildGiftConfirmationUrl } from '../src/utils/gift.js';

test('gift details preserve account numbers and use the groom and reception address', () => {
  assert.equal(gift.recipient, groomName);
  assert.equal(gift.address, reception.address);
  assert.deepEqual(
    giftAccounts.map((account) => account.number),
    ['543101017274507', '0588286002'],
  );
});

test('transfer confirmation targets supplied WhatsApp number and encodes sender and bank', () => {
  const url = new URL(
    buildGiftConfirmationUrl({
      sender: 'Tamu & Keluarga',
      type: 'transfer',
      bankId: 'bni',
      amount: '125000',
    }),
  );
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/6282298231875');
  const message = url.searchParams.get('text');
  assert.ok(message.includes('Tamu & Keluarga'));
  assert.ok(message.includes('BNI 0588286002'));
  assert.ok(message.includes('Rp125.000'));
  assert.ok(!message.includes('Alamat kirim kado'));
});

test('parcel and combined confirmations include the correct destination', () => {
  const parcel = new URL(
    buildGiftConfirmationUrl({ sender: 'Tamu', type: 'parcel' }),
  ).searchParams.get('text');
  assert.ok(parcel.includes(reception.address));
  assert.ok(!parcel.includes('Rekening tujuan'));
  const both = new URL(
    buildGiftConfirmationUrl({ sender: 'Tamu', type: 'both', bankId: 'bri' }),
  ).searchParams.get('text');
  assert.ok(both.includes(reception.address));
  assert.ok(both.includes('BRI 543101017274507'));
  assert.ok(!both.includes('Nominal:'));
});

test('confirmation rejects missing sender, unknown type or bank, and invalid amounts', () => {
  const valid = { sender: 'Tamu', type: 'transfer', bankId: 'bri' };
  for (const change of [
    { sender: '  ' },
    { type: 'other' },
    { bankId: 'other' },
    { amount: '0' },
    { amount: '-1' },
    { amount: '1.5' },
    { amount: '1e6' },
    { amount: '1234567890123' },
  ]) {
    assert.throws(() => buildGiftConfirmationUrl({ ...valid, ...change }));
  }
});
