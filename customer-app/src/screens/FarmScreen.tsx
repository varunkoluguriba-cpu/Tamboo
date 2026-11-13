import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import DateField, { parseDMY } from '../components/DateField';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useLanguage } from '../context/LanguageContext';
import { requireAccount } from '../utils/requireAccount';
import { isoDate } from '../utils/date';
import { AMENITY_KEYS, SLOT_KEYS, endsNextDay, inr, slotLabel, time12, timeRange, type Farm, type FarmQuote, type MyFarmBooking, type SlotKey } from '../utils/farm';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Farm'>;
const W = Dimensions.get('window').width;
const OCCASIONS = ['Birthday', 'House party', 'Wedding', 'Reception', 'Corporate'];

export default function FarmScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { coords } = useCatalog();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [error, setError] = useState(false);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<SlotKey | null>(null);
  const [guests, setGuests] = useState('');
  const [occasion, setOccasion] = useState('');
  const [quote, setQuote] = useState<FarmQuote | null>(null);
  const [quoteErr, setQuoteErr] = useState('');
  const [checking, setChecking] = useState(false);
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = useCallback(() => {
    setError(false);
    api.get<Farm>(`/api/farms/${route.params.id}${coords ? `?lat=${coords.lat}&lng=${coords.lng}` : ''}`)
      .then((f) => { setFarm(f); setSlot((s) => s || SLOT_KEYS.find((k) => f.slots[k]?.enabled) || null); })
      .catch(() => setError(true));
  }, [route.params.id, coords]);
  useEffect(load, [load]);

  const day = parseDMY(date);
  const ymd = day ? isoDate(day) : '';
  const g = parseInt(guests || '0', 10) || 0;

  // Price + availability for the chosen date / stay / guests — the same numbers the booking uses.
  useEffect(() => {
    setQuote(null); setQuoteErr('');
    if (!farm || !ymd || !slot || g < 1) return;
    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(() => {
      api.post<FarmQuote>(`/api/farms/${farm.id}/quote`, { date: ymd, slot, guests: g })
        .then((q) => { if (!cancelled) setQuote(q); })
        .catch((e) => { if (!cancelled) setQuoteErr(e instanceof ApiError ? e.message : t.tryAgain); })
        .finally(() => { if (!cancelled) setChecking(false); });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [farm, ymd, slot, g, t]);

  const pay = async () => {
    if (!farm || !quote || !slot || paying) return;
    if (!requireAccount(user, t, logout)) return;
    setPaying(true);
    try {
      const r = await api.post<{ booking: MyFarmBooking; payment: { orderId: string; amount: number; currency: string; keyId: string } }>(
        `/api/farms/${farm.id}/book`, { date: ymd, slot, guests: g, occasion },
      );
      let res: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
      try {
        res = await RazorpayCheckout.open({
          key: r.payment.keyId, order_id: r.payment.orderId, amount: r.payment.amount, currency: r.payment.currency,
          name: 'Tamboo', description: `${farm.name} · ${slotLabel(slot, t)}`,
          prefill: { name: user?.name, contact: user?.phone }, theme: { color: colors.maroon },
        });
      } catch (checkoutErr: any) {
        const description: string = checkoutErr?.description || '';
        if (!/cancel/i.test(description)) Alert.alert(t.payNotCompletedTitle, [description, t.payNotCompletedMsg].filter(Boolean).join('\n\n'));
        return;
      }
      const v = await api.post<{ verified: boolean; conflict?: boolean }>(`/api/farms/bookings/${r.booking.id}/verify`, res);
      if (!v.verified) return Alert.alert(t.payNotCompletedTitle, t.cfVerifyFail);
      const goBookings = () => navigation.navigate('Bookings', { tab: 'farms' });
      if (v.conflict) Alert.alert(t.cfConflictTitle, t.cfConflictMsg, [{ text: t.ok, onPress: goBookings }]);
      else Alert.alert(t.cfBookedTitle, t.cfBookedMsg, [{ text: t.ok, onPress: goBookings }]);
    } catch (e) {
      Alert.alert(t.payNotCompletedTitle, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setPaying(false);
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>{t.loadFailedMsg}</Text>
        <TouchableOpacity onPress={load}><Text style={styles.link}>{t.retry}</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }
  if (!farm) return <SafeAreaView style={styles.center}><ActivityIndicator color={colors.pink} /></SafeAreaView>;

  const r = farm.rules;
  const yesNo = (v: boolean) => (v ? t.cfAllowed : t.cfNotAllowed);
  const RULES: Array<[string, string, boolean]> = [
    [t.cfRuleEvents, yesNo(r.eventsAllowed), r.eventsAllowed],
    [t.cfRuleAlcohol, yesNo(r.alcoholAllowed), r.alcoholAllowed],
    [t.cfRuleOutsideFood, yesNo(r.outsideFoodAllowed), r.outsideFoodAllowed],
    [t.cfRuleDj, yesNo(r.djAllowed), r.djAllowed],
    [t.cfRulePets, yesNo(r.petsAllowed), r.petsAllowed],
    [t.cfRuleSmoking, r.smokingOutdoorOnly ? t.cfOutdoorsOnly : t.cfAllowed, true],
  ];
  const FACTS: Array<[string, string]> = ([
    [t.cfBedrooms, farm.bedrooms ? String(farm.bedrooms) : ''],
    [t.cfAcRooms, farm.acRooms ? String(farm.acRooms) : ''],
    [t.cfBeds, farm.beds ? String(farm.beds) : ''],
    [t.cfBathrooms, farm.bathrooms ? String(farm.bathrooms) : ''],
    [t.cfLawn, farm.lawnSqft ? t.cfSqft.replace('{n}', farm.lawnSqft.toLocaleString('en-IN')) : ''],
    [t.cfParking, farm.parkingCars ? t.cfCars.replace('{n}', String(farm.parkingCars)) : ''],
  ] as Array<[string, string]>).filter(([, v]) => v);
  const offered = SLOT_KEYS.filter((k) => farm.slots[k]?.enabled);
  const canPay = !!quote && agree && !paying;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View>
          {farm.photos.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {farm.photos.map((p, i) => <Image key={i} source={{ uri: p }} style={styles.photo} />)}
            </ScrollView>
          ) : (
            <View style={[styles.photo, styles.photoEmpty]}><Icon name="home" size={36} color={colors.pinkStrong} strokeWidth={1.5} /></View>
          )}
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          {farm.photos.length > 1 && <Text style={styles.photoCount}>{farm.photos.length} 📷</Text>}
        </View>

        <View style={styles.content}>
          <View>
            <Text style={styles.name}>{farm.name}</Text>
            <Text style={styles.meta}>
              {[farm.area, farm.km != null ? t.cfKmAway.replace('{km}', String(farm.km)) : farm.distanceFromCityKm ? t.cfFromCity.replace('{km}', String(farm.distanceFromCityKm)) : '', t.cfUpTo.replace('{n}', String(farm.maxGuests))].filter(Boolean).join(' · ')}
            </Text>
          </View>

          {!!farm.about && <Section title={t.cfAbout}><Text style={styles.body}>{farm.about}</Text></Section>}

          <Section title={t.cfStays}>
            {offered.map((k) => {
              const s = farm.slots[k];
              return (
                <View key={k} style={styles.slotRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotName}>{slotLabel(k, t)}</Text>
                    <Text style={styles.small}>{timeRange(s.start, s.end)}{endsNextDay(s.start, s.end) ? ` (${t.cfNextDay})` : ''}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.slotPrice}>{inr(s.weekdayPrice)} <Text style={styles.small}>{t.cfWeekday}</Text></Text>
                    {s.weekendPrice > 0 && s.weekendPrice !== s.weekdayPrice && <Text style={styles.slotPrice}>{inr(s.weekendPrice)} <Text style={styles.small}>{t.cfWeekend}</Text></Text>}
                  </View>
                </View>
              );
            })}
            {farm.includedGuests > 0 && farm.extraGuestCharge > 0 && (
              <Text style={styles.small}>{t.cfIncluded.replace('{n}', String(farm.includedGuests)).replace('{price}', inr(farm.extraGuestCharge))}</Text>
            )}
          </Section>

          {FACTS.length > 0 && (
            <Section title={t.cfGuestsRooms}>
              <View style={styles.factGrid}>
                {FACTS.map(([k, v]) => (
                  <View key={k} style={styles.fact}><Text style={styles.factVal}>{v}</Text><Text style={styles.small}>{k}</Text></View>
                ))}
              </View>
            </Section>
          )}

          {farm.amenities.length > 0 && (
            <Section title={t.cfAmenities}>
              <View style={styles.chipRow}>
                {farm.amenities.filter((a) => AMENITY_KEYS[a]).map((a) => (
                  <View key={a} style={styles.amenity}><Icon name="check" size={12} color={colors.green} strokeWidth={3} /><Text style={styles.amenityText}>{t[AMENITY_KEYS[a]]}</Text></View>
                ))}
              </View>
              {!!farm.poolDetails && <Text style={styles.small}>{t.cfPool}: {`\u2068${farm.poolDetails}\u2069`}</Text>}
            </Section>
          )}

          <Section title={t.cfRules}>
            {RULES.map(([k, v, ok]) => (
              <View key={k} style={styles.ruleRow}>
                <Text style={styles.ruleKey}>{k}</Text>
                <Text style={[styles.ruleVal, { color: ok ? colors.green : colors.danger }]}>{v}</Text>
              </View>
            ))}
            {!!r.musicTill && <Text style={styles.small}>• {t.cfMusicTill.replace('{time}', time12(r.musicTill))}</Text>}
            {r.minAge > 0 && <Text style={styles.small}>• {t.cfMinAge.replace('{n}', String(r.minAge))}</Text>}
            {!!r.other && <Text style={styles.small}>• {`\u2068${r.other}\u2069`}</Text>}
          </Section>

          {farm.addons.length > 0 && (
            <Section title={t.cfExtras}>
              {farm.addons.map((a, i) => (
                <View key={i} style={styles.ruleRow}><Text style={styles.ruleKey}>{`\u2068${a.name}\u2069`}</Text><Text style={styles.ruleVal}>{inr(a.price)}</Text></View>
              ))}
            </Section>
          )}

          <View style={styles.note}>
            {farm.securityDeposit > 0 && <Text style={styles.noteText}>• {t.cfDeposit.replace('{amount}', inr(farm.securityDeposit))}</Text>}
            <Text style={styles.noteText}>• {t.cfAddressAfter}</Text>
          </View>

          <Section title={t.cfPolicyTitle}><Text style={styles.small}>{t.cfPolicy}</Text></Section>

          {/* Booking */}
          <View style={styles.bookCard}>
            <Text style={styles.sectionTitle}>{t.cfBookTitle}</Text>
            <View style={styles.grid2}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t.cfDate}</Text>
                <DateField value={date} onChange={setDate} textStyle={styles.fieldInput} />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t.cfGuests}</Text>
                <TextInput value={guests} onChangeText={(v) => setGuests(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" style={styles.fieldInput} placeholder={`1–${farm.maxGuests}`} placeholderTextColor={colors.textMuted} />
              </View>
            </View>
            <Text style={styles.fieldLabel}>{t.cfStayType}</Text>
            <View style={styles.chipRow}>
              {offered.map((k) => (
                <TouchableOpacity key={k} style={[styles.pick, slot === k && styles.pickSel]} activeOpacity={0.85} onPress={() => setSlot(k)}>
                  <Text style={[styles.pickText, slot === k && styles.pickTextSel]}>{slotLabel(k, t)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>{t.cfOccasion}</Text>
            <View style={styles.chipRow}>
              {OCCASIONS.map((o) => (
                <TouchableOpacity key={o} style={[styles.pick, occasion === o && styles.pickSel]} activeOpacity={0.85} onPress={() => setOccasion((c) => (c === o ? '' : o))}>
                  <Text style={[styles.pickText, occasion === o && styles.pickTextSel]}>{({ Birthday: t.homeScreenOccasionBirthday, 'House party': t.homeScreenOccasionHouseParty, Wedding: t.homeScreenOccasionWedding, Reception: t.homeScreenOccasionReception, Corporate: t.homeScreenOccasionCorporate } as Record<string, string>)[o]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {checking && !quote && !quoteErr ? (
              <Text style={styles.small}>{t.cfChecking}</Text>
            ) : quoteErr ? (
              <Text style={styles.error}>{quoteErr}</Text>
            ) : quote ? (
              <View style={styles.priceBox}>
                <Row label={`${t.cfStayPrice} · ${timeRange(quote.checkIn, quote.checkOut)}${endsNextDay(quote.checkIn, quote.checkOut) ? ` (${t.cfNextDay})` : ''}`} value={inr(quote.basePrice)} />
                {quote.extraGuests > 0 && <Row label={t.cfExtraGuests.replace('{n}', String(quote.extraGuests))} value={inr(quote.extraGuestCharge)} />}
                <Row label={t.cfTotal} value={inr(quote.total)} bold />
                <View style={styles.divider} />
                <Row label={t.cfPayNow.replace('{pct}', String(quote.advancePct))} value={inr(quote.advanceAmount)} bold />
                <Row label={t.cfPayLater} value={inr(quote.balanceAmount)} />
              </View>
            ) : (
              <Text style={styles.small}>{t.cfErrPick}</Text>
            )}

            <TouchableOpacity style={styles.agreeRow} activeOpacity={0.85} onPress={() => setAgree((a) => !a)}>
              <View style={[styles.checkbox, agree && styles.checkboxOn]}>{agree && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}</View>
              <Text style={styles.agreeText}>{t.cfAgree}</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} disabled={!canPay} onPress={pay}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={[styles.payBtn, !canPay && { opacity: 0.5 }]}>
                {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payText}>{quote ? t.cfPayBtn.replace('{amount}', inr(quote.advanceAmount)) : t.cfBookTitle}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.bg },
  muted: { color: colors.textSoft, fontSize: 13.5 },
  link: { color: colors.pinkStrong, fontWeight: '800' },
  photo: { width: W, height: 240 },
  photoEmpty: { backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 10, left: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  photoCount: { position: 'absolute', bottom: 10, right: 14, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, fontWeight: '700', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, overflow: 'hidden' },
  content: { padding: 18, gap: 14 },
  name: { fontFamily: 'Sora', fontSize: 21, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textSoft, marginTop: 3 },
  section: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 8, ...shadow.card },
  sectionTitle: { fontFamily: 'Sora', fontSize: 15.5, fontWeight: '800', color: colors.text },
  body: { fontSize: 13.5, color: '#4b4560', lineHeight: 20 },
  small: { fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.divider },
  slotName: { fontSize: 14, fontWeight: '700', color: colors.text },
  slotPrice: { fontSize: 14, fontWeight: '800', color: colors.maroon },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { width: '31%', backgroundColor: colors.pinkBg, borderRadius: 12, padding: 10, alignItems: 'center' },
  factVal: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenity: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.greenBg, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  amenityText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  ruleKey: { flex: 1, fontSize: 13.5, color: colors.text },
  ruleVal: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  note: { backgroundColor: colors.amberBg, borderRadius: 14, padding: 12, gap: 4 },
  noteText: { fontSize: 12.5, color: colors.amber, lineHeight: 18 },
  bookCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 10, borderWidth: 1.5, borderColor: colors.pink },
  grid2: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, backgroundColor: colors.bg, borderRadius: 14, padding: 10 },
  fieldLabel: { fontSize: 11.5, color: colors.textMuted, fontWeight: '600' },
  fieldInput: { fontSize: 15, fontWeight: '700', color: colors.text, padding: 0, marginTop: 2 },
  pick: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.pinkBg },
  pickSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  pickText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  pickTextSel: { color: '#fff' },
  error: { color: colors.dangerStrong ?? colors.danger, fontSize: 13, fontWeight: '600' },
  priceBox: { backgroundColor: colors.bg, borderRadius: 14, padding: 12, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rowLabel: { flex: 1, fontSize: 13, color: colors.textSoft },
  rowValue: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider },
  agreeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.dividerStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  agreeText: { flex: 1, fontSize: 12.5, lineHeight: 19, color: colors.text },
  payBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  payText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
