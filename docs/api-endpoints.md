# API Endpoints

Reference for every backend call the current app makes. Extracted from `services/api.js` and the contexts. The backend is a Laravel API (it returns `"Unauthenticated."` and Laravel paginator fields), and no OpenAPI spec exists.

> **Confidence note.** Request bodies are exact (read from code). Response shapes are only what the client reads, so treat them as *observed fields*, not a contract. Confirm against the backend (or capture real responses) before typing them in the rewrite. Items marked ⚠️ are ambiguous or risky.

## 1. Transport

| Item | Current behaviour |
|---|---|
| Base URL | `https://ulamadata.ng/app` (hard-coded in `services/api.js:4`) |
| Asset host | `https://ulamadata.ng` (banner image paths are relative to this) |
| Auth | `Authorization: Bearer <token>`, token read from storage on each request |
| Content type | JSON by default, `multipart/form-data` for uploads |
| Timeout | **None** (axios default = wait forever) |
| Retry / cancel | None |
| Success unwrapping | Interceptor returns `response.data`, so callers never see the axios envelope |
| Error shape | Thrown as `{ status, message, data }`. Network failure is `{ status: 0, message: 'Network error. Please check your connection.' }` |

### Failure is signalled three different ways

The backend does not use one convention, so the client checks all of these:

1. HTTP status 401.
2. HTTP 200 with body `{ status: 401 }` or `{ message: 'Unauthenticated.' }` (also `data.message`). The interceptor treats this as a 401 and fires the unauthorised callback.
3. HTTP 200 with `{ status: 'fail' | 'error' }` on purchase-type calls, which the client converts to a thrown error. Some airtime-swap calls use `status: false` or `'failed'`.

On success, mutating endpoints usually return `{ status: 'success', message }`. Read endpoints return the data directly (an array or object) with no wrapper.

**Rewrite recommendation:** one typed `ApiError` and one `normalizeResponse()` at the boundary, so screens never check `status === 'fail'` themselves.

### 401 handling
`setUnauthorizedCallback` is registered by the auth context. It is re-entry guarded (3 s), clears the token, shows a "Session expired" toast and routes to biometric-auth, pin-auth, welcome-back or login. ⚠️ It also fires for a wrong password on `/login` if the server answers 401. Exclude auth endpoints from it.

## 2. Auth and account

| Method | Path | Request | Response fields used | Used by |
|---|---|---|---|---|
| POST | `/register` | `name, surname, phone, email, password, password_confirmation, accesspin, refer_by?` | `token`, `user` | signup |
| POST | `/login` | `email, password` | `token`, `user` | login, biometric-auth, pin-auth, welcome-back |
| GET | `/get-user` | none | User object directly: `id, name, surname, email, phone, wallet, cashback, KycStatus, type, referral_code, maxTrans, totalTransactions`. Client maps `wallet` → `balance` | Home focus, summary, refresh |
| POST | `/change-pin` | `password, newPin` | `status`, `message` | change-pin |
| POST | `/kyc/submit` | multipart: `surname, dob, phone, email, idType, idNumber, state, city, address, image` | `status`, `message`, `user?` | kyc |
| GET | `/get-levels` | none | `{ levels: [{ id, name, price }] }` | upgrade |
| POST | `/upgrade-level` | `level` (level **name**, not id) | `status`, `message`, `user?` | upgrade |
| GET | `/referral` | none | `refer_code`, `referral_link`, `total_referrals` or `count`, `earnings`, `referrals[]` | referral, earn |
| POST | `/withdraw-cashback` | `amount` (string), `pin` | `status`, `message`, `cashback`, `wallet` | earn |
| POST | `/user/delete` | `password` | `status`, `message` (server says "deactivated") | terminate-account |
| POST | `/save-push-token` | `user_id, push_token` (URL is absolute in code) | none used | notification-context |

⚠️ **Not present anywhere:** forgot-password, change-password, reset-pin, logout, token refresh, profile update. The screens for the first three exist but make no API call (see `pages.md`). The rewrite needs backend endpoints for these, or the screens must be removed.

## 3. App configuration (pre-login)

Fetched at app start, before the user has logged in.

| Method | Path | Response fields used | Used by |
|---|---|---|---|
| GET | `/theme` | `style`, `bg_color`, `text_color`, `button_color`, `app_version`, `force_update`, `android_app_url`, `ios_app_url` (also read camelCase variants) | dashboard-context (theme + forced update) |
| GET | `/banner` | `status`, `ads1`, `ads2`, `ads3` (relative image paths) | banner-context |
| GET | `/get-notification` | Array, or `{ data }` / `{ notifications }`. Item: `id?`, `msgfor` (`popup` \| `scroll` \| `scrolll`), `subject`, `msg`/`message`/`content`, `image`, `button_url` | dashboard-context (popup + scrolling text) |
| GET | `/support` | `{ socialMedia: [{ name, link }], ... }` | support, home WhatsApp button |
| GET | `/pricing` | `networks, airtimes, dataPlans, cableProviders, cablePlans, electricityTokens, examPins, airtimePinPlans, dataPinPlans, bulkSMSPricing`. Items carry `status: 'On'/'Off'` | pricing screen, services-context (cached 5 min) |

