import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const { t } = useLanguage();

  // Sample notification feed (no real push-notification backend yet) — but each one is wired
  // to the real screen it's actually about, so tapping isn't a dead end.
  const NOTIFS = [
    { id: 'n1', text: t.notifMsg1, at: t.notifTime1, onPress: () => navigation.navigate('Bookings') },
    { id: 'n2', text: t.notifMsg2, at: t.notifTime2, onPress: () => navigation.navigate('Token') },
    { id: 'n3', text: t.notifMsg3, at: t.notifTime3, onPress: () => navigation.navigate('Bookings') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.notifTitle}</Text>
        </View>

        {NOTIFS.map((n) => (
          <TouchableOpacity key={n.id} style={styles.card} activeOpacity={0.85} onPress={n.onPress}>
            <View style={styles.iconCircle}>
              <Icon name="bell" size={17} color={colors.pinkStrong} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardText}>{n.text}</Text>
              <Text style={styles.cardTime}>{n.at}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="tagi" size={17} color={colors.pinkStrong} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardText}>{t.notifWelcomeOffer}</Text>
            <Text style={styles.cardTime}>{t.notifOfferLabel}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  headerTitle: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  card: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: 16, padding: 14, ...shadow.card },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  cardText: { fontSize: 13.5, fontWeight: '600', color: colors.text, lineHeight: 19 },
  cardTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
