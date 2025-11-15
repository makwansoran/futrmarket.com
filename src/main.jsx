import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import App from "./App.jsx";
import "./style.css";

// Global error handler for unhandled errors
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  // Prevent default error handling that might crash the app
  event.preventDefault();
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Prevent default error handling
  event.preventDefault();
});

// Intercept fetch requests to log 404s
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
  try {
    const response = await originalFetch.apply(this, args);
    if (!response.ok && response.status === 404) {
      // Only log 404s for non-API resources (to avoid spam)
      if (!url.includes('/api/') && !url.includes('logo.png')) {
        console.warn(`⚠️ 404: Resource not found: ${url}`);
      }
    }
    return response;
  } catch (error) {
    // Network errors (CORS, etc.) will be caught here
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`❌ Network error (likely CORS): ${url}`, error.message);
    }
    throw error;
  }
};

const root = createRoot(document.getElementById("root"));

root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
