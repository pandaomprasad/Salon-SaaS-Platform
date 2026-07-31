// src/services/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const memoryStore = new Map();

export const storage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      const val = await AsyncStorage.getItem(key);
      return val !== null ? val : memoryStore.get(key) || null;
    } catch (e) {
      // Fallback silently to memory store when native module is unlinked in Expo Go
      return memoryStore.get(key) || null;
    }
  },

  setItem: async (key, value) => {
    memoryStore.set(key, value);
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // Silent fallback
    }
  },

  removeItem: async (key) => {
    memoryStore.delete(key);
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // Silent fallback
    }
  },
};
