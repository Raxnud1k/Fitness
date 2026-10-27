import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassPanel, palette } from './ui';
declare global { interface Window { __fitnessInstallable?: boolean; __fitnessAndroidApkUrl?: string | null; __fitnessOfflineReady?: boolean } }
export default function InstallHint() {
  const [ready, setReady] = useState(Boolean(window.__fitnessOfflineReady));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const success = () => setReady(true);
    const failure = () => setFailed(true);
    window.addEventListener('fitness-offline-ready', success);
    window.addEventListener('fitness-offline-error', failure);
    return () => { window.removeEventListener('fitness-offline-ready', success); window.removeEventListener('fitness-offline-error', failure); };
  }, []);
  if (!window.__fitnessInstallable) return null;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return <GlassPanel style={s.panel}>
    {!standalone && <><Text style={s.title}>Установите на телефон</Text><Text style={s.text}>{ios ? 'Safari: «Поделиться» → «На экран Домой».' : 'Меню браузера → «Установить приложение» или «Добавить на главный экран».'}</Text></>}
    {!ios && window.__fitnessAndroidApkUrl && <a href={window.__fitnessAndroidApkUrl} download style={{ display: 'block', marginTop: 12, padding: '12px 14px', border: '1px solid rgba(211,229,255,0.3)', borderRadius: 12, textDecoration: 'none', color: '#BAE6FF', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Скачать APK для Android</a>}
    <View style={s.status}><View style={[s.dot, { backgroundColor: ready ? '#BDEFE3' : palette.muted }]} /><Text accessibilityLiveRegion="polite" style={s.text}>{ready ? 'Готово к работе без интернета' : failed ? 'Офлайн-режим недоступен. Откройте приложение с интернетом и обновите страницу.' : 'Подготовка к работе без интернета…'}</Text></View>
  </GlassPanel>;
}
const s = StyleSheet.create({
  panel: { padding: 16, marginBottom: 20 }, title: { color: palette.text, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  text: { color: palette.muted, fontSize: 12, lineHeight: 19, flexShrink: 1 }, status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }, dot: { width: 5, height: 5, borderRadius: 3 },
});
