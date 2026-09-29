import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from './Icon';
import type { IconName } from './icons';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

export type TabKey = 'home' | 'search' | 'bookings' | 'cart' | 'profile';

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
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const { t } = useLanguage();

  const go = (key: TabKey) => {
    if (key === active) return;
    if (key === 'home') return navigation.navigate('Home');
    if (key === 'search') return navigation.navigate('Browse', {});
    soon();
  };

  return (
    <View style={styles.tabBar}>
      {TABS.map((tb) => {
        const isActive = tb.key === active;
        return (
          <TouchableOpacity key={tb.key} style={styles.tabItem} activeOpacity={0.7} onPress={() => go(tb.key)}>
            <Icon name={tb.icon} size={21} color={isActive ? colors.pinkStrong : colors.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
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
});
