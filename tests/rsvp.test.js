import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createRsvpStore } from '../server/rsvp-store.js';
import { getClientIp, normalizeIp } from '../server/rsvp-api.js';
import { createApp } from '../server/index.js';

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wedding-rsvp-test-'));
  t.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return path.join(directory, 'rsvp.json');
}

async function startServer(t, filePath, trustedProxyIps = []) {
  const server = createApp({ filePath, trustedProxyIps });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

function post(url, attendance, headers = {}) {
  return fetch(`${url}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ attendance }),
  });
}

test('one IP contributes once; different IPs increase the total; a choice can change', (t) => {
  const store = createRsvpStore(fixture(t));
  store.save('203.0.113.1', 'attending');
  store.save('203.0.113.1', 'attending');
  assert.deepEqual(store.read('203.0.113.1').counts, { attending: 1, declined: 0 });
  store.save('203.0.113.2', 'attending');
  assert.deepEqual(store.read('203.0.113.2').counts, { attending: 2, declined: 0 });
  store.save('203.0.113.1', 'declined');
  assert.deepEqual(store.read('203.0.113.1'), {
    counts: { attending: 1, declined: 1 },
    attendance: 'declined',
  });
});

test('responses survive reopening and raw IP addresses are not written to disk', (t) => {
  const file = fixture(t);
  const first = createRsvpStore(file);
  first.save('203.0.113.15', 'attending');
  const reopened = createRsvpStore(file);
  assert.equal(reopened.read('203.0.113.15').counts.attending, 1);
  assert.equal(reopened.read('203.0.113.15').attendance, 'attending');
  assert.equal(fs.readFileSync(file, 'utf8').includes('203.0.113.15'), false);
  assert.equal(fs.readFileSync(file, 'utf8'), fs.readFileSync(`${file}.backup`, 'utf8'));
});

test('a damaged primary file recovers from backup without resetting counts', (t) => {
  const file = fixture(t);
  createRsvpStore(file).save('203.0.113.1', 'attending');
  fs.writeFileSync(file, '{broken');
  assert.equal(createRsvpStore(file).read('203.0.113.1').counts.attending, 1);
});

test('unreadable primary and backup fail instead of silently resetting confirmations', (t) => {
  const file = fixture(t);
  createRsvpStore(file).save('203.0.113.1', 'attending');
  fs.writeFileSync(file, '{broken');
  fs.writeFileSync(`${file}.backup`, '{also broken');
  assert.throws(() => createRsvpStore(file), /Data tidak direset/);
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
});

test('IP variants are normalized and untrusted forwarded headers cannot create fake visitors', () => {
  assert.equal(normalizeIp('::ffff:192.0.2.1'), '192.0.2.1');
  assert.equal(normalizeIp('::ffff:c000:201'), '192.0.2.1');
  assert.equal(normalizeIp('2001:0DB8:0:0:0:0:0:1'), '2001:db8::1');
  assert.equal(normalizeIp('not-an-ip'), null);
  const request = {
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'x-forwarded-for': '198.51.100.1, 203.0.113.1' },
  };
  assert.equal(getClientIp(request), '127.0.0.1');
  assert.equal(getClientIp(request, ['127.0.0.1']), '203.0.113.1');
});

test('concurrent submissions keep all unique IPs and repeated clicks remain idempotent', async (t) => {
  const file = fixture(t);
  const { url } = await startServer(t, file, ['127.0.0.1']);
  const repeated = await Promise.all(
    Array.from({ length: 12 }, () => post(url, 'attending', { 'X-Forwarded-For': '203.0.113.1' })),
  );
  assert.ok(repeated.every((response) => response.status === 200));
  assert.equal((await (await fetch(`${url}/api/rsvp`)).json()).counts.attending, 1);
  const unique = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      post(url, 'attending', { 'X-Forwarded-For': `203.0.113.${i + 2}` }),
    ),
  );
  assert.ok(unique.every((response) => response.status === 200));
  const snapshot = await (await fetch(`${url}/api/rsvp`)).json();
  assert.equal(snapshot.counts.attending, 13);
  assert.equal(snapshot.attendance, null);
  assert.equal(createRsvpStore(file).read('203.0.113.1').counts.attending, 13);
});

test('a new HTTP server restores previous totals and the same IP response', async (t) => {
  const file = fixture(t);
  const first = await startServer(t, file);
  assert.equal((await post(first.url, 'attending')).status, 200);
  await new Promise((resolve) => first.server.close(resolve));
  const second = await startServer(t, file);
  const response = await fetch(`${second.url}/api/rsvp`);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {
    counts: { attending: 1, declined: 0 },
    attendance: 'attending',
  });
});

test('API rejects invalid data, foreign origins, oversized payloads, and unsupported methods', async (t) => {
  const { url } = await startServer(t, fixture(t));
  assert.equal((await post(url, 'anything')).status, 400);
  assert.equal((await post(url, 'attending', { Origin: 'https://unrelated.example' })).status, 403);
  assert.equal((await fetch(`${url}/api/rsvp`, { method: 'POST', body: 'attending' })).status, 415);
  assert.equal(
    (
      await fetch(`${url}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{bad',
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(`${url}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'x'.repeat(2048),
      })
    ).status,
    413,
  );
  assert.equal((await fetch(`${url}/api/rsvp`, { method: 'DELETE' })).status, 405);
  assert.equal((await fetch(`${url}/.data/rsvp.json`)).status, 404);
  assert.equal((await fetch(`${url}/server/rsvp-store.js`)).status, 404);
  assert.deepEqual((await (await fetch(`${url}/api/rsvp`)).json()).counts, {
    attending: 0,
    declined: 0,
  });
});

test('HTTP requests cannot spoof IP without a configured trusted proxy', async (t) => {
  const { url } = await startServer(t, fixture(t));
  await post(url, 'attending', { 'X-Forwarded-For': '203.0.113.1' });
  await post(url, 'attending', { 'X-Forwarded-For': '203.0.113.2' });
  assert.equal((await (await fetch(`${url}/api/rsvp`)).json()).counts.attending, 1);
});
