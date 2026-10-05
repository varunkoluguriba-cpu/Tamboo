import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';
import { statusColors } from '../data/catalog';
import { useHallTokens, tokenUiStatus, type RemoteHallToken } from '../hooks/useHallTokens';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HToken'>;

export default function HTokenScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { tokens, loading, reload } = useHallTokens();
  const original = tokens.find((tok) => tok.id === route.params.id);
  const [finalRent, setFinalRent] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.maroon} />
      </SafeAreaView>
    );
  }

  if (!original) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>{t.htokenNotFound}</Text>
      </SafeAreaView>
    );
  }

  const status = tokenUiStatus(original);
  const isActive = status === 'ACTIVE';
  const isVisited = status === 'VISITED';
  const sc = statusColors(status);
  const statusLabel = (s?: string) => {
    switch (s) {
      case 'ACTIVE': return t.htokenStatusActive;
      case 'VISITED': return t.htokenStatusVisited;
      case 'CONFIRMED': return t.htokenStatusConfirmed;
      case 'NOT_BOOKED': return t.htokenStatusNotBooked;
      case 'CANCELLED': return t.htokenStatusCancelled;
      default: return s;
    }
  };

  const act = async (action: 'visited' | 'confirm' | 'notBooked' | 'cantHost', body?: Record<string, unknown>) => {
    setBusy(true);
    try {
      await api.patch(`/api/halls/me/tokens/${original.id}`, { action, ...body });
      await reload();
    } catch (e) {
      Alert.alert(t.htokenEnterRentTitle, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setBusy(false);
    }
  };

  const markVisited = () => act('visited');

  const notBooked = () => {
    Alert.alert(t.htokenNotBookedTitle, t.htokenNotBookedMsg, [
      { text: t.cancel, style: 'cancel' },
      { text: t.confirm, onPress: async () => { await act('notBooked'); navigation.goBack(); } },
    ]);
  };

  const confirmBooking = () => {
    if (!finalRent.trim()) return Alert.alert(t.htokenEnterRentTitle, t.htokenEnterRentMsg);
    act('confirm', { finalRent: Number(finalRent) });
  };

  const release = () => {
    Alert.alert(t.htokenCantHostTitle, t.htokenCantHostMsg, [
      { text: t.cancel, style: 'cancel' },
      { text: t.htokenReleaseRefund, style: 'destructive', onPress: async () => { await act('cantHost'); navigation.goBack(); } },
    ]);
  };

  const callCustomer = () => {
    if (original.phone) Linking.openURL(`tel:${original.phone}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.htokenPreBookingLabel} {original.id.slice(-6).toUpperCase()}</Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.pill, { backgroundColor: sc.bg }]}>
            <Text style={[styles.pillText, { color: sc.color }]}>{statusLabel(status)}</Text>
          </View>
          <Text style={styles.event}>{original.hallName}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>{t.htokenCustomer}</Text>
            <Text style={styles.rowText}>{original.customer} · {original.phone}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>{t.htokenEventDate}</Text>
            <Text style={styles.rowText}>{original.date}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>{t.htokenSlot}</Text>
            <Text style={styles.rowText}>{original.slot}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>{t.htokenGuests}</Text>
            <Text style={styles.rowText}>{original.guests}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>{t.htokenTokenReceived}</Text>
            <Text style={styles.rowText}>₹{original.amount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {isActive && (
          <TouchableOpacity activeOpacity={0.85} onPress={markVisited} disabled={busy}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{t.htokenMarkVisited}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isVisited && (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t.htokenFinalRentLabel}</Text>
            <TextInput value={finalRent} onChangeText={(v) => setFinalRent(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} />
            <Text style={styles.hint}>{t.htokenRentHint.replace('{amount}', original.amount.toLocaleString('en-IN'))}</Text>
            <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={notBooked} disabled={busy}>
              <Text style={styles.outlineBtnText}>{t.htokenNotBookedBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={confirmBooking} disabled={busy}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>{t.htokenConfirmBooking}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {isActive && (
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={release} disabled={busy}>
            <Text style={styles.outlineBtnText}>{t.htokenReleaseBtn}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={callCustomer}>
          <Text style={styles.outlineBtnText}>{t.htokenCallCustomer}</Text>
        </TouchableOpacity>
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
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  event: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowMuted: { fontSize: 13.5, color: colors.textSoft },
  rowText: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  noteBox: { backgroundColor: colors.bg, borderRadius: 10, padding: 10 },
  noteText: { fontSize: 12.5, color: '#4b4560', lineHeight: 19 },
  primaryBtn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },
  input: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, fontSize: 14.5, color: colors.text },
  hint: { fontSize: 12, color: colors.textSoft },
  outlineBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { color: colors.text, fontWeight: '700', fontSize: 13.5 },
});
