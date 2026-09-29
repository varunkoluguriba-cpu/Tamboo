import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import TabBar from '../components/TabBar';
import { useCart } from '../context/CartContext';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function CartScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { groups, updateQty, removeLine, vendorCount, couponCode, applyCoupon, pricing } = useCart();
  const { event } = useEvent();
  const [coupon, setCoupon] = useState('');

  const breakdown = [
    { label: 'Subtotal', value: inr(pricing.subtotal) },
    ...(pricing.discount > 0 ? [{ label: 'Coupon discount', value: `-${inr(pricing.discount)}` }] : []),
    { label: 'Delivery & pickup', value: inr(pricing.delivery) },
    { label: 'Platform fee', value: inr(pricing.platformFee) },
    { label: 'Taxes', value: inr(pricing.tax) },
  ];

  const onApplyCoupon = () => applyCoupon(coupon);

  const empty = groups.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.cart}</Text>

        {empty ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon name="cart" size={28} color={colors.pinkStrong} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySub}>Add items from Search or pick a ready package.</Text>
            <TouchableOpacity style={styles.browseBtnWrap} activeOpacity={0.85} onPress={() => navigation.navigate('Browse', {})}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.browseBtn}>
                <Text style={styles.browseBtnText}>Browse items</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.forLine}>
              For <Text style={styles.forBold}>{event.name}</Text> · {event.date || 'DD/MM/YYYY'} · {event.guests} guests
            </Text>

            {vendorCount > 1 && (
              <View style={styles.multiNote}>
                <Text style={styles.multiNoteText}>
                  Items come from {vendorCount} vendors, so this becomes {vendorCount} separate orders. Each one has its own delivery, status and refunds.
                </Text>
              </View>
            )}

            {groups.map((g) => (
              <View key={g.vendorId} style={styles.groupCard}>
                <View style={styles.groupHead}>
                  <Icon name="package" size={14} color={colors.pink} />
                  <Text style={styles.groupHeadText}>{g.vendorName}</Text>
                </View>
                {g.lines.map((l, i) => (
                  <View key={l.productId} style={[styles.lineRow, i === g.lines.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.lineTop}>
                      <Text style={styles.lineName}>{l.name}</Text>
                      <Text style={styles.lineTotal}>{inr(l.total)}</Text>
                    </View>
                    <View style={styles.lineBottom}>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity style={styles.qtyBtn} activeOpacity={0.8} onPress={() => updateQty(l.productId, l.qty - 1)}>
                          <Icon name="minus" size={14} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{l.qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} activeOpacity={0.8} onPress={() => updateQty(l.productId, l.qty + 1)}>
                          <Icon name="plus" size={14} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => removeLine(l.productId)}>
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                    {l.warn && <Text style={styles.lineWarn}>{l.warn}</Text>}
                  </View>
                ))}
              </View>
            ))}

            <View style={styles.couponRow}>
              <TextInput
                value={coupon}
                onChangeText={setCoupon}
                placeholder="Coupon code"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                style={styles.couponInput}
              />
              <TouchableOpacity style={styles.couponBtn} activeOpacity={0.85} onPress={onApplyCoupon}>
                <Text style={styles.couponBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.couponHint}>
              {couponCode ? `${couponCode} applied — 10% off` : 'Try TAMBOO10 for 10% off'}
            </Text>

            <View style={styles.breakdownCard}>
              {breakdown.map((r) => (
                <View key={r.label} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{r.label}</Text>
                  <Text style={styles.breakdownValue}>{r.value}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total payable</Text>
                <Text style={styles.totalValue}>{inr(pricing.total)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.reviewBtnWrap} activeOpacity={0.85} onPress={() => navigation.navigate('Checkout')}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.reviewBtn}>
                <Text style={styles.reviewBtnText}>Review booking</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <TabBar active="cart" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 14 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 22, padding: 30, alignItems: 'center', gap: 10, ...shadow.card },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSoft, textAlign: 'center' },
  browseBtnWrap: { marginTop: 6 },
  browseBtn: { height: 44, paddingHorizontal: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, fontFamily: 'Sora' },
  forLine: { fontSize: 12.5, color: colors.textSoft },
  forBold: { color: colors.text, fontWeight: '700' },
  multiNote: { backgroundColor: colors.pinkBg, borderRadius: 14, padding: 12 },
  multiNoteText: { color: '#8a1538', fontSize: 12.5, lineHeight: 18 },
  groupCard: { backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden', ...shadow.card },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.divider },
  groupHeadText: { fontSize: 13, fontWeight: '700', color: colors.text },
  lineRow: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 8 },
  lineTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  lineName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  lineTotal: { fontFamily: 'Sora', fontWeight: '700', fontSize: 14, color: colors.text },
  lineBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { minWidth: 34, textAlign: 'center', fontWeight: '700', fontSize: 14, color: colors.text },
  removeText: { color: colors.dangerStrong, fontSize: 12.5, fontWeight: '700' },
  lineWarn: { color: colors.dangerStrong, fontSize: 12, fontWeight: '600' },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: { flex: 1, height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 16, fontSize: 14, color: colors.text, textTransform: 'uppercase' },
  couponBtn: { height: 46, paddingHorizontal: 18, borderRadius: 999, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  couponBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5, fontFamily: 'Sora' },
  couponHint: { fontSize: 11.5, color: colors.textMuted, marginTop: -8, paddingLeft: 6 },
  breakdownCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 8, ...shadow.card },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 13.5, color: colors.textSoft },
  breakdownValue: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontWeight: '700', color: colors.text },
  totalValue: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.maroon },
  reviewBtnWrap: {},
  reviewBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  reviewBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
