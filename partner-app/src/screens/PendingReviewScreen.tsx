import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'PendingReview'>;

const CHECKLIST: Array<{ label: string; status: string; color: string }> = [
  { label: 'Mobile verified', status: 'Done', color: '#047857' },
  { label: 'Business details', status: 'Done', color: '#047857' },
  { label: 'Document check', status: 'In review', color: '#8a5a00' },
  { label: 'Shop visit / video call', status: 'Pending', color: '#8a8499' },
];

export default function PendingReviewScreen({ }: Props) {
  const { partner, acknowledgePending } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.iconCircle}>
          <Icon name="shield" size={40} color="#fff" strokeWidth={1.8} />
        </LinearGradient>

        <Text style={styles.title}>Application submitted</Text>
        <Text style={styles.sub}>
          <Text style={styles.bold}>{partner?.businessName || 'Your business'}</Text> is under review. We’ll SMS you within 48 hours.
          Meanwhile you can add your items; they go live once you’re verified.
        </Text>

        <View style={styles.checklist}>
          {CHECKLIST.map((c) => (
            <View key={c.label} style={styles.checklistRow}>
              <Text style={styles.checklistLabel}>{c.label}</Text>
              <Text style={[styles.checklistStatus, { color: c.color }]}>{c.status}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.exploreBtnWrap} activeOpacity={0.85} onPress={acknowledgePending}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.exploreBtn}>
            <Text style={styles.exploreBtnText}>Explore the partner app</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: 26, paddingTop: 40, alignItems: 'center', justifyContent: 'center', gap: 18 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', ...shadow.primaryButton },
  title: { fontFamily: 'Sora', fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSoft, textAlign: 'center', maxWidth: 300, lineHeight: 21 },
  bold: { color: colors.text, fontWeight: '700' },
  checklist: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 8 },
  checklistRow: { flexDirection: 'row', justifyContent: 'space-between' },
  checklistLabel: { fontSize: 13, color: colors.text },
  checklistStatus: { fontSize: 13, fontWeight: '700' },
  exploreBtnWrap: { width: '100%' },
  exploreBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
