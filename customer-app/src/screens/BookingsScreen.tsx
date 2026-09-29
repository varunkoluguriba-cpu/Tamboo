import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import TabBar from '../components/TabBar';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;
type Tab = 'active' | 'past' | 'halls' | 'quotes';

function soon() {
  Alert.alert('Coming soon', 'This is being built next.');
}

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past' },
  { key: 'halls', label: 'Halls' },
  { key: 'quotes', label: 'Quotes' },
];

const ACTIVE = [
  { id: 'TB-250142', event: 'Priya & Karthik Wedding', date: '12 Nov 2026', vendor: 'Sai Tent House', total: '₹42,000', status: 'CONFIRMED', ok: true },
  { id: 'TB-250138', event: 'Ananya Birthday', date: '28 Oct 2026', vendor: 'Balaji Decorators', total: '₹9,500', status: 'PENDING', ok: false },
];

const PAST = [
  { id: 'TB-249981', event: 'Office Diwali Party', date: '2 Nov 2025', vendor: 'Hyderabad Sound & Light', total: '₹12,300', status: 'COMPLETED', ok: true },
  { id: 'TB-249850', event: 'Family Get-together', date: '14 Aug 2025', vendor: 'Sai Tent House', total: '₹6,800', status: 'CANCELLED', ok: false },
];

const TOKENS = [
  { id: 'TK-88213', hall: 'Sri Kalyana Mandapam', date: '20 Dec 2026', slot: 'Evening', amount: '₹5,000', status: 'HELD', isActive: true, left: 'Visit within 31 hours' },
];

const QUOTES = [
  {
    id: 'QT-5521',
    version: 'v1',
    status: 'AWAITING VENDOR',
    event: 'Custom Mandap Design',
    vendor: 'Sai Tent House',
    date: '12 Nov 2026',
    need: 'Traditional South Indian mandap with floral drapes, budget ₹25,000',
    hasOffer: false,
  },
  {
    id: 'QT-5498',
    version: 'v2',
    status: 'OFFER RECEIVED',
    event: 'Corporate Stage Setup',
    vendor: 'Hyderabad Sound & Light',
    date: '5 Dec 2026',
    need: 'Stage + lighting + sound for 300 guests',
    hasOffer: true,
    lines: [
      { label: 'Stage & backdrop', amount: '₹18,000' },
      { label: 'Lighting rig', amount: '₹9,000' },
      { label: 'Sound system', amount: '₹7,500' },
    ],
    total: '₹34,500',
    note: 'Valid for 48 hours',
  },
];

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={[styles.pill, ok ? styles.pillOk : styles.pillWarn]}>
      <Text style={[styles.pillText, ok ? styles.pillTextOk : styles.pillTextWarn]}>{label}</Text>
    </View>
  );
}

