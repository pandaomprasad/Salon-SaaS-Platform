// src/context/FavoritesContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const FavoritesContext = createContext();

// In-memory / Web storage fallback
let memoryStorage = [];

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(memoryStorage);
  const [loading, setLoading] = useState(false);

  const isFavorite = (id) => {
    if (!id) return false;
    return favorites.some((item) => item.id === id || item._id === id);
  };

  const toggleFavorite = (salonOrBranch) => {
    if (!salonOrBranch) return;
    const itemId = salonOrBranch.id || salonOrBranch._id;
    if (!itemId) return;

    let updated;
    if (isFavorite(itemId)) {
      updated = favorites.filter((item) => (item.id || item._id) !== itemId);
    } else {
      updated = [...favorites, salonOrBranch];
    }

    memoryStorage = updated;
    setFavorites(updated);
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
