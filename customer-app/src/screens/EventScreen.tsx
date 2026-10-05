import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import type { LangStrings } from '../i18n';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Event'>;

type Option = { value: string; label: string };

const eventTypeOptions = (t: LangStrings): Option[] => [
  { value: 'Wedding', label: t.eventTypeWedding },
  { value: 'Reception', label: t.eventTypeReception },
  { value: 'Birthday', label: t.eventTypeBirthday },
  { value: 'House party', label: t.eventTypeHouseParty },
  { value: 'Corporate', label: t.eventTypeCorporate },
];

const venueTypeOptions = (t: LangStrings): Option[] => [
  { value: 'Banquet hall', label: t.eventVenueBanquetHall },
  { value: 'Marriage hall', label: t.eventVenueMarriageHall },
  { value: 'Outdoor / Lawn', label: t.eventVenueOutdoorLawn },
  { value: 'Home / Backyard', label: t.eventVenueHomeBackyard },
];

const needCatOptions = (t: LangStrings): Option[] => [
  { value: 'Shamiana & Tents', label: t.eventNeedTents },
  { value: 'Chairs & Tables', label: t.eventNeedChairsTables },
  { value: 'Crockery & Vessels', label: t.eventNeedCrockeryVessels },
  { value: 'Lighting', label: t.eventNeedLighting },
  { value: 'Sound & DJ', label: t.eventNeedSoundDJ },
  { value: 'Decor', label: t.eventNeedDecor },
];

function soon(t: LangStrings) {
  Alert.alert(t.comingSoon, t.eventComingSoonMsg);
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSel : styles.chipUnsel]}
    >
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

export default function EventScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { event, setEvent } = useEvent();
  const [name, setName] = useState(event.name);
  const [type, setType] = useState(event.type);
  const [date, setDate] = useState(event.date);
  const [guests, setGuests] = useState(event.guests);
  const [setup, setSetup] = useState(event.setup);
  const [pickup, setPickup] = useState(event.pickup);
  const [start, setStart] = useState(event.start);
  const [end, setEnd] = useState(event.end);
  const [venueType, setVenueType] = useState(event.venueType);
  const [address, setAddress] = useState(event.address);
  const [needs, setNeeds] = useState<string[]>([]);
  const [budget, setBudget] = useState(event.budget);
  const [notes, setNotes] = useState(event.notes);

  const toggleNeed = (c: string) => {
    setNeeds((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));
  };

  const persist = () => {
    setEvent({ name: name.trim() || t.eventDefaultName, type, date, guests, setup, pickup, start, end, venueType, address, budget, notes });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.eventHeaderTitle}</Text>
        </View>
        <Text style={styles.sub}>{t.eventSub}</Text>

        <View style={styles.card}>
          <Field label={t.eventFieldNameLabel}>
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t.eventNamePlaceholder} placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label={t.eventFieldTypeLabel}>
            <View style={styles.chipRow}>
              {eventTypeOptions(t).map((e) => (
                <Chip key={e.value} label={e.label} selected={type === e.value} onPress={() => setType(e.value)} />
              ))}
            </View>
          </Field>

          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Field label={t.date}>
                <TextInput value={date} onChangeText={setDate} style={styles.input} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textMuted} />
              </Field>
            </View>
            <View style={styles.gridItem}>
              <Field label={t.guests}>
                <TextInput value={guests} onChangeText={setGuests} keyboardType="number-pad" style={styles.input} />
              </Field>
            </View>
            <View style={styles.gridItem}>
              <Field label={t.eventFieldSetupLabel}>
                <TextInput value={setup} onChangeText={setSetup} style={styles.input} placeholder="HH:MM" placeholderTextColor={colors.textMuted} />
              </Field>
            </View>
            <View style={styles.gridItem}>
              <Field label={t.eventFieldPickupDateLabel}>
                <TextInput value={pickup} onChangeText={setPickup} style={styles.input} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textMuted} />
              </Field>
            </View>
            <View style={styles.gridItem}>
              <Field label={t.eventFieldStartsLabel}>
                <TextInput value={start} onChangeText={setStart} style={styles.input} placeholder="HH:MM" placeholderTextColor={colors.textMuted} />
              </Field>
            </View>
            <View style={styles.gridItem}>
              <Field label={t.eventFieldEndsLabel}>
                <TextInput value={end} onChangeText={setEnd} style={styles.input} placeholder="HH:MM" placeholderTextColor={colors.textMuted} />
              </Field>
            </View>
          </View>

          <Field label={t.eventFieldVenueTypeLabel}>
            <View style={styles.chipRow}>
              {venueTypeOptions(t).map((v) => (
                <Chip key={v.value} label={v.label} selected={venueType === v.value} onPress={() => setVenueType(v.value)} />
              ))}
            </View>
          </Field>

          <Field label={t.eventFieldAddressLabel}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </Field>

          <Field label={t.eventFieldNeedsLabel}>
            <View style={styles.chipRow}>
              {needCatOptions(t).map((c) => (
                <Chip key={c.value} label={c.label} selected={needs.includes(c.value)} onPress={() => toggleNeed(c.value)} />
              ))}
            </View>
          </Field>

          <Field label={t.eventFieldBudgetLabel}>
            <TextInput value={budget} onChangeText={setBudget} keyboardType="number-pad" style={styles.input} placeholder="₹" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label={t.eventFieldNotesLabel}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              placeholder={t.eventNotesPlaceholder}
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <TouchableOpacity style={styles.photoBtn} activeOpacity={0.85} onPress={() => soon(t)}>
            <Icon name="camera" size={16} color={colors.textSoft} />
            <Text style={styles.photoBtnText}>{t.eventAddPhotos}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={() => { persist(); navigation.goBack(); }}>
            <Text style={styles.saveBtnText}>{t.save}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.findBtnWrap} activeOpacity={0.85} onPress={() => { persist(); navigation.navigate('Browse', {}); }}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.findBtn}>
              <Text style={styles.findBtnText}>{t.eventFindAvailableItems}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textSoft, marginTop: -8 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 14, ...shadow.card },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },
  input: { height: 46, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 14, fontSize: 14.5, color: colors.text },
  textarea: { height: undefined, minHeight: 60, paddingTop: 10, paddingBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5 },
  chipUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '47%' },
  photoBtn: { height: 44, borderRadius: 14, borderWidth: 1.5, borderColor: colors.dividerStrong, borderStyle: 'dashed', backgroundColor: colors.bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoBtnText: { color: colors.textSoft, fontWeight: '600', fontSize: 13 },
  footerRow: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 1, height: 50, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: colors.text, fontWeight: '600', fontSize: 14.5, fontFamily: 'Sora' },
  findBtnWrap: { flex: 2 },
  findBtn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  findBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
});
