// src/context/SharedElementContext.jsx
import React, { createContext, useState, useContext } from "react";

const SharedElementContext = createContext();

export function SharedElementProvider({ children }) {
  const [activeSharedElement, setActiveSharedElement] = useState(null);
  const [lastBounds, setLastBounds] = useState(null);

  const startSharedTransition = (elementData, layoutBounds, onComplete) => {
    const targetBounds = layoutBounds || lastBounds;
    if (layoutBounds) {
      setLastBounds(layoutBounds);
    }
    setActiveSharedElement({
      ...elementData,
      bounds: targetBounds,
      onComplete,
    });
  };

  const clearSharedElement = () => {
    setActiveSharedElement(null);
  };

  return (
    <SharedElementContext.Provider
      value={{
        activeSharedElement,
        lastBounds,
        startSharedTransition,
        clearSharedElement,
      }}
    >
      {children}
    </SharedElementContext.Provider>
  );
}

export function useSharedElement() {
  const context = useContext(SharedElementContext);
  if (!context) {
    return {
      activeSharedElement: null,
      lastBounds: null,
      startSharedTransition: () => {},
      clearSharedElement: () => {},
    };
  }
  return context;
}
