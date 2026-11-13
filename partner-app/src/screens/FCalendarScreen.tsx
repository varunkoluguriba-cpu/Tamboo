import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { SLOT_KEYS, slotLabel, type MyFarm, type SlotKey } from '../utils/farm';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FCalendar'>;
type SlotState = 'free' | 'booked' | 'closed' | 'past';
type Month = Record<string, Partial<Record<SlotKey, SlotState>>>;

const DOT: Record<SlotState, string> = { free: colors.green, booked: colors.pink, closed: colors.textMuted, past: colors.divider };
const ymNow = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7);
const shiftMonth = (ym: string, d: number) => {
  const [y, m] = ym.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1 + d, 1));
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}`;
};

// Month view per farm house: each date shows a dot per stay type (free / booked / closed).
// Tapping a future date closes it for new bookings, or opens it again.
export default function FCalendarScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [farms, setFarms] = useState<MyFarm[] | null>(null);
  const [farmId, setFarmId] = useState('');
  const [month, setMonth] = useState(ymNow());
  const [days, setDays] = useState<Month | null>(null);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [err, setErr] = useState('');

  useFocusEffect(useCallback(() => {
    api.get<MyFarm[]>('/api/farms/me/farms')
      .then((list) => {
        setFarms(list);
        setFarmId((cur) => (list.some((f) => f.id === cur) ? cur : list[0]?.id || ''));
      })
      .catch(() => { setFarms([]); setErr(t.loadFailedMsg); });
  }, [t]));

  const farm = farms?.find((f) => f.id === farmId);
  useEffect(() => { if (farm) setBlocked(farm.blockedDates || []); }, [farm]);

  const loadMonth = useCallback(() => {
    if (!farmId) return;
    setDays(null);
    api.get<Month>(`/api/farms/me/farms/${farmId}/availability?month=${month}`).then(setDays).catch(() => setErr(t.loadFailedMsg));
  }, [farmId, month, t]);
  useEffect(loadMonth, [loadMonth]);

  const toggleDate = async (d: string) => {
    const next = blocked.includes(d) ? blocked.filter((x) => x !== d) : [...blocked, d];
    const prev = blocked;
    setBlocked(next);
    setErr('');
    try {
      const r = await api.put<{ blockedDates: string[] }>(`/api/farms/me/farms/${farmId}/blocked-dates`, { dates: next });
      setBlocked(r.blockedDates);
      setFarms((list) => (list || []).map((f) => (f.id === farmId ? { ...f, blockedDates: r.blockedDates } : f)));
      loadMonth();
    } catch {
      setBlocked(prev);
      setErr(t.pfCalErr);
    }
  };

  const months = t.pfMonths.split(',');
  const weekdays = t.pfWeekdays.split(',');
  const [y, m] = month.split('-').map(Number);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const dates = days ? Object.keys(days).sort() : [];
  const cells: Array<string | null> = [...Array(firstDow).fill(null), ...dates];
  const canGoBack = month > ymNow();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.pfCalTitle}</Text>
        {farms === null ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 20 }} />
        ) : farms.length === 0 ? (
          <TouchableOpacity style={styles.emptyCard} activeOpacity={0.85} onPress={() => navigation.navigate('FFarm', {})}>
            <Text style={styles.emptyText}>{err || t.pfCalNoFarm}</Text>
            {!err && <Text style={styles.link}>{t.pfAddFarm} →</Text>}
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.hint}>{t.pfCalHint}</Text>
            {farms.length > 1 && (
              <View style={styles.chipRow}>
                {farms.map((f) => (
                  <TouchableOpacity key={f.id} style={[styles.chip, f.id === farmId ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setFarmId(f.id)}>
                    <Text style={[styles.chipText, f.id === farmId && styles.chipTextSel]} numberOfLines={1}>{f.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.card}>
              <View style={styles.monthRow}>
                <TouchableOpacity style={[styles.navBtn, !canGoBack && { opacity: 0.3 }]} disabled={!canGoBack} onPress={() => setMonth(shiftMonth(month, -1))}>
                  <Icon name="left" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{months[m - 1]} {y}</Text>
                <TouchableOpacity style={styles.navBtn} onPress={() => setMonth(shiftMonth(month, 1))}>
                  <Icon name="right" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.weekRow}>
                {weekdays.map((w, i) => <Text key={i} style={styles.weekday} numberOfLines={1}>{w}</Text>)}
              </View>
              {!days ? (
                <ActivityIndicator color={colors.pink} style={{ marginVertical: 30 }} />
              ) : (
                <View style={styles.grid}>
                  {cells.map((d, i) => {
                    if (!d) return <View key={`e${i}`} style={styles.cell} />;
                    const states = SLOT_KEYS.filter((s) => days[d][s]).map((s) => days[d][s] as SlotState);
                    const past = states.length > 0 && states.every((s) => s === 'past');
                    const closed = blocked.includes(d);
                    return (
                      <TouchableOpacity key={d} style={styles.cell} activeOpacity={0.7} disabled={past} onPress={() => toggleDate(d)}>
                        <View style={[styles.day, closed && !past && styles.dayClosed]}>
                          <Text style={[styles.dayNum, past && { color: colors.dividerStrong }, closed && !past && { color: '#fff' }]}>{Number(d.slice(8))}</Text>
                          <View style={styles.dots}>
                            {!past && states.map((s, j) => <View key={j} style={[styles.dot, { backgroundColor: closed ? '#fff' : DOT[s] }]} />)}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
            {farm && (
              <Text style={styles.hint}>{SLOT_KEYS.filter((s) => farm.slots[s]?.enabled).map((s) => slotLabel(s, t)).join(' · ')}</Text>
            )}
            <View style={styles.legend}>
              <Legend color={DOT.free} label={t.pfLegendFree} />
              <Legend color={DOT.booked} label={t.pfLegendBooked} />
              <Legend color={colors.maroon} label={t.pfLegendClosed} square />
            </View>
            {!!err && <Text style={styles.error}>{err}</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ color, label, square }: { color: string; label: string; square?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }, square && { borderRadius: 3 }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12, paddingBottom: 24 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12.5, color: colors.textSoft, lineHeight: 19 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, alignItems: 'center', gap: 8 },
  emptyText: { color: colors.textSoft, fontSize: 13, textAlign: 'center' },
  link: { color: colors.pinkStrong, fontWeight: '800', fontSize: 13.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 36, maxWidth: 220, paddingHorizontal: 13, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 12, ...shadow.card },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  monthText: { fontFamily: 'Sora', fontSize: 16, fontWeight: '800', color: colors.text },
  weekRow: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 10.5, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  day: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dayClosed: { backgroundColor: colors.maroon },
  dayNum: { fontSize: 14, fontWeight: '700', color: colors.text },
  dots: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12.5, color: colors.textSoft },
  error: { color: colors.dangerStrong, fontSize: 12.5 },
});
