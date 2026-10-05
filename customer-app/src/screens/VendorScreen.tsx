import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { reviewsByVendor, availBadge } from '../data/catalog';
import { useCatalog } from '../context/CatalogContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Vendor'>;

export default function VendorScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { getVendor, productsByVendor } = useCatalog();
  const vendor = getVendor(route.params.id);
  const items = productsByVendor(route.params.id);
  const reviews = reviewsByVendor(route.params.id);

  if (!vendor) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>{t.vendorNotFound}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.cover}>
          <View style={styles.coverPlaceholder}>
            <Icon name="tent" size={40} color={colors.pinkStrong} strokeWidth={1.3} />
          </View>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.headRow}>
              <View style={styles.logo}>
                <Icon name="tent" size={26} color={colors.pinkStrong} strokeWidth={1.5} />
              </View>
              <View style={{ minWidth: 0, flex: 1 }}>
                <Text style={styles.name}>{vendor.name}</Text>
                <Text style={styles.sub}>{vendor.area}, {vendor.city} · {vendor.hours}</Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              {vendor.verified && (
                <View style={[styles.badge, styles.badgeGreen]}>
                  <Text style={styles.badgeGreenText}>✓ {t.vendorVerifiedBusiness}</Text>
                </View>
              )}
              <View style={[styles.badge, styles.badgePink]}>
                <Text style={styles.badgePinkText}>★ {vendor.rating} · {vendor.reviews} {t.vendorReviewsLabel}</Text>
              </View>
              <View style={[styles.badge, styles.badgeGrey]}>
                <Text style={styles.badgeGreyText}>{vendor.years} {t.vendorSelfDeclared}</Text>
              </View>
            </View>

            <Text style={styles.blurb}>{vendor.blurb}</Text>

            <View style={styles.statGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t.vendorDeliveryLabel}</Text>
                <Text style={styles.statValue}>{vendor.delivery}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t.vendorSetupLabel}</Text>
                <Text style={styles.statValue}>{vendor.setup}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t.vendorMinOrderLabel}</Text>
                <Text style={styles.statValue}>{vendor.minOrder}</Text>
              </View>
            </View>

            <View style={styles.servesRow}>
              <Text style={styles.servesLabel}>{t.vendorServesLabel}</Text>
              {vendor.areas.map((a) => (
                <View key={a} style={styles.areaChip}>
                  <Text style={styles.areaChipText}>{a}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.chatBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Chat', { peerName: vendor.name })}>
                <Text style={styles.chatBtnText}>{t.vendorChat}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quoteBtnWrap} activeOpacity={0.85} onPress={() => Alert.alert(t.comingSoon, t.vendorComingSoonMsg)}>
                <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.quoteBtn}>
                  <Text style={styles.quoteBtnText}>{t.vendorRequestQuote}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t.vendorRentalItemsTitle}</Text>
          <View style={{ gap: 8 }}>
            {items.map((p) => {
              const badge = availBadge(p);
              return (
                <TouchableOpacity key={p.id} style={styles.itemRow} activeOpacity={0.85} onPress={() => navigation.push('Product', { id: p.id })}>
                  <View style={styles.itemPhoto}>
                    <Icon name="package" size={20} color={colors.pinkStrong} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.itemName}>{p.name}</Text>
                    <Text style={styles.itemPrice}>{p.isInstant ? `₹${p.price.toLocaleString('en-IN')} ${p.unit}` : t.vendorPriceOnRequest}</Text>
                  </View>
                  <View style={[styles.itemBadge, badge.ok ? styles.chipOk : styles.chipWarn]}>
                    <Text style={[styles.itemBadgeText, badge.ok ? styles.chipOkText : styles.chipWarnText]}>{badge.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>{t.vendorReviewsTitle}</Text>
          <View style={{ gap: 8 }}>
            {reviews.map((r, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewHead}>
                  <Text style={styles.reviewBy}>{r.by}</Text>
                  <Text style={styles.reviewStars}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</Text>
                </View>
                <Text style={styles.reviewText}>{r.text}</Text>
                <Text style={styles.reviewDate}>{r.date} · {t.vendorVerifiedBooking}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  notFound: { padding: 24, color: colors.textSoft },
  cover: { height: 200, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 8, left: 18, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 18, marginTop: -30, gap: 14 },
  card: { backgroundColor: colors.surface, borderRadius: 22, padding: 16, gap: 10, ...shadow.card },
  headRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  logo: { width: 60, height: 60, borderRadius: 16, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12.5, color: colors.textSoft },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  badgeGreen: { backgroundColor: colors.greenBg },
  badgeGreenText: { color: colors.green, fontSize: 11.5, fontWeight: '700' },
  badgePink: { backgroundColor: colors.pinkBg },
  badgePinkText: { color: colors.pinkStrong, fontSize: 11.5, fontWeight: '700' },
  badgeGrey: { backgroundColor: colors.purpleBg },
  badgeGreyText: { color: '#4b4560', fontSize: 11.5, fontWeight: '700' },
  blurb: { fontSize: 13.5, color: '#4b4560', lineHeight: 20 },
  statGrid: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: colors.bg, borderRadius: 12, padding: 10 },
  statLabel: { fontSize: 10.5, color: colors.textMuted },
  statValue: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 },
  servesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  servesLabel: { fontSize: 12, color: colors.textSoft },
  areaChip: { backgroundColor: colors.purpleBg, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, marginRight: 4, marginTop: 2 },
  areaChipText: { fontSize: 11.5, color: '#4b4560' },
  actionRow: { flexDirection: 'row', gap: 8 },
  chatBtn: { flex: 1, height: 44, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chatBtnText: { color: colors.text, fontWeight: '600', fontSize: 13.5, fontFamily: 'Sora' },
  quoteBtnWrap: { flex: 2 },
  quoteBtn: { height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  quoteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, fontFamily: 'Sora' },
  sectionTitle: { fontFamily: 'Sora', fontSize: 16, fontWeight: '700', color: colors.text },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 10, ...shadow.card },
  itemPhoto: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemPrice: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  itemBadge: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  itemBadgeText: { fontSize: 11, fontWeight: '700' },
  chipOk: { backgroundColor: colors.greenBg },
  chipOkText: { color: colors.green },
  chipWarn: { backgroundColor: colors.amberBg },
  chipWarnText: { color: colors.amber },
  reviewCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, ...shadow.card },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewBy: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  reviewStars: { color: colors.pink, letterSpacing: 1 },
  reviewText: { fontSize: 13, color: '#4b4560', lineHeight: 19, marginTop: 6 },
  reviewDate: { fontSize: 11, color: '#a39cb4', marginTop: 4 },
});
