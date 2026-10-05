import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { colors, gradients } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const CITIES = ['Hyderabad', 'Secunderabad', 'Warangal', 'Vijayawada', 'Bengaluru'];

export default function RegisterScreen({}: Props) {
  const { t } = useLanguage();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) {
      setErr(t.registerNameRequired);
      return;
    }
    setErr('');
    setSaving(true);
    try {
      await register(name.trim(), city);
      // Root navigator swaps to the main app automatically once AuthContext's user updates.
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.registerSaveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.verifiedBadge}>
          <Icon name="check" size={13} color={colors.green} />
          <Text style={styles.verifiedText}>{t.registerMobileVerified}</Text>
        </View>

        <View>
          <Text style={styles.title}>{t.regT}</Text>
          <Text style={styles.subtitle}>{t.registerSubtitle}</Text>
        </View>

        <View>
          <Text style={styles.label}>{t.name}</Text>
          <TextInput style={styles.input} placeholder="Anjali Sharma" placeholderTextColor={colors.textMuted} value={name} onChangeText={(v) => { setName(v); setErr(''); }} />
        </View>

        <View>
          <Text style={styles.label}>{t.registerEmailLabel}</Text>
          <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>

        <View>
          <Text style={styles.label}>{t.city}</Text>
          <View style={styles.cityRow}>
            {CITIES.map((c) => {
              const sel = city === c;
              return (
                <TouchableOpacity key={c} onPress={() => setCity(c)} style={[styles.cityChip, sel && styles.cityChipSel]}>
                  <Text style={[styles.cityChipText, sel && styles.cityChipTextSel]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {!!err && <Text style={styles.error}>{err}</Text>}

        <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={saving} style={styles.buttonWrap}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={[styles.button, saving && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>{saving ? '…' : t.create}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surface, padding: 24, paddingTop: 20, gap: 16 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.greenBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  verifiedText: { color: colors.green, fontWeight: '700', fontSize: 12.5 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textSoft },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft, marginBottom: 6 },
  input: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 14, fontSize: 15, color: colors.text },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { height: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  cityChipSel: { backgroundColor: colors.pinkBg, borderColor: colors.pink },
  cityChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  cityChipTextSel: { color: colors.pinkStrong },
  error: { color: colors.dangerStrong, fontSize: 12.5 },
  buttonWrap: { marginTop: 'auto' },
  button: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
});
