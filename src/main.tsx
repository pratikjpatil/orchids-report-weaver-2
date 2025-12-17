import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined") {
  const sendToParent = (data: any) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, "*");
      }
    } catch {
      // Ignore postMessage errors
    }
  };

  window.addEventListener("error", (event) => {
    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: "window.onerror",
      },
      timestamp: Date.now(),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as Error | string | unknown;
    const message =
      typeof reason === "object" && reason !== null && "message" in reason
        ? String((reason as Error).message)
        : String(reason);
    const stack = typeof reason === "object" && reason !== null && "stack" in reason ? (reason as Error).stack : undefined;

    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message,
        stack,
        filename: undefined,
        lineno: undefined,
        colno: undefined,
        source: "unhandledrejection",
      },
      timestamp: Date.now(),
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined") {
  const sendToParent = (data: unknown) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, "*");
      }
    } catch (error) {
      console.error("Failed to send message to parent:", error);
    }
  };

  window.addEventListener("error", (event) => {
    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: "window.onerror",
      },
      timestamp: Date.now(),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as Error | string | unknown;
    const message =
      typeof reason === "object" && reason !== null && "message" in reason
        ? String((reason as Error).message)
        : String(reason);
    const stack = typeof reason === "object" && reason !== null && "stack" in reason ? (reason as Error).stack : undefined;

    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message,
        stack,
        filename: undefined,
        lineno: undefined,
        colno: undefined,
        source: "unhandledrejection",
      },
      timestamp: Date.now(),
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
