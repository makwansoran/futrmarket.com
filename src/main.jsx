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

const root = createRoot(document.getElementById("root"));

root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
