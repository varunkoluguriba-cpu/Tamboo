import type { LangStrings } from '../i18n';

// There's no review system yet, so every listing comes back with rating 0 — show "New"
// instead of "★ 0", and the review count only once there actually are reviews.
export function ratingText(rating: number, reviews: number | undefined, t: LangStrings, reviewsLabel?: string): string {
  if (!rating) return t.ratingNew;
  return reviews && reviewsLabel ? `★ ${rating} · ${reviews} ${reviewsLabel}` : `★ ${rating}`;
}

// Joins meta bits like area / distance / years, skipping ones we don't have.
export function metaLine(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' · ');
}

// Distance label; under a kilometre reads as "<1 km" rather than "0 km".
export function kmText(km: number): string {
  return km < 1 ? '<1 km' : `${Math.round(km)} km`;
}