`/theme` semantics: `style` is one of `default | modern | classic | compact | minimal` and **overwrites the user's saved dashboard on every launch** (⚠️ see `theming.md`). Force update triggers when `app_version` is greater than the installed `expo-constants` version.

## 4. Purchases

All purchases are `POST /purchase` with a `service` discriminator. Bulk and scheduled purchases use `POST /bulk/purchase`.

**Every request carries `pin`. Today the client sends the literal `"12345"` for standard purchases** (`transaction-summary.jsx`). The rewrite must send the user's real transaction PIN, or the backend contract must be clarified (see `rebuild-notes.md`).

| `service` | Fields (besides `pin`, `service`) |
|---|---|
| `data` | `network, type, plan, phone, amount` |
| `airtime` | `network, type, amount, phone` |
| `datapin` | `network, type, plan, quantity (string), amount (string), businessname` |
| `airtimepin` | `network, pinSize, amount (string), quantity (string), businessName` (⚠️ note the casing differs from `businessname` above) |
| `cable` | `provider, plan` (plan **name**, e.g. `"GOtv Smallie - monthly N1900"`), `icu` (smartcard number), `price`, `amount` |
| `electricity` | `provider, type (prepaid/postpaid), meter, amount, phone` |
| `exam` | `plan, quantity, amount, examType` |
| `sms` | `sender, subject, message, amount, bulkPhones` (comma-separated) |

`POST /bulk/purchase`:

| Kind | Fields |
|---|---|
| Bulk data | `network, type, plan, amount, bulkPhones, pin, sType: "bulk", service: "Data"` |
| Bulk airtime | `network, type, amount, bulkPhones, pin, sType: "bulk", service: "Airtime"` |
| Scheduled data | as bulk data with `sType: "schedule"`, plus `repeat, fullDateTime`, and `bulkPhones` holds a single number |
| Scheduled airtime | as bulk airtime with `sType: "schedule"`, plus `repeat, fullDateTime` |

Note `service` is lower-case on `/purchase` and Capitalised on `/bulk/purchase`.

**Response fields the client reads after success:** `user`, `new_balance`, `balance`, `token` (electricity), `pin`/`pins` (voucher products), `exam_name`, `api_response`. ⚠️ There is no idempotency key, no client reference and no explicit pending status. The rewrite should add a client-generated reference and a `pending` outcome (coordinate with backend).

### Lookup endpoints used before a purchase

| Method | Path | Notes |
|---|---|---|
| GET | `/get-data-networks` | Filter `status === 'On' && data === 'On'` |
| GET | `/get-data-types/{network}` | |
| GET | `/get-data-plans/{network}/{type}` | Filter `status === 'On'`. Also used by data-pin. ⚠️ path segments are not URL-encoded |
| GET | `/get-datapin-types/{network}` | |
| GET | `/get-airtime-networks` | Filter `status === 'On' && airtime === 'On'`. Also used by airtime-pin and swap |
| POST | `/get-airtime-type` | Body is a payload built by the screen (network). ⚠️ a POST used as a read |
| GET | `/get-pin-sizes?network={lowercase}` | Airtime-pin sizes |
| GET | `/get-cable` | Providers |
| GET | `/get-cable-plan/{provider}` | |
| POST | `/validate-cable` | `provider, icu` → customer name |
| GET | `/get-electricity` | Providers (discos) |
| POST | `/validate-electricity` | `provider, type, meter` → customer name/address |
| GET | `/get-exam-types` | |
| GET | `/charge-per-sms` | Bulk SMS unit price |

