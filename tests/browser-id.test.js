import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getBrowserId } from '../src/utils/browser-id.js';

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('browser IDs persist across calls and separate browser stores have different IDs', () => {
  const first = storage();
  const second = storage();
  const id = getBrowserId(first);
  assert.match(id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(getBrowserId(first), id);
  assert.notEqual(getBrowserId(second), id);
});

test('unavailable browser storage fails clearly instead of generating temporary identities', () => {
  const blocked = {
    getItem() {
      throw new Error('Storage blocked');
    },
  };
  assert.throws(() => getBrowserId(blocked), /Izinkan penyimpanan situs/);
  const ignoredWrites = { getItem: () => null, setItem() {} };
  assert.throws(() => getBrowserId(ignoredWrites), /Izinkan penyimpanan situs/);
});
