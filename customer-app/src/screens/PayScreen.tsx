import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useCart } from '../context/CartContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Pay'>;
type PayMode = 'full' | 'advance';
type Method = 'upi' | 'card' | 'netbanking';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const HOLD_SECONDS = 15 * 60;

const METHODS: Array<{ key: Method; label: string; sub: string }> = [
  { key: 'upi', label: 'UPI', sub: 'Google Pay, PhonePe, Paytm and more' },
  { key: 'card', label: 'Credit / Debit card', sub: 'Visa, Mastercard, RuPay' },
  { key: 'netbanking', label: 'Netbanking', sub: 'All major Indian banks' },
];

export default function PayScreen({ navigation }: Props) {
  const { pricing, groups, clearCart } = useCart();
  const [payMode, setPayMode] = useState<PayMode>('full');
  const [method, setMethod] = useState<Method>('upi');
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const due = payMode === 'full' ? pricing.total : Math.round(pricing.total * 0.3);

  const paySuccess = () => {
    const base = 'TB-' + (250100 + Math.floor(Math.random() * 900));
    const orders = groups.map((g, i) => ({
      id: groups.length > 1 ? `${base}-${String.fromCharCode(65 + i)}` : base,
      vendor: g.vendorName,
      total: g.subtotal,
    }));
    clearCart();
    navigation.reset({ index: 0, routes: [{ name: 'Confirm', params: { orders } }] });
  };

  const payFail = () => {
    Alert.alert('Payment failed', 'The payment could not be completed. Your items are still held — please try again.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
        </View>

        <View style={styles.holdBanner}>
          <Icon name="clock" size={16} color={colors.amber} />
          <Text style={styles.holdText}>Your items are held for you</Text>
          <Text style={styles.holdTime}>{mm}:{ss}</Text>
        </View>

        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.dueCard}>
          <Text style={styles.dueLabel}>{payMode === 'full' ? 'Amount due now' : 'Advance due now (30%)'}</Text>
          <Text style={styles.dueAmount}>{inr(due)}</Text>
          <Text style={styles.dueSub}>of {inr(pricing.total)} total</Text>
        </LinearGradient>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, payMode === 'full' ? styles.modeBtnSel : styles.modeBtnUnsel]}
            activeOpacity={0.85}
            onPress={() => setPayMode('full')}
          >
            <Text style={[styles.modeBtnText, payMode === 'full' && styles.modeBtnTextSel]}>Pay in full</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, payMode === 'advance' ? styles.modeBtnSel : styles.modeBtnUnsel]}
            activeOpacity={0.85}
            onPress={() => setPayMode('advance')}
          >
            <Text style={[styles.modeBtnText, payMode === 'advance' && styles.modeBtnTextSel]}>Pay 30% advance</Text>
          </TouchableOpacity>
        </View>

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

        <Text style={styles.disclaimer}>Payments are handled by a secure payment provider. Tamboo never stores your card details.</Text>

        <TouchableOpacity style={styles.payBtnWrap} activeOpacity={0.85} onPress={paySuccess}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.payBtn}>
            <Text style={styles.payBtnText}>Pay {inr(due)}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.failBtn} activeOpacity={0.85} onPress={payFail}>
          <Text style={styles.failBtnText}>Demo: simulate a failed payment</Text>
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
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1.5, padding: 14 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pink },
  methodLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  methodSub: { fontSize: 12, color: colors.textSoft, marginTop: 1 },
  disclaimer: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
  payBtnWrap: {},
  payBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
  failBtn: { height: 44, borderRadius: 999, borderWidth: 1.5, borderColor: colors.dividerStrong, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  failBtnText: { color: colors.textSoft, fontWeight: '600', fontSize: 13 },
});
