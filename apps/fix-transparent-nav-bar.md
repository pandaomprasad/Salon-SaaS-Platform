# Fix: Transparent Android System Navigation Bar Overlapping Bottom Tab Bar

## What's happening

Modern Expo/Android (SDK 52+ with edge-to-edge enabled by default) draws your app **behind** the system navigation bar. The system nav bar itself becomes transparent/translucent, and your app's UI is expected to add its own padding to avoid being covered by it.

Right now your bottom tab bar (Home / Search / Visits / Profile) has no bottom padding accounting for this, so:
- On **3-button navigation** devices: the nav bar buttons sit directly on top of/overlapping your tab bar content (what you're seeing in the screenshot).
- On **gesture navigation** devices: there's just a thin gesture indicator line at the bottom instead of buttons, with a smaller inset — your tab bar would sit a bit closer to the bottom edge, with less wasted space, but still needs the correct inset or content will feel cramped right at the edge.

## The fix

### 1. Configure the Android navigation bar properly in `app.json`
```json
{
  "expo": {
    "androidNavigationBar": {
      "visible": "sticky-immersive",
      "backgroundColor": "#00000000"
    },
    "android": {
      "navigationBarColor": "#00000000"
    }
  }
}
```
This keeps edge-to-edge enabled (recommended by Google) rather than forcing an opaque bar, but your own UI must add the safe padding — see step 2.

### 2. Add bottom safe-area padding to the tab bar component itself

Find the bottom navigation/tab bar component (the one rendering Home/Search/Visits/Profile) and wrap its padding with `useSafeAreaInsets`:

```js
import { useSafeAreaInsets } from "react-native-safe-area-context";

function BottomTabBar() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        { paddingBottom: Math.max(insets.bottom, 12) }, // 12 = minimum breathing room
      ]}
    >
      {/* Home, Search, Visits, Profile items */}
    </View>
  );
}
```

Do **not** hardcode a fixed padding value (e.g. `paddingBottom: 20`) — this looks fine on one device type and wrong on the other. `insets.bottom` automatically returns:
- A **larger value** (~24–48dp) on 3-button navigation devices, since it accounts for the button bar height.
- A **smaller value** (~16–24dp) on gesture-navigation devices, since only the thin gesture indicator needs clearance.

### 3. Give the tab bar an opaque background, not transparent
Looking at your screenshot, the tab bar itself appears to have a semi-transparent/dark background that blends into the photo behind it. Set an explicit solid background:
```js
tabBar: {
  backgroundColor: C.surface, // or whatever solid color matches your design system
  borderTopLeftRadius: R.xl,
  borderTopRightRadius: R.xl,
  paddingTop: 10,
}
```
This stops content behind the tab bar (like the photo) from showing through.

### 4. If using Expo Router's built-in `<Tabs>` instead of a custom bar
If Home/Search/Visits/Profile are rendered via `expo-router`'s `Tabs` navigator rather than a custom component, set this in the `Tabs` screen options instead:
```js
<Tabs
  screenOptions={{
    tabBarStyle: {
      backgroundColor: C.surface,
      paddingBottom: undefined, // let safe area context handle it automatically
    },
  }}
/>
```
`expo-router`'s Tabs already respects safe area insets automatically in recent versions — if it's still overlapping, confirm `react-native-safe-area-context` is installed and the app root is wrapped in `<SafeAreaProvider>`.

## What it will look like after the fix

- **3-button nav devices:** tab bar has extra bottom padding so Home/Search/Visits/Profile sit clearly above the button row, with a solid background so the nav buttons don't appear to float on top of your photo/content.
- **Gesture nav devices:** tab bar sits closer to the bottom edge with a smaller safe padding — just enough clearance above the gesture indicator line, without a big empty gap.

## Instruction for Agent
1. Locate the bottom tab bar / navigation component that renders Home, Search, Visits, Profile.
2. Add `useSafeAreaInsets()` and apply `paddingBottom: Math.max(insets.bottom, 12)` to its outer container style.
3. Set an explicit opaque `backgroundColor` on that container (use the existing theme surface color from `theme.js`, do not invent a new color).
4. Add `androidNavigationBar` and `android.navigationBarColor` settings to `app.json` as shown above.
5. If the tab bar is implemented via `expo-router`'s `<Tabs>`, apply the equivalent `tabBarStyle` changes instead of assuming a custom component exists — check the file structure first.
6. Do not change unrelated layout, icons, or colors of the tab bar besides background/padding.
7. Rebuild is required only if `app.json` android settings changed (native config) — remind the user to run `eas build` in that case; pure component/style changes can be tested with `expo start --dev-client` on the existing build.
