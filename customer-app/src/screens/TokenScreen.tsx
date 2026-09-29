import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { getHall } from '../data/catalog';
import { useToken, msLeft, formatHoursLeft } from '../context/TokenContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Token'>;

const VISIT_DAYS = ['Today', 'Tomorrow', 'Day after'];
const VISIT_TIMES = ['Morning', 'Afternoon', 'Evening', 'Night'];

const REFUND_POLICY = [
  'Cancel within 2 hours of paying: full refund, no questions asked.',
  "Visit the hall and decide not to book: 80% of the token is refunded.",
  "Don't visit within the window: the token expires and is not refunded.",
  'If the hall cancels on you for any reason: full refund, always.',
  "Hall didn't match the listing: raise it here and we'll review with the vendor.",
];

function soon() {
  Alert.alert('Coming soon', 'This is being built next.');
}

export default function TokenScreen({ navigation }: Props) {
  const { token, markVisited, clearToken } = useToken();
  const hall = token ? getHall(token.hallId) : undefined;
  const [, forceTick] = useState(0);
  const [visitDay, setVisitDay] = useState<string | null>(null);
  const [visitTime, setVisitTime] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const goBackOrHome = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  if (!token || !hall) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={goBackOrHome}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pre-booking</Text>
        </View>
        <Text style={styles.notFound}>No active hall pre-booking.</Text>
      </SafeAreaView>
    );
  }

  const left = formatHoursLeft(msLeft(token));
  const expired = msLeft(token) <= 0;

  const cancel = () => {
    Alert.alert('Cancel pre-booking?', 'Your token will be fully refunded.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel & refund',
        style: 'destructive',
        onPress: () => {
          clearToken();
          navigation.reset({ index: 0, routes: [{ name: 'Bookings' }] });
        },
      },
    ]);
  };

  const notBooking = () => {
    Alert.alert('Not booking this hall?', "You'll get 80% of the token back.", [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          clearToken();
          navigation.reset({ index: 0, routes: [{ name: 'Bookings' }] });
        },
      },
    ]);
  };

  const saveVisit = () => {
    if (!visitDay || !visitTime) {
      Alert.alert('Pick a day and time', 'Choose when you plan to visit the hall.');
      return;
    }
    Alert.alert('Visit scheduled', `${visitDay}, ${visitTime}. We'll remind you by SMS & WhatsApp.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={goBackOrHome}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pre-booking</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={[styles.pill, token.visited ? styles.pillPurple : expired ? styles.pillDanger : styles.pillWarn]}>
            <Text style={[styles.pillText, token.visited ? styles.pillTextPurple : expired ? styles.pillTextDanger : styles.pillTextWarn]}>
              {token.visited ? 'VISITED' : expired ? 'EXPIRED' : 'HELD'}
            </Text>
          </View>
          <Text style={styles.hallName}>{token.hallName}</Text>
          <Text style={styles.metaLine}>{token.date} · {token.slot} · {token.guests} guests</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Token paid</Text>
            <Text style={styles.amountValue}>₹{token.amount.toLocaleString('en-IN')}</Text>
          </View>
          {!token.visited && !expired && (
            <>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Visit before</Text>
                <Text style={styles.amountValue}>within {token.visitHours}h of paying</Text>
              </View>
              <Text style={styles.leftText}>{left} left</Text>
            </>
          )}
          <Text style={styles.note}>
            {expired
              ? 'This token has expired and was not refunded, since the hall wasn’t visited in time.'
              : 'Visit the hall in person to see it and lock in the final rent. The token is adjusted into your rent.'}
          </Text>
        </View>

        {!token.visited && !expired && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Schedule your visit</Text>
            <View style={styles.chipRow}>
              {VISIT_DAYS.map((d) => (
                <TouchableOpacity key={d} activeOpacity={0.85} onPress={() => setVisitDay(d)} style={[styles.chip, visitDay === d ? styles.chipSel : styles.chipUnsel]}>
                  <Text style={[styles.chipText, visitDay === d && styles.chipTextSel]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.chipRow}>
              {VISIT_TIMES.map((t) => (
                <TouchableOpacity key={t} activeOpacity={0.85} onPress={() => setVisitTime(t)} style={[styles.chip, visitTime === t ? styles.chipSel : styles.chipUnsel]}>
                  <Text style={[styles.chipText, visitTime === t && styles.chipTextSel]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={saveVisit}>
              <Text style={styles.saveBtnText}>Save visit time</Text>
            </TouchableOpacity>
          </View>
        )}

        {!token.visited && !expired && (
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={cancel}>
            <Text style={styles.outlineBtnText}>Cancel · full refund ({left})</Text>
          </TouchableOpacity>
        )}

        {!token.visited && !expired && (
          <TouchableOpacity style={styles.demoBtn} activeOpacity={0.85} onPress={markVisited}>
            <Text style={styles.demoBtnText}>Demo: mark as visited</Text>
          </TouchableOpacity>
        )}

        {token.visited && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Decided after your visit?</Text>
            <Text style={styles.cardSub}>If you're booking, the hall owner will confirm the final rent. Otherwise:</Text>
            <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={notBooking}>
              <Text style={styles.outlineBtnText}>Not booking · get 80% back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlinePinkBtn} activeOpacity={0.85} onPress={soon}>
              <Text style={styles.outlinePinkBtnText}>Hall didn't match the listing</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Token refund policy</Text>
          {REFUND_POLICY.map((r) => (
            <Text key={r} style={styles.policyLine}>• {r}</Text>
          ))}
          <Text style={styles.policyFooter}>
            Refunds reach your UPI, card or bank in 5–7 days. We remind you by SMS & WhatsApp 24 hours and 4 hours before your token
            expires.
          </Text>
        </View>

        <View style={styles.grid2}>
          <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} activeOpacity={0.85} onPress={soon}>
            <Icon name="pin" size={15} color={colors.text} />
            <Text style={styles.outlineBtnText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} activeOpacity={0.85} onPress={soon}>
            <Text style={styles.outlineBtnText}>Call hall</Text>
          </TouchableOpacity>
        </View>

        {!hall.hasCrockery && (
          <TouchableOpacity style={styles.rentBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Browse', { category: 'Crockery & Vessels' })}>
            <Text style={styles.rentBtnText}>This hall has no crockery. Rent from a tent house</Text>
          </TouchableOpacity>
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
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  notFound: { padding: 24, color: colors.textSoft, textAlign: 'center', marginTop: 40 },
  statusCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 8, ...shadow.card },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillWarn: { backgroundColor: colors.amberBg },
  pillPurple: { backgroundColor: colors.purpleBg },
  pillDanger: { backgroundColor: colors.dangerBg },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  pillTextWarn: { color: colors.amber },
  pillTextPurple: { color: '#6d28d9' },
  pillTextDanger: { color: colors.dangerStrong },
  hallName: { fontSize: 16, fontWeight: '700', color: colors.text },
  metaLine: { fontSize: 13, color: colors.textSoft },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8 },
  amountLabel: { fontSize: 13.5, color: colors.textSoft },
  amountValue: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  leftText: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.amber },
  note: { fontSize: 12.5, color: '#4b4560', lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 10, ...shadow.card },
  cardTitle: { fontWeight: '700', fontSize: 15, color: colors.text },
  cardSub: { fontSize: 12.5, color: colors.textSoft },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  saveBtn: { height: 46, borderRadius: 999, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14.5, fontFamily: 'Sora' },
  outlineBtn: { flexDirection: 'row', gap: 6, height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { color: colors.text, fontWeight: '700', fontSize: 13.5 },
  outlinePinkBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: '#f6c9d7', backgroundColor: '#fffafc', alignItems: 'center', justifyContent: 'center' },
  outlinePinkBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13.5 },
  demoBtn: { height: 40, borderRadius: 999, borderWidth: 1.5, borderColor: colors.dividerStrong, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  demoBtnText: { color: colors.textSoft, fontWeight: '600', fontSize: 12.5 },
  policyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 5 },
  policyTitle: { fontWeight: '700', fontSize: 13.5, color: colors.text },
  policyLine: { fontSize: 12.5, color: '#4b4560', lineHeight: 18 },
  policyFooter: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  grid2: { flexDirection: 'row', gap: 8 },
  rentBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.pink, borderStyle: 'dashed', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  rentBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13 },
});
