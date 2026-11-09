import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RemoteHallBooking, RemoteOrderSummary, RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import type { IconName } from '../components/icons';
import LanguageSheet from '../components/LanguageSheet';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { useToken, msLeft, formatHoursLeft } from '../context/TokenContext';
import type { LangStrings } from '../i18n';
import { colors, gradients, shadow } from '../theme';
import { HOME_MODE_KEY } from '../constants';
import { ratingText, metaLine, kmText } from '../utils/rating';
import { prettyDate } from '../utils/status';
import DateField from '../components/DateField';

type Mode = 'venues' | 'rentals';

type Option = { value: string; label: string };

// Same four types partners pick from when listing a hall (partner-app VENUE_TYPES), with counts
// from the live hall list. A type with no halls yet shows no count rather than a misleading number.
const VTYPE_TILES = (t: LangStrings, hallTypes: string[]): Array<{ type: string; label: string; count: string }> => {
  const count = (type: string) => {
    const n = hallTypes.filter((ty) => ty.toLowerCase() === type.toLowerCase()).length;
    return n ? t.homeScreenNearbyCount.replace('{n}', String(n)) : '';
  };
  return [
    { type: 'Function Hall', label: t.homeScreenFunctionHalls, count: count('Function Hall') },
    { type: 'Banquet Hall', label: t.homeScreenBanquetHalls, count: count('Banquet Hall') },
    { type: 'Marriage Hall', label: t.homeScreenMarriageHalls, count: count('Marriage Hall') },
    { type: 'Hotel', label: t.homeScreenHotels, count: count('Hotel') },
  ];
};

const EV_TYPES = (t: LangStrings): Option[] => [
  { value: 'Wedding', label: t.homeScreenOccasionWedding },
  { value: 'Reception', label: t.homeScreenOccasionReception },
  { value: 'Birthday', label: t.homeScreenOccasionBirthday },
  { value: 'House party', label: t.homeScreenOccasionHouseParty },
  { value: 'Corporate', label: t.homeScreenOccasionCorporate },
];

const CATEGORIES = (t: LangStrings) => [
  { n: '01', name: t.homeScreenCatTents, ex: t.homeScreenCatTentsEx, navName: 'tent' },
  { n: '02', name: t.homeScreenCatChairsTables, ex: t.homeScreenCatChairsTablesEx, navName: 'seat|table' },
  { n: '03', name: t.homeScreenCatCrockeryVessels, ex: t.homeScreenCatCrockeryVesselsEx, navName: 'crockery' },
  { n: '04', name: t.homeScreenCatLighting, ex: t.homeScreenCatLightingEx, navName: 'light' },
  { n: '05', name: t.homeScreenCatSoundDJ, ex: t.homeScreenCatSoundDJEx, navName: 'av' },
  { n: '06', name: t.homeScreenCatDecor, ex: t.homeScreenCatDecorEx, navName: 'decor' },
];

type RemotePackage = {
  id: string;
  name: string;
  vendorName: string;
  lines: Array<{ productId: string; name: string; qty: number; unitPrice: number }>;
  total: number;
};

