// src/store/useLocationStore.js
import { create } from "zustand";
import { storage } from "../services/storage";
import { cleanCityName, getCurrentLocation } from "../services/locationService";

const STORAGE_CITY_KEY = "@user_selected_city";

export const useLocationStore = create((set, get) => ({
  selectedCity: "Brahmapur",
  locationDetails: null,
  isDetecting: false,
  initialized: false,

  setSelectedCity: async (city) => {
    if (!city) return;
    const cleaned = cleanCityName(city);
    set({ selectedCity: cleaned });
    try {
      await storage.setItem(STORAGE_CITY_KEY, cleaned);
    } catch (err) {
      console.warn("[LocationStore] Failed to save city to storage:", err);
    }
  },

  setLocationDetails: (details) => {
    if (!details) return;
    const cityName = details.city ? cleanCityName(details.city) : get().selectedCity;
    set({
      selectedCity: cityName,
      locationDetails: details,
    });
    if (cityName) {
      storage.setItem(STORAGE_CITY_KEY, cityName).catch(() => {});
    }
  },

  detectCurrentLocation: async () => {
    set({ isDetecting: true });
    try {
      const geoResult = await getCurrentLocation();
      if (geoResult && geoResult.city) {
        const detectedCity = cleanCityName(geoResult.city);
        if (detectedCity) {
          set({
            selectedCity: detectedCity,
            locationDetails: geoResult,
            isDetecting: false,
          });
          await storage.setItem(STORAGE_CITY_KEY, detectedCity);
          return detectedCity;
        }
      }
    } catch (err) {
      console.warn("[LocationStore] Auto-detect location failed:", err.message);
    } finally {
      set({ isDetecting: false });
    }
    return get().selectedCity;
  },

  initLocation: async () => {
    if (get().initialized) return get().selectedCity;
    set({ initialized: true });
    try {
      const saved = await storage.getItem(STORAGE_CITY_KEY);
      if (saved && saved.trim()) {
        const cleaned = cleanCityName(saved);
        set({ selectedCity: cleaned });
        return cleaned;
      }
      return await get().detectCurrentLocation();
    } catch (err) {
      console.warn("[LocationStore] Init failed:", err.message);
    }
    return get().selectedCity;
  },
}));
