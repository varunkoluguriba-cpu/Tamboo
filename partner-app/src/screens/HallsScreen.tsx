import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { VenueTabBar } from '../components/TabBar';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Halls'>;

type HallSummary = {
  id: string;
  name: string;
  venueType: string;
  seated: number;
  floating: number;
  pricingMode: 'rent' | 'perPlate';
  rent: number;
  platePrice: number;
};

export default function HallsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [halls, setHalls] = useState<HallSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.get<HallSummary[]>('/api/halls/me/halls')
      .then(setHalls)
      .catch(() => setHalls([]))
      .finally(() => setLoading(false));
  }, []));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.hallsTitle}</Text>
        <Text style={styles.hint}>{t.hallsHint}</Text>

        {loading ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 20 }} />
        ) : halls.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.hallsEmpty}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {halls.map((h) => (
              <TouchableOpacity key={h.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('Hall', { hallId: h.id })}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName}>{h.name || t.hallsUnnamed}</Text>
                  <Icon name="right" size={16} color={colors.dividerStrong} />
                </View>
                <Text style={styles.cardMeta}>{h.venueType || t.hallsUntitledType}</Text>
                <Text style={styles.cardMeta}>
                  {t.hallsCapacityLine.replace('{seated}', String(h.seated)).replace('{floating}', String(h.floating))}
                </Text>
                <Text style={styles.cardPrice}>
                  {h.pricingMode === 'perPlate'
                    ? `₹${(h.platePrice || 0).toLocaleString('en-IN')} ${t.hallsPerPlate}`
                    : `₹${(h.rent || 0).toLocaleString('en-IN')} ${t.hallsPerSlot}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Hall', {})}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.addBtn}>
            <Icon name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>{t.hallsAddBtn}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <VenueTabBar active="hall" navigation={navigation} />
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
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 4, ...shadow.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 12.5, color: colors.textSoft },
  cardPrice: { fontSize: 13, fontWeight: '700', color: colors.pinkStrong, marginTop: 2 },
  addBtn: { height: 50, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
});
