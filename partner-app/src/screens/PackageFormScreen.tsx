import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';
import type { PartnerPackage } from './PackagesScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'PackageForm'>;

type ShopItem = { id: string; name: string; price: number; unit: string; instant: boolean };

export default function PackageFormScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const editingId = route.params?.id;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<ShopItem[]>('/api/vendors/me/items'),
      editingId ? api.get<PartnerPackage[]>('/api/vendors/me/packages') : Promise.resolve([] as PartnerPackage[]),
    ])
      .then(([shopItems, packages]) => {
        setItems(shopItems.filter((i) => i.instant));
        const existing = packages.find((p) => p.id === editingId);
        if (existing) {
          setName(existing.name);
          setDescription(existing.description);
          setQtys(Object.fromEntries(existing.lines.map((l) => [l.productId, l.qty])));
        }
      })
      .catch(() => setErr(t.packagesLoadError))
      .finally(() => setLoading(false));
  }, [editingId, t.packagesLoadError]);

  const toggle = (id: string) => {
    setQtys((q) => {
      const next = { ...q };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const setQty = (id: string, qty: number) => setQtys((q) => ({ ...q, [id]: Math.max(1, qty) }));

  const save = async () => {
    if (!name.trim()) return setErr(t.packagesErrName);
    const picked = Object.entries(qtys).map(([itemId, qty]) => ({ itemId, qty }));
    if (picked.length === 0) return setErr(t.packagesErrItems);
    setErr('');
    setSaving(true);
    try {
      const body = { name: name.trim(), description: description.trim(), items: picked };
      if (editingId) await api.put(`/api/vendors/me/packages/${editingId}`, body);
      else await api.post('/api/vendors/me/packages', body);
      navigation.goBack();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert(t.packagesDeleteTitle, t.packagesDeleteMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/vendors/me/packages/${editingId}`);
            navigation.goBack();
          } catch (e) {
            Alert.alert(t.tryAgain, e instanceof ApiError ? e.message : t.tryAgain);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{editingId ? t.packagesEditTitle : t.packagesAddTitle}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 24 }} />
        ) : (
          <>
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>{t.packagesNameLabel}</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t.packagesNamePlaceholder} placeholderTextColor={colors.textMuted} />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={styles.label}>{t.packagesDescLabel}</Text>
              <TextInput value={description} onChangeText={setDescription} multiline style={[styles.input, styles.textarea]} placeholder={t.packagesDescPlaceholder} placeholderTextColor={colors.textMuted} />
            </View>

            <Text style={styles.label}>{t.packagesPickItems}</Text>
            {items.length === 0 ? (
              <Text style={styles.hint}>{t.packagesNoItems}</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {items.map((i) => {
                  const on = !!qtys[i.id];
                  return (
                    <View key={i.id} style={[styles.itemRow, on && styles.itemRowOn]}>
                      <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => toggle(i.id)}>
                        <Text style={styles.itemName}>{i.name}</Text>
                        <Text style={styles.itemPrice}>₹{i.price.toLocaleString('en-IN')} {i.unit}</Text>
                      </TouchableOpacity>
                      {on && (
                        <View style={styles.qtyRow}>
                          <TouchableOpacity style={styles.qtyBtn} activeOpacity={0.8} onPress={() => setQty(i.id, qtys[i.id] - 1)}>
                            <Icon name="minus" size={14} color={colors.text} />
                          </TouchableOpacity>
                          <Text style={styles.qtyValue}>{qtys[i.id]}</Text>
                          <TouchableOpacity style={styles.qtyBtnFilled} activeOpacity={0.8} onPress={() => setQty(i.id, qtys[i.id] + 1)}>
                            <Icon name="plus" size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {!!err && <Text style={styles.error}>{err}</Text>}

            <TouchableOpacity activeOpacity={0.85} onPress={save} disabled={saving}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.saveBtn}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.packagesSaveBtn}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            {!!editingId && (
              <TouchableOpacity activeOpacity={0.7} onPress={remove}>
                <Text style={styles.deleteText}>{t.packagesDeleteBtn}</Text>
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
  scroll: { padding: 18, paddingTop: 6, gap: 14, paddingBottom: 24 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },
  input: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 14, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  textarea: { height: undefined, minHeight: 70, paddingTop: 12, textAlignVertical: 'top' },
  hint: { fontSize: 12.5, color: colors.textSoft, lineHeight: 19 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, padding: 12 },
  itemRowOn: { borderColor: colors.pink, backgroundColor: colors.pinkBg },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemPrice: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  qtyBtnFilled: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { width: 30, textAlign: 'center', fontWeight: '700', fontSize: 14, color: colors.text },
  error: { color: colors.dangerStrong, fontSize: 12.5 },
  saveBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
  deleteText: { color: colors.dangerStrong, fontWeight: '700', fontSize: 13, textAlign: 'center' },
});
