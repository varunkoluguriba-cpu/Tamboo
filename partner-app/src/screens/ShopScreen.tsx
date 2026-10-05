import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { TentTabBar } from '../components/TabBar';
import LanguageSheet from '../components/LanguageSheet';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Shop'>;

type RemoteShop = {
  blurb: string;
  hours: string;
  areas: string;
  deliveryFee: number;
  setupFee: number;
  pickupFee: number;
};

export default function ShopScreen({ navigation }: Props) {
  const { partner, logout } = useAuth();
  const { lang, t } = useLanguage();

  function soon() {
    Alert.alert(t.comingSoon, t.shopComingSoonMsg);
  }

  const [langSheet, setLangSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blurb, setBlurb] = useState('');
  const [hours, setHours] = useState('8 AM – 8 PM');
  const [areas, setAreas] = useState(partner?.area || '');
  const [delivery, setDelivery] = useState('500');
  const [setup, setSetup] = useState('0');
  const [pickup, setPickup] = useState('500');

  useEffect(() => {
    api.get<RemoteShop | null>('/api/vendors/me/shop')
      .then((shop) => {
        if (!shop) return;
        setBlurb(shop.blurb);
        setHours(shop.hours);
        setAreas(shop.areas);
        setDelivery(String(shop.deliveryFee));
        setSetup(String(shop.setupFee));
        setPickup(String(shop.pickupFee));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/api/vendors/me/shop', {
        blurb,
        hours,
        areas,
        deliveryFee: parseInt(delivery, 10) || 0,
        setupFee: parseInt(setup, 10) || 0,
        pickupFee: parseInt(pickup, 10) || 0,
      });
      Alert.alert(t.shopSavedTitle, t.shopSavedMsg);
    } catch (e) {
      Alert.alert(t.shopSaveFailTitle, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.coverWrap}>
          <TouchableOpacity style={styles.cover} activeOpacity={0.85} onPress={soon}>
            <Icon name="camera" size={28} color={colors.pinkStrong} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.langChip} activeOpacity={0.8} onPress={() => setLangSheet(true)}>
            <Text style={styles.langDevanagari}>अ</Text>
            <Text style={styles.langText}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.headRow}>
            <TouchableOpacity style={styles.logo} activeOpacity={0.85} onPress={soon}>
              <Icon name="tent" size={26} color={colors.pinkStrong} strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={{ minWidth: 0, paddingBottom: 4 }}>
              <Text style={styles.name}>{partner?.businessName}</Text>
              <Text style={styles.sub}>{partner?.area || t.shopAreaFallback}, {partner?.city}</Text>
            </View>
          </View>
          <Text style={styles.hint}>{t.shopPhotoHint}</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.shopAboutLabel}</Text>
            <TextInput value={blurb} onChangeText={setBlurb} multiline numberOfLines={3} style={[styles.input, styles.textarea]} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.shopHoursLabel}</Text>
            <TextInput value={hours} onChangeText={setHours} style={styles.input} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.shopAreasLabel}</Text>
            <TextInput value={areas} onChangeText={setAreas} style={styles.input} />
          </View>

          <View style={styles.grid3}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabelSm}>{t.shopDeliveryLabel}</Text>
              <TextInput value={delivery} onChangeText={(v) => setDelivery(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.inputSm} />
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabelSm}>{t.shopSetupLabel}</Text>
              <TextInput value={setup} onChangeText={(v) => setSetup(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.inputSm} />
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabelSm}>{t.shopPickupLabel}</Text>
              <TextInput value={pickup} onChangeText={(v) => setPickup(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.inputSm} />
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={save} disabled={saving || loading}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.saveBtn}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.shopSaveButton}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={logout}>
            <Icon name="logout" size={16} color={colors.text} />
            <Text style={styles.logoutText}>{t.logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TentTabBar active="shop" navigation={navigation} />
      <LanguageSheet visible={langSheet} onClose={() => setLangSheet(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  coverWrap: { position: 'relative' },
  cover: { height: 190, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  langChip: { position: 'absolute', top: 14, right: 14, height: 34, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 5, ...shadow.card },
  langDevanagari: { color: colors.pink, fontWeight: '700' },
  langText: { fontWeight: '700', fontSize: 12.5, color: colors.text },
  body: { paddingHorizontal: 18, paddingTop: 14, gap: 14 },
  headRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  logo: { width: 76, height: 76, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.card },
  name: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12.5, color: colors.textSoft },
  hint: { fontSize: 12, color: colors.textSoft, lineHeight: 18 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },
  fieldLabelSm: { fontSize: 12, fontWeight: '600', color: colors.textSoft, marginBottom: 6 },
  input: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 14, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  textarea: { height: undefined, minHeight: 76, paddingTop: 12, textAlignVertical: 'top' },
  grid3: { flexDirection: 'row', gap: 8 },
  gridItem: { flex: 1 },
  inputSm: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 10, fontSize: 14.5, color: colors.text, backgroundColor: colors.surface },
  saveBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
  logoutBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: colors.text, fontWeight: '600', fontSize: 14 },
});
