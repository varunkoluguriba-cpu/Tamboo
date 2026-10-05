import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { ORDER_PROGRESSION, NEXT_LABEL, type OrderStatus } from '../data/catalog';
import { api, ApiError } from '../api/client';
import { useOrders, type RemoteOrder } from '../hooks/useOrders';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Order'>;

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function OrderScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { orders, loading, reload } = useOrders();
  const [working, setWorking] = useState(false);
  const original: RemoteOrder | undefined = orders.find((o) => o.id === route.params.id);

  const soon = () => {
    Alert.alert(t.comingSoon, t.orderComingSoonMsg);
  };

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t.orderStatusPending,
    CONFIRMED: t.orderStatusConfirmed,
    PACKED: t.orderStatusPacked,
    OUT_FOR_DELIVERY: t.orderStatusOutForDelivery,
    DELIVERED: t.orderStatusDelivered,
    COMPLETED: t.orderStatusCompleted,
    CANCELLED: t.orderStatusCancelled,
    DISPUTED: t.orderStatusDisputed,
  };

  const NEXT_LABEL_T: Record<string, string> = {
    CONFIRMED: t.orderMarkPacked,
    PACKED: t.orderMarkOutForDelivery,
    OUT_FOR_DELIVERY: t.orderMarkDelivered,
    DELIVERED: t.orderMarkCompleted,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.pink} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!original) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>{t.orderNotFound}</Text>
      </SafeAreaView>
    );
  }

  const status = original.status;
  const history = original.history;
  const isPending = status === 'PENDING';
  const idx = ORDER_PROGRESSION.indexOf(status);
  const canAdvance = idx >= 0 && idx < ORDER_PROGRESSION.length - 1;
  const nextLabel = NEXT_LABEL[status];
  const nextLabelDisplay = NEXT_LABEL_T[status] || nextLabel;

  const setOrderStatus = async (newStatus: OrderStatus, historyLabel: string) => {
    setWorking(true);
    try {
      await api.patch(`/api/vendors/me/orders/${original.id}`, { status: newStatus, historyLabel });
      await reload();
    } catch (e) {
      Alert.alert(t.orderUpdateFailedTitle, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setWorking(false);
    }
  };

  const decline = () => {
    Alert.alert(t.orderDeclineConfirmTitle, t.orderDeclineConfirmMsg, [
      { text: t.orderKeepIt, style: 'cancel' },
      { text: t.orderDecline, style: 'destructive', onPress: () => setOrderStatus('CANCELLED', 'Declined') },
    ]);
  };

  const accept = () => setOrderStatus('CONFIRMED', 'Accepted');

  const advance = () => {
    if (idx < 0) return;
    const next = ORDER_PROGRESSION[idx + 1];
    setOrderStatus(next, NEXT_LABEL[status].replace(/^Mark /, '').replace(/^./, (c) => c.toUpperCase()));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{original.code}</Text>
        </View>

        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.statusCard}>
          <Text style={styles.statusLabel}>{t.orderStatusLabel}</Text>
          <Text style={styles.statusValue}>{status ? (STATUS_LABELS[status] || status.replace(/_/g, ' ')) : ''}</Text>
          <Text style={styles.statusSub}>{original.event} · {original.dateTxt}</Text>
        </LinearGradient>

        {isPending && (
          <>
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{t.orderPendingNote}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.declineBtn} activeOpacity={0.85} onPress={decline} disabled={working}>
                <Text style={styles.declineBtnText}>{t.orderDecline}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtnWrap} activeOpacity={0.85} onPress={accept} disabled={working}>
                <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.acceptBtn}>
                  {working ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptBtnText}>{t.orderAcceptOrder}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}

        {canAdvance && !isPending && (
          <TouchableOpacity activeOpacity={0.85} onPress={advance} disabled={working}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.advanceBtn}>
              <Text style={styles.advanceBtnText}>{working ? t.orderUpdating : nextLabelDisplay}</Text>
              <Icon name="right" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.orderCustomer}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.rowText}>{original.customer}</Text>
            <Text style={styles.rowMuted}>{original.phone}</Text>
          </View>
          <View style={styles.addrRow}>
            <Icon name="pin" size={14} color={colors.pink} />
            <Text style={styles.addrText}>{original.address}</Text>
          </View>
          <Text style={styles.rowMuted}>{original.guests} {t.orderGuestsSuffix} · {original.type}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.outlineBtnSm}
              activeOpacity={0.85}
              onPress={() => original.phone && Linking.openURL(`tel:${original.phone}`)}
            >
              <Text style={styles.outlineBtnSmText}>{t.call}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.outlineBtnSm}
              activeOpacity={0.85}
              onPress={() =>
                original.address &&
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(original.address)}`)
              }
            >
              <Text style={styles.outlineBtnSmText}>{t.orderDirections}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.orderItemsToLoad}</Text>
          {original.lines.map((l) => (
            <View key={l.name} style={styles.lineRow}>
              <Text style={styles.lineText}>{l.name}</Text>
              <Text style={styles.lineQty}>× {l.qty}</Text>
            </View>
          ))}
          {original.fromQuote && <Text style={styles.rowMuted}>{t.orderItemsPerQuote}</Text>}
          <View style={styles.breakdown}>
            <View style={styles.rowBetween}>
              <Text style={styles.rowMuted}>{t.orderValue}</Text>
              <Text style={styles.rowText}>{inr(original.value)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.rowMuted}>{t.orderPlatformCommission}</Text>
              <Text style={styles.rowText}>− {inr(original.commission)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.youReceive}>{t.orderYouReceive}</Text>
              <Text style={styles.youReceiveValue}>{inr(original.earn)}</Text>
            </View>
            <Text style={styles.payoutNote}>{t.orderPayoutNote}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.orderTimeline}</Text>
          {history.map((h, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={styles.dot} />
              <Text style={styles.timelineLabel}>{h.label}</Text>
              <Text style={styles.timelineDate}>{h.date}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  notFound: { padding: 24, color: colors.textSoft },
  scroll: { padding: 18, paddingTop: 6, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  statusCard: { borderRadius: 22, padding: 18, gap: 4 },
  statusLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5 },
  statusValue: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: '#fff', textTransform: 'capitalize' },
  statusSub: { color: '#fff', fontSize: 13 },
  noteBox: { backgroundColor: '#fff7e6', borderRadius: 14, padding: 12 },
  noteText: { color: '#8a5a00', fontSize: 12.5, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 10 },
  declineBtn: { flex: 1, height: 50, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  declineBtnText: { color: colors.text, fontWeight: '600', fontSize: 14.5, fontFamily: 'Sora' },
  acceptBtnWrap: { flex: 2 },
  acceptBtn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
  advanceBtn: { height: 52, borderRadius: 999, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  advanceBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 8, ...shadow.card },
  cardTitle: { fontWeight: '700', fontSize: 14, color: colors.text },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowText: { fontSize: 13.5, color: colors.text },
  rowMuted: { fontSize: 12.5, color: colors.textSoft },
  addrRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  addrText: { flex: 1, fontSize: 13, color: '#4b4560', lineHeight: 19 },
  outlineBtnSm: { flex: 1, height: 42, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  outlineBtnSmText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineText: { fontSize: 13.5, color: colors.text },
  lineQty: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  breakdown: { backgroundColor: colors.bg, borderRadius: 12, padding: 12, gap: 6, marginTop: 4 },
  youReceive: { fontWeight: '800', fontSize: 14.5, color: colors.text },
  youReceiveValue: { fontWeight: '800', fontSize: 14.5, color: colors.green },
  payoutNote: { fontSize: 11.5, color: colors.textMuted },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pink },
  timelineLabel: { flex: 1, fontSize: 13, color: colors.text },
  timelineDate: { fontSize: 12, color: colors.textMuted },
});
