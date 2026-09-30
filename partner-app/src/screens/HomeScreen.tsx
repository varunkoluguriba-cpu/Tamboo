import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

// Placeholder landing screen — the real hall-owner (hhome) and tent-house (home) dashboards,
// orders, calendar, items and shop screens get built next.
export default function HomeScreen() {
  const { partner, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.hello}>Welcome, {partner?.businessName || 'partner'} 👋</Text>
      <Text style={styles.sub}>
        {partner?.role === 'venue' ? 'Hall' : 'Tent house'} dashboard coming next.{'\n'}
        Verification: {partner?.verificationStatus}
      </Text>
      <TouchableOpacity onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hello: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSoft, textAlign: 'center', lineHeight: 20 },
  logout: { marginTop: 20 },
  logoutText: { color: colors.pinkStrong, fontWeight: '700' },
});
