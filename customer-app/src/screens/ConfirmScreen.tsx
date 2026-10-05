import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Confirm'>;

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function ConfirmScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const orders = route.params?.orders || [];
  const split = orders.length > 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.checkCircle}>
          <Icon name="check" size={40} color="#fff" strokeWidth={2.5} />
        </LinearGradient>

        <Text style={styles.title}>{t.confirmPageTitle}</Text>
        <Text style={styles.sub}>{t.confirmPageSub}</Text>

        {split && (
          <View style={styles.splitNote}>
            <Text style={styles.splitNoteText}>{t.confirmPageSplitNote.replace('{count}', String(orders.length))}</Text>
          </View>
        )}

        <View style={styles.orderList}>
          {orders.map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>{o.id}</Text>
                <Text style={styles.orderMeta}>{o.vendor} · {t.confirmPagePendingConfirmation}</Text>
              </View>
              <Text style={styles.orderTotal}>{inr(o.total)}</Text>
              <Icon name="right" size={16} color={colors.dividerStrong} />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.trackBtnWrap} activeOpacity={0.85} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Bookings' }] })}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.trackBtn}>
            <Text style={styles.trackBtnText}>{t.confirmPageTrackBookings}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        >
          <Text style={styles.homeLink}>{t.confirmPageBackHome}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 22, paddingTop: 36, alignItems: 'center', gap: 16 },
  checkCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Sora', fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSoft, textAlign: 'center', maxWidth: 290, lineHeight: 21 },
  splitNote: { backgroundColor: colors.pinkBg, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  splitNoteText: { color: '#8a1538', fontSize: 12.5 },
  orderList: { width: '100%', gap: 8 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 14 },
  orderId: { fontFamily: 'Sora', fontWeight: '800', fontSize: 15, color: colors.text },
  orderMeta: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  orderTotal: { fontSize: 14, fontWeight: '700', color: colors.text },
  trackBtnWrap: { width: '100%' },
  trackBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 15.5, fontFamily: 'Sora' },
  homeLink: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13.5 },
});
