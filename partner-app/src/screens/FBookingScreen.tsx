import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { prettyPhone } from '../utils/date';
import { endsNextDay, farmDate, nowMinIST, occasionText, slotLabel, time12, type OwnerFarmBooking } from '../utils/farm';
import { farmStatusStyle } from './FBookingsScreen';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FBooking'>;
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

export default function FBookingScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const [b, setB] = useState<OwnerFarmBooking | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    api.get<OwnerFarmBooking[]>('/api/farms/me/bookings')
      .then((list) => { const found = list.find((x) => x.id === route.params.id); if (found) setB(found); else setError(true); })
      .catch(() => setError(true));
  }, [route.params.id]));

  const act = async (action: 'complete' | 'cancel') => {
    setBusy(true);
    try {
      setB(await api.patch<OwnerFarmBooking>(`/api/farms/me/bookings/${route.params.id}`, { action }));
    } catch (e) {
      Alert.alert(t.pfBookingTitle, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setBusy(false);
    }
  };
  const confirmCancel = () => Alert.alert(t.pfCancelTitle, t.pfCancelMsg, [
    { text: t.cancel, style: 'cancel' },
    { text: t.pfCancelYes, style: 'destructive', onPress: () => act('cancel') },
  ]);

  if (error) return <SafeAreaView style={styles.center}><Text style={styles.muted}>{t.loadFailedMsg}</Text></SafeAreaView>;
  if (!b) return <SafeAreaView style={styles.center}><ActivityIndicator color={colors.pink} /></SafeAreaView>;

  const sc = farmStatusStyle(b.status);
  const statusText = { confirmed: t.pfStConfirmed, completed: t.pfStCompleted, cancelled: t.pfStCancelled, disputed: t.pfStDisputed }[b.status];
  const started = b.startMin <= nowMinIST();
  const nextDay = endsNextDay({ enabled: true, start: b.checkIn, end: b.checkOut, weekdayPrice: 0, weekendPrice: 0 });
  const cancelledBy = b.cancelledBy === 'customer' ? t.pfByCustomer : b.cancelledBy === 'owner' ? t.pfByYou : b.cancelledBy === 'admin' ? t.pfByAdmin : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <Icon name="left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{b.code}</Text>
          <View style={[styles.pill, { backgroundColor: sc.bg }]}><Text style={[styles.pillText, { color: sc.color }]}>{statusText}</Text></View>
        </View>
        {!!cancelledBy && <Text style={styles.muted}>{cancelledBy}</Text>}
        {b.status === 'disputed' && <View style={styles.note}><Text style={styles.noteText}>{t.pfDisputedNote}</Text></View>}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{b.farmName}</Text>
          <Row label={slotLabel(b.slot, t)} value={t.pfGuestsN.replace('{n}', String(b.guests))} />
          <Row label={t.pfCheckIn} value={`${farmDate(b.date, t)}, ${time12(b.checkIn)}`} />
          <Row label={t.pfCheckOut} value={`${time12(b.checkOut)}${nextDay ? ` (${t.pfNextDay})` : ''}`} />
          {!!b.occasion && <Row label={t.pfOccasion} value={occasionText(b.occasion, t)} />}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t.pfCustomer}</Text>
          <Text style={styles.cardTitle}>{b.customerName || '—'}</Text>
          {!!b.customerPhone && <Text style={styles.muted}>{prettyPhone(b.customerPhone)}</Text>}
          {!!b.customerPhone && b.status !== 'cancelled' && (
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={() => Linking.openURL(`tel:${b.customerPhone}`).catch(() => {})}>
              <Icon name="phone" size={15} color={colors.pinkStrong} />
              <Text style={styles.callText}>{t.pfCallCustomer}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Row label={t.pfTotal} value={inr(b.total)} bold />
          <Row label={t.pfAdvancePaid} value={inr(b.advanceAmount)} />
          <Row label={t.pfYouGetOnline.replace('{pct}', String(b.commissionPct))} value={inr(b.youReceiveOnline)} />
          <Row label={t.pfBalanceAtProperty} value={inr(b.balanceAmount)} bold />
          {b.securityDeposit > 0 && <Row label={t.pfDepositCollect} value={inr(b.securityDeposit)} />}
        </View>

        {b.status === 'confirmed' && (
          <>
            <TouchableOpacity activeOpacity={0.85} disabled={busy || !started} onPress={() => act('complete')}>
              <View style={[styles.primaryBtn, !started && { opacity: 0.45 }]}>
                <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={StyleSheet.absoluteFill} />
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t.pfMarkCompleted}</Text>}
              </View>
            </TouchableOpacity>
            {!started && <Text style={styles.hint}>{t.pfCompleteHint}</Text>}
            {!started && (
              <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} disabled={busy} onPress={confirmCancel}>
                <Text style={styles.dangerText}>{t.pfCancelBooking}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  scroll: { padding: 18, paddingTop: 6, gap: 12, paddingBottom: 28 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  pill: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  pillText: { fontSize: 12, fontWeight: '700' },
  muted: { fontSize: 13, color: colors.textSoft },
  note: { backgroundColor: colors.amberBg, borderRadius: 14, padding: 12 },
  noteText: { color: colors.amber, fontSize: 12.5, lineHeight: 18 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 8, ...shadow.card },
  cardLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  cardTitle: { fontSize: 15.5, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { flex: 1, fontSize: 13, color: colors.textSoft },
  rowValue: { fontSize: 13.5, color: colors.text, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.pinkBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  callText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13.5 },
  primaryBtn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  outlineBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: colors.dangerStrong, fontWeight: '700', fontSize: 13.5 },
});
