import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextStyle, TouchableOpacity, View } from 'react-native';
import Icon from './Icon';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme';

// Dates are always stored as DD/MM/YYYY, picked from a calendar rather than typed — stock
// availability is matched on this exact text, so "20/12/26" vs "20/12/2026" must not happen.

const pad = (n: number) => String(n).padStart(2, '0');
export const formatDMY = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

export function parseDMY(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((s || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return d.getDate() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 ? d : null;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function DateField({ value, onChange, textStyle, placeholderColor, minDate }: {
  value: string;
  onChange: (v: string) => void;
  textStyle?: TextStyle;
  placeholderColor?: string;
  minDate?: Date; // earliest selectable day; defaults to today
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const today = useMemo(() => new Date(new Date().toDateString()), []);
  const min = minDate ? new Date(minDate.toDateString()) : today;
  const selected = parseDMY(value);
  const [view, setView] = useState(() => {
    const base = selected || min;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  }, [view]);

  const canPrev = view > new Date(min.getFullYear(), min.getMonth(), 1);
  const monthLabel = view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(true)} accessibilityRole="button">
        <Text style={[textStyle, !value && { color: placeholderColor || colors.textMuted }]}>{value || t.dateFieldPick}</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.head}>
              <TouchableOpacity disabled={!canPrev} onPress={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} hitSlop={10} style={!canPrev && { opacity: 0.3 }}>
                <Icon name="left" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.month}>{monthLabel}</Text>
              <TouchableOpacity onPress={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} hitSlop={10}>
                <Icon name="right" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {WEEKDAYS.map((w) => <Text key={w} style={styles.wd}>{w}</Text>)}
              {cells.map((d, i) => {
                if (!d) return <View key={i} style={styles.cell} />;
                const past = d < min;
                const sel = !!selected && d.getTime() === selected.getTime();
                return (
                  <View key={i} style={styles.cell}>
                    <TouchableOpacity
                      disabled={past}
                      style={[styles.day, sel && styles.daySel]}
                      onPress={() => { onChange(formatDMY(d)); setOpen(false); }}
                    >
                      <Text style={[styles.dayText, past && styles.dayPast, sel && styles.dayTextSel]}>{d.getDate()}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
            {!!value && (
              <TouchableOpacity onPress={() => { onChange(''); setOpen(false); }} style={styles.clear}>
                <Text style={styles.clearText}>{t.dateFieldClear}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 18 },
  sheet: { backgroundColor: colors.surface, borderRadius: 20, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  month: { fontSize: 16, fontWeight: '800', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  wd: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, color: colors.textMuted, paddingVertical: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  day: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  daySel: { backgroundColor: colors.maroon },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.text },
  dayTextSel: { color: '#fff' },
  dayPast: { color: colors.dividerStrong },
  clear: { alignSelf: 'center', paddingTop: 10 },
  clearText: { fontSize: 13.5, fontWeight: '700', color: colors.textSoft },
});
