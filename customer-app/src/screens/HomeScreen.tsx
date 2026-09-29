import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme';

// Placeholder landing screen — the real Home dashboard (event builder, categories,
// packages, nearby vendors) gets built next.
export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.hello}>{t.hello}, {user?.name || 'there'} 👋</Text>
      <Text style={styles.sub}>Home dashboard coming next.</Text>
      <TouchableOpacity onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hello: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textSoft },
  logout: { marginTop: 20 },
  logoutText: { color: colors.pinkStrong, fontWeight: '700' },
});
