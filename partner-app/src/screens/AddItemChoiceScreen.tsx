import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { pickImageBase64 } from '../utils/pickImage';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItemChoice'>;

type Preset = { name: string; cat: string; unit: string; specs: string };
type Classified = { name: string; cat: string; unit: string; specs: string };

export default function AddItemChoiceScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [query, setQuery] = useState('');
  const [typedName, setTypedName] = useState('');
  const [working, setWorking] = useState<'text' | 'photo' | null>(null);

  useEffect(() => {
    api.get<Preset[]>('/api/vendors/item-presets').then(setPresets).catch(() => setPresets([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presets.slice(0, 30);
    return presets.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 30);
  }, [presets, query]);

  const goToForm = (initial?: Classified, initialPhotos?: string[]) => {
    navigation.replace('ItemForm', {
      initialName: initial?.name,
      initialCat: initial?.cat,
      initialUnit: initial?.unit,
      initialSpecs: initial?.specs,
      initialPhotos,
    });
  };

  const continueWithTyped = async () => {
    if (!typedName.trim()) return;
    setWorking('text');
    try {
      const result = await api.post<Classified>('/api/vendors/me/items/classify-text', { name: typedName.trim() });
      goToForm(result);
    } catch (e) {
      goToForm({ name: typedName.trim(), cat: '', unit: '', specs: '' });
    } finally {
      setWorking(null);
    }
  };

  const usePhoto = async () => {
    const uri = await pickImageBase64();
    if (!uri) return;
    setWorking('photo');
    try {
      const result = await api.post<Classified>('/api/vendors/me/items/analyze-photo', { imageBase64: uri });
      goToForm(result, [uri]);
    } catch (e) {
      Alert.alert(t.itemFormErrSaveFailed, e instanceof ApiError ? e.message : t.tryAgain, [
        { text: t.ok, onPress: () => goToForm(undefined, [uri]) },
      ]);
    } finally {
      setWorking(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.addItemChoiceTitle}</Text>
        </View>
        <Text style={styles.subtitle}>{t.addItemChoiceSubtitle}</Text>

        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t.addItemChoiceSearchPlaceholder}
          placeholderTextColor={colors.textMuted}
        />

        {filtered.length > 0 ? (
          <View style={{ gap: 8 }}>
            {filtered.map((p) => (
              <TouchableOpacity key={p.name} style={styles.presetRow} activeOpacity={0.85} onPress={() => goToForm(p)}>
                <Text style={styles.presetName}>{p.name}</Text>
                <Icon name="right" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.noPresets}>{t.addItemChoiceNoPresets}</Text>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t.addItemChoiceOr}</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel}>{t.addItemChoiceTypeLabel}</Text>
          <View style={styles.typeRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={typedName}
              onChangeText={setTypedName}
              placeholder={t.addItemChoiceTypePlaceholder}
              placeholderTextColor={colors.textMuted}
              editable={working === null}
            />
            <TouchableOpacity
              style={[styles.typeBtn, (!typedName.trim() || working !== null) && styles.typeBtnDisabled]}
              activeOpacity={0.85}
              disabled={!typedName.trim() || working !== null}
              onPress={continueWithTyped}
            >
              {working === 'text' ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.typeBtnText}>{t.addItemChoiceTypeBtn}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t.addItemChoiceOr}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.photoBtn} activeOpacity={0.85} disabled={working !== null} onPress={usePhoto}>
          {working === 'photo' ? (
            <ActivityIndicator color={colors.pinkStrong} size="small" />
          ) : (
            <>
              <Icon name="camera" size={18} color={colors.pinkStrong} strokeWidth={1.5} />
              <Text style={styles.photoBtnText}>{t.addItemChoicePhotoBtn}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.manualLink} activeOpacity={0.7} onPress={() => goToForm()}>
          <Text style={styles.manualLinkText}>{t.addItemChoiceManualLink}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  input: { height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 14, fontSize: 14, color: colors.text, backgroundColor: colors.surface },
  presetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, ...shadow.card },
  presetName: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  noPresets: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { color: colors.textMuted, fontSize: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { height: 48, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  typeBtnDisabled: { opacity: 0.5 },
  typeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  photoBtn: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface },
  photoBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 14 },
  manualLink: { alignSelf: 'center', marginTop: 4, padding: 8 },
  manualLinkText: { color: colors.textSoft, fontWeight: '600', fontSize: 13, textDecorationLine: 'underline' },
});
