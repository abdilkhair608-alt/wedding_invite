import assert from 'node:assert/strict';
import { test } from 'node:test';
import { curtainPath } from '../src/utils/curtain.js';

function coordinates(progress) {
  return curtainPath(progress)
    .match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)
    .map(Number);
}

test('curtain starts closed and finishes completely outside the viewport', () => {
  assert.equal(curtainPath(0), 'M -20 -20 H 501 C 501 280 501 720 501 1020 H -20 Z');
  const end = coordinates(1);
  assert.ok([end[2], end[3], end[5], end[7]].every((x) => x < 0));
  assert.equal(curtainPath(-1), curtainPath(0));
  assert.equal(curtainPath(10), curtainPath(1));
});

test('curtain opens continuously with the bottom wider than the top', () => {
  let previous = coordinates(0);
  for (let step = 1; step <= 100; step += 1) {
    const current = coordinates(step / 100);
    assert.ok(current.every(Number.isFinite));
    for (const index of [2, 3, 5, 7]) assert.ok(current[index] < previous[index]);
    if (step < 100) assert.ok(current[7] < current[2]);
    previous = current;
  }
});
