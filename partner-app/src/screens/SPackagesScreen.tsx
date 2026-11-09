import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type PriceType = 'from' | 'fixed' | 'perPlate';
type Offer = { id: string; title: string; priceType: PriceType; price: number; description: string; paused: boolean };
type Draft = { id?: string; title: string; priceType: PriceType; price: string; description: string };

const EMPTY: Draft = { title: '', priceType: 'from', price: '', description: '' };

// An event-service partner's packages ("Satyanarayana pooja — from ₹2,100"). Shown on their
// page in the customer app; the actual price is agreed with the customer on the phone.
export default function SPackagesScreen() {
  const { partner } = useAuth();
  const { t } = useLanguage();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const servicesOn = !!partner?.servicesEnabled;

  const load = useCallback(() => {
    if (!servicesOn) return;
    api.get<Offer[]>('/api/services/vendor/me/offers').then(setOffers).catch(() => setOffers((o) => o ?? []));
  }, [servicesOn]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const priceTypes: Array<{ id: PriceType; label: string }> = [
    { id: 'from', label: t.psPriceFrom },
    { id: 'fixed', label: t.psPriceFixed },
    ...(partner?.serviceCategory === 'catering' ? [{ id: 'perPlate' as PriceType, label: t.psPricePerPlate }] : []),
  ];
  const priceText = (o: Offer) => {
    const p = o.price.toLocaleString('en-IN');
    return o.priceType === 'perPlate' ? t.psPricePerPlateText.replace('{price}', p) : o.priceType === 'from' ? t.psPriceFromText.replace('{price}', p) : `₹${p}`;
  };

  const save = async () => {
    if (!draft) return;
    if (draft.title.trim().length < 3) return Alert.alert(t.psErrName);
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 1) return Alert.alert(t.psErrPrice);
    setSaving(true);
    try {
      const body = { title: draft.title.trim(), priceType: draft.priceType, price, description: draft.description.trim() };
      if (draft.id) await api.patch(`/api/services/vendor/me/offers/${draft.id}`, body);
      else await api.post('/api/services/vendor/me/offers', body);
      setDraft(null);
      load();
    } catch (e) {
      Alert.alert(e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setSaving(false);
    }
  };

  const togglePaused = async (o: Offer) => {
    try {
      const u = await api.patch<Offer>(`/api/services/vendor/me/offers/${o.id}`, { paused: !o.paused });
      setOffers((l) => (l || []).map((x) => (x.id === o.id ? u : x)));
    } catch (e) {
      Alert.alert(e instanceof ApiError ? e.message : t.tryAgain);
    }
  };

  const remove = (o: Offer) => Alert.alert(t.psDeleteConfirm, o.title, [
    { text: t.cancel, style: 'cancel' },
    { text: t.delete, style: 'destructive', onPress: () => api.delete(`/api/services/vendor/me/offers/${o.id}`).then(load).catch(() => Alert.alert(t.tryAgain)) },
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headRow}>
            <Text style={styles.title}>{t.psPackagesTitle}</Text>
            {servicesOn && !draft && (
              <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={() => setDraft({ ...EMPTY })}>
                <Icon name="plus" size={15} color="#fff" />
                <Text style={styles.addText}>{t.psAddPackage}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.sub}>{servicesOn ? t.psPackagesSub : t.psNotOpen}</Text>

          {draft && (
            <View style={styles.card}>
              <Text style={styles.formTitle}>{draft.id ? t.psEditPackage : t.psAddPackage}</Text>
              <Text style={styles.label}>{t.psPkgName}</Text>
              <TextInput style={styles.input} value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} placeholder={t.psPkgNamePh} placeholderTextColor={colors.textMuted} maxLength={80} />
              <Text style={styles.label}>{t.psPriceType}</Text>
              <View style={styles.chips}>
                {priceTypes.map((p) => (
                  <TouchableOpacity key={p.id} style={[styles.chip, draft.priceType === p.id && styles.chipSel]} activeOpacity={0.85} onPress={() => setDraft({ ...draft, priceType: p.id })}>
                    <Text style={[styles.chipText, draft.priceType === p.id && styles.chipTextSel]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>{t.psPkgPrice}</Text>
              <TextInput style={styles.input} value={draft.price} onChangeText={(v) => setDraft({ ...draft, price: v.replace(/\D/g, '').slice(0, 8) })} keyboardType="number-pad" placeholder="2100" placeholderTextColor={colors.textMuted} />
              <Text style={styles.label}>{t.psPkgDesc}</Text>
              <TextInput style={[styles.input, styles.multi]} value={draft.description} onChangeText={(v) => setDraft({ ...draft, description: v })} multiline maxLength={600} />
              <View style={styles.formBtns}>
                <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.85} onPress={() => setDraft(null)}>
                  <Text style={styles.ghostText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={save} disabled={saving}>
                  <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.saveBtn}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t.save}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {servicesOn && offers !== null && offers.length === 0 && !draft && (
            <View style={styles.card}><Text style={styles.empty}>{t.psNoPackages}</Text></View>
          )}
          {(offers || []).map((o) => (
            <View key={o.id} style={[styles.card, o.paused && { opacity: 0.6 }]}>
              <View style={styles.offerTop}>
                <Text style={styles.offerTitle}>{o.title}</Text>
                <Text style={styles.offerPrice}>{priceText(o)}</Text>
              </View>
              {!!o.description && <Text style={styles.desc}>{o.description}</Text>}
              {o.paused && <Text style={styles.hidden}>{t.psHidden}</Text>}
              <View style={styles.rowBtns}>
                <TouchableOpacity style={styles.smallBtn} activeOpacity={0.85} onPress={() => setDraft({ id: o.id, title: o.title, priceType: o.priceType, price: String(o.price), description: o.description })}>
                  <Text style={styles.smallText}>{t.psEditPackage}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallBtn} activeOpacity={0.85} onPress={() => togglePaused(o)}>
                  <Text style={styles.smallText}>{o.paused ? t.psShow : t.psHide}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallBtn} activeOpacity={0.85} onPress={() => remove(o)}>
                  <Text style={[styles.smallText, { color: colors.danger }]}>{t.delete}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 8, gap: 12, paddingBottom: 32 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.maroon, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sub: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 6, ...shadow.card },
  formTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.text, marginTop: 4 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, fontSize: 14, color: colors.text },
  multi: { minHeight: 80, paddingTop: 10, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.pinkBg },
  chipSel: { backgroundColor: colors.maroon },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.pinkStrong },
  chipTextSel: { color: '#fff' },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  ghostBtn: { height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontWeight: '700', color: colors.text },
  saveBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  offerTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  offerTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  offerPrice: { fontSize: 14, fontWeight: '800', color: colors.maroon },
  desc: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  hidden: { fontSize: 12, fontWeight: '700', color: colors.amber },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 6 },
  smallBtn: { borderRadius: 10, borderWidth: 1.5, borderColor: colors.divider, paddingVertical: 7, paddingHorizontal: 12 },
  smallText: { fontSize: 12.5, fontWeight: '700', color: colors.text },
});
