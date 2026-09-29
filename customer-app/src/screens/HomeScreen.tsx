import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import type { IconName } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';
import { HOME_MODE_KEY } from '../constants';

type Mode = 'venues' | 'rentals';

const VTYPE_TILES: Array<{ key: string; label: string; count: string }> = [
  { key: 'banquet', label: 'Banquet halls', count: '32 nearby' },
  { key: 'marriage', label: 'Marriage halls', count: '18 nearby' },
  { key: 'hotel', label: 'Hotels', count: '21 nearby' },
  { key: 'lawn', label: 'Lawns & gardens', count: '14 nearby' },
];

const NEAR_HALLS = [
  { id: 'h1', name: 'Sri Kalyana Mandapam', type: 'Marriage hall', area: 'Ameerpet', km: '2.1 km', rating: '4.6', cap: '500–800 pax', ac: 'AC', crowd: 'Filling fast', crowdOk: false, token: '₹5,000', avail: 'Available', availOk: true },
  { id: 'h2', name: 'The Grand Banquet', type: 'Banquet hall', area: 'Gachibowli', km: '4.8 km', rating: '4.8', cap: '200–350 pax', ac: 'AC', crowd: 'Open dates', crowdOk: true, token: '₹8,000', avail: '3 dates left', availOk: false },
];

const EV_TYPES = ['Wedding', 'Reception', 'Birthday', 'House party', 'Corporate'];

const CATEGORIES = [
  { n: '01', name: 'Shamiana & Tents', ex: 'Mandap, canopy, backdrop' },
  { n: '02', name: 'Chairs & Tables', ex: 'Steel, plastic, banquet' },
  { n: '03', name: 'Crockery & Vessels', ex: 'Deksha, bogana, plates' },
  { n: '04', name: 'Lighting', ex: 'Decorative, stage, string' },
  { n: '05', name: 'Sound & DJ', ex: 'Speakers, mic, DJ setup' },
  { n: '06', name: 'Decor', ex: 'Flowers, balloons, themes' },
];

const PACKAGES = [
  { id: 'p1', name: 'Wedding essentials', items: 'Shamiana, 200 chairs, lighting, sound', vendor: 'Sai Tent House', price: '₹42,000' },
  { id: 'p2', name: 'Birthday starter', items: '50 chairs, decor, sound system', vendor: 'Balaji Decorators', price: '₹9,500' },
];

const NEARBY_VENDORS = [
  { id: 'v1', name: 'Sai Tent House', verified: true, rating: '4.7', reviews: 210, km: '3.2 km' },
  { id: 'v2', name: 'Balaji Decorators', verified: true, rating: '4.5', reviews: 128, km: '5.6 km' },
  { id: 'v3', name: 'Hyderabad Sound & Light', verified: false, rating: '4.3', reviews: 64, km: '6.9 km' },
];

const TABS: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'home', label: 'home', icon: 'home' },
  { key: 'search', label: 'search', icon: 'search' },
  { key: 'bookings', label: 'bookings', icon: 'calendar' },
  { key: 'cart', label: 'cart', icon: 'cart' },
  { key: 'profile', label: 'profile', icon: 'user' },
];

function soon() {
  Alert.alert('Coming soon', 'This is being built next.');
}

