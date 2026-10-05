import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { VenueTabBar } from '../components/TabBar';
import LanguageSheet from '../components/LanguageSheet';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pickImageBase64 } from '../utils/pickImage';
import { colors, gradients, shadow } from '../theme';

type PricingMode = 'rent' | 'perPlate';

type RemoteHall = {
  venueType: string;
  address: string;
  seated: number;
  floating: number;
  sqft: number;
  parking: number;
  rooms: number;
  pricingMode: PricingMode;
  rent: number;
  platePrice: number;
  minPlates: number;
  token: number;
  advancePct: number;
  ac: boolean;
  crockery: boolean;
  kitchen: boolean;
  crockeryNote: string;
  catering: string;
  amenities: string;
  blurb: string;
  photos: string[];
};

type Props = NativeStackScreenProps<RootStackParamList, 'Hall'>;

const VENUE_TYPES = ['Function Hall', 'Banquet Hall', 'Marriage Hall', 'Hotel'];
const CATERING_OPTIONS = ['In-house catering only', 'Outside caterers allowed', 'Both allowed'];

export default function HallScreen({ navigation }: Props) {
  const { partner, logout } = useAuth();
  const { lang, t } = useLanguage();
  const [langSheet, setLangSheet] = useState(false);

  const PRICING_MODES: Array<{ key: PricingMode; label: string; desc: string }> = [
    { key: 'rent', label: t.hallPricingRentLabel, desc: t.hallPricingRentDesc },
    { key: 'perPlate', label: t.hallPricingPerPlateLabel, desc: t.hallPricingPerPlateDesc },
  ];
  const NUM_FIELDS: Array<{ key: string; label: string }> = [
    { key: 'seated', label: t.hallSeatingCapacity },
    { key: 'floating', label: t.hallFloatingCapacity },
    { key: 'sqft', label: t.hallSizeSqft },
    { key: 'parking', label: t.hallParkingCars },
    { key: 'rooms', label: t.hallRooms },
    { key: 'token', label: t.hallTokenAmount },
    { key: 'advancePct', label: t.hallAdvancePctLabel },
  ];
  const TOGGLE_FIELDS: Array<{ key: string; label: string }> = [
    { key: 'ac', label: t.hallAirConditioned },
    { key: 'crockery', label: t.hallCrockeryAvailable },
    { key: 'kitchen', label: t.hallKitchenAvailable },
  ];
  const TOKEN_RULES = [
    t.hallTokenRule1,
    t.hallTokenRule2,
    t.hallTokenRule3,
    t.hallTokenRule4,
    t.hallTokenRule5,
  ];
  const [type, setType] = useState(partner?.venueType || VENUE_TYPES[0]);
  const [address, setAddress] = useState('');
  const [pricingMode, setPricingMode] = useState<PricingMode>('rent');
  const [rent, setRent] = useState('');
  const [platePrice, setPlatePrice] = useState('');
  const [minPlates, setMinPlates] = useState('');
  const [nums, setNums] = useState<Record<string, string>>({});
  const [toggles, setToggles] = useState<Record<string, boolean>>({ ac: true, crockery: false, kitchen: false });
  const [crockeryNote, setCrockeryNote] = useState('');
  const [catering, setCatering] = useState(CATERING_OPTIONS[0]);
  const [amenities, setAmenities] = useState('');
  const [blurb, setBlurb] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<RemoteHall | null>('/api/halls/me')
      .then((hall) => {
        if (!hall) return;
        setType(hall.venueType || VENUE_TYPES[0]);
        setAddress(hall.address);
        setNums({
          seated: String(hall.seated || ''),
          floating: String(hall.floating || ''),
          sqft: String(hall.sqft || ''),
          parking: String(hall.parking || ''),
          rooms: String(hall.rooms || ''),
          token: String(hall.token || ''),
          advancePct: String(hall.advancePct || 25),
        });
        setPricingMode(hall.pricingMode === 'perPlate' ? 'perPlate' : 'rent');
        setRent(String(hall.rent || ''));
        setPlatePrice(String(hall.platePrice || ''));
        setMinPlates(String(hall.minPlates || ''));
        setToggles({ ac: hall.ac, crockery: hall.crockery, kitchen: hall.kitchen });
        setCrockeryNote(hall.crockeryNote);
        setCatering(hall.catering || CATERING_OPTIONS[0]);
        setAmenities(hall.amenities);
        setBlurb(hall.blurb);
        setPhotos(hall.photos || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setNum = (key: string, v: string) => setNums((n) => ({ ...n, [key]: v.replace(/\D/g, '') }));
  const toggle = (key: string) => setToggles((t) => ({ ...t, [key]: !t[key] }));

  const pickPhoto = async (slot: number) => {
    const uri = await pickImageBase64();
    if (!uri) return;
    setPhotos((prev) => {
      const next = [...prev];
      next[slot] = uri;
      return next;
    });
  };

  const openMap = () => {
    if (address.trim()) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
  };

  const save = async () => {
    const seated = parseInt(nums.seated || '0', 10);
    const floating = parseInt(nums.floating || '0', 10);
    if (!(seated > 0) || !(floating > 0)) {
      return setErr(t.hallErrCapacity);
    }
    if (pricingMode === 'perPlate' && !(parseInt(platePrice || '0', 10) > 0)) {
      return setErr(t.hallErrPricePerPlate);
    }
    if (pricingMode === 'rent' && !(parseInt(rent || '0', 10) > 0)) {
      return setErr(t.hallErrRent);
    }
    setErr('');
    setSaving(true);
    try {
      await api.put('/api/halls/me', {
        venueType: type,
        address,
        seated,
        floating,
        sqft: parseInt(nums.sqft || '0', 10),
        parking: parseInt(nums.parking || '0', 10),
        rooms: parseInt(nums.rooms || '0', 10),
        pricingMode,
        rent: parseInt(rent || '0', 10),
        platePrice: parseInt(platePrice || '0', 10),
        minPlates: parseInt(minPlates || '0', 10),
        token: parseInt(nums.token || '0', 10),
        advancePct: parseInt(nums.advancePct || '0', 10) || 25,
        ac: toggles.ac,
        crockery: toggles.crockery,
        kitchen: toggles.kitchen,
        crockeryNote,
        catering,
        amenities,
        blurb,
        photos,
      });
      Alert.alert(t.hallSavedTitle, t.hallSavedMsg);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.hallErrSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <Text style={styles.title}>{t.hallTitle}</Text>
          <TouchableOpacity style={styles.langChip} activeOpacity={0.8} onPress={() => setLangSheet(true)}>
            <Text style={styles.langDevanagari}>अ</Text>
            <Text style={styles.langText}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>{t.hallHint}</Text>

        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel}>{t.hallPhotosLabel}</Text>
          <TouchableOpacity style={styles.mainPhoto} activeOpacity={0.85} onPress={() => pickPhoto(0)}>
            {photos[0] ? (
              <Image source={{ uri: photos[0] }} style={styles.mainPhotoImg} />
            ) : (
              <>
                <Icon name="camera" size={26} color={colors.pinkStrong} strokeWidth={1.5} />
                <Text style={styles.photoText}>{t.hallMainPhotoText}</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.subPhoto} activeOpacity={0.85} onPress={() => pickPhoto(1)}>
              {photos[1] ? <Image source={{ uri: photos[1] }} style={styles.subPhotoImg} /> : <Text style={styles.photoTextSm}>{t.hallPhotoStageDining}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.subPhoto} activeOpacity={0.85} onPress={() => pickPhoto(2)}>
              {photos[2] ? <Image source={{ uri: photos[2] }} style={styles.subPhotoImg} /> : <Text style={styles.photoTextSm}>{t.hallPhotoKitchenParking}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel}>{t.hallVenueTypeLabel}</Text>
          <View style={styles.chipRow}>
            {VENUE_TYPES.map((vt) => (
              <TouchableOpacity key={vt} style={[styles.chip, type === vt ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setType(vt)}>
                <Text style={[styles.chipText, type === vt && styles.chipTextSel]}>{vt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>{t.hallAddressLabel}</Text>
          <TextInput value={address} onChangeText={setAddress} multiline numberOfLines={2} style={[styles.input, styles.textarea]} />
        </View>

        <TouchableOpacity style={styles.mapLink} activeOpacity={0.7} onPress={openMap}>
          <Icon name="pin" size={14} color={colors.pinkStrong} />
          <Text style={styles.mapLinkText}>{t.hallMapLinkText}</Text>
        </TouchableOpacity>

        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel}>{t.hallPricingQuestion}</Text>
          <View style={{ gap: 8 }}>
            {PRICING_MODES.map((m) => {
              const sel = pricingMode === m.key;
              return (
                <TouchableOpacity key={m.key} style={[styles.pricingCard, sel && styles.pricingCardSel]} activeOpacity={0.85} onPress={() => setPricingMode(m.key)}>
                  <View style={[styles.radio, sel && styles.radioSel]}>{sel && <View style={styles.radioDot} />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pricingCardLabel}>{m.label}</Text>
                    <Text style={styles.pricingCardDesc}>{m.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {pricingMode === 'perPlate' ? (
          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabelSm}>{t.hallPricePerPlateLabel}</Text>
              <TextInput value={platePrice} onChangeText={(v) => setPlatePrice(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.inputSm} />
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabelSm}>{t.hallMinPlatesLabel}</Text>
              <TextInput value={minPlates} onChangeText={(v) => setMinPlates(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.inputSm} />
            </View>
          </View>
        ) : (
          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabelSm}>{t.hallRentFieldLabel}</Text>
              <TextInput value={rent} onChangeText={(v) => setRent(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.inputSm} />
            </View>
          </View>
        )}

        <View style={styles.grid2}>
          {NUM_FIELDS.map((f) => (
            <View key={f.key} style={styles.gridItem}>
              <Text style={styles.fieldLabelSm}>{f.label}</Text>
              <TextInput value={nums[f.key] || ''} onChangeText={(v) => setNum(f.key, v)} keyboardType="number-pad" style={styles.inputSm} />
            </View>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          {TOGGLE_FIELDS.map((tf) => (
            <TouchableOpacity key={tf.key} style={styles.toggleRow} activeOpacity={0.85} onPress={() => toggle(tf.key)}>
              <Text style={styles.toggleLabel}>{tf.label}</Text>
              <View style={[styles.toggleTrack, toggles[tf.key] && styles.toggleTrackOn]}>
                <View style={[styles.toggleKnob, toggles[tf.key] && styles.toggleKnobOn]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>{t.hallCrockeryDetailsLabel}</Text>
          <TextInput value={crockeryNote} onChangeText={setCrockeryNote} style={styles.input} />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel}>{t.hallCateringLabel}</Text>
          <View style={styles.chipRow}>
            {CATERING_OPTIONS.map((c) => (
              <TouchableOpacity key={c} style={[styles.chip, catering === c ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setCatering(c)}>
                <Text style={[styles.chipText, catering === c && styles.chipTextSel]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>{t.hallAmenitiesLabel}</Text>
          <TextInput value={amenities} onChangeText={setAmenities} style={styles.input} />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>{t.hallAboutLabel}</Text>
          <TextInput value={blurb} onChangeText={setBlurb} multiline numberOfLines={3} style={[styles.input, styles.textarea]} />
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>{t.hallTokenRulesTitle}</Text>
          {TOKEN_RULES.map((r) => (
            <Text key={r} style={styles.ruleLine}>• {r}</Text>
          ))}
        </View>

        <View style={styles.policyBox}>
          <Text style={styles.policyText}>
            {t.hallPolicyText}
          </Text>
        </View>

        {!!err && <Text style={styles.error}>{err}</Text>}

        <TouchableOpacity activeOpacity={0.85} onPress={save} disabled={saving || loading}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.saveBtn}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.hallSaveBtn}</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Chat', { customerName: t.tambooSupport })}
        >
          <Text style={styles.logoutText}>{t.tambooSupport}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={logout}>
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>
      </ScrollView>

      <VenueTabBar active="hall" navigation={navigation} />
      <LanguageSheet visible={langSheet} onClose={() => setLangSheet(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 8, gap: 14, paddingBottom: 24 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  langChip: { height: 34, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 5, ...shadow.card },
  langDevanagari: { color: colors.pink, fontWeight: '700' },
  langText: { fontWeight: '700', fontSize: 12.5, color: colors.text },
  hint: { fontSize: 12.5, color: colors.textSoft, lineHeight: 19 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },
  fieldLabelSm: { fontSize: 12, fontWeight: '600', color: colors.textSoft, marginBottom: 5 },
  mainPhoto: { height: 170, borderRadius: 16, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  mainPhotoImg: { width: '100%', height: '100%' },
  photoText: { fontSize: 12, color: colors.pinkStrong, fontWeight: '600' },
  photoRow: { flexDirection: 'row', gap: 8 },
  subPhoto: { flex: 1, height: 100, borderRadius: 14, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  subPhotoImg: { width: '100%', height: '100%' },
  photoTextSm: { fontSize: 11, color: colors.pinkStrong, fontWeight: '600', textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 36, paddingHorizontal: 13, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  input: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, fontSize: 14.5, color: colors.text, backgroundColor: colors.surface },
  textarea: { height: undefined, minHeight: 60, paddingTop: 10, textAlignVertical: 'top' },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  mapLinkText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13 },
  pricingCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1.5, borderColor: colors.divider, padding: 14 },
  pricingCardSel: { borderColor: colors.pink, backgroundColor: colors.pinkBg },
  pricingCardLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  pricingCardDesc: { fontSize: 12, color: colors.textSoft, marginTop: 2, lineHeight: 17 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.dividerStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  radioSel: { borderColor: colors.pink },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pink },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '47%' },
  inputSm: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 10, fontSize: 14.5, color: colors.text, backgroundColor: colors.surface },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 18, padding: 14, ...shadow.card },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  toggleTrack: { width: 44, height: 26, borderRadius: 999, backgroundColor: colors.divider, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: colors.pink },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: 3, ...shadow.card },
  toggleKnobOn: { marginLeft: 21 },
  rulesCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 5 },
  rulesTitle: { fontWeight: '700', fontSize: 13.5, color: colors.text },
  ruleLine: { fontSize: 12.5, color: '#4b4560', lineHeight: 18 },
  policyBox: { backgroundColor: colors.bg, borderRadius: 12, padding: 10 },
  policyText: { fontSize: 12, color: colors.textSoft, lineHeight: 18 },
  error: { color: colors.dangerStrong, fontSize: 12.5 },
  saveBtn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
  logoutBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: colors.text, fontWeight: '700', fontSize: 13.5 },
});
