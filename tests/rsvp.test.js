import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createRsvpStore } from '../server/rsvp-store.js';
import { createApp } from '../server/index.js';

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wedding-rsvp-test-'));
  t.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return path.join(directory, 'rsvp.json');
}

const browserId = (n = 1) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

async function startServer(t, filePath) {
  const server = createApp({ filePath });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

function post(url, attendance, headers = {}) {
  return fetch(`${url}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Rsvp-Browser-Id': browserId(), ...headers },
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

test('browser IDs are required for writes and invalid IDs are rejected', async (t) => {
  const { url } = await startServer(t, fixture(t));
  for (const id of ['', '203.0.113.1', 'not-an-id', 'a'.repeat(2048)]) {
    assert.equal((await post(url, 'attending', { 'X-Rsvp-Browser-Id': id })).status, 400);
  }
  const missing = await fetch(`${url}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attendance: 'attending' }),
  });
  assert.equal(missing.status, 400);
  const snapshot = await (await fetch(`${url}/api/rsvp`)).json();
  assert.deepEqual(snapshot, { counts: { attending: 0, declined: 0 }, attendance: null });
});

test('browsers sharing one connection count separately and concurrent retries count once', async (t) => {
  const file = fixture(t);
  const { url } = await startServer(t, file);
  const repeated = await Promise.all(
    Array.from({ length: 12 }, () => post(url, 'attending', { 'X-Rsvp-Browser-Id': browserId() })),
  );
  assert.ok(repeated.every((response) => response.status === 200));
  assert.equal((await (await fetch(`${url}/api/rsvp`)).json()).counts.attending, 1);
  const unique = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      post(url, 'attending', { 'X-Rsvp-Browser-Id': browserId(i + 2) }),
    ),
  );
  assert.ok(unique.every((response) => response.status === 200));
  const snapshot = await (await fetch(`${url}/api/rsvp`)).json();
  assert.equal(snapshot.counts.attending, 13);
  assert.equal(snapshot.attendance, null);
  assert.equal(createRsvpStore(file).read('203.0.113.1').counts.attending, 13);
});

test('a new HTTP server restores totals and recognizes the same browser', async (t) => {
  const file = fixture(t);
  const first = await startServer(t, file);
  assert.equal((await post(first.url, 'attending')).status, 200);
  await new Promise((resolve) => first.server.close(resolve));
  const second = await startServer(t, file);
  const response = await fetch(`${second.url}/api/rsvp`, {
    headers: { 'X-Rsvp-Browser-Id': browserId() },
  });
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
  assert.equal(
    (
      await fetch(`${url}/api/rsvp`, {
        method: 'POST',
        headers: { 'X-Rsvp-Browser-Id': browserId() },
        body: 'attending',
      })
    ).status,
    415,
  );
  assert.equal(
    (
      await fetch(`${url}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Rsvp-Browser-Id': browserId() },
        body: '{bad',
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(`${url}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Rsvp-Browser-Id': browserId() },
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

test('changing IP does not change browser identity and legacy counts survive', async (t) => {
  const file = fixture(t);
  createRsvpStore(file).save('203.0.113.99', 'attending');
  const { url } = await startServer(t, file);
  await post(url, 'attending', { 'X-Forwarded-For': '203.0.113.1' });
  await post(url, 'attending', { 'X-Forwarded-For': '203.0.113.2' });
  const snapshot = await (
    await fetch(`${url}/api/rsvp`, { headers: { 'X-Rsvp-Browser-Id': browserId() } })
  ).json();
  assert.deepEqual(snapshot, { counts: { attending: 2, declined: 0 }, attendance: 'attending' });
  assert.equal(createRsvpStore(file).read('203.0.113.99').attendance, 'attending');
  assert.equal(fs.readFileSync(file, 'utf8').includes(browserId()), false);
});
