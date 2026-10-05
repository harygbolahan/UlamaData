# Rebuild Notes

What to keep, what not to carry over, and how to structure the TypeScript rebuild. Source: a static review of eight areas (auth, security, airtime/data, bills and secondary services, funding, profile, home/transactions/notifications, API and build). Findings were spot-checked where noted; the rest come from reading the code and are unverified on a device.

## 1. Decisions to make before writing code

These change the design, so settle them with whoever owns the backend.

| # | Question | Why it matters |
|---|---|---|
| 1 | **Does the backend actually validate the transaction PIN on `/purchase`?** The app sends `"12345"` for every standard purchase (`transaction-summary.jsx:155,185,1191`, `transaction-details.jsx:325`) | If it does not validate, purchases are unauthenticated beyond the login session. If it does, purchases fail for anyone whose PIN is not 12345. Either way the rewrite must collect the real PIN (or a biometric-released PIN) |
| 2 | Are there endpoints for forgot-password, change-password, reset-pin, logout, token refresh, profile update? | None are called today. Screens for the first three exist but are fake |
| 3 | Can purchases accept a **client reference / idempotency key** and return a `pending` status? Is there a "verify transaction by reference" endpoint (for card funding)? | Needed to stop double charges and false success |
| 4 | Who owns the dashboard style, the user or the server `/theme`? | Server currently overwrites the user's choice on each launch |
| 5 | Should PIN login exist separately from the transaction PIN? | Today it stores any 5 digits, unverified, plus the account password |
| 6 | What does "terminate account" do (delete or deactivate) and what happens to the wallet balance? | Copy and behaviour disagree |

## 2. Behaviour to preserve

- The full service list and pricing tiers (see `pages.md` section 4) and every payload in `api-endpoints.md` section 4.
- Balance checks before purchase, with an "Add Money" shortcut.
- Beneficiaries (topup / cable / electricity) and contact picker, with network detection from the number prefix.
- Cable smartcard and electricity meter **verification before purchase**.
- Voucher-PIN products with printing, receipts as PNG / PDF with share, transaction PDF export.
- Biometric and PIN convenience login, auto-lock with warning, forced/soft update modal, popup notification, scrolling notice, banner ads, WhatsApp support button, live chat with image upload, KYC, levels/upgrade, referral + cashback withdrawal.
- Server-driven branding (`/theme`) and payment-method toggles (`/payment-settings`).
- Inter font, Ionicons, service colour map.

## 3. Defects not to carry over

Ordered by risk. IDs are stable so you can reference them in tickets. "Confirmed" means checked directly against the code.

### Payment integrity

| ID | Defect | Location |
|---|---|---|
| P1 | Purchases send a hard-coded PIN `"12345"`; the confirm dialog has no PIN field; biometric enrolment stores `"12345"` (**confirmed**) | `transaction-summary.jsx`, `BiometricSetupModal.jsx:58`, `transaction-details.jsx:325` |
| P2 | No submit guard, no idempotency key, no axios timeout, so double-tap or retry can double-charge | `transaction-summary.jsx`, `api.js` |
| P3 | A timeout or 5xx is shown as "Transaction Failed... will be refunded", although the purchase may have succeeded. A `pending` response shows "Successful" | `transaction-failed.jsx`, summary |
| P4 | Result screens use `router.push`, so Android Back returns to a live Confirm button | `transaction-summary.jsx`, `funds-transfer-summary.jsx:119` |
| P5 | Fake-success fallthrough: if params do not match a branch, the summary shows success without calling the API | `transaction-summary.jsx:240-243` |
| P6 | "Resend Transaction" appears for every status and uses the hard-coded PIN | `transaction-details.jsx` |
| P7 | Card success is inferred from redirect URL text; a failed payment redirecting to the merchant domain shows success; no server verification or balance polling | `payment-webview.jsx:25-35` |
| P8 | Data purchase can send the wrong `planType` (stale plans race; sends `activePlanType`, not `plan.type`) | `buy-data.jsx` |
| P9 | Bulk SMS recipient count differs between UI (comma only) and summary (comma + newline), so the price can mismatch | `bulk-sms.jsx`, `transaction-summary.jsx:417` |
| P10 | Amounts accept NaN and `"1,000"` (parsed as 1); no maximums; phone numbers only length-checked | many screens |

### Security

