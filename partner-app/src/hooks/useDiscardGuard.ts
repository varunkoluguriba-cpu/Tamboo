import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';

// Android back / swipe would otherwise silently throw away a half-filled form. `snapshot` is any
// string that changes when the form does; the first value seen once `ready` is the baseline.
// Call the returned `allowLeave()` right before navigating away after a successful save/delete.
export function useDiscardGuard(navigation: NavigationProp<ParamListBase>, snapshot: string, ready = true) {
  const { t } = useLanguage();
  const baseline = useRef<string | null>(null);
  const leaving = useRef(false);
  useEffect(() => {
    if (ready && baseline.current === null) baseline.current = snapshot;
  }, [ready, snapshot]);
  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    if (leaving.current || baseline.current === null || baseline.current === snapshot) return;
    e.preventDefault();
    Alert.alert(t.itemFormDiscardTitle, t.itemFormDiscardMsg, [
      { text: t.itemFormKeepEditing, style: 'cancel' },
      { text: t.itemFormDiscard, style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
    ]);
  }), [navigation, snapshot, t]);
  return { allowLeave: () => { leaving.current = true; } };
}
