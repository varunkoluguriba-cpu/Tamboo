import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useCatalog } from '../context/CatalogContext';
import { useToken, msLeft, formatHoursLeft } from '../context/TokenContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiError } from '../api/client';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Token'>;

const VISIT_DAY_KEYS = ['today', 'tomorrow', 'dayAfter'] as const;
const VISIT_TIME_KEYS = ['morning', 'afternoon', 'evening', 'night'] as const;

export default function TokenScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { token, markVisited, cancelToken, notBookingToken, disputeToken } = useToken();
  const [busy, setBusy] = useState(false);
  const { getHall } = useCatalog();
  const hall = token ? getHall(token.hallId) : undefined;
  const [, forceTick] = useState(0);
  const [visitDay, setVisitDay] = useState<string | null>(null);
  const [visitTime, setVisitTime] = useState<string | null>(null);

  const VISIT_DAY_LABELS: Record<string, string> = {
    today: t.tokenVisitDayToday,
    tomorrow: t.tokenVisitDayTomorrow,
    dayAfter: t.tokenVisitDayAfter,
  };
  const VISIT_TIME_LABELS: Record<string, string> = {
    morning: t.tokenVisitTimeMorning,
    afternoon: t.tokenVisitTimeAfternoon,
    evening: t.tokenVisitTimeEvening,
    night: t.tokenVisitTimeNight,
  };

  const REFUND_POLICY = [
    t.tokenRefundFull2Hr,
    t.tokenRefund80Visit,
    t.tokenRefundExpireNoVisit,
    t.tokenRefundHallCancels,
    t.tokenRefundMismatch,
  ];

  const callHall = () => {
    if (hall?.phone) Linking.openURL(`tel:${hall.phone}`);
  };

  const openDirections = () => {
    if (hall?.address) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hall.address)}`);
    }
  };

  const raiseDispute = () => {
    Alert.alert(t.tokenHallMismatch, t.tokenRefundMismatch, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirm,
        onPress: async () => {
          try {
            await disputeToken();
            Alert.alert(t.done, t.tokenRefundMismatch);
          } catch (e) {
            Alert.alert(t.tryAgain, e instanceof ApiError ? e.message : t.tryAgain);
          }
        },
      },
    ]);
  };

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
          <Text style={styles.headerTitle}>{t.tokenHeaderTitle}</Text>
        </View>
        <Text style={styles.notFound}>{t.tokenNoActiveBooking}</Text>
      </SafeAreaView>
    );
  }

  const left = formatHoursLeft(msLeft(token));
  const expired = msLeft(token) <= 0;
  const isAwaitingAdvance = token.status === 'awaiting_advance';
  const isConfirmed = token.status === 'confirmed';
  const advanceDeadlineText = token.advanceDeadlineAtMs
    ? new Date(token.advanceDeadlineAtMs).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  const cancel = () => {
    Alert.alert(t.tokenCancelTitle, t.tokenCancelMsg, [
      { text: t.tokenKeepIt, style: 'cancel' },
      {
        text: t.tokenCancelConfirmBtn,
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await cancelToken();
            navigation.reset({ index: 0, routes: [{ name: 'Bookings' }] });
          } catch (e) {
            Alert.alert(t.tryAgain, e instanceof ApiError ? e.message : t.tryAgain);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const notBooking = () => {
    Alert.alert(t.tokenNotBookingTitle, t.tokenNotBookingMsg, [
      { text: t.tokenKeepIt, style: 'cancel' },
      {
        text: t.confirm,
        onPress: async () => {
          setBusy(true);
          try {
            await notBookingToken();
            navigation.reset({ index: 0, routes: [{ name: 'Bookings' }] });
          } catch (e) {
            Alert.alert(t.tryAgain, e instanceof ApiError ? e.message : t.tryAgain);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const saveVisit = () => {
    if (!visitDay || !visitTime) {
      Alert.alert(t.tokenPickDayTimeTitle, t.tokenPickDayTimeMsg);
      return;
    }
    Alert.alert(
      t.tokenVisitScheduledTitle,
      t.tokenVisitScheduledMsg.replace('{day}', VISIT_DAY_LABELS[visitDay]).replace('{time}', VISIT_TIME_LABELS[visitTime]),
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={goBackOrHome}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.tokenHeaderTitle}</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={[styles.pill, isConfirmed ? styles.pillGreen : isAwaitingAdvance ? styles.pillWarn : token.visited ? styles.pillPurple : expired ? styles.pillDanger : styles.pillWarn]}>
            <Text style={[styles.pillText, isConfirmed ? styles.pillTextGreen : isAwaitingAdvance ? styles.pillTextWarn : token.visited ? styles.pillTextPurple : expired ? styles.pillTextDanger : styles.pillTextWarn]}>
              {isConfirmed ? t.tokenStatusConfirmed : isAwaitingAdvance ? t.tokenStatusAwaitingAdvance : token.visited ? t.tokenStatusVisited : expired ? t.tokenStatusExpired : t.tokenStatusHeld}
            </Text>
          </View>
          <Text style={styles.hallName}>{token.hallName}</Text>
          <Text style={styles.metaLine}>{token.date} · {token.slot} · {token.guests} {t.tokenGuestsSuffix}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>{t.tokenAmountPaidLabel}</Text>
            <Text style={styles.amountValue}>₹{token.amount.toLocaleString('en-IN')}</Text>
          </View>
          {!token.visited && !expired && (
            <>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>{t.tokenVisitBeforeLabel}</Text>
                <Text style={styles.amountValue}>{t.tokenVisitWithinTemplate.replace('{hours}', String(token.visitHours))}</Text>
              </View>
              <Text style={styles.leftText}>{t.tokenLeftSuffix.replace('{time}', left)}</Text>
            </>
          )}
          <Text style={styles.note}>
            {expired ? t.tokenNoteExpired : t.tokenNoteActive}
          </Text>
        </View>

        {!token.visited && !expired && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.tokenScheduleVisitTitle}</Text>
            <View style={styles.chipRow}>
              {VISIT_DAY_KEYS.map((d) => (
                <TouchableOpacity key={d} activeOpacity={0.85} onPress={() => setVisitDay(d)} style={[styles.chip, visitDay === d ? styles.chipSel : styles.chipUnsel]}>
                  <Text style={[styles.chipText, visitDay === d && styles.chipTextSel]}>{VISIT_DAY_LABELS[d]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.chipRow}>
              {VISIT_TIME_KEYS.map((tm) => (
                <TouchableOpacity key={tm} activeOpacity={0.85} onPress={() => setVisitTime(tm)} style={[styles.chip, visitTime === tm ? styles.chipSel : styles.chipUnsel]}>
                  <Text style={[styles.chipText, visitTime === tm && styles.chipTextSel]}>{VISIT_TIME_LABELS[tm]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={saveVisit}>
              <Text style={styles.saveBtnText}>{t.tokenSaveVisitTime}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!token.visited && !expired && (
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={cancel} disabled={busy}>
            <Text style={styles.outlineBtnText}>{t.tokenCancelFullRefund.replace('{time}', left)}</Text>
          </TouchableOpacity>
        )}

        {__DEV__ && !token.visited && !expired && (
          <TouchableOpacity style={styles.demoBtn} activeOpacity={0.85} onPress={markVisited}>
            <Text style={styles.demoBtnText}>{t.tokenDemoMarkVisited}</Text>
          </TouchableOpacity>
        )}

        {token.visited && !isAwaitingAdvance && !isConfirmed && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.tokenDecidedAfterVisit}</Text>
            <Text style={styles.cardSub}>{t.tokenDecidedAfterVisitSub}</Text>
            <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={notBooking} disabled={busy}>
              <Text style={styles.outlineBtnText}>{t.tokenNotBooking80}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlinePinkBtn} activeOpacity={0.85} onPress={raiseDispute}>
              <Text style={styles.outlinePinkBtnText}>{t.tokenHallMismatch}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAwaitingAdvance && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.tokenAdvanceTitle}</Text>
            <Text style={styles.cardSub}>
              {t.tokenAdvanceMsg
                .replace('{rent}', (token.finalRent || 0).toLocaleString('en-IN'))
                .replace('{amount}', (token.advanceAmount || 0).toLocaleString('en-IN'))
                .replace('{deadline}', advanceDeadlineText)}
            </Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('AdvancePay')}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{t.tokenPayAdvanceBtn.replace('{amount}', `₹${(token.advanceAmount || 0).toLocaleString('en-IN')}`)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {isConfirmed && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.tokenConfirmedTitle}</Text>
            <Text style={styles.cardSub}>{t.tokenConfirmedMsg.replace('{rent}', (token.finalRent || 0).toLocaleString('en-IN'))}</Text>
          </View>
        )}

        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>{t.tokenRefundPolicyTitle}</Text>
          {REFUND_POLICY.map((r, i) => (
            <Text key={i} style={styles.policyLine}>• {r}</Text>
          ))}
          <Text style={styles.policyFooter}>{t.tokenRefundPolicyFooter}</Text>
        </View>

        <View style={styles.grid2}>
          <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} activeOpacity={0.85} onPress={openDirections}>
            <Icon name="pin" size={15} color={colors.text} />
            <Text style={styles.outlineBtnText}>{t.directions}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} activeOpacity={0.85} onPress={callHall}>
            <Text style={styles.outlineBtnText}>{t.tokenCallHall}</Text>
          </TouchableOpacity>
        </View>

        {!hall.hasCrockery && (
          <TouchableOpacity style={styles.rentBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Browse', { category: 'Crockery & Vessels' })}>
            <Text style={styles.rentBtnText}>{t.tokenNoCrockeryRent}</Text>
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
  pillGreen: { backgroundColor: '#e8f7f0' },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  pillTextWarn: { color: colors.amber },
  pillTextPurple: { color: '#6d28d9' },
  pillTextDanger: { color: colors.dangerStrong },
  pillTextGreen: { color: '#047857' },
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
