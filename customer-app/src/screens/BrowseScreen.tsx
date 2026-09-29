import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import type { IconName } from '../components/icons';
import TabBar from '../components/TabBar';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Browse'>;
type ResTab = 'items' | 'vendors';
type Sort = 'priceLow' | 'priceHigh' | 'rating' | 'nearest';

const CAT_CHIPS = ['All', 'Shamiana & Tents', 'Chairs & Tables', 'Crockery & Vessels', 'Lighting', 'Sound & DJ', 'Decor'];
const SORTS: Array<{ key: Sort; label: string }> = [
  { key: 'priceLow', label: 'Price: low' },
  { key: 'priceHigh', label: 'Price: high' },
  { key: 'rating', label: 'Top rated' },
  { key: 'nearest', label: 'Nearest' },
];

const ITEMS = [
  { id: 'i1', name: 'Premium Shamiana (40×60 ft)', vendor: 'Sai Tent House', vendorVerified: true, cat: 'Shamiana & Tents', rating: 4.7, price: 8500, unit: '/ day', avail: 'In stock', availOk: true, km: 3.2 },
  { id: 'i2', name: 'Banquet Chairs, Steel Padded', vendor: 'Balaji Decorators', vendorVerified: true, cat: 'Chairs & Tables', rating: 4.5, price: 18, unit: '/ chair / day', avail: '320 available', availOk: true, km: 5.6 },
  { id: 'i3', name: 'LED Stage Lighting Set', vendor: 'Hyderabad Sound & Light', vendorVerified: false, cat: 'Lighting', rating: 4.3, price: 6000, unit: '/ day', avail: 'Only 2 left', availOk: false, km: 6.9 },
  { id: 'i4', name: 'Deksha & Bogana Combo (100 pax)', vendor: 'Sai Tent House', vendorVerified: true, cat: 'Crockery & Vessels', rating: 4.6, price: 3200, unit: '/ day', avail: 'In stock', availOk: true, km: 3.2 },
  { id: 'i5', name: 'DJ & PA System, 2000W', vendor: 'Hyderabad Sound & Light', vendorVerified: false, cat: 'Sound & DJ', rating: 4.2, price: 9500, unit: '/ day', avail: 'In stock', availOk: true, km: 6.9 },
  { id: 'i6', name: 'Marigold Stage Backdrop', vendor: 'Balaji Decorators', vendorVerified: true, cat: 'Decor', rating: 4.6, price: 4200, unit: '/ setup', avail: 'In stock', availOk: true, km: 5.6 },
];

const VENDORS = [
  { id: 'v1', name: 'Sai Tent House', area: 'Ameerpet', km: 3.2, years: '12 yrs', rating: 4.7, reviews: 210, verified: true },
  { id: 'v2', name: 'Balaji Decorators', area: 'Kukatpally', km: 5.6, years: '8 yrs', rating: 4.5, reviews: 128, verified: true },
  { id: 'v3', name: 'Hyderabad Sound & Light', area: 'Begumpet', km: 6.9, years: '5 yrs', rating: 4.3, reviews: 64, verified: false },
];

function Photo({ icon, size = 84, radius = 14 }: { icon: IconName; size?: number; radius?: number }) {
  return (
    <View style={[styles.photo, { width: size, height: size, borderRadius: radius }]}>
      <Icon name={icon} size={size * 0.32} color={colors.pinkStrong} strokeWidth={1.5} />
    </View>
  );
}

