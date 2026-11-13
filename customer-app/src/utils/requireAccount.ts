import { Alert } from 'react-native';
import type { AuthUser } from '../types';
import type { LangStrings } from '../i18n';

// The phone sheet (components/PhoneSheet.tsx) registers itself here when it mounts.
let phoneSheetOpener: (() => void) | null = null;
export const setPhoneSheetOpener = (fn: (() => void) | null) => { phoneSheetOpener = fn; };
export const openPhoneSheet = () => phoneSheetOpener?.();

// Guests can browse, but booking, paying or asking for a quote needs a real account —
// otherwise the vendor gets an order with no name or phone number to reach the customer.
// Returns true if the action may go ahead; otherwise offers to log in (logout() returns the
// app to the Login screen, from where a guest can verify their mobile).
export function requireAccount(user: AuthUser | null, t: LangStrings, logout: () => Promise<void>): boolean {
  if (user && !user.isGuest) {
    // Google sign-ins have no number yet — owners/vendors need one to call about the booking.
    if (!user.phone) { openPhoneSheet(); return false; }
    return true;
  }
  Alert.alert(t.guestLoginTitle, t.guestLoginMsg, [
    { text: t.cancel, style: 'cancel' },
    { text: t.guestLoginCta, onPress: () => { logout(); } },
  ]);
  return false;
}
