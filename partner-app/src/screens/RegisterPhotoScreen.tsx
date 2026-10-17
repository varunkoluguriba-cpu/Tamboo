import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { pickImageBase64 } from '../utils/pickImage';
import { formatBookingDate } from '../utils/date';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterPhoto'>;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type ExtractedDate = { date: string; slot: 'Morning' | 'Evening' | 'FullDay' };

function monthKey(offset: number): { key: string; label: string } {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  return { key, label };
}

export default function RegisterPhotoScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const [monthOffset, setMonthOffset] = useState(0);
  const [working, setWorking] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedDate[] | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [confirming, setConfirming] = useState(false);
  const [resultSummary, setResultSummary] = useState<{ ok: number; skipped: number } | null>(null);

  const { key: month, label: monthLabel } = monthKey(monthOffset);

  const takePhoto = async () => {
    const uri = await pickImageBase64();
    if (!uri) return;
    setWorking(true);
    setExtracted(null);
    setResultSummary(null);
    try {
      const result = await api.post<{ dates: ExtractedDate[] }>(
        `/api/halls/me/halls/${route.params.hallId}/register-photo`,
        { imageBase64: uri, month },
      );
      if (result.dates.length === 0) {
        Alert.alert(t.registerPhotoNoneFoundTitle, t.registerPhotoNoneFoundMsg);
      } else {
        setExtracted(result.dates);
        setChecked(Object.fromEntries(result.dates.map((_, i) => [i, true])));
      }
    } catch (e) {
      Alert.alert(t.registerPhotoFailedTitle, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setWorking(false);
    }
  };

  const confirmSelected = async () => {
    if (!extracted) return;
    const selected = extracted.filter((_, i) => checked[i]);
    if (selected.length === 0) return;
    setConfirming(true);
    try {
      const res = await api.post<{ results: Array<{ ok: boolean }> }>(
        `/api/halls/me/halls/${route.params.hallId}/register-photo/confirm`,
        { dates: selected },
      );
      const ok = res.results.filter((r) => r.ok).length;
      const skipped = res.results.length - ok;
      setResultSummary({ ok, skipped });
      setExtracted(null);
    } catch (e) {
      Alert.alert(t.registerPhotoFailedTitle, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.registerPhotoTitle}</Text>
        </View>

        <Text style={styles.subtitle}>{t.registerPhotoSubtitle}</Text>

        {!extracted && !resultSummary && (
          <>
            <View style={styles.monthRow}>
              <TouchableOpacity style={styles.monthBtn} activeOpacity={0.8} disabled={monthOffset <= 0} onPress={() => setMonthOffset((m) => Math.max(0, m - 1))}>
                <Icon name="left" size={16} color={monthOffset <= 0 ? colors.dividerStrong : colors.text} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <TouchableOpacity style={styles.monthBtn} activeOpacity={0.8} onPress={() => setMonthOffset((m) => m + 1)}>
                <Icon name="right" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.photoBtn} activeOpacity={0.85} onPress={takePhoto} disabled={working}>
              {working ? (
                <ActivityIndicator color={colors.pinkStrong} />
              ) : (
                <>
                  <Icon name="camera" size={20} color={colors.pinkStrong} strokeWidth={1.5} />
                  <Text style={styles.photoBtnText}>{t.registerPhotoUploadBtn}</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {extracted && (
          <View style={{ gap: 10 }}>
            <Text style={styles.fieldLabel}>{t.registerPhotoReviewLabel.replace('{count}', String(extracted.length))}</Text>
            {extracted.map((d, i) => (
              <TouchableOpacity
                key={`${d.date}-${d.slot}`}
                style={[styles.rowCard, checked[i] && styles.rowCardSel]}
                activeOpacity={0.85}
                onPress={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
              >
                <View style={[styles.checkbox, checked[i] && styles.checkboxSel]}>
                  {checked[i] && <Icon name="check" size={13} color="#fff" />}
                </View>
                <Text style={styles.rowText}>{formatBookingDate(d.date)} · {d.slot === 'FullDay' ? t.registerPhotoFullDay : d.slot}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.confirmBtnWrap} activeOpacity={0.85} onPress={confirmSelected} disabled={confirming}>
              <View style={styles.confirmBtn}>
                <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={StyleSheet.absoluteFill} />
                {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>{t.registerPhotoConfirmBtn.replace('{count}', String(Object.values(checked).filter(Boolean).length))}</Text>}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelLink} activeOpacity={0.7} onPress={() => setExtracted(null)}>
              <Text style={styles.cancelLinkText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        )}

        {resultSummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t.registerPhotoDoneTitle}</Text>
            <Text style={styles.summaryText}>{t.registerPhotoDoneMarked.replace('{count}', String(resultSummary.ok))}</Text>
            {resultSummary.skipped > 0 && (
              <Text style={styles.summaryTextMuted}>{t.registerPhotoDoneSkipped.replace('{count}', String(resultSummary.skipped))}</Text>
            )}
            <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
              <Text style={styles.outlineBtnText}>{t.registerPhotoBackToCalendar}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  monthBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontFamily: 'Sora', fontWeight: '800', fontSize: 16, color: colors.text, minWidth: 160, textAlign: 'center' },
  photoBtn: { height: 110, borderRadius: 16, borderWidth: 1.5, borderColor: colors.divider, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface },
  photoBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: colors.divider, ...shadow.card },
  rowCardSel: { borderColor: colors.maroon },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  rowText: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  confirmBtnWrap: { marginTop: 4 },
  confirmBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
  cancelLink: { alignSelf: 'center', padding: 8 },
  cancelLinkText: { color: colors.textSoft, fontWeight: '600', fontSize: 13 },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, gap: 10, ...shadow.card },
  summaryTitle: { fontFamily: 'Sora', fontWeight: '800', fontSize: 16, color: colors.text },
  summaryText: { fontSize: 14, color: colors.text },
  summaryTextMuted: { fontSize: 12.5, color: colors.textSoft },
  outlineBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  outlineBtnText: { color: colors.text, fontWeight: '700', fontSize: 13.5 },
});
