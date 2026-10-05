import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { TentTabBar } from '../components/TabBar';
import { api, ApiError } from '../api/client';
import { colors, gradients, shadow } from '../theme';
import { useLanguage } from '../context/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Items'>;

type ItemState = 'LIVE' | 'REVIEW' | 'PAUSED';
type Item = {
  id: string;
  name: string;
  cat: string;
  price: number;
  unit: string;
  stock: number;
  instant: boolean;
  state: ItemState;
  photos: string[];
};

const STATE_STYLE: Record<ItemState, { bg: string; color: string }> = {
  LIVE: { bg: '#e8f7f0', color: '#047857' },
  REVIEW: { bg: '#f3eefd', color: '#5b21b6' },
  PAUSED: { bg: '#f4f1f8', color: '#4b4560' },
};

export default function ItemsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const STATE_LABEL_TEXT: Record<ItemState, string> = {
    LIVE: t.itemsStateLive,
    REVIEW: t.itemsStateReview,
    PAUSED: t.itemsStatePaused,
  };

  const load = useCallback(async () => {
    try {
      const res = await api.get<Item[]>('/api/vendors/me/items');
      setItems(res);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.itemsLoadError);
    } finally {
      setLoading(false);
    }
  }, [t.itemsLoadError]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const liveCount = items.filter((i) => i.state === 'LIVE').length;

  const togglePause = async (item: Item) => {
    const nextPaused = item.state !== 'PAUSED';
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, state: nextPaused ? 'PAUSED' : i.state } : i)));
    try {
      await api.put<Item>(`/api/vendors/me/items/${item.id}`, { paused: nextPaused });
      load();
    } catch (err) {
      Alert.alert(t.itemFormErrSaveFailed, err instanceof ApiError ? err.message : t.tryAgain);
      load();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <Text style={styles.title}>{t.itemsTitle}</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ItemForm', {})}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.addBtn}>
              <Icon name="plus" size={15} color="#fff" />
              <Text style={styles.addBtnText}>{t.itemsAddBtn}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.summary}>{error}</Text>
        ) : (
          <>
            <Text style={styles.summary}>{liveCount} {t.itemsLiveLabel} · {items.length} {t.itemsTotalLabel}</Text>

            {items.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t.itemsEmptyText}</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {items.map((p) => {
                  const st = STATE_STYLE[p.state];
                  const isPaused = p.state === 'PAUSED';
                  return (
                    <View key={p.id} style={styles.card}>
                      <View style={styles.photo}>
                        {p.photos?.[0] ? (
                          <Image source={{ uri: p.photos[0] }} style={styles.photoImg} />
                        ) : (
                          <Icon name="package" size={26} color={colors.pinkStrong} strokeWidth={1.5} />
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                        <Text style={styles.name}>{p.name}</Text>
                        <Text style={styles.meta}>{p.instant ? `₹${p.price.toLocaleString('en-IN')} ${p.unit} · stock ${p.stock}` : t.itemsPriceOnRequest}</Text>
                        <View style={[styles.pill, { backgroundColor: st.bg }]}>
                          <Text style={[styles.pillText, { color: st.color }]}>{STATE_LABEL_TEXT[p.state]}</Text>
                        </View>
                      </View>
                      <View style={{ gap: 6 }}>
                        <TouchableOpacity style={styles.smallBtn} activeOpacity={0.85} onPress={() => navigation.navigate('ItemForm', { id: p.id })}>
                          <Text style={styles.smallBtnText}>{t.edit}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.smallBtn} activeOpacity={0.85} onPress={() => togglePause(p)}>
                          <Text style={styles.smallBtnText}>{isPaused ? t.itemsResume : t.itemsPause}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TentTabBar active="items" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  addBtn: { height: 40, paddingHorizontal: 16, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5, fontFamily: 'Sora' },
  summary: { fontSize: 12.5, color: colors.textSoft },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 20, alignItems: 'center' },
  emptyText: { color: colors.textSoft, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, padding: 12, ...shadow.card },
  photo: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  name: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 18 },
  meta: { fontSize: 12, color: colors.textSoft },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  pillText: { fontSize: 11, fontWeight: '700' },
  smallBtn: { height: 32, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { color: colors.text, fontWeight: '600', fontSize: 12 },
});
