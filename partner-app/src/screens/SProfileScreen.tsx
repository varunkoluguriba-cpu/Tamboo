import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import DeleteAccountButton from '../components/DeleteAccountButton';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pickImageBase64 } from '../utils/pickImage';
import { colors, gradients, shadow } from '../theme';
import { confirmLogout } from '../utils/confirmLogout';

type Profile = { about: string; areas: string[]; experienceYears: number; photos: string[] };

// The event-service partner's public page: what customers read before asking for a quote.
export default function SProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { partner, logout } = useAuth();
  const { t } = useLanguage();
  const servicesOn = !!partner?.servicesEnabled;
  const [about, setAbout] = useState('');
  const [areas, setAreas] = useState('');
  const [years, setYears] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!servicesOn || loaded) return;
    api.get<Profile>('/api/services/vendor/me/profile').then((p) => {
      setAbout(p.about || '');
      setAreas((p.areas || []).join(', '));
      setYears(p.experienceYears ? String(p.experienceYears) : '');
      setPhotos(p.photos || []);
      setLoaded(true);
    }).catch(() => {});
  }, [servicesOn, loaded]));

  const addPhoto = async () => {
    const uri = await pickImageBase64();
    if (uri) setPhotos((p) => [...p, uri].slice(0, 6));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/api/services/vendor/me/profile', {
        serviceAbout: about.trim(),
        serviceAreas: areas.split(',').map((x) => x.trim()).filter(Boolean),
        experienceYears: Number(years) || 0,
        servicePhotos: photos,
      });
      Alert.alert(t.psSaved);
    } catch (e) {
      Alert.alert(e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t.psProfileTitle}</Text>
          <Text style={styles.sub}>{servicesOn ? t.psProfileSub : t.psNotOpen}</Text>

          {servicesOn && (
            <View style={styles.card}>
              <Text style={styles.label}>{t.psPhotos}</Text>
              <View style={styles.photoRow}>
                {photos.map((p, i) => (
                  <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => setPhotos((l) => l.filter((_, j) => j !== i))}>
                    <Image source={{ uri: p }} style={styles.photo} />
                    <View style={styles.photoX}><Icon name="x" size={12} color="#fff" strokeWidth={3} /></View>
                  </TouchableOpacity>
                ))}
                {photos.length < 6 && (
                  <TouchableOpacity style={[styles.photo, styles.photoAdd]} activeOpacity={0.85} onPress={addPhoto}>
                    <Icon name="camera" size={18} color={colors.pinkStrong} />
                    <Text style={styles.photoAddText}>{t.psAddPhoto}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>{t.psAbout}</Text>
              <TextInput style={[styles.input, styles.multi]} value={about} onChangeText={setAbout} placeholder={t.psAboutPh} placeholderTextColor={colors.textMuted} multiline maxLength={1000} />
              <Text style={styles.label}>{t.psAreas}</Text>
              <TextInput style={styles.input} value={areas} onChangeText={setAreas} placeholder="Kukatpally, Ameerpet" placeholderTextColor={colors.textMuted} />
              <Text style={styles.label}>{t.psExperience}</Text>
              <TextInput style={styles.input} value={years} onChangeText={(v) => setYears(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" placeholder="10" placeholderTextColor={colors.textMuted} />

              <TouchableOpacity activeOpacity={0.85} onPress={save} disabled={saving} style={{ marginTop: 8 }}>
                <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.saveBtn}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t.psSavePage}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.rowBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Chat', { customerName: t.tambooSupport })}>
            <Text style={styles.rowBtnText}>{t.tambooSupport}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rowBtn} activeOpacity={0.85} onPress={() => confirmLogout(t, logout)}>
            <Icon name="logout" size={16} color={colors.text} />
            <Text style={styles.rowBtnText}>{t.logout}</Text>
          </TouchableOpacity>
          <DeleteAccountButton />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 8, gap: 12, paddingBottom: 32 },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 6, ...shadow.card },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.text, marginTop: 6 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, fontSize: 14, color: colors.text },
  multi: { minHeight: 90, paddingTop: 10, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 84, height: 84, borderRadius: 12 },
  photoX: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  photoAdd: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.pink, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.pinkBg },
  photoAddText: { fontSize: 11, fontWeight: '700', color: colors.pinkStrong },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  rowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface },
  rowBtnText: { fontWeight: '700', color: colors.text, fontSize: 14 },
});
