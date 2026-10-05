import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Pay'>;
type PayMode = 'full' | 'advance';
type Method = 'upi' | 'card' | 'netbanking';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const HOLD_SECONDS = 15 * 60;

export default function PayScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { event } = useEvent();
  const { pricing, groups, deliveryMode, clearCart } = useCart();
  const { t } = useLanguage();

  const METHODS: Array<{ key: Method; label: string; sub: string }> = [
    { key: 'upi', label: t.payMethodUpi, sub: t.payMethodUpiSub },
    { key: 'card', label: t.payMethodCard, sub: t.payMethodCardSub },
    { key: 'netbanking', label: t.payMethodNetbanking, sub: t.payMethodNetbankingSub },
  ];
  const [payMode, setPayMode] = useState<PayMode>('full');
  const [method, setMethod] = useState<Method>('upi');
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const due = payMode === 'full' ? pricing.total : Math.round(pricing.total * 0.3);
  const perGroupDelivery = deliveryMode === 'delivery' ? 300 : 0;

  const pay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      const order = await api.post<{ orderId: string; amount: number; currency: string; keyId: string }>(
        '/api/payments/create-order',
        { amount: due },
      );

      let checkoutResult: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
      try {
        checkoutResult = await RazorpayCheckout.open({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: 'Tamboo',
          description: `${groups.length} vendor${groups.length > 1 ? 's' : ''} · rental order`,
          prefill: { name: user?.name, contact: user?.phone },
          theme: { color: colors.maroon },
        });
      } catch (checkoutErr: any) {
        const description: string = checkoutErr?.description || '';
        if (!/cancel/i.test(description)) {
          Alert.alert(t.payPaymentFailedTitle, description || t.payPaymentFailedDefaultMsg);
        }
        return;
      }

      const res = await api.post<{ verified: boolean; orders?: Array<{ id: string; code: string; vendor: string; total: number }> }>(
        '/api/payments/verify',
        {
          razorpay_order_id: checkoutResult.razorpay_order_id,
          razorpay_payment_id: checkoutResult.razorpay_payment_id,
          razorpay_signature: checkoutResult.razorpay_signature,
          cart: {
            payMode,
            due,
            customerName: user?.name,
            customerPhone: user?.phone,
            eventType: event.venueType,
            eventName: event.name,
            dateTxt: event.date,
            address: event.address,
            guests: parseInt(event.guests, 10) || 0,
            groups: groups.map((g) => ({
              vendorId: g.vendorId,
              vendorName: g.vendorName,
              subtotal: g.subtotal,
              deliveryFee: perGroupDelivery,
              lines: g.lines.map((l) => ({ name: l.name, qty: l.qty, unitPrice: l.unitPrice })),
            })),
          },
        },
      );

      if (!res.verified) {
        Alert.alert(t.payVerifyFailedTitle, t.payVerifyFailedMsg);
        return;
      }

      const orders = (res.orders || []).map((o) => ({ id: o.code, vendor: o.vendor, total: o.total }));
      clearCart();
      navigation.reset({ index: 0, routes: [{ name: 'Confirm', params: { orders } }] });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t.tryAgain;
      Alert.alert(t.payPaymentFailedTitle, message);
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
          <Text style={styles.headerTitle}>{t.payHeaderTitle}</Text>
        </View>

        <View style={styles.holdBanner}>
          <Icon name="clock" size={16} color={colors.amber} />
          <Text style={styles.holdText}>{t.payHoldText}</Text>
          <Text style={styles.holdTime}>{mm}:{ss}</Text>
        </View>

        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.dueCard}>
          <Text style={styles.dueLabel}>{payMode === 'full' ? t.payAmountDueNow : t.payAdvanceDueNow}</Text>
          <Text style={styles.dueAmount}>{inr(due)}</Text>
          <Text style={styles.dueSub}>{t.payOfTotal.replace('{param}', inr(pricing.total))}</Text>
        </LinearGradient>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, payMode === 'full' ? styles.modeBtnSel : styles.modeBtnUnsel]}
            activeOpacity={0.85}
            onPress={() => setPayMode('full')}
          >
            <Text style={[styles.modeBtnText, payMode === 'full' && styles.modeBtnTextSel]}>{t.payInFull}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, payMode === 'advance' ? styles.modeBtnSel : styles.modeBtnUnsel]}
            activeOpacity={0.85}
            onPress={() => setPayMode('advance')}
          >
            <Text style={[styles.modeBtnText, payMode === 'advance' && styles.modeBtnTextSel]}>{t.payAdvance30}</Text>
          </TouchableOpacity>
        </View>

        {payMode === 'advance' && (
          <Text style={styles.advanceNote}>
            {t.payAdvanceNote.replace('{param}', inr(pricing.total - due))}
          </Text>
        )}

        <View style={{ gap: 8 }}>
          {METHODS.map((m) => {
            const sel = method === m.key;
            return (
              <TouchableOpacity key={m.key} style={[styles.methodRow, { borderColor: sel ? colors.pink : colors.divider }]} activeOpacity={0.85} onPress={() => setMethod(m.key)}>
                <View style={[styles.radio, { borderColor: sel ? colors.pink : colors.dividerStrong }]}>
                  {sel && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodSub}>{m.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.disclaimer}>{t.payDisclaimer}</Text>

        <TouchableOpacity style={styles.payBtnWrap} activeOpacity={paying ? 1 : 0.85} disabled={paying} onPress={pay}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={[styles.payBtn, paying && styles.payBtnDisabled]}>
            {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>{t.payPayAmount.replace('{param}', inr(due))}</Text>}
          </LinearGradient>
        </TouchableOpacity>
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
  holdBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.amberBg, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  holdText: { flex: 1, color: colors.amber, fontSize: 12.5, fontWeight: '600' },
  holdTime: { fontFamily: 'Sora', color: colors.amber, fontSize: 15, fontWeight: '800' },
  dueCard: { borderRadius: 22, padding: 18 },
  dueLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  dueAmount: { fontFamily: 'Sora', color: '#fff', fontSize: 30, fontWeight: '800', marginVertical: 4 },
  dueSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  modeBtnUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  modeBtnSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: colors.pinkStrong },
  modeBtnTextSel: { color: '#fff' },
  advanceNote: { fontSize: 11.5, color: colors.textSoft, lineHeight: 17 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1.5, padding: 14 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pink },
  methodLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  methodSub: { fontSize: 12, color: colors.textSoft, marginTop: 1 },
  disclaimer: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
  payBtnWrap: {},
  payBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
