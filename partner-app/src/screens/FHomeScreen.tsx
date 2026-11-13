import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { api } from '../api/client';
import Icon from '../components/Icon';
import LanguageSheet from '../components/LanguageSheet';
import VerificationBanner from '../components/VerificationBanner';
import LaunchBanner from '../components/LaunchBanner';
import DeleteAccountButton from '../components/DeleteAccountButton';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { farmDate, slotLabel, time12, type MyFarm, type OwnerFarmBooking } from '../utils/farm';
import { colors, gradients, shadow } from '../theme';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Farm-house owner's home: what's coming up, earnings, and quick links to listing & calendar.
export default function FHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { partner, logout } = useAuth();
  const { lang, t } = useLanguage();
  const [langSheet, setLangSheet] = useState(false);
  const [bookings, setBookings] = useState<OwnerFarmBooking[]>([]);
  const [farms, setFarms] = useState<MyFarm[] | null>(null);
  const [income, setIncome] = useState(0);

  useFocusEffect(useCallback(() => {
    api.get<OwnerFarmBooking[]>('/api/farms/me/bookings').then(setBookings).catch(() => {});
    api.get<MyFarm[]>('/api/farms/me/farms').then(setFarms).catch(() => setFarms([]));
    api.get<{ balance: number }>('/api/partner-auth/payouts').then((r) => setIncome(r.balance)).catch(() => {});
  }, []));

  // Confirmed stays stay here until the owner marks them completed (sorted soonest first by the server).
  const upcoming = bookings.filter((b) => b.status === 'confirmed' || b.status === 'disputed');
  const thisMonth = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7);
  const bookedThisMonth = bookings.filter((b) => b.status !== 'cancelled' && b.date.startsWith(thisMonth)).length;

  const initials = (partner?.businessName || '?').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.hello}>{t.hhomeGreeting} · {t.pfRoleFarm}</Text>
            <Text style={styles.name} numberOfLines={2}>{partner?.businessName}</Text>
          </View>
          <TouchableOpacity style={styles.langChip} activeOpacity={0.8} onPress={() => setLangSheet(true)}>
            <Text style={styles.langDevanagari}>अ</Text>
            <Text style={styles.langText}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <VerificationBanner />
        <LaunchBanner />

        {farms !== null && farms.length === 0 && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('FFarm', {})}>
            <View style={styles.addCard}>
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={StyleSheet.absoluteFill} />
              <Text style={styles.addCardText}>{t.pfNoFarmYet}</Text>
              <View style={styles.addCardBtn}>
                <Icon name="plus" size={15} color={colors.maroon} />
                <Text style={styles.addCardBtnText}>{t.pfAddFarm}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.statGrid}>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={() => navigation.navigate('FBookings')}>
            <Text style={styles.statLabel}>{t.pfStatUpcoming}</Text>
            <Text style={styles.statValue}>{upcoming.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={() => navigation.navigate('FBookings')}>
            <Text style={styles.statLabel}>{t.pfStatThisMonth}</Text>
            <Text style={styles.statValue}>{bookedThisMonth}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { width: '100%' }]} activeOpacity={0.85} onPress={() => navigation.navigate('Earnings')}>
            <Text style={styles.statLabel}>{t.pfStatEarnings}</Text>
            <Text style={[styles.statValueSm, { color: colors.maroon }]}>{inr(income)}</Text>
            <Text style={styles.statNote}>{t.hhomeEarningsNote}</Text>
          </TouchableOpacity>
        </View>

        {!!farms?.length && (
          <TouchableOpacity style={styles.dashedBtn} activeOpacity={0.85} onPress={() => navigation.navigate('FFarms')}>
            <Icon name="camera" size={16} color={colors.pinkStrong} />
            <Text style={styles.dashedBtnText}>{t.pfEditFarms}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.linkRow} activeOpacity={0.85} onPress={() => navigation.navigate('FCalendar')}>
          <Icon name="calendar" size={18} color={colors.pink} />
          <Text style={styles.linkRowText}>{t.pfCalendarLink}</Text>
          <Icon name="right" size={16} color={colors.dividerStrong} />
        </TouchableOpacity>

        <View>
          <Text style={styles.sectionTitle}>{t.pfNextStays}</Text>
          {upcoming.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>{t.pfNoUpcoming}</Text></View>
          ) : (
            <View style={{ gap: 8 }}>
              {upcoming.slice(0, 5).map((b) => (
                <TouchableOpacity key={b.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('FBooking', { id: b.id })}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.code}>{b.code}</Text>
                    <Text style={styles.slotPill}>{slotLabel(b.slot, t)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{farmDate(b.date, t)} · {time12(b.checkIn)}</Text>
                  <Text style={styles.cardMeta}>{b.customerName || t.pfCustomer} · {t.pfGuestsN.replace('{n}', String(b.guests))}{farms && farms.length > 1 ? ` · ${b.farmName}` : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Chat', { customerName: t.tambooSupport })}>
          <Text style={styles.outlineText}>{t.tambooSupport}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={logout}>
          <Icon name="logout" size={16} color={colors.text} />
          <Text style={styles.outlineText}>{t.logout}</Text>
        </TouchableOpacity>
        <DeleteAccountButton />
      </ScrollView>
      <LanguageSheet visible={langSheet} onClose={() => setLangSheet(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 8, gap: 16 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: 'Sora', fontWeight: '800', fontSize: 16 },
  hello: { fontSize: 12.5, color: colors.textSoft },
  name: { fontFamily: 'Sora', fontSize: 17, fontWeight: '800', color: colors.text },
  langChip: { height: 34, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 5, ...shadow.card },
  langDevanagari: { color: colors.pink, fontWeight: '700' },
  langText: { fontWeight: '700', fontSize: 12.5, color: colors.text },
  addCard: { borderRadius: 18, padding: 16, gap: 12, overflow: 'hidden' },
  addCardText: { color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  addCardBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  addCardBtnText: { color: colors.maroon, fontWeight: '800', fontSize: 13.5 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 4, ...shadow.card },
  statLabel: { fontSize: 12, color: colors.textSoft },
  statValue: { fontFamily: 'Sora', fontSize: 28, fontWeight: '800', color: colors.text },
  statValueSm: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800' },
  statNote: { fontSize: 11, color: colors.textMuted },
  dashedBtn: { height: 52, borderRadius: 18, borderWidth: 1.5, borderColor: colors.pink, borderStyle: 'dashed', backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dashedBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 14.5, fontFamily: 'Sora' },
  linkRow: { minHeight: 52, borderRadius: 18, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, ...shadow.card },
  linkRowText: { flex: 1, fontWeight: '700', fontSize: 14, color: colors.text },
  sectionTitle: { fontFamily: 'Sora', fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, alignItems: 'center' },
  emptyText: { color: colors.textSoft, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 5, ...shadow.card },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { fontFamily: 'Sora', fontWeight: '800', fontSize: 13, color: colors.textMuted },
  slotPill: { fontSize: 11, fontWeight: '700', color: colors.pinkStrong, backgroundColor: colors.pinkBg, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, overflow: 'hidden' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 12.5, color: colors.textSoft },
  outlineBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  outlineText: { color: colors.text, fontWeight: '600', fontSize: 14 },
});