export default function BrowseScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(route.params?.category || 'All');
  const [sort, setSort] = useState<Sort | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [resTab, setResTab] = useState<ResTab>('items');

  const items = useMemo(() => {
    let list = ITEMS.filter((p) => cat === 'All' || p.cat === cat);
    if (q.trim()) list = list.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()) || p.vendor.toLowerCase().includes(q.trim().toLowerCase()));
    if (verifiedOnly) list = list.filter((p) => p.vendorVerified);
    if (inStockOnly) list = list.filter((p) => p.availOk);
    if (sort === 'priceLow') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'priceHigh') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'nearest') list = [...list].sort((a, b) => a.km - b.km);
    return list;
  }, [cat, q, verifiedOnly, inStockOnly, sort]);

  const vendors = useMemo(() => {
    let list = VENDORS;
    if (q.trim()) list = list.filter((v) => v.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (verifiedOnly) list = list.filter((v) => v.verified);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'nearest') list = [...list].sort((a, b) => a.km - b.km);
    return list;
  }, [q, verifiedOnly, sort]);

  const results = resTab === 'items' ? items : vendors;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.search}</Text>

        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Chairs, shamiana, vendor name…"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.availRow}>
          <Icon name="calendar" size={14} color={colors.textSoft} />
          <Text style={styles.availText}>
            Availability for <Text style={styles.availBold}>DD/MM/YYYY</Text> · 100 guests
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {CAT_CHIPS.map((c) => (
            <TouchableOpacity key={c} activeOpacity={0.85} onPress={() => setCat(c)} style={[styles.chip, cat === c ? styles.chipSel : styles.chipUnsel]}>
              <Text style={[styles.chipText, cat === c && styles.chipTextSel]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <View style={styles.sliderIcon}>
            <Icon name="sliders" size={13} color={colors.textSoft} />
          </View>
          {SORTS.map((s) => (
            <TouchableOpacity
              key={s.key}
              activeOpacity={0.85}
              onPress={() => setSort((cur) => (cur === s.key ? null : s.key))}
              style={[styles.sortChip, sort === s.key ? styles.chipSel : styles.chipUnsel]}
            >
              <Text style={[styles.sortChipText, sort === s.key && styles.chipTextSel]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity activeOpacity={0.85} onPress={() => setVerifiedOnly((v) => !v)} style={[styles.sortChip, verifiedOnly ? styles.chipSel : styles.chipUnsel]}>
            <Text style={[styles.sortChipText, verifiedOnly && styles.chipTextSel]}>Verified only</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setInStockOnly((v) => !v)} style={[styles.sortChip, inStockOnly ? styles.chipSel : styles.chipUnsel]}>
            <Text style={[styles.sortChipText, inStockOnly && styles.chipTextSel]}>In stock</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.resTabs}>
          <TouchableOpacity style={[styles.resTab, resTab === 'items' && styles.resTabSel]} activeOpacity={0.85} onPress={() => setResTab('items')}>
            <Text style={[styles.resTabText, resTab === 'items' && styles.resTabTextSel]}>Items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resTab, resTab === 'vendors' && styles.resTabSel]} activeOpacity={0.85} onPress={() => setResTab('vendors')}>
            <Text style={[styles.resTabText, resTab === 'vendors' && styles.resTabTextSel]}>Vendors</Text>
          </TouchableOpacity>
        </View>

        {results.length === 0 ? (
          <Text style={styles.noResults}>Nothing matches these filters. Try removing one.</Text>
        ) : resTab === 'items' ? (
          <View style={{ gap: 10 }}>
            {items.map((p) => (
              <TouchableOpacity key={p.id} style={styles.itemCard} activeOpacity={0.85}>
                <Photo icon="package" />
                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{p.name}</Text>
                  <Text style={styles.itemMeta}>{p.vendor} · ★ {p.rating}</Text>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>
                      ₹{p.price.toLocaleString('en-IN')} <Text style={styles.itemUnit}>{p.unit}</Text>
                    </Text>
                  </View>
                  <Text style={[styles.availBadge, p.availOk ? styles.chipOk : styles.chipWarn]}>{p.avail}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {vendors.map((v) => (
              <TouchableOpacity key={v.id} style={styles.vendorRow} activeOpacity={0.85}>
                <Photo icon="tent" size={56} radius={14} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.vendorName}>{v.name}</Text>
                  <Text style={styles.itemMeta}>{v.area} · {v.km} km · {v.years}</Text>
                  <Text style={styles.vendorRating}>★ {v.rating} <Text style={styles.itemUnit}>({v.reviews})</Text></Text>
                </View>
                {v.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TabBar active="search" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 16, height: 50, paddingHorizontal: 14, ...shadow.card },
  searchInput: { flex: 1, fontSize: 14.5, color: colors.text },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availText: { fontSize: 12, color: colors.textSoft },
  availBold: { color: colors.text, fontWeight: '700' },
  chipScroll: { gap: 6, paddingRight: 8, alignItems: 'center' },
  sliderIcon: { marginRight: 2 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5 },
  chipUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5 },
  sortChipText: { fontSize: 12, fontWeight: '600', color: colors.pinkStrong },
  resTabs: { flexDirection: 'row', gap: 6, backgroundColor: colors.surface, borderRadius: 999, padding: 4, ...shadow.card },
  resTab: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  resTabSel: { backgroundColor: colors.maroon },
  resTabText: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  resTabTextSel: { color: '#fff' },
  noResults: { textAlign: 'center', paddingVertical: 30, color: colors.textSoft, fontSize: 13.5 },
  photo: { backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  itemCard: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: 18, padding: 12, ...shadow.card },
  itemBody: { flex: 1, minWidth: 0, gap: 3 },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 18 },
  itemMeta: { fontSize: 12, color: colors.textSoft },
  itemFooter: { marginTop: 'auto' },
  itemPrice: { fontFamily: 'Sora', fontSize: 15, fontWeight: '800', color: colors.maroon },
  itemUnit: { fontSize: 11, color: colors.textMuted, fontWeight: '400' },
  availBadge: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '700', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, overflow: 'hidden' },
  chipOk: { backgroundColor: colors.greenBg, color: colors.green },
  chipWarn: { backgroundColor: colors.amberBg, color: colors.amber },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 18, padding: 14, ...shadow.card },
  vendorName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  vendorRating: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 2 },
  verifiedBadge: { backgroundColor: colors.greenBg, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  verifiedBadgeText: { color: colors.green, fontSize: 11, fontWeight: '700' },
});
