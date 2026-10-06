import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Packages'>;

export type PartnerPackage = {
  id: string;
  name: string;
  description: string;
  lines: Array<{ productId: string; name: string; qty: number; unitPrice: number }>;
  total: number;
};

export default function PackagesScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [packages, setPackages] = useState<PartnerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.get<PartnerPackage[]>('/api/vendors/me/packages')
      .then((list) => { setPackages(list); setError(''); })
      .catch(() => setError(t.packagesLoadError))
      .finally(() => setLoading(false));
  }, [t.packagesLoadError]));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t.packagesTitle}</Text>
        </View>
        <Text style={styles.hint}>{t.packagesHint}</Text>

        {loading ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : packages.length === 0 ? (
          <Text style={styles.emptyText}>{t.packagesEmpty}</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {packages.map((p) => (
              <TouchableOpacity key={p.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('PackageForm', { id: p.id })}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <Text style={styles.cardPrice}>₹{p.total.toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.cardItems}>
                  {p.lines.map((l) => (l.qty > 1 ? `${l.qty} × ${l.name}` : l.name)).join(', ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('PackageForm', {})}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.addBtn}>
            <Icon name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>{t.packagesAddBtn}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12, paddingBottom: 24 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12.5, color: colors.textSoft, lineHeight: 19 },
  emptyText: { textAlign: 'center', paddingVertical: 30, color: colors.textSoft, fontSize: 13.5 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 6, ...shadow.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 15.5, fontWeight: '700', color: colors.text, flex: 1 },
  cardPrice: { fontFamily: 'Sora', fontWeight: '800', fontSize: 15, color: colors.maroon },
  cardItems: { fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },
  addBtn: { height: 50, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
});
