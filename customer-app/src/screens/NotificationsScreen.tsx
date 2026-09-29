import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

function soon() {
  Alert.alert('Coming soon', 'This is being built next.');
}

const NOTIFS = [
  { id: 'n1', text: 'Sai Tent House accepted your quote request QT-5498. Review the offer in Bookings.', at: '2 hours ago' },
  { id: 'n2', text: 'Reminder: your hall pre-booking at Sri Kalyana Mandapam expires in 24 hours. Visit soon to finalise.', at: '5 hours ago' },
  { id: 'n3', text: 'Booking TB-250142 confirmed by Sai Tent House. Delivery is scheduled for 12 Nov 2026.', at: '1 day ago' },
];

export default function NotificationsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {NOTIFS.map((n) => (
          <TouchableOpacity key={n.id} style={styles.card} activeOpacity={0.85} onPress={soon}>
            <View style={styles.iconCircle}>
              <Icon name="bell" size={17} color={colors.pinkStrong} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardText}>{n.text}</Text>
              <Text style={styles.cardTime}>{n.at}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="tagi" size={17} color={colors.pinkStrong} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardText}>Welcome to Tamboo! Use FIRST500 for ₹500 off your first booking.</Text>
            <Text style={styles.cardTime}>Offer</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  card: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: 16, padding: 14, ...shadow.card },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  cardText: { fontSize: 13.5, fontWeight: '600', color: colors.text, lineHeight: 19 },
  cardTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
