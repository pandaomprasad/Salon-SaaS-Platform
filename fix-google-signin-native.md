# Fix: Replace browser-based Google OAuth with native Google Sign-In SDK

## Why the previous fix didn't work

The error confirmed:
```
Error 400: invalid_request
Request details: redirect_uri=customerapp:// flowName=GeneralOAuthFlow
```

`expo-auth-session/providers/google` opens a **browser** (Chrome Custom Tab) and redirects back via a custom URL scheme (`customerapp://`). Google's current OAuth policy **blocks this browser-redirect flow ("GeneralOAuthFlow") for Android-type OAuth clients** — Android clients are only meant to be used with Google's **native Sign-In SDK**, which authenticates via Google Play Services on-device and never opens a browser or uses a redirect URI at all.

This is a known limitation of `expo-auth-session` + Android client type (see https://github.com/expo/expo/issues/32468) — no SHA-1 fingerprint or package name fix resolves it, because the flow itself is not compliant, regardless of credentials.

## The fix: use `@react-native-google-signin/google-signin`

This is Google's officially recommended native SDK, works in Expo dev builds via a config plugin, and eliminates the browser/redirect flow entirely.

### 1. Install the package
```bash
npx expo install @react-native-google-signin/google-signin
```

### 2. Add the config plugin to `app.json`
```json
{
  "expo": {
    "plugins": [
      "expo-dev-client",
      "@react-native-google-signin/google-signin",
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": true,
            "extraProguardRules": "-keep class expo.modules.kotlin.** { *; }\n-keep interface expo.modules.kotlin.** { *; }\n-dontwarn expo.modules.kotlin.**"
          }
        }
      ],
      "expo-web-browser"
    ]
  }
}
```

### 3. Rewrite `GoogleSignInModal.js` to use the native SDK

Remove all `expo-auth-session`, `Google.useAuthRequest`, `makeRedirectUri`, and `WebBrowser.maybeCompleteAuthSession()` usage.

Replace with:

```js
import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId: webClientId, // REQUIRED even for Android-only — this is what generates the idToken
  offlineAccess: false,
});

const handleGoogleOAuthPress = async () => {
  setError("");
  try {
    setLoading(true);
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken || userInfo.idToken;

    if (!idToken) {
      setError("Google sign-in completed, but no ID token was received.");
      return;
    }

    const res = await loginWithGoogle({ idToken });
    if (res.success) {
      onClose?.();
      onSuccess?.(res);
      return;
    }
    setError(res.error || "Backend authentication failed.");
  } catch (err) {
    console.error("[Google SignIn Exception]", err);
    setError("Google sign-in failed: " + (err.message || "Unknown error"));
  } finally {
    setLoading(false);
  }
};
```

> **Important:** Even for Android-only sign-in, `GoogleSignin.configure()` needs the **Web** client ID (`webClientId`), not the Android client ID. This is a Google SDK requirement — the Android client is validated automatically via package name + SHA-1 in the background; the Web client ID is what's used to generate the `idToken` your backend verifies.

### 4. Confirm your Web client exists
You already have `DEFAULT_WEB_CLIENT_ID` in the file:
```
23232568516-arksroglu4uhc0ogqm94uh3e6cbln9lv.apps.googleusercontent.com
```
Confirm this is a real **Web application** type client in Google Cloud Console (Credentials → Clients). If not, create one (no redirect URIs needed for this use case — Android SDK usage doesn't require the redirect URI field on the Web client).

### 5. Rebuild required — this is a native module
```bash
npx expo prebuild --clean
eas build --profile development --platform android
```
Install the new build (config plugins and native modules only take effect after a fresh native build, not `expo start` alone).

### 6. Test
```bash
npx expo start --dev-client
```
Tap Google sign-in — it should now show the native Google account picker (no browser tab, no "Access blocked" screen).

## Instruction for Agent
1. Install `@react-native-google-signin/google-signin` via `npx expo install`.
2. Add `"@react-native-google-signin/google-signin"` to the `plugins` array in `app.json`.
3. Rewrite `GoogleSignInModal.js`: remove all `expo-auth-session`/`expo-web-browser` OAuth logic (keep the modal UI/styles unchanged), replace with `GoogleSignin.configure()` + `GoogleSignin.signIn()` as shown above, using the existing `webClientId` constant.
4. Do not modify unrelated files. Leave `iosClientId`/`androidClientId` constants in place (still used elsewhere or for iOS/Android SDK auto-detection via `google-services.json` / `GoogleService-Info.plist` if added later).
5. After changes, remind the user a full rebuild (`eas build`) is required — this will not work with `expo start` alone since it's a native module change.
