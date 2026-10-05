# Pages, Routes and Flows

Every screen in the current app (Expo Router, file-based), what it does, which endpoints it calls, and the flow it belongs to. Paths are relative to `app/`.

Legend: **Live** = reachable from the UI today. **Hidden** = the route exists but nothing links to it. **Dead** = mock data or a stub.

## 1. Navigation structure

```
Root Stack (app/_layout.jsx)  headerShown: false
├─ index               redirects to /(tabs)/home (races the layout redirect)
├─ splash              3 s timer, then routes by stored state
├─ (onboarding)/       index, auth-selector
├─ (auth)/             login, signup, forgot-password, pin-auth, biometric-auth, welcome-back
├─ (tabs)/             bottom tabs: Home, Services, History, Earn, Profile   (+ Cards, hidden)
├─ (services)/         13 service screens + summary / success / failed
├─ (fund-wallet)/      funding methods
├─ (profile)/          account screens
├─ (security)/         PIN / password / biometric management
├─ (support)/          faqs, live-chat
├─ fund-wallet         funding method picker
└─ transaction-details receipt
```

Provider order (outermost first): `Dashboard > Theme > Toast > Auth > Notification > AutoLock > ActivityTracker > Banner > Services > Payment > Transactions > Beneficiary`. Global overlays rendered in the root: `AppUpdateModal`, `StatusBar`.

### Cold-start routing (`_layout.jsx` + `splash.jsx`)

```
fonts loaded -> hide native splash
  onboarding not seen ........................ /(onboarding)
  else /splash (3 s):
      onboarding not seen .................... /(onboarding)
      biometric login enabled ................ /(auth)/biometric-auth
      PIN login enabled ...................... /(auth)/pin-auth
      stored user_email exists ............... /(auth)/welcome-back   (password only)
      otherwise .............................. /(auth)/login
```

There are **no route guards**: protection comes only from this splash routing and the auto-lock replacing the route with `/splash`. The rewrite should use real guards (`Stack.Protected` / redirect on auth state).

## 2. Onboarding and auth

| Route | Status | Purpose | Calls | Notes |
|---|---|---|---|---|
| `(onboarding)/index` | Live | 4-slide intro; Skip / Get Started sets `hasSeenOnboarding` | none | Dimensions read once |
| `(onboarding)/auth-selector` | Live | Sign In or Create Account | none | |
| `(auth)/signup` | Live | 2-step form. Step 1: first name, surname, email. Step 2: phone, password, confirm, 5-digit access PIN, optional referral code | `POST /register` | On success: save token, unlock, replace to home. No format validation. PIN is unmasked |
| `(auth)/login` | Live | Email + password; biometric button if enabled | `POST /login` | |
| `(auth)/forgot-password` | Dead | Email field, "Check your email" state | **none** | Stub: claims success without sending anything |
| `(auth)/welcome-back` | Live | Returning user: password only, uses stored email | `POST /login` | Shows "Invalid password" for any failure |
| `(auth)/pin-auth` | Live | 5-digit keypad unlock; on success re-logs-in with stored biometric credentials | `POST /login` | Dead-ends after a 401 (token gone), and shows "Incorrect PIN" for a correct PIN |
| `(auth)/biometric-auth` | Live | Auto-prompts biometrics (800 ms), then a full API re-login with stored email + password | `POST /login` | |
| `splash` | Live | Branded 3 s wait, then routing above | none | Also re-run on every auto-lock |
| `index` | Live | Redirect to home | none | |

## 3. Tabs

| Route | Purpose | Calls | Notes |
|---|---|---|---|
| `(tabs)/home` | Renders one of 5 dashboards; balance (hide/show, persisted as `balanceVisible`), recent transactions, banners, scrolling notice, service shortcuts; pull-to-refresh; floating WhatsApp support button; popup notification sheet | `GET /get-user` (every focus), `GET /get-transactions` (page 1), `GET /support` (WhatsApp tap), `/get-notification`, `/banner` | Each dashboard fetches transactions on its own |
| `(tabs)/services` | 3-column grid of 13 services (list in section 4). Search field is decorative | none | Has its own theme toggle |
| `(tabs)/transactions` ("History") | Search, date filter, infinite list, PDF export | `GET /get-transactions`, `GET /download-transactions` | 5-minute cache of page 1 only; see known issues |
| `(tabs)/earn` | Referral code/link (copy, share), referral list, cashback balance and withdrawal to wallet | `GET /referral`, `POST /withdraw-cashback` | Withdrawal needs PIN or biometric |
| `(tabs)/profile` | Profile card, KYC prompt, menu (below), dark-mode toggle, logout modal | none (reads `user`) | Camera button and gear icon do nothing |
| `(tabs)/cards` | Mock virtual cards | none | Hidden tab (`href: null`), mock data (Visa 4242, Netflix) |

