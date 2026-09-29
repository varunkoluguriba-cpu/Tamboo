import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { getHall } from '../data/catalog';
import { useEvent } from '../context/EventContext';
import { useToken } from '../context/TokenContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TokenPay'>;
type Method = 'upi' | 'card' | 'netbanking';

const METHODS: Array<{ key: Method; label: string; sub: string }> = [
  { key: 'upi', label: 'UPI', sub: 'Google Pay, PhonePe, Paytm and more' },
  { key: 'card', label: 'Credit / Debit card', sub: 'Visa, Mastercard, RuPay' },
  { key: 'netbanking', label: 'Netbanking', sub: 'All major Indian banks' },
];

const VISIT_HOURS = 48;

function visitByText(): string {
  const d = new Date(Date.now() + VISIT_HOURS * 3600 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hh = d.getHours() % 12 || 12;
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${d.getDate()} ${months[d.getMonth()]}, ${hh}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

export default function TokenPayScreen({ navigation, route }: Props) {
  const hall = getHall(route.params.hallId);
  const { event } = useEvent();
  const { startToken } = useToken();
  const [method, setMethod] = useState<Method>('upi');
  const [agree, setAgree] = useState(false);

  if (!hall) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Hall not found.</Text>
      </SafeAreaView>
    );
  }

  const pay = () => {
    startToken({
      hallId: hall.id,
      hallName: hall.name,
      date: route.params.date,
      slot: route.params.slot,
      guests: event.guests,
      amount: hall.token,
      visitHours: VISIT_HOURS,
    });
    navigation.reset({ index: 0, routes: [{ name: 'TokenDone' }] });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay token</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.hallName}>{hall.name}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{route.params.date}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Slot</Text>
            <Text style={styles.summaryValue}>{route.params.slot}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Guests</Text>
            <Text style={styles.summaryValue}>{event.guests}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Visit the hall before</Text>
            <Text style={styles.summaryValue}>{visitByText()}</Text>
          </View>
          <View style={styles.tokenRow}>
            <Text style={styles.tokenLabel}>Token amount</Text>
            <Text style={styles.tokenValue}>₹{hall.token.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          {METHODS.map((m) => {
            const sel = method === m.key;
            return (
              <TouchableOpacity key={m.key} style={[styles.methodRow, { borderColor: sel ? colors.pink : colors.divider }]} activeOpacity={0.85} onPress={() => setMethod(m.key)}>
                <View style={[styles.radio, { borderColor: sel ? colors.pink : colors.dividerStrong }]}>
                  {sel && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodSub}>{m.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.agreeRow} activeOpacity={0.85} onPress={() => setAgree((a) => !a)}>
          <View style={[styles.checkbox, agree && styles.checkboxOn]}>
            {agree && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
          </View>
          <Text style={styles.agreeText}>
            I understand the token expires if I don't visit within {VISIT_HOURS} hours, and an expired token is not refunded. If the hall
            cancels, I get a full refund.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.payBtnWrap} activeOpacity={agree ? 0.85 : 1} disabled={!agree} onPress={pay}>
          <LinearGradient
            colors={gradients.primaryButton.colors}
            start={gradients.primaryButton.start}
            end={gradients.primaryButton.end}
            style={[styles.payBtn, !agree && styles.payBtnDisabled]}
          >
            <Text style={styles.payBtnText}>Pay ₹{hall.token.toLocaleString('en-IN')}</Text>
          </LinearGradient>
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
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 8, ...shadow.card },
  hallName: { fontSize: 15, fontWeight: '700', color: colors.text },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13.5, color: colors.textSoft },
  summaryValue: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  tokenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8 },
  tokenLabel: { fontWeight: '700', color: colors.text },
  tokenValue: { fontFamily: 'Sora', fontWeight: '800', fontSize: 20, color: colors.maroon },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pink },
  methodLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  methodSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  agreeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.dividerStrong, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  agreeText: { fontSize: 12.5, lineHeight: 19, color: colors.text, flex: 1 },
  payBtnWrap: {},
  payBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
