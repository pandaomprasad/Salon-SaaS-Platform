# Feature: Block Booking with a "Verify Your Email" Popup

## Goal
If a logged-in user taps "Book" (or any booking action) while `email_verified` is still `false`, intercept the action and show a popup asking them to confirm their email, with a way to resend the link — instead of letting the booking proceed silently.

## 1. Add the popup component

Create `components/VerifyEmailModal.js`, styled consistently with your existing `GoogleSignInModal.js`:

```js
import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, FS, FW, R, S } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyEmailModal({ visible, onClose, email, onResend }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const insets = useSafeAreaInsets();

  const handleResend = async () => {
    if (cooldown > 0) return;
    setSending(true);
    try {
      await onResend(email);
      setSent(true);
      setCooldown(45);
      const interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("[Resend Verification Error]", err);
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, S.lg) }]}>
          <View style={styles.topAccentBar} />

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="mail-unread-outline" size={22} color={C.bg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Confirm your email to book</Text>
              <Text style={styles.subtitle}>
                We sent a confirmation link to {email}. Verify it to complete your booking.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Link resent. Check your inbox (and spam folder) — it can take a minute to arrive.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.resendBtn, (sending || cooldown > 0) && styles.disabled]}
            onPress={handleResend}
            disabled={sending || cooldown > 0}
            activeOpacity={0.88}
          >
            {sending ? (
              <ActivityIndicator color={C.bg} />
            ) : (
              <Text style={styles.resendText}>
                {cooldown > 0 ? `Resend link (${cooldown}s)` : "Resend confirmation link"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.laterBtn}>
            <Text style={styles.laterText}>I'll do this later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  card: { backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.lg, gap: S.md },
  topAccentBar: { height: 4, borderRadius: 2, backgroundColor: C.main },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  title: { fontSize: FS.titleSm, fontWeight: FW.semiBold, color: C.ink },
  subtitle: { fontSize: FS.bodySm, color: C.body, marginTop: 4 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bone, alignItems: "center", justifyContent: "center" },
  infoBox: { backgroundColor: C.lifted, borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: 14 },
  infoText: { fontSize: FS.bodySm, color: C.body },
  resendBtn: { borderRadius: R.md, minHeight: 48, alignItems: "center", justifyContent: "center", backgroundColor: C.main },
  resendText: { color: C.bg, fontSize: FS.bodySm, fontWeight: FW.semiBold },
  laterBtn: { alignItems: "center", paddingVertical: 8 },
  laterText: { color: C.muted, fontSize: FS.bodySm },
  disabled: { opacity: 0.6 },
});
```

## 2. Add a resend-verification call to your API client

In your existing API/auth service file (wherever `loginWithGoogle`, `login`, etc. live):
```js
export async function resendVerificationEmail(email) {
  const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}
```

## 3. Intercept the booking action

Wherever the "Book" button's `onPress` currently triggers a booking (likely a shared handler used across salon cards/detail screens), add a check before proceeding:

```js
import { useAuth } from "../context/AuthContext";
import VerifyEmailModal from "../components/VerifyEmailModal";
import { resendVerificationEmail } from "../services/api";

function SalonBookingScreen() {
  const { user } = useAuth(); // must expose email_verified and email on the user object
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const handleBookPress = () => {
    if (user && user.email_verified === false) {
      setShowVerifyModal(true);
      return;
    }
    // existing booking logic
    proceedToBooking();
  };

  return (
    <>
      {/* existing screen content, Book button calls handleBookPress */}
      <VerifyEmailModal
        visible={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        email={user?.email}
        onResend={resendVerificationEmail}
      />
    </>
  );
}
```

## 4. Make sure `email_verified` is available on the logged-in user object

Check `AuthContext.js` — the login/session response needs to include `email_verified` (already added in the verification-link backend guide's login response). If your context currently only stores a token, extend it to also store and expose the user object (or at least `email_verified` and `email`), and refresh it after a successful verification so the flag flips without requiring a fresh login.

## Instruction for Agent
1. Create `components/VerifyEmailModal.js` exactly as shown above, matching the existing `GoogleSignInModal.js` visual style (same theme tokens, same modal shape).
2. Add `resendVerificationEmail(email)` to the existing API service file, pointing at the `/api/auth/resend-verification` endpoint already implemented.
3. Locate every place in the app where a "Book" action is triggered (search for booking-related `onPress` handlers across salon cards, salon detail screens, and any booking flow entry points — there may be more than one).
4. Before each booking action proceeds, check `user.email_verified`. If `false`, show `VerifyEmailModal` instead of proceeding; if `true` or the field is absent (e.g. Google-authenticated users, who are already verified), proceed as normal.
5. Confirm `AuthContext` exposes `email_verified` and `email` on the current user — extend it if it currently only stores a token, and ensure it can be refreshed (e.g. re-fetch user on app foreground, or after the user returns from the confirmation link) so the modal stops appearing once they've verified.
6. Do not block any other action in the app besides booking — browsing, searching, and viewing salon details should remain fully accessible to unverified users.
