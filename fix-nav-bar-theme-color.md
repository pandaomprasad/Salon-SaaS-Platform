# Fix: Nav Bar Not Showing Theme Color (Black in Light Theme)

## Why `navigationBarColor` in `app.json` isn't working

On Android 15+ (edge-to-edge enforced), the OS **ignores `android.navigationBarColor`** once your app targets SDK 35/36. The system nav bar is forced transparent so your app's own content shows through it. You can no longer "paint" the system bar directly — you have to draw your own colored view in that exact screen area so it visually appears colored.

## The fix: draw your own bar behind the nav bar area

### 1. Install safe area context (if not already)
```bash
npx expo install react-native-safe-area-context
```

### 2. Add a themed bottom overlay at the root of the app

Find your app's root layout file (e.g. `App.js`, or `app/_layout.tsx` if using expo-router) and wrap it like this:

```js
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import { C } from "./theme"; // your existing theme colors

function RootLayout({ children }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* Themed bar painted exactly where the system nav bar sits */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: insets.bottom,
          backgroundColor: C.navBarColor, // black in light theme, see step 3
        }}
      />
    </View>
  );
}
```

`pointerEvents="none"` ensures this overlay never blocks touches meant for your actual UI underneath.

### 3. Add a theme-driven color, not a hardcoded one

In `theme.js`, add a value tied to the current theme (light/dark), not the OS's system theme:
```js
export const C = {
  // ...existing colors
  navBarColor: isLightTheme ? "#000000" : "#111111", // adjust to your design system
};
```
Use whatever variable your app already uses to track light/dark mode — this should follow *your app's* theme state, not `useColorScheme()` from React Native, since you're deciding the bar color yourself now.

### 4. Also update the icon/button color contrast (optional but important)
Since the OS still controls whether nav bar icons (back/home/recent buttons on 3-button nav) are light or dark, install:
```bash
npx expo install expo-navigation-bar
```
Then set icon style to match your background:
```js
import * as NavigationBar from "expo-navigation-bar";

useEffect(() => {
  NavigationBar.setButtonStyleAsync("light"); // light icons for dark bar background
}, []);
```
Use `"dark"` icons if your `navBarColor` is a light color, `"light"` icons if it's black/dark — otherwise the system nav buttons can become invisible against your painted bar.

### 5. Rebuild
No native rebuild needed for this — it's pure JS/component logic. Just:
```bash
npx expo start --dev-client
```

## Instruction for Agent
1. Install `react-native-safe-area-context` and `expo-navigation-bar` if not already present.
2. In the app's root layout component, add an absolutely-positioned `View` at the bottom with height `insets.bottom` (from `useSafeAreaInsets()`) and `pointerEvents="none"`, colored using a new `navBarColor` theme token.
3. Add `navBarColor` to `theme.js`, driven by the app's existing light/dark theme state (not `useColorScheme()`), defaulting to black in light theme per the user's requirement.
4. Call `NavigationBar.setButtonStyleAsync()` from `expo-navigation-bar` on app mount/theme change to keep nav bar icons visible against the new background color.
5. Remove any reliance on `android.navigationBarColor` in `app.json` for controlling this — it is ignored on Android 15+ and should not be treated as the source of truth going forward.
6. Do not modify unrelated theme tokens or layout components.