export default function BookingsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('active');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.bookings}</Text>

        <View style={styles.tabRow}>
          {TABS.map((tb) => (
            <TouchableOpacity key={tb.key} style={[styles.tabBtn, tab === tb.key && styles.tabBtnSel]} activeOpacity={0.85} onPress={() => setTab(tb.key)}>
              <Text style={[styles.tabBtnText, tab === tb.key && styles.tabBtnTextSel]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'active' && (
          ACTIVE.length === 0 ? (
            <Text style={styles.emptyText}>No active bookings yet.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {ACTIVE.map((b) => (
                <TouchableOpacity key={b.id} style={styles.card} activeOpacity={0.85} onPress={soon}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardId}>{b.id}</Text>
                    <StatusPill label={b.status} ok={b.ok} />
                  </View>
                  <Text style={styles.cardTitle}>{b.event}</Text>
                  <View style={styles.cardBottom}>
                    <Text style={styles.cardMeta}>{b.date} · {b.vendor}</Text>
                    <Text style={styles.cardAmount}>{b.total}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        {tab === 'past' && (
          PAST.length === 0 ? (
            <Text style={styles.emptyText}>No past bookings.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {PAST.map((b) => (
                <TouchableOpacity key={b.id} style={styles.card} activeOpacity={0.85} onPress={soon}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardId}>{b.id}</Text>
                    <StatusPill label={b.status} ok={b.ok} />
                  </View>
                  <Text style={styles.cardTitle}>{b.event}</Text>
                  <View style={styles.cardBottom}>
                    <Text style={styles.cardMeta}>{b.date} · {b.vendor}</Text>
                    <Text style={styles.cardAmount}>{b.total}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        {tab === 'halls' && (
          <View style={{ gap: 10 }}>
            {TOKENS.length === 0 ? (
              <Text style={styles.emptyText}>No hall pre-bookings yet.</Text>
            ) : (
              TOKENS.map((b) => (
                <TouchableOpacity key={b.id} style={styles.card} activeOpacity={0.85} onPress={soon}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardId}>{b.id}</Text>
                    <StatusPill label={b.status} ok={false} />
                  </View>
                  <Text style={styles.cardTitle}>{b.hall}</Text>
                  <View style={styles.cardBottom}>
                    <Text style={styles.cardMeta}>{b.date} · {b.slot}</Text>
                    <Text style={styles.cardAmount}>{b.amount}</Text>
                  </View>
                  {b.isActive && <Text style={styles.cardLeft}>{b.left}</Text>}
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.dashedBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Venues')}>
              <Text style={styles.dashedBtnText}>+ Find a hall</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'quotes' && (
          <View style={{ gap: 10 }}>
            <TouchableOpacity style={styles.dashedBtn} activeOpacity={0.85} onPress={soon}>
              <Text style={styles.dashedBtnText}>+ New quote request</Text>
            </TouchableOpacity>
            {QUOTES.length === 0 ? (
              <Text style={styles.emptyText}>No quote requests yet.</Text>
            ) : (
              QUOTES.map((q) => (
                <View key={q.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardId}>{q.id} {q.version}</Text>
                    <View style={[styles.pill, styles.pillQuote]}>
                      <Text style={[styles.pillText, styles.pillTextQuote]}>{q.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{q.event}</Text>
                  <Text style={styles.cardMeta}>{q.vendor} · {q.date}</Text>
                  <View style={styles.needBox}>
                    <Text style={styles.needText}>{q.need}</Text>
                  </View>

                  {q.hasOffer && (
                    <View style={styles.offerBlock}>
                      {q.lines!.map((l) => (
                        <View key={l.label} style={styles.offerLine}>
                          <Text style={styles.offerLabel}>{l.label}</Text>
                          <Text style={styles.offerAmount}>{l.amount}</Text>
                        </View>
                      ))}
                      <View style={styles.offerTotalRow}>
                        <Text style={styles.offerTotalLabel}>Quoted total</Text>
                        <Text style={styles.offerTotalValue}>{q.total}</Text>
                      </View>
                      <Text style={styles.offerNote}>{q.note}</Text>
                      <View style={styles.offerActions}>
                        <TouchableOpacity style={styles.offerOutlineBtn} activeOpacity={0.85} onPress={soon}>
                          <Text style={styles.offerOutlineText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.offerOutlineBtn} activeOpacity={0.85} onPress={soon}>
                          <Text style={styles.offerOutlineText}>Ask changes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.offerAcceptBtnWrap} activeOpacity={0.85} onPress={soon}>
                          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.offerAcceptBtn}>
                            <Text style={styles.offerAcceptText}>Accept & pay</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <TabBar active="bookings" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 14 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  tabRow: { flexDirection: 'row', gap: 6, backgroundColor: colors.surface, borderRadius: 999, padding: 4, ...shadow.card },
  tabBtn: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tabBtnSel: { backgroundColor: colors.maroon },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  tabBtnTextSel: { color: '#fff' },
  emptyText: { textAlign: 'center', paddingVertical: 30, color: colors.textSoft, fontSize: 13.5 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 8, ...shadow.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardId: { fontFamily: 'Sora', fontWeight: '800', fontSize: 13, color: colors.textMuted },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { fontSize: 12.5, color: colors.textSoft },
  cardAmount: { fontWeight: '700', color: colors.text },
  cardLeft: { fontSize: 12.5, fontWeight: '800', color: colors.amber },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillOk: { backgroundColor: colors.greenBg },
  pillWarn: { backgroundColor: colors.amberBg },
  pillQuote: { backgroundColor: colors.purpleBg },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  pillTextOk: { color: colors.green },
  pillTextWarn: { color: colors.amber },
  pillTextQuote: { color: '#6d28d9' },
  dashedBtn: { height: 44, borderRadius: 999, borderWidth: 1.5, borderColor: colors.dividerStrong, borderStyle: 'dashed', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  dashedBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13.5 },
  needBox: { backgroundColor: colors.bg, borderRadius: 10, padding: 10 },
  needText: { fontSize: 12.5, color: '#4b4560' },
  offerBlock: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8, gap: 6 },
  offerLine: { flexDirection: 'row', justifyContent: 'space-between' },
  offerLabel: { fontSize: 13, color: colors.textSoft },
  offerAmount: { fontSize: 13, fontWeight: '600', color: colors.text },
  offerTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  offerTotalLabel: { fontWeight: '700', color: colors.text },
  offerTotalValue: { fontFamily: 'Sora', fontWeight: '800', fontSize: 18, color: colors.maroon },
  offerNote: { fontSize: 11.5, color: colors.textMuted },
  offerActions: { flexDirection: 'row', gap: 6, marginTop: 4 },
  offerOutlineBtn: { flex: 1, height: 40, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  offerOutlineText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  offerAcceptBtnWrap: { flex: 1.3 },
  offerAcceptBtn: { height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  offerAcceptText: { color: '#fff', fontWeight: '700', fontSize: 12.5, fontFamily: 'Sora' },
});
