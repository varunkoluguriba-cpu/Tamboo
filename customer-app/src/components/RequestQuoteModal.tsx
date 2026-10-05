import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { api, ApiError } from '../api/client';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  vendorId?: string;
  vendorName: string;
  productName?: string;
};

export default function RequestQuoteModal({ visible, onClose, vendorId, vendorName, productName }: Props) {
  const { t } = useLanguage();
  const { event } = useEvent();
  const [need, setNeed] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!need.trim()) return;
    setSending(true);
    try {
      await api.post('/api/quotes', {
        vendorId,
        vendorName,
        productName,
        dateTxt: event.date,
        guests: Number(event.guests) || 0,
        need: need.trim(),
      });
      setNeed('');
      onClose();
      Alert.alert(t.quoteSendButton, t.quoteValidHint);
    } catch (e) {
      Alert.alert(t.tryAgain, e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t.productRequestQuote}</Text>
          <Text style={styles.sub}>{vendorName}</Text>
          <TextInput
            value={need}
            onChangeText={setNeed}
            placeholder={t.quoteItemOrService}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            style={styles.input}
            autoFocus
          />
          <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={sending || !need.trim()}>
            <LinearGradient colors={gradients.primaryButton.colors} start={gradients.primaryButton.start} end={gradients.primaryButton.end} style={[styles.sendBtn, (!need.trim() || sending) && styles.sendBtnDisabled]}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>{t.quoteSendButton}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30,10,20,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28, gap: 12 },
  title: { fontFamily: 'Sora', fontWeight: '800', fontSize: 19, color: colors.text },
  sub: { fontSize: 13, color: colors.textSoft, marginTop: -8 },
  input: { minHeight: 100, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 14, paddingTop: 12, fontSize: 14.5, color: colors.text, textAlignVertical: 'top' },
  sendBtn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'Sora' },
});