function Photo({ icon, height = 150, radius = 0 }: { icon: IconName; height?: number; radius?: number }) {
  return (
    <View style={[styles.photo, { height, borderRadius: radius }]}>
      <Icon name={icon} size={26} color={colors.pinkStrong} strokeWidth={1.5} />
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState<Mode>('rentals');
  const [ev, setEv] = useState({ date: '', guests: '100' });

  useEffect(() => {
    AsyncStorage.getItem(HOME_MODE_KEY)
      .then((v) => { if (v === 'venues' || v === 'rentals') setMode(v); })
      .catch(() => {});
  }, []);

  const selectMode = (m: Mode) => {
    setMode(m);
    AsyncStorage.setItem(HOME_MODE_KEY, m).catch(() => {});
  };

  const firstName = (user?.name || '').split(' ')[0] || 'there';
  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ minWidth: 0 }}>
            <Text style={styles.helloSmall}>{t.hello},</Text>
            <Text style={styles.helloName}>{firstName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.langChip} activeOpacity={0.8} onPress={soon}>
              <Text style={styles.langChipDevanagari}>अ</Text>
              <Text style={styles.langChipText}>{lang.toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={soon}>
              <Icon name="search" size={19} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={soon}>
              <Icon name="bell" size={19} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={logout}>
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addrPill} activeOpacity={0.85} onPress={soon}>
          <Icon name="pin" size={14} color={colors.pink} />
          <Text style={styles.addrText}>{user?.city || 'Hyderabad'}</Text>
          <Icon name="down" size={14} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.modeToggle}>
          <TouchableOpacity style={styles.modeBtnWrap} activeOpacity={0.85} onPress={() => selectMode('venues')}>
            {mode === 'venues' ? (
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.modeBtn}>
                <Icon name="home" size={15} color="#fff" />
                <Text style={styles.modeBtnTextSel}>Halls & venues</Text>
              </LinearGradient>
            ) : (
              <View style={styles.modeBtn}>
                <Icon name="home" size={15} color={colors.textSoft} />
                <Text style={styles.modeBtnText}>Halls & venues</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeBtnWrap} activeOpacity={0.85} onPress={() => selectMode('rentals')}>
            {mode === 'rentals' ? (
              <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.modeBtn}>
                <Icon name="tent" size={15} color="#fff" />
                <Text style={styles.modeBtnTextSel}>Rentals</Text>
              </LinearGradient>
            ) : (
              <View style={styles.modeBtn}>
                <Icon name="tent" size={15} color={colors.textSoft} />
                <Text style={styles.modeBtnText}>Rentals</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {mode === 'venues' ? (
          <>
            <LinearGradient
              colors={[colors.maroon, '#8a1538', colors.pink]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <Text style={styles.heroLabel}>Halls & venues</Text>
              <Text style={styles.heroHeadline}>Hold a hall for your date with a small token</Text>
              <Text style={styles.heroSub}>Visit within 48 hours to finalise. If you don’t visit, the token expires.</Text>
              <View style={styles.heroInputs}>
                <View style={styles.heroInput}>
                  <Text style={styles.heroInputLabel}>{t.date}</Text>
                  <TextInput
                    value={ev.date}
                    onChangeText={(v) => setEv((s) => ({ ...s, date: v }))}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="rgba(255,255,255,0.65)"
                    style={styles.heroInputField}
                  />
                </View>
                <View style={styles.heroInput}>
                  <Text style={styles.heroInputLabel}>{t.guests}</Text>
                  <TextInput
                    value={ev.guests}
                    onChangeText={(v) => setEv((s) => ({ ...s, guests: v }))}
                    keyboardType="number-pad"
                    style={styles.heroInputField}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.heroBtn} activeOpacity={0.85} onPress={soon}>
                <Text style={styles.heroBtnText}>Search halls</Text>
                <Icon name="right" size={16} color={colors.maroon} />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.tileGrid}>
              {VTYPE_TILES.map((x) => (
                <TouchableOpacity key={x.key} style={styles.tile} activeOpacity={0.85} onPress={soon}>
                  <Text style={styles.tileLabel}>{x.label}</Text>
                  <Text style={styles.tileCount}>{x.count}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Halls near you</Text>
              <View style={{ gap: 12 }}>
                {NEAR_HALLS.map((v) => (
                  <TouchableOpacity key={v.id} style={styles.hallCard} activeOpacity={0.85} onPress={soon}>
                    <Photo icon="home" height={150} />
                    <View style={styles.hallBody}>
                      <View style={styles.hallTopRow}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.hallName}>{v.name}</Text>
                          <Text style={styles.hallMeta}>{v.type} · {v.area} · {v.km}</Text>
                        </View>
                        <Text style={styles.hallRating}>★ {v.rating}</Text>
                      </View>
                      <View style={styles.chipRow}>
                        <Text style={styles.chip}>{v.cap}</Text>
                        <Text style={styles.chip}>{v.ac}</Text>
                        <Text style={[styles.chip, v.crowdOk ? styles.chipOk : styles.chipWarn]}>{v.crowd}</Text>
                      </View>
                      <View style={styles.hallBottomRow}>
                        <Text style={styles.tokenText}>Token <Text style={styles.tokenAmount}>{v.token}</Text></Text>
                        <Text style={[styles.availBadge, v.availOk ? styles.chipOk : styles.chipWarn]}>{v.avail}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <LinearGradient
              colors={[colors.maroon, '#8a1538', colors.pink]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <Text style={styles.heroLabelUpper}>{t.planEvent}</Text>
              <Text style={styles.heroHeadline}>{t.headline}</Text>
              <View style={styles.heroInputs}>
                <View style={styles.heroInput}>
                  <Text style={styles.heroInputLabel}>{t.date}</Text>
                  <TextInput
                    value={ev.date}
                    onChangeText={(v) => setEv((s) => ({ ...s, date: v }))}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="rgba(255,255,255,0.65)"
                    style={styles.heroInputField}
                  />
                </View>
                <View style={styles.heroInput}>
                  <Text style={styles.heroInputLabel}>{t.guests}</Text>
                  <TextInput
                    value={ev.guests}
                    onChangeText={(v) => setEv((s) => ({ ...s, guests: v }))}
                    keyboardType="number-pad"
                    style={styles.heroInputField}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.heroBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Event')}>
                <Text style={styles.heroBtnText}>{t.build}</Text>
                <Icon name="right" size={16} color={colors.maroon} />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.statGrid}>
              <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={soon}>
                <Text style={styles.statLabel}>Active bookings</Text>
                <Text style={styles.statValue}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statCard, styles.statCardPink]} activeOpacity={0.85} onPress={soon}>
                <Text style={styles.statLabel}>Quotes to review</Text>
                <Text style={[styles.statValue, { color: colors.pinkStrong }]}>0</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What’s the occasion?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {EV_TYPES.map((e) => (
                  <TouchableOpacity key={e} style={styles.occasionChip} activeOpacity={0.85} onPress={soon}>
                    <Text style={styles.occasionChipText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.cats}</Text>
              <View style={styles.catCard}>
                {CATEGORIES.map((c, i) => (
                  <TouchableOpacity
                    key={c.n}
                    style={[styles.catRow, i === CATEGORIES.length - 1 && { borderBottomWidth: 0 }]}
                    activeOpacity={0.85}
                    onPress={soon}
                  >
                    <Text style={styles.catNum}>{c.n}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.catName}>{c.name}</Text>
                      <Text style={styles.catEx}>{c.ex}</Text>
                    </View>
                    <Icon name="right" size={16} color={colors.dividerStrong} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.packages}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {PACKAGES.map((k) => (
                  <View key={k.id} style={styles.pkgCard}>
                    <Photo icon="package" height={130} radius={14} />
                    <Text style={styles.pkgName}>{k.name}</Text>
                    <Text style={styles.pkgItems}>{k.items}</Text>
                    <Text style={styles.pkgVendor}>{k.vendor}</Text>
                    <View style={styles.pkgFooter}>
                      <Text style={styles.pkgPrice}>{k.price}</Text>
                      <TouchableOpacity style={styles.pkgAddBtn} activeOpacity={0.85} onPress={soon}>
                        <Text style={styles.pkgAddText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.vendors}</Text>
              <View style={{ gap: 8 }}>
                {NEARBY_VENDORS.map((v) => (
                  <TouchableOpacity key={v.id} style={styles.vendorRow} activeOpacity={0.85} onPress={soon}>
                    <Photo icon="tent" height={48} radius={12} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.vendorNameRow}>
                        <Text style={styles.vendorName}>{v.name}</Text>
                        {v.verified && <Icon name="shield" size={14} color={colors.green} />}
                      </View>
                      <Text style={styles.vendorMeta}>★ {v.rating} · {v.reviews} reviews · {v.km}</Text>
                    </View>
                    <Icon name="right" size={16} color={colors.dividerStrong} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.tabBar}>
        {TABS.map((tb) => {
          const active = tb.key === 'home';
          return (
            <TouchableOpacity key={tb.key} style={styles.tabItem} activeOpacity={0.7} onPress={active ? undefined : soon}>
              <Icon name={tb.icon} size={21} color={active ? colors.pinkStrong : colors.textMuted} strokeWidth={active ? 2.2 : 1.8} />
              <Text style={[styles.tabLabel, { color: active ? colors.pinkStrong : colors.textMuted }]}>
                {(t as Record<string, string>)[tb.label] || tb.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helloSmall: { fontSize: 12.5, color: colors.textSoft },
  helloName: { fontFamily: 'Sora', fontSize: 21, fontWeight: '800', color: colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langChip: { height: 38, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadow.card },
  langChipDevanagari: { color: colors.pink, fontWeight: '700' },
  langChipText: { fontWeight: '700', fontSize: 13, color: colors.text },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14, fontFamily: 'Sora' },
  addrPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, ...shadow.card },
  addrText: { fontSize: 13, fontWeight: '600', color: colors.text },
  modeToggle: { flexDirection: 'row', gap: 4, backgroundColor: colors.surface, borderRadius: 999, padding: 4, ...shadow.card },
  modeBtnWrap: { flex: 1 },
  modeBtn: { height: 40, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modeBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.textSoft },
  modeBtnTextSel: { fontSize: 13.5, fontWeight: '700', color: '#fff' },
  hero: { borderRadius: 24, padding: 20 },
  heroLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  heroLabelUpper: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  heroHeadline: { fontFamily: 'Sora', fontWeight: '800', fontSize: 23, lineHeight: 28, color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 19, marginBottom: 14 },
  heroInputs: { flexDirection: 'row', gap: 10, marginBottom: 14, marginTop: 8 },
  heroInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  heroInputLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  heroInputField: { color: '#fff', fontFamily: 'Sora', fontWeight: '700', fontSize: 14, padding: 0, margin: 0 },
  heroBtn: { height: 48, borderRadius: 999, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroBtnText: { color: colors.maroon, fontWeight: '800', fontSize: 15, fontFamily: 'Sora' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47%', backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 2, ...shadow.card },
  tileLabel: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  tileCount: { fontSize: 12, color: colors.textMuted },
  section: { gap: 10 },
  sectionTitle: { fontFamily: 'Sora', fontSize: 16, fontWeight: '700', color: colors.text },
  photo: { width: '100%', backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  hallCard: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', ...shadow.card },
  hallBody: { padding: 14, gap: 6 },
  hallTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  hallName: { fontSize: 15, fontWeight: '700', color: colors.text },
  hallMeta: { fontSize: 12, color: colors.textSoft },
  hallRating: { fontSize: 12, fontWeight: '700', color: colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { fontSize: 11.5, fontWeight: '600', color: '#4b4560', backgroundColor: colors.pinkBg, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, overflow: 'hidden' },
  chipOk: { backgroundColor: colors.greenBg, color: colors.green },
  chipWarn: { backgroundColor: colors.amberBg, color: colors.amber },
  hallBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  tokenText: { fontSize: 12.5, color: colors.textSoft },
  tokenAmount: { fontFamily: 'Sora', color: colors.maroon, fontSize: 15, fontWeight: '700' },
  availBadge: { fontSize: 11, fontWeight: '700', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, overflow: 'hidden' },
  statGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 14, ...shadow.card },
  statCardPink: { backgroundColor: colors.pinkBg },
  statLabel: { fontSize: 11.5, color: colors.textSoft, marginBottom: 4 },
  statValue: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  chipScroll: { gap: 8, paddingRight: 8 },
  occasionChip: { paddingHorizontal: 16, height: 36, borderRadius: 999, backgroundColor: colors.pinkBg, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  occasionChipText: { fontSize: 13, fontWeight: '600', color: colors.pinkStrong },
  catCard: { backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden', ...shadow.card },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  catNum: { fontFamily: 'Sora', fontSize: 12, fontWeight: '800', color: colors.pink, width: 20 },
  catName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  catEx: { fontSize: 12, color: colors.textMuted },
  pkgCard: { width: 250, backgroundColor: colors.surface, borderRadius: 20, padding: 10, paddingBottom: 16, gap: 8, ...shadow.card },
  pkgName: { fontSize: 15, fontWeight: '700', color: colors.text, paddingHorizontal: 6 },
  pkgItems: { fontSize: 12, color: colors.textSoft, lineHeight: 18, paddingHorizontal: 6 },
  pkgVendor: { fontSize: 12, color: colors.textMuted, paddingHorizontal: 6 },
  pkgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 'auto' },
  pkgPrice: { fontFamily: 'Sora', fontWeight: '800', fontSize: 18, color: colors.maroon },
  pkgAddBtn: { height: 34, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  pkgAddText: { color: '#fff', fontWeight: '700', fontSize: 12.5, fontFamily: 'Sora' },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 12 },
  vendorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vendorName: { fontSize: 14, fontWeight: '700', color: colors.text },
  vendorMeta: { fontSize: 12, color: colors.textSoft },
  tabBar: { flexDirection: 'row', height: 66, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 10.5, fontWeight: '700', textTransform: 'capitalize' },
});
