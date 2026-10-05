import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { VenueTabBar } from '../components/TabBar';
import { statusColors, type TokenStatus } from '../data/catalog';
import { useHallTokens, tokenUiStatus } from '../hooks/useHallTokens';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HTokens'>;
type Tab = TokenStatus | 'ALL';

export default function HTokensScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('ACTIVE');
  const { tokens, loading } = useHallTokens();
  const HALL_TOKENS = tokens.map((tok) => ({
    id: tok.id,
    status: tokenUiStatus(tok),
    event: tok.hallName,
    customer: tok.customer,
    date: tok.date,
    slot: tok.slot,
    guests: tok.guests,
    visitTxt: tok.status === 'token_paid' ? t.htokensTabPending : t.htokensTabVisited,
  }));

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: 'ACTIVE', label: t.htokensTabPending },
    { key: 'VISITED', label: t.htokensTabVisited },
    { key: 'CONFIRMED', label: t.htokensTabConfirmed },
    { key: 'EXPIRED', label: t.htokensTabExpired },
    { key: 'ALL', label: t.htokensTabAll },
  ];

  const filtered = HALL_TOKENS.filter((tok) => tab === 'ALL' || tok.status === tab);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.htokensTitle}</Text>

        <View style={styles.tabRow}>
          {TABS.map((tb) => {
            const count = tb.key === 'ALL' ? HALL_TOKENS.length : HALL_TOKENS.filter((x) => x.status === tb.key).length;
            return (
              <TouchableOpacity key={tb.key} style={[styles.tabChip, tab === tb.key && styles.tabChipSel]} activeOpacity={0.85} onPress={() => setTab(tb.key)}>
                <Text style={[styles.tabChipText, tab === tb.key && styles.tabChipTextSel]}>{tb.label} · {count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.maroon} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.htokensEmpty}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((tok) => {
              const sc = statusColors(tok.status);
              return (
                <TouchableOpacity key={tok.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('HToken', { id: tok.id })}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardId}>{tok.id}</Text>
                    <View style={[styles.pill, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.pillText, { color: sc.color }]}>{tok.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{tok.event}</Text>
                  <Text style={styles.cardMeta}>{tok.customer} · {tok.date} · {tok.slot} · {t.htokensGuestsCount.replace('{count}', String(tok.guests))}</Text>
                  <Text style={styles.cardVisit}>{t.htokensVisitLabel.replace('{value}', tok.visitTxt)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <VenueTabBar active="htokens" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  tabRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tabChip: { height: 36, paddingHorizontal: 13, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface },
  tabChipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  tabChipText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  tabChipTextSel: { color: '#fff' },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, alignItems: 'center' },
  emptyText: { color: colors.textSoft, fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 5, ...shadow.card },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardId: { fontFamily: 'Sora', fontWeight: '800', fontSize: 13, color: colors.textMuted },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 12.5, color: colors.textSoft },
  cardVisit: { fontSize: 12.5, color: '#4b4560' },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontSize: 11, fontWeight: '700' },
});
