import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { languageText, offerPriceText, serviceCategoryInfo, traditionText, type PublicServiceVendor } from '../utils/services';
import { metaLine } from '../utils/rating';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceVendor'>;

export default function ServiceVendorScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const [v, setV] = useState<PublicServiceVendor | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get<PublicServiceVendor>(`/api/services/${route.params.id}`).then(setV).catch(() => setFailed(true));
  }, [route.params.id]);

  if (!v) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        {failed ? <Text style={styles.muted}>{t.loadFailedMsg}</Text> : <ActivityIndicator color={colors.pink} />}
      </SafeAreaView>
    );
  }

  const info = serviceCategoryInfo(v.category, t);
  const ask = (offer?: { id: string; title: string }) =>
    navigation.navigate('ServiceRequest', { vendorId: v.id, vendorName: v.name, category: v.category, offerId: offer?.id, offerTitle: offer?.title });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.cover}>
          {v.photos[0] ? (
            <Image source={{ uri: v.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Icon name={info.icon} size={34} color={colors.pinkStrong} strokeWidth={1.5} />
          )}
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.cat}>{info.label}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{v.name}</Text>
            {v.verified && <Icon name="shield" size={16} color={colors.green} />}
          </View>
          <Text style={styles.muted}>{metaLine(v.area, v.city, v.experienceYears > 0 && t.svExperience.replace('{n}', String(v.experienceYears)))}</Text>

          {v.photos.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {v.photos.map((uri, i) => <Image key={i} source={{ uri }} style={styles.thumb} />)}
            </ScrollView>
          )}

          {!!v.about && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.svAbout}</Text>
              <Text style={styles.cardText}>{v.about}</Text>
            </View>
          )}

          {(v.traditions.length > 0 || v.languages.length > 0 || v.areas.length > 0) && (
            <View style={styles.card}>
              {v.traditions.length > 0 && <Fact label={t.svTraditions} value={v.traditions.map((x) => traditionText(x, t)).join(', ')} />}
              {v.languages.length > 0 && <Fact label={t.svLanguages} value={v.languages.map(languageText).join(', ')} />}
              {v.areas.length > 0 && <Fact label={t.svServes} value={v.areas.join(', ')} />}
            </View>
          )}

          {(v.offers || []).length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>{t.svPackages}</Text>
              {(v.offers || []).map((o) => (
                <View key={o.id} style={styles.offer}>
                  <View style={styles.offerTop}>
                    <Text style={styles.offerTitle}>{o.title}</Text>
                    <Text style={styles.offerPrice}>{offerPriceText(o, t)}</Text>
                  </View>
                  {!!o.description && <Text style={styles.cardText}>{o.description}</Text>}
                  <TouchableOpacity activeOpacity={0.8} onPress={() => ask(o)}>
                    <Text style={styles.askLink}>{t.svAskAbout} →</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => ask()}>
          <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.cta}>
            <Text style={styles.ctaText}>{t.svAsk}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 24 },
  cover: { height: 200, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  backBtn: { position: 'absolute', top: 12, left: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  body: { padding: 16, gap: 12 },
  cat: { fontSize: 12, fontWeight: '700', color: colors.pinkStrong, textTransform: 'uppercase', letterSpacing: 0.5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -6 },
  name: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text, flexShrink: 1 },
  muted: { fontSize: 13, color: colors.textSoft },
  thumb: { width: 96, height: 72, borderRadius: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 8, ...shadow.card },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardText: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  fact: { gap: 2 },
  factLabel: { fontSize: 11.5, color: colors.textMuted },
  factValue: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  sectionTitle: { fontFamily: 'Sora', fontSize: 16, fontWeight: '700', color: colors.text },
  offer: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 6, ...shadow.card },
  offerTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  offerTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text, flex: 1 },
  offerPrice: { fontSize: 14, fontWeight: '800', color: colors.maroon },
  askLink: { color: colors.pinkStrong, fontWeight: '700', fontSize: 13, marginTop: 2 },
  footer: { padding: 16, paddingTop: 10, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.divider },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...shadow.primaryButton },
  ctaText: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
});
