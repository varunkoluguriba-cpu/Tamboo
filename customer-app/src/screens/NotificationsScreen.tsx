import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RemoteHallBooking, RemoteOrderSummary, RootStackParamList } from '../navigation/types';
import { api } from '../api/client';
import Icon from '../components/Icon';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const { t } = useLanguage();

  // Built from the customer's real orders, hall pre-bookings and quote offers — there's no push
  // backend yet, so this is the latest state of each rather than a log of every change.
  type Notif = { id: string; text: string; atMs: number; onPress: () => void };
  const [notifs, setNotifs] = useState<Notif[] | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<RemoteOrderSummary[]>('/api/orders/me').catch(() => []),
      api.get<RemoteHallBooking[]>('/api/halls/my-tokens').catch(() => []),
      api.get<Array<{ id: string; code: string; vendorName: string; status: string; createdAtMs?: number }>>('/api/quotes/me').catch(() => []),
    ]).then(([orders, halls, quotes]) => {
      const list: Notif[] = [
        ...orders.map((o) => ({
          id: 'o' + o.id,
          text: t.notifOrderStatus.replace('{code}', o.code).replace('{vendor}', o.vendorName).replace('{status}', o.status),
          atMs: o.createdAtMs,
          onPress: () => navigation.navigate('BookingDetail', { kind: 'order', order: o }),
        })),
        ...halls.map((b) => ({
          id: 'h' + b.id,
          text: t.notifHallStatus.replace('{hall}', b.hallName).replace('{date}', b.date).replace('{status}', b.status.replace(/_/g, ' ').toUpperCase()),
          atMs: b.heldAtMs,
          onPress: () => navigation.navigate('BookingDetail', { kind: 'hall', hall: b }),
        })),
        ...quotes.filter((q) => q.status === 'OFFER_SENT').map((q) => ({
          id: 'q' + q.id,
          text: t.notifQuoteOffer.replace('{vendor}', q.vendorName).replace('{code}', q.code),
          atMs: q.createdAtMs || 0,
          onPress: () => navigation.navigate('Bookings'),
        })),
      ];
      setNotifs(list.sort((a, b) => b.atMs - a.atMs).slice(0, 20));
    });
  }, [navigation, t]);

  const when = (ms: number) =>
    ms ? new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.notifTitle}</Text>
        </View>

        {notifs && notifs.length === 0 && <Text style={styles.empty}>{t.notifEmpty}</Text>}
        {(notifs || []).map((n) => (
          <TouchableOpacity key={n.id} style={styles.card} activeOpacity={0.85} onPress={n.onPress}>
            <View style={styles.iconCircle}>
              <Icon name="bell" size={17} color={colors.pinkStrong} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardText}>{n.text}</Text>
              <Text style={styles.cardTime}>{when(n.atMs)}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('Cart')}>
          <View style={styles.iconCircle}>
            <Icon name="tagi" size={17} color={colors.pinkStrong} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardText}>{t.notifWelcomeOffer}</Text>
            <Text style={styles.cardTime}>{t.notifOfferLabel}</Text>
          </View>
        </TouchableOpacity>
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
  empty: { fontSize: 13.5, color: colors.textSoft, textAlign: 'center', paddingVertical: 24, lineHeight: 20 },
});
