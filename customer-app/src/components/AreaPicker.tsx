import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from './Icon';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme';

// Bottom-sheet list of Hyderabad localities (from the server, so it matches the admin
// area analytics exactly). Picking is optional — "not listed" clears the choice.
export default function AreaPicker({ visible, value, onClose, onPick }: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onPick: (area: string) => void;
}) {
  const { t } = useLanguage();
  const [areas, setAreas] = useState<string[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    if (visible && !areas) api.get<string[]>('/api/auth/localities').then(setAreas).catch(() => setAreas([]));
  }, [visible, areas]);
  const shown = useMemo(() => (areas || []).filter((a) => a.toLowerCase().includes(q.trim().toLowerCase())), [areas, q]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.head}>
          <Text style={styles.title}>{t.areaTitle}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><Icon name="x" size={20} color={colors.textSoft} /></TouchableOpacity>
        </View>
        <TextInput style={styles.search} value={q} onChangeText={setQ} placeholder={t.areaSearch} placeholderTextColor={colors.textMuted} />
        {areas === null ? (
          <ActivityIndicator color={colors.pink} style={{ marginVertical: 30 }} />
        ) : (
          <FlatList
            data={shown}
            keyExtractor={(a) => a}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => onPick(item)}>
                <Text style={[styles.rowText, item === value && styles.rowSel]}>{item}</Text>
                {item === value && <Icon name="check" size={16} color={colors.pinkStrong} strokeWidth={2.5} />}
              </TouchableOpacity>
            )}
            ListFooterComponent={(
              <TouchableOpacity style={styles.row} onPress={() => onPick('')}>
                <Text style={[styles.rowText, { color: colors.textSoft }]}>{t.areaSkip}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { maxHeight: '75%', backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontFamily: 'Sora', fontSize: 18, fontWeight: '800', color: colors.text },
  search: { height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 12, fontSize: 14, color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowText: { fontSize: 14.5, color: colors.text },
  rowSel: { fontWeight: '800', color: colors.pinkStrong },
});
