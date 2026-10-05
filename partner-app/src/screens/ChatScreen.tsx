import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Icon from '../components/Icon';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;
type Msg = { id: string; text: string; mine: boolean; at: string };
type RemoteMsg = { id: string; sender: 'customer' | 'partner' | 'admin'; text: string; at: string };

const POLL_MS = 4000;

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours() % 12 || 12;
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${hh}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

export default function ChatScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { customerId, customerName } = route.params;
  // No customerId means this is the partner's own Tamboo Support thread, not a customer chat.
  const endpoint = customerId ? `/api/messages/vendor/${customerId}` : '/api/messages/support/vendor/me';
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = () => {
      api.get<RemoteMsg[]>(endpoint)
        .then((res) => setMsgs(res.map((m) => ({ id: m.id, text: m.text, mine: m.sender === 'partner', at: fmtTime(m.at) }))))
        .catch(() => {});
    };
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [endpoint]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setMsgs((m) => [...m, { id: `tmp-${Date.now()}`, text, mine: true, at: 'now' }]);
    api.post(endpoint, { text }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Icon name="left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.peerName}>{customerName}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {msgs.map((m) =>
            m.mine ? (
              <View key={m.id} style={styles.bubbleMineWrap}>
                <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.bubbleMine}>
                  <Text style={styles.bubbleMineText}>{m.text}</Text>
                  <Text style={styles.bubbleMineTime}>{m.at}</Text>
                </LinearGradient>
              </View>
            ) : (
              <View key={m.id} style={styles.bubbleTheirsWrap}>
                <Text style={styles.bubbleTheirsText}>{m.text}</Text>
                <Text style={styles.bubbleTheirsTime}>{m.at}</Text>
              </View>
            ),
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t.chatMessagePlaceholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            onSubmitEditing={send}
          />
          <TouchableOpacity style={styles.sendBtnWrap} activeOpacity={0.85} onPress={send}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={styles.sendBtn}>
              <Icon name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  peerName: { fontFamily: 'Sora', fontWeight: '800', fontSize: 15, color: colors.text },
  scroll: { padding: 18, gap: 8, flexGrow: 1 },
  bubbleMineWrap: { alignSelf: 'flex-end', maxWidth: '78%' },
  bubbleMine: { borderRadius: 18, borderBottomRightRadius: 4, paddingVertical: 9, paddingHorizontal: 13 },
  bubbleMineText: { color: '#fff', fontSize: 13.5, lineHeight: 19 },
  bubbleMineTime: { color: 'rgba(255,255,255,0.75)', fontSize: 10, textAlign: 'right', marginTop: 2 },
  bubbleTheirsWrap: { alignSelf: 'flex-start', maxWidth: '78%', backgroundColor: colors.surface, borderRadius: 18, borderBottomLeftRadius: 4, paddingVertical: 9, paddingHorizontal: 13, ...shadow.card },
  bubbleTheirsText: { fontSize: 13.5, lineHeight: 19, color: colors.text },
  bubbleTheirsTime: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  input: { flex: 1, height: 44, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface, paddingHorizontal: 16, fontSize: 14, color: colors.text },
  sendBtnWrap: {},
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
