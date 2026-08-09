const User = require("../models/user.model");

// ================================
// Expo Push Notification service
// ================================
// Sends remote push notifications to a user's registered devices via
// Expo's push API (the same tokens the customer app registers through
// expo-notifications). No expo-server-sdk needed — a plain fetch to the
// HTTP endpoint with the message batch.
//
// https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// ---- validate an Expo push token (ExponentPushToken[xxxxx]) ----
const isExpoPushToken = (token) =>
  typeof token === "string" &&
  /^ExponentPushToken\[[A-Za-z0-9\-_]+\]$/.test(token);

// ---- single delivery attempt to one push message ----
// returns { status, ... } per Expo response; throws on transport error
async function sendExpoPush(message) {
  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify([message]),
  });
  const json = await res.json();
  if (!res.ok || json?.data?.[0]?.status === "error") {
    const receipt = json?.data?.[0] || json;
    throw new Error(
      `Expo push failed: ${receipt?.message || res.statusText || "unknown error"}`,
    );
  }
  return json;
}

// ================================
// sendPushToUser
// ================================
// Build the title/body copy for an appointment-status push and send it to
// every device the user has registered. Best-effort: never throws, never
// breaks the booking/status-change flow. Removes tokens Expo marks as
// invalid so we don't retry dead devices forever.
const sendPushToUser = async ({
  userId,
  title,
  body,
  data = {},
  sound = "default",
}) => {
  try {
    const user = await User.findById(userId).select("pushTokens").lean();
    if (!user?.pushTokens?.length) return;

    const tokens = user.pushTokens.filter(isExpoPushToken);
    if (!tokens.length) return;

    const messages = tokens.map((to) => ({
      to,
      title,
      body,
      data,
      sound,
      priority: "high",
      badge: 1,
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    if (!res.ok) return;

    const json = await res.json();
    const invalidTokens = [];
    (json?.data || []).forEach((receipt, idx) => {
      if (receipt?.status === "error") {
        if (/invalid|DeviceNotRegistered|MessageTooBig/i.test(receipt.details?.error || "")) {
          invalidTokens.push(messages[idx]?.to);
        }
      }
    });

    if (invalidTokens.length) {
      await User.updateOne(
        { _id: userId },
        { $pull: { pushTokens: { $in: invalidTokens } } },
      );
    }
  } catch (error) {
    console.error("push.service sendPushToUser error:", error.message);
  }
};

// ================================
// registerPushToken
// ================================
// Add a device's push token (idempotent). Called from /customers/me/push-token
// after the client obtains it via expo-notifications.
const registerPushToken = async ({ userId, token }) => {
  if (!isExpoPushToken(token)) return false;

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { pushTokens: token } },
    { new: true, select: "pushTokens" },
  ).lean();

  return !!user;
};

// ================================
// unregisterPushToken
// ================================
// Remove a token (e.g. on logout or when a device is uninstalled).
// Pass a token to remove one device; omit to clear all of the user's.
const unregisterPushToken = async ({ userId, token }) => {
  const update = token
    ? { $pull: { pushTokens: token } }
    : { $set: { pushTokens: [] } };
  await User.updateOne({ _id: userId }, update);
  return true;
};

module.exports = {
  isExpoPushToken,
  registerPushToken,
  unregisterPushToken,
  sendPushToUser,
};