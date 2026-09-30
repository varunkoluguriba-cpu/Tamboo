import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { TentTabBar } from '../components/TabBar';
import { MY_ITEMS } from '../data/catalog';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Items'>;

const STATE_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  LIVE: { label: 'Live', bg: '#e8f7f0', color: '#047857' },
  REVIEW: { label: 'Under review', bg: '#f3eefd', color: '#5b21b6' },
  PAUSED: { label: 'Paused', bg: '#f4f1f8', color: '#4b4560' },
};

export default function ItemsScreen({ navigation }: Props) {
  const liveCount = MY_ITEMS.filter((i) => i.state === 'LIVE').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <Text style={styles.title}>My items</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ItemForm', {})}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.addBtn}>
              <Icon name="plus" size={15} color="#fff" />
              <Text style={styles.addBtnText}>Add item</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={styles.summary}>{liveCount} live · {MY_ITEMS.length} total</Text>

        <View style={{ gap: 10 }}>
          {MY_ITEMS.map((p) => {
            const st = STATE_LABEL[p.state];
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.photo}>
                  <Icon name="package" size={26} color={colors.pinkStrong} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.meta}>{p.instant ? `₹${p.price.toLocaleString('en-IN')} ${p.unit} · stock ${p.stock}` : 'Price on request'}</Text>
                  <View style={[styles.pill, { backgroundColor: st.bg }]}>
                    <Text style={[styles.pillText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <TouchableOpacity style={styles.smallBtn} activeOpacity={0.85} onPress={() => navigation.navigate('ItemForm', { id: p.id })}>
                    <Text style={styles.smallBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn} activeOpacity={0.85} onPress={() => {}}>
                    <Text style={styles.smallBtnText}>{p.state === 'PAUSED' ? 'Resume' : 'Pause'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <TentTabBar active="items" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 12 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Sora', fontSize: 22, fontWeight: '800', color: colors.text },
  addBtn: { height: 40, paddingHorizontal: 16, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5, fontFamily: 'Sora' },
  summary: { fontSize: 12.5, color: colors.textSoft },
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, padding: 12, ...shadow.card },
  photo: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 18 },
  meta: { fontSize: 12, color: colors.textSoft },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  pillText: { fontSize: 11, fontWeight: '700' },
  smallBtn: { height: 32, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { color: colors.text, fontWeight: '600', fontSize: 12 },
});
