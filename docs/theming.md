# Theming and Design System

How the current app is themed, what tokens exist, what is hard-coded, and what a TypeScript rewrite should replace it with.

## 1. How theming works today

Two independent inputs are merged at runtime:

1. **Local light/dark mode**: a manual toggle stored in AsyncStorage (`theme`). It **ignores the OS setting** and defaults to `light`, even though `app.json` sets `userInterfaceStyle: "automatic"`.
2. **Server branding**: `GET /theme` returns `bg_color`, `text_color`, `button_color` and `style`. It is cached in SecureStore (`user_theme_data`) and applied on top.

```
Colors[light|dark]  (constants/theme.js)
   + server theme (bgColor -> primary, buttonColor, textColor)  (dashboard-context)
   = useTheme().colors      (contexts/theme-context.jsx)
```

`ThemeProvider` reads `useDashboard()`, so **`DashboardProvider` must sit above `ThemeProvider`** (it does, in `app/_layout.jsx`).

### What `useTheme()` returns

```ts
{
  colors: {
    ...Colors[scheme],        // see palette below
    primary,                  // overridden by server bg_color when present
    buttonColor,              // server button_color
    apiTextColor,             // server text_color, default '#ffffff'
    isDark
  },
  fonts: Fonts,
  isDark, colorScheme,        // 'light' | 'dark'
  toggleTheme()
}
```

`hooks/use-api-colors.js` is a second, overlapping way to get the same server colours (`primary`, `button`, `primaryText`). Three colour sources exist (`useTheme`, `useApiColors`, `constants/theme.js`), and the rewrite should have one.

## 2. Palette (`constants/theme.js`)

| Token | Light | Dark |
|---|---|---|
| `text` | `#11181C` | `#ECEDEE` |
| `background` | `#fff` | `#0f0f0f` |
| `tint` | `#2196F3` | `#64B5F6` |
| `primary` | `#2196F3` | `#64B5F6` |
| `secondary` | `#BBDEFB` | `#1976D2` |
| `accent` | `#1976D2` | `#90CAF9` |
| `icon` | `#687076` | `#9BA1A6` |
| `tabIconDefault` | `#687076` | `#9BA1A6` |
| `tabIconSelected` | `#2196F3` | `#64B5F6` |
| `success` | `#4CAF50` | `#66BB6A` |
| `error` | `#F44336` | `#EF5350` |
| `warning` | `#FF9800` | `#FFA726` |

### Server-driven values

| Server field | Default | Becomes |
|---|---|---|
| `bg_color` | `#002db3` | `colors.primary` (both light and dark) |
| `button_color` | `#002db3` | `colors.buttonColor` |
| `text_color` | `#ffffff` | `colors.apiTextColor` (text on primary surfaces) |
| `style` | `default` | dashboard variant (see section 5) |

## 3. Typography

- Font family: **Inter** via `@expo-google-fonts/inter`. Loaded in `app/_layout.jsx`; the app renders nothing until fonts load.
- Weights: `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`, exposed as `fonts.inter.{regular,medium,semiBold,bold}`.
- Sizes are hard-coded per screen. Common values seen: 11 (tab label, service name), 13 (input text), 14 (label), 16 (button, section title), 22 (screen title).
- Several screens compute a `scale` (0.7 on small screens) from `Dimensions.get('window')` at module load. It does not update on rotation and can make text 8-10 px.

## 4. Component primitives (`components/ui/`)

| Component | Spec |
|---|---|
| `Button` | Height 56, radius 16, label 16 / Inter SemiBold. Variants: `primary` (bg `primary`, white text), `secondary` (bg `secondary`, text `primary`), `outline` (transparent, 1px `primary` border). No loading or disabled state |
| `Input` | Height 56, radius 16, horizontal padding 16, text 16. Background `#1f1f1f` (dark) / `#f5f5f5` (light). Optional label (14 / Medium) and right icon slot. **Only forwards** `placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, editable, maxLength`, so `multiline` and `numberOfLines` are dropped |
| `Card` | Radius 16, padding 20, background `#1f1f1f` / `#f5f5f5`, shadow (0,2) opacity 0.1 radius 8, elevation 3 |
| `LoadingOverlay`, `HomeSkeleton`, `BannerCarousel`, `DatePicker` | Also in `components/ui/` |

Recurring surface colours that are **hard-coded outside the token file**: `#1f1f1f` / `#f5f5f5` (card and input surfaces), `#2a2a2a` / `#e5e5e5` (tab-bar border), `#000066` and `#002db3` (brand blues on dashboards), `#fff`. These should become tokens (`surface`, `surfaceAlt`, `border`, `brand`).

### Service colours (Services tab)

