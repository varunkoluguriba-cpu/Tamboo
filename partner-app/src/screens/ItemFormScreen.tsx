import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { getItem, CATEGORY_OPTIONS, UNIT_OPTIONS } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemForm'>;

function soon() {
  Alert.alert('Coming soon', 'This is being built next.');
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function ItemFormScreen({ navigation, route }: Props) {
  const { partner } = useAuth();
  const editing = route.params?.id ? getItem(route.params.id) : undefined;

  const [name, setName] = useState(editing?.name || '');
  const [cat, setCat] = useState(editing?.cat || CATEGORY_OPTIONS[0].id);
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [unit, setUnit] = useState(UNIT_OPTIONS[0]);
  const [stock, setStock] = useState(editing ? String(editing.stock) : '');
  const [min, setMin] = useState(editing ? String(editing.min) : '1');
  const [deposit, setDeposit] = useState(editing ? String(editing.deposit) : '');
  const [specs, setSpecs] = useState(editing?.specs || '');
  const [instant, setInstant] = useState(editing ? editing.instant : true);
  const [err, setErr] = useState('');

  const needsReview = partner?.verificationStatus !== 'verified';

  const save = () => {
    if (!name.trim()) return setErr('Enter an item name');
    if (instant && (!price || parseInt(price, 10) <= 0)) return setErr('Enter the rent amount');
    setErr('');
    Alert.alert(editing ? 'Item updated' : 'Item added', needsReview ? "It'll go live once your account or this item is verified." : "It's live now.", [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const deleteItem = () => {
    Alert.alert('Delete this item?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editing ? 'Edit item' : 'Add item'}</Text>
        </View>

        <View>
          <Text style={styles.photoLabel}>Photos · first one is the cover customers see</Text>
          <View style={styles.photoGrid}>
            <TouchableOpacity style={styles.coverPhoto} activeOpacity={0.85} onPress={soon}>
              <Icon name="camera" size={24} color={colors.pinkStrong} strokeWidth={1.5} />
              <Text style={styles.photoText}>Tap to add cover photo</Text>
            </TouchableOpacity>
            <View style={{ gap: 8, flex: 1 }}>
              <TouchableOpacity style={styles.smallPhoto} activeOpacity={0.85} onPress={soon}>
                <Icon name="plus" size={18} color={colors.pinkStrong} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallPhoto} activeOpacity={0.85} onPress={soon}>
                <Icon name="plus" size={18} color={colors.pinkStrong} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.photoHint}>Use real photos of your own stock, in daylight. Items with clear photos get booked more.</Text>
        </View>

        <Field label="Item name">
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="e.g. Iron Folding Chair (cushioned)" placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label="Category">
          <View style={styles.chipRow}>
            {CATEGORY_OPTIONS.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.chip, cat === c.id ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setCat(c.id)}>
                <Text style={[styles.chipText, cat === c.id && styles.chipTextSel]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <View style={styles.grid2}>
          <View style={styles.gridItem}>
            <Field label="Rent (₹)">
              <TextInput value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} placeholder="25" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.gridItem}>
            <Field label="Stock you own">
              <TextInput value={stock} onChangeText={(v) => setStock(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} placeholder="200" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.gridItem}>
            <Field label="Minimum order">
              <TextInput value={min} onChangeText={(v) => setMin(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} placeholder="1" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.gridItem}>
            <Field label="Deposit (₹, optional)">
              <TextInput value={deposit} onChangeText={(v) => setDeposit(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
        </View>

        <Field label="Charged">
          <View style={styles.chipRow}>
            {UNIT_OPTIONS.map((u) => (
              <TouchableOpacity key={u} style={[styles.chip, unit === u ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setUnit(u)}>
                <Text style={[styles.chipText, unit === u && styles.chipTextSel]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Details for customers">
          <TextInput
            value={specs}
            onChangeText={setSpecs}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textarea]}
            placeholder="Size, material, what's included, setup notes"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <View style={styles.bookModeCard}>
          <Text style={styles.bookModeTitle}>How customers book it</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity style={[styles.modeBtn, instant ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setInstant(true)}>
              <Text style={[styles.chipText, instant && styles.chipTextSel]}>Instant book</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, !instant ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setInstant(false)}>
              <Text style={[styles.chipText, !instant && styles.chipTextSel]}>Quote only</Text>
            </TouchableOpacity>
          </View>
        </View>

        {needsReview && (
          <View style={styles.reviewBox}>
            <Text style={styles.reviewText}>Your account is not verified yet, so new items are checked by our team before customers can see them (usually within a day).</Text>
          </View>
        )}

        {!!err && <Text style={styles.error}>{err}</Text>}

        <TouchableOpacity activeOpacity={0.85} onPress={save}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{editing ? 'Save changes' : 'Add item'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity activeOpacity={0.7} onPress={deleteItem}>
            <Text style={styles.deleteText}>Delete this item</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  photoLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft, marginBottom: 8 },
  photoGrid: { flexDirection: 'row', gap: 8 },
  coverPhoto: { flex: 2, height: 184, borderRadius: 16, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10 },
  photoText: { fontSize: 11.5, color: colors.pinkStrong, textAlign: 'center', fontWeight: '600' },
  smallPhoto: { height: 88, borderRadius: 14, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  photoHint: { fontSize: 11.5, color: colors.textMuted, marginTop: 6 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },
  input: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 14, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  textarea: { height: undefined, minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipUnsel: { backgroundColor: colors.pinkBg, borderColor: colors.divider },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '47%' },
  bookModeCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 8 },
  bookModeTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  modeBtn: { flex: 1, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, paddingHorizontal: 8 },
  reviewBox: { backgroundColor: colors.purpleBg, borderRadius: 14, padding: 12 },
  reviewText: { color: '#5b21b6', fontSize: 12.5, lineHeight: 19 },
  error: { color: colors.dangerStrong, fontSize: 12.5 },
  saveBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
  deleteText: { color: colors.dangerStrong, fontWeight: '700', fontSize: 13, textAlign: 'center' },
});
