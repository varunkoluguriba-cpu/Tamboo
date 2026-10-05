import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdvancePay'>;

export default function AdvancePayScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { token, refreshToken } = useToken();
  const [paying, setPaying] = useState(false);

  if (!token || !token.advanceAmount) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>{t.advancePayNotFound}</Text>
      </SafeAreaView>
    );
  }

  const deadlineText = token.advanceDeadlineAtMs
    ? new Date(token.advanceDeadlineAtMs).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  const pay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      const order = await api.post<{ orderId: string; amount: number; currency: string; keyId: string }>(
        '/api/payments/create-advance-order',
        { bookingId: token.id },
      );

      let checkoutResult: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
      try {
        checkoutResult = await RazorpayCheckout.open({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: 'Tamboo',
          description: t.advancePayOrderDescription.replace('{hallName}', token.hallName),
          prefill: { name: user?.name, contact: user?.phone },
          theme: { color: colors.maroon },
        });
      } catch (checkoutErr: any) {
        const description: string = checkoutErr?.description || '';
        if (!/cancel/i.test(description)) {
          Alert.alert(t.advancePayFailedTitle, description || t.advancePayFailedDefaultMsg);
        }
        return;
      }

      const { verified } = await api.post<{ verified: boolean; bookingId?: string }>('/api/payments/verify', {
        razorpay_order_id: checkoutResult.razorpay_order_id,
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_signature: checkoutResult.razorpay_signature,
        advanceForBookingId: token.id,
      });

      if (!verified) {
        Alert.alert(t.advancePayVerifyFailedTitle, t.advancePayVerifyFailedMsg);
        return;
      }

      await refreshToken();
      navigation.goBack();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t.tryAgain;
      Alert.alert(t.advancePayFailedTitle, message);
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
          <Text style={styles.headerTitle}>{t.advancePayHeaderTitle}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.hallName}>{token.hallName}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.advancePaySummaryRent}</Text>
            <Text style={styles.summaryValue}>₹{(token.finalRent || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.advancePaySummaryDeadline}</Text>
            <Text style={styles.summaryValue}>{deadlineText}</Text>
          </View>
          <View style={styles.tokenRow}>
            <Text style={styles.tokenLabel}>{t.advancePaySummaryAmount.replace('{pct}', String(token.advancePct || 25))}</Text>
            <Text style={styles.tokenValue}>₹{token.advanceAmount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <Text style={styles.note}>{t.advancePayNote}</Text>

        <TouchableOpacity style={styles.payBtnWrap} activeOpacity={0.85} disabled={paying} onPress={pay}>
          <LinearGradient
            colors={gradients.primaryButton.colors}
            start={gradients.primaryButton.start}
            end={gradients.primaryButton.end}
            style={[styles.payBtn, paying && styles.payBtnDisabled]}
          >
            {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>{t.advancePayButtonLabel.replace('{amount}', `₹${token.advanceAmount.toLocaleString('en-IN')}`)}</Text>}
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
  note: { fontSize: 12.5, color: colors.textSoft, lineHeight: 19 },
  payBtnWrap: {},
  payBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
