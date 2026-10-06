import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'PendingReview'>;

export default function PendingReviewScreen({ }: Props) {
  const { partner, acknowledgePending } = useAuth();
  const { t } = useLanguage();

  // This screen only ever renders while verificationStatus === 'pending' (see
  // RootNavigator's stillOnPendingReview), so the first two rows are always true by the
  // time a registered partner reaches here — there's no backend-tracked sub-step for
  // "document check" vs "shop visit" separately, so we show one honest overall status
  // instead of fabricating granular progress that isn't actually tracked.
  const CHECKLIST: Array<{ label: string; status: string; color: string }> = [
    { label: t.pendingMobileVerified, status: t.done, color: '#047857' },
    { label: t.pendingBusinessDetails, status: t.done, color: '#047857' },
    { label: t.pendingVerification, status: t.pendingInReview, color: '#8a5a00' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.iconCircle}>
          <Icon name="shield" size={40} color="#fff" strokeWidth={1.8} />
        </LinearGradient>

        <Text style={styles.title}>{t.pendingTitle}</Text>
        <Text style={styles.sub}>
          <Text style={styles.bold}>{partner?.businessName || t.pendingYourBusiness}</Text>{t.pendingUnderReviewMsg}
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
            <Text style={styles.exploreBtnText}>{t.pendingExploreApp}</Text>
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
