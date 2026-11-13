import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import type { MyFarm } from '../utils/farm';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FFarms'>;

export default function FFarmsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [farms, setFarms] = useState<MyFarm[] | null>(null);
  const [error, setError] = useState(false);

  useFocusEffect(useCallback(() => {
    setError(false);
    api.get<MyFarm[]>('/api/farms/me/farms').then(setFarms).catch(() => setError(true));
  }, []));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.pfFarmsTitle}</Text>
        <Text style={styles.hint}>{t.pfFarmsHint}</Text>
        {error ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>{t.loadFailedMsg}</Text></View>
        ) : farms === null ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 20 }} />
        ) : farms.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>{t.pfFarmsEmpty}</Text></View>
        ) : (
          <View style={{ gap: 10 }}>
            {farms.map((f) => (
              <TouchableOpacity key={f.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('FFarm', { farmId: f.id })}>
                {f.photos[0] ? <Image source={{ uri: f.photos[0] }} style={styles.cover} /> : <View style={[styles.cover, styles.coverEmpty]}><Icon name="camera" size={22} color={colors.pinkStrong} /></View>}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>{[f.area, t.pfUpTo.replace('{n}', String(f.maxGuests)), f.bedrooms ? t.pfBedroomsN.replace('{n}', String(f.bedrooms)) : ''].filter(Boolean).join(' · ')}</Text>
                  {f.fromPrice != null && <Text style={styles.cardPrice}>{t.pfFrom.replace('{price}', `₹${f.fromPrice.toLocaleString('en-IN')}`)}</Text>}
                  {!f.published && <Text style={styles.hidden}>{t.pfHidden}</Text>}
                </View>
                <Icon name="right" size={16} color={colors.dividerStrong} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        {farms !== null && farms.length < 10 && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('FFarm', {})}>
            <View style={styles.addBtn}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={StyleSheet.absoluteFill} />
              <Icon name="plus" size={16} color="#fff" />
              <Text style={styles.addBtnText}>{t.pfAddFarm}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12, paddingBottom: 24 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12.5, color: colors.textSoft, lineHeight: 19 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, alignItems: 'center' },
  emptyText: { color: colors.textSoft, fontSize: 13, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 18, padding: 12, ...shadow.card },
  cover: { width: 72, height: 72, borderRadius: 14 },
  coverEmpty: { backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 12.5, color: colors.textSoft },
  cardPrice: { fontSize: 13, fontWeight: '700', color: colors.pinkStrong },
  hidden: { fontSize: 12, fontWeight: '700', color: colors.amber },
  addBtn: { height: 50, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
});
