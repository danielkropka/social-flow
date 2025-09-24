import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 godziny
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiration
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds instead of every second

export function useSessionTimeout() {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const lastCheckRef = useRef(Date.now());

  // Memoize event handlers to prevent unnecessary re-renders
  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    
    // Only update warning state if it was showing
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  // Throttled activity update to reduce function calls
  const throttledUpdateActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > 1000) { // Only update if more than 1 second passed
      updateLastActivity();
    }
  }, [updateLastActivity]);

  // Memoize event list to prevent recreation
  const events = useMemo(() => [
    "mousedown",
    "mousemove", 
    "keypress",
    "scroll",
    "touchstart",
  ], []);

  useEffect(() => {
    if (!session) return;

    // Add throttled event listeners
    events.forEach((event) => {
      window.addEventListener(event, throttledUpdateActivity, { passive: true });
    });

    const checkInactivity = () => {
      const currentTime = Date.now();
      const inactiveTime = currentTime - lastActivityRef.current;
      const timeSinceLastCheck = currentTime - lastCheckRef.current;

      // Only check if enough time has passed since last check
      if (timeSinceLastCheck < CHECK_INTERVAL) return;
      
      lastCheckRef.current = currentTime;

      if (inactiveTime >= SESSION_TIMEOUT) {
        toast.message("Sesja wygasła - zostaniesz wylogowany.");
        setShowWarning(false);
        setShowExpired(true);
        signOut({ redirect: false });
      } else if (inactiveTime >= SESSION_TIMEOUT - WARNING_TIME) {
        if (!showExpired && !showWarning) {
          setShowWarning(true);
        }
      }
    };

    // Use longer interval for better performance
    const interval = setInterval(checkInactivity, CHECK_INTERVAL);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledUpdateActivity);
      });
      clearInterval(interval);
    };
  }, [session, throttledUpdateActivity, events]);

  return {
    showWarning,
    showExpired,
    setShowWarning,
    setShowExpired,
  };
}
