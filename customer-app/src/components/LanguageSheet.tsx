import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { LANGS } from '../i18n';
import { colors, gradients } from '../theme';
import LinearGradient from 'react-native-linear-gradient';

export default function LanguageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { lang, setLang } = useLanguage();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Language</Text>
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {LANGS.map(([code, native, en]) => {
                const sel = lang === code;
                return (
                  <TouchableOpacity
                    key={code}
                    activeOpacity={0.85}
                    onPress={() => {
                      setLang(code);
                      onClose();
                    }}
                    style={styles.tileWrap}
                  >
                    {sel ? (
                      <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.tile}>
                        <Text style={[styles.native, styles.textSel]}>{native}</Text>
                        <Text style={[styles.en, styles.subSel]}>{en}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.tile, styles.tileUnsel]}>
                        <Text style={styles.native}>{native}</Text>
                        <Text style={[styles.en, styles.sub]}>{en}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30,10,20,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28, gap: 12 },
  title: { fontFamily: 'Sora', fontWeight: '800', fontSize: 19, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tileWrap: { width: '48%' },
  tile: { height: 58, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 12 },
  tileUnsel: { borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface },
  native: { fontSize: 15.5, fontWeight: '700', color: colors.text, lineHeight: 19 },
  textSel: { color: '#fff' },
  en: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  sub: { color: colors.textMuted },
  subSel: { color: 'rgba(255,255,255,0.8)' },
});
