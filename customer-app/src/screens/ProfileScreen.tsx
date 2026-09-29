import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import TabBar from '../components/TabBar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGS, langName } from '../i18n';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const PAYMENT_HISTORY = [
  { id: 'TB-250142', event: 'Priya & Karthik Wedding', status: 'CONFIRMED', amount: '₹42,000' },
  { id: 'TB-249981', event: 'Office Diwali Party', status: 'COMPLETED', amount: '₹12,300' },
];

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.toggleTrack, on && styles.toggleTrackOn]}>
      <View style={[styles.toggleKnob, on && styles.toggleKnobOn]} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const [langModal, setLangModal] = useState(false);
  const [addrs, setAddrs] = useState<string[]>(['12-3-45, Ameerpet, Hyderabad, Telangana 500016']);
  const [newAddr, setNewAddr] = useState('');
  const [toggles, setToggles] = useState({ booking: true, offers: true, whatsapp: false });

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const addAddress = () => {
    const v = newAddr.trim();
    if (!v) return;
    setAddrs((a) => [...a, v]);
    setNewAddr('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name || 'there'}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => setLangModal(true)}>
          <View style={styles.rowIcon}>
            <Text style={styles.rowIconText}>अ</Text>
          </View>
          <Text style={styles.rowLabel}>Language</Text>
          <Text style={styles.rowValue}>{langName(lang)[1]}</Text>
          <Icon name="right" size={16} color={colors.dividerStrong} />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Saved addresses</Text>
          {addrs.map((a, i) => (
            <View key={i} style={styles.addrRow}>
              <Icon name="pin" size={15} color={colors.pink} />
              <Text style={styles.addrText}>{a}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setAddrs((list) => list.filter((_, idx) => idx !== i))}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addrInputRow}>
            <TextInput
              value={newAddr}
              onChangeText={setNewAddr}
              placeholder="Add a new address"
              placeholderTextColor={colors.textMuted}
              style={styles.addrInput}
            />
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={addAddress}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Booking updates</Text>
            <Toggle on={toggles.booking} onPress={() => setToggles((t) => ({ ...t, booking: !t.booking }))} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Offers & promotions</Text>
            <Toggle on={toggles.offers} onPress={() => setToggles((t) => ({ ...t, offers: !t.offers }))} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>WhatsApp reminders</Text>
            <Toggle on={toggles.whatsapp} onPress={() => setToggles((t) => ({ ...t, whatsapp: !t.whatsapp }))} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment history</Text>
          {PAYMENT_HISTORY.map((p) => (
            <View key={p.id} style={styles.payRow}>
              <View>
                <Text style={styles.payEvent}>{p.event}</Text>
                <Text style={styles.paySub}>{p.id} · {p.status}</Text>
              </View>
              <Text style={styles.payAmount}>{p.amount}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => navigation.navigate('Chat', { peerName: 'Tamboo Support' })}>
          <View style={styles.rowIcon}>
            <Icon name="chat" size={17} color={colors.pinkStrong} />
          </View>
          <Text style={styles.rowLabel}>Help & support</Text>
          <Icon name="right" size={16} color={colors.dividerStrong} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <TabBar active="profile" navigation={navigation} />

      <Modal visible={langModal} animationType="slide" transparent onRequestClose={() => setLangModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Choose your language</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {LANGS.map(([code, native, en]) => (
                <TouchableOpacity
                  key={code}
                  style={styles.langRow}
                  activeOpacity={0.85}
                  onPress={() => {
                    setLang(code);
                    setLangModal(false);
                  }}
                >
                  <Text style={styles.langNative}>{native}</Text>
                  <Text style={styles.langEn}>{en}</Text>
                  {lang === code && <Icon name="check" size={16} color={colors.pinkStrong} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} activeOpacity={0.85} onPress={() => setLangModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 6, gap: 14, paddingBottom: 24 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: 'Sora', fontWeight: '800', fontSize: 22 },
  userName: { fontFamily: 'Sora', fontSize: 20, fontWeight: '800', color: colors.text },
  userPhone: { fontSize: 13, color: colors.textSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 14, ...shadow.card },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  rowIconText: { color: colors.pinkStrong, fontWeight: '800' },
  rowLabel: { flex: 1, fontWeight: '700', fontSize: 14, color: colors.text },
  rowValue: { fontSize: 13, color: colors.textSoft },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 10, ...shadow.card },
  cardTitle: { fontWeight: '700', fontSize: 14, color: colors.text },
  addrRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  addrText: { flex: 1, fontSize: 13, color: '#4b4560' },
  removeText: { color: colors.dangerStrong, fontSize: 12, fontWeight: '700' },
  addrInputRow: { flexDirection: 'row', gap: 8 },
  addrInput: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, fontSize: 13, color: colors.text },
  addBtn: { height: 40, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 13.5, color: colors.text },
  toggleTrack: { width: 44, height: 26, borderRadius: 999, backgroundColor: colors.divider, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: colors.pink },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: 3, ...shadow.card },
  toggleKnobOn: { marginLeft: 21 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payEvent: { fontSize: 13, fontWeight: '600', color: colors.text },
  paySub: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  payAmount: { fontWeight: '700', color: colors.text },
  logoutBtn: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: '#fca5a5', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: colors.dangerStrong, fontWeight: '600', fontSize: 14, fontFamily: 'Sora' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(30,27,46,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, gap: 12 },
  modalTitle: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  langNative: { fontSize: 15, fontWeight: '700', color: colors.text, width: 90 },
  langEn: { flex: 1, fontSize: 13, color: colors.textSoft },
  modalClose: { height: 46, borderRadius: 999, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontWeight: '700', color: colors.text },
});
