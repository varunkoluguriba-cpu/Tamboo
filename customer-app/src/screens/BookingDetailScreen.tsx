import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

export default function BookingDetailScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { params } = route;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.bookingDetailTitle}</Text>
        </View>

        {params.kind === 'order' ? (
          <OrderDetail order={params.order} />
        ) : (
          <HallDetail hall={params.hall} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function OrderDetail({ order }: { order: import('../navigation/types').RemoteOrderSummary }) {
  const { t } = useLanguage();
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.code}>{order.code}</Text>
        <Text style={styles.title}>{order.eventName || order.eventType || t.bookings}</Text>
        <Row label={t.bookingDetailVendor} value={order.vendorName} />
        <Row label={t.bookingDetailDate} value={order.dateTxt} />
        <Row label={t.guests} value={String(order.guests)} />
        {!!order.address && <Row label={t.bookingDetailAddress} value={order.address} />}
        <Row label={t.bookingDetailStatus} value={order.status.replace(/_/g, ' ')} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.bookingDetailItems}</Text>
        {order.lines.map((l, i) => (
          <View key={i} style={styles.lineRow}>
            <Text style={styles.lineText}>{l.name} × {l.qty}</Text>
            <Text style={styles.lineAmount}>₹{(l.qty * l.unitPrice).toLocaleString('en-IN')}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.lineRow}>
          <Text style={styles.totalLabel}>{t.bookingDetailTotal}</Text>
          <Text style={styles.totalValue}>₹{order.value.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {order.history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.bookingDetailHistory}</Text>
          {order.history.map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <View style={styles.historyDot} />
              <Text style={styles.historyLabel}>{h.label}</Text>
              <Text style={styles.historyDate}>{h.date}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function HallDetail({ hall }: { hall: import('../navigation/types').RemoteHallBooking }) {
  const { t } = useLanguage();
  const deadlineText = hall.advanceDeadlineAtMs
    ? new Date(hall.advanceDeadlineAtMs).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
    : '';
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{hall.hallName}</Text>
      <Row label={t.bookingDetailDate} value={hall.date} />
      <Row label={t.tokenPaySummarySlot} value={hall.slot} />
      <Row label={t.guests} value={hall.guests} />
      <Row label={t.bookingDetailStatus} value={hall.status.replace(/_/g, ' ')} />
      <Row label={t.tokenAmountPaidLabel} value={`₹${hall.amount.toLocaleString('en-IN')}`} />
      {hall.finalRent > 0 && <Row label={t.bookingDetailFinalRent} value={`₹${hall.finalRent.toLocaleString('en-IN')}`} />}
      {hall.status === 'awaiting_advance' && (
        <>
          <Row label={t.advancePaySummaryAmount.replace('{pct}', String(hall.advancePct))} value={`₹${hall.advanceAmount.toLocaleString('en-IN')}`} />
          <Row label={t.advancePaySummaryDeadline} value={deadlineText} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 8, ...shadow.card },
  code: { fontFamily: 'Sora', fontWeight: '800', fontSize: 13, color: colors.textMuted },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardTitle: { fontWeight: '700', fontSize: 15, color: colors.text, marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowLabel: { fontSize: 13, color: colors.textSoft },
  rowValue: { fontSize: 13, fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  lineText: { fontSize: 13.5, color: '#4b4560', flex: 1 },
  lineAmount: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },
  totalLabel: { fontWeight: '700', color: colors.text },
  totalValue: { fontFamily: 'Sora', fontWeight: '800', fontSize: 17, color: colors.maroon },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.pink },
  historyLabel: { fontSize: 13, color: colors.text, flex: 1 },
  historyDate: { fontSize: 11.5, color: colors.textMuted },
});
