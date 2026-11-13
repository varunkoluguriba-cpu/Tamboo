import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { prettyPhone } from '../utils/date';
import { endsNextDay, farmDate, inr, slotLabel, time12, type MyFarmBooking } from '../utils/farm';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FarmBooking'>;

export const farmStatus = (b: MyFarmBooking, t: Record<string, string>) => ({
  label: { confirmed: t.cfStConfirmed, completed: t.cfStCompleted, cancelled: t.cfStCancelled, disputed: t.cfStDisputed }[b.status],
  ok: b.status === 'confirmed' || b.status === 'completed',
});
export const farmRefundText = (b: MyFarmBooking, t: Record<string, string>) =>
  b.refundStatus === 'pending' ? t.cfRefundPending.replace('{amount}', inr(b.refundAmount))
    : b.refundStatus === 'refunded' ? t.cfRefunded.replace('{amount}', inr(b.refundAmount)) : '';

export default function FarmBookingScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const [b, setB] = useState<MyFarmBooking | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    api.get<MyFarmBooking[]>('/api/farms/bookings/me')
      .then((list) => { const f = list.find((x) => x.id === route.params.id); if (f) setB(f); else setError(true); })
      .catch(() => setError(true));
  }, [route.params.id]));

  const cancel = () => {
    if (!b) return;
    const refund = Math.round((b.advanceAmount * b.refundPctNow) / 100);
    const msg = b.refundPctNow > 0 ? t.cfCancelMsg.replace('{amount}', inr(refund)).replace('{pct}', String(b.refundPctNow)) : t.cfCancelNoRefund;
    Alert.alert(t.cfCancelTitle, msg, [
      { text: t.cfKeep, style: 'cancel' },
      {
        text: t.cfCancelYes, style: 'destructive', onPress: async () => {
          setBusy(true);
          try {
            const r = await api.post<{ booking: MyFarmBooking }>(`/api/farms/bookings/${b.id}/cancel`);
            setB(r.booking);
          } catch (e) {
            Alert.alert(t.cfCancelTitle, e instanceof ApiError ? e.message : t.tryAgain);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const directions = () => {
    if (!b) return;
    const dest = b.lat != null && b.lng != null ? `${b.lat},${b.lng}` : encodeURIComponent(b.address);
    const url = Platform.OS === 'ios' ? `https://maps.apple.com/?daddr=${dest}` : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    Linking.openURL(url).catch(() => {});
  };

  if (error) return <SafeAreaView style={styles.center}><Text style={styles.muted}>{t.loadFailedMsg}</Text></SafeAreaView>;
  if (!b) return <SafeAreaView style={styles.center}><ActivityIndicator color={colors.pink} /></SafeAreaView>;

  const st = farmStatus(b, t as unknown as Record<string, string>);
  const refund = farmRefundText(b, t as unknown as Record<string, string>);
  const live = b.status === 'confirmed';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.cfBookingTitle}</Text>
          <Text style={[styles.pill, st.ok ? styles.pillOk : styles.pillBad]}>{st.label}</Text>
        </View>
        <Text style={styles.code}>{b.code}</Text>
        {b.cancelledBy === 'owner' && <Text style={styles.muted}>{t.cfByOwner}</Text>}
        {b.status === 'disputed' && <View style={styles.note}><Text style={styles.noteText}>{t.cfDisputedNote}</Text></View>}
        {!!refund && <Text style={[styles.refund, b.refundStatus === 'refunded' && { color: colors.green }]}>{refund}</Text>}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{b.farmName}</Text>
          <Row label={slotLabel(b.slot, t)} value={t.cfGuestsN.replace('{n}', String(b.guests))} />
          <Row label={t.cfCheckIn} value={`${farmDate(b.date, t)}, ${time12(b.checkIn)}`} />
          <Row label={t.cfCheckOut} value={`${time12(b.checkOut)}${endsNextDay(b.checkIn, b.checkOut) ? ` (${t.cfNextDay})` : ''}`} />
        </View>

        {(b.status === 'confirmed' || b.status === 'completed') && !!b.address && (
          <View style={styles.card}>
            <Text style={styles.label}>{t.cfAddress}</Text>
            <Text style={styles.body}>{b.address}</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.softBtn} activeOpacity={0.85} onPress={directions}>
                <Icon name="pin" size={15} color={colors.pinkStrong} /><Text style={styles.softText}>{t.cfDirections}</Text>
              </TouchableOpacity>
              {!!b.ownerPhone && (
                <TouchableOpacity style={styles.softBtn} activeOpacity={0.85} onPress={() => Linking.openURL(`tel:${b.ownerPhone}`).catch(() => {})}>
                  <Icon name="phone" size={15} color={colors.pinkStrong} /><Text style={styles.softText}>{t.cfCallOwner}</Text>
                </TouchableOpacity>
              )}
            </View>
            {!!b.ownerPhone && <Text style={styles.muted}>{prettyPhone(b.ownerPhone)}</Text>}
          </View>
        )}

        <View style={styles.card}>
          <Row label={t.cfStayPrice} value={inr(b.basePrice)} />
          {b.extraGuests > 0 && <Row label={t.cfExtraGuests.replace('{n}', String(b.extraGuests))} value={inr(b.extraGuestCharge)} />}
          <Row label={t.cfTotal} value={inr(b.total)} bold />
          <Row label={t.cfPaidOnline} value={inr(b.advanceAmount)} />
          {b.status !== 'cancelled' && <Row label={t.cfPayLater} value={inr(b.balanceAmount)} bold />}
          {b.status !== 'cancelled' && b.securityDeposit > 0 && <Text style={styles.muted}>{t.cfDeposit.replace('{amount}', inr(b.securityDeposit))}</Text>}
        </View>

        {live && (
          <>
            <Text style={styles.muted}>{t.cfPolicy}</Text>
            <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} disabled={busy} onPress={cancel}>
              {busy ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.dangerText}>{t.cfCancelBtn}</Text>}
            </TouchableOpacity>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { flex: 1, fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  pill: { fontSize: 12, fontWeight: '700', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 11, overflow: 'hidden' },
  pillOk: { backgroundColor: colors.greenBg, color: colors.green },
  pillBad: { backgroundColor: colors.amberBg, color: colors.amber },
  code: { fontFamily: 'Sora', fontWeight: '800', fontSize: 14, color: colors.textMuted },
  muted: { fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },
  refund: { fontSize: 13.5, fontWeight: '700', color: colors.amber },
  note: { backgroundColor: colors.amberBg, borderRadius: 14, padding: 12 },
  noteText: { color: colors.amber, fontSize: 12.5, lineHeight: 18 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 8, ...shadow.card },
  cardTitle: { fontSize: 15.5, fontWeight: '800', color: colors.text },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  softBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.pinkBg, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20 },
  softText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { flex: 1, fontSize: 13, color: colors.textSoft },
  rowValue: { fontSize: 13.5, fontWeight: '600', color: colors.text, textAlign: 'right', flexShrink: 1 },
  outlineBtn: { height: 48, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
});
