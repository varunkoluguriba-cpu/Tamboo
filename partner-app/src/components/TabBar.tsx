import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from './Icon';
import type { IconName } from './icons';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

// A minimal structural type instead of NativeStackNavigationProp<RootStackParamList>:
// that generic ties setParams to the *current* route's param type, which breaks
// when TabBar is used from a route (like Home) whose params are `undefined`.
export type TabBarNavigation = {
  navigate: <RouteName extends keyof RootStackParamList>(
    ...args: undefined extends RootStackParamList[RouteName] ? [RouteName] | [RouteName, RootStackParamList[RouteName]] : [RouteName, RootStackParamList[RouteName]]
  ) => void;
};

export type TentTab = 'home' | 'orders' | 'items' | 'shop';
export type VenueTab = 'hhome' | 'htokens' | 'calendar' | 'hall';

const TENT_TABS: Array<{ key: TentTab; icon: IconName; label: string; route: keyof RootStackParamList }> = [
  { key: 'home', icon: 'home', label: 'Home', route: 'Home' },
  { key: 'orders', icon: 'list', label: 'Orders', route: 'Orders' },
  { key: 'items', icon: 'package', label: 'Items', route: 'Items' },
  { key: 'shop', icon: 'tent', label: 'Shop', route: 'Shop' },
];

const VENUE_TABS: Array<{ key: VenueTab; icon: IconName; label: string; route: keyof RootStackParamList }> = [
  { key: 'hhome', icon: 'home', label: 'Home', route: 'HHome' },
  { key: 'htokens', icon: 'list', label: 'Pre-bookings', route: 'HTokens' },
  { key: 'calendar', icon: 'calendar', label: 'Calendar', route: 'Calendar' },
  { key: 'hall', icon: 'camera', label: 'My hall', route: 'Hall' },
];

type Navigation = TabBarNavigation;

export function TentTabBar({ active, navigation, badge }: { active: TentTab; navigation: Navigation; badge?: Partial<Record<TentTab, number>> }) {
  return (
    <View style={styles.tabBar}>
      {TENT_TABS.map((tb) => {
        const isActive = tb.key === active;
        const count = badge?.[tb.key];
        return (
          <TouchableOpacity key={tb.key} style={styles.tabItem} activeOpacity={0.7} onPress={() => !isActive && navigation.navigate(tb.route as any)}>
            <View>
              <Icon name={tb.icon} size={21} color={isActive ? colors.pinkStrong : colors.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
              {!!count && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: isActive ? colors.pinkStrong : colors.textMuted }]}>{tb.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function VenueTabBar({ active, navigation, badge }: { active: VenueTab; navigation: Navigation; badge?: Partial<Record<VenueTab, number>> }) {
  return (
    <View style={styles.tabBar}>
      {VENUE_TABS.map((tb) => {
        const isActive = tb.key === active;
        const count = badge?.[tb.key];
        return (
          <TouchableOpacity key={tb.key} style={styles.tabItem} activeOpacity={0.7} onPress={() => !isActive && navigation.navigate(tb.route as any)}>
            <View>
              <Icon name={tb.icon} size={21} color={isActive ? colors.pinkStrong : colors.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
              {!!count && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: isActive ? colors.pinkStrong : colors.textMuted }]}>{tb.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', height: 66, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  badge: { position: 'absolute', top: -4, right: -10, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
});
