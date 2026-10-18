const express = require('express');
const { requireAdminAuth } = require('../middleware/adminAuth');
const SiteContent = require('../models/SiteContent');

const router = express.Router();

// Public — the marketing site fetches this on load, no auth needed since it's the same copy
// anyone sees on the page anyway.
router.get('/', async (req, res) => {
  const content = await SiteContent.findById(SiteContent.SINGLETON_ID).lean()
    || await SiteContent.create({ _id: SiteContent.SINGLETON_ID });
  res.json(content);
});

// Admin-only — edits the singleton document from the admin panel.
router.put('/', requireAdminAuth, async (req, res) => {
  const {
    heroEyebrow, heroTitle, heroBody, steps, businessPitchTitle, businessPitchBody,
    businessChecklist, cities, customerAppUrl, partnerAppUrl,
  } = req.body || {};
  const update = {
    heroEyebrow, heroTitle, heroBody, steps, businessPitchTitle, businessPitchBody,
    businessChecklist, cities, customerAppUrl, partnerAppUrl,
  };
  const content = await SiteContent.findByIdAndUpdate(SiteContent.SINGLETON_ID, update, {
    new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true,
  });
  res.json(content);
});

module.exports = router;
