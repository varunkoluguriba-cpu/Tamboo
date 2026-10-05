import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiError } from '../api/client';
import { colors, gradients } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export default function OtpScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { phone } = route.params;
  const { verifyOtp, sendOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const [verifying, setVerifying] = useState(false);

  const submit = async () => {
    if (otp.length !== 6 && otp.length !== 4) {
      setErr(t.pOtpEnterCode);
      return;
    }
    setErr('');
    setVerifying(true);
    try {
      const partner = await verifyOtp(otp);
      // If registered, the root navigator swaps to the main app automatically once
      // AuthContext's `partner` updates — nothing to navigate to here.
      if (!partner.registered) navigation.replace('Register');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.pOtpIncorrectCode);
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setErr('');
    try {
      await sendOtp(`+91${phone}`);
    } catch {
      setErr(t.pOtpResendFailed);
    }
  };

  const maskedPhone = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Icon name="left" size={16} color={colors.text} />
      </TouchableOpacity>

      <View>
        <Text style={styles.title}>{t.pOtpTitle}</Text>
        <Text style={styles.subtitle}>{t.pOtpSentTo.replace('{phone}', maskedPhone)}</Text>
      </View>

      <View style={styles.boxWrap}>
        <View style={styles.boxesRow}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.box, otp.length === i && styles.boxActive]}>
              <Text style={styles.boxText}>{otp[i] || ''}</Text>
            </View>
          ))}
        </View>
        <TextInput
          style={styles.hiddenInput}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(v) => { setOtp(v.replace(/\D/g, '')); setErr(''); }}
          autoFocus
        />
      </View>
      {!!err && <Text style={styles.error}>{err}</Text>}

      <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={verifying}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={[styles.button, verifying && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>{verifying ? '…' : t.pOtpVerify}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={resend} style={styles.resendWrap}>
        <Text style={styles.resend}>{t.pOtpResendOtp}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: 24, paddingTop: 20, gap: 22 },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: colors.text, shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textSoft },
  boxWrap: { position: 'relative' },
  boxesRow: { flexDirection: 'row', gap: 12 },
  box: { flex: 1, height: 62, borderRadius: 16, borderWidth: 2, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: colors.pink },
  boxText: { fontSize: 24, fontWeight: '800', color: colors.text },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  error: { color: colors.dangerStrong, fontSize: 12.5, marginTop: -14 },
  button: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  resendWrap: { alignSelf: 'center' },
  resend: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13.5 },
});
