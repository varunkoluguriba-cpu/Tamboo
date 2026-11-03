import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme';

// Play Store requires users to be able to delete their account from inside the app.
export default function DeleteAccountButton() {
  const { deleteAccount } = useAuth();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  const confirm = () =>
    Alert.alert(t.deleteAccountTitle, t.deleteAccountBody, [
      { text: t.deleteAccountCancel, style: 'cancel' },
      {
        text: t.deleteAccountConfirm,
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteAccount();
          } catch (err) {
            setBusy(false);
            Alert.alert(t.deleteAccountTitle, err instanceof Error ? err.message : String(err));
          }
        },
      },
    ]);

  return (
    <TouchableOpacity style={styles.btn} activeOpacity={0.7} onPress={confirm} disabled={busy}>
      {busy ? <ActivityIndicator size="small" color={colors.dangerStrong} /> : <Text style={styles.text}>{t.deleteAccount}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { height: 40, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.dangerStrong, fontWeight: '600', fontSize: 13 },
});
