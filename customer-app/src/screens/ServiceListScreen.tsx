import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { fromPriceText, languageText, serviceCategoryInfo, traditionText, type PublicServiceVendor } from '../utils/services';
import { metaLine } from '../utils/rating';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceList'>;

export default function ServiceListScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { category } = route.params;
  const info = serviceCategoryInfo(category, t);
  const [vendors, setVendors] = useState<PublicServiceVendor[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    return api.get<PublicServiceVendor[]>(`/api/services?category=${category}`)
      .then(setVendors)
      .catch(() => { setFailed(true); setVendors((v) => v ?? []); });
  }, [category]);
  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load().finally(() => setRefreshing(false)); }} />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>{info.label}</Text>
            <Text style={styles.sub}>{info.ex}</Text>
          </View>
        </View>

        {vendors === null ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 40 }} />
        ) : failed && vendors.length === 0 ? (
          <Text style={styles.empty}>{t.loadFailedMsg}</Text>
        ) : vendors.length === 0 ? (
          <Text style={styles.empty}>{t.svListEmpty}</Text>
        ) : (
          vendors.map((v) => (
            <TouchableOpacity key={v.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('ServiceVendor', { id: v.id })}>
              {v.photos[0] ? (
                <Image source={{ uri: v.photos[0] }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoEmpty]}><Icon name={info.icon} size={24} color={colors.pinkStrong} strokeWidth={1.5} /></View>
              )}
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{v.name}</Text>
                  {v.verified && <Icon name="shield" size={14} color={colors.green} />}
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {metaLine(v.area, v.experienceYears > 0 && t.svExperience.replace('{n}', String(v.experienceYears)))}
                </Text>
                {(v.traditions.length > 0 || v.languages.length > 0) && (
                  <Text style={styles.meta} numberOfLines={1}>
                    {metaLine(v.traditions.map((x) => traditionText(x, t)).join(', '), v.languages.length > 0 && `${t.svLanguages}: ${v.languages.map(languageText).join(', ')}`)}
                  </Text>
                )}
                {v.fromPrice != null && <Text style={styles.price}>{fromPriceText(v, t)}</Text>}
              </View>
              <Icon name="right" size={16} color={colors.dividerStrong} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13.5, marginTop: 40, paddingHorizontal: 20, lineHeight: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 18, padding: 12, ...shadow.card },
  photo: { width: 72, height: 72, borderRadius: 14 },
  photoEmpty: { backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  meta: { fontSize: 12, color: colors.textSoft },
  price: { fontSize: 13.5, fontWeight: '800', color: colors.maroon, marginTop: 2 },
});
