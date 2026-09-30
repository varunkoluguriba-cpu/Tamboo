import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { VenueTabBar } from '../components/TabBar';
import { HALL_TOKENS, statusColors, type TokenStatus } from '../data/catalog';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HTokens'>;
type Tab = TokenStatus | 'ALL';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'ACTIVE', label: 'Visit pending' },
  { key: 'VISITED', label: 'Visited' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'ALL', label: 'All' },
];

export default function HTokensScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('ACTIVE');

  const filtered = HALL_TOKENS.filter((t) => tab === 'ALL' || t.status === tab);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Pre-bookings</Text>

        <View style={styles.tabRow}>
          {TABS.map((t) => {
            const count = t.key === 'ALL' ? HALL_TOKENS.length : HALL_TOKENS.filter((x) => x.status === t.key).length;
            return (
              <TouchableOpacity key={t.key} style={[styles.tabChip, tab === t.key && styles.tabChipSel]} activeOpacity={0.85} onPress={() => setTab(t.key)}>
                <Text style={[styles.tabChipText, tab === t.key && styles.tabChipTextSel]}>{t.label} · {count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nothing here.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((t) => {
              const sc = statusColors(t.status);
              return (
                <TouchableOpacity key={t.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('HToken', { id: t.id })}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardId}>{t.id}</Text>
                    <View style={[styles.pill, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.pillText, { color: sc.color }]}>{t.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{t.event}</Text>
                  <Text style={styles.cardMeta}>{t.customer} · {t.date} · {t.slot} · {t.guests} guests</Text>
                  <Text style={styles.cardVisit}>Visit: {t.visitTxt}</Text>
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
