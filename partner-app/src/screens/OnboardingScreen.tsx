import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

function FloatingBlob({ style, duration }: { style: object; duration: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  return <Animated.View pointerEvents="none" style={[style, { transform: [{ translateY }] }]} />;
}

export default function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const { t } = useLanguage();

  const SLIDES = [
    { title: t.pOnboardSlide1Title, body: t.pOnboardSlide1Body },
    { title: t.pOnboardSlide2Title, body: t.pOnboardSlide2Body },
    { title: t.pOnboardSlide3Title, body: t.pOnboardSlide3Body },
  ];

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const goLanguage = () => navigation.replace('Language');
  const next = () => (isLast ? goLanguage() : setIndex((i) => i + 1));

  return (
    <SafeAreaView style={styles.container}>
      <FloatingBlob style={styles.blobPink} duration={3500} />
      <FloatingBlob style={styles.blobMaroon} duration={4500} />

      <View style={styles.topRow}>
        <TouchableOpacity onPress={goLanguage} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skip}>{t.skip}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.logoTile}>
          <Text style={styles.logoText}>tamboo</Text>
          <Text style={styles.logoBadge}>{t.pOnboardBrandBadge}</Text>
        </LinearGradient>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.body}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={next}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.button}>
          <Text style={styles.buttonText}>{isLast ? t.pOnboardGetStarted : t.next}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: 26, paddingTop: 12, paddingBottom: 30, overflow: 'hidden' },
  blobPink: { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(231,84,128,0.22)' },
  blobMaroon: { position: 'absolute', bottom: 80, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(77,0,19,0.14)' },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  skip: { fontSize: 13.5, fontWeight: '700', color: colors.textSoft, padding: 6 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  logoTile: {
    width: 168,
    height: 168,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.pink,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 10,
  },
  logoText: { fontSize: 40, fontWeight: '800', fontStyle: 'italic', color: '#fff', letterSpacing: -1 },
  logoBadge: { fontSize: 11, fontWeight: '800', letterSpacing: 3, color: '#fff' },
  title: { fontSize: 25, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14.5, color: colors.textSoft, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#ecdde5' },
  dotActive: { width: 22, backgroundColor: colors.pink },
  button: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
});
