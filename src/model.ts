export type SetEntry = { id: string; weight: number; reps: number };
export type Exercise = { id: string; name: string; sets: SetEntry[] };
export type Workout = { id: string; startedAt: string; finishedAt?: string; exercises: Exercise[] };
export type Journal = { version: 1; active: Workout | null; history: Workout[] };
export const emptyJournal: Journal = { version: 1, active: null, history: [] };
export const catalog = ['Жим ногами', 'Жим лёжа', 'Тяга верхнего блока', 'Горизонтальная тяга', 'Разгибание ног', 'Сгибание ног', 'Приседания', 'Жим в тренажёре', 'Сведение рук', 'Подъём на бицепс', 'Разгибание рук на блоке', 'Подтягивания', 'Скручивания'];
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export function parseSet(weightText: string, repsText: string): Omit<SetEntry, 'id'> | null {
  const w = weightText.trim().replace(',', '.');
  const r = repsText.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(w) || !/^\d+$/.test(r)) return null;
  const weight = Number(w), reps = Number(r);
  return weight >= 0 && weight <= 2000 && reps >= 1 && reps <= 1000 ? { weight, reps } : null;
}
export const setCount = (w: Workout) => w.exercises.reduce((n, e) => n + e.sets.length, 0);
export const volume = (w: Workout) => w.exercises.reduce((n, e) => n + e.sets.reduce((s, v) => s + v.weight * v.reps, 0), 0);
export function finishWorkout(j: Journal, now = new Date().toISOString()): Journal {
  if (!j.active || !setCount(j.active)) return j;
  return { ...j, active: null, history: [{ ...j.active, finishedAt: now, exercises: j.active.exercises.filter(e => e.sets.length) }, ...j.history] };
}
function isWorkout(v: unknown): v is Workout {
  if (!v || typeof v !== 'object') return false;
  const w = v as Workout;
  return typeof w.id === 'string' && typeof w.startedAt === 'string' && Number.isFinite(Date.parse(w.startedAt)) &&
    (w.finishedAt === undefined || (typeof w.finishedAt === 'string' && Number.isFinite(Date.parse(w.finishedAt)))) &&
    Array.isArray(w.exercises) && w.exercises.every(e => e && typeof e.id === 'string' && typeof e.name === 'string' && Array.isArray(e.sets) && e.sets.every(s => s && typeof s.id === 'string' && typeof s.weight === 'number' && Number.isFinite(s.weight) && s.weight >= 0 && s.weight <= 2000 && Number.isInteger(s.reps) && s.reps > 0 && s.reps <= 1000));
}
export function decodeJournal(raw: string | null): Journal {
  if (raw === null) return { ...emptyJournal, history: [] };
  const data = JSON.parse(raw);
  if (data?.version !== 1 || !(data.active === null || isWorkout(data.active)) || !Array.isArray(data.history) || !data.history.every(isWorkout)) throw new Error('Invalid journal');
  return data;
}
