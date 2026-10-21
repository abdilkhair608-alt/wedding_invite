import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildGuestLink,
  buildInvitationMessage,
  normalizeGuestName,
  readGuestName,
} from '../src/utils/invitation.js';

test('guest names round-trip through links including Indonesian names and URL characters', () => {
  for (const name of [
    'Abdil dan partner',
    'Bapak H. Ma’ruf & Ibu',
    'A+B / C? #keluarga',
    '李 & 🌷',
  ]) {
    const link = buildGuestLink('https://ai-cici.vercel.app/?kelola=undangan#rsvp', name);
    assert.equal(readGuestName(link), name);
    assert.equal(new URL(link).searchParams.has('kelola'), false);
    assert.equal(new URL(link).hash, '');
    assert.equal(new URL(link).origin, 'https://ai-cici.vercel.app');
  }
});

test('empty names are rejected by the generator and unnamed invitations have a fallback', () => {
  assert.throws(() => buildGuestLink('https://ai-cici.vercel.app', '  '), /Masukkan nama/);
  assert.equal(readGuestName('https://ai-cici.vercel.app/'), '');
  assert.equal(normalizeGuestName('  Bapak\n  Abdil\t dan partner  '), 'Bapak Abdil dan partner');
  assert.equal(Array.from(normalizeGuestName('🌷'.repeat(150))).length, 120);
});

test('each invitation keeps its recipient and message after a different guest is generated', () => {
  const first = buildGuestLink('https://ai-cici.vercel.app/', 'Abdil dan partner');
  const second = buildGuestLink('https://ai-cici.vercel.app/', 'Bapak Budi');
  assert.notEqual(first, second);
  assert.equal(readGuestName(first), 'Abdil dan partner');
  const message = buildInvitationMessage('Abdil dan partner', first);
  assert.ok(message.includes('Kepada Yth. Abdil dan partner'));
  assert.ok(message.includes(first));
});
