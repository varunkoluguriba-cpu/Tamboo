import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { TentTabBar } from '../components/TabBar';
import { statusColors } from '../data/catalog';
import { useOrders } from '../hooks/useOrders';
import { useQuotes } from '../hooks/useQuotes';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;
type Tab = 'new' | 'active' | 'quotes' | 'done';

const ACTIVE_STATUSES = ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const DONE_STATUSES = ['COMPLETED', 'CANCELLED'];
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function OrdersScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('new');
  const { orders: ORDERS, loading } = useOrders();
  const { quotes: QUOTES } = useQuotes();

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

  const QUOTE_STATUS_LABELS: Record<string, string> = {
    'AWAITING VENDOR': t.ordersQuoteStatusAwaitingVendor,
    'REVISION REQUESTED': t.ordersQuoteStatusRevisionRequested,
  };

  const newOrders = ORDERS.filter((o) => o.status === 'PENDING');
  const activeOrders = ORDERS.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const doneOrders = ORDERS.filter((o) => DONE_STATUSES.includes(o.status));
  const openQuotes = QUOTES.filter((q) => q.status === 'AWAITING VENDOR' || q.status === 'REVISION REQUESTED');

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: 'new', label: `${t.ordersTabNew} · ${newOrders.length}` },
    { key: 'active', label: `${t.ordersTabActive} · ${activeOrders.length}` },
    { key: 'quotes', label: `${t.ordersTabQuotes} · ${openQuotes.length}` },
    { key: 'done', label: t.ordersTabPast },
  ];

  const currentOrders = tab === 'new' ? newOrders : tab === 'active' ? activeOrders : tab === 'done' ? doneOrders : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.ordersTitle}</Text>

        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} style={[styles.tabChip, tab === t.key && styles.tabChipSel]} activeOpacity={0.85} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabChipText, tab === t.key && styles.tabChipTextSel]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'quotes' ? (
          openQuotes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.ordersNoQuotes}</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {openQuotes.map((q) => (
                <TouchableOpacity key={q.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('Quote', { id: q.id })}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardId}>{q.id}</Text>
                    <View style={[styles.pill, { backgroundColor: statusColors(q.status).bg }]}>
                      <Text style={[styles.pillText, { color: statusColors(q.status).color }]}>{QUOTE_STATUS_LABELS[q.status] || q.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{q.event}</Text>
                  <Text style={styles.cardMeta}>{q.customer} · {q.date} · {q.guests} {t.orderGuestsSuffix}</Text>
                  <View style={styles.needBox}>
                    <Text style={styles.needText}>{q.need}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : loading ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 24 }} />
        ) : currentOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.ordersEmptyGeneric}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {currentOrders.map((o) => {
              const sc = statusColors(o.status);
              return (
                <TouchableOpacity key={o.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('Order', { id: o.id })}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardId}>{o.code}</Text>
                    <View style={[styles.pill, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.pillText, { color: sc.color }]}>{STATUS_LABELS[o.status] || o.status.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{o.event}</Text>
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.cardMeta}>{o.dateTxt} · {o.customer}</Text>
                    <Text style={styles.cardEarn}>{inr(o.earn)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TentTabBar active="orders" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 14 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  tabRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tabChip: { flexGrow: 1, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface, paddingHorizontal: 10 },
  tabChipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  tabChipText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  tabChipTextSel: { color: '#fff' },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 18, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 6, ...shadow.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardId: { fontFamily: 'Sora', fontWeight: '800', fontSize: 13, color: colors.textMuted },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardMeta: { fontSize: 12.5, color: colors.textSoft },
  cardEarn: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  needBox: { backgroundColor: colors.bg, borderRadius: 10, padding: 10 },
  needText: { fontSize: 12.5, color: '#4b4560' },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
