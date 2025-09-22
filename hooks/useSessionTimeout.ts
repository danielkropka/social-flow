import { useEffect, useState, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 godziny
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiration

export function useSessionTimeout() {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  useEffect(() => {
    if (!session) return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    
    events.forEach((event) => {
      window.addEventListener(event, updateLastActivity);
    });

    const checkInactivity = () => {
      const currentTime = Date.now();
      const inactiveTime = currentTime - lastActivityRef.current;

      // Debug logging
      if (inactiveTime > 1000) { // Log tylko jeśli jest jakaś nieaktywność
        console.log("Session timeout check:", {
          inactiveTime: Math.round(inactiveTime / 1000) + "s",
          sessionTimeout: Math.round(SESSION_TIMEOUT / 1000) + "s",
          warningTime: Math.round(WARNING_TIME / 1000) + "s",
          willExpire: inactiveTime >= SESSION_TIMEOUT,
          willWarn: inactiveTime >= SESSION_TIMEOUT - WARNING_TIME
        });
      }

      if (inactiveTime >= SESSION_TIMEOUT) {
        console.log("Session expired - signing out");
        setShowWarning(false);
        setShowExpired(true);
        signOut({ redirect: false });
      } else if (inactiveTime >= SESSION_TIMEOUT - WARNING_TIME) {
        if (!showExpired) {
          setShowWarning(true);
        }
      }
    };

    const interval = setInterval(checkInactivity, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateLastActivity);
      });
      clearInterval(interval);
    };
  }, [session, updateLastActivity]);

  return {
    showWarning,
    showExpired,
    setShowWarning,
    setShowExpired,
  };
}