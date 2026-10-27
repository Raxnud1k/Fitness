import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { catalog, emptyJournal, finishWorkout, parseSet, setCount, uid, volume, type Exercise, type Journal, type Workout } from './src/model';
import { loadJournal, saveJournal } from './src/storage';

const C = { bg: '#101413', panel: '#1B2220', line: '#303A35', text: '#F2F5EE', muted: '#A3B0A6', lime: '#D0F285', red: '#FFAAAA' };
const number = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const date = (value: string) => new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
function Button({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, (disabled || pressed) && { opacity: .5 }]}><Text style={[s.buttonText, secondary && { color: C.text }]}>{title}</Text></Pressable>;
}
function ExerciseCard({ exercise, update, remove }: { exercise: Exercise; update: (e: Exercise) => void; remove: () => void }) {
  const last = exercise.sets.at(-1);
  const [weight, setWeight] = useState(last ? String(last.weight) : '');
  const [reps, setReps] = useState(last ? String(last.reps) : '');
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  function add() {
    const value = parseSet(weight, reps);
    if (!value) { setError('Вес: 0–2000 кг. Повторы: целое число от 1 до 1000.'); return; }
    update({ ...exercise, sets: editing ? exercise.sets.map(v => v.id === editing ? { ...v, ...value } : v) : [...exercise.sets, { id: uid(), ...value }] });
    setEditing(null); setError('');
  }
  return <View style={s.card}>
    <View style={s.row}><Text style={[s.cardTitle, { flex: 1 }]}>{exercise.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Удалить упражнение ${exercise.name}`} onPress={remove} hitSlop={12}><Text style={s.remove}>Удалить</Text></Pressable></View>
    {exercise.sets.length > 0 && <View style={{ marginTop: 16 }}><View style={s.setRow}><Text style={[s.label, { width: 38 }]}>№</Text><Text style={[s.label, { flex: 1 }]}>ВЕС × ПОВТОРЫ</Text><Text style={s.label}>ПРАВКА</Text></View>{exercise.sets.map((v, i) => <View key={v.id} style={s.setRow}><Text style={[s.muted, { width: 38 }]}>{i + 1}</Text><Text style={[s.body, { flex: 1 }]}>{number(v.weight)} кг × {v.reps}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Изменить подход ${i + 1}`} hitSlop={10} onPress={() => { setEditing(v.id); setWeight(String(v.weight)); setReps(String(v.reps)); setError(''); }}><Text style={s.link}>Изм.</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Удалить подход ${i + 1}`} style={{ marginLeft: 22 }} hitSlop={10} onPress={() => { update({ ...exercise, sets: exercise.sets.filter(x => x.id !== v.id) }); if (editing === v.id) setEditing(null); }}><Text style={s.remove}>×</Text></Pressable></View>)}</View>}
    <View style={[s.row, { marginTop: 18, gap: 12 }]}><View style={{ flex: 1 }}><Text style={s.label}>ВЕС, КГ</Text><TextInput accessibilityLabel={`Вес: ${exercise.name}`} style={s.input} value={weight} onChangeText={setWeight} placeholder="40" placeholderTextColor={C.muted} keyboardType="decimal-pad" maxLength={8} /></View><View style={{ flex: 1 }}><Text style={s.label}>ПОВТОРЫ</Text><TextInput accessibilityLabel={`Повторы: ${exercise.name}`} style={s.input} value={reps} onChangeText={setReps} placeholder="12" placeholderTextColor={C.muted} keyboardType="number-pad" maxLength={4} /></View></View>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <View style={{ marginTop: 12 }}><Button title={editing ? 'Сохранить подход' : '+ Добавить подход'} onPress={add} secondary /></View>
    {editing && <Pressable accessibilityRole="button" onPress={() => { setEditing(null); setError(''); }} style={{ padding: 14 }}><Text style={[s.muted, { textAlign: 'center' }]}>Отменить редактирование</Text></Pressable>}
  </View>;
}
function HistoryCard({ workout, remove }: { workout: Workout; remove: () => void }) {
  const [open, setOpen] = useState(false);
  return <View style={s.card}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}><View style={s.row}><Text style={[s.cardTitle, { flex: 1 }]}>{date(workout.startedAt)}</Text><Text style={s.link}>{open ? '−' : '+'}</Text></View><Text style={[s.muted, { marginTop: 8 }]}>{workout.exercises.length} упр. · {setCount(workout)} подх. · {number(volume(workout))} кг объём</Text></Pressable>{open && <View style={{ marginTop: 20, gap: 16 }}>{workout.exercises.map(e => <View key={e.id}><Text style={s.body}>{e.name}</Text><Text style={[s.muted, { marginTop: 5, lineHeight: 24 }]}>{e.sets.map(v => `${number(v.weight)} кг × ${v.reps}`).join('  /  ')}</Text></View>)}<Button title="Удалить тренировку" secondary onPress={remove} /></View>}</View>;
}
export default function App() { return <SafeAreaProvider><JournalApp /></SafeAreaProvider>; }
function JournalApp() {
  const [journal, setJournal] = useState<Journal>(emptyJournal);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const revision = useRef(0);
  const [tab, setTab] = useState<'workout' | 'history'>('workout');
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState<{ title: string; action: () => void } | null>(null);
  async function load() {
    setLoadError(false);
    try { setJournal(await loadJournal()); setLoaded(true); } catch { setLoadError(true); }
  }
  useEffect(() => { void load(); }, []);
  async function persist(value: Journal) {
    const current = ++revision.current;
    setSaving(true);
    try { await saveJournal(value); if (current === revision.current) setSaveError(false); }
    catch { if (current === revision.current) setSaveError(true); }
    finally { if (current === revision.current) setSaving(false); }
  }
  useEffect(() => { if (loaded) void persist(journal); }, [journal, loaded]);
  const active = journal.active;
  function editActive(update: (w: Workout) => Workout) { setJournal(j => j.active ? { ...j, active: update(j.active) } : j); }
  function addExercise(name: string) {
    name = name.trim();
    if (!name) return;
    editActive(w => ({ ...w, exercises: [...w.exercises, { id: uid(), name, sets: [] }] }));
    setPicker(false); setQuery('');
  }
  const customNames = [...journal.history.flatMap(w => w.exercises.map(e => e.name)), ...(active?.exercises.map(e => e.name) ?? [])];
  const options = Array.from(new Set([...catalog, ...customNames])).filter(n => n.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  return <SafeAreaView style={s.safe}><StatusBar style="light" /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={s.header}><Text style={s.brand}>ДНЕВНИК <Text style={{ color: C.lime }}>СИЛЫ</Text></Text><Text style={s.muted}>Твой прогресс — в каждом подходе</Text></View>
    {!loaded ? <View style={s.empty}>{loadError ? <><Text style={s.cardTitle}>Не удалось прочитать дневник</Text><Text style={s.emptyText}>Сохранённые данные оставлены без изменений. Попробуйте загрузить ещё раз.</Text><Button title="Повторить загрузку" onPress={() => void load()} /></> : <ActivityIndicator color={C.lime} size="large" />}</View> : <>
      <View style={s.tabs}>{(['workout', 'history'] as const).map(t => <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}><Text style={[s.tabText, tab === t && { color: C.bg }]}>{t === 'workout' ? 'Тренировка' : `История · ${journal.history.length}`}</Text></Pressable>)}</View>
      <View style={s.saveStatus}>{saveError ? <Pressable accessibilityRole="button" onPress={() => void persist(journal)}><Text style={s.error}>Не сохранено. Нажмите, чтобы повторить</Text></Pressable> : <Text style={s.label}>{saving ? 'СОХРАНЕНИЕ…' : 'СОХРАНЕНО НА УСТРОЙСТВЕ'}</Text>}</View>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {tab === 'workout' ? active ? <>
          <View style={s.row}><View style={{ flex: 1 }}><Text style={s.eyebrow}>ТЕКУЩАЯ ТРЕНИРОВКА</Text><Text style={s.title}>Становись сильнее.</Text></View><View style={s.badge}><Text style={s.badgeText}>В ЗАЛЕ</Text></View></View>
          <Text style={s.muted}>{date(active.startedAt)}</Text>
          <View style={s.stats}><View><Text style={s.statNumber}>{active.exercises.length}</Text><Text style={s.muted}>упражнений</Text></View><View><Text style={s.statNumber}>{setCount(active)}</Text><Text style={s.muted}>подходов</Text></View><View><Text style={s.statNumber}>{number(volume(active))}</Text><Text style={s.muted}>кг объём</Text></View></View>
          {!active.exercises.length && <Text style={s.emptyText}>Добавьте первый тренажёр или упражнение, затем запишите вес и повторы.</Text>}
          {active.exercises.map(e => <ExerciseCard key={e.id} exercise={e} update={next => editActive(w => ({ ...w, exercises: w.exercises.map(x => x.id === next.id ? next : x) }))} remove={() => setConfirm({ title: `Удалить «${e.name}» и его подходы?`, action: () => editActive(w => ({ ...w, exercises: w.exercises.filter(x => x.id !== e.id) })) })} />)}
          <Button title="+ Добавить упражнение" onPress={() => { setQuery(''); setPicker(true); }} />
          <Text style={[s.muted, { fontSize: 12, textAlign: 'center', marginVertical: 12 }]}>0 кг — упражнение с собственным весом</Text>
          <Button title="Завершить тренировку" secondary disabled={setCount(active) === 0} onPress={() => setConfirm({ title: 'Завершить тренировку? Все добавленные подходы будут перенесены в историю.', action: () => { setJournal(j => finishWorkout(j)); setTab('history'); } })} />
          <Pressable accessibilityRole="button" onPress={() => setConfirm({ title: 'Отменить текущую тренировку? Её записи будут удалены.', action: () => setJournal(j => ({ ...j, active: null })) })} style={{ padding: 20 }}><Text style={[s.muted, { textAlign: 'center' }]}>Отменить тренировку</Text></Pressable>
        </> : <View style={s.empty}><View style={s.heroIcon}><Text style={{ fontSize: 42, color: C.lime }}>↗</Text></View><Text style={s.eyebrow}>ШАГ ЗА ШАГОМ</Text><Text style={[s.title, { textAlign: 'center', fontSize: 34 }]}>Каждый подход{'\n'}имеет значение.</Text><Text style={s.emptyText}>Записывайте упражнения, веса и повторы.{'\n'}Весь прогресс останется под рукой.</Text><Button title="Начать тренировку" onPress={() => setJournal(j => ({ ...j, active: { id: uid(), startedAt: new Date().toISOString(), exercises: [] } }))} /><Text style={[s.muted, { fontSize: 12, marginTop: 16 }]}>Без аккаунта. Работает без интернета.</Text></View> : <>
          <Text style={s.eyebrow}>ТВОЙ ПРОГРЕСС</Text><Text style={s.title}>История тренировок</Text><Text style={[s.muted, { marginBottom: 20 }]}>Результат складывается из привычки.</Text>
          {journal.history.length ? journal.history.map(w => <HistoryCard key={w.id} workout={w} remove={() => setConfirm({ title: `Удалить тренировку за ${date(w.startedAt)}? Это действие нельзя отменить.`, action: () => setJournal(j => ({ ...j, history: j.history.filter(x => x.id !== w.id) })) })} />) : <View style={s.card}><Text style={s.cardTitle}>Здесь будут ваши результаты</Text><Text style={s.emptyText}>Завершите первую тренировку — упражнения, веса и повторы появятся здесь.</Text><Button title="К тренировке" onPress={() => setTab('workout')} secondary /></View>}
          <Text style={[s.muted, { fontSize: 12, lineHeight: 18, marginTop: 16 }]}>Данные хранятся только на этом устройстве. Удаление приложения может удалить дневник. Облачной синхронизации пока нет.</Text>
        </>}
      </ScrollView>
    </>}
    <Modal visible={picker} animationType="slide" onRequestClose={() => setPicker(false)}><SafeAreaView style={s.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={s.header}><View style={s.row}><Text style={[s.title, { flex: 1 }]}>Упражнение</Text><Pressable accessibilityRole="button" onPress={() => setPicker(false)} hitSlop={12}><Text style={s.link}>Закрыть</Text></Pressable></View><Text style={s.muted}>Выберите тренажёр или введите свой</Text><TextInput accessibilityLabel="Поиск или название упражнения" style={s.input} value={query} onChangeText={setQuery} maxLength={80} placeholder="Например, жим ногами" placeholderTextColor={C.muted} autoCorrect={false} /></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{!!query.trim() && <View style={{ marginBottom: 20 }}><Button title={`Добавить «${query.trim()}»`} onPress={() => addExercise(query)} /></View>}{options.map(name => <Pressable accessibilityRole="button" key={name} onPress={() => addExercise(name)} style={s.catalogRow}><Text style={[s.body, { flex: 1 }]}>{name}</Text><Text style={s.link}>+</Text></Pressable>)}</ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>
    <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}><View style={s.overlay}><View style={[s.card, { width: '100%', maxWidth: 440, gap: 16 }]}><Text style={s.cardTitle}>{confirm?.title}</Text><Button title="Подтвердить" onPress={() => { const action = confirm?.action; setConfirm(null); action?.(); }} /><Button title="Назад" secondary onPress={() => setConfirm(null)} /></View></View></Modal>
  </KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, header: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 20, gap: 8, width: '100%', maxWidth: 760, alignSelf: 'center' },
  brand: { color: C.text, fontSize: 21, fontWeight: '900', letterSpacing: 2 }, muted: { color: C.muted, fontSize: 14 }, body: { color: C.text, fontSize: 16 },
  tabs: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: C.panel, borderRadius: 16, padding: 5, maxWidth: 712, width: '90%', alignSelf: 'center' }, tab: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12 }, tabActive: { backgroundColor: C.lime }, tabText: { color: C.muted, fontSize: 15, fontWeight: '700' },
  saveStatus: { alignItems: 'center', minHeight: 38, justifyContent: 'center' }, content: { padding: 24, paddingTop: 12, paddingBottom: 50, width: '100%', maxWidth: 760, alignSelf: 'center', flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { color: C.text, fontSize: 27, fontWeight: '800', letterSpacing: -.7, marginTop: 6, marginBottom: 10 }, eyebrow: { color: C.lime, fontSize: 11, letterSpacing: 1.6, fontWeight: '700' },
  badge: { backgroundColor: '#2B3623', padding: 8, borderRadius: 8 }, badgeText: { fontSize: 10, fontWeight: '800', color: C.lime }, stats: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 24, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: C.line }, statNumber: { color: C.text, fontSize: 26, fontWeight: '800', marginBottom: 4 },
  card: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, padding: 20, borderRadius: 20, marginBottom: 16 }, cardTitle: { color: C.text, fontSize: 18, fontWeight: '700', lineHeight: 26 },
  button: { backgroundColor: C.lime, minHeight: 52, padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, secondary: { backgroundColor: '#2C3731', borderWidth: 1, borderColor: '#435045' }, buttonText: { color: C.bg, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  label: { fontSize: 10, letterSpacing: 1, color: C.muted, fontWeight: '600' }, input: { backgroundColor: C.bg, borderWidth: 1, borderColor: '#47554A', borderRadius: 12, padding: 14, color: C.text, fontSize: 18, minHeight: 52, marginTop: 8 }, setRow: { flexDirection: 'row', paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line },
  link: { color: C.lime, fontSize: 16, fontWeight: '600' }, remove: { color: C.muted, fontSize: 13 }, error: { color: C.red, fontSize: 12, marginTop: 8, lineHeight: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30, gap: 14, paddingHorizontal: 8 }, emptyText: { color: C.muted, textAlign: 'center', fontSize: 15, lineHeight: 24, marginVertical: 16 }, heroIcon: { width: 90, height: 90, backgroundColor: '#253122', borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20, transform: [{ rotate: '-8deg' }] },
  catalogRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20, borderBottomColor: C.line, borderBottomWidth: 1 }, overlay: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'center', alignItems: 'center', padding: 24 },
});
