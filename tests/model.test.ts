import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSet, finishWorkout, decodeJournal, volume, type Journal } from '../src/model.ts';
test('вес с запятой, нулевой вес и проверка границ', () => {
  assert.deepEqual(parseSet(' 12,5 ', '10'), { weight: 12.5, reps: 10 });
  assert.deepEqual(parseSet('0', '8'), { weight: 0, reps: 8 });
  for (const [w, r] of [['', '10'], ['-1', '10'], ['20', '0'], ['20', '1.5'], ['Infinity', '2'], ['2001', '2'], ['20', '1001']]) assert.equal(parseSet(w, r), null);
});
test('завершение сохраняет подходы и очищает черновик; данные восстанавливаются', () => {
  const j: Journal = { version: 1, history: [], active: { id: 'w', startedAt: '2026-10-27T10:00:00Z', exercises: [{ id: 'e', name: 'Жим', sets: [{ id: 's', weight: 40, reps: 12 }] }, { id: 'empty', name: 'Тяга', sets: [] }] } };
  const result = finishWorkout(j);
  assert.equal(result.active, null);
  assert.equal(result.history[0].exercises.length, 1);
  assert.equal(volume(result.history[0]), 480);
  assert.equal(j.history.length, 0);
  assert.deepEqual(decodeJournal(JSON.stringify(result)), result);
  assert.deepEqual(decodeJournal(JSON.stringify(j)), j);
});
test('пустые тренировки не завершаются; повреждённые данные отклоняются', () => {
  const j: Journal = { version: 1, active: { id: 'a', startedAt: new Date().toISOString(), exercises: [] }, history: [] };
  assert.equal(finishWorkout(j), j);
  for (const raw of ['oops', '{}', '{"version":2,"active":null,"history":[]}', '{"version":1,"active":null,"history":[{}]}']) assert.throws(() => decodeJournal(raw));
  assert.equal(decodeJournal(null).active, null);
});
