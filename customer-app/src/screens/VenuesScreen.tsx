import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import type { IconName } from '../components/icons';
import { useCatalog } from '../context/CatalogContext';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Venues'>;
type Sort = 'nearest' | 'rating' | 'priceLow' | 'priceHigh';

const VENUE_TYPES = ['All', 'Marriage hall', 'Banquet hall', 'Outdoor / Lawn', 'Home / Backyard'];
const SLOTS = ['Any time', 'Morning', 'Evening'];

function Photo({ icon = 'home' as IconName, uri }: { icon?: IconName; uri?: string }) {
  if (uri) return <Image source={{ uri }} style={styles.photo} />;
  return (
    <View style={styles.photo}>
      <Icon name={icon} size={26} color={colors.pinkStrong} strokeWidth={1.5} />
    </View>
  );
}

export default function VenuesScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { event } = useEvent();
  const { halls: HALLS } = useCatalog();
  const [venueType, setVenueType] = useState('All');
  const [slot, setSlot] = useState('Any time');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<Sort | null>(null);

  const venueTypeLabel = (v: string) => {
    switch (v) {
      case 'All': return t.venuesTypeAll;
      case 'Marriage hall': return t.venuesTypeMarriageHall;
      case 'Banquet hall': return t.venuesTypeBanquetHall;
      case 'Outdoor / Lawn': return t.venuesTypeOutdoorLawn;
      case 'Home / Backyard': return t.venuesTypeHomeBackyard;
      default: return v;
    }
  };

  const slotLabel = (s: string) => {
    switch (s) {
      case 'Any time': return t.venuesSlotAnyTime;
      case 'Morning': return t.venueMorning;
      case 'Evening': return t.venueEvening;
      default: return s;
    }
  };

  const sortLabel = (key: Sort) => {
    switch (key) {
      case 'nearest': return t.venuesSortNearest;
      case 'rating': return t.venuesSortTopRated;
      case 'priceLow': return t.venuesSortTokenLow;
      case 'priceHigh': return t.venuesSortTokenHigh;
      default: return '';
    }
  };

  const SORTS: Array<{ key: Sort; label: string }> = [
    { key: 'nearest', label: sortLabel('nearest') },
    { key: 'rating', label: sortLabel('rating') },
    { key: 'priceLow', label: sortLabel('priceLow') },
    { key: 'priceHigh', label: sortLabel('priceHigh') },
  ];

  const halls = useMemo(() => {
    let list = HALLS.filter((h) => venueType === 'All' || h.type === venueType);
    if (verifiedOnly) list = list.filter((h) => h.verified);
    if (sort === 'nearest') list = [...list].sort((a, b) => a.km - b.km);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'priceLow') list = [...list].sort((a, b) => a.token - b.token);
    if (sort === 'priceHigh') list = [...list].sort((a, b) => b.token - a.token);
    return list;
  }, [HALLS, venueType, verifiedOnly, sort]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

        <View style={styles.grid2}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.date}</Text>
            <Text style={styles.fieldValue}>{event.date || 'DD/MM/YYYY'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.guests}</Text>
            <Text style={styles.fieldValue}>{event.guests}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {SLOTS.map((s) => (
            <TouchableOpacity key={s} activeOpacity={0.85} onPress={() => setSlot(s)} style={[styles.chip, slot === s ? styles.chipSel : styles.chipUnsel]}>
              <Text style={[styles.chipText, slot === s && styles.chipTextSel]}>{slotLabel(s)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {VENUE_TYPES.map((v) => (
            <TouchableOpacity key={v} activeOpacity={0.85} onPress={() => setVenueType(v)} style={[styles.chip, venueType === v ? styles.chipSel : styles.chipUnsel]}>
              <Text style={[styles.chipText, venueType === v && styles.chipTextSel]}>{venueTypeLabel(v)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setVerifiedOnly((v) => !v)} style={[styles.chip, verifiedOnly ? styles.chipSel : styles.chipUnsel]}>
            <Text style={[styles.chipText, verifiedOnly && styles.chipTextSel]}>{t.venuesVerifiedOnlyChip}</Text>
          </TouchableOpacity>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
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
        </ScrollView>

        <Text style={styles.countText}>{t.venuesCountFound.replace('{count}', String(halls.length))}</Text>

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
                      <Text style={styles.hallMeta}>{h.type} · {h.area} · {h.km} km</Text>
                    </View>
                    <Text style={styles.hallRating}>★ {h.rating}</Text>
                  </View>
                  <View style={styles.chipRow}>
                    <Text style={styles.miniChip}>{h.cap}</Text>
                    <Text style={styles.miniChip}>{h.ac ? t.venuesAC : t.venuesNonAC}</Text>
                    <Text style={[styles.miniChip, h.hasCrockery ? styles.chipOk : styles.chipWarn]}>
                      {h.hasCrockery ? t.venuesHasCrockery : t.venuesNoCrockery}
                    </Text>
                  </View>
                  <View style={styles.hallBottomRow}>
                    <Text style={styles.tokenText}>{t.venuesTokenLabel} <Text style={styles.tokenAmount}>₹{h.token.toLocaleString('en-IN')}</Text></Text>
                    <Text style={[styles.availBadge, styles.chipOk]}>{t.venuesAvailableBadge}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