| ID | Defect | Location |
|---|---|---|
| S1 | Auto-lock timeouts are `300000000` ms (about 83 h) instead of 5 min (**confirmed**) | `auto-lock-context.jsx:21-23` |
| S2 | Logout removes only the token. Biometric email/password, PINs, `user_data`, caches survive, so biometric users are silently signed back in, and the next user sees the previous user's transactions and virtual account | `auth-context.jsx:138-153` |
| S3 | Terminate account has the same leak, so a deleted account can still route to welcome-back | `terminate-account.jsx` |
| S4 | `api.js` logs the bearer token, request bodies (passwords, PINs) and full responses in every build, with no `__DEV__` guard; 259 `console.*` calls in total | `api.js:38-47, 69-72, 101-105` |
| S5 | Token and user PII in plain AsyncStorage; plaintext account password in SecureStore | `auth-context.jsx`, `biometric.js` |
| S6 | PIN login has no lockout, stores any 5 digits unverified, and grants the session; device passcode is an allowed biometric fallback for payments | `biometric.js`, `pin-auth.jsx` |
| S7 | Change-password, reset-pin and forgot-password show "success" but call no API | `change-password.jsx`, `reset-pin.jsx`, `forgot-password.jsx` |
| S8 | Wrong-password 401 on `/login` may trigger the global "session expired" redirect | `api.js:97`, `auth-context.jsx` |
| S9 | Payment WebView URL is a route param, so a crafted `ulamadata://` link can open an arbitrary page under a "Secure Payment" banner. Dead screens `bank-transfer` / `ussd-payment` contain a fake account and false success | `payment-webview.jsx`, `(fund-wallet)/*` |
| S10 | Push token never unregistered on logout, no retry on failure | `notification-context.jsx` |
| S11 | Switching accounts leaves the old account's biometric/PIN credentials in place | `auth-context.jsx`, `biometric.js` |

### Crashes and correctness

| ID | Defect | Location |
|---|---|---|
| C1 | `handleReferralPress` is undefined, so tapping a referral row throws (**confirmed**) | `referral.jsx:196` |
| C2 | Stray text node `paddingTop: 20,{" "}` inside a `TouchableOpacity` crashes the bulk-order network modal (**confirmed**) | `bulk-order.jsx:828` |
| C3 | Notifications screen calls `syncTokenWithBackend`, which the context does not export | `(profile)/notifications.jsx` |
| C4 | Search clear (X) refetches with the old query; focus refetch ignores active filters; overlapping requests overwrite each other; Home and History share one list state | `transactions.jsx`, `transactions-context.jsx` |
| C5 | Dashboards pass a display string (`"Today, 3:45 PM"`) as the receipt date parameter | `ModernDashboard.jsx:812`, `ClassicDashboard.jsx:254` |
| C6 | Missing theme tokens (`textSecondary`, `card`, `border`) used in about 12 files | see `theming.md` |
| C7 | Bulk-order airtime auto-navigates 1.5 s after the last keystroke; electricity quick-amounts auto-navigate | `bulk-order.jsx`, `electricity.jsx` |
| C8 | Manual airtime swap never calls the API, but the copy says "credited instantly" | `airtime-swap.jsx` |
| C9 | Exam PINs and `exam_name` are passed to the success screen but never read; electricity token may be hidden inside `api_response` | `transaction-success.jsx` |
| C10 | Prepaid to postpaid switch does not clear verification; cable verify shows a green tick when the server returns no name | `electricity.jsx`, `cable-tv.jsx` |
| C11 | Personal-info inputs look editable but nothing saves; terminate-account never sends the reason | `personal.jsx`, `terminate-account.jsx` |
| C12 | KYC: non-empty validation only, impossible dates accepted, no size cap on the image, forced 3:4 crop | `kyc.jsx` |
| C13 | Receipt invents VAT, subtotal, validity and location; phone is the first 11-digit match, so meters and smartcards show wrongly | `transaction-details.jsx` |
| C14 | Live-chat poll scrolls to bottom every 5 s; polling never pauses in background | `live-chat.jsx` |
| C15 | Scheduled purchase sends a date only (hard-coded 12:00 AM, no timezone); summary does not show it; scheduled items are blocked by the current balance | `schedule-transaction.jsx` |

### Hygiene

Lint (33 errors, 148 warnings), `tsc` failing on an example file, five dashboards copy-pasted, mock screens (`cards`, `history`, `payment`), template leftovers, committed jar and `NOTIFICATIONS.json`, hard-coded URLs, no tests, no CI, no crash reporting, no error boundary, no staging environment.

## 4. Target architecture

```
src/
  app/                    expo-router routes only (thin: compose feature screens)
    (auth)/  (tabs)/  (services)/  (wallet)/  (profile)/  (security)/  (support)/
  features/
    auth/  wallet/  services/{airtime,data,cable,electricity,education,bulk,schedule,swap}/
    transactions/  beneficiaries/  profile/  kyc/  referral/  support/  notifications/
  api/                    typed client (see api-endpoints.md section 13)
  theme/                  tokens + provider (see theming.md section 7)
  components/             Button, Input, Card, Modal, Toast, ListStates, Receipt ...
  lib/                    money, phone, dates, validators, secureStorage, logger
  state/                  auth store, settings store
  types/
```