Tab bar order: Home, Services, History, Earn, Profile.

### Profile menu

| Entry | Route | Status |
|---|---|---|
| Personal Information | `(profile)/personal` | Live |
| Security & Privacy | `(profile)/security` | Live |
| Upgrade Account | `(profile)/upgrade` | Live |
| Help & Support | `(profile)/support` | Live |
| Privacy Policy | `(profile)/privacy-policy` | Live |
| Terms & Conditions | `(profile)/terms-conditions` | Live |
| About | `(profile)/about` | Live (version hard-coded) |
| Terminate Account | `(profile)/terminate-account` | Live |
| Referral Program, Dashboard Style, Payment Methods, Transaction History, Notifications | `(profile)/referral`, `dashboard-selector`, `payment`, `history`, `notifications` | Hidden (commented out) |

## 4. Services (`(services)/`)

All purchase-type screens end in the shared **summary, PIN/biometric, result** path (section 8).

| Route | Service | Inputs | Lookups | Notes |
|---|---|---|---|---|
| `buy-airtime` | Airtime | Network, phone (contacts / beneficiaries / manual), airtime type, amount (min ₦50, quick amounts) | `/get-airtime-networks`, `/get-airtime-type` | MTN pre-selected; no network-from-prefix check |
| `buy-data` | Data | Network, phone, data type, plan | `/get-data-networks`, `/get-data-types/{n}`, `/get-data-plans/{n}/{t}` | Tapping a plan goes straight to the summary |
| `buy-airtime-pin` | Airtime voucher PINs | Network, PIN size, quantity, business name | `/get-airtime-networks`, `/get-pin-sizes` | Result screen prints PINs |
| `buy-data-pin` | Data voucher PINs | Network, type, plan, quantity, business name | `/get-data-networks`, `/get-datapin-types/{n}`, `/get-data-plans/{n}/{t}` | |
| `cable-tv` | Cable TV | Provider, smartcard (>= 10 chars, **Verify** step), plan | `/get-cable`, `/get-cable-plan/{p}`, `/validate-cable` | Plans dim until verified |
| `electricity` | Electricity | Provider, prepaid/postpaid, meter (**Verify**), amount | `/get-electricity`, `/validate-electricity` | Success shows the token (`response.token`) |
| `education` | Exam PINs (WAEC etc.) | Exam type, quantity | `/get-exam-types` | Total = price x quantity |
| `bulk-order` | Bulk data / airtime | Type, network, list of numbers, plan or amount | networks, types, plans | No Continue button: auto-navigates |
| `bulk-sms` | Bulk SMS | Sender ID (max 11), subject, numbers, message | `/charge-per-sms` | Cost = recipients x ceil(chars/160) x rate |
| `schedule-transaction` | Scheduled data / airtime | Type, one number, date, frequency, plan or amount | networks, types, plans | Date only; sends `fullDateTime` |
| `airtime-swap` | Airtime to cash | Network, amount, sender number; **auto**: OTP then PIN; **manual**: instructions then WhatsApp | `/a2c-method`, `/swap-details`, `/airtime2cash/otp`, `/airtime2cash/verify`, `/swap-airtime` | Manual path never calls the API |
| `funds-transfer` | Wallet to bank | Bank, 10-digit account (auto-resolves name), amount | `/get-banks`, `/get-transfer-charge`, `/validate-account` | Fee differs for bank code `001` |
| `funds-transfer-summary` | Confirm + real PIN or biometric | | `POST /fund-transfer` | Source: wallet or cashback |
| `sales-analysis` | Sales report | Period chips or custom range | `GET /user/sales` | |
| `pricing` | Read-only price lists | none | cached `/pricing`, `/charge-per-sms` | |
| `transaction-summary` | Shared confirm screen | | `POST /purchase`, `POST /bulk/purchase` | Refreshes `user` on mount; blocks if balance is insufficient |
| `transaction-success` | Receipt + share as image | | none | Shows token / PINs where available |
| `transaction-failed` | Failure + retry | | none | Says "will be refunded" unconditionally |

## 5. Wallet funding

`fund-wallet` lists the enabled methods from `/payment-settings` and routes to one of:

| Route | Status | Flow |
|---|---|---|
| `(fund-wallet)/auto-funding` | Live | Lists virtual accounts (`status: On`). If none exists and KYC is not verified, routes to KYC; otherwise **Generate** (`POST /generate-account`). User transfers to the account, and the server credits it |
| `(fund-wallet)/manual-funding` | Live | Amount, bank account, method (Transfer / POS / ATM / USSD), then `POST /manual-payment`. Admin approves within about 24 h |
| `(fund-wallet)/onetime-account` | Live | `POST /generate-account` for a temporary account. Number kept in component state only (lost on leaving) |
| `(fund-wallet)/card-payment` | Live | Amount >= 100, `POST /card-payment`, then the WebView |
| `(fund-wallet)/payment-webview` | Live | Gateway page in `react-native-webview`. Success/failure inferred from URL text. Cancel confirmation modal |
| `(fund-wallet)/coupon-payment` | Live | `POST /coupon-payment`, then refresh user |
| `(fund-wallet)/payment-success` | Dead | Static "wallet funded" screen |
| `(fund-wallet)/bank-transfer` | Dead | Hard-coded fake bank account |
| `(fund-wallet)/ussd-payment` | Dead | Hard-coded USSD codes |

