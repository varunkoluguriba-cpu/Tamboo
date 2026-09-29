import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useToken, msLeft, formatHoursLeft } from '../context/TokenContext';
import { colors, gradients } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TokenDone'>;

export default function TokenDoneScreen({ navigation }: Props) {
  const { token } = useToken();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Nothing pre-booked yet.</Text>
      </SafeAreaView>
    );
  }

  const left = formatHoursLeft(msLeft(token));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.checkCircle}>
          <Icon name="check" size={38} color="#fff" strokeWidth={2.5} />
        </LinearGradient>

        <Text style={styles.title}>Hall pre-booked</Text>
        <Text style={styles.sub}>
          <Text style={styles.bold}>{token.hallName}</Text> is held for you on {token.date}. Visit before your window closes to finalise.
        </Text>

        <Text style={styles.left}>{left} left</Text>

        <TouchableOpacity style={styles.scheduleBtnWrap} activeOpacity={0.85} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Token' }] })}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.scheduleBtn}>
            <Text style={styles.scheduleBtnText}>Schedule your visit</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
          <Text style={styles.homeLink}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  notFound: { padding: 24, color: colors.textSoft, textAlign: 'center', marginTop: 40 },
  scroll: { padding: 22, paddingTop: 40, alignItems: 'center', gap: 14 },
  checkCircle: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Sora', fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSoft, textAlign: 'center', maxWidth: 320, lineHeight: 21 },
  bold: { color: colors.text, fontWeight: '700' },
  left: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.amber },
  scheduleBtnWrap: { width: '100%' },
  scheduleBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  scheduleBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
  homeLink: { color: colors.pinkStrong, fontWeight: '700', fontSize: 14 },
});
