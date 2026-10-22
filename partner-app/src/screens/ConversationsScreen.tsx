import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversations'>;

type ConversationSummary = {
  id: string;
  phone: string;
  summary: string;
  actionItems: string[];
  messageCount: number;
  lastMessageAt: string;
};

export default function ConversationsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [convos, setConvos] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.get<ConversationSummary[]>('/api/vendors/me/conversations')
      .then((list) => { setConvos(list); setError(''); })
      .catch(() => setError(t.convosLoadError))
      .finally(() => setLoading(false));
  }, [t.convosLoadError]));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t.convosTitle}</Text>
        </View>
        <Text style={styles.hint}>{t.convosHint}</Text>

        {loading ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : convos.length === 0 ? (
          <Text style={styles.emptyText}>{t.convosEmpty}</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {convos.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardPhone}>{c.phone}</Text>
                  <Text style={styles.cardCount}>{c.messageCount}</Text>
                </View>
                {!!c.summary && <Text style={styles.cardSummary}>{c.summary}</Text>}
                {c.actionItems.length > 0 && (
                  <View style={{ gap: 4, marginTop: 4 }}>
                    {c.actionItems.map((a, i) => (
                      <View key={i} style={styles.actionRow}>
                        <Icon name="check" size={13} color={colors.pinkStrong} strokeWidth={2.5} />
                        <Text style={styles.actionText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
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
  cardPhone: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardCount: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted },
  cardSummary: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  actionText: { fontSize: 12.5, color: colors.text, flex: 1, lineHeight: 18 },
});
