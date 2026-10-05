import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from '../data/catalog';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pickImageBase64 } from '../utils/pickImage';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemForm'>;

type RemoteItem = {
  id: string;
  name: string;
  cat: string;
  price: number;
  unit: string;
  stock: number;
  min: number;
  deposit: number;
  specs: string;
  instant: boolean;
  photo: string;
};

function soon(t: import('../i18n').LangStrings) {
  Alert.alert(t.comingSoon, t.itemFormComingSoonMsg);
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
  const { t } = useLanguage();
  const editingId = route.params?.id;

  const [loadingItem, setLoadingItem] = useState(!!editingId);
  const [name, setName] = useState('');
  const [cat, setCat] = useState(CATEGORY_OPTIONS[0].id);
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState(UNIT_OPTIONS[0]);
  const [stock, setStock] = useState('');
  const [min, setMin] = useState('1');
  const [deposit, setDeposit] = useState('');
  const [specs, setSpecs] = useState('');
  const [instant, setInstant] = useState(true);
  const [photo, setPhoto] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    api.get<RemoteItem[]>('/api/vendors/me/items')
      .then((items) => {
        const editing = items.find((i) => i.id === editingId);
        if (!editing) return;
        setName(editing.name);
        setCat(editing.cat);
        setPrice(String(editing.price));
        setUnit(editing.unit || UNIT_OPTIONS[0]);
        setStock(String(editing.stock));
        setMin(String(editing.min));
        setDeposit(String(editing.deposit));
        setSpecs(editing.specs);
        setInstant(editing.instant);
        setPhoto(editing.photo || '');
      })
      .catch(() => {})
      .finally(() => setLoadingItem(false));
  }, [editingId]);

  const needsReview = partner?.verificationStatus !== 'verified';

  const pickCoverPhoto = async () => {
    const uri = await pickImageBase64();
    if (uri) setPhoto(uri);
  };

  const save = async () => {
    if (!name.trim()) return setErr(t.itemFormErrName);
    if (instant && (!price || parseInt(price, 10) <= 0)) return setErr(t.itemFormErrRent);
    setErr('');
    setSaving(true);
    const payload = {
      name: name.trim(),
      cat,
      price: parseInt(price, 10) || 0,
      unit,
      stock: parseInt(stock, 10) || 0,
      min: parseInt(min, 10) || 1,
      deposit: parseInt(deposit, 10) || 0,
      specs,
      instant,
      photo,
    };
    try {
      if (editingId) await api.put(`/api/vendors/me/items/${editingId}`, payload);
      else await api.post('/api/vendors/me/items', payload);
      Alert.alert(editingId ? t.itemFormUpdatedTitle : t.itemFormAddedTitle, needsReview ? t.itemFormPendingReviewMsg : t.itemFormLiveMsg, [
        { text: t.ok, onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.itemFormErrSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = () => {
    Alert.alert(t.itemFormDeleteConfirmTitle, t.itemFormDeleteConfirmMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/vendors/me/items/${editingId}`);
            navigation.goBack();
          } catch (e) {
            Alert.alert(t.itemFormErrDeleteTitle, e instanceof ApiError ? e.message : t.tryAgain);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editingId ? t.itemFormEditTitle : t.itemFormAddTitle}</Text>
        </View>

        {loadingItem ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 24 }} />
        ) : (
        <>
        <View>
          <Text style={styles.photoLabel}>{t.itemFormPhotosLabel}</Text>
          <View style={styles.photoGrid}>
            <TouchableOpacity style={styles.coverPhoto} activeOpacity={0.85} onPress={pickCoverPhoto}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.coverPhotoImg} />
              ) : (
                <>
                  <Icon name="camera" size={24} color={colors.pinkStrong} strokeWidth={1.5} />
                  <Text style={styles.photoText}>{t.itemFormCoverPhotoText}</Text>
                </>
              )}
            </TouchableOpacity>
            <View style={{ gap: 8, flex: 1 }}>
              <TouchableOpacity style={styles.smallPhoto} activeOpacity={0.85} onPress={() => soon(t)}>
                <Icon name="plus" size={18} color={colors.pinkStrong} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallPhoto} activeOpacity={0.85} onPress={() => soon(t)}>
                <Icon name="plus" size={18} color={colors.pinkStrong} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.photoHint}>{t.itemFormPhotoHint}</Text>
        </View>

        <Field label={t.itemFormNameLabel}>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t.itemFormNamePlaceholder} placeholderTextColor={colors.textMuted} />
        </Field>

        <Field label={t.itemFormCategoryLabel}>
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
            <Field label={t.itemFormRentLabel}>
              <TextInput value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} placeholder="25" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.gridItem}>
            <Field label={t.itemFormStockLabel}>
              <TextInput value={stock} onChangeText={(v) => setStock(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} placeholder="200" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.gridItem}>
            <Field label={t.itemFormMinOrderLabel}>
              <TextInput value={min} onChangeText={(v) => setMin(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} placeholder="1" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.gridItem}>
            <Field label={t.itemFormDepositLabel}>
              <TextInput value={deposit} onChangeText={(v) => setDeposit(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
        </View>

        <Field label={t.itemFormChargedLabel}>
          <View style={styles.chipRow}>
            {UNIT_OPTIONS.map((u) => (
              <TouchableOpacity key={u} style={[styles.chip, unit === u ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setUnit(u)}>
                <Text style={[styles.chipText, unit === u && styles.chipTextSel]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label={t.itemFormDetailsLabel}>
          <TextInput
            value={specs}
            onChangeText={setSpecs}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textarea]}
            placeholder={t.itemFormDetailsPlaceholder}
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <View style={styles.bookModeCard}>
          <Text style={styles.bookModeTitle}>{t.itemFormBookModeTitle}</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity style={[styles.modeBtn, instant ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setInstant(true)}>
              <Text style={[styles.chipText, instant && styles.chipTextSel]}>{t.itemFormInstantBook}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, !instant ? styles.chipSel : styles.chipUnsel]} activeOpacity={0.85} onPress={() => setInstant(false)}>
              <Text style={[styles.chipText, !instant && styles.chipTextSel]}>{t.itemFormQuoteOnly}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {needsReview && (
          <View style={styles.reviewBox}>
            <Text style={styles.reviewText}>{t.itemFormReviewText}</Text>
          </View>
        )}

        {!!err && <Text style={styles.error}>{err}</Text>}

        <TouchableOpacity activeOpacity={0.85} onPress={save} disabled={saving}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.saveBtn}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingId ? t.itemFormSaveChanges : t.itemFormAddTitle}</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity activeOpacity={0.7} onPress={deleteItem}>
            <Text style={styles.deleteText}>{t.itemFormDeleteThisItem}</Text>
          </TouchableOpacity>
        )}
        </>
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
  coverPhoto: { flex: 2, height: 184, borderRadius: 16, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, overflow: 'hidden' },
  coverPhotoImg: { width: '100%', height: '100%' },
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
