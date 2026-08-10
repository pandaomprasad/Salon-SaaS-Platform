import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "../services/storage";

const FavoritesContext = createContext();
const FAVORITES_STORAGE_KEY = "@salon_app_favorites";

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedFavorites = async () => {
      try {
        const saved = await storage.getItem(FAVORITES_STORAGE_KEY);
        if (saved && saved !== "undefined" && saved !== "null") {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          }
        }
      } catch (err) {
        console.warn("Could not load favorites from storage:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSavedFavorites();
  }, []);

  const isFavorite = (id) => {
    if (!id) return false;
    return favorites.some((item) => item.id === id || item._id === id);
  };

  const toggleFavorite = async (salonOrBranch) => {
    if (!salonOrBranch) return;
    const itemId = salonOrBranch.id || salonOrBranch._id;
    if (!itemId) return;

    const exists = isFavorite(itemId);
    let updated;
    if (exists) {
      updated = favorites.filter((item) => (item.id || item._id) !== itemId);
    } else {
      updated = [...favorites, salonOrBranch];
    }

    setFavorites(updated);
    try {
      await storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      const { customerService } = require("../services/customerService");
      if (exists) {
        await customerService.removeFavoriteSalon(itemId);
      } else {
        await customerService.addFavoriteSalon(itemId);
      }
    } catch (err) {
      // safe fallback if offline or storage warning
      console.log("Favorites sync note:", err.message);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    return {
      favorites: [],
      isFavorite: () => false,
      toggleFavorite: () => {},
      loading: false,
    };
  }
  return context;
}
