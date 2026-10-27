import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeJournal, type Journal } from './model';
const KEY = 'fitness-journal:v1';
let queue: Promise<void> = Promise.resolve();
export const loadJournal = async () => decodeJournal(await AsyncStorage.getItem(KEY));
export function saveJournal(journal: Journal): Promise<void> {
  const snapshot = JSON.stringify(journal);
  queue = queue.catch(() => {}).then(() => AsyncStorage.setItem(KEY, snapshot));
  return queue;
}