function Photo({ icon, height = 150, radius = 0, width, uri }: { icon: IconName; height?: number; radius?: number; width?: number; uri?: string }) {
  if (uri) return <Image source={{ uri }} style={[styles.photo, { height, borderRadius: radius }, width !== undefined && { width }]} resizeMode="cover" />;
  return (
    <View style={[styles.photo, { height, borderRadius: radius }, width !== undefined && { width }]}>
      <Icon name={icon} size={26} color={colors.pinkStrong} strokeWidth={1.5} />
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { token, refreshToken } = useToken();
  // Pick up changes the hall made (visited / confirmed) whenever Home comes back into view.
  useFocusEffect(React.useCallback(() => { refreshToken(); }, [refreshToken]));
  const { lang, t } = useLanguage();
  const { halls, vendors, getProduct, getVendor } = useCatalog();
  const { addToCart } = useCart();
  const { event, setEvent } = useEvent();
  const [mode, setMode] = useState<Mode>('rentals');
  const [langSheet, setLangSheet] = useState(false);
  const [ev, setEv] = useState({ date: event.date, guests: event.guests || '100' });
  // The hero's date/guests are what the customer means for this event — carry them into the
  // shared event so the hall list, cart and checkout all use them.
  const saveHero = () => setEvent({ ...event, date: ev.date.trim(), guests: ev.guests.trim() || event.guests });

  const [packages, setPackages] = useState<RemotePackage[]>([]);

  useEffect(() => {
    api.get<RemotePackage[]>('/api/vendors/packages').then(setPackages).catch(() => setPackages([]));
  }, []);

  // Real counts for the two stat cards below — mirrors BookingsScreen's own filtering so the
  // numbers here always match what tapping through to Bookings actually shows.
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [quotesToReviewCount, setQuotesToReviewCount] = useState(0);

  const [activeTab, setActiveTab] = useState<'active' | 'halls'>('active');

  // Reloaded whenever Home is shown, and set (not added to) so refreshes can't double-count.
  // Expired hall tokens never count.
  useFocusEffect(React.useCallback(() => {
    Promise.all([
      api.get<RemoteOrderSummary[]>('/api/orders/me').catch(() => [] as RemoteOrderSummary[]),
      api.get<RemoteHallBooking[]>('/api/halls/my-tokens').catch(() => [] as RemoteHallBooking[]),
      api.get<Array<{ status: string }>>('/api/quotes/me').catch(() => [] as Array<{ status: string }>),
    ]).then(([orders, bookings, quotes]) => {
      const activeOrders = orders.filter((o) => ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)).length;
      const liveHalls = bookings.filter((b) =>
        ['visited', 'awaiting_advance', 'confirmed'].includes(b.status) ||
        (b.status === 'token_paid' && Date.now() < b.heldAtMs + b.visitHours * 3600 * 1000)).length;
      // The number must match the list the card opens: rental orders live in the Active tab,
      // halls in the Halls tab (and on the banner above), so show halls only if there are no orders.
      const showHalls = activeOrders === 0 && liveHalls > 0;
      setActiveBookingsCount(showHalls ? liveHalls : activeOrders);
      setActiveTab(showHalls ? 'halls' : 'active');
      // Only offers waiting on the customer — a requested revision is waiting on the vendor.
      setQuotesToReviewCount(quotes.filter((q) => q.status === 'OFFER_SENT').length);
    });
  }, []));

  const nearHalls = halls.slice(0, 4);
  const nearVendors = vendors.slice(0, 4);

  const addPackage = (pkg: RemotePackage) => {
    pkg.lines.forEach((l) => addToCart(l.productId, l.qty));
    Alert.alert(t.homeScreenPkgAdded, pkg.name, [
      { text: t.productKeepBrowsing, style: 'cancel' },
      { text: t.productViewCart, onPress: () => navigation.navigate('Cart') },
    ]);
  };

  useEffect(() => {
    AsyncStorage.getItem(HOME_MODE_KEY)
      .then((v) => { if (v === 'venues' || v === 'rentals') setMode(v); })
      .catch(() => {});
  }, []);

  const selectMode = (m: Mode) => {
    setMode(m);
    AsyncStorage.setItem(HOME_MODE_KEY, m).catch(() => {});
  };

  const firstName = (user?.name || '').split(' ')[0] || t.homeScreenGuestFallback;
  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
            <Text style={styles.helloSmall}>{t.hello},</Text>
            <Text style={styles.helloName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{firstName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.langChip} activeOpacity={0.8} onPress={() => setLangSheet(true)}>
              <Text style={styles.langChipDevanagari}>अ</Text>
              <Text style={styles.langChipText}>{lang.toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => (mode === 'venues' ? navigation.navigate('Venues') : navigation.navigate('Browse', {}))} accessibilityLabel={t.homeScreenSearchA11y} accessibilityRole="button">
              <Icon name="search" size={19} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Notifications')} accessibilityLabel={t.homeScreenNotificationsA11y} accessibilityRole="button">
              <Icon name="bell" size={19} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Only Hyderabad is live, so this is a label — no picker to open yet. */}
        <View style={styles.addrPill}>
          <Icon name="pin" size={14} color={colors.pink} />
          <Text style={styles.addrText}>{user?.city || t.homeScreenDefaultCity}</Text>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity style={styles.modeBtnWrap} activeOpacity={0.85} onPress={() => selectMode('venues')}>
            {mode === 'venues' ? (
              <View style={styles.modeBtn}>
                <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={StyleSheet.absoluteFill} />
                <Icon name="home" size={15} color="#fff" />
                <Text style={styles.modeBtnTextSel}>{t.homeScreenHallsVenues}</Text>
              </View>
            ) : (
              <View style={styles.modeBtn}>
                <Icon name="home" size={15} color={colors.textSoft} />
                <Text style={styles.modeBtnText}>{t.homeScreenHallsVenues}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeBtnWrap} activeOpacity={0.85} onPress={() => selectMode('rentals')}>
            {mode === 'rentals' ? (
              <View style={styles.modeBtn}>
                <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={StyleSheet.absoluteFill} />
                <Icon name="tent" size={15} color="#fff" />
                <Text style={styles.modeBtnTextSel}>{t.homeScreenRentals}</Text>
              </View>
            ) : (
              <View style={styles.modeBtn}>
                <Icon name="tent" size={15} color={colors.textSoft} />
                <Text style={styles.modeBtnText}>{t.homeScreenRentals}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* A hall booking needing action shows in both Halls and Rentals mode. */}
        {token && (() => {
          // The banner follows the booking's stage, not just the 48h visit window.
          const st = token.status;
          const isExpired = msLeft(token) <= 0 && !token.visited && st !== 'confirmed' && st !== 'awaiting_advance';
          const advanceLeft = token.advanceDeadlineAtMs ? Math.max(0, token.advanceDeadlineAtMs - Date.now()) : 0;
          const label = st === 'awaiting_advance' ? t.homeBannerPayAdvance : st === 'confirmed' ? t.homeBannerConfirmed : st === 'visited' ? t.homeBannerVisited : t.homeScreenHallPreBooked;
          const right = isExpired
            ? t.tokenStatusExpired
            : st === 'awaiting_advance'
              ? t.homeScreenTimeLeft.replace('{time}', formatHoursLeft(advanceLeft))
              : st === 'token_paid'
                ? t.homeScreenTimeLeft.replace('{time}', formatHoursLeft(msLeft(token)))
                : '';
          const sub = isExpired
            ? t.tokenNoteExpired
            : st === 'awaiting_advance'
              ? t.homeBannerPayAdvanceSub.replace('{amount}', `₹${(token.advanceAmount || 0).toLocaleString('en-IN')}`)
              : st === 'confirmed'
                ? t.homeBannerConfirmedSub.replace('{date}', prettyDate(token.date))
                : st === 'visited'
                  ? t.homeBannerVisitedSub
                  : t.homeScreenVisitWithin.replace('{hours}', String(token.visitHours));
          return (
            <TouchableOpacity style={[styles.tokenBanner, isExpired && styles.tokenBannerExpired]} activeOpacity={0.85} onPress={() => navigation.navigate('Token')}>
              <View style={styles.tokenBannerTop}>
                <Text style={styles.tokenBannerLabel}>{label}</Text>
                {!!right && <Text style={isExpired ? styles.tokenBannerLeftExpired : styles.tokenBannerLeft}>{right}</Text>}
              </View>
              <Text style={styles.tokenBannerHall}>{token.hallName}</Text>
              <Text style={styles.tokenBannerSub}>{sub}</Text>
            </TouchableOpacity>
          );
        })()}

        {mode === 'venues' ? (
          <>

            <View style={styles.hero}>
              <LinearGradient
                colors={[colors.maroon, '#8a1538', colors.pink]}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.heroLabel}>{t.homeScreenHallsVenues}</Text>
              <Text style={styles.heroHeadline}>{t.homeScreenHoldHallHeadline}</Text>
              <Text style={styles.heroSub}>{t.homeScreenHoldHallSub}</Text>
              <View style={styles.heroInputs}>
                <View style={styles.heroInput}>
                  <Text style={styles.heroInputLabel}>{t.date}</Text>
                  <DateField
                    value={ev.date}
                    onChange={(v) => setEv((st) => ({ ...st, date: v }))}
                    placeholderColor="rgba(255,255,255,0.65)"
                    textStyle={styles.heroInputField}
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
              <TouchableOpacity style={styles.heroBtn} activeOpacity={0.85} onPress={() => { saveHero(); navigation.navigate('Venues'); }}>
                <Text style={styles.heroBtnText}>{t.homeScreenSearchHalls}</Text>
                <Icon name="right" size={16} color={colors.maroon} />
              </TouchableOpacity>
            </View>

            <View style={styles.tileGrid}>
              {VTYPE_TILES(t, halls.map((h) => h.type || '')).map((x) => (
                <TouchableOpacity key={x.type} style={styles.tile} activeOpacity={0.85} onPress={() => navigation.navigate('Venues', { venueType: x.type })}>
                  <Text style={styles.tileLabel}>{x.label}</Text>
                  <Text style={styles.tileCount}>{x.count}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.homeScreenHallsNearYou}</Text>
              <View style={{ gap: 12 }}>
                {nearHalls.map((v) => (
                  <TouchableOpacity key={v.id} style={styles.hallCard} activeOpacity={0.85} onPress={() => navigation.navigate('Venue', { id: v.id })}>
                    <Photo icon="home" height={150} uri={v.photos?.[0]} />
                    <View style={styles.hallBody}>
                      <View style={styles.hallTopRow}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.hallName}>{v.name}</Text>
                          <Text style={styles.hallMeta}>{metaLine(v.type, v.area, v.km != null && kmText(v.km))}</Text>
                        </View>
                        <Text style={styles.hallRating}>{ratingText(v.rating, 0, t)}</Text>
                      </View>
                      <View style={styles.chipRow}>
                        <Text style={styles.chip}>{v.cap}</Text>
                        <Text style={styles.chip}>{v.ac ? t.homeScreenAC : t.homeScreenNonAC}</Text>
                        {v.verified && <Text style={[styles.chip, styles.chipOk]}>{t.homeScreenVerified}</Text>}
                      </View>
                      <View style={styles.hallBottomRow}>
                        <Text style={styles.tokenText}>{t.homeScreenToken} <Text style={styles.tokenAmount}>₹{v.token.toLocaleString('en-IN')}</Text></Text>
                        <Text style={[styles.availBadge, styles.chipOk]}>{t.homeScreenAvailable}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.hero}>
              <LinearGradient
                colors={[colors.maroon, '#8a1538', colors.pink]}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.heroLabelUpper}>{t.planEvent}</Text>
              <Text style={styles.heroHeadline}>{t.headline}</Text>
              <View style={styles.heroInputs}>
                <View style={styles.heroInput}>
                  <Text style={styles.heroInputLabel}>{t.date}</Text>
                  <DateField
                    value={ev.date}
                    onChange={(v) => setEv((st) => ({ ...st, date: v }))}
                    placeholderColor="rgba(255,255,255,0.65)"
                    textStyle={styles.heroInputField}
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
              <TouchableOpacity style={styles.heroBtn} activeOpacity={0.85} onPress={() => { saveHero(); navigation.navigate('Event'); }}>
                <Text style={styles.heroBtnText}>{t.build}</Text>
                <Icon name="right" size={16} color={colors.maroon} />
              </TouchableOpacity>
            </View>

            <View style={styles.statGrid}>
              <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={() => navigation.navigate('Bookings', { tab: activeTab })}>
                <Text style={styles.statLabel}>{t.homeScreenActiveBookings}</Text>
                <Text style={styles.statValue}>{activeBookingsCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statCard, styles.statCardPink]} activeOpacity={0.85} onPress={() => navigation.navigate('Bookings', { tab: 'quotes' })}>
                <Text style={styles.statLabel}>{t.homeScreenQuotesToReview}</Text>
                <Text style={[styles.statValue, { color: colors.pinkStrong }]}>{quotesToReviewCount}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.homeScreenOccasionQuestion}</Text>
              <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {EV_TYPES(t).map((e) => (
                  <TouchableOpacity
                    key={e.value}
                    style={styles.occasionChip}
                    activeOpacity={0.85}
                    onPress={() => {
                      setEvent({ ...event, type: e.value });
                      navigation.navigate('Event');
                    }}
                  >
                    <Text style={styles.occasionChipText}>{e.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.cats}</Text>
              <View style={styles.catCard}>
                {CATEGORIES(t).map((c, i) => (
                  <TouchableOpacity
                    key={c.n}
                    style={[styles.catRow, i === CATEGORIES(t).length - 1 && { borderBottomWidth: 0 }]}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Browse', { category: c.navName })}
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
              <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {packages.map((k) => (
                  <View key={k.id} style={styles.pkgCard}>
                    <Photo icon="package" height={130} radius={14} />
                    <Text style={styles.pkgName}>{k.name}</Text>
                    <Text style={styles.pkgItems}>{k.lines.map((l) => (l.qty > 1 ? `${l.qty} × ${l.name}` : l.name)).join(', ')}</Text>
                    <Text style={styles.pkgVendor}>{k.vendorName}</Text>
                    <View style={styles.pkgFooter}>
                      <Text style={styles.pkgPrice}>₹{k.total.toLocaleString('en-IN')}</Text>
                      <TouchableOpacity style={styles.pkgAddBtn} activeOpacity={0.85} onPress={() => addPackage(k)}>
                        <Text style={styles.pkgAddText}>{t.add}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.vendors}</Text>
              <View style={{ gap: 8 }}>
                {nearVendors.map((v) => (
                  <TouchableOpacity key={v.id} style={styles.vendorRow} activeOpacity={0.85} onPress={() => navigation.navigate('Vendor', { id: v.id })}>
                    <Photo icon="tent" height={48} width={48} radius={12} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.vendorNameRow}>
                        <Text style={styles.vendorName}>{v.name}</Text>
                        {v.verified && <Icon name="shield" size={14} color={colors.green} />}
                      </View>
                      <Text style={styles.vendorMeta}>{metaLine(ratingText(v.rating, v.reviews, t, t.homeScreenReviews), v.km > 0 && kmText(v.km))}</Text>
                    </View>
                    <Icon name="right" size={16} color={colors.dividerStrong} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <LanguageSheet visible={langSheet} onClose={() => setLangSheet(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helloSmall: { fontSize: 12.5, color: colors.textSoft },
  helloName: { fontFamily: 'Sora', fontSize: 21, fontWeight: '800', color: colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  langChip: { height: 38, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadow.card },
  langChipDevanagari: { color: colors.pink, fontWeight: '700' },
  langChipText: { fontWeight: '700', fontSize: 13, color: colors.text },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14, fontFamily: 'Sora' },
  addrPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, ...shadow.card },
  addrText: { fontSize: 13, fontWeight: '600', color: colors.text },
  modeToggle: { flexDirection: 'row', gap: 4, backgroundColor: colors.surface, borderRadius: 999, padding: 4, ...shadow.card },
  tokenBanner: { borderWidth: 1.5, borderColor: '#f6c9d7', backgroundColor: '#fffafc', borderRadius: 18, padding: 14, gap: 4 },
  tokenBannerExpired: { borderColor: colors.dangerBg, backgroundColor: colors.dangerBg },
  tokenBannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tokenBannerLabel: { fontSize: 12, fontWeight: '700', color: colors.pinkStrong },
  tokenBannerLeft: { fontSize: 12, fontWeight: '800', color: colors.amber },
  tokenBannerLeftExpired: { fontSize: 12, fontWeight: '800', color: colors.dangerStrong },
  tokenBannerHall: { fontSize: 15, fontWeight: '700', color: colors.text },
  tokenBannerSub: { fontSize: 12.5, color: colors.textSoft },
  modeBtnWrap: { flex: 1 },
  modeBtn: { height: 40, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  modeBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.textSoft },
  modeBtnTextSel: { fontSize: 13.5, fontWeight: '700', color: '#fff' },
  hero: { borderRadius: 24, padding: 20, overflow: 'hidden' },
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
});
