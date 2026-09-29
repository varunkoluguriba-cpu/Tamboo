import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useCart } from '../context/CartContext';
import { useEvent } from '../context/EventContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;
type Delivery = 'delivery' | 'pickup';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const POLICY =
  'Full refund if cancelled 7+ days before your event. 50% refund within 3–7 days. No refund inside 72 hours, except vendor-caused issues. Security deposits are refunded within 3 business days of pickup, minus any documented damage.';

export default function CheckoutScreen({ navigation }: Props) {
  const { pricing } = useCart();
  const { event } = useEvent();
  const [delivery, setDelivery] = useState<Delivery>('delivery');
  const [agree, setAgree] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review & confirm</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.eventName}>{event.name}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Event')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={15} color={colors.pink} />
            <Text style={styles.detailText}>
              {event.date || 'DD/MM/YYYY'} · setup {event.setup || '—'} · {event.start || '—'}–{event.end || '—'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="users" size={15} color={colors.pink} />
            <Text style={styles.detailText}>{event.guests} guests · {event.venueType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="pin" size={15} color={colors.pink} />
            <Text style={styles.detailText}>{event.address || 'No address added yet'}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Service</Text>
          <View style={styles.serviceRow}>
            <TouchableOpacity
              style={[styles.serviceBtn, delivery === 'delivery' ? styles.serviceBtnSel : styles.serviceBtnUnsel]}
              activeOpacity={0.85}
              onPress={() => setDelivery('delivery')}
            >
              <Text style={[styles.serviceBtnText, delivery === 'delivery' && styles.serviceBtnTextSel]}>Delivery & pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.serviceBtn, delivery === 'pickup' ? styles.serviceBtnSel : styles.serviceBtnUnsel]}
              activeOpacity={0.85}
              onPress={() => setDelivery('pickup')}
            >
              <Text style={[styles.serviceBtnText, delivery === 'pickup' && styles.serviceBtnTextSel]}>Self pickup</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>{inr(pricing.subtotal)}</Text>
          </View>
          {pricing.discount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Coupon discount</Text>
              <Text style={styles.breakdownValue}>-{inr(pricing.discount)}</Text>
            </View>
          )}
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{delivery === 'delivery' ? 'Delivery & pickup' : 'Self pickup'}</Text>
            <Text style={styles.breakdownValue}>{delivery === 'delivery' ? inr(pricing.delivery) : inr(0)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Platform fee</Text>
            <Text style={styles.breakdownValue}>{inr(pricing.platformFee)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Taxes</Text>
            <Text style={styles.breakdownValue}>{inr(pricing.tax)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total payable</Text>
            <Text style={styles.totalValue}>{inr(delivery === 'delivery' ? pricing.total : pricing.total - pricing.delivery)}</Text>
          </View>
        </View>

        <View style={styles.policyBox}>
          <Text style={styles.policyText}>{POLICY}</Text>
        </View>

        <TouchableOpacity style={styles.agreeRow} activeOpacity={0.85} onPress={() => setAgree((a) => !a)}>
          <View style={[styles.checkbox, agree && styles.checkboxOn]}>
            {agree && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
          </View>
          <Text style={styles.agreeText}>
            I agree to the Cancellation & Refund Policy, the Security Deposit & Damage Policy and the Customer Terms (v1.0).
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.payBtnWrap} activeOpacity={agree ? 0.85 : 1} disabled={!agree} onPress={() => navigation.navigate('Pay')}>
          <LinearGradient
            colors={gradients.primaryButton.colors}
            start={gradients.primaryButton.start}
            end={gradients.primaryButton.end}
            style={[styles.payBtn, !agree && styles.payBtnDisabled]}
          >
            <Text style={styles.payBtnText}>Continue to payment</Text>
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
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 8, ...shadow.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventName: { fontWeight: '700', fontSize: 15, color: colors.text },
  editLink: { color: colors.pinkStrong, fontWeight: '700', fontSize: 12.5 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailText: { fontSize: 13, color: '#4b4560', flex: 1 },
  sectionLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft, marginBottom: 8 },
  serviceRow: { flexDirection: 'row', gap: 8 },
  serviceBtn: { flex: 1, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  serviceBtnUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  serviceBtnSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  serviceBtnText: { fontSize: 13, fontWeight: '700', color: colors.pinkStrong },
  serviceBtnTextSel: { color: '#fff' },
  breakdownCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 8, ...shadow.card },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 13.5, color: colors.textSoft },
  breakdownValue: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontWeight: '700', color: colors.text },
  totalValue: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.maroon },
  policyBox: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.divider, borderRadius: 16, padding: 14 },
  policyText: { fontSize: 12.5, color: '#4b4560', lineHeight: 19 },
  agreeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.dividerStrong, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  agreeText: { fontSize: 12.5, lineHeight: 19, color: colors.text, flex: 1 },
  payBtnWrap: {},
  payBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
