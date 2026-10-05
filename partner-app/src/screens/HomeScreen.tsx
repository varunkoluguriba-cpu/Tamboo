import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { TentTabBar } from '../components/TabBar';
import LanguageSheet from '../components/LanguageSheet';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOrders } from '../hooks/useOrders';
import { api } from '../api/client';
import { statusColors } from '../data/catalog';
import { colors, gradients, shadow } from '../theme';

const ACTIVE_STATUSES = ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { partner } = useAuth();
  const { lang, t } = useLanguage();
  const [langSheet, setLangSheet] = useState(false);
  const { orders: ORDERS } = useOrders();
  const [itemCounts, setItemCounts] = useState({ live: 0, review: 0 });

  useEffect(() => {
    api.get<Array<{ state: string }>>('/api/vendors/me/items')
      .then((items) => setItemCounts({
        live: items.filter((i) => i.state === 'LIVE').length,
        review: items.filter((i) => i.state === 'REVIEW').length,
      }))
      .catch(() => {});
  }, []);

  const newCount = ORDERS.filter((o) => o.status === 'PENDING').length;
  const activeCount = ORDERS.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const earnings = ORDERS.filter((o) => o.status === 'COMPLETED').reduce((sum, o) => sum + o.earn, 0);
  const liveItems = itemCounts.live;
  const reviewItems = itemCounts.review;
  const upcoming = ORDERS.filter((o) => ACTIVE_STATUSES.includes(o.status));

  const initials = (partner?.businessName || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.hello}>{t.pHomeGreeting}</Text>
            <Text style={styles.name}>{partner?.businessName}</Text>
          </View>
          <TouchableOpacity style={styles.langChip} activeOpacity={0.8} onPress={() => setLangSheet(true)}>
            <Text style={styles.langDevanagari}>अ</Text>
            <Text style={styles.langText}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statGrid}>
          <TouchableOpacity style={styles.statGrad} activeOpacity={0.85} onPress={() => navigation.navigate('Orders')}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.statGradInner}>
              <Text style={styles.statGradLabel}>{t.pHomeNewRequests}</Text>
              <Text style={styles.statGradValue}>{newCount}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.statLabel}>{t.pHomeActiveJobs}</Text>
            <Text style={styles.statValue}>{activeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={() => navigation.navigate('Earnings')}>
            <Text style={styles.statLabel}>{t.pHomeEarningsMonth}</Text>
            <Text style={[styles.statValueSm, { color: colors.maroon }]}>{inr(earnings)}</Text>
            <Text style={styles.statNote}>{t.pHomeAfterCommission}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={() => navigation.navigate('Items')}>
            <Text style={styles.statLabel}>{t.pHomeItemsLive}</Text>
            <Text style={styles.statValueSm}>{liveItems}</Text>
            <Text style={styles.statNote}>{reviewItems > 0 ? t.pHomeInReview.replace('{count}', String(reviewItems)) : t.pHomeAllApproved}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dashedBtn} activeOpacity={0.85} onPress={() => navigation.navigate('ItemForm', {})}>
          <Icon name="plus" size={16} color={colors.pinkStrong} />
          <Text style={styles.dashedBtnText}>{t.pHomeAddRentalItem}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} activeOpacity={0.85} onPress={() => navigation.navigate('Calendar')}>
          <Icon name="calendar" size={18} color={colors.pink} />
          <Text style={styles.linkRowText}>{t.pHomeCalendarLink}</Text>
          <Icon name="right" size={16} color={colors.dividerStrong} />
        </TouchableOpacity>

        <View>
          <Text style={styles.sectionTitle}>{t.pHomeUpcomingJobs}</Text>
          {upcoming.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.pHomeNoUpcomingJobs}</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {upcoming.map((o) => {
                const sc = statusColors(o.status);
                const [day, mon] = o.dateTxt.split(' ');
                return (
                  <TouchableOpacity key={o.id} style={styles.jobRow} activeOpacity={0.85} onPress={() => navigation.navigate('Order', { id: o.id })}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateMon}>{mon}</Text>
                      <Text style={styles.dateDay}>{day}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.jobEvent}>{o.event}</Text>
                      <Text style={styles.jobMeta}>{o.customer} · {t.pHomeGuestsCount.replace('{count}', String(o.guests))}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.pillText, { color: sc.color }]}>{o.status.replace(/_/g, ' ')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <TentTabBar active="home" navigation={navigation} badge={{ orders: newCount || undefined }} />
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
  name: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  langChip: { height: 34, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 5, ...shadow.card },
  langDevanagari: { color: colors.pink, fontWeight: '700' },
  langText: { fontWeight: '700', fontSize: 12.5, color: colors.text },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statGrad: { width: '47%' },
  statGradInner: { borderRadius: 18, padding: 14, gap: 4 },
  statGradLabel: { color: '#fff', fontSize: 12 },
  statGradValue: { color: '#fff', fontFamily: 'Sora', fontSize: 28, fontWeight: '800' },
  statCard: { width: '47%', backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 4, ...shadow.card },
  statLabel: { fontSize: 12, color: colors.textSoft },
  statValue: { fontFamily: 'Sora', fontSize: 28, fontWeight: '800', color: colors.text },
  statValueSm: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  statNote: { fontSize: 11, color: colors.textMuted },
  dashedBtn: { height: 52, borderRadius: 18, borderWidth: 1.5, borderColor: colors.pink, borderStyle: 'dashed', backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dashedBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 14.5, fontFamily: 'Sora' },
  linkRow: { height: 52, borderRadius: 18, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, ...shadow.card },
  linkRowText: { flex: 1, fontWeight: '700', fontSize: 14, color: colors.text },
  sectionTitle: { fontFamily: 'Sora', fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, alignItems: 'center' },
  emptyText: { color: colors.textSoft, fontSize: 13 },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 12, ...shadow.card },
  dateBox: { width: 46, alignItems: 'center', backgroundColor: colors.pinkBg, borderRadius: 12, paddingVertical: 6 },
  dateMon: { fontSize: 10.5, fontWeight: '700', color: colors.pinkStrong, textTransform: 'uppercase' },
  dateDay: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.maroon },
  jobEvent: { fontSize: 14, fontWeight: '700', color: colors.text },
  jobMeta: { fontSize: 12, color: colors.textSoft },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
