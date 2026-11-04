import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme';

// Customers only see verified partners, so a pending or rejected partner must be told
// plainly — otherwise they wait for bookings that can never arrive.
export default function VerificationBanner() {
  const { partner } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const status = partner?.verificationStatus;
  if (status !== 'pending' && status !== 'rejected') return null;
  const rejected = status === 'rejected';
  return (
    <View style={[styles.box, rejected ? styles.boxRejected : styles.boxPending]}>
      <Text style={[styles.title, { color: rejected ? colors.dangerStrong : colors.amber }]}>
        {rejected ? t.verifyRejectedTitle : t.verifyPendingTitle}
      </Text>
      <Text style={styles.msg}>{rejected ? t.verifyRejectedMsg : t.verifyPendingMsg}</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Chat', { customerName: t.tambooSupport })}>
        <Text style={styles.link}>{t.verifyContactSupport}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, padding: 14, gap: 4 },
  boxPending: { backgroundColor: colors.amberBg },
  boxRejected: { backgroundColor: colors.dangerBg },
  title: { fontSize: 14.5, fontWeight: '800' },
  msg: { fontSize: 13, color: colors.text, lineHeight: 18 },
  link: { fontSize: 13.5, fontWeight: '800', color: colors.maroon, marginTop: 4 },
});
