import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import RequestQuoteModal from '../components/RequestQuoteModal';
import { colors, gradients, shadow } from '../theme';
import type { LangStrings } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Product'>;

function soon(t: LangStrings) {
  Alert.alert(t.comingSoon, t.productComingSoonMsg);
}

function parseMin(min: string): number {
  const n = parseInt(min, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default function ProductScreen({ navigation, route }: Props) {
  const { getProduct, getVendor } = useCatalog();
  const product = getProduct(route.params.id);
  const vendor = product ? getVendor(product.vendorId) : undefined;
  const [qty, setQty] = useState(() => (product ? parseMin(product.min) : 1));
  const [quoteModal, setQuoteModal] = useState(false);
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const pct = useMemo(() => {
    if (!product || product.avail.total <= 0) return 0;
    return Math.round((product.avail.free / product.avail.total) * 100);
  }, [product]);

  if (!product || !vendor) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>{t.productNotFound}</Text>
      </SafeAreaView>
    );
  }

  const minQty = parseMin(product.min);
  const over = product.isInstant && qty > product.avail.free;
  const cantAdd = product.isInstant && (over || qty < minQty || product.avail.free <= 0);
  const total = product.price * qty;

  const dec = () => setQty((q) => Math.max(minQty, q - 1));
  const inc = () => setQty((q) => q + 1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.cover}>
          <View style={styles.coverPlaceholder}>
            <Icon name="package" size={44} color={colors.pinkStrong} strokeWidth={1.3} />
          </View>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View>
            <Text style={styles.catLabel}>{product.cat}</Text>
            <Text style={styles.name}>{product.name}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.push('Vendor', { id: vendor.id })}>
              <Text style={styles.vendorLink}>{vendor.name} · ★ {product.rating} ›</Text>
            </TouchableOpacity>
          </View>

          {product.isInstant && (
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
              <Text style={styles.unit}>{product.unit}</Text>
            </View>
          )}

          <Text style={styles.specs}>{product.specs}</Text>

          {product.isInstant && (
            <View style={styles.availCard}>
              <View style={styles.availHead}>
                <Text style={styles.availTitle}>{t.productAvailabilityOn}</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Event')}>
                  <Text style={styles.changeLink}>{t.productChange}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statCell}>
                  <Text style={styles.statNum}>{product.avail.total}</Text>
                  <Text style={styles.statLbl}>{t.productTotal}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statNum}>{product.avail.reserved}</Text>
                  <Text style={styles.statLbl}>{t.productBooked}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statNum}>{product.avail.maint}</Text>
                  <Text style={styles.statLbl}>{t.productInRepair}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={[styles.statNum, { color: colors.green }]}>{product.avail.free}</Text>
                  <Text style={styles.statLbl}>{t.productFree}</Text>
                </View>
              </View>
              <Text style={styles.availNote}>{t.productAvailNote}</Text>
            </View>
          )}

          {product.isInstant && (
            <View style={styles.grid2}>
              <View style={styles.smallStat}>
                <Text style={styles.smallStatLabel}>{t.productSecurityDeposit}</Text>
                <Text style={styles.smallStatValue}>{product.deposit}</Text>
              </View>
              <View style={styles.smallStat}>
                <Text style={styles.smallStatLabel}>{t.productMinQty}</Text>
                <Text style={styles.smallStatValue}>{product.min}</Text>
              </View>
            </View>
          )}

          {product.isInstant ? (
            <>
              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>{t.productQuantity}</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity style={styles.qtyBtn} activeOpacity={0.8} onPress={dec}>
                    <Icon name="minus" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{qty}</Text>
                  <TouchableOpacity style={styles.qtyBtnFilled} activeOpacity={0.8} onPress={inc}>
                    <Icon name="plus" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {over && (
                <View style={styles.warnBox}>
                  <Text style={styles.warnText}>{t.productOnlyLeft.replace('{param}', String(product.avail.free))}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.addBtnWrap}
                activeOpacity={cantAdd ? 1 : 0.85}
                disabled={cantAdd}
                onPress={() => {
                  addToCart(product.id, qty);
                  Alert.alert(
                    t.productAddedToCartTitle,
                    t.productAddedToCartMsg.replace('{qty}', String(qty)).replace('{name}', product.name),
                    [
                      { text: t.productKeepBrowsing, style: 'cancel' },
                      { text: t.productViewCart, onPress: () => navigation.navigate('Cart') },
                    ],
                  );
                }}
              >
                <LinearGradient
                  colors={gradients.primaryButton.colors}
                  start={gradients.primaryButton.start}
                  end={gradients.primaryButton.end}
                  style={[styles.addBtn, cantAdd && styles.addBtnDisabled]}
                >
                  <Text style={styles.addBtnText}>{t.productAddToCart.replace('{param}', total.toLocaleString('en-IN'))}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quoteOutlineBtn} activeOpacity={0.85} onPress={() => setQuoteModal(true)}>
                <Text style={styles.quoteOutlineText}>{t.productAskForQuote}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.quoteNote}>
                <Text style={styles.quoteNoteText}>{t.productQuoteNote}</Text>
              </View>
              <TouchableOpacity style={styles.addBtnWrap} activeOpacity={0.85} onPress={() => setQuoteModal(true)}>
                <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>{t.productRequestQuote}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      <RequestQuoteModal
        visible={quoteModal}
        onClose={() => setQuoteModal(false)}
        vendorId={vendor.id}
        vendorName={vendor.name}
        productName={product.name}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  notFound: { padding: 24, color: colors.textSoft },
  cover: { height: 260, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 8, left: 18, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 18, paddingTop: 16, gap: 14 },
  catLabel: { fontSize: 12, fontWeight: '700', color: colors.pink, textTransform: 'uppercase', letterSpacing: 0.6 },
  name: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4, marginBottom: 6, lineHeight: 28 },
  vendorLink: { fontSize: 13, color: colors.pinkStrong, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontFamily: 'Sora', fontSize: 26, fontWeight: '800', color: colors.maroon },
  unit: { fontSize: 13, color: colors.textSoft },
  specs: { fontSize: 13.5, color: '#4b4560', lineHeight: 20 },
  availCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 12, ...shadow.card },
  availHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availTitle: { fontWeight: '700', fontSize: 14, color: colors.text },
  changeLink: { color: colors.pinkStrong, fontWeight: '700', fontSize: 12.5 },
  barTrack: { height: 10, borderRadius: 999, backgroundColor: '#f4eaef', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.pink, borderRadius: 999 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCell: { alignItems: 'center', flex: 1 },
  statNum: { fontFamily: 'Sora', fontWeight: '800', fontSize: 16, color: colors.text },
  statLbl: { fontSize: 10.5, color: colors.textMuted, marginTop: 2 },
  availNote: { fontSize: 11.5, color: colors.textMuted },
  grid2: { flexDirection: 'row', gap: 10 },
  smallStat: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 10 },
  smallStatLabel: { fontSize: 11, color: colors.textMuted },
  smallStatValue: { fontWeight: '700', fontSize: 14, color: colors.text, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 18, padding: 12, ...shadow.card },
  qtyLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  qtyBtnFilled: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { width: 40, textAlign: 'center', fontWeight: '700', fontSize: 15, color: colors.text },
  warnBox: { backgroundColor: colors.dangerBg, borderRadius: 12, padding: 10 },
  warnText: { color: colors.dangerStrong, fontSize: 12.5, fontWeight: '600' },
  addBtnWrap: {},
  addBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
  quoteOutlineBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  quoteOutlineText: { color: colors.text, fontWeight: '600', fontSize: 14, fontFamily: 'Sora' },
  quoteNote: { backgroundColor: colors.purpleBg, borderRadius: 14, padding: 12 },
  quoteNoteText: { color: '#5b21b6', fontSize: 12.5, lineHeight: 19 },
});
