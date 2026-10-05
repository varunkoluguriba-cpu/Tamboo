import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { colors, gradients } from '../theme';
import { useLanguage } from '../context/LanguageContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { sendOtp, continueWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async () => {
    if (phone.length !== 10) {
      setErr(t.pLoginInvalidPhone);
      return;
    }
    setErr('');
    setSending(true);
    try {
      await sendOtp(`+91${phone}`);
      navigation.navigate('Otp', { phone });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.pLoginOtpError);
    } finally {
      setSending(false);
    }
  };

  const google = async () => {
    setErr('');
    setGoogleLoading(true);
    try {
      await continueWithGoogle();
      // RootNavigator swaps to Home automatically once the partner is set.
    } catch (e: any) {
      if (e?.code !== 'SIGN_IN_CANCELLED' && e?.code !== '-5') {
        setErr(e instanceof ApiError ? e.message : t.pLoginGoogleError);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.blob} pointerEvents="none" />

        <View style={styles.brandPill}>
          <Text style={styles.brandText}>tamboo</Text>
          <Text style={styles.brandBadge}>{t.pLoginBrandBadge}</Text>
        </View>

        <View>
          <Text style={styles.title}>{t.pLoginTitle}</Text>
          <Text style={styles.subtitle}>{t.pLoginSubtitle}</Text>
        </View>

        <View style={styles.phoneRow}>
          <View style={styles.codeChip}>
            <Text style={styles.codeText}>🇮🇳 +91</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="98490 12345"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={(v) => { setPhone(v.replace(/\D/g, '').slice(0, 10)); setErr(''); }}
          />
        </View>
        {!!err && <Text style={styles.error}>{err}</Text>}

        <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={sending}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={[styles.button, sending && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>{sending ? '…' : t.pLoginSendOtp}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t.pLoginOr}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.altButton} activeOpacity={0.85} onPress={google} disabled={googleLoading}>
          <Text style={styles.altButtonText}>{googleLoading ? '…' : t.pLoginGoogle}</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>{t.pLoginTerms}</Text>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surface, padding: 24, paddingTop: 30, gap: 22, overflow: 'hidden' },
  blob: { position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(231,84,128,0.28)' },
  brandPill: { height: 64, paddingHorizontal: 20, borderRadius: 18, alignSelf: 'flex-start', backgroundColor: colors.text, justifyContent: 'center', gap: 2 },
  brandText: { fontSize: 30, fontWeight: '800', fontStyle: 'italic', color: '#fff', letterSpacing: -1 },
  brandBadge: { fontSize: 9.5, fontWeight: '800', letterSpacing: 2.5, color: colors.pink },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textSoft },
  phoneRow: { flexDirection: 'row', gap: 10 },
  codeChip: { height: 52, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  codeText: { fontWeight: '700', fontSize: 15, color: colors.text },
  input: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 16, fontSize: 16, fontWeight: '600', letterSpacing: 0.6, color: colors.text },
  error: { color: colors.dangerStrong, fontSize: 12.5, marginTop: -14 },
  button: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { color: colors.textMuted, fontSize: 12 },
  altButton: { height: 48, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  altButtonText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  terms: { marginTop: 'auto', fontSize: 11.5, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
});
