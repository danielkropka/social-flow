import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiration
const REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh session every 5 minutes

export function useSessionTimeout() {
  const { data: session, update: updateSession } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    if (!session) return;

    const updateLastActivity = () => {
      setLastActivity(Date.now());
      if (showWarning) {
        setShowWarning(false);
      }
    };

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
      const inactiveTime = currentTime - lastActivity;

      if (inactiveTime >= SESSION_TIMEOUT) {
        setShowWarning(false);
        setShowExpired(true);
        signOut({ redirect: false });
      } else if (inactiveTime >= SESSION_TIMEOUT - WARNING_TIME) {
        if (!showExpired) {
          setShowWarning(true);
        }
      }
    };

    // Refresh session every specified interval
    const refreshSession = () => {
      updateSession();
    };

    const interval = setInterval(checkInactivity, 1000);
    const refreshInterval = setInterval(refreshSession, REFRESH_INTERVAL);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateLastActivity);
      });
      clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, [session, lastActivity, showWarning, updateSession]);

  return {
    showWarning,
    showExpired,
    setShowWarning,
    setShowExpired,
  };
}
