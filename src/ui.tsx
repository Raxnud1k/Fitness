import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

export const palette = {
  bg: '#0C1225', text: '#F5F7FF', muted: '#BCC6DF', accent: '#BAE6FF',
  line: 'rgba(215,228,255,0.16)', red: '#FFB7C7',
};
const ReduceTransparency = createContext(false);
export function SurfaceProvider({ children }: React.PropsWithChildren) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let mounted = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(value => { if (mounted) setReduced(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return <ReduceTransparency.Provider value={reduced}>{children}</ReduceTransparency.Provider>;
}
export function AmbientBackground() {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <LinearGradient colors={['#10182E', '#191936', '#0C172B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    <Svg width="100%" height="100%" viewBox="0 0 440 950" preserveAspectRatio="xMidYMin slice">
      <Defs>
        <RadialGradient id="violet"><Stop offset="0" stopColor="#9179E3" stopOpacity=".44" /><Stop offset="1" stopColor="#9179E3" stopOpacity="0" /></RadialGradient>
        <RadialGradient id="blue"><Stop offset="0" stopColor="#4BA5D9" stopOpacity=".3" /><Stop offset="1" stopColor="#4BA5D9" stopOpacity="0" /></RadialGradient>
        <RadialGradient id="mint"><Stop offset="0" stopColor="#55B4BC" stopOpacity=".22" /><Stop offset="1" stopColor="#55B4BC" stopOpacity="0" /></RadialGradient>
      </Defs>
      <Ellipse cx="365" cy="175" rx="310" ry="330" fill="url(#violet)" />
      <Ellipse cx="15" cy="490" rx="300" ry="390" fill="url(#blue)" />
      <Ellipse cx="400" cy="875" rx="300" ry="300" fill="url(#mint)" />
    </Svg>
  </View>;
}
export function GlassPanel({ children, style }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const reduced = useContext(ReduceTransparency);
  return <View style={[styles.panel, style, reduced && styles.opaque]}>
    {!reduced && <>
      <BlurView pointerEvents="none" tint="dark" intensity={28} style={StyleSheet.absoluteFill} />
      <LinearGradient pointerEvents="none" colors={['rgba(231,239,255,0.09)', 'rgba(226,235,255,0.025)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    </>}
    {children}
  </View>;
}
export function Icon({ name, size = 22, color = palette.accent }: { name: 'dumbbell' | 'chart' | 'plus' | 'check' | 'arrow' | 'close'; size?: number; color?: string }) {
  const paths = {
    dumbbell: 'M7 9h10M7 15h10M4 7v10M7 5v14M17 5v14M20 7v10',
    chart: 'M4 19h16M7 15v-4M12 15V6M17 15V3',
    plus: 'M12 5v14M5 12h14', check: 'm5 12 4 4L19 6', arrow: 'M5 12h14m-5-5 5 5-5 5', close: 'm6 6 12 12M6 18 18 6',
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d={paths[name]} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
export function StrengthArt() {
  return <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width="100%" height="100%" viewBox="0 0 300 230">
      <Defs>
        <SvgGradient id="metal" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#DDF3FF" stopOpacity=".9" /><Stop offset=".45" stopColor="#A7B7F5" stopOpacity=".65" /><Stop offset="1" stopColor="#9294DD" stopOpacity=".3" /></SvgGradient>
        <RadialGradient id="halo"><Stop offset="0" stopColor="#98B6FC" stopOpacity=".22" /><Stop offset="1" stopColor="#98B6FC" stopOpacity="0" /></RadialGradient>
      </Defs>
      <Ellipse cx="150" cy="116" rx="136" ry="112" fill="url(#halo)" />
      <Circle cx="150" cy="116" r="91" stroke="#B9CDF2" strokeOpacity=".14" fill="none" />
      <Circle cx="150" cy="116" r="72" stroke="#B9CDF2" strokeOpacity=".1" fill="none" strokeDasharray="3 8" />
      <G rotation={-28} origin="150,116">
        <Rect x="87" y="105" width="126" height="22" rx="8" fill="url(#metal)" stroke="#DAE8FF" strokeOpacity=".5" />
        <Rect x="80" y="72" width="27" height="88" rx="10" fill="url(#metal)" stroke="#E5EFFF" strokeOpacity=".7" />
        <Rect x="63" y="88" width="18" height="56" rx="7" fill="url(#metal)" stroke="#D7E6FF" strokeOpacity=".6" />
        <Rect x="193" y="72" width="27" height="88" rx="10" fill="url(#metal)" stroke="#E5EFFF" strokeOpacity=".7" />
        <Rect x="220" y="88" width="18" height="56" rx="7" fill="url(#metal)" stroke="#D7E6FF" strokeOpacity=".6" />
        <Path d="M89 85v61M202 85v61M115 111h69" stroke="white" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
      </G>
      <Circle cx="239" cy="63" r="5" fill="#C4E9FA" fillOpacity=".75" />
      <Circle cx="63" cy="173" r="3" fill="#C4E9FA" fillOpacity=".5" />
      <Path d="M55 66h10M60 61v10M244 170h8M248 166v8" stroke="#CADFFF" strokeOpacity=".5" strokeLinecap="round" />
    </Svg>
  </View>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: Platform.OS === 'android' ? 'rgba(36,47,78,0.88)' : 'rgba(31,41,68,0.55)', borderWidth: 1, borderColor: palette.line, borderTopColor: 'rgba(232,241,255,0.3)', overflow: 'hidden', borderRadius: 26 },
  opaque: { backgroundColor: '#25304D' },
  art: { width: 280, maxWidth: '100%', height: 210, alignSelf: 'center' },
});
