import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function bookedJobsFor(d: Date): Array<{ event: string; customer: string; status: string }> {
  const seed = (d.getDate() * 7 + d.getMonth() * 13) % 10;
  if (seed === 3) return [{ event: 'Ananya Birthday', customer: 'Ananya Reddy', status: 'PENDING' }];
  if (seed === 6) return [{ event: 'Priya & Karthik Wedding', customer: 'Priya Sharma', status: 'CONFIRMED' }];
  return [];
}

export default function CalendarScreen({ navigation }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<Date | null>(null);
  const [blocked, setBlocked] = useState<Record<string, string>>({});
  const [reasonDraft, setReasonDraft] = useState('');

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
  const selKey = selected ? dateKey(selected) : '';
  const isBlocked = !!blocked[selKey];
  const canBlock = selected && selJobs.length === 0;

  const toggleBlock = () => {
    if (!selected) return;
    if (isBlocked) {
      setBlocked((b) => {
        const next = { ...b };
        delete next[selKey];
        return next;
      });
    } else {
      setBlocked((b) => ({ ...b, [selKey]: reasonDraft.trim() || 'Not available' }));
      setReasonDraft('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>

        <View style={styles.calCard}>
          <View style={styles.calNavRow}>
            <TouchableOpacity style={styles.navBtn} activeOpacity={monthOffset > 0 ? 0.8 : 1} disabled={monthOffset === 0} onPress={() => setMonthOffset((m) => Math.max(0, m - 1))}>
              <Icon name="left" size={16} color={monthOffset === 0 ? colors.dividerStrong : colors.text} />
            </TouchableOpacity>
            <Text style={styles.calTitle}>{MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}</Text>
            <TouchableOpacity style={styles.navBtn} activeOpacity={0.8} onPress={() => setMonthOffset((m) => Math.min(6, m + 1))}>
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
              const isBlockedDay = !!blocked[key];
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
              <Text style={styles.legendText}>Booked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#1e1b2e' }]} />
              <Text style={styles.legendText}>Blocked</Text>
            </View>
          </View>
        </View>

        {selected && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>
              {selected.getDate()} {MONTH_NAMES[selected.getMonth()].slice(0, 3)} {selected.getFullYear()}
            </Text>

            {selJobs.map((j, i) => (
              <TouchableOpacity key={i} style={styles.jobRow} activeOpacity={0.85} onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.jobText}><Text style={{ fontWeight: '700' }}>{j.event}</Text> · {j.customer}</Text>
                <Text style={styles.jobStatus}>{j.status}</Text>
              </TouchableOpacity>
            ))}

            {isBlocked && (
              <Text style={styles.blockedNote}>Blocked: {blocked[selKey]}. Customers can't book you on this day.</Text>
            )}

            {canBlock && !isBlocked && (
              <TextInput
                value={reasonDraft}
                onChangeText={setReasonDraft}
                placeholder="Reason (only you see this), e.g. Family function"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            )}

            {selJobs.length === 0 && (
              <TouchableOpacity
                style={[styles.blockBtn, { backgroundColor: isBlocked ? colors.text : colors.maroon }]}
                activeOpacity={0.85}
                onPress={toggleBlock}
              >
                <Text style={styles.blockBtnText}>{isBlocked ? 'Unblock this day' : 'Block this day'}</Text>
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
