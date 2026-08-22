// src/services/storage.js
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const memoryStore = new Map();

export const storage = {
  getItem: async (key) => {
    try {
      let val = null;
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        val = window.localStorage.getItem(key);
      } else {
        val = await SecureStore.getItemAsync(key);
      }
      if (val === null || val === undefined) {
        val = memoryStore.get(key) || null;
      }
      return val && val !== "undefined" && val !== "null" ? val : null;
    } catch (e) {
      const fallback = memoryStore.get(key) || null;
      return fallback && fallback !== "undefined" && fallback !== "null" ? fallback : null;
    }
  },

  setItem: async (key, value) => {
    if (value === undefined || value === null || value === "undefined" || value === "null") {
      return storage.removeItem(key);
    }
    memoryStore.set(key, value);
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
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
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      // Silent fallback
    }
  },
};

