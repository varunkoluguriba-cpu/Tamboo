import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiError } from '../api/client';
import { ROLE_KEY } from '../constants';
import type { PartnerRole } from '../types';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const CITIES = ['Hyderabad', 'Secunderabad', 'Warangal', 'Karimnagar', 'Vijayawada'];
const VENUE_TYPES = ['Function Hall', 'Banquet Hall', 'Marriage Hall', 'Hotel'];
const CATEGORIES = [
  { id: 'tent', name: 'Tent & Structures' },
  { id: 'seat', name: 'Seating' },
  { id: 'table', name: 'Tables' },
  { id: 'kitchen', name: 'Kitchen & Utensils' },
  { id: 'crockery', name: 'Crockery & Serving' },
  { id: 'floor', name: 'Flooring & Comfort' },
  { id: 'stage', name: 'Stage & Infrastructure' },
  { id: 'light', name: 'Lighting & Electrical' },
  { id: 'decor', name: 'Decor' },
  { id: 'av', name: 'Sound & AV' },
  { id: 'staff', name: 'Staff & Services' },
];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.chip, selected ? styles.chipSel : styles.chipUnsel]}>
      <Text style={[styles.chipText, selected && styles.chipTextSel]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { t } = useLanguage();

  function soon() {
    Alert.alert(t.comingSoon, t.pRegisterComingSoonMsg);
  }

  const [role, setRole] = useState<PartnerRole>('tent');
  const [biz, setBiz] = useState('');
  const [owner, setOwner] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [area, setArea] = useState('');
  const [venueType, setVenueType] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [tax, setTax] = useState('');
  const [bank, setBank] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ROLE_KEY).then((v) => {
      if (v === 'tent' || v === 'venue') setRole(v);
    }).catch(() => {});
  }, []);

  const roleNoun = role === 'venue' ? t.pRegisterRoleHall : t.pRegisterRoleTentHouse;

  const toggleCat = (id: string) => {
    setCats((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const submit = async () => {
    if (biz.trim().length < 3) return setErr(t.pRegisterErrBizName);
    if (!owner.trim()) return setErr(t.pRegisterErrOwnerName);
    if (role === 'venue' && !venueType) return setErr(t.pRegisterErrVenueType);
    if (!tax.trim()) return setErr(t.pRegisterErrTaxId);
    if (!bank.trim()) return setErr(t.pRegisterErrBank);
    setErr('');
    setSubmitting(true);
    try {
      await register({
        role,
        businessName: biz.trim(),
        ownerName: owner.trim(),
        city,
        area: area.trim(),
        venueType: role === 'venue' ? venueType : undefined,
        categories: role === 'tent' ? cats : undefined,
        taxId: tax.trim().toUpperCase(),
        bankAccount: bank.trim(),
      });
      navigation.replace('PendingReview');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.pRegisterErrSubmit);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.verifiedBadge}>
          <Icon name="check" size={14} color={colors.green} strokeWidth={3} />
          <Text style={styles.verifiedText}>{t.pRegisterMobileVerified}</Text>
        </View>

        <View>
          <Text style={styles.title}>{t.pRegisterTitle.replace('{roleNoun}', roleNoun)}</Text>
          <Text style={styles.subtitle}>{t.pRegisterSubtitle}</Text>
        </View>

        <Field label={t.pRegisterBusinessName}>
          <TextInput value={biz} onChangeText={setBiz} style={styles.input} placeholder={t.pRegisterBizNamePlaceholder} placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label={t.pRegisterOwnerName}>
          <TextInput value={owner} onChangeText={setOwner} style={styles.input} placeholder={t.pRegisterOwnerNamePlaceholder} placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label={t.pRegisterCity}>
          <View style={styles.chipRow}>
            {CITIES.map((c) => (
              <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
            ))}
          </View>
        </Field>

        <Field label={t.pRegisterArea}>
          <TextInput value={area} onChangeText={setArea} style={styles.input} placeholder={t.pRegisterAreaPlaceholder} placeholderTextColor={colors.textMuted} />
        </Field>

        {role === 'venue' ? (
          <Field label={t.pRegisterVenueType}>
            <View style={styles.chipRow}>
              {VENUE_TYPES.map((v) => (
                <Chip key={v} label={v} selected={venueType === v} onPress={() => setVenueType(v)} />
              ))}
            </View>
          </Field>
        ) : (
          <Field label={t.pRegisterCategoriesLabel}>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Chip key={c.id} label={c.name} selected={cats.includes(c.id)} onPress={() => toggleCat(c.id)} />
              ))}
            </View>
          </Field>
        )}

        <Field label={t.pRegisterTaxId}>
          <TextInput value={tax} onChangeText={(v) => setTax(v.toUpperCase())} style={styles.input} placeholder="36ABCDE1234F1Z5" placeholderTextColor={colors.textMuted} autoCapitalize="characters" />
        </Field>

        <TouchableOpacity style={styles.photoBtn} activeOpacity={0.85} onPress={soon}>
          <Icon name="camera" size={16} color={colors.textSoft} />
          <Text style={styles.photoBtnText}>{role === 'venue' ? t.pRegisterPhotosHallOptional : t.pRegisterPhotoSetupOptional}</Text>
        </TouchableOpacity>

        <Field label={t.pRegisterBankAccount}>
          <TextInput value={bank} onChangeText={setBank} style={styles.input} placeholder={t.pRegisterBankPlaceholder} placeholderTextColor={colors.textMuted} />
        </Field>

        {!!err && <Text style={styles.error}>{err}</Text>}

        <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={submitting}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}>
            <Text style={styles.submitBtnText}>{submitting ? '…' : t.pRegisterSubmitButton}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 22, paddingTop: 10, gap: 16 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.greenBg, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  verifiedText: { color: colors.green, fontWeight: '700', fontSize: 12.5 },
  title: { fontFamily: 'Sora', fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13.5, color: colors.textSoft },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },
  input: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 14, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 13, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  photoBtn: { height: 44, borderRadius: 14, borderWidth: 1.5, borderColor: colors.dividerStrong, borderStyle: 'dashed', backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoBtnText: { color: colors.textSoft, fontWeight: '600', fontSize: 13 },
  error: { color: colors.dangerStrong, fontSize: 12.5 },
  submitBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 4, ...shadow.primaryButton },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
});
