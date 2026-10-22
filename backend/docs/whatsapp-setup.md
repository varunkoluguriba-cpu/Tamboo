# WhatsApp Business API setup (for the WhatsApp Insights feature)

The backend code for this (webhook receiver + AI summarization) is already built and deployed.
It does nothing yet because it needs a real Meta WhatsApp Business API account — these are the
only parts that require your own action, since they involve business verification and an
account only you can create.

## 1. Create a Meta Developer + Business account
1. Go to developers.facebook.com and log in with (or create) a Facebook account.
2. Create a Meta Business Account at business.facebook.com if you don't already have one for Tamboo.
3. In developers.facebook.com, create a new App → choose "Business" type → add the "WhatsApp" product to it.

## 2. Get a test number working first (free, no verification needed yet)
Meta gives every new WhatsApp app a free test phone number you can use immediately, before any
business verification — good enough to prove the whole pipeline works end to end.
1. In the app's WhatsApp > API Setup page, note the **Temporary access token**, the **Phone
   number ID**, and the **WhatsApp Business Account ID**.
2. Add your own personal WhatsApp number as a test recipient (API Setup page → "To" field → Manage
   phone number list).

## 3. Point the webhook at our backend
1. In WhatsApp > Configuration, set the **Callback URL** to:
   `https://tamboo-varun-backend.onrender.com/api/whatsapp/webhook`
2. Set the **Verify token** to any string you choose — just remember it, you'll put the same
   value in Render's env vars below.
3. Subscribe to the `messages` webhook field.

## 4. Add the env vars to Render
In the Render dashboard, on the backend service's Environment tab, add:
- `WHATSAPP_ACCESS_TOKEN` — the access token from step 2 (the temporary one works for testing;
  you'll generate a permanent one in step 5 for production).
- `WHATSAPP_PHONE_NUMBER_ID` — the Phone number ID from step 2.
- `WHATSAPP_VERIFY_TOKEN` — the same string you set as the Verify token in step 3.

Once these three are set and the service redeploys, Meta's webhook verification handshake
(step 3) will succeed. Send a WhatsApp message from the test-recipient number you added in step
2 to the test business number — it should get stored, and after 4 messages in that thread,
summarized into a recap + action items visible in the partner-app's Shop → WhatsApp Insights
screen (only for conversations where the sender's phone matches a registered partner's phone).

## 5. Going live with a real business number (needed before Nov 1 launch if you want this live)
Using the free test number only works for numbers you've manually added as test recipients — not
real customers/partners. To use a real, permanent number:
1. In Meta Business Manager, complete **Business Verification** (submit business documents —
   can take a few days to a couple of weeks).
2. In WhatsApp > API Setup, click "Add phone number" and register a dedicated number for Tamboo
   (cannot be a number with an existing personal WhatsApp account — needs its own SIM or a
   landline number via Meta's voice-call verification).
3. Generate a **permanent** access token (System User token in Business Settings > System Users)
   instead of the temporary one from step 2, and update `WHATSAPP_ACCESS_TOKEN` in Render.
4. Per-conversation pricing applies once you're sending template messages outside the free
   24-hour customer-service window — for this feature (summarizing inbound conversations) that
   mostly doesn't apply since we're only reading, not sending.

## What this feature does NOT do
It only reads and summarizes inbound messages — it does not send replies or messages on your
behalf. If you want Tamboo to also *reply* via WhatsApp (e.g. automated acknowledgments), that's
a separate, larger piece of work (message-sending needs approved message templates for anything
outside a live 24-hour conversation window) — raise it separately when you're ready.
