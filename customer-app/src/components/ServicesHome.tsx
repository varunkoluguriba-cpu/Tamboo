import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from './Icon';
import { useLanguage } from '../context/LanguageContext';
import { useServices } from '../context/ServicesContext';
import { SERVICE_CATEGORIES, serviceCategoryInfo } from '../utils/services';
import { colors, gradients, shadow } from '../theme';

// The "Services" mode of the home screen: the four service categories and the customer's
// free-request count. Only rendered when the server says services are on for this user.
export default function ServicesHome() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const { config } = useServices();
  const freeLeft = config.freeLeft ?? 0;

  return (
    <>
      <View style={styles.hero}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={StyleSheet.absoluteFill} />
        <Text style={styles.heroLabel}>{t.svHeroLabel}</Text>
        <Text style={styles.heroTitle}>{t.svHeroTitle}</Text>
        <Text style={styles.heroBody}>{t.svHeroBody}</Text>
        <View style={styles.freePill}>
          <Text style={styles.freePillText}>
            {freeLeft === 1 ? t.svFreeLeftOne : freeLeft > 0 ? t.svFreeLeft.replace('{n}', String(freeLeft)) : t.svFreeNone.replace('{hours}', String(config.noResponseHours ?? 24))}
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {SERVICE_CATEGORIES.map((c, i) => {
          const info = serviceCategoryInfo(c, t);
          return (
            <TouchableOpacity
              key={c}
              style={[styles.row, i === SERVICE_CATEGORIES.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ServiceList', { category: c })}
            >
              <View style={styles.iconWrap}><Icon name={info.icon} size={20} color={colors.pinkStrong} strokeWidth={1.8} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowTitle}>{info.label}</Text>
                <Text style={styles.rowEx}>{info.ex}</Text>
              </View>
              <Icon name="right" size={16} color={colors.dividerStrong} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.myBtn} activeOpacity={0.85} onPress={() => navigation.navigate('ServiceRequests')}>
        <Icon name="list" size={17} color={colors.pinkStrong} />
        <Text style={styles.myBtnText}>{t.svMyRequests}</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, overflow: 'hidden', gap: 6 },
  heroLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: 'rgba(255,255,255,0.85)' },
  heroTitle: { fontFamily: 'Sora', fontSize: 21, fontWeight: '800', color: '#fff', lineHeight: 27 },
  heroBody: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 19 },
  freePill: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  freePillText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  list: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  rowEx: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  myBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface },
  myBtnText: { color: colors.pinkStrong, fontWeight: '700', fontSize: 14 },
});
