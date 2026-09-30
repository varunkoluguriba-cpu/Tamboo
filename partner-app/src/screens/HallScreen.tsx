import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { VenueTabBar } from '../components/TabBar';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Hall'>;

const VENUE_TYPES = ['Function Hall', 'Banquet Hall', 'Marriage Hall', 'Hotel'];
const CATERING_OPTIONS = ['In-house catering only', 'Outside caterers allowed', 'Both allowed'];
const NUM_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'seated', label: 'Seating capacity' },
  { key: 'floating', label: 'Floating capacity' },
  { key: 'sqft', label: 'Hall size (sq ft)' },
  { key: 'parking', label: 'Parking (cars)' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'rent', label: 'Rent per slot (₹)' },
  { key: 'token', label: 'Token amount (₹, max 10,000)' },
];
const TOGGLE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'ac', label: 'Air conditioned' },
  { key: 'crockery', label: 'Crockery available' },
  { key: 'kitchen', label: 'Kitchen available' },
];
const TOKEN_RULES = [
  'Token max ₹10,000, paid to you minus 5% Tamboo commission',
  "Customer doesn't visit in 48 hours: you keep the token",
  'Customer visits, decides not to book: you get 20%, customer gets 80% back',
  'Customer cancels within 2 hours: full refund to customer',
  "Hall doesn't match listing: full refund to customer, reviewed by Tamboo",
];

function soon() {
  Alert.alert('Coming soon', 'This is being built next.');
}

export default function HallScreen({ navigation }: Props) {
  const { partner, logout } = useAuth();
  const [type, setType] = useState(partner?.venueType || VENUE_TYPES[0]);
  const [address, setAddress] = useState('');
  const [nums, setNums] = useState<Record<string, string>>({});
  const [toggles, setToggles] = useState<Record<string, boolean>>({ ac: true, crockery: false, kitchen: false });
  const [crockeryNote, setCrockeryNote] = useState('');
  const [catering, setCatering] = useState(CATERING_OPTIONS[0]);
  const [amenities, setAmenities] = useState('');
  const [blurb, setBlurb] = useState('');
  const [err, setErr] = useState('');

  const setNum = (key: string, v: string) => setNums((n) => ({ ...n, [key]: v.replace(/\D/g, '') }));
  const toggle = (key: string) => setToggles((t) => ({ ...t, [key]: !t[key] }));

  const save = () => {
    if (!(parseInt(nums.seated || '0', 10) > 0) || !(parseInt(nums.floating || '0', 10) > 0)) {
      return setErr('Enter seating and floating capacity');
    }
    setErr('');
    Alert.alert('Hall page saved', 'Customers will see the updated details.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <Text style={styles.title}>My hall</Text>
          <View style={styles.langChip}>
            <Text style={styles.langDevanagari}>अ</Text>
            <Text style={styles.langText}>EN</Text>
          </View>
        </View>
        <Text style={styles.hint}>Everything here shows on your hall page in the customer app.</Text>

        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel}>Photos (tap to upload from your phone)</Text>
          <TouchableOpacity style={styles.mainPhoto} activeOpacity={0.85} onPress={soon}>
            <Icon name="camera" size={26} color={colors.pinkStrong} strokeWidth={1.5} />
            <Text style={styles.photoText}>Main photo of the hall</Text>
          </TouchableOpacity>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.subPhoto} activeOpacity={0.85} onPress={soon}>
              <Text style={styles.photoTextSm}>Stage / dining</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.subPhoto} activeOpacity={0.85} onPress={soon}>
              <Text style={styles.photoTextSm}>Kitchen / parking</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel}>Venue type</Text>
          <View style={styles.chipRow}>
            {VENUE_TYPES.map((t) => (
              <TouchableOpacity key={t} style={[styles.chip, type === t ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setType(t)}>
                <Text style={[styles.chipText, type === t && styles.chipTextSel]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>Full address (used for the map)</Text>
          <TextInput value={address} onChangeText={setAddress} multiline numberOfLines={2} style={[styles.input, styles.textarea]} />
        </View>

        <TouchableOpacity style={styles.mapLink} activeOpacity={0.7} onPress={soon}>
          <Icon name="pin" size={14} color={colors.pinkStrong} />
          <Text style={styles.mapLinkText}>Check the location on Google Maps</Text>
        </TouchableOpacity>

        <View style={styles.grid2}>
          {NUM_FIELDS.map((f) => (
            <View key={f.key} style={styles.gridItem}>
              <Text style={styles.fieldLabelSm}>{f.label}</Text>
              <TextInput value={nums[f.key] || ''} onChangeText={(v) => setNum(f.key, v)} keyboardType="number-pad" style={styles.inputSm} />
            </View>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          {TOGGLE_FIELDS.map((t) => (
            <TouchableOpacity key={t.key} style={styles.toggleRow} activeOpacity={0.85} onPress={() => toggle(t.key)}>
              <Text style={styles.toggleLabel}>{t.label}</Text>
              <View style={[styles.toggleTrack, toggles[t.key] && styles.toggleTrackOn]}>
                <View style={[styles.toggleKnob, toggles[t.key] && styles.toggleKnobOn]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>Crockery details for customers</Text>
          <TextInput value={crockeryNote} onChangeText={setCrockeryNote} style={styles.input} />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel}>Catering</Text>
          <View style={styles.chipRow}>
            {CATERING_OPTIONS.map((c) => (
              <TouchableOpacity key={c} style={[styles.chip, catering === c ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setCatering(c)}>
                <Text style={[styles.chipText, catering === c && styles.chipTextSel]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>Amenities (comma separated)</Text>
          <TextInput value={amenities} onChangeText={setAmenities} style={styles.input} />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>About the hall</Text>
          <TextInput value={blurb} onChangeText={setBlurb} multiline numberOfLines={3} style={[styles.input, styles.textarea]} />
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Token rules</Text>
          {TOKEN_RULES.map((r) => (
            <Text key={r} style={styles.ruleLine}>• {r}</Text>
          ))}
        </View>

        <View style={styles.policyBox}>
          <Text style={styles.policyText}>
            Customers must visit within 48 hours of paying the token (set by Tamboo). The token goes to you minus 5% Tamboo commission,
            whether they book or not. The rest of the payment you collect directly.
          </Text>
        </View>

        {!!err && <Text style={styles.error}>{err}</Text>}

        <TouchableOpacity activeOpacity={0.85} onPress={save}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save hall page</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <VenueTabBar active="hall" navigation={navigation} />
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
  mainPhoto: { height: 170, borderRadius: 16, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoText: { fontSize: 12, color: colors.pinkStrong, fontWeight: '600' },
  photoRow: { flexDirection: 'row', gap: 8 },
  subPhoto: { flex: 1, height: 100, borderRadius: 14, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
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
