import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { farmDate, slotLabel, timeRange, type OwnerFarmBooking } from '../utils/farm';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FBookings'>;
type Tab = 'upcoming' | 'completed' | 'cancelled';

export const farmStatusStyle = (s: OwnerFarmBooking['status']) =>
  s === 'confirmed' ? { bg: colors.greenBg, color: colors.green }
    : s === 'completed' ? { bg: colors.purpleBg, color: colors.maroon }
      : s === 'disputed' ? { bg: colors.amberBg, color: colors.amber }
        : { bg: colors.dangerBg, color: colors.danger };

export default function FBookingsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [list, setList] = useState<OwnerFarmBooking[] | null>(null);
  const [error, setError] = useState(false);

  useFocusEffect(useCallback(() => {
    setError(false);
    api.get<OwnerFarmBooking[]>('/api/farms/me/bookings').then(setList).catch(() => setError(true));
  }, []));

  const statusText = (s: OwnerFarmBooking['status']) => ({ confirmed: t.pfStConfirmed, completed: t.pfStCompleted, cancelled: t.pfStCancelled, disputed: t.pfStDisputed })[s];
  const shown = (list || []).filter((b) => (tab === 'upcoming' ? b.status === 'confirmed' || b.status === 'disputed' : b.status === tab));
  // Upcoming soonest first; history newest first.
  if (tab !== 'upcoming') shown.reverse();
  const TABS: Array<{ key: Tab; label: string }> = [
    { key: 'upcoming', label: t.pfTabUpcoming }, { key: 'completed', label: t.pfTabCompleted }, { key: 'cancelled', label: t.pfTabCancelled },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.pfBookingsTitle}</Text>
        <View style={styles.tabs}>
          {TABS.map((x) => (
            <TouchableOpacity key={x.key} style={[styles.tab, tab === x.key && styles.tabSel]} activeOpacity={0.85} onPress={() => setTab(x.key)}>
              <Text style={[styles.tabText, tab === x.key && styles.tabTextSel]}>{x.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {error ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>{t.loadFailedMsg}</Text></View>
        ) : list === null ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 20 }} />
        ) : shown.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>{tab === 'upcoming' ? t.pfNoUpcoming : t.pfNoneHere}</Text></View>
        ) : (
          <View style={{ gap: 8 }}>
            {shown.map((b) => {
              const sc = farmStatusStyle(b.status);
              return (
                <TouchableOpacity key={b.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('FBooking', { id: b.id })}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.code}>{b.code}</Text>
                    <View style={[styles.pill, { backgroundColor: sc.bg }]}><Text style={[styles.pillText, { color: sc.color }]}>{statusText(b.status)}</Text></View>
                  </View>
                  <Text style={styles.cardTitle}>{farmDate(b.date, t)} · {slotLabel(b.slot, t)}</Text>
                  <Text style={styles.cardMeta}>{timeRange(b.checkIn, b.checkOut)} · {t.pfGuestsN.replace('{n}', String(b.guests))}</Text>
                  <Text style={styles.cardMeta}>{b.customerName || t.pfCustomer} · {b.farmName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12, paddingBottom: 24 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  tabs: { flexDirection: 'row', gap: 6, backgroundColor: colors.surface, borderRadius: 999, padding: 4, ...shadow.card },
  tab: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabSel: { backgroundColor: colors.maroon },
  tabText: { fontSize: 12.5, fontWeight: '700', color: colors.textSoft, textAlign: 'center' },
  tabTextSel: { color: '#fff' },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, alignItems: 'center' },
  emptyText: { color: colors.textSoft, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 4, ...shadow.card },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { fontFamily: 'Sora', fontWeight: '800', fontSize: 13, color: colors.textMuted },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 12.5, color: colors.textSoft },
});
