import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useCatalog } from '../context/CatalogContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Venue'>;
type SlotState = 'free' | 'booked' | 'closed';
type Slot = 'Morning' | 'Evening';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dayAvailability(date: Date): { morning: SlotState; evening: SlotState } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return { morning: 'closed', evening: 'closed' };
  const seed = (date.getDate() * 7 + date.getMonth() * 13) % 10;
  return {
    morning: seed < 6 ? 'free' : 'booked',
    evening: seed < 7 ? 'free' : 'booked',
  };
}

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export default function VenueScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { getHall } = useCatalog();
  const hall = getHall(route.params.id);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const viewMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d;
  }, [today, monthOffset]);

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7; // Monday-first offset
    const out: Array<{ date: Date | null }> = [];
    for (let i = 0; i < leadingBlanks; i++) out.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) out.push({ date: new Date(year, month, d) });
    while (out.length % 7 !== 0) out.push({ date: null });
    return out;
  }, [viewMonth]);

  if (!hall) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>{t.venueNotFound}</Text>
      </SafeAreaView>
    );
  }

  const openDirections = () => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hall.address)}`).catch(() => {});
  };

  const pickDay = (d: Date) => {
    const avail = dayAvailability(d);
    setSelectedDate(d);
    if (avail.morning === 'free') setSelectedSlot('Morning');
    else if (avail.evening === 'free') setSelectedSlot('Evening');
    else setSelectedSlot(null);
  };

  const selectedAvail = selectedDate ? dayAvailability(selectedDate) : null;
  const slotIsFree = selectedSlot && selectedAvail ? selectedAvail[selectedSlot === 'Morning' ? 'morning' : 'evening'] === 'free' : false;
  const canPay = !!(selectedDate && selectedSlot && slotIsFree);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.cover}>
          <View style={styles.coverPlaceholder}>
            <Icon name="home" size={44} color={colors.pinkStrong} strokeWidth={1.3} />
          </View>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View>
            <View style={styles.typeRow}>
              <Text style={styles.typeText}>{hall.type}</Text>
              {hall.verified && (
                <View style={styles.verifiedRow}>
                  <Icon name="shield" size={13} color={colors.green} />
                  <Text style={styles.verifiedText}>{t.venueVerified}</Text>
                </View>
              )}
            </View>
            <Text style={styles.name}>{hall.name}</Text>
            <Text style={styles.ratingLine}>★ {hall.rating} · {hall.reviews} {t.venueReviewsLabel} · {hall.km} km</Text>
          </View>

          <Text style={styles.blurb}>{hall.blurb}</Text>

          <TouchableOpacity style={styles.addressRow} activeOpacity={0.85} onPress={openDirections}>
            <Icon name="pin" size={16} color={colors.pink} />
            <Text style={styles.addressText}>{hall.address}</Text>
            <Text style={styles.openMap}>{t.directions}</Text>
          </TouchableOpacity>

          <View style={styles.factsGrid}>
            {hall.facts.map((f) => (
              <View key={f.k} style={styles.factBox}>
                <Text style={styles.factLabel}>{f.k}</Text>
                <Text style={styles.factValue}>{f.v}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.crockeryBox, hall.hasCrockery ? styles.crockeryOk : styles.crockeryWarn]}>
            <Text style={styles.crockeryText}>
              <Text style={{ fontWeight: '700' }}>{t.venueCrockeryLabel}</Text>
              {hall.hasCrockery ? t.venueCrockeryAvailable : t.venueCrockeryNotProvided}
            </Text>
          </View>
          {!hall.hasCrockery && (
            <TouchableOpacity style={styles.rentBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Browse', { category: 'Crockery & Vessels' })}>
              <Text style={styles.rentBtnText}>{t.venueRentCrockeryBtn}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.amenities}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{t.venueAmenitiesLabel}</Text>
            {hall.amenities}
          </Text>

          <View style={styles.calCard}>
            <Text style={styles.calTitle}>{t.venueAvailabilityCalendarTitle}</Text>

            <View style={styles.calNavRow}>
              <TouchableOpacity
                style={styles.calNavBtn}
                activeOpacity={monthOffset > 0 ? 0.8 : 1}
                disabled={monthOffset === 0}
                onPress={() => setMonthOffset((m) => Math.max(0, m - 1))}
              >
                <Icon name="left" size={16} color={monthOffset === 0 ? colors.dividerStrong : colors.text} />
              </TouchableOpacity>
              <Text style={styles.calMonthTitle}>{MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}</Text>
              <TouchableOpacity style={styles.calNavBtn} activeOpacity={0.8} onPress={() => setMonthOffset((m) => Math.min(2, m + 1))}>
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
                const avail = dayAvailability(c.date);
                const isSel = selectedDate && c.date.getTime() === selectedDate.getTime();
                const isClosed = avail.morning === 'closed';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dayCell, styles.dayCellBtn, isSel && styles.dayCellSel]}
                    activeOpacity={isClosed ? 1 : 0.8}
                    disabled={isClosed}
                    onPress={() => pickDay(c.date!)}
                  >
                    <Text style={styles.dayNum}>{c.date.getDate()}</Text>
                    <View style={styles.dayBars}>
                      <View style={[styles.dayBar, { backgroundColor: barColor(avail.morning) }]}>
                        <Text style={styles.dayBarText}>M</Text>
                      </View>
                      <View style={[styles.dayBar, { backgroundColor: barColor(avail.evening) }]}>
                        <Text style={styles.dayBarText}>E</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <Text style={styles.legendME}><Text style={{ fontWeight: '800', color: colors.text }}>M</Text> {t.venueMorning} · <Text style={{ fontWeight: '800', color: colors.text }}>E</Text> {t.venueEvening}</Text>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#34b37a' }]} /><Text style={styles.legendText}>{t.venueSlotFree}</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#e35d6a' }]} /><Text style={styles.legendText}>{t.venueSlotBooked}</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#1e1b2e' }]} /><Text style={styles.legendText}>{t.venueSlotClosed}</Text></View>
            </View>

            {selectedDate && selectedAvail && (
              <View style={styles.slotGrid}>
                {(['Morning', 'Evening'] as Slot[]).map((s) => {
                  const state = s === 'Morning' ? selectedAvail.morning : selectedAvail.evening;
                  const sel = selectedSlot === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.slotBtn, sel ? styles.slotBtnSel : styles.slotBtnUnsel]}
                      activeOpacity={state === 'free' ? 0.85 : 1}
                      disabled={state !== 'free'}
                      onPress={() => setSelectedSlot(s)}
                    >
                      <Text style={styles.slotLabel}>{s === 'Morning' ? t.venueMorning : t.venueEvening}</Text>
                      <Text style={[styles.slotState, { color: state === 'free' ? colors.green : colors.dangerStrong }]}>
                        {state === 'free' ? t.venueSlotFree : state === 'booked' ? t.venueSlotBooked : t.venueSlotClosed}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={[styles.availTextBox, canPay ? styles.crockeryOk : styles.availTextNeutral]}>
              <Text style={styles.availText}>
                {selectedDate
                  ? canPay
                    ? t.venueAvailableFor.replace('{date}', fmtDate(selectedDate)).replace('{slot}', selectedSlot === 'Morning' ? t.venueMorning : t.venueEvening)
                    : t.venuePickFreeSlot
                  : t.venuePickDateToCheck}
              </Text>
            </View>

            {hall.pricingMode === 'perPlate' ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{t.venueCateringPerPlate}</Text>
                  <Text style={styles.priceValue}>₹{(hall.platePrice || 0).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.plateNote}>
                  {t.venuePlateNote.replace('{count}', String(hall.minPlates || 0))}
                </Text>
              </>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t.venueHallRentPerSlot}</Text>
                <Text style={styles.priceValue}>₹{hall.rent.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t.venueTokenToPrebook}</Text>
              <Text style={styles.tokenValue}>₹{hall.token.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.policyBox}>
              <Text style={styles.policyText}>
                {t.venuePolicyText}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.payBtnWrap}
              activeOpacity={canPay ? 0.85 : 1}
              disabled={!canPay}
              onPress={() => selectedDate && selectedSlot && navigation.navigate('TokenPay', { hallId: hall.id, date: fmtDate(selectedDate), slot: selectedSlot })}
            >
              <LinearGradient
                colors={gradients.primaryButton.colors}
                start={gradients.primaryButton.start}
                end={gradients.primaryButton.end}
                style={[styles.payBtn, !canPay && styles.payBtnDisabled]}
              >
                <Text style={styles.payBtnText}>{t.venuePayTokenBtn.replace('{amount}', hall.token.toLocaleString('en-IN'))}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function barColor(state: SlotState): string {
  if (state === 'free') return '#34b37a';
  if (state === 'booked') return '#e35d6a';
  return '#1e1b2e';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  notFound: { padding: 24, color: colors.textSoft },
  cover: { height: 230, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 10, left: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 18, paddingTop: 16, gap: 14 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeText: { fontSize: 12, fontWeight: '700', color: colors.pinkStrong },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: colors.green },
  name: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4, lineHeight: 28 },
  ratingLine: { fontSize: 13, color: colors.textSoft, marginTop: 2 },
  blurb: { fontSize: 13.5, color: '#4b4560', lineHeight: 20 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 18, padding: 14, ...shadow.card },
  addressText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  openMap: { fontSize: 12.5, fontWeight: '700', color: colors.pinkStrong },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  factBox: { width: '47%', backgroundColor: colors.surface, borderRadius: 18, padding: 10, ...shadow.card },
  factLabel: { fontSize: 11, color: colors.textMuted },
  factValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
  crockeryBox: { borderRadius: 14, padding: 12 },
  crockeryOk: { backgroundColor: colors.greenBg },
  crockeryWarn: { backgroundColor: colors.amberBg },
  crockeryText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  rentBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.pink, borderStyle: 'dashed', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  rentBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13.5 },
  amenities: { fontSize: 12.5, color: colors.textSoft, lineHeight: 19 },
  calCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 10, ...shadow.card },
  calTitle: { fontWeight: '700', fontSize: 15, color: colors.text },
  calNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calNavBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  calMonthTitle: { fontFamily: 'Sora', fontWeight: '800', fontSize: 15, color: colors.text },
  weekRow: { flexDirection: 'row' },
  weekLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 10.5, fontWeight: '700', color: colors.textMuted },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 0.85, padding: 2 },
  dayCellBtn: { borderRadius: 10, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: '#fff', overflow: 'hidden' },
  dayCellSel: { borderColor: colors.pink, borderWidth: 2 },
  dayNum: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 13, fontWeight: '800', color: colors.text },
  dayBars: { flexDirection: 'row', height: 14 },
  dayBar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayBarText: { fontSize: 8, fontWeight: '800', color: '#fff' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  legendME: { fontSize: 11.5, color: colors.textSoft },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11.5, color: colors.textSoft },
  slotGrid: { flexDirection: 'row', gap: 8 },
  slotBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 10 },
  slotBtnUnsel: { backgroundColor: colors.bg, borderColor: colors.divider },
  slotBtnSel: { backgroundColor: colors.pinkBg, borderColor: colors.pink },
  slotLabel: { fontSize: 12, color: colors.textSoft },
  slotState: { fontSize: 13.5, fontWeight: '800', marginTop: 2 },
  availTextBox: { borderRadius: 12, padding: 10 },
  availTextNeutral: { backgroundColor: colors.bg },
  availText: { fontSize: 13, fontWeight: '700', color: colors.text },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 13.5, color: colors.textSoft },
  priceValue: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  plateNote: { fontSize: 12, color: colors.textMuted, lineHeight: 17, marginTop: -4 },
  tokenValue: { fontFamily: 'Sora', fontWeight: '800', fontSize: 17, color: colors.maroon },
  policyBox: { backgroundColor: colors.bg, borderRadius: 10, padding: 10 },
  policyText: { fontSize: 12, color: colors.textSoft, lineHeight: 18 },
  payBtnWrap: {},
  payBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.45 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
