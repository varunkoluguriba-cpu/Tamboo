import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useLanguage } from '../context/LanguageContext';
import { LANGS, isFullyTranslated, langName } from '../i18n';
import { colors, gradients } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Language'>;

export default function LanguageScreen({ navigation }: Props) {
  const { lang, setLang, t } = useLanguage();
  const notFull = !isFullyTranslated(lang);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.badge}>
          <Text style={styles.badgeText}>अ</Text>
        </LinearGradient>
        <Text style={styles.title}>{t.chooseLang}</Text>
        <Text style={styles.subtitle}>English + 22 Indian languages. You can change this anytime from Profile.</Text>
      </View>

      <FlatList
        data={LANGS}
        keyExtractor={([code]) => code}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item: [code, native, en] }) => {
          const sel = lang === code;
          return (
            <TouchableOpacity activeOpacity={0.85} onPress={() => setLang(code)} style={styles.tileWrap}>
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
        }}
      />

      {notFull && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{langName(lang)[2]} translation is coming soon. English is shown until then.</Text>
        </View>
      )}

      <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.replace('Login')}>
        <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.button}>
          <Text style={styles.buttonText}>{t.cont}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: 26, paddingTop: 12 },
  header: { alignItems: 'flex-start', marginBottom: 18 },
  badge: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  badgeText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13.5, color: colors.textSoft },
  grid: { paddingBottom: 10 },
  row: { gap: 10, marginBottom: 10 },
  tileWrap: { flex: 1 },
  tile: { height: 66, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 14 },
  tileUnsel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
  tileNative: { fontSize: 17, fontWeight: '700', color: colors.text },
  tileTextSel: { color: '#fff' },
  tileEn: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  tileSub: { color: colors.textMuted },
  tileSubSel: { color: 'rgba(255,255,255,0.8)' },
  notice: { backgroundColor: colors.amberBg, borderRadius: 14, padding: 12, marginBottom: 12 },
  noticeText: { color: colors.amber, fontSize: 12.5, lineHeight: 18 },
  button: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
});
