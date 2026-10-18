const mongoose = require('mongoose');

// Singleton document — the marketing site's editable copy, so the admin can update text/links
// without a code change + redeploy. One fixed _id, upserted on save, fetched whole by the
// public site on load.
const SINGLETON_ID = 'marketing-site';

const stepSchema = new mongoose.Schema({ title: String, body: String }, { _id: false });
const citySchema = new mongoose.Schema({ name: String, live: Boolean }, { _id: false });

const siteContentSchema = new mongoose.Schema({
  _id: { type: String, default: SINGLETON_ID },
  heroEyebrow: { type: String, default: 'Now live in Hyderabad' },
  heroTitle: { type: String, default: 'Book your event, without the guesswork.' },
  heroBody: {
    type: String,
    default: 'Browse verified function halls, banquet halls and tent-house vendors, pay a small refundable token to pre-book, and lock in your date — all in one app.',
  },
  steps: {
    type: [stepSchema],
    default: [
      { title: 'Browse verified venues', body: 'See real photos, pricing, capacity and a live calendar for every hall and vendor — no surprises when you show up.' },
      { title: 'Pre-book with a token', body: 'Pay a small refundable token to hold your date and slot while you visit in person and finalize the details.' },
      { title: 'Confirm your event', body: 'Like what you see? Confirm directly with the venue. Change your mind before visiting? Get a full refund.' },
    ],
  },
  businessPitchTitle: { type: String, default: 'Own a hall or run a tent house?' },
  businessPitchBody: {
    type: String,
    default: 'List your business on Tamboo and reach customers actively planning an event right now — no more relying on word of mouth alone.',
  },
  businessChecklist: {
    type: [String],
    default: [
      'Free listing, get paid for every confirmed pre-booking',
      'A live calendar that stops double-bookings before they happen',
      'Manage orders, quotes and your earnings from one app',
      'Price your hall your way — flat rent, or per-plate with the hall complimentary above a minimum guest count',
    ],
  },
  cities: {
    type: [citySchema],
    default: [
      { name: 'Hyderabad', live: true },
      { name: 'Secunderabad', live: false },
      { name: 'Warangal', live: false },
      { name: 'Vijayawada', live: false },
    ],
  },
  customerAppUrl: { type: String, default: '' },
  partnerAppUrl: { type: String, default: '' },
}, { timestamps: true });

siteContentSchema.statics.SINGLETON_ID = SINGLETON_ID;

module.exports = mongoose.model('SiteContent', siteContentSchema);
