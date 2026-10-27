import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
export default function GlassBlur() {
  return <BlurView pointerEvents="none" tint="dark" intensity={28} style={StyleSheet.absoluteFill} />;
}
