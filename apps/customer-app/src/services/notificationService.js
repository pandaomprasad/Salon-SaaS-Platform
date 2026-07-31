// src/services/notificationService.js
import { LogBox, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

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
