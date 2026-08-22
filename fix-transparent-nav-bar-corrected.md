# Corrected Fix: Transparent Nav Bar Overlap (without forcing full-screen/immersive mode)

## What went wrong with the previous fix

The earlier suggestion included:
```json
"androidNavigationBar": {
  "visible": "sticky-immersive"
}
```
`sticky-immersive` **hides the system navigation bar entirely** and puts the app into full-screen immersive mode (user has to swipe from the edge to temporarily reveal it). That's a different feature from what we actually want — we just want the nav bar to stay **visible and normal**, while the app correctly pads content above it. Remove this setting.

## Corrected `app.json`

Remove the `androidNavigationBar` block entirely, or explicitly set it to default/visible:
```json
{
  "expo": {
    "android": {
      "navigationBarColor": "#00000000"
    }
  }
}
```
Do **not** add `"androidNavigationBar": { "visible": "sticky-immersive" }` or any `visible` override — leave the nav bar in its normal always-visible state. `navigationBarColor: "#00000000"` just makes it transparent so edge-to-edge content can show through it correctly (this is standard, expected behavior on modern Android, not immersive mode).

## The actual fix is entirely in your tab bar component (no native/immersive config needed)

This is app-level, not system-level. Keep just this part from before:

```js
import { useSafeAreaInsets } from "react-native-safe-area-context";

function BottomTabBar() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: C.surface, // solid, not transparent
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {/* Home, Search, Visits, Profile items */}
    </View>
  );
}
```

This alone fixes the overlap:
- The nav bar stays visible and normal for the user (3-button or gesture) — no immersive/full-screen behavior, no swipe-to-reveal.
- `insets.bottom` gives the correct padding automatically for whichever navigation mode the device uses.
- The solid `backgroundColor` stops your photo/content from showing through behind the tab bar.

## Instruction for Agent
1. **Revert/remove** any `androidNavigationBar` config with `visible: "sticky-immersive"` from `app.json` if it was added — the nav bar must remain in its normal, always-visible state, not immersive/full-screen.
2. Keep `android.navigationBarColor` as `"#00000000"` (transparent) only — this is standard edge-to-edge behavior, not immersive mode.
3. In the bottom tab bar component, apply `useSafeAreaInsets()` for `paddingBottom` and a solid `backgroundColor` from the existing theme, as shown above.
4. Do not add any immersive-mode, full-screen, or "hide navigation bar" behavior anywhere in the app — the system nav bar should always stay visible to the user.
5. Rebuild required only if `app.json` android config changed.
