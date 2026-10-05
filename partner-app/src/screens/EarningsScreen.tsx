import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Earnings'>;

type PayoutEntry = {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

function dateTxt(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function EarningsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<PayoutEntry[]>([]);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get<{ balance: number; entries: PayoutEntry[] }>('/api/partner-auth/payouts');
      setBalance(res.balance);
      setEntries(res.entries);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.earningsLoadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headRow}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <Icon name="left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.earningsTitle}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.pink} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={load}>
            <Text style={styles.retryText}>{t.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{t.earningsAvailableBalance}</Text>
            <Text style={styles.balanceValue}>{inr(balance)}</Text>
            <Text style={styles.balanceNote}>{t.earningsBalanceNote}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t.earningsHistory}</Text>

          {entries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.earningsEmptyText}</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {entries.map((e) => {
                const credit = e.type === 'credit';
                return (
                  <View key={e._id} style={styles.entryRow}>
                    <View style={[styles.entryIcon, { backgroundColor: credit ? colors.greenBg : colors.pinkBg }]}>
                      <Icon name={credit ? 'plus' : 'right'} size={16} color={credit ? colors.green : colors.pinkStrong} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.entryDesc}>{e.description || (credit ? t.earningsBookingEarning : t.earningsPayout)}</Text>
                      <Text style={styles.entryDate}>{dateTxt(e.createdAt)}{e.reference ? ` · ${e.reference}` : ''}</Text>
                    </View>
                    <Text style={[styles.entryAmount, { color: credit ? colors.green : colors.textSoft }]}>
                      {credit ? '+' : '-'}{inr(e.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 6 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { color: colors.textSoft, fontSize: 13.5, textAlign: 'center' },
  retryBtn: { height: 40, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  scroll: { padding: 18, paddingTop: 6, gap: 16, paddingBottom: 32 },
  balanceCard: { backgroundColor: colors.maroon, borderRadius: 20, padding: 20, gap: 6 },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  balanceValue: { color: '#fff', fontFamily: 'Sora', fontSize: 34, fontWeight: '800' },
  balanceNote: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionTitle: { fontFamily: 'Sora', fontSize: 16, fontWeight: '700', color: colors.text },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 20, alignItems: 'center' },
  emptyText: { color: colors.textSoft, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 12, ...shadow.card },
  entryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  entryDesc: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  entryDate: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  entryAmount: { fontFamily: 'Sora', fontSize: 14.5, fontWeight: '800' },
});
