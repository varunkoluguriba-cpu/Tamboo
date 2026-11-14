import { Alert } from 'react-native';
import type { LangStrings } from '../i18n';

// Logout sits right next to Delete account on every home screen — ask before signing out.
export function confirmLogout(t: LangStrings, logout: () => void) {
  Alert.alert(t.logoutConfirmTitle, undefined, [
    { text: t.deleteAccountCancel, style: 'cancel' },
    { text: t.logout, style: 'destructive', onPress: logout },
  ]);
}
