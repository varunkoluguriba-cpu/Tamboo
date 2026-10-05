import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import type { IconName } from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { LANGS, isFullyTranslated, langName } from '../i18n';
import { colors, gradients } from '../theme';
import { ROLE_KEY } from '../constants';
import type { PartnerRole } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Language'>;

export default function LanguageScreen({ navigation }: Props) {
  const { lang, setLang, t } = useLanguage();
  const [role, setRole] = useState<PartnerRole>('tent');
  const notFull = !isFullyTranslated(lang);

  const ROLES: Array<{ key: PartnerRole; label: string; desc: string; icon: IconName }> = [
    { key: 'tent', label: t.pLangScreenRoleTentLabel, desc: t.pLangScreenRoleTentDesc, icon: 'tent' },
    { key: 'venue', label: t.pLangScreenRoleVenueLabel, desc: t.pLangScreenRoleVenueDesc, icon: 'home' },
  ];

  const continueNext = async () => {
    await AsyncStorage.setItem(ROLE_KEY, role).catch(() => {});
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>{t.pLangScreenBizTitle}</Text>
          <Text style={styles.subtitle}>{t.pLangScreenBizSubtitle}</Text>
          <View style={styles.roleList}>
            {ROLES.map((o) => {
              const sel = role === o.key;
              return (
                <TouchableOpacity key={o.key} activeOpacity={0.85} onPress={() => setRole(o.key)}>
                  {sel ? (
                    <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.roleCard}>
                      <Icon name={o.icon} size={24} color="#fff" strokeWidth={1.5} />
                      <View style={styles.roleText}>
                        <Text style={[styles.roleLabel, styles.roleLabelSel]}>{o.label}</Text>
                        <Text style={[styles.roleDesc, styles.roleDescSel]}>{o.desc}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.roleCard, styles.roleCardUnsel]}>
                      <Icon name={o.icon} size={24} color={colors.text} strokeWidth={1.5} />
                      <View style={styles.roleText}>
                        <Text style={styles.roleLabel}>{o.label}</Text>
                        <Text style={[styles.roleDesc, { color: colors.textMuted }]}>{o.desc}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.badge}>
            <Text style={styles.badgeText}>अ</Text>
          </LinearGradient>
          <Text style={styles.title}>{t.chooseLang}</Text>
          <Text style={styles.subtitle}>{t.pLangScreenLangSubtitle}</Text>
        </View>

        <View style={styles.grid}>
          {LANGS.map(([code, native, en], i) => {
            const sel = lang === code;
            return (
              <TouchableOpacity key={code} activeOpacity={0.85} onPress={() => setLang(code)} style={[styles.tileWrap, i % 2 === 0 ? { paddingRight: 5 } : { paddingLeft: 5 }]}>
                {sel ? (
                  <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.tile}>
                    <Text style={[styles.tileNative, styles.tileTextSel]}>{native}</Text>
                    <Text style={[styles.tileEn, styles.tileSubSel]}>{en}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.tile, styles.tileUnsel]}>
                    <Text style={styles.tileNative}>{native}</Text>
                    <Text style={[styles.tileEn, styles.tileSub]}>{en}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {notFull && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{t.pLangScreenNotice.replace('{lang}', langName(lang)[2])}</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity activeOpacity={0.85} onPress={continueNext} style={styles.buttonWrap}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.button}>
          <Text style={styles.buttonText}>{t.cont}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 26, paddingTop: 12 },
  scroll: { paddingBottom: 10 },
  section: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13.5, color: colors.textSoft, marginBottom: 10 },
  roleList: { gap: 8 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  roleCardUnsel: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider },
  roleText: { flex: 1 },
  roleLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  roleLabelSel: { color: '#fff' },
  roleDesc: { fontSize: 12, marginTop: 2 },
  roleDescSel: { color: 'rgba(255,255,255,0.85)' },
  badge: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  badgeText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  tileWrap: { width: '50%', marginBottom: 10 },
  tile: { height: 66, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 14 },
  tileUnsel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
  tileNative: { fontSize: 17, fontWeight: '700', color: colors.text },
  tileTextSel: { color: '#fff' },
  tileEn: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  tileSub: { color: colors.textMuted },
  tileSubSel: { color: 'rgba(255,255,255,0.8)' },
  notice: { backgroundColor: colors.amberBg, borderRadius: 14, padding: 12, marginBottom: 12 },
  noticeText: { color: colors.amber, fontSize: 12.5, lineHeight: 18 },
  buttonWrap: { paddingBottom: 12, paddingTop: 4 },
  button: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
});
