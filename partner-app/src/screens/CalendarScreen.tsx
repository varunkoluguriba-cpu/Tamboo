import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useHallTokens } from '../hooks/useHallTokens';
import { useOrders } from '../hooks/useOrders';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BLOCK_REASONS_KEY = 'tamboo-partner-block-reasons';

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Hall booking dates come from the customer app's fmtDate(): "20 Dec 2026". Order dateTxt
// is free-text from the customer's Event form (placeholder "DD/MM/YYYY") — best-effort only.
function parseDisplayDate(text: string): Date | null {
  const ddmmyyyy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }
  const dmmmyyyy = text.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dmmmyyyy) {
    const [, dd, mon, yyyy] = dmmmyyyy;
    const mi = MONTH_NAMES.findIndex((m) => m.slice(0, 3).toLowerCase() === mon.toLowerCase());
    if (mi >= 0) return new Date(Number(yyyy), mi, Number(dd));
  }
  return null;
}

type Job = { event: string; customer: string; status: string };

export default function CalendarScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { partner } = useAuth();
  const WEEKDAYS = [t.calendarMon, t.calendarTue, t.calendarWed, t.calendarThu, t.calendarFri, t.calendarSat, t.calendarSun];
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<Date | null>(null);
  const [halls, setHalls] = useState<Array<{ id: string; name: string; blockedDates: string[] }>>([]);
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const activeHall = halls.find((h) => h.id === selectedHallId) ?? halls[0];
  const blockedDates = activeHall?.blockedDates ?? [];
  const setBlockedDates = (dates: string[]) => {
    if (!activeHall) return;
    setHalls((list) => list.map((h) => (h.id === activeHall.id ? { ...h, blockedDates: dates } : h)));
  };
  const [blockReasons, setBlockReasons] = useState<Record<string, string>>({});
  const [reasonDraft, setReasonDraft] = useState('');

  const isVenue = partner?.role === 'venue';
  const { tokens: hallTokens } = useHallTokens();
  const { orders } = useOrders();

  useEffect(() => {
    AsyncStorage.getItem(BLOCK_REASONS_KEY).then((raw) => {
      if (raw) {
        try { setBlockReasons(JSON.parse(raw)); } catch { /* ignore corrupt local notes */ }
      }
    });
  }, []);

  useEffect(() => {
    if (!isVenue) return;
    api.get<Array<{ id: string; name: string; blockedDates: string[] }>>('/api/halls/me/halls')
      .then((list) => {
        setHalls(list.map((h) => ({ id: h.id, name: h.name, blockedDates: h.blockedDates || [] })));
        setSelectedHallId((cur) => cur ?? list[0]?.id ?? null);
      })
      .catch(() => {});
  }, [isVenue]);

  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    const push = (d: Date | null, job: Job) => {
      if (!d) return;
      const key = dateKey(d);
      const list = map.get(key) || [];
      list.push(job);
      map.set(key, list);
    };
    if (isVenue) {
      for (const tok of hallTokens.filter((tok) => !activeHall || tok.hallId === activeHall.id)) {
        const d = parseDisplayDate(tok.date);
        if (d) push(d, { event: tok.hallName, customer: tok.customer, status: tok.status.toUpperCase() });
      }
    } else {
      for (const o of orders) {
        const d = parseDisplayDate(o.dateTxt);
        if (d) push(d, { event: o.event, customer: o.customer, status: o.status });
      }
    }
    return map;
  }, [isVenue, hallTokens, orders, activeHall?.id]);

  const bookedJobsFor = (d: Date) => jobsByDate.get(dateKey(d)) || [];

  const viewMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1), [today, monthOffset]);

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const out: Array<{ date: Date | null }> = [];
    for (let i = 0; i < leadingBlanks; i++) out.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) out.push({ date: new Date(year, month, d) });
    while (out.length % 7 !== 0) out.push({ date: null });
    return out;
  }, [viewMonth]);

  const selJobs = selected ? bookedJobsFor(selected) : [];
  const selIso = selected ? isoDate(selected) : '';
  const selKey = selected ? dateKey(selected) : '';
  const isBlocked = blockedDates.includes(selIso);
  const canBlock = selected && selJobs.length === 0;

  const toggleBlock = async () => {
    if (!selected) return;
    const next = isBlocked ? blockedDates.filter((d) => d !== selIso) : [...blockedDates, selIso];
    setBlockedDates(next);
    if (!isBlocked) {
      const nextReasons = { ...blockReasons, [`${activeHall?.id}|${selIso}`]: reasonDraft.trim() || t.calendarNotAvailable };
      setBlockReasons(nextReasons);
      AsyncStorage.setItem(BLOCK_REASONS_KEY, JSON.stringify(nextReasons)).catch(() => {});
      setReasonDraft('');
    }
    try {
      await api.put(`/api/halls/me/halls/${activeHall?.id}/blocked-dates`, { dates: next });
    } catch {
      setBlockedDates(blockedDates); // revert on failure
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.calendarTitle}</Text>
        </View>

        {isVenue && halls.length > 1 && (
          <View style={styles.hallChipRow}>
            {halls.map((h) => {
              const sel = activeHall?.id === h.id;
              return (
                <TouchableOpacity key={h.id} style={[styles.hallChip, sel && styles.hallChipSel]} activeOpacity={0.85} onPress={() => { setSelectedHallId(h.id); setSelected(null); }}>
                  <Text style={[styles.hallChipText, sel && styles.hallChipTextSel]}>{h.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.calCard}>
          <View style={styles.calNavRow}>
            <TouchableOpacity style={styles.navBtn} activeOpacity={monthOffset > 0 ? 0.8 : 1} disabled={monthOffset === 0} onPress={() => setMonthOffset((m) => Math.max(0, m - 1))}>
              <Icon name="left" size={16} color={monthOffset === 0 ? colors.dividerStrong : colors.text} />
            </TouchableOpacity>
            <Text style={styles.calTitle}>{MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}</Text>
            <TouchableOpacity style={styles.navBtn} activeOpacity={0.8} onPress={() => setMonthOffset((m) => m + 1)}>
              <Icon name="right" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekLabel}>{w}</Text>
            ))}
          </View>

          <View style={styles.dayGrid}>
            {cells.map((c, i) => {
              if (!c.date) return <View key={i} style={styles.dayCell} />;
              const key = dateKey(c.date);
              const jobs = bookedJobsFor(c.date);
              const isBlockedDay = blockedDates.includes(isoDate(c.date));
              const isSel = selected && dateKey(selected) === key;
              const bg = isBlockedDay ? '#1e1b2e' : jobs.length > 0 ? colors.pinkBg : '#fff';
              const color = isBlockedDay ? '#fff' : colors.text;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayCell, styles.dayCellBtn, { backgroundColor: bg }, isSel && styles.dayCellSel]}
                  activeOpacity={0.8}
                  onPress={() => setSelected(c.date)}
                >
                  <Text style={[styles.dayNum, { color }]}>{c.date.getDate()}</Text>
                  {jobs.length > 0 && !isBlockedDay && <Text style={styles.dayTag}>{jobs.length}</Text>}
                  {isBlockedDay && <Text style={[styles.dayTag, { color: '#fff' }]}>—</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.pinkBg }]} />
              <Text style={styles.legendText}>{t.calendarBooked}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#1e1b2e' }]} />
              <Text style={styles.legendText}>{t.calendarBlocked}</Text>
            </View>
          </View>
        </View>

        {selected && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>
              {selected.getDate()} {MONTH_NAMES[selected.getMonth()].slice(0, 3)} {selected.getFullYear()}
            </Text>

            {selJobs.map((j, i) => (
              <TouchableOpacity key={i} style={styles.jobRow} activeOpacity={0.85} onPress={() => navigation.navigate(isVenue ? 'HTokens' : 'Orders')}>
                <Text style={styles.jobText}><Text style={{ fontWeight: '700' }}>{j.event}</Text> · {j.customer}</Text>
                <Text style={styles.jobStatus}>{j.status === 'PENDING' ? t.calendarStatusPending : j.status === 'CONFIRMED' ? t.calendarStatusConfirmed : j.status}</Text>
              </TouchableOpacity>
            ))}

            {isBlocked && (
              <Text style={styles.blockedNote}>{t.calendarBlockedNote.replace('{reason}', blockReasons[`${activeHall?.id}|${selIso}`] || t.calendarNotAvailable)}</Text>
            )}

            {isVenue && canBlock && !isBlocked && (
              <TextInput
                value={reasonDraft}
                onChangeText={setReasonDraft}
                placeholder={t.calendarReasonPlaceholder}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            )}

            {isVenue && selJobs.length === 0 && (
              <TouchableOpacity
                style={[styles.blockBtn, { backgroundColor: isBlocked ? colors.text : colors.maroon }]}
                activeOpacity={0.85}
                onPress={toggleBlock}
              >
                <Text style={styles.blockBtnText}>{isBlocked ? t.calendarUnblockDay : t.calendarBlockDay}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  calCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 14, gap: 10, ...shadow.card },
  hallChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hallChip: { paddingHorizontal: 12, height: 34, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface, justifyContent: 'center' },
  hallChipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  hallChipText: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  hallChipTextSel: { color: '#fff' },
  calNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  calTitle: { fontFamily: 'Sora', fontWeight: '800', fontSize: 15, color: colors.text },
  weekRow: { flexDirection: 'row' },
  weekLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.textMuted },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dayCellBtn: { borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center', gap: 1 },
  dayCellSel: { borderColor: colors.pink, borderWidth: 2 },
  dayNum: { fontSize: 13, fontWeight: '700' },
  dayTag: { fontSize: 9, fontWeight: '700', color: colors.pinkStrong },
  legendRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11.5, color: colors.textSoft },
  detailCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 10, ...shadow.card },
  detailTitle: { fontWeight: '700', fontSize: 14, color: colors.text },
  jobRow: { backgroundColor: colors.bg, borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  jobText: { fontSize: 13, color: colors.text, flex: 1 },
  jobStatus: { fontSize: 12.5, fontWeight: '700', color: colors.pinkStrong },
  blockedNote: { fontSize: 13, color: '#4b4560' },
  input: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, fontSize: 14, color: colors.text },
  blockBtn: { height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  blockBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, fontFamily: 'Sora' },
});
