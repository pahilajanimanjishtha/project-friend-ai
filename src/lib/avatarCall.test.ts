import test from 'node:test';
import assert from 'node:assert/strict';
import { clampSessionTurns, fallbackDirective, safeDirective } from './avatarCall';

test('conversation context retains the most recent bounded turns', () => {
  const turns = Array.from({ length: 30 }, (_, index) => ({ role: 'user' as const, text: String(index), timestamp: '' }));
  const result = clampSessionTurns(turns);
  assert.equal(result.length, 24);
  assert.equal(result[0].text, '6');
});

test('tone mapper selects a caring gesture for difficult language', () => {
  assert.deepEqual(fallbackDirective('This is really hard today'), { tone: 'concerned', expression: 'concerned', gesture: 'hand-heart' });
});

test('invalid model directives cannot escape the supported avatar vocabulary', () => {
  assert.equal(safeDirective({ tone: 'hostile', gesture: 'jump' }, 'hello').tone, 'warm');
});
