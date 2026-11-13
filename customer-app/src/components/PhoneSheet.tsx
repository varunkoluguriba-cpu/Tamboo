import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { setPhoneSheetOpener } from '../utils/requireAccount';
import { colors, gradients } from '../theme';

// Asked once, before the first booking, of customers who signed in with Google (no OTP):
// the hall owner or vendor needs a number to reach them.
export default function PhoneSheet() {
  const { t } = useLanguage();
  const { saveContactPhone } = useAuth();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPhoneSheetOpener(() => setOpen(true)); return () => setPhoneSheetOpener(null); }, []);

  const save = async () => {
    const d = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(d)) return setErr(t.loginScreenInvalidPhone);
    setErr(''); setBusy(true);
    try { await saveContactPhone(d); setOpen(false); setPhone(''); } catch (e) { setErr(e instanceof ApiError ? e.message : t.tryAgain); } finally { setBusy(false); }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
        <Text style={styles.title}>{t.webPhoneTitle}</Text>
        <Text style={styles.why}>{t.webPhoneWhy}</Text>
        <View style={styles.row}>
          <Text style={styles.cc}>+91</Text>
          <TextInput value={phone} onChangeText={(v) => setPhone(v.replace(/[^\d ]/g, ''))} keyboardType="phone-pad" maxLength={11} autoFocus
            placeholder="98XXX XXXXX" placeholderTextColor={colors.textMuted} style={styles.input} onSubmitEditing={save} />
        </View>
        {!!err && <Text style={styles.err}>{err}</Text>}
        <TouchableOpacity activeOpacity={0.85} disabled={busy} onPress={save}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.btn}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.webPhoneSave}</Text>}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.note}>{t.webPhoneNote}</Text>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30,27,46,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, gap: 12 },
  title: { fontFamily: 'Sora', fontSize: 19, fontWeight: '800', color: colors.text },
  why: { fontSize: 13.5, color: colors.textSoft, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 8 },
  cc: { width: 64, height: 50, borderRadius: 12, backgroundColor: colors.pinkBg, textAlign: 'center', textAlignVertical: 'center', lineHeight: 50, fontWeight: '700', color: colors.text },
  input: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, fontSize: 16, color: colors.text },
  err: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  btn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
