import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useCatalog } from '../context/CatalogContext';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { useToken } from '../context/TokenContext';
import { useLanguage } from '../context/LanguageContext';
import { formatBookingDate } from '../utils/date';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TokenPay'>;

const VISIT_HOURS = 48;

function visitByText(): string {
  const d = new Date(Date.now() + VISIT_HOURS * 3600 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hh = d.getHours() % 12 || 12;
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${d.getDate()} ${months[d.getMonth()]}, ${hh}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

export default function TokenPayScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { getHall } = useCatalog();
  const hall = getHall(route.params.hallId);
  const { user } = useAuth();
  const { event } = useEvent();
  const { startToken } = useToken();
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);

  if (!hall) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>{t.tokenPayHallNotFound}</Text>
      </SafeAreaView>
    );
  }

  const pay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      const order = await api.post<{ orderId: string; amount: number; currency: string; keyId: string }>(
        '/api/payments/create-order',
        { hallId: hall.id, date: route.params.date, slot: route.params.slot },
      );

      let checkoutResult: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
      try {
        checkoutResult = await RazorpayCheckout.open({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: 'Tamboo',
          description: t.tokenPayOrderDescription.replace('{hallName}', hall.name),
          prefill: { name: user?.name, contact: user?.phone },
          theme: { color: colors.maroon },
        });
      } catch (checkoutErr: any) {
        const description: string = checkoutErr?.description || '';
        if (!/cancel/i.test(description)) {
          Alert.alert(t.payNotCompletedTitle, [description, t.payNotCompletedMsg].filter(Boolean).join('\n\n'));
        }
        return;
      }

      const { verified, bookingId, bookingConflict } = await api.post<{ verified: boolean; bookingId?: string; bookingConflict?: boolean }>('/api/payments/verify', {
        razorpay_order_id: checkoutResult.razorpay_order_id,
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_signature: checkoutResult.razorpay_signature,
        hallId: hall.id,
        hallName: hall.name,
        date: route.params.date,
        slot: route.params.slot,
        guests: event.guests,
        partnerId: hall.partnerId,
        customerName: user?.name,
        customerPhone: user?.phone,
      });

      if (!verified) {
        Alert.alert(t.tokenPayVerifyFailedTitle, t.tokenPayVerifyFailedMsg);
        return;
      }

      // Rare race: the slot was taken by someone else in the seconds between the
      // pre-payment check and this one. Payment already succeeded, so the booking is kept
      // (status 'disputed') for manual resolution rather than silently losing track of it —
      // tell the customer plainly instead of sending them to the normal success screen.
      if (bookingConflict) {
        Alert.alert(t.tokenPayConflictTitle, t.tokenPayConflictMsg, [
          { text: t.ok, onPress: () => navigation.goBack() },
        ]);
        return;
      }

      startToken({
        id: bookingId || '',
        hallId: hall.id,
        hallName: hall.name,
        date: route.params.date,
        slot: route.params.slot,
        guests: event.guests,
        amount: hall.token,
        heldAtMs: Date.now(),
        visitHours: VISIT_HOURS,
      });
      navigation.reset({ index: 0, routes: [{ name: 'TokenDone' }] });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t.tryAgain;
      Alert.alert(t.tokenPayFailedTitle, message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.tokenPayHeaderTitle}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.hallName}>{hall.name}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.tokenPaySummaryDate}</Text>
            <Text style={styles.summaryValue}>{formatBookingDate(route.params.date)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.tokenPaySummarySlot}</Text>
            <Text style={styles.summaryValue}>{route.params.slot}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.guests}</Text>
            <Text style={styles.summaryValue}>{event.guests}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.tokenPaySummaryVisitBefore}</Text>
            <Text style={styles.summaryValue}>{visitByText()}</Text>
          </View>
          <View style={styles.tokenRow}>
            <Text style={styles.tokenLabel}>{t.tokenPaySummaryTokenAmount}</Text>
            <Text style={styles.tokenValue}>₹{hall.token.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <Text style={styles.methodsNote}>{t.payMethodsNote}</Text>

        <TouchableOpacity style={styles.agreeRow} activeOpacity={0.85} onPress={() => setAgree((a) => !a)}>
          <View style={[styles.checkbox, agree && styles.checkboxOn]}>
            {agree && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
          </View>
          <Text style={styles.agreeText}>
            {t.tokenPayAgreeText.replace('{hours}', String(VISIT_HOURS))}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.payBtnWrap} activeOpacity={agree ? 0.85 : 1} disabled={!agree || paying} onPress={pay}>
          <LinearGradient
            colors={gradients.primaryButton.colors}
            start={gradients.primaryButton.start}
            end={gradients.primaryButton.end}
            style={[styles.payBtn, (!agree || paying) && styles.payBtnDisabled]}
          >
            {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>{t.tokenPayButtonLabel.replace('{amount}', `₹${hall.token.toLocaleString('en-IN')}`)}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  notFound: { padding: 24, color: colors.textSoft },
  scroll: { padding: 18, paddingTop: 6, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 8, ...shadow.card },
  hallName: { fontSize: 15, fontWeight: '700', color: colors.text },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13.5, color: colors.textSoft },
  summaryValue: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  tokenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8 },
  tokenLabel: { fontWeight: '700', color: colors.text },
  tokenValue: { fontFamily: 'Sora', fontWeight: '800', fontSize: 20, color: colors.maroon },
  methodsNote: { fontSize: 13, color: colors.textSoft, textAlign: 'center' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pink },
  methodLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  methodSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  agreeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.dividerStrong, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  agreeText: { fontSize: 12.5, lineHeight: 19, color: colors.text, flex: 1 },
  payBtnWrap: {},
  payBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
