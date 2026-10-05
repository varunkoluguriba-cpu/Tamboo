import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import TabBar from '../components/TabBar';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type RemoteQuote = {
  id: string;
  code: string;
  vendorName: string;
  productName: string;
  dateTxt: string;
  guests: number;
  need: string;
  status: 'AWAITING_VENDOR' | 'OFFER_SENT' | 'REVISION_REQUESTED' | 'ACCEPTED' | 'DECLINED';
  quotedTotal: number;
  versions: Array<{ v: number; total: number; note: string; lines: Array<{ label: string; amount: number }> }>;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;
type Tab = 'active' | 'past' | 'halls' | 'quotes';

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
  const [quotes, setQuotes] = useState<RemoteQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);

  const soon = () => Alert.alert(t.comingSoon, t.bookingsComingSoonBody);

  const loadQuotes = useCallback(() => {
    api.get<RemoteQuote[]>('/api/quotes/me')
      .then(setQuotes)
      .catch(() => {})
      .finally(() => setQuotesLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { loadQuotes(); }, [loadQuotes]));

  const respondToQuote = async (id: string, action: 'accept' | 'decline' | 'requestRevision') => {
    setBusyQuoteId(id);
    try {
      await api.patch(`/api/quotes/me/${id}`, { action });
      loadQuotes();
      // Custom quotes are settled directly with the vendor — there's no in-app payment
      // step for these yet (unlike catalog items), so make that explicit on accept.
      if (action === 'accept') Alert.alert(t.bookingsAcceptPay, t.bookingsQuoteAcceptedMsg);
    } catch (e) {
      Alert.alert(t.tryAgain, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setBusyQuoteId(null);
    }
  };

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: 'active', label: t.bookingsTabActive },
    { key: 'past', label: t.bookingsTabPast },
    { key: 'halls', label: t.bookingsTabHalls },
    { key: 'quotes', label: t.bookingsTabQuotes },
  ];

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
            <Text style={styles.emptyText}>{t.bookingsEmptyActive}</Text>
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
            <Text style={styles.emptyText}>{t.bookingsEmptyPast}</Text>
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
              <Text style={styles.emptyText}>{t.bookingsEmptyHalls}</Text>
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
              <Text style={styles.dashedBtnText}>{t.bookingsFindHall}</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'quotes' && (
          <View style={{ gap: 10 }}>
            <TouchableOpacity style={styles.dashedBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Browse', {})}>
              <Text style={styles.dashedBtnText}>{t.bookingsNewQuote}</Text>
            </TouchableOpacity>
            {quotesLoading ? (
              <ActivityIndicator color={colors.pink} style={{ marginTop: 10 }} />
            ) : quotes.length === 0 ? (
              <Text style={styles.emptyText}>{t.bookingsEmptyQuotes}</Text>
            ) : (
              quotes.map((q) => {
                const latest = q.versions[q.versions.length - 1];
                const hasOffer = !!latest && (q.status === 'OFFER_SENT' || q.status === 'REVISION_REQUESTED');
                const busy = busyQuoteId === q.id;
                return (
                  <View key={q.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardId}>{q.code} {latest ? `v${latest.v}` : ''}</Text>
                      <View style={[styles.pill, styles.pillQuote]}>
                        <Text style={[styles.pillText, styles.pillTextQuote]}>{q.status.replace(/_/g, ' ')}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle}>{q.productName || q.vendorName}</Text>
                    <Text style={styles.cardMeta}>{q.vendorName} · {q.dateTxt}</Text>
                    <View style={styles.needBox}>
                      <Text style={styles.needText}>{q.need}</Text>
                    </View>

                    {hasOffer && latest && (
                      <View style={styles.offerBlock}>
                        {latest.lines.map((l) => (
                          <View key={l.label} style={styles.offerLine}>
                            <Text style={styles.offerLabel}>{l.label}</Text>
                            <Text style={styles.offerAmount}>₹{l.amount.toLocaleString('en-IN')}</Text>
                          </View>
                        ))}
                        <View style={styles.offerTotalRow}>
                          <Text style={styles.offerTotalLabel}>{t.bookingsQuotedTotal}</Text>
                          <Text style={styles.offerTotalValue}>₹{latest.total.toLocaleString('en-IN')}</Text>
                        </View>
                        {!!latest.note && <Text style={styles.offerNote}>{latest.note}</Text>}
                        <View style={styles.offerActions}>
                          <TouchableOpacity style={styles.offerOutlineBtn} activeOpacity={0.85} disabled={busy} onPress={() => respondToQuote(q.id, 'decline')}>
                            <Text style={styles.offerOutlineText}>{t.bookingsDecline}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.offerOutlineBtn} activeOpacity={0.85} disabled={busy} onPress={() => respondToQuote(q.id, 'requestRevision')}>
                            <Text style={styles.offerOutlineText}>{t.bookingsAskChanges}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.offerAcceptBtnWrap} activeOpacity={0.85} disabled={busy} onPress={() => respondToQuote(q.id, 'accept')}>
                            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.offerAcceptBtn}>
                              <Text style={styles.offerAcceptText}>{t.bookingsAcceptPay}</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
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
