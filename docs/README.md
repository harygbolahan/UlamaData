# UlamaData: Application Documentation

Reference documentation for the current app, written to support a from-scratch rebuild in TypeScript. It is derived from a static read of the code plus a multi-area review. Nothing was run on a device, and backend behaviour is inferred from the client.

## Index

| Doc | What it covers |
|---|---|
| [api-endpoints.md](api-endpoints.md) | Every backend endpoint, request bodies, observed response fields, error conventions |
| [theming.md](theming.md) | Palette, fonts, components, server-driven branding, dashboard variants, defects, recommended token structure |
| [pages.md](pages.md) | Every route/screen, navigation tree, cold-start routing, core flows |
| [rebuild-notes.md](rebuild-notes.md) | Requirements to keep, defects not to carry over, target architecture, build order, test plan |

## 1. What the app is

A Nigerian VTU / bill-payment mobile app ("UlamaData"). Users fund a wallet and spend it on data, airtime, cable TV, electricity, exam PINs, bulk SMS, bulk and scheduled top-ups, airtime-to-cash swaps, and bank transfers. There is a cashback and referral programme, KYC, account levels (pricing tiers) and live support chat.

- Backend: Laravel API at `https://ulamadata.ng/app`. No OpenAPI spec, no staging URL.
- Currency: Naira (₦).
- Users: consumers and resellers (bulk orders, sales analysis, voucher-PIN printing, levels).

## 2. Current stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 54 (`expo ~54.0.36`), React Native 0.81.5, React 19.1 |
| Routing | `expo-router ~6` (file-based, typed routes on) |
| Language | JavaScript (`.jsx`), a few `.tsx` template files |
| State | React Context only (11 providers), no query/cache library |
| HTTP | `axios ^1.13` with one shared instance |
| Storage | `AsyncStorage` (token, user, caches) and `expo-secure-store` (biometric credentials, theme, dashboard, banners) |
| Auth extras | `expo-local-authentication` (biometrics), custom PIN login |
| UI | Hand-rolled components, Ionicons, Inter font, `react-native-reanimated 4`, React Compiler enabled |
| Other Expo modules | contacts, image-picker, notifications, print, sharing, clipboard, web-browser, haptics, `react-native-webview`, `react-native-view-shot` |
| Build | EAS (`eas.json`: development, preview, preview-local, production) |

Identifiers: app name `UlamaData`, version `3.5.1`, scheme `ulamadata`, iOS bundle `com.ulamadatanigeria.app`, Android package `com.ulamadatanigeria.ulamadata`, EAS project `96673f18-391e-40af-9335-4f7be14a81e5`. The bundle ids differ between platforms. Keep them as-is for store continuity.

Permissions and native capabilities in use: contacts (contact picker), photo library (KYC, chat), Face ID / biometrics, push notifications, clipboard, sharing and printing. `app.json` only declares contacts and Face ID strings, so the rebuild must add photo-library and camera usage strings and the biometric plugin.

## 3. State architecture (contexts)

| Context | Responsibility | Persistence |
|---|---|---|
| `dashboard` | Selected dashboard style, server theme (`/theme`), popup + scroll notifications, forced/soft app update | SecureStore |
| `theme` | Light/dark toggle, merges server colours | AsyncStorage `theme` |
| `toast` | Toast display | none |
| `auth` | Token, user, login/register/logout, 401 handling, KYC, levels, referral, cashback withdrawal, PIN change, delete account, `refreshUser` | AsyncStorage |
| `notification` | Push permission, Expo token, save token to backend, listeners | none |
| `auto-lock` | Inactivity and background lock, warning modal, `shouldLock()` | reads AsyncStorage |
| `banner` | Home banner ads (`/banner`) | SecureStore |
| `services` | Cached `/pricing`, lookups and every purchase call | AsyncStorage (5 min) |
| `payment` | Payment settings, account details, funding calls, bank transfer calls | AsyncStorage (10 min) |
| `transactions` | Paginated history + details | AsyncStorage (5 min, page 1 only) |
| `beneficiary` | Saved numbers, client-side network detection | AsyncStorage (5 min) |

## 4. Local storage inventory

| Key | Store | Contents | Cleared on logout today? |
|---|---|---|---|
| `auth_token` | AsyncStorage | Bearer token | Yes |
| `user_data` | AsyncStorage | Full user JSON | **No** |
| `email`, `name`, `user_email`, `user_name` | AsyncStorage | Duplicated identity fields | **No** |
| `hasSeenOnboarding` | AsyncStorage | `'true'` | No (correct) |
| `theme` | AsyncStorage | `'light'` / `'dark'` | No (correct) |
| `balanceVisible` | AsyncStorage | Per-dashboard toggle | No (fine) |
| `@transactions_cache` | AsyncStorage | Page-1 transactions | **No, and not user-scoped** |
| `@beneficiaries_data`, services pricing cache, payment cache | AsyncStorage | Cached API data | **No** |
| `user_dashboard_preference`, `user_theme_data`, `banner_ads_data` | SecureStore | Dashboard style, server theme, banners | No (fine) |
| `biometric_enabled`, `transaction_pin_biometric` | SecureStore | Biometric payments flag + **stored PIN** | **No** |
| `biometric_login_enabled`, `biometric_email`, `biometric_password` | SecureStore | Biometric login flag + **plaintext account password** | **No** |
| `pin_login_enabled`, `pin_login` | SecureStore | PIN-login flag + PIN | **No** |

## 5. Runtime configuration

Auto-lock (intended): inactivity 5 min, background 5 min, warning 10 s. ⚠️ The constants in `auto-lock-context.jsx` are off by a factor of 1000 today, so the lock never triggers.
Caches: pricing 5 min, transactions 5 min, beneficiaries 5 min, payment 10 min.
Polling: live chat every 5 s.
Launch calls (before login): `/theme`, `/get-notification`, `/banner`.

## 6. Repository notes

- `services/api-usage-example.js` (breaks `tsc`), `guava-31.0.1-jre.jar`, `NOTIFICATIONS.json`, `scripts/reset-project.js`, `dist/`, and the Expo template components (`hello-wave`, `parallax-scroll-view`, `external-link`, `haptic-tab`, `themed-*`, `collapsible`, `icon-symbol*`) are leftovers and should not be migrated.
- `google-services.json` is committed. Move it to an EAS file secret and confirm the Firebase key is restricted by package and SHA-1.
- There are no tests, CI, crash reporting or error boundary.
