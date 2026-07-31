// src/context/ErrorContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import ErrorCardModal from "../components/ErrorCardModal";

const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [errorConfig, setErrorConfig] = useState({
    visible: false,
    title: "Notice",
    message: "",
    buttonText: "Got It",
  });

  const showError = useCallback((message, title = "Notice", buttonText = "Got It") => {
    if (!message) return;
    setErrorConfig({
      visible: true,
      title,
      message,
      buttonText,
    });
  }, []);

  const hideError = useCallback(() => {
    setErrorConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, hideError, errorConfig }}>
      {children}
      <ErrorCardModal
        visible={errorConfig.visible}
        title={errorConfig.title}
        message={errorConfig.message}
        buttonText={errorConfig.buttonText}
        onClose={hideError}
      />
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
}
