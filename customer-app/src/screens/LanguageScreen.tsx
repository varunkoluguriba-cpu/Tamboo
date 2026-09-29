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
import { HOME_MODE_KEY } from '../constants';

type Props = NativeStackScreenProps<AuthStackParamList, 'Language'>;

type Intent = 'rentals' | 'venues' | 'both';

const INTENTS: Array<{ key: Intent; label: string; desc: string; icon: IconName }> = [
  { key: 'rentals', label: 'Tent house & rentals', desc: 'Shamiana, chairs, vessels, decor', icon: 'tent' },
  { key: 'venues', label: 'Function halls & venues', desc: 'Banquet, marriage hall, hotel', icon: 'home' },
  { key: 'both', label: 'Both', desc: 'Hall plus everything for it', icon: 'grid' },
];

export default function LanguageScreen({ navigation }: Props) {
  const { lang, setLang, t } = useLanguage();
  const [intent, setIntent] = useState<Intent>('both');
  const notFull = !isFullyTranslated(lang);

  const continueNext = async () => {
    const homeMode = intent === 'venues' ? 'venues' : 'rentals';
    await AsyncStorage.setItem(HOME_MODE_KEY, homeMode).catch(() => {});
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.intentTitle}>What are you looking for?</Text>
          <Text style={styles.intentSubtitle}>We’ll set up your home screen for it. You can switch anytime.</Text>
          <View style={styles.intentList}>
            {INTENTS.map((o) => {
              const sel = intent === o.key;
              return (
                <TouchableOpacity key={o.key} activeOpacity={0.85} onPress={() => setIntent(o.key)}>
                  {sel ? (
                    <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.intentCard}>
                      <Icon name={o.icon} size={24} color="#fff" strokeWidth={1.5} />
                      <View style={styles.intentText}>
                        <Text style={[styles.intentLabel, styles.intentLabelSel]}>{o.label}</Text>
                        <Text style={[styles.intentDesc, styles.intentDescSel]}>{o.desc}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.intentCard, styles.intentCardUnsel]}>
                      <Icon name={o.icon} size={24} color={colors.text} strokeWidth={1.5} />
                      <View style={styles.intentText}>
                        <Text style={styles.intentLabel}>{o.label}</Text>
                        <Text style={[styles.intentDesc, { color: colors.textMuted }]}>{o.desc}</Text>
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
          <Text style={styles.subtitle}>English + 22 Indian languages. You can change this anytime from Profile.</Text>
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
            <Text style={styles.noticeText}>{langName(lang)[2]} translation is coming soon. English is shown until then.</Text>
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
  intentTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  intentSubtitle: { fontSize: 13.5, color: colors.textSoft, marginBottom: 10 },
  intentList: { gap: 8 },
  intentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  intentCardUnsel: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider },
  intentText: { flex: 1 },
  intentLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  intentLabelSel: { color: '#fff' },
  intentDesc: { fontSize: 12, marginTop: 2 },
  intentDescSel: { color: 'rgba(255,255,255,0.85)' },
  badge: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  badgeText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13.5, color: colors.textSoft },
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
