"use client";

import { useEffect, useState } from "react";

export function NoConnectionMessage() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function syncOnlineState() {
      setIsOffline(!window.navigator.onLine);
    }

    function markOnline() {
      setIsOffline(false);
    }

    function markOffline() {
      setIsOffline(true);
    }

    syncOnlineState();
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);

    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <p className="offline-message" role="status">
      Keine Verbindung. Tipps können nur online gespeichert werden.
    </p>
  );
}
