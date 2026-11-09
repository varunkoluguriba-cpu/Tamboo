import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import DateField from '../components/DateField';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { useServices } from '../context/ServicesContext';
import { requireAccount } from '../utils/requireAccount';
import { serviceCategoryInfo, type MyServiceRequest } from '../utils/services';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceRequest'>;
type CreateResult = {
  request: MyServiceRequest;
  payment: { orderId: string; amount: number; currency: string; keyId: string } | null;
};

const OCCASIONS = ['Wedding', 'Reception', 'Birthday', 'House party', 'Corporate'] as const;

// '+919999900000' → '+91 99999 00000' (Indian numbers); anything else shown as-is.
const prettyPhone = (p: string) => (/^\+91\d{10}$/.test(p) ? `+91 ${p.slice(3, 8)} ${p.slice(8)}` : p);

export default function ServiceRequestScreen({ navigation, route }: Props) {
  const { vendorId, vendorName, category, offerId, offerTitle } = route.params;
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { event } = useEvent();
  const { config, refresh } = useServices();
  const info = serviceCategoryInfo(category, t);

  const [date, setDate] = useState(event.date || '');
  const [occasion, setOccasion] = useState<string>(OCCASIONS.includes(event.type as any) ? event.type : 'Wedding');
  const [guests, setGuests] = useState(event.guests || '');
  const [area, setArea] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  const hours = config.noResponseHours ?? 24;
  const freeLeft = config.freeLeft ?? 0;
  const fee = freeLeft > 0 ? 0 : (config.fees?.[category as keyof NonNullable<typeof config.fees>] ?? 0);
  const occasionLabel = (o: string) => ({
    Wedding: t.homeScreenOccasionWedding, Reception: t.homeScreenOccasionReception, Birthday: t.homeScreenOccasionBirthday,
    'House party': t.homeScreenOccasionHouseParty, Corporate: t.homeScreenOccasionCorporate,
  } as Record<string, string>)[o] || o;

  const done = (paid: number) => {
    refresh();
    Alert.alert(
      t.svReqSentTitle,
      (paid > 0 ? t.svReqSentPaid.replace('{fee}', String(paid)) : t.svReqSentFree).replace('{vendor}', vendorName).replace('{hours}', String(hours)),
      [{ text: t.ok, onPress: () => navigation.replace('ServiceRequests') }],
    );
  };

  const send = async () => {
    if (sending) return;
    if (!requireAccount(user, t, logout)) return;
    if (!date) return Alert.alert(t.svReqNeedDate);
    if (!consent) return Alert.alert(t.svReqNeedConsent);
    setSending(true);
    try {
      const res = await api.post<CreateResult>('/api/services/requests', {
        partnerId: vendorId, eventDate: date, eventType: occasion, guests: Number(guests) || 0,
        area: area.trim(), message: message.trim(), offerId, consent: true,
      });
      if (!res.payment) return done(0);

      let checkout: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
      try {
        checkout = await RazorpayCheckout.open({
          key: res.payment.keyId,
          order_id: res.payment.orderId,
          amount: res.payment.amount,
          currency: res.payment.currency,
          name: 'Tamboo',
          description: t.svReqPayDesc.replace('{vendor}', vendorName),
          prefill: { name: user?.name, contact: user?.phone },
          theme: { color: colors.maroon },
        });
      } catch (checkoutErr: any) {
        // Cancelled or failed in the payment sheet: nothing was sent to the vendor. The unpaid
        // request is replaced the next time they tap Send.
        const description: string = checkoutErr?.description || '';
        if (!/cancel/i.test(description)) Alert.alert(t.payNotCompletedTitle, [description, t.payNotCompletedMsg].filter(Boolean).join('\n\n'));
        return;
      }
      const v = await api.post<{ verified: boolean }>(`/api/services/requests/${res.request.id}/verify`, checkout);
      if (!v.verified) return Alert.alert(t.tokenPayVerifyFailedTitle, t.tokenPayVerifyFailedMsg);
      done(res.request.fee);
    } catch (err) {
      Alert.alert(t.svReqFailed, err instanceof ApiError ? err.message : t.tryAgain);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
              <Icon name="left" size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>{t.svAsk}</Text>
              <Text style={styles.sub} numberOfLines={1}>{info.label} · {vendorName}</Text>
            </View>
          </View>
          <Text style={styles.lead}>{t.svReqSubtitle.replace('{vendor}', vendorName)}</Text>
          {!!offerTitle && <Text style={styles.pkg}>{t.svReqPackage.replace('{title}', offerTitle)}</Text>}

          <View style={styles.card}>
            <Text style={styles.label}>{t.svReqDate}</Text>
            <View style={styles.input}><DateField value={date} onChange={setDate} textStyle={styles.inputText} placeholderColor={colors.textMuted} /></View>

            <Text style={styles.label}>{t.svReqType}</Text>
            <View style={styles.chips}>
              {OCCASIONS.map((o) => (
                <TouchableOpacity key={o} style={[styles.chip, occasion === o && styles.chipSel]} activeOpacity={0.85} onPress={() => setOccasion(o)}>
                  <Text style={[styles.chipText, occasion === o && styles.chipTextSel]}>{occasionLabel(o)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t.svReqGuests}</Text>
                <TextInput style={[styles.input, styles.inputText]} value={guests} onChangeText={(x) => setGuests(x.replace(/\D/g, '').slice(0, 5))} keyboardType="number-pad" placeholder="100" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={styles.label}>{t.svReqArea}</Text>
                <TextInput style={[styles.input, styles.inputText]} value={area} onChangeText={setArea} placeholder={t.svReqAreaPh} placeholderTextColor={colors.textMuted} maxLength={120} />
              </View>
            </View>

            <Text style={styles.label}>{t.svReqMsg}</Text>
            <TextInput style={[styles.input, styles.inputText, styles.multi]} value={message} onChangeText={setMessage} placeholder={({ catering: t.svReqMsgPhCatering, decor: t.svReqMsgPhDecor, music: t.svReqMsgPhMusic } as Record<string, string>)[category] || t.svReqMsgPh} placeholderTextColor={colors.textMuted} multiline maxLength={1000} />
          </View>

          <TouchableOpacity style={styles.consentRow} activeOpacity={0.85} onPress={() => setConsent((c) => !c)}>
            <View style={[styles.checkbox, consent && styles.checkboxOn]}>{consent && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}</View>
            <Text style={styles.consentText}>{t.svReqConsent.replace('{phone}', prettyPhone(user?.phone || '')).replace('{vendor}', vendorName)}</Text>
          </TouchableOpacity>

          <View style={[styles.feeBox, fee === 0 ? styles.feeFree : styles.feePaid]}>
            <Text style={[styles.feeText, { color: fee === 0 ? colors.green : colors.amber }]}>
              {fee === 0
                ? t.svReqFeeFree.replace('{n}', String(freeLeft)).replace('{total}', String(config.freeQuotes ?? 0))
                : t.svReqFeePaid.replace('{fee}', String(fee)).replace('{vendor}', vendorName).replace('{hours}', String(hours))}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity activeOpacity={0.85} onPress={send} disabled={sending}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={[styles.cta, sending && { opacity: 0.7 }]}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{fee === 0 ? t.svReqSend : t.svReqPay.replace('{fee}', String(fee))}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 24, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  lead: { fontSize: 13.5, color: colors.textSoft, lineHeight: 20 },
  pkg: { fontSize: 13.5, fontWeight: '700', color: colors.pinkStrong },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 8, ...shadow.card },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.text, marginTop: 4 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: colors.surface },
  inputText: { fontSize: 14, color: colors.text },
  multi: { minHeight: 90, paddingTop: 10, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.pinkBg },
  chipSel: { backgroundColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  twoCol: { flexDirection: 'row', gap: 10 },
  consentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingHorizontal: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.dividerStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1, backgroundColor: colors.surface },
  checkboxOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  consentText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  feeBox: { borderRadius: 14, padding: 12 },
  feeFree: { backgroundColor: colors.greenBg },
  feePaid: { backgroundColor: colors.amberBg },
  feeText: { fontSize: 13, fontWeight: '700', lineHeight: 19 },
  footer: { padding: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.bg },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...shadow.primaryButton },
  ctaText: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
});