| Service | Colour |
|---|---|
| Data | `#2196F3` |
| Airtime | `#4CAF50` |
| Data Pin | `#009688` |
| Airtime Pin | `#E91E63` |
| Cable TV | `#FF9800` |
| Electricity | `#F44336` |
| Education | `#FF5722` |
| Bulk Order | `#795548` |
| Bulk SMS | `#00BCD4` |
| Schedule | `#9C27B0` |
| Airtime Swap | `#3F51B5` |
| Sales Analysis | `#00897B` |
| Pricing | `#607D8B` |

Icon badges use the service colour at 12% alpha (`color + '20'`). Icons are Ionicons.

Payment-method colours (funding): Auto `#10B981`, Manual `#3B82F6`, One-time `#F59E0B`, Card `#8B5CF6`, Coupon `#EC4899`.

### Layout constants seen

- Screen horizontal padding: 20 (Services header, search) and 14 + 1.3% margins (service grid).
- Radius scale in use: 10 (search, service card), 16 (button, input, card), 22 (icon circle).
- Tab bar: height 65, padding 10, 1px top border, elevation 8, labels 11 / SemiBold, icons 24 (filled when focused, outline otherwise).
- Service grid: 3 columns (`width: 30%`).

## 5. Dashboard variants

Five home layouts, chosen by the server `style` field or the local preference (`user_dashboard_preference` in SecureStore):

| Key | Label | Icon | Description |
|---|---|---|---|
| `default` | Default | `grid-outline` | Balanced design with all features |
| `modern` | Modern | `sparkles-outline` | Sleek and contemporary layout |
| `classic` | Classic | `albums-outline` | Traditional and familiar design |
| `compact` | Compact | `phone-portrait-outline` | Space-efficient compact layout |
| `minimal` | Minimal | `remove-outline` | Clean and simple interface |

⚠️ Behaviour to be aware of: the server `style` **overwrites the saved choice on every launch**, and the selector screen (`dashboard-selector.jsx`) is currently unreachable (its Profile menu entry is commented out). Decide whether the user or the server owns this before rebuilding.

⚠️ The five components each copy the same helpers (`getServiceIcon`, `formatDate`, `truncateText`, transaction mapper, balance toggle, refresh handler) and have drifted (icon maps differ, truncation is 45 vs 50 characters, Modern hard-codes `#000066`, and its fallback name is "Mubarak").

## 6. Known theming defects (do not carry over)

1. **Missing tokens.** `colors.textSecondary`, `colors.card` and `colors.border` are used in about 12 files but do not exist. Text renders in the default colour, so it is invisible in dark mode.
2. **Server colour breaks dark mode.** `bg_color` replaces `primary` in both modes, so a dark brand colour on `#0f0f0f` gives poor contrast for primary text and icons.
3. **Alpha by string concat.** `colors.primary + '20'` only works for 6-digit hex. It breaks for 3-digit hex, `rgb()` or 8-digit values from the API.
4. **System scheme ignored**, with a flash of light theme before the saved value loads.
5. **`theme` object rebuilt on every render** with no memoisation, so every consumer re-renders whenever the provider does.
6. Three colour sources and dozens of hard-coded hex values (see above).

## 7. Recommended structure for the TypeScript rewrite

```
src/theme/
  tokens.ts          // raw palette, spacing, radius, typography scales
  light.ts, dark.ts  // semantic tokens, same keys in both
  ThemeProvider.tsx  // scheme = user override ?? system; brand overlay; useMemo'd value
  useTheme.ts
```

Semantic token set (superset of what the app really uses):

```ts
export type ThemeColors = {
  background: string; surface: string; surfaceAlt: string; border: string;
  text: string; textSecondary: string; textOnPrimary: string;
  primary: string; primaryPressed: string; secondary: string; accent: string;
  button: string; icon: string;
  success: string; error: string; warning: string; info: string;
  tabActive: string; tabInactive: string;
  overlay: string;
};
export type Theme = {
  colors: ThemeColors;
  fonts: { regular: string; medium: string; semiBold: string; bold: string };
  spacing: { xs: 4; sm: 8; md: 12; lg: 16; xl: 20; xxl: 24 };
  radius: { sm: 10; md: 16; pill: 999 };
  isDark: boolean;
};
```

Rules to adopt:

- **Validate the server brand colour** (parse hex, check contrast against `textOnPrimary`, fall back to defaults) before applying it. Never concatenate alpha onto a string. Use a `withAlpha(color, a)` helper.
- **Follow the OS scheme by default** (`useColorScheme`), with light / dark / system as the user's override. Persist it and do not render until it has loaded (or use the splash) to avoid the flash.
- **One dashboard layout with slots** (or five thin variants over shared hooks and components) instead of five copies.
- Memoise the theme value, and derive it in one place.
- Build `Button`, `Input`, `Card` on the tokens and add loading, disabled, error and multiline support, `accessibilityRole` / `accessibilityLabel`, and visible focus and pressed states.
- Keep the Inter weights and the service colour map, moved into `tokens.ts`.
