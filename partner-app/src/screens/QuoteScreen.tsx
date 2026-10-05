import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useQuotes } from '../hooks/useQuotes';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Quote'>;
type Line = { label: string; amount: string };

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function QuoteScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { quotes, loading, reload } = useQuotes();
  const quote = quotes.find((q) => q.id === route.params.id);
  const [lines, setLines] = useState<Line[]>([{ label: '', amount: '' }]);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.maroon} />
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>{t.quoteNotFound}</Text>
      </SafeAreaView>
    );
  }

  const editable = quote.status === 'AWAITING VENDOR' || quote.status === 'REVISION REQUESTED';
  const versions = quote.versions;
  const total = lines.reduce((sum, l) => sum + (parseInt(l.amount, 10) || 0), 0);

  const updateLine = (i: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { label: '', amount: '' }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const sendQuote = async () => {
    const validLines = lines.filter((l) => l.label.trim() && parseInt(l.amount, 10) > 0);
    if (validLines.length === 0) return;
    setSending(true);
    try {
      await api.patch(`/api/quotes/vendor/me/${quote.id}`, {
        lines: validLines.map((l) => ({ label: l.label, amount: parseInt(l.amount, 10) })),
        note,
      });
      await reload();
      setLines([{ label: '', amount: '' }]);
      setNote('');
    } catch (e) {
      Alert.alert(t.quoteNotFound, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.quoteHeaderTitle.replace('{id}', quote.id)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{quote.event}</Text>
          <Text style={styles.cardMeta}>{quote.customer} · {quote.date} · {quote.guests} {t.quoteGuestsLabel}</Text>
          <View style={styles.needBox}>
            <Text style={styles.needText}>"{quote.need}"</Text>
          </View>
          {quote.isRevision && (
            <View style={styles.revisionBox}>
              <Text style={styles.revisionText}>{t.quoteRevisionRequested}</Text>
            </View>
          )}
          <Text style={styles.statusText}>{editable ? quote.status : t.quoteOfferSent}</Text>
          {!!quote.customerId && (
            <TouchableOpacity
              style={styles.chatLink}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Chat', { customerId: quote.customerId!, customerName: quote.customer })}
            >
              <Text style={styles.chatLinkText}>{t.chatWithCustomer}</Text>
            </TouchableOpacity>
          )}
        </View>

        {editable && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.quoteYourPriceVersion.replace('{version}', String((versions[versions.length - 1]?.v || 0) + 1))}</Text>
            {lines.map((l, i) => (
              <View key={i} style={styles.lineRow}>
                <TextInput
                  value={l.label}
                  onChangeText={(v) => updateLine(i, { label: v })}
                  placeholder={t.quoteItemOrService}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { flex: 1 }]}
                />
                <TextInput
                  value={l.amount}
                  onChangeText={(v) => updateLine(i, { amount: v.replace(/\D/g, '') })}
                  placeholder="₹"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={[styles.input, { width: 92 }]}
                />
                <TouchableOpacity style={styles.removeBtn} activeOpacity={0.7} onPress={() => removeLine(i)}>
                  <Icon name="x" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addLineBtn} activeOpacity={0.85} onPress={addLine}>
              <Text style={styles.addLineText}>{t.quoteAddLine}</Text>
            </TouchableOpacity>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t.quoteNotePlaceholder}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              style={[styles.input, styles.textarea]}
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.quoteTotal}</Text>
              <Text style={styles.totalValue}>{inr(total)}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={sendQuote} disabled={sending}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.sendBtn}>
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>{t.quoteSendButton}</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.hint}>{t.quoteValidHint}</Text>
          </View>
        )}

        {versions.map((v) => (
          <View key={v.v} style={styles.versionCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.versionTitle}>{t.quoteSentVersion.replace('{version}', String(v.v))}</Text>
              <Text style={styles.versionTitle}>{inr(v.total)}</Text>
            </View>
            {v.lines.map((l) => (
              <View key={l.label} style={styles.rowBetween}>
                <Text style={styles.versionLine}>{l.label}</Text>
                <Text style={styles.versionLine}>{inr(l.amount)}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  notFound: { padding: 24, color: colors.textSoft },
  scroll: { padding: 18, paddingTop: 6, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 8, ...shadow.card },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.textSoft },
  needBox: { backgroundColor: colors.bg, borderRadius: 10, padding: 10 },
  needText: { fontSize: 13, color: '#4b4560', lineHeight: 19 },
  revisionBox: { backgroundColor: '#fff7e6', borderRadius: 10, padding: 10 },
  revisionText: { color: '#8a5a00', fontSize: 12.5 },
  statusText: { fontSize: 12.5, fontWeight: '700', color: colors.pinkStrong },
  chatLink: { alignSelf: 'flex-start', marginTop: 4 },
  chatLinkText: { fontSize: 12.5, fontWeight: '700', color: colors.pink, textDecorationLine: 'underline' },
  lineRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  input: { height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 10, fontSize: 14, color: colors.text },
  textarea: { height: undefined, minHeight: 60, paddingTop: 10, textAlignVertical: 'top' },
  removeBtn: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  addLineBtn: { height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: '#f0c4d3', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addLineText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontWeight: '800', fontSize: 15, color: colors.text },
  totalValue: { fontWeight: '800', fontSize: 15, color: colors.maroon },
  sendBtn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
  hint: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
  versionCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 4, ...shadow.card },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  versionTitle: { fontWeight: '700', fontSize: 13, color: colors.text },
  versionLine: { fontSize: 13, color: colors.textSoft },
});
