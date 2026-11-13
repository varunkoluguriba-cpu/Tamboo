import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pickImageBase64 } from '../utils/pickImage';
import { AMENITIES, SLOT_KEYS, endsNextDay, fromMin, slotLabel, time12, toMin, type FarmRules, type FarmSlot, type MyFarm, type SlotKey } from '../utils/farm';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FFarm'>;

const MAX_PHOTOS = 15;
const DEFAULT_SLOTS: Record<SlotKey, FarmSlot> = {
  day: { enabled: true, start: '09:00', end: '18:00', weekdayPrice: 0, weekendPrice: 0 },
  night: { enabled: false, start: '19:00', end: '09:00', weekdayPrice: 0, weekendPrice: 0 },
  fullDay: { enabled: false, start: '11:00', end: '10:00', weekdayPrice: 0, weekendPrice: 0 },
};
const DEFAULT_RULES: FarmRules = {
  eventsAllowed: true, alcoholAllowed: false, outsideFoodAllowed: true, djAllowed: false,
  petsAllowed: false, smokingOutdoorOnly: true, musicTill: '22:00', minAge: 18, other: '',
};
const MUSIC_TILL = ['', '22:00', '23:00', '00:00'];
const MIN_AGES = [18, 21, 25];
const NUMS = ['maxGuests', 'includedGuests', 'extraGuestCharge', 'bedrooms', 'acRooms', 'beds', 'bathrooms', 'lawnSqft', 'parkingCars', 'distanceFromCityKm', 'securityDeposit', 'advancePct'] as const;
type NumKey = typeof NUMS[number];
const digits = (v: string) => v.replace(/\D/g, '');
const numStr = (n: number | undefined) => (n ? String(n) : '');

