# Milestone 08 — Optional Stripe support

**Status:** Not started
**Estimated effort:** 1–2 development days

## Objective

Give satisfied users a low-pressure way to support continued development and
measure support conversion without implying charitable-donation status.

## Stripe setup

- [ ] Create a “Customers choose what to pay” Payment Link
- [ ] Suggested amount $5, minimum $2, reasonable maximum
- [ ] Configure public business name, support email, statement descriptor, and receipts
- [ ] Redirect successful payments to `/thanks/`
- [ ] Use UTM values for CTA placement and anonymous `client_reference_id`
- [ ] Use a restricted API key and sealed Railway variables if API access is needed
- [ ] Register and signature-verify the Railway webhook endpoint
- [ ] Filter completions to the expected Payment Link ID
- [ ] Store Stripe event IDs idempotently

## Product placement

- [ ] Quiet sidebar/footer support link
- [ ] Post-export support prompt
- [ ] Feedback thank-you support prompt
- [ ] Track impressions, clicks, completed payments, amount, and placement

## Acceptance criteria

- Support is always optional and never blocks a free feature.
- Payment completion is attributed from a verified webhook, not a redirect.
- No Stripe secret or restricted key is present in frontend code or git history.
- The wording uses “support” or “tip,” not charitable “donation.”
