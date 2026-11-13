import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme';

// Until the customer app/website is public, say so plainly — a partner who lists now and
// sees no bookings should know why, not think the app is broken.
export default function LaunchBanner() {
  const { partner } = useAuth();
  const { t } = useLanguage();
  if (!partner || partner.customersLive !== false) return null;
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{t.launchTitle}</Text>
      <Text style={styles.msg}>{t.launchMsg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, padding: 14, gap: 4, backgroundColor: colors.purpleBg },
  title: { fontSize: 14.5, fontWeight: '800', color: colors.maroon },
  msg: { fontSize: 13, color: colors.text, lineHeight: 18 },
});
