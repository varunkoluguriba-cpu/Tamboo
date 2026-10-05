// Shared AsyncStorage keys used across screens.
export const ROLE_KEY = 'tamboo-partner-role';
// Set once the partner taps past the "Application submitted" screen, so they can explore the
// app while verification is still pending instead of being stuck on that screen forever.
export const PENDING_ACK_KEY = 'tamboo-partner-pending-ack';

// Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration →
// Web client ID. Same value as the customer app — it's project-wide, not per-Android-app.
export const GOOGLE_WEB_CLIENT_ID = '81013137310-bpjkthlfec58lc17onklg12j9djcv1up.apps.googleusercontent.com';
