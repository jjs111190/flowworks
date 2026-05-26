export function registerPwa() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL || "/";
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {
      // The app still works without the service worker; install/offline support just stays unavailable.
    });
  });
}
