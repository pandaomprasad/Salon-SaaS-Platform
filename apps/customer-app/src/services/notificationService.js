// src/services/notificationService.js
import { LogBox, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { apiClient } from "./apiClient";
import { storage } from "./storage";

// Silence Expo Go SDK 53+ push notification warning banner
LogBox.ignoreLogs([
  "expo-notifications",
  "Android Push notifications",
  "functionality provided by expo-notifications was removed from Expo Go",
]);

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications = null;
if (!isExpoGo && Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    Notifications = null;
  }
}

export const notificationService = {
  // Create the Android notification channel (required for >= API 26).
  // No-op elsewhere. Safe to call multiple times.
  initAndroidChannel: async () => {
    try {
      if (Platform.OS !== "android" || isExpoGo || !Notifications) return;
      await Notifications.setNotificationChannelAsync("default", {
        name: "Appointment updates",
        importance: Notifications.AndroidImportance?.HIGH || 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    } catch {
      // ignore
    }
  },

  requestPermissions: async () => {
    try {
      if (Platform.OS === "web") {
        if ("Notification" in window && Notification.permission === "default") {
          await Notification.requestPermission();
        }
        return true;
      }

      if (isExpoGo || !Notifications) {
        return true;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch (err) {
      return true;
    }
  },

  // Fetch the device's Expo push token and register it with the backend
  // so the server can send remote (APNs/FCM) notifications even when the
  // app is closed. No-op in Expo Go / web — remote push needs a dev build.
  registerPushToken: async () => {
    try {
      if (Platform.OS === "web" || isExpoGo || !Notifications) return null;

      const permission = await notificationService.requestPermissions();
      if (!permission) return null;

      const projectId =
        Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      if (!token?.data) return null;

      await apiClient.post("/customers/me/push-token", { token: token.data });
      await storage.setItem("@salon_app_push_token", token.data);
      return token.data;
    } catch (err) {
      console.warn("Push token registration failed:", err.message);
      return null;
    }
  },

  // Remove the registered push token from the backend (e.g. on logout).
  unregisterPushToken: async () => {
    try {
      const token = await storage.getItem("@salon_app_push_token");
      if (!token) return;
      try {
        await apiClient.delete(`/customers/me/push-token/${encodeURIComponent(token)}`);
      } catch {
        // ignore — server may be down while logging out
      }
      await storage.removeItem("@salon_app_push_token");
    } catch {
      // ignore
    }
  },

  // Subscribe to notification taps → navigate to the bookings screen later.
  // Returns an unsubscribe function.
  onNotificationTap: (callback) => {
    if (Platform.OS === "web" || isExpoGo || !Notifications) return () => {};
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const { data } = response?.notification?.request?.content || {};
      callback(data);
    });
    return () => sub.remove();
  },

  sendPushNotification: async ({ title, body, data = {} }) => {
    try {
      if (Platform.OS === "web") {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            data,
          });
        }
        return;
      }

      if (isExpoGo || !Notifications) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || "Salon Luxe Update",
          body: body || "Your appointment status was updated.",
          sound: "default",
          data,
        },
        trigger: null,
      });
    } catch (err) {
      // Ignore
    }
  },

  notifyStatusChange: async (status, salonName = "Salon Luxe", serviceName = "Appointment") => {
    let title = "Appointment Status Updated";
    let body = `Your booking for ${serviceName} at ${salonName} was updated.`;

    switch (status) {
      case "CONFIRMED":
        title = "🎉 Booking Accepted!";
        body = `${salonName} accepted your appointment for ${serviceName}.`;
        break;
      case "IN_PROGRESS":
        title = "✂️ Service Started!";
        body = `Your stylist is ready! ${serviceName} is now in progress at ${salonName}.`;
        break;
      case "COMPLETED":
        title = "🌟 Service Completed!";
        body = `Thank you for visiting ${salonName}. Don't forget to rate your experience!`;
        break;
      case "CANCELLED":
        title = "⚠️ Appointment Cancelled";
        body = `Your booking for ${serviceName} at ${salonName} was cancelled.`;
        break;
      default:
        break;
    }

    await notificationService.sendPushNotification({ title, body, data: { status, salonName, serviceName } });
  },
};