export default function FFarmScreen({ navigation, route }: Props) {
  const farmId = route.params?.farmId;
  const { partner } = useAuth();
  const { t } = useLanguage();
  const pct = partner?.commissionPct ?? 10;

  const [name, setName] = useState('');
  const [area, setArea] = useState(partner?.area || '');
  const [address, setAddress] = useState('');
  const [about, setAbout] = useState('');
  const [poolDetails, setPoolDetails] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [slots, setSlots] = useState<Record<SlotKey, FarmSlot>>(DEFAULT_SLOTS);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [nums, setNums] = useState<Record<NumKey, string>>({ advancePct: '30' } as Record<NumKey, string>);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [rules, setRules] = useState<FarmRules>(DEFAULT_RULES);
  const [addons, setAddons] = useState<Array<{ name: string; price: string }>>([]);
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(!!farmId);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!farmId) return;
    api.get<MyFarm[]>('/api/farms/me/farms')
      .then((list) => {
        const f = list.find((x) => x.id === farmId);
        if (!f) return;
        setName(f.name); setArea(f.area); setAddress(f.address); setAbout(f.about); setPoolDetails(f.poolDetails);
        setLat(f.lat); setLng(f.lng); setPhotos(f.photos || []); setSlots({ ...DEFAULT_SLOTS, ...f.slots });
        const p: Record<string, string> = {};
        for (const s of SLOT_KEYS) { p[`${s}.weekday`] = numStr(f.slots[s]?.weekdayPrice); p[`${s}.weekend`] = numStr(f.slots[s]?.weekendPrice); }
        setPrices(p);
        const n = {} as Record<NumKey, string>;
        for (const k of NUMS) n[k] = numStr(f[k]);
        setNums(n);
        setAmenities(f.amenities || []); setRules({ ...DEFAULT_RULES, ...f.rules });
        setAddons((f.addons || []).map((a) => ({ name: a.name, price: numStr(a.price) })));
        setPublished(f.published);
      })
      .catch(() => setErr(t.loadFailedMsg))
      .finally(() => setLoading(false));
  }, [farmId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSlot = (s: SlotKey, patch: Partial<FarmSlot>) => setSlots((all) => ({ ...all, [s]: { ...all[s], ...patch } }));
  const stepTime = (s: SlotKey, which: 'start' | 'end', delta: number) => setSlot(s, { [which]: fromMin(toMin(slots[s][which]) + delta) });
  const toggleAmenity = (code: string) => setAmenities((l) => (l.includes(code) ? l.filter((x) => x !== code) : [...l, code]));
  const setRule = <K extends keyof FarmRules>(k: K, v: FarmRules[K]) => setRules((r) => ({ ...r, [k]: v }));

  const addPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const uri = await pickImageBase64();
    if (uri) setPhotos((prev) => [...prev, uri].slice(0, MAX_PHOTOS));
  };

  const useCurrentLocation = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return Alert.alert(t.hallLocationErrTitle, t.hallLocationErr);
    }
    setLocating(true);
    Geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false); },
      () => { setLocating(false); Alert.alert(t.hallLocationErrTitle, t.hallLocationErr); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const save = async () => {
    const n = (k: NumKey) => parseInt(nums[k] || '0', 10) || 0;
    const price = (s: SlotKey, w: 'weekday' | 'weekend') => parseInt(prices[`${s}.${w}`] || '0', 10) || 0;
    if (name.trim().length < 3) return setErr(t.pfErrName);
    if (!SLOT_KEYS.some((s) => slots[s].enabled)) return setErr(t.pfErrSlot);
    if (SLOT_KEYS.some((s) => slots[s].enabled && price(s, 'weekday') <= 0)) return setErr(t.pfErrPrice);
    if (n('maxGuests') <= 0) return setErr(t.pfErrGuests);
    if (n('includedGuests') > n('maxGuests')) return setErr(t.pfErrIncluded);
    const adv = nums.advancePct ? n('advancePct') : 30;
    if (adv < 10 || adv > 100) return setErr(t.pfErrAdvance);
    setErr('');
    setSaving(true);
    try {
      const body = {
        name: name.trim(), area: area.trim(), address: address.trim(), about: about.trim(), poolDetails: poolDetails.trim(), lat, lng, photos,
        slots: Object.fromEntries(SLOT_KEYS.map((s) => [s, { ...slots[s], weekdayPrice: price(s, 'weekday'), weekendPrice: price(s, 'weekend') }])),
        maxGuests: n('maxGuests'), includedGuests: n('includedGuests'), extraGuestCharge: n('extraGuestCharge'),
        bedrooms: n('bedrooms'), acRooms: n('acRooms'), beds: n('beds'), bathrooms: n('bathrooms'), lawnSqft: n('lawnSqft'),
        parkingCars: n('parkingCars'), distanceFromCityKm: n('distanceFromCityKm'), securityDeposit: n('securityDeposit'), advancePct: adv,
        amenities, rules, addons: addons.filter((a) => a.name.trim()).map((a) => ({ name: a.name.trim(), price: parseInt(a.price || '0', 10) || 0 })),
        published,
      };
      if (farmId) await api.put(`/api/farms/me/farms/${farmId}`, body);
      else await api.post('/api/farms/me/farms', body);
      Alert.alert(t.pfSavedTitle, t.pfSavedMsg, [{ text: t.ok, onPress: () => navigation.goBack() }]);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.pfErrSave);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator color={colors.pink} /></SafeAreaView>;

  const numField = (k: NumKey, label: string) => (
    <View key={k} style={styles.gridItem}>
      <Text style={styles.labelSm}>{label}</Text>
      <TextInput value={nums[k] || ''} onChangeText={(v) => setNums((x) => ({ ...x, [k]: digits(v) }))} keyboardType="number-pad" style={styles.inputSm} />
    </View>
  );
  const toggleRow = (label: string, on: boolean, onPress: () => void) => (
    <TouchableOpacity key={label} style={styles.toggleRow} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.track, on && styles.trackOn]}><View style={[styles.knob, on && styles.knobOn]} /></View>
    </TouchableOpacity>
  );
  const chip = (key: string, label: string, sel: boolean, onPress: () => void) => (
    <TouchableOpacity key={key} style={[styles.chip, sel ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={onPress}>
      <Text style={[styles.chipText, sel && styles.chipTextSel]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <TouchableOpacity style={styles.back} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{farmId ? t.pfEditTitle : t.pfNewTitle}</Text>
        </View>
        <Text style={styles.hint}>{t.pfFormHint}</Text>

        {/* Basics */}
        <Text style={styles.section}>{t.pfSecBasics}</Text>
        <Field label={t.pfName}><TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t.pfNamePh} placeholderTextColor={colors.textMuted} /></Field>
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>{t.pfPhotos}</Text>
          <View style={styles.photoGrid}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                <TouchableOpacity style={styles.thumbX} activeOpacity={0.8} onPress={() => setPhotos((p) => p.filter((_, i) => i !== idx))}>
                  <Icon name="x" size={12} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity style={styles.addTile} activeOpacity={0.85} onPress={addPhoto}>
                <Icon name="camera" size={22} color={colors.pinkStrong} strokeWidth={1.5} />
                <Text style={styles.addTileText}>{t.hallAddPhoto}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.count}>{photos.length}/{MAX_PHOTOS}</Text>
        </View>
        <Field label={t.pfArea}><TextInput value={area} onChangeText={setArea} style={styles.input} placeholder={t.pfAreaPh} placeholderTextColor={colors.textMuted} /></Field>
        <View style={styles.grid2}>{numField('distanceFromCityKm', t.pfDistance)}</View>
        <Field label={t.pfAddress}><TextInput value={address} onChangeText={setAddress} multiline style={[styles.input, styles.textarea]} /></Field>
        <View style={{ gap: 6 }}>
          <TouchableOpacity style={styles.locBtn} activeOpacity={0.85} onPress={useCurrentLocation} disabled={locating}>
            {locating ? <ActivityIndicator size="small" color={colors.pinkStrong} /> : <Icon name="pin" size={14} color={colors.pinkStrong} />}
            <Text style={styles.locBtnText}>{locating ? t.hallLocatingText : t.hallUseLocationBtn}</Text>
          </TouchableOpacity>
          {lat != null && lng != null && <Text style={styles.locSet}>{t.hallLocationSetText}</Text>}
        </View>
        <Field label={t.pfAbout}><TextInput value={about} onChangeText={setAbout} multiline style={[styles.input, styles.textarea]} placeholder={t.pfAboutPh} placeholderTextColor={colors.textMuted} /></Field>

        {/* Stay types & prices */}
        <Text style={styles.section}>{t.pfSecSlots}</Text>
        <Text style={styles.hint}>{t.pfSlotsHint}</Text>
        {SLOT_KEYS.map((s) => {
          const c = slots[s];
          return (
            <View key={s} style={[styles.slotCard, c.enabled && styles.slotCardOn]}>
              {toggleRow(slotLabel(s, t), c.enabled, () => setSlot(s, { enabled: !c.enabled }))}
              {c.enabled && (
                <View style={{ gap: 10, paddingHorizontal: 4, paddingBottom: 4 }}>
                  <TimeStepper label={t.pfCheckIn} value={c.start} onStep={(d) => stepTime(s, 'start', d)} />
                  <TimeStepper label={t.pfCheckOut} value={c.end} suffix={endsNextDay(c) ? t.pfNextDay : ''} onStep={(d) => stepTime(s, 'end', d)} />
                  <View style={styles.grid2}>
                    <View style={styles.gridItem}>
                      <Text style={styles.labelSm}>{t.pfWeekdayPrice}</Text>
                      <TextInput value={prices[`${s}.weekday`] || ''} onChangeText={(v) => setPrices((p) => ({ ...p, [`${s}.weekday`]: digits(v) }))} keyboardType="number-pad" style={styles.inputSm} />
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.labelSm}>{t.pfWeekendPrice}</Text>
                      <TextInput value={prices[`${s}.weekend`] || ''} onChangeText={(v) => setPrices((p) => ({ ...p, [`${s}.weekend`]: digits(v) }))} keyboardType="number-pad" style={styles.inputSm} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Guests & rooms */}
        <Text style={styles.section}>{t.pfSecGuests}</Text>
        <View style={styles.grid2}>
          {numField('maxGuests', t.pfMaxGuests)}
          {numField('includedGuests', t.pfIncludedGuests)}
          {numField('extraGuestCharge', t.pfExtraGuest)}
          {numField('bedrooms', t.pfBedrooms)}
          {numField('acRooms', t.pfAcRooms)}
          {numField('beds', t.pfBeds)}
          {numField('bathrooms', t.pfBathrooms)}
          {numField('lawnSqft', t.pfLawn)}
          {numField('parkingCars', t.pfParking)}
        </View>

        {/* Amenities */}
        <Text style={styles.section}>{t.pfSecAmenities}</Text>
        <View style={styles.chipRow}>
          {AMENITIES.map((a) => chip(a.code, t[a.key], amenities.includes(a.code), () => toggleAmenity(a.code)))}
        </View>
        {(amenities.includes('pool') || amenities.includes('kidsPool')) && (
          <Field label={t.pfPoolDetails}><TextInput value={poolDetails} onChangeText={setPoolDetails} style={styles.input} placeholder={t.pfPoolDetailsPh} placeholderTextColor={colors.textMuted} /></Field>
        )}

        {/* House rules */}
        <Text style={styles.section}>{t.pfSecRules}</Text>
        <View style={{ gap: 8 }}>
          {toggleRow(t.pfRuleEvents, rules.eventsAllowed, () => setRule('eventsAllowed', !rules.eventsAllowed))}
          {toggleRow(t.pfRuleAlcohol, rules.alcoholAllowed, () => setRule('alcoholAllowed', !rules.alcoholAllowed))}
          {toggleRow(t.pfRuleOutsideFood, rules.outsideFoodAllowed, () => setRule('outsideFoodAllowed', !rules.outsideFoodAllowed))}
          {toggleRow(t.pfRuleDj, rules.djAllowed, () => setRule('djAllowed', !rules.djAllowed))}
          {toggleRow(t.pfRulePets, rules.petsAllowed, () => setRule('petsAllowed', !rules.petsAllowed))}
          {toggleRow(t.pfRuleSmoking, rules.smokingOutdoorOnly, () => setRule('smokingOutdoorOnly', !rules.smokingOutdoorOnly))}
        </View>
        <Field label={t.pfMusicTill}>
          <View style={styles.chipRow}>
            {MUSIC_TILL.map((m) => chip(m || 'none', m ? time12(m) : t.pfNoLimit, rules.musicTill === m, () => setRule('musicTill', m)))}
          </View>
        </Field>
        <Field label={t.pfMinAge}>
          <View style={styles.chipRow}>
            {MIN_AGES.map((a) => chip(String(a), `${a}+`, rules.minAge === a, () => setRule('minAge', a)))}
          </View>
        </Field>
        <Field label={t.pfOtherRules}><TextInput value={rules.other} onChangeText={(v) => setRule('other', v)} multiline style={[styles.input, styles.textarea]} placeholder={t.pfOtherRulesPh} placeholderTextColor={colors.textMuted} /></Field>

        {/* Payment */}
        <Text style={styles.section}>{t.pfSecMoney}</Text>
        <View style={styles.grid2}>
          {numField('advancePct', t.pfAdvancePct)}
          {numField('securityDeposit', t.pfDeposit)}
        </View>
        <Text style={styles.hint}>{t.pfAdvanceHint}</Text>
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>{t.pfAddons}</Text>
          <Text style={styles.hint}>{t.pfAddonsHint}</Text>
          {addons.map((a, i) => (
            <View key={i} style={styles.addonRow}>
              <TextInput value={a.name} onChangeText={(v) => setAddons((l) => l.map((x, j) => (j === i ? { ...x, name: v } : x)))} style={[styles.inputSm, { flex: 1 }]} placeholder={t.pfAddonName} placeholderTextColor={colors.textMuted} />
              <TextInput value={a.price} onChangeText={(v) => setAddons((l) => l.map((x, j) => (j === i ? { ...x, price: digits(v) } : x)))} keyboardType="number-pad" style={[styles.inputSm, { width: 96 }]} placeholder="₹" placeholderTextColor={colors.textMuted} />
              <TouchableOpacity style={styles.addonX} activeOpacity={0.8} onPress={() => setAddons((l) => l.filter((_, j) => j !== i))}>
                <Icon name="x" size={14} color={colors.textSoft} />
              </TouchableOpacity>
            </View>
          ))}
          {addons.length < 15 && (
            <TouchableOpacity style={styles.locBtn} activeOpacity={0.85} onPress={() => setAddons((l) => [...l, { name: '', price: '' }])}>
              <Icon name="plus" size={14} color={colors.pinkStrong} />
              <Text style={styles.locBtnText}>{t.pfAddAddon}</Text>
            </TouchableOpacity>
          )}
        </View>

        {toggleRow(t.pfPublished, published, () => setPublished(!published))}

        <View style={styles.policy}><Text style={styles.policyText}>{t.pfPolicy.replace('{pct}', String(pct))}</Text></View>

        {!!err && <Text style={styles.error}>{err}</Text>}
        <TouchableOpacity activeOpacity={0.85} onPress={save} disabled={saving}>
          <View style={styles.saveBtn}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={StyleSheet.absoluteFill} />
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t.pfSave}</Text>}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ gap: 6 }}><Text style={styles.label}>{label}</Text>{children}</View>;
}

// Half-hour steps — no typing, so a check-in time can never be malformed.
function TimeStepper({ label, value, suffix, onStep }: { label: string; value: string; suffix?: string; onStep: (deltaMin: number) => void }) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepLabel}>{label}</Text>
      <TouchableOpacity style={styles.stepBtn} activeOpacity={0.8} onPress={() => onStep(-30)}><Icon name="minus" size={16} color={colors.pinkStrong} /></TouchableOpacity>
      <View style={styles.stepValueWrap}>
        <Text style={styles.stepValue}>{time12(value)}</Text>
        {!!suffix && <Text style={styles.stepSuffix}>{suffix}</Text>}
      </View>
      <TouchableOpacity style={styles.stepBtn} activeOpacity={0.8} onPress={() => onStep(30)}><Icon name="plus" size={16} color={colors.pinkStrong} /></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 14, paddingBottom: 30 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { flex: 1, fontFamily: 'Sora', fontSize: 21, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12.5, color: colors.textSoft, lineHeight: 19 },
  section: { fontFamily: 'Sora', fontSize: 16, fontWeight: '800', color: colors.maroon, marginTop: 8 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },
  labelSm: { fontSize: 12, fontWeight: '600', color: colors.textSoft, marginBottom: 5 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, fontSize: 14.5, color: colors.text, backgroundColor: colors.surface },
  textarea: { minHeight: 70, paddingTop: 10, textAlignVertical: 'top' },
  inputSm: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 10, fontSize: 14.5, color: colors.text, backgroundColor: colors.surface },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '47%', justifyContent: 'flex-end' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { width: 100, height: 100, borderRadius: 14, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  thumbX: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  addTile: { width: 100, height: 100, borderRadius: 14, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.divider, borderStyle: 'dashed' },
  addTileText: { fontSize: 11, color: colors.pinkStrong, fontWeight: '600', textAlign: 'center' },
  count: { fontSize: 11, color: colors.textMuted, textAlign: 'right' },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.pinkBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  locBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13 },
  locSet: { color: colors.green, fontWeight: '600', fontSize: 12 },
  slotCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1.5, borderColor: colors.divider, padding: 4, gap: 6 },
  slotCardOn: { borderColor: colors.pink },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textSoft },
  stepBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  stepValueWrap: { minWidth: 92, alignItems: 'center' },
  stepValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  stepSuffix: { fontSize: 11, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 36, paddingHorizontal: 13, paddingVertical: 6, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 14, ...shadow.card },
  toggleLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  track: { width: 44, height: 26, borderRadius: 999, backgroundColor: colors.divider, justifyContent: 'center' },
  trackOn: { backgroundColor: colors.pink },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: 3, ...shadow.card },
  knobOn: { marginLeft: 21 },
  addonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addonX: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  policy: { backgroundColor: colors.surface, borderRadius: 14, padding: 12 },
  policyText: { fontSize: 12, color: colors.textSoft, lineHeight: 18 },
  error: { color: colors.dangerStrong, fontSize: 12.5 },
  saveBtn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
});