## 5. Airtime to cash (swap)

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/a2c-method` | none | Decides whether the screen runs the auto or manual flow (inferred, verify the exact field) |
| GET | `/swap-details?network={n}` | none | Per-network swap info shown on the screen, including `admin_phone` for the WhatsApp link (inferred, verify) |
| POST | `/airtime2cash/otp` | `network (string), senderNumber` | Failure = `status` false/`'error'`/`'failed'` |
| POST | `/airtime2cash/verify` | `network, senderNumber, otp` | Same failure convention |
| POST | `/swap-airtime` (auto) | `network, amount, quantity, swapMethod: "auto", senderNumber, otp, transferPin, pin` | |
| POST | `/swap-airtime` (manual) | `network, amount, quantity, swap: "manual", senderNumber, paymentMethod: "wallet", pin` | ⚠️ **Never called today**: the manual screen only opens WhatsApp. Note the key is `swap`, not `swapMethod` |

## 6. Wallet funding

| Method | Path | Request | Response fields used |
|---|---|---|---|
| GET | `/payment-settings` | none | `auto, manual, onetime, card, coupon` each `'on'`/off. Drives which methods appear |
| GET | `/get-account-details` | none | `virtual_accounts: { [type]: { status: 'On', number?, charge? } }`, `manual_accounts[]`, `kyc` |
| POST | `/generate-account` | `accountType` | `accountNumber`, plus bank/name/expiry fields for one-time accounts |
| POST | `/manual-payment` | `amount, selectedAccount, accountName, paymentMethod, date` | `status`, `message` |
| POST | `/card-payment` | `amount` | `link` (gateway URL opened in a WebView) |
| POST | `/coupon-payment` | `coupon_code` | `status: 'success'`, `message` |

The wallet is credited **server-side** (webhook or admin approval). No endpoint exists in the app to verify a card payment by reference. ⚠️ See `rebuild-notes.md`.

## 7. Bank transfer (wallet to bank)

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/get-banks` | none | Bank list. Code `'001'` = UlamaData (internal) |
| GET | `/get-transfer-charge` | none | `{ charge, charge2 }`. `charge2` applies to bank `001`, `charge` to all others |
| POST | `/validate-account` | `bank, accountNumber` | Resolves the account name (called on the 10th digit) |
| POST | `/fund-transfer` | `bank, amount, accountNumber, source ('wallet'\|'cashback'), pin` | Reads `new_balance` |

## 8. Transactions and receipts

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/get-transactions` | query `page`, optional `search`, `date` | Laravel paginator: `data[], current_page, last_page, total, per_page` |
| GET | `/get-transaction-details/{ref}` | optional `?date=` | Transaction object (see below) |
| GET | `/download-transactions` | optional `search`, `from`, `to` | **Array** of transactions (used to build the PDF export) |
| GET | `/pins/{pinRef}` | none | Voucher PINs for the print modal |
| POST | `/resend-transaction` | `transref, pin` | ⚠️ sent with literal `"12345"` today, and shown for every status |

Observed transaction fields: `id`, `tId`, `ref`/`transactionRef`, `servicename`, `servicedesc`, `amount`, `status`, `date`, `time`, `oldbal`, `newbal`, `profit`, `customerName`, `type`, `plan`, `api_response`. Status strings seen: `Completed`, `Failed`, `Refund`, `Processing`/`Pending`. ⚠️ `date` is used both as a display string and as an API parameter. The rewrite must keep the raw server date separate from display formatting.

## 9. Beneficiaries

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/get-beneficiaries` | none | Items `{ id, phone, name, type }` where `type` is `topup`, `cable` or `electricity`. Network is derived client-side from the number prefix |
| POST | `/add-beneficiary` | `name, phone, type` | `status: 'success'` |
| DELETE | `/delete-beneficiary/{phone}` | none | |

## 10. Support and chat

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/get-message-id` | none | Returns the conversation id directly |
| GET | `/messages/{id}` | none | Array `{ id, reply, replyby ('ADMIN' or user), created_at, image_url }`. Polled every 5 s |
| POST | `/reply/{id}` | `replyContent`, or multipart `replyContent` + `image` | Reads `success` (⚠️ different key from `status`) |

## 11. Analytics

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/user/sales` | `period` (a preset id), or `from`+`to` as `YYYY-MM-DD` for custom | Returns per-service totals |

## 12. Third-party calls

| Target | Purpose |
|---|---|
| `https://exp.host/--/api/v2/push/send` | A test helper in `notification-service.js:108`. Should not ship |
| Card gateway URL from `/card-payment` | Opened in `react-native-webview`. Provider appears to be Monnify (the WebView filters on "monnify") |

## 13. Suggested typed client structure for the rewrite

```
src/api/
  client.ts          // axios instance, timeout, interceptors, ApiError
  types.ts           // User, Transaction, Plan, Provider, PaymentSettings ...
  auth.ts            // register, login, getUser, changePin, deleteAccount
  config.ts          // getTheme, getBanners, getNotifications, getSupport, getPricing
  purchase.ts        // purchase(kind, payload) with a discriminated union per service
  lookups.ts         // networks, plans, providers, validate*
  wallet.ts          // payment settings, accounts, card, coupon, manual, bank transfer
  transactions.ts    // list, details, download, pins, resend
  support.ts         // chat + beneficiaries
```

Model `purchase()` as a discriminated union on `service` so the field-name inconsistencies above (`businessname` vs `businessName`, `swap` vs `swapMethod`, `Data` vs `data`) are captured once in types and never leak into screens.