Recommended choices (each addresses a defect above):

| Concern | Choice | Fixes |
|---|---|---|
| Server state | **TanStack Query** for lists, lookups, config, transactions | Duplicate fetches, stale caches, request ordering, refresh, per-query keys (C4, C14, Home/History shared state) |
| Client state | Small store (Zustand) or context for auth + settings | Provider nesting (12 deep) |
| Auth storage | `expo-secure-store` for the token; clear **everything** on logout via one `resetSession()` | S2, S3, S5, S11 |
| API client | Axios with timeout, typed `ApiError`, `normalizeResponse`, redaction, `__DEV__`-only logging, no 401 hook on `/login` | S4, S8, P2 |
| Purchases | One `usePurchase()` hook: in-flight lock, client reference, `pending` state, poll status, real PIN, `router.replace` to result | P1-P5, P10 |
| Forms | `react-hook-form` + `zod` schemas for phone, amount, PIN, KYC | P10, C12 |
| Lists | `FlatList` with `onEndReached`; one paginated query per filter | C4 |
| Routing | `Stack.Protected` / redirect on auth + lock state; a `locked` overlay rather than `router.replace('/splash')` | No route guards, lock bypass |
| Money | Integer kobo or a decimal helper; one `formatNaira()` | Currency inconsistencies, string concat bugs |
| Errors | Root error boundary + Sentry (PII-scrubbed) | No crash visibility |
| Config | `EXPO_PUBLIC_API_URL` per EAS profile; `google-services.json` as an EAS file secret | Hard-coded URL, committed key |

## 5. Suggested build order

1. **Foundation**: project scaffold (`create-expo-app` on the current SDK, strict TS), `theme/`, `api/` client, `lib/` validators and formatters, error boundary, logger, CI (lint + `tsc` + tests).
2. **Auth and session**: onboarding, signup, login, secure token, `resetSession`, route guards, lock (with correct timers), biometric/PIN unlock. Wire real forgot/change password and reset-pin, or omit them.
3. **Read-only surfaces**: Home (one dashboard layout), Services grid, Pricing, Transactions list + details, Support, static pages. Establish the query layer and list states here.
4. **Purchase engine**: `usePurchase`, summary, PIN modal, result screens. Ship airtime and data first, then cable, electricity, education, voucher PINs, then bulk, schedule, SMS.
5. **Wallet**: funding methods (with server verification of card payments), coupon, manual, virtual accounts, bank transfer.
6. **Account**: KYC, levels, referral + cashback, beneficiaries, profile edit (if the backend supports it), terminate account.
7. **Extras**: push notifications with deep links, popup notice, update modal, live chat, WhatsApp button, PDF/PNG receipts.
8. **Hardening**: accessibility labels, dark mode pass, offline states, release build log audit, store metadata (photo-library and camera strings, `POST_NOTIFICATIONS`).

Migrate screens by area rather than everything at once, so each area can be tested against the real backend as it lands. Do **not** copy the contexts across. Re-implement them as query hooks over the typed API.

## 6. Test plan for the rebuild

The current app has no tests. Start with these.

**Unit** (`jest-expo`): phone normalisation and validation (`+234`, `234`, `080…`, spaces), network-prefix detection, amount parsing and limits, `formatNaira`, version comparison, brand-colour validation and `withAlpha`, purchase-payload builders (one per service, asserting the exact field names and casing from `api-endpoints.md`), status mapping.

**Integration** (`axios-mock-adapter` or `msw`): interceptor behaviour (bearer header; 401 via HTTP and via body fires once; excluded on `/login`; timeout; network error), `resetSession` clears every key in the storage inventory, purchase engine (double-tap gives one request; timeout gives `pending`, not failure; retry reuses the reference; fail/error map to the failed screen), transactions query (filter change cancels the old request; search clear resets).

**E2E** (Maestro): onboarding to signup; login; biometric/PIN unlock; airtime purchase happy path and insufficient balance; card payment cancel; session expiry redirect; logout then relaunch (must not auto-login); auto-lock after the timeout; switch user (no old data visible).

**Manual checklist per release**: release-build logcat/Console contains no tokens, passwords or PINs; Android Back from a result screen does not reach Confirm; airplane mode mid-purchase shows an unconfirmed state; screen reader labels; large fonts; dark mode.

Each defect ID in section 3 should have at least one test that fails on the old behaviour and passes on the new.
