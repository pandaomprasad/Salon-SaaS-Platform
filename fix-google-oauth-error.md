# Fix: Google Sign-In "Error 400: invalid_request / Access blocked" in Expo App

## Root Cause

`GoogleSignInModal.js` uses `expo-auth-session/providers/google` with:
1. `makeRedirectUri({ useProxy: true })` when running in Expo Go — the **Expo Auth Proxy (`auth.expo.io`) is deprecated/shut down**, and Google now rejects proxy-style / custom-scheme redirect URIs when they're associated with a **Web application** OAuth client type. This is exactly what produces "doesn't comply with Google's OAuth 2.0 policy" + `Error 400: invalid_request`.
2. `androidClientId: isExpoGo ? webClientId : androidClientId` — reusing the **Web** client ID as the Android client ID, which Google's current policy does not accept for native redirect flows.
3. Native Google Sign-In (custom scheme redirects) does **not** work reliably in Expo Go anymore — it requires a **development build** (`expo-dev-client`).

## Required Fixes

### 1. Stop using Expo Go for this feature — switch to a Dev Build
Expo Go cannot register a real custom URL scheme, so Google will keep rejecting the redirect.

```bash
npx expo install expo-dev-client
eas build --profile development --platform android
eas build --profile development --platform ios
```

### 2. Remove the Expo Auth Proxy logic entirely
In `GoogleSignInModal.js`, delete the `isExpoGo` branching and `useProxy: true` path.

**Replace this:**
```js
const isExpoGo = Constants.appOwnership === "expo";

const redirectUri = isExpoGo
  ? makeRedirectUri({ useProxy: true })
  : makeRedirectUri({ scheme: "customerapp" });

const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId,
  androidClientId: isExpoGo ? webClientId : androidClientId,
  iosClientId,
  redirectUri,
  scopes: ["openid", "profile", "email"],
});
```

**With this:**
```js
const redirectUri = makeRedirectUri({ scheme: "customerapp" });

const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId,
  iosClientId,
  webClientId, // only needed if you also support Expo web
  redirectUri,
  scopes: ["openid", "profile", "email"],
});
```

Also remove the unused `Constants` import if nothing else in the file needs it.

### 3. Fix `app.json` / `app.config.js` — register the custom scheme
```json
{
  "expo": {
    "scheme": "customerapp"
  }
}
```

### 4. Create/verify correct OAuth Client IDs in Google Cloud Console
Go to **Google Cloud Console → APIs & Services → Credentials**:

- **Android OAuth client**
  - Package name: must match `app.json` → `android.package`
  - SHA-1 fingerprint: add BOTH the debug keystore SHA-1 AND the EAS build (release) SHA-1
    ```bash
    eas credentials
    ```
    (select Android → view/download the SHA-1 for the relevant build profile)
- **iOS OAuth client**
  - Bundle ID: must match `app.json` → `ios.bundleIdentifier`
- **Web application client** (`webClientId`) — only needed if the app also runs on web (`expo start --web`). It must NOT be reused as the Android/iOS client ID.

> Do NOT add `customerapp://` as a redirect URI on the **Web** client — Android/iOS clients don't take a manual redirect URI field; Google validates them via package name + SHA-1 (Android) or bundle ID (iOS) instead.

### 5. Update environment variables
In `apps/customer-app/.env`:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-client-id>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<android-client-id>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<ios-client-id>
```

### 6. Rebuild and test
```bash
npx expo prebuild --clean
eas build --profile development --platform android
```
Install the dev build on device/emulator (not Expo Go), then test the Google sign-in button.

### 7. Debug checklist if it still fails
- Log and confirm the actual `redirectUri` value at runtime — it must start with `customerapp://`, never `https://auth.expo.io/...`.
- Confirm `androidClientId`/`iosClientId` env vars are actually loaded (not falling back to `DEFAULT_ANDROID_CLIENT_ID` unless intended).
- Confirm the SHA-1 used to sign the installed build matches exactly what's registered in Google Cloud Console.
- Confirm the OAuth consent screen has the test Google account added if the app is still in "Testing" publishing status.

## Instruction for Agent
Apply all code changes in Step 2 to `GoogleSignInModal.js`, add the `scheme` field from Step 3 to the Expo config file, and update `.env.example` / `.env` with the variable names from Step 5 (leave actual values as placeholders since they must come from Google Cloud Console). Do not modify unrelated files.
