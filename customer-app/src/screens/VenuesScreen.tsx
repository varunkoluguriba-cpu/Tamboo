import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import FilterDrawer from '../components/FilterDrawer';
import type { IconName } from '../components/icons';
import { useCatalog } from '../context/CatalogContext';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';
import { ratingText, metaLine, kmText } from '../utils/rating';

type Props = NativeStackScreenProps<RootStackParamList, 'Venues'>;
type Sort = 'nearest' | 'rating' | 'priceLow' | 'priceHigh';

// Must match the partner app's VENUE_TYPES — these are the only values Hall.type can hold.
const VENUE_TYPES = ['All', 'Function Hall', 'Banquet Hall', 'Marriage Hall', 'Hotel'];

function Photo({ icon = 'home' as IconName, uri }: { icon?: IconName; uri?: string }) {
  if (uri) return <Image source={{ uri }} style={styles.photo} />;
  return (
    <View style={styles.photo}>
      <Icon name={icon} size={26} color={colors.pinkStrong} strokeWidth={1.5} />
    </View>
  );
}

export default function VenuesScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { event, setEvent } = useEvent();
  const { halls: HALLS } = useCatalog();
  const [q, setQ] = useState('');
  const [venueType, setVenueType] = useState(route.params?.venueType || 'All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [fitsGuests, setFitsGuests] = useState(false);
  const [acOnly, setAcOnly] = useState(false);
  const [crockeryOnly, setCrockeryOnly] = useState(false);
  const [sort, setSort] = useState<Sort | null>(null);

  // What the customer actually pays for the hall itself — the token (₹5,000 typical, capped
  // at ₹10,000) is just a refundable hold, not a meaningful number to sort/compare halls by.
  // Per-plate halls are normalized to an estimated total (plate price × guest count, or the
  // hall's own minimum plate count if no guest count is set yet) so they sort fairly
  // alongside flat-rent halls rather than comparing a per-plate rate to a lump sum.
  const effectiveRate = (h: (typeof HALLS)[number]) => {
    if (h.pricingMode === 'perPlate') {
      const guests = Number(event.guests) > 0 ? Number(event.guests) : (h.minPlates || 0);
      return (h.platePrice || 0) * guests;
    }
    return h.rent || 0;
  };

  const venueTypeLabel = (v: string) => {
    switch (v) {
      case 'All': return t.venuesTypeAll;
      case 'Function Hall': return t.venuesTypeFunctionHall;
      case 'Marriage Hall': return t.venuesTypeMarriageHall;
      case 'Banquet Hall': return t.venuesTypeBanquetHall;
      case 'Hotel': return t.venuesTypeHotel;
      default: return v;
    }
  };

  const sortLabel = (key: Sort) => {
    switch (key) {
      case 'nearest': return t.venuesSortNearest;
      case 'priceLow': return t.venuesSortPriceLow;
      case 'priceHigh': return t.venuesSortPriceHigh;
      default: return '';
    }
  };

  const SORTS: Array<{ key: Sort; label: string }> = [
    { key: 'nearest', label: sortLabel('nearest') },
    { key: 'priceLow', label: sortLabel('priceLow') },
    { key: 'priceHigh', label: sortLabel('priceHigh') },
  ];

  const activeCount = [venueType !== 'All', verifiedOnly, fitsGuests, acOnly, crockeryOnly, sort != null].filter(Boolean).length;

  const halls = useMemo(() => {
    let list = HALLS.filter((h) => venueType === 'All' || (h.type || '').toLowerCase() === venueType.toLowerCase());
    if (q.trim()) list = list.filter((h) => h.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (verifiedOnly) list = list.filter((h) => h.verified);
    if (acOnly) list = list.filter((h) => h.ac);
    if (crockeryOnly) list = list.filter((h) => h.hasCrockery);
    if (fitsGuests && Number(event.guests) > 0) {
      list = list.filter((h) => h.floating == null || h.floating >= Number(event.guests));
    }
    if (sort === 'nearest') list = [...list].sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    if (sort === 'priceLow') list = [...list].sort((a, b) => effectiveRate(a) - effectiveRate(b));
    if (sort === 'priceHigh') list = [...list].sort((a, b) => effectiveRate(b) - effectiveRate(a));
    return list;
  }, [HALLS, q, venueType, verifiedOnly, acOnly, crockeryOnly, fitsGuests, sort, event.guests]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.venuesHeaderTitle}</Text>
          <View style={styles.cityPill}>
            <Icon name="pin" size={13} color={colors.pinkStrong} />
            <Text style={styles.cityText}>Hyderabad</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t.venuesSearchPlaceholder}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          <TouchableOpacity style={[styles.filterBtn, activeCount > 0 && { backgroundColor: colors.maroon }]} activeOpacity={0.8} onPress={() => setFiltersOpen(true)} accessibilityLabel={t.venuesFilters}>
            <Icon name="filter" size={18} color={activeCount ? '#fff' : colors.pinkStrong} />
            {activeCount > 0 && <Text style={styles.filterBadge}>{activeCount}</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.grid2}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.date}</Text>
            <TextInput
              value={event.date}
              onChangeText={(v) => setEvent({ ...event, date: v })}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.textMuted}
              style={styles.fieldInput}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.guests}</Text>
            <TextInput
              value={event.guests}
              onChangeText={(v) => setEvent({ ...event, guests: v.replace(/[^0-9]/g, '') })}
              keyboardType="number-pad"
              style={styles.fieldInput}
            />
          </View>
        </View>

        <Text style={styles.countText}>{halls.length === 1 ? t.venuesOneFound : t.venuesCountFound.replace('{count}', String(halls.length))}</Text>

        {halls.length === 0 ? (
          <Text style={styles.emptyText}>{t.venuesNoHallsMatch}</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {halls.map((h) => (
              <TouchableOpacity key={h.id} style={styles.hallCard} activeOpacity={0.85} onPress={() => navigation.navigate('Venue', { id: h.id })}>
                <Photo uri={h.photos?.[0]} />
                <View style={styles.hallBody}>
                  <View style={styles.hallTopRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.hallName}>{h.name}</Text>
                      <Text style={styles.hallMeta}>{metaLine(h.type, h.area, h.km != null && kmText(h.km))}</Text>
                    </View>
                    <Text style={styles.hallRating}>{ratingText(h.rating, 0, t)}</Text>
                  </View>
                  <View style={styles.chipRow}>
                    <Text style={styles.miniChip}>{h.cap}</Text>
                    <Text style={styles.miniChip}>{h.ac ? t.venuesAC : t.venuesNonAC}</Text>
                    <Text style={[styles.miniChip, h.hasCrockery ? styles.chipOk : styles.chipWarn]}>
                      {h.hasCrockery ? t.venuesHasCrockery : t.venuesNoCrockery}
                    </Text>
                  </View>
                  <View style={styles.hallBottomRow}>
                    <View>
                      <Text style={styles.tokenAmount}>
                        {h.pricingMode === 'perPlate'
                          ? `₹${(h.platePrice || 0).toLocaleString('en-IN')}${t.venuesPerPlateLabel}`
                          : `${t.venuesRentLabel} ₹${(h.rent || 0).toLocaleString('en-IN')}`}
                      </Text>
                      <Text style={styles.tokenText}>{t.venuesTokenLabel} ₹{h.token.toLocaleString('en-IN')}</Text>
                    </View>
                    <Text style={[styles.availBadge, styles.chipOk]}>{t.venuesAvailableBadge}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <FilterDrawer
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t.venuesFilters}
        clearLabel={t.venuesClearFilters}
        sections={[
          {
            title: t.venuesHallType,
            options: VENUE_TYPES.map((v) => ({ label: venueTypeLabel(v), selected: venueType === v, onPress: () => setVenueType(v) })),
          },
          {
            title: t.venuesSortBy,
            options: SORTS.map((o) => ({ label: o.label, selected: sort === o.key, onPress: () => setSort((cur) => (cur === o.key ? null : o.key)) })),
          },
          {
            title: t.venuesMustHave,
            multi: true,
            options: [
              { label: t.venuesVerifiedOnlyChip, selected: verifiedOnly, onPress: () => setVerifiedOnly((v) => !v) },
              { label: t.venuesFitsGuestsChip, selected: fitsGuests, onPress: () => setFitsGuests((v) => !v) },
              { label: t.venuesACOnlyChip, selected: acOnly, onPress: () => setAcOnly((v) => !v) },
              { label: t.venuesCrockeryOnlyChip, selected: crockeryOnly, onPress: () => setCrockeryOnly((v) => !v) },
            ],
          },
        ]}
        onClear={() => { setVenueType('All'); setSort(null); setVerifiedOnly(false); setFitsGuests(false); setAcOnly(false); setCrockeryOnly(false); }}
        applyLabel={halls.length === 1 ? t.venuesShowOneResult : t.venuesShowResults.replace('{count}', String(halls.length))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { flex: 1, fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  cityPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, ...shadow.card },
  cityText: { fontSize: 12.5, fontWeight: '700', color: colors.pinkStrong },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 16, height: 50, paddingHorizontal: 14, ...shadow.card },
  searchInput: { flex: 1, fontSize: 14.5, color: colors.text },
  filterBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pinkBg },
  filterBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.maroon, color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center', lineHeight: 18, overflow: 'hidden' },
  fieldInput: { fontSize: 15, fontWeight: '700', color: colors.text, padding: 0, marginTop: 2 },
  grid2: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 10, ...shadow.card },
  fieldLabel: { fontSize: 11, color: colors.textMuted },
  fieldValue: { fontWeight: '700', fontSize: 14, color: colors.text, marginTop: 2 },
  chipScroll: { gap: 6, paddingRight: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5 },
  chipUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5 },
  sortChipText: { fontSize: 12, fontWeight: '600', color: colors.pinkStrong },
  countText: { fontSize: 12.5, color: colors.textSoft },
  emptyText: { textAlign: 'center', paddingVertical: 30, color: colors.textSoft, fontSize: 13.5 },
  photo: { width: '100%', height: 150, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  hallCard: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', ...shadow.card },
  hallBody: { padding: 14, gap: 6 },
  hallTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  hallName: { fontSize: 15, fontWeight: '700', color: colors.text },
  hallMeta: { fontSize: 12, color: colors.textSoft },
  hallRating: { fontSize: 12, fontWeight: '700', color: colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniChip: { fontSize: 11.5, fontWeight: '600', color: '#4b4560', backgroundColor: colors.pinkBg, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, overflow: 'hidden' },
  chipOk: { backgroundColor: colors.greenBg, color: colors.green },
  chipWarn: { backgroundColor: colors.amberBg, color: colors.amber },
  hallBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  tokenText: { fontSize: 12.5, color: colors.textSoft },
  tokenAmount: { fontFamily: 'Sora', color: colors.maroon, fontSize: 15, fontWeight: '700' },
  availBadge: { fontSize: 11, fontWeight: '700', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, overflow: 'hidden' },
});