## 6. Profile and account

| Route | Purpose | Calls | Notes |
|---|---|---|---|
| `(profile)/personal` | Shows name, email, phone | none | Inputs are editable but **nothing saves** |
| `(profile)/kyc` | Submit ID: surname, DOB (custom picker), phone, email, ID type (only "NIN"), ID number, state, city, address, one photo | `POST /kyc/submit` | Library picker only; validation is non-empty only |
| `(profile)/upgrade` | Account levels with price and affordability | `GET /get-levels`, `POST /upgrade-level` | No PIN; sends level name |
| `(profile)/security` | Menu to the `(security)` screens | none | |
| `(profile)/support` | Social/support tiles from the API, FAQs, Live Chat entry | `GET /support` | Icon map matches names containing "x" |
| `(profile)/terminate-account` | Reason, confirm modal with password | `POST /user/delete` | Reason not sent; does not clear local data |
| `(profile)/about`, `privacy-policy`, `terms-conditions` | Static content | none | |
| `(profile)/referral` | Referral list | `GET /referral` | Hidden; tapping a row crashes |
| `(profile)/dashboard-selector` | Pick a dashboard style | none | Hidden |
| `(profile)/history`, `payment`, `notifications` | Mock or stub | none | Hidden, dead |

## 7. Security and support

| Route | Purpose | Calls | Notes |
|---|---|---|---|
| `(security)/change-pin` | Password + new 5-digit PIN + confirm | `POST /change-pin` | Live. Updates the biometric copy of the PIN |
| `(security)/change-password` | Old / new / confirm password | **none** | Stub: shows "Password changed" |
| `(security)/reset-pin` | Reset PIN | **none** | Stub, expects 4 digits |
| `(security)/biometric-settings` | Enable/disable biometric **payments** | none | Stores the PIN in SecureStore |
| `(security)/biometric-login` | Enable biometric or PIN **login** (mutually exclusive) | `POST /login` (to verify password) | Stores email + password in SecureStore |
| `(support)/faqs` | Static FAQs | none | |
| `(support)/live-chat` | Chat with admin, optional image | `/get-message-id`, `/messages/{id}` (poll 5 s), `/reply/{id}` | |
| `transaction-details` | Receipt: fields, PNG/PDF download and share, Resend, print PINs | `/get-transaction-details/{ref}`, `/resend-transaction`, `/pins/{ref}` | |

## 8. Core flows

### Purchase (airtime / data / cable / electricity / exam / SMS / bulk / schedule)

```
Service screen -> validate inputs -> transaction-summary
   refresh user; block if balance < amount ("Add Money" -> fund-wallet)
   Confirm dialog  (or biometric)      <- TODAY: no PIN entered, "12345" sent
   POST /purchase | /bulk/purchase
      success -> update user/balance -> transaction-success (receipt, share)
      error   -> transaction-failed   (Try Again = back)
```

### Wallet funding

```
Home / summary / profile -> fund-wallet -> method screen
   auto:    generate/copy virtual account -> user pays via bank -> server credits
   card:    POST /card-payment -> WebView -> (URL guess) -> home -> refreshUser
   manual:  POST /manual-payment -> admin approval
   coupon:  POST /coupon-payment -> refreshUser
```

### Authentication and lock

```
signup/login -> token + user saved -> home
cold start / auto-lock -> splash -> biometric | PIN | welcome-back | login
401 anywhere -> "session expired" -> same routing
logout -> clears token only (see rebuild-notes)
```

### Bank transfer

```
funds-transfer: pick bank -> enter 10-digit account -> /validate-account (name)
  -> amount + fee -> funds-transfer-summary -> real PIN or biometric -> /fund-transfer
```

## 9. Screen state conventions worth keeping

- Every list screen should have **loading, empty, error+retry and refreshing** states. Only some have them today.
- Pull-to-refresh exists on Home and History; keep and extend.
- Balance hide/show persists across launches (`balanceVisible`).
- Toasts for feedback (`showToast('success'|'error', message)`). The current toast is a full-screen `Modal`, which blocks touches on Android and competes with other modals on iOS, so use a non-modal overlay.
- Beneficiaries: suggested while typing, with a saved-list tab (`topup | cable | electricity`).
