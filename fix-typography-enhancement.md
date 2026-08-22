# Fix: Typography Upgrade for Salon/Spa Booking App

## What's wrong right now

Looking at your screens (Good evening / Search Salons / salon cards), the app is currently using the **system default font** (Roboto on Android) at fairly generic weights. For a luxury salon/spa booking product, this reads flat and utilitarian — it doesn't match the premium warm-cream + gold-accent visual direction you've already established with color. Typography is currently just "delivering text" instead of carrying the brand's personality.

Specific issues visible in the screenshots:
- "Good evening" / "Search Salons" headlines use a plain sans-serif at a weight that doesn't feel premium or distinctive.
- Eyebrow labels ("STUDIO DISCOVERY", "FEATURED PARTNERS", "SEARCH & EXPLORE") are the right idea (small caps, accent color) but need tighter letter-spacing and a lighter/lower size to read as refined rather than just "bold small text."
- Salon name titles ("Sahu Salon", "Naturals") and body/meta text (ratings, location count) all share the same typeface with little contrast in personality, so the hierarchy relies entirely on size/color, not typographic character.

## Recommended font pairing

For a luxury salon/spa brand, pair a **characterful serif display face** (for headlines, salon names, hero moments) with a **clean, warm-neutral sans-serif** (for body copy, UI labels, buttons). This is a classic premium-beauty-brand pairing — think high-end spa/hotel branding, not tech-app defaults.

### Option A (recommended) — warm & editorial
- **Display:** `Fraunces` (variable, supports soft/opsz axes for an elegant, slightly quirky serif) — use for "Good evening," salon names, section headlines.
- **Body/UI:** `Inter` or `Public Sans` — use for body copy, buttons, nav labels, meta text (ratings, price).

### Option B — classic luxury
- **Display:** `Playfair Display` — crisp, high-contrast serif, very "premium spa brochure."
- **Body/UI:** `Manrope` — clean geometric sans with a bit of warmth, pairs well against a serif without competing.

### Option C — softer, more approachable
- **Display:** `Newsreader` (italic style available — nice for "Good evening" greeting-style headlines)
- **Body/UI:** `General Sans` or `Inter`

Pick **Option A** if you want the most distinctive/least generic-feeling result — `Fraunces` is much less commonly used in apps than `Playfair Display`, so it'll feel more custom to your brand.

## Type scale to apply

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Eyebrow label (e.g. "STUDIO DISCOVERY") | Body font | 11–12px | 600 (semibold) | Uppercase, letter-spacing +1.2px, accent color |
| Greeting/page headline ("Good evening", "Search Salons") | Display font | 28–32px | 600 | Tight line-height (1.05–1.1) |
| Subheadline ("Find and book top luxury salons...") | Body font | 14–15px | 400 | Muted color, normal spacing |
| Salon/card name ("Sahu Salon") | Display font | 17–18px | 600 | Not italic — reserve italic for hero moments only |
| Card meta (category, "Hair · Skin · Spa") | Body font | 13px | 400–500 | Muted color |
| Rating/price/button text | Body font | 13–14px | 600 | Keep numerals tabular if available |
| Nav bar labels | Body font | 11–12px | 500 | Keep short and consistent |

## Implementation in Expo

### 1. Install the Google Fonts packages
```bash
npx expo install @expo-google-fonts/fraunces @expo-google-fonts/inter expo-font
```
(swap package names if you choose Option B or C — e.g. `@expo-google-fonts/playfair-display`, `@expo-google-fonts/manrope`)

### 2. Load fonts at app root
```js
import { useFonts, Fraunces_600SemiBold, Fraunces_500Medium } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // rest of app
}
```

### 3. Add font family + scale tokens to `theme.js`
```js
export const FF = {
  display: "Fraunces_600SemiBold",
  displayMedium: "Fraunces_500Medium",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
};

export const FS = {
  eyebrow: 11,
  headline: 30,
  subheadline: 14,
  cardTitle: 17,
  cardMeta: 13,
  button: 14,
};
```

### 4. Apply to existing text styles
Example for the "Good evening" headline:
```js
headline: {
  fontFamily: FF.display,
  fontSize: FS.headline,
  lineHeight: FS.headline * 1.08,
  color: C.ink,
},
eyebrow: {
  fontFamily: FF.bodySemiBold,
  fontSize: FS.eyebrow,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: C.main, // your gold/terracotta accent
},
cardTitle: {
  fontFamily: FF.display,
  fontSize: FS.cardTitle,
  color: C.ink,
},
```

## Instruction for Agent
1. Install the chosen Google Fonts packages (default to Option A: `@expo-google-fonts/fraunces` + `@expo-google-fonts/inter`) and `expo-font`/`expo-splash-screen` if not already present.
2. Load the required font weights at the app root using `useFonts`, gating render until loaded, matching the pattern shown above.
3. Add `FF` (font family tokens) and update `FS` (font size tokens) in `theme.js` per the type scale table — do not remove existing tokens used elsewhere without checking usage first.
4. Update existing text styles (headline, eyebrow, subheadline, card title, card meta, button, nav label) across the app to use the new `FF`/`FS` tokens instead of default system font styles.
5. Do not change color values, layout, or spacing — this pass is typography-only.
6. After changes, rebuild is not required (fonts load via JS/config, not native changes) — test with `expo start --dev-client`.
