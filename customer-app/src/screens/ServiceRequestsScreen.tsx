import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { serviceCategoryInfo, type MyServiceRequest } from '../utils/services';
import { metaLine } from '../utils/rating';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceRequests'>;

export default function ServiceRequestsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [list, setList] = useState<MyServiceRequest[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    return api.get<MyServiceRequest[]>('/api/services/requests/me')
      .then(setList)
      .catch(() => { setFailed(true); setList((l) => l ?? []); });
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const statusText = (r: MyServiceRequest) => ({
    NEW: t.svStNew, CONTACTED: t.svStContacted, CLOSED: t.svStClosed, NO_RESPONSE: t.svStNoResponse,
  }[r.status]);
  const statusStyle = (r: MyServiceRequest) =>
    r.status === 'NO_RESPONSE' ? { bg: styles.pillWarn, fg: styles.pillWarnText }
      : r.status === 'NEW' ? { bg: styles.pillInfo, fg: styles.pillInfoText } : { bg: styles.pillOk, fg: styles.pillOkText };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load().finally(() => setRefreshing(false)); }} />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t.svMyRequests}</Text>
        </View>

        {list === null ? (
          <ActivityIndicator color={colors.pink} style={{ marginTop: 40 }} />
        ) : list.length === 0 ? (
          <Text style={styles.empty}>{failed ? t.loadFailedMsg : t.svReqsEmpty}</Text>
        ) : (
          list.map((r) => {
            const info = serviceCategoryInfo(r.category, t);
            return (
              <TouchableOpacity key={r.id} style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('ServiceVendor', { id: r.vendorId })}>
                <View style={styles.top}>
                  <Text style={styles.code}>{r.code}</Text>
                  <View style={[styles.pill, statusStyle(r).bg]}><Text style={[styles.pillText, statusStyle(r).fg]}>{statusText(r)}</Text></View>
                </View>
                <Text style={styles.vendor}>{r.vendorName}</Text>
                <Text style={styles.meta}>{metaLine(info.label, r.eventDate, r.offerTitle)}</Text>
                {!!r.message && <Text style={styles.msg} numberOfLines={2}>{r.message}</Text>}
                <Text style={styles.fee}>{r.fee > 0 ? t.svFeePaid.replace('{fee}', String(r.fee)) : t.svFreeRequest}</Text>
                {r.status === 'NO_RESPONSE' && (
                  <Text style={styles.note}>
                    {r.fee === 0
                      ? t.svNoRespFree
                      : (r.refundStatus === 'refunded' ? t.svNoRespRefunded : t.svNoRespPending).replace('{fee}', String(r.refundAmount || r.fee))}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text, flex: 1 },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13.5, marginTop: 40 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 4, ...shadow.card },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  pill: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  pillInfo: { backgroundColor: colors.purpleBg },
  pillInfoText: { color: '#5b3fb0' },
  pillOk: { backgroundColor: colors.greenBg },
  pillOkText: { color: colors.green },
  pillWarn: { backgroundColor: colors.amberBg },
  pillWarnText: { color: colors.amber },
  vendor: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12.5, color: colors.textSoft },
  msg: { fontSize: 13, color: colors.text, backgroundColor: colors.bg, borderRadius: 10, padding: 8, marginTop: 4 },
  fee: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  note: { fontSize: 12.5, color: colors.amber, fontWeight: '600', marginTop: 2 },
});
