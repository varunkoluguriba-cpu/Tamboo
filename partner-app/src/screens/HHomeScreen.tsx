import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { VenueTabBar } from '../components/TabBar';
import LanguageSheet from '../components/LanguageSheet';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { statusColors } from '../data/catalog';
import { useHallTokens, tokenUiStatus } from '../hooks/useHallTokens';
import { colors, shadow } from '../theme';

const COMMISSION_PCT = 10;
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function HHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { partner } = useAuth();
  const { lang, t } = useLanguage();
  const [langSheet, setLangSheet] = useState(false);
  const { tokens: remoteTokens } = useHallTokens();
  const HALL_TOKENS = remoteTokens.map((tok) => ({
    id: tok.id,
    status: tokenUiStatus(tok),
    event: tok.hallName,
    customer: tok.customer,
    date: tok.date,
    slot: tok.slot,
    guests: tok.guests,
    amount: tok.amount,
    visitTxt: tok.status === 'token_paid' ? t.htokensTabPending : t.htokensTabVisited,
  }));

  const active = HALL_TOKENS.filter((tok) => tok.status === 'ACTIVE');
  const visited = HALL_TOKENS.filter((tok) => tok.status === 'VISITED');
  const converted = HALL_TOKENS.filter((tok) => tok.status === 'CONFIRMED');
  const totalTokenAmount = HALL_TOKENS.reduce((sum, tok) => sum + tok.amount, 0);
  const income = Math.round(totalTokenAmount * (1 - COMMISSION_PCT / 100));
  const needsAttention = [...active, ...visited];
  const tokenStatusLabel = (s: string) => (s === 'ACTIVE' ? t.hhomeStatusActive : s === 'VISITED' ? t.hhomeStatusVisited : s);

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
            <Text style={styles.hello}>{t.hhomeGreeting} · {partner?.venueType || t.hhomeDefaultVenueType}</Text>
            <Text style={styles.name}>{partner?.businessName}</Text>
          </View>
          <TouchableOpacity style={styles.langChip} activeOpacity={0.8} onPress={() => setLangSheet(true)}>
            <Text style={styles.langDevanagari}>अ</Text>
            <Text style={styles.langText}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statGrid}>
          <TouchableOpacity style={styles.statGrad} activeOpacity={0.85} onPress={() => navigation.navigate('HTokens')}>
            <View style={styles.statGradInner}>
              <Text style={styles.statGradLabel}>{t.hhomeStatPrebooked}</Text>
              <Text style={styles.statGradValue}>{active.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={() => navigation.navigate('HTokens')}>
            <Text style={styles.statLabel}>{t.hhomeStatVisited}</Text>
            <Text style={styles.statValue}>{visited.length}</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t.hhomeStatConfirmedBookings}</Text>
            <Text style={[styles.statValueSm, { color: colors.maroon }]}>{converted.length}</Text>
          </View>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={() => navigation.navigate('Earnings')}>
            <Text style={styles.statLabel}>{t.hhomeStatTokenIncome}</Text>
            <Text style={[styles.statValueSm, { color: colors.maroon }]}>{inr(income)}</Text>
            <Text style={styles.statNote}>{t.hhomeCommissionNote.replace('{pct}', String(COMMISSION_PCT))}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dashedBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Halls')}>
          <Icon name="camera" size={16} color={colors.pinkStrong} />
          <Text style={styles.dashedBtnText}>{t.hhomeEditHallDetails}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} activeOpacity={0.85} onPress={() => navigation.navigate('Calendar')}>
          <Icon name="calendar" size={18} color={colors.pink} />
          <Text style={styles.linkRowText}>{t.hhomeCalendarLink}</Text>
          <Icon name="right" size={16} color={colors.dividerStrong} />
        </TouchableOpacity>

        <View>
          <Text style={styles.sectionTitle}>{t.hhomeNeedsAttention}</Text>
          {needsAttention.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.hhomeNoPendingPrebookings}</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {needsAttention.map((tok) => {
                const sc = statusColors(tok.status);
                return (
                  <TouchableOpacity key={tok.id} style={styles.tokenCard} activeOpacity={0.85} onPress={() => navigation.navigate('HToken', { id: tok.id })}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.tokenId}>{tok.id}</Text>
                      <View style={[styles.pill, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.pillText, { color: sc.color }]}>{tokenStatusLabel(tok.status)}</Text>
                      </View>
                    </View>
                    <Text style={styles.tokenEvent}>{tok.event}</Text>
                    <Text style={styles.tokenMeta}>{tok.customer} · {tok.date} · {tok.slot} · {tok.guests} {t.hhomeGuestsSuffix}</Text>
                    <Text style={styles.tokenVisit}>{t.hhomeVisitLabel}: {tok.visitTxt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <VenueTabBar active="hhome" navigation={navigation} badge={{ htokens: active.length || undefined }} />
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
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statGrad: { width: '47%', borderRadius: 18, backgroundColor: colors.maroon },
  statGradInner: { borderRadius: 18, padding: 14, gap: 4 },
  statGradLabel: { color: '#fff', fontSize: 12 },
  statGradValue: { color: '#fff', fontFamily: 'Sora', fontSize: 28, fontWeight: '800' },
  statCard: { width: '47%', backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 4, ...shadow.card },
  statLabel: { fontSize: 12, color: colors.textSoft },
  statValue: { fontFamily: 'Sora', fontSize: 28, fontWeight: '800', color: colors.text },
  statValueSm: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800' },
  statNote: { fontSize: 11, color: colors.textMuted },
  dashedBtn: { height: 52, borderRadius: 18, borderWidth: 1.5, borderColor: colors.pink, borderStyle: 'dashed', backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dashedBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 14.5, fontFamily: 'Sora' },
  linkRow: { height: 52, borderRadius: 18, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, ...shadow.card },
  linkRowText: { flex: 1, fontWeight: '700', fontSize: 14, color: colors.text },
  sectionTitle: { fontFamily: 'Sora', fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, alignItems: 'center' },
  emptyText: { color: colors.textSoft, fontSize: 13 },
  tokenCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 5, ...shadow.card },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  tokenId: { fontFamily: 'Sora', fontWeight: '800', fontSize: 13, color: colors.textMuted },
  tokenEvent: { fontSize: 15, fontWeight: '700', color: colors.text },
  tokenMeta: { fontSize: 12.5, color: colors.textSoft },
  tokenVisit: { fontSize: 12.5, color: '#4b4560' },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontSize: 11, fontWeight: '700' },
});
