import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { getToken, statusColors, type TokenStatus } from '../data/catalog';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HToken'>;

function soon() {
  Alert.alert('Coming soon', 'This is being built next.');
}

export default function HTokenScreen({ navigation, route }: Props) {
  const original = getToken(route.params.id);
  const [status, setStatus] = useState<TokenStatus | undefined>(original?.status);
  const [finalRent, setFinalRent] = useState('');

  if (!original) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Pre-booking not found.</Text>
      </SafeAreaView>
    );
  }

  const isActive = status === 'ACTIVE';
  const isVisited = status === 'VISITED';
  const sc = statusColors(status || '');

  const markVisited = () => setStatus('VISITED');

  const notBooked = () => {
    Alert.alert('Customer not booking?', "You'll keep the token per policy; this pre-booking will close.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => { setStatus('NOT_BOOKED'); navigation.goBack(); } },
    ]);
  };

  const confirmBooking = () => {
    if (!finalRent.trim()) return Alert.alert('Enter the final rent', 'Add the rent you agreed with the customer.');
    setStatus('CONFIRMED');
  };

  const release = () => {
    Alert.alert("Can't host this date?", 'The customer gets a full refund of the token.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release & refund', style: 'destructive', onPress: () => { setStatus('CANCELLED'); navigation.goBack(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pre-booking {original.id}</Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.pill, { backgroundColor: sc.bg }]}>
            <Text style={[styles.pillText, { color: sc.color }]}>{status}</Text>
          </View>
          <Text style={styles.event}>{original.event}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>Customer</Text>
            <Text style={styles.rowText}>{original.customer} · {original.phone}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>Event date</Text>
            <Text style={styles.rowText}>{original.date}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>Slot</Text>
            <Text style={styles.rowText}>{original.slot}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>Guests</Text>
            <Text style={styles.rowText}>{original.guests}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>Token received</Text>
            <Text style={styles.rowText}>₹{original.amount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>Paid at</Text>
            <Text style={styles.rowText}>{original.paidAt}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowMuted}>Visit</Text>
            <Text style={styles.rowText}>{original.visitTxt}</Text>
          </View>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{original.note}</Text>
          </View>
        </View>

        {isActive && (
          <TouchableOpacity activeOpacity={0.85} onPress={markVisited}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Customer visited the hall</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isVisited && (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Final rent agreed with the customer (₹)</Text>
            <TextInput value={finalRent} onChangeText={(v) => setFinalRent(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} />
            <Text style={styles.hint}>The ₹{original.amount.toLocaleString('en-IN')} token is adjusted in this. The customer pays the balance to you at the hall.</Text>
            <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={notBooked}>
              <Text style={styles.outlineBtnText}>Customer decided not to book</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={confirmBooking}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Confirm booking</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {isActive && (
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={release}>
            <Text style={styles.outlineBtnText}>Can't host · release date & refund token</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={soon}>
          <Text style={styles.outlineBtnText}>Call customer</Text>
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
