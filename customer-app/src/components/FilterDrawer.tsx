import React from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from './Icon';
import { colors } from '../theme';

export type DrawerOption = { label: string; selected: boolean; onPress: () => void };
export type DrawerSection = { title: string; multi?: boolean; options: DrawerOption[] };

// Right-side filter panel. Changes apply live (the button shows the live result count), so
// "Show N halls" just closes it — no separate draft state that could drift from the list.
export default function FilterDrawer({ visible, onClose, title, clearLabel, sections, onClear, applyLabel }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  clearLabel: string;
  sections: DrawerSection[];
  onClear: () => void;
  applyLabel: string;
}) {
  const width = Math.min(340, Dimensions.get('window').width * 0.86);
  const x = React.useRef(new Animated.Value(width)).current;
  React.useEffect(() => {
    if (visible) Animated.timing(x, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    else x.setValue(width);
  }, [visible, x, width]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.drawerBackdrop} onPress={onClose}>
        <Animated.View style={[styles.drawer, { width, transform: [{ translateX: x }] }]}>
          <Pressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close">
                <Icon name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16, gap: 18 }}>
              {sections.map((sec) => (
                <View key={sec.title} style={{ gap: 4 }}>
                  <Text style={styles.drawerSection}>{sec.title}</Text>
                  {sec.options.map((o) => (
                    <TouchableOpacity key={o.label} style={styles.drawerRow} activeOpacity={0.7} onPress={o.onPress}>
                      <View style={[sec.multi ? styles.checkBox : styles.radio, o.selected && styles.markOn]}>
                        {o.selected && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.drawerRowText, o.selected && styles.drawerRowTextOn]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.clearBtn} activeOpacity={0.8} onPress={onClear}>
                <Text style={styles.clearBtnText}>{clearLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} activeOpacity={0.85} onPress={onClose}>
                <Text style={styles.applyBtnText}>{applyLabel}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'flex-end' },
  drawer: { flex: 1, backgroundColor: colors.bg, paddingTop: 48, paddingHorizontal: 18, paddingBottom: 18 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  drawerTitle: { fontFamily: 'Sora', fontSize: 19, fontWeight: '800', color: colors.text },
  drawerSection: { fontSize: 12, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 },
  drawerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.dividerStrong, alignItems: 'center', justifyContent: 'center' },
  checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: colors.dividerStrong, alignItems: 'center', justifyContent: 'center' },
  markOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  drawerRowText: { fontSize: 14.5, color: colors.text },
  drawerRowTextOn: { fontWeight: '700' },
  drawerFooter: { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider },
  clearBtn: { flex: 1, height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { fontSize: 14, fontWeight: '700', color: colors.text },
  applyBtn: { flex: 1.6, height: 46, borderRadius: 999, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
