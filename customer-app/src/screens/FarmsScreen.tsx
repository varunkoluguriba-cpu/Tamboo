import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useCatalog } from '../context/CatalogContext';
import { useLanguage } from '../context/LanguageContext';
import { inr, type Farm } from '../utils/farm';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Farms'>;

export default function FarmsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { coords } = useCatalog();
  const [farms, setFarms] = useState<Farm[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    setError(false);
    const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
    api.get<Farm[]>(`/api/farms${qs}`).then(setFarms).catch(() => setError(true));
  }, [coords]);
  useFocusEffect(load);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (farms || []).filter((f) => !s || f.name.toLowerCase().includes(s) || f.area.toLowerCase().includes(s));
    return [...list].sort((a, b) => (a.km ?? a.distanceFromCityKm ?? 999) - (b.km ?? b.distanceFromCityKm ?? 999));
  }, [farms, q]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.cfListTitle}</Text>
        </View>
        <Text style={styles.hint}>{t.cfListHint}</Text>

        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder={t.cfSearchPh} placeholderTextColor={colors.textMuted} style={styles.searchInput} />
        </View>

        {error ? (
          <TouchableOpacity style={styles.emptyBox} activeOpacity={0.85} onPress={load}>
            <Text style={styles.emptyText}>{t.loadFailedMsg}</Text>
            <Text style={styles.retry}>{t.retry}</Text>
          </TouchableOpacity>
        ) : farms === null ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 20 }} />
        ) : farms.length === 0 ? (
          <View style={styles.emptyBox}><Text style={styles.emptyText}>{t.cfNone}</Text></View>
        ) : (
          <>
            <Text style={styles.count}>{shown.length === 1 ? t.cfOne : t.cfCount.replace('{n}', String(shown.length))}</Text>
            {shown.length === 0 && <Text style={styles.emptyText}>{t.cfNoMatch}</Text>}
            <View style={{ gap: 12 }}>
              {shown.map((f) => {
                const where = f.km != null ? t.cfKmAway.replace('{km}', String(f.km)) : f.distanceFromCityKm ? t.cfFromCity.replace('{km}', String(f.distanceFromCityKm)) : '';
                const hasPool = f.amenities.includes('pool');
                return (
                  <TouchableOpacity key={f.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('Farm', { id: f.id })}>
                    {f.photos[0] ? <Image source={{ uri: f.photos[0] }} style={styles.photo} /> : (
                      <View style={[styles.photo, styles.photoEmpty]}><Icon name="home" size={28} color={colors.pinkStrong} strokeWidth={1.5} /></View>
                    )}
                    <View style={styles.body}>
                      <Text style={styles.name}>{f.name}</Text>
                      <Text style={styles.meta}>{[f.area, where].filter(Boolean).join(' · ')}</Text>
                      <View style={styles.chipRow}>
                        <Text style={styles.chip}>{t.cfUpTo.replace('{n}', String(f.maxGuests))}</Text>
                        {f.bedrooms > 0 && <Text style={styles.chip}>{t.cfBedroomsN.replace('{n}', String(f.bedrooms))}</Text>}
                        {hasPool && <Text style={[styles.chip, styles.chipPool]}>{t.cfPool}</Text>}
                      </View>
                      {f.fromPrice != null && <Text style={styles.price}>{t.cfFrom.replace('{price}', inr(f.fromPrice))}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12, paddingBottom: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { flex: 1, fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12.5, color: colors.textSoft, lineHeight: 19 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 16, height: 50, paddingHorizontal: 14, ...shadow.card },
  searchInput: { flex: 1, fontSize: 14.5, color: colors.text },
  count: { fontSize: 12.5, color: colors.textSoft },
  emptyBox: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, alignItems: 'center', gap: 6 },
  emptyText: { textAlign: 'center', color: colors.textSoft, fontSize: 13.5, lineHeight: 19 },
  retry: { color: colors.pinkStrong, fontWeight: '800' },
  card: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', ...shadow.card },
  photo: { width: '100%', height: 160 },
  photoEmpty: { backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 14, gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12.5, color: colors.textSoft },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { fontSize: 11.5, fontWeight: '600', color: '#4b4560', backgroundColor: colors.pinkBg, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, overflow: 'hidden' },
  chipPool: { backgroundColor: '#e6f1fb', color: '#1d5b94' },
  price: { fontFamily: 'Sora', color: colors.maroon, fontSize: 15, fontWeight: '700', marginTop: 2 },
});
