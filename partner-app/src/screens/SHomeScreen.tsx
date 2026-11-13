import React, { useCallback, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import LanguageSheet from '../components/LanguageSheet';
import VerificationBanner from '../components/VerificationBanner';
import LaunchBanner from '../components/LaunchBanner';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { prettyPhone } from '../utils/date';
import { colors, shadow } from '../theme';

type ServiceRequest = {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  eventDate: string;
  eventType: string;
  guests: number;
  area: string;
  message: string;
  offerTitle: string;
  status: 'NEW' | 'CONTACTED' | 'CLOSED' | 'NO_RESPONSE';
  createdAt: string;
};

// Home for an event-service partner (priest / caterer / decorator / musician): the quote
// requests customers sent them, with the customer's name and number to call.
export default function SHomeScreen() {
  const { partner } = useAuth();
  const { t, lang } = useLanguage();
  const [langSheet, setLangSheet] = useState(false);
  const [list, setList] = useState<ServiceRequest[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const servicesOn = !!partner?.servicesEnabled;

  const load = useCallback(() => {
    if (!servicesOn) return Promise.resolve();
    setFailed(false);
    return api.get<ServiceRequest[]>('/api/services/vendor/me/requests')
      .then(setList)
      .catch(() => { setFailed(true); setList((l) => l ?? []); });
  }, [servicesOn]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const act = async (r: ServiceRequest, action: 'contacted' | 'closed') => {
    try {
      const updated = await api.patch<ServiceRequest>(`/api/services/vendor/me/requests/${r.id}`, { action });
      setList((l) => (l || []).map((x) => (x.id === r.id ? updated : x)));
    } catch (e) {
      Alert.alert(e instanceof ApiError ? e.message : t.tryAgain);
    }
  };

  const initials = (partner?.businessName || '?').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const newCount = (list || []).filter((r) => r.status === 'NEW').length;
  const contactedCount = (list || []).filter((r) => r.status === 'CONTACTED' || r.status === 'CLOSED').length;
  const occasionText = (o: string) => ({
    Wedding: t.psOccWedding, Reception: t.psOccReception, Birthday: t.psOccBirthday, 'House party': t.psOccHouseParty, Corporate: t.psOccCorporate,
  } as Record<string, string>)[o] || o;
  const statusLabel = (s: ServiceRequest['status']) => ({ NEW: t.psStatusNew, CONTACTED: t.psStatusContacted, CLOSED: t.psStatusClosed, NO_RESPONSE: t.psStatusNoResponse }[s]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load().finally(() => setRefreshing(false)); }} />}
      >
        <View style={styles.headRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.hello}>{t.hhomeGreeting}</Text>
            <Text style={styles.name} numberOfLines={2}>{partner?.businessName}</Text>
          </View>
          <TouchableOpacity style={styles.langChip} activeOpacity={0.8} onPress={() => setLangSheet(true)}>
            <Text style={styles.langDevanagari}>अ</Text>
            <Text style={styles.langText}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <VerificationBanner />
        <LaunchBanner />

        {!servicesOn ? (
          <View style={styles.notice}><Text style={styles.noticeText}>{t.psNotOpen}</Text></View>
        ) : (
          <>
            <View style={styles.statRow}>
              <View style={[styles.statCard, styles.statHot]}>
                <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.85)' }]}>{t.psNewCount}</Text>
                <Text style={[styles.statValue, { color: '#fff' }]}>{newCount}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t.psContactedCount}</Text>
                <Text style={styles.statValue}>{contactedCount}</Text>
              </View>
            </View>
            <Text style={styles.note}>{t.psRespondNote}</Text>

            <Text style={styles.sectionTitle}>{t.psRequestsTitle}</Text>
            {list !== null && list.length === 0 && (
              <View style={styles.empty}><Text style={styles.emptyText}>{failed ? t.loadFailedMsg : t.psNoRequests}</Text></View>
            )}
            {(list || []).map((r) => (
              <View key={r.id} style={[styles.card, r.status === 'NEW' && styles.cardNew]}>
                <View style={styles.cardTop}>
                  <Text style={styles.code}>{r.code}</Text>
                  <Text style={[styles.status, r.status === 'NEW' ? styles.statusNew : r.status === 'NO_RESPONSE' ? styles.statusMissed : styles.statusOk]}>{statusLabel(r.status)}</Text>
                </View>
                <Text style={styles.customer}>{r.customerName}</Text>
                <Text style={styles.meta}>
                  {[r.eventDate, occasionText(r.eventType), r.guests > 0 ? t.psGuests.replace('{n}', String(r.guests)) : '', r.area].filter(Boolean).join(' · ')}
                </Text>
                {!!r.offerTitle && <Text style={styles.asked}>{t.psAskedAbout.replace('{title}', r.offerTitle)}</Text>}
                {!!r.message && <Text style={styles.msg}>{r.message}</Text>}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={() => Linking.openURL(`tel:${r.customerPhone}`).catch(() => {})}>
                    <Icon name="phone" size={15} color="#fff" />
                    <Text style={styles.callText}>{t.psCall} {prettyPhone(r.customerPhone)}</Text>
                  </TouchableOpacity>
                  {(r.status === 'NEW' || r.status === 'NO_RESPONSE') && (
                    <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.85} onPress={() => act(r, 'contacted')}>
                      <Text style={styles.ghostText}>{t.psMarkContacted}</Text>
                    </TouchableOpacity>
                  )}
                  {r.status === 'CONTACTED' && (
                    <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.85} onPress={() => act(r, 'closed')}>
                      <Text style={styles.ghostText}>{t.psMarkDone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <LanguageSheet visible={langSheet} onClose={() => setLangSheet(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 8, gap: 14, paddingBottom: 32 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: 'Sora', fontWeight: '800', fontSize: 16 },
  hello: { fontSize: 12.5, color: colors.textSoft },
  name: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  langChip: { height: 34, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 5, ...shadow.card },
  langDevanagari: { fontSize: 13, color: colors.pinkStrong, fontWeight: '700' },
  langText: { fontSize: 12, fontWeight: '800', color: colors.text },
  notice: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, ...shadow.card },
  noticeText: { fontSize: 13.5, color: colors.textSoft, lineHeight: 20 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 4, ...shadow.card },
  statHot: { backgroundColor: colors.maroon },
  statLabel: { fontSize: 12, color: colors.textSoft },
  statValue: { fontFamily: 'Sora', fontSize: 28, fontWeight: '800', color: colors.text },
  note: { fontSize: 12.5, color: colors.textSoft, lineHeight: 18 },
  sectionTitle: { fontFamily: 'Sora', fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  empty: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, ...shadow.card },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 4, ...shadow.card },
  cardNew: { borderWidth: 1.5, borderColor: colors.pink },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  status: { fontSize: 11.5, fontWeight: '700', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, overflow: 'hidden' },
  statusNew: { backgroundColor: colors.pinkBg, color: colors.pinkStrong },
  statusOk: { backgroundColor: colors.greenBg, color: colors.green },
  statusMissed: { backgroundColor: colors.amberBg, color: colors.amber },
  customer: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12.5, color: colors.textSoft },
  asked: { fontSize: 12.5, fontWeight: '700', color: colors.pinkStrong },
  msg: { fontSize: 13, color: colors.text, backgroundColor: colors.bg, borderRadius: 10, padding: 8, marginTop: 4, lineHeight: 19 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.maroon, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  callText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  ghostBtn: { borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: colors.surface },
  ghostText: { color: colors.text, fontWeight: '700', fontSize: 13 },
});
