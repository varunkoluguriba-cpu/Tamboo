import notifee, { AndroidImportance, RepeatFrequency, TriggerType } from '@notifee/react-native';
import { Platform } from 'react-native';

// A single, fixed-id daily local reminder nudging venue owners to upload a photo of their
// paper booking register — entirely on-device (no server, no push/FCM infra needed). Calling
// this again just replaces the same notification id, so it's safe to call on every app open.
const NOTIFICATION_ID = 'tamboo-register-photo-reminder';
const REMINDER_HOUR = 20; // 8 PM local time — end of a typical business day

function nextTriggerTimestamp(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), REMINDER_HOUR, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

export async function scheduleRegisterPhotoReminder(): Promise<void> {
  try {
    const settings = await notifee.requestPermission();
    const granted = Platform.OS === 'android'
      ? true // Android <13 has no runtime prompt; 13+ is covered by requestPermission above
      : settings.authorizationStatus >= 1; // AuthorizationStatus.AUTHORIZED or PROVISIONAL
    if (!granted) return;

    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'register-reminders',
        name: 'Booking register reminders',
        importance: AndroidImportance.DEFAULT,
      });
    }

    await notifee.createTriggerNotification(
      {
        id: NOTIFICATION_ID,
        title: 'Update your booking register',
        body: "Got any new bookings today? Snap a photo of your register so your Tamboo calendar stays accurate.",
        android: { channelId: 'register-reminders', pressAction: { id: 'default' } },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: nextTriggerTimestamp(),
        repeatFrequency: RepeatFrequency.DAILY,
      },
    );
  } catch {
    // Local notifications are a convenience, not a safety mechanism (the real double-booking
    // guard is server-side) — never let a scheduling failure disrupt the app.
  }
}

export async function cancelRegisterPhotoReminder(): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(NOTIFICATION_ID);
  } catch {
    // ignore
  }
}
