import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
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

function soon() {
  Alert.alert('Coming soon', 'This is being built next.');
}

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

  const roleNoun = role === 'venue' ? 'hall' : 'tent house';

  const toggleCat = (id: string) => {
    setCats((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const submit = async () => {
    if (biz.trim().length < 3) return setErr('Enter your business name');
    if (!owner.trim()) return setErr('Enter the owner name');
    if (role === 'venue' && !venueType) return setErr('Pick the type of venue');
    if (!tax.trim()) return setErr('Enter your GSTIN or PAN');
    if (!bank.trim()) return setErr('Enter a bank account or UPI ID for payouts');
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
      setErr(e instanceof ApiError ? e.message : 'Could not submit. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.verifiedBadge}>
          <Icon name="check" size={14} color={colors.green} strokeWidth={3} />
          <Text style={styles.verifiedText}>Mobile verified</Text>
        </View>

        <View>
          <Text style={styles.title}>Register your {roleNoun}</Text>
          <Text style={styles.subtitle}>Our team verifies every partner before customers can book. Takes about 48 hours.</Text>
        </View>

        <Field label="Business name">
          <TextInput value={biz} onChangeText={setBiz} style={styles.input} placeholder="Sri Balaji Tent House" placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label="Owner name">
          <TextInput value={owner} onChangeText={setOwner} style={styles.input} placeholder="Ramesh Goud" placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label="City">
          <View style={styles.chipRow}>
            {CITIES.map((c) => (
              <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
            ))}
          </View>
        </Field>

        <Field label="Area">
          <TextInput value={area} onChangeText={setArea} style={styles.input} placeholder="Dilsukhnagar" placeholderTextColor={colors.textMuted} />
        </Field>

        {role === 'venue' ? (
          <Field label="Type of venue">
            <View style={styles.chipRow}>
              {VENUE_TYPES.map((v) => (
                <Chip key={v} label={v} selected={venueType === v} onPress={() => setVenueType(v)} />
              ))}
            </View>
          </Field>
        ) : (
          <Field label="What do you rent out?">
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Chip key={c.id} label={c.name} selected={cats.includes(c.id)} onPress={() => toggleCat(c.id)} />
              ))}
            </View>
          </Field>
        )}

        <Field label="GSTIN or PAN">
          <TextInput value={tax} onChangeText={(v) => setTax(v.toUpperCase())} style={styles.input} placeholder="36ABCDE1234F1Z5" placeholderTextColor={colors.textMuted} autoCapitalize="characters" />
        </Field>

        <TouchableOpacity style={styles.photoBtn} activeOpacity={0.85} onPress={soon}>
          <Icon name="camera" size={16} color={colors.textSoft} />
          <Text style={styles.photoBtnText}>{role === 'venue' ? 'Photos of the hall' : 'Photo of your setup'} (optional)</Text>
        </TouchableOpacity>

        <Field label="Bank account for payouts">
          <TextInput value={bank} onChangeText={setBank} style={styles.input} placeholder="Account number or UPI ID" placeholderTextColor={colors.textMuted} />
        </Field>

        {!!err && <Text style={styles.error}>{err}</Text>}

        <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={submitting}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}>
            <Text style={styles.submitBtnText}>{submitting ? '…' : 'Submit for verification'}</Text>
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
