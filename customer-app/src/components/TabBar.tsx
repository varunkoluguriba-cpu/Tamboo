import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from './Icon';
import type { IconName } from './icons';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export type TabKey = 'home' | 'search' | 'bookings' | 'cart' | 'profile';

// A minimal structural type instead of NativeStackNavigationProp<RootStackParamList>:
// that generic ties setParams to the *current* route's param type, which breaks
// when TabBar is used from a route (like Cart) whose params are `undefined`.
type TabBarNavigation = {
  navigate: <RouteName extends keyof RootStackParamList>(
    ...args: undefined extends RootStackParamList[RouteName] ? [RouteName] | [RouteName, RootStackParamList[RouteName]] : [RouteName, RootStackParamList[RouteName]]
  ) => void;
};

const TABS: Array<{ key: TabKey; icon: IconName }> = [
  { key: 'home', icon: 'home' },
  { key: 'search', icon: 'search' },
  { key: 'bookings', icon: 'calendar' },
  { key: 'cart', icon: 'cart' },
  { key: 'profile', icon: 'user' },
];

function soon() {
  Alert.alert('Coming soon', 'This is being built next.');
}

export default function TabBar({
  active,
  navigation,
}: {
  active: TabKey;
  navigation: TabBarNavigation;
}) {
  const { t } = useLanguage();
  const { itemCount } = useCart();

  const go = (key: TabKey) => {
    if (key === active) return;
    if (key === 'home') return navigation.navigate('Home');
    if (key === 'search') return navigation.navigate('Browse', {});
    if (key === 'cart') return navigation.navigate('Cart');
    if (key === 'bookings') return navigation.navigate('Bookings');
    if (key === 'profile') return navigation.navigate('Profile');
    soon();
  };

  return (
    <View style={styles.tabBar}>
      {TABS.map((tb) => {
        const isActive = tb.key === active;
        return (
          <TouchableOpacity key={tb.key} style={styles.tabItem} activeOpacity={0.7} onPress={() => go(tb.key)}>
            <View>
              <Icon name={tb.icon} size={21} color={isActive ? colors.pinkStrong : colors.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
              {tb.key === 'cart' && itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: isActive ? colors.pinkStrong : colors.textMuted }]}>
              {(t as Record<string, string>)[tb.key] || tb.key}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', height: 66, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 10.5, fontWeight: '700', textTransform: 'capitalize' },
  badge: { position: 'absolute', top: -4, right: -10, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
});
