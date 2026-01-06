import React from "react";
import { subscribeUnreadCount } from "../lib/notifications";
import { useAuth } from "./AuthProvider";

type Ctx = { unreadCount: number };
const NotificationsContext = React.createContext<Ctx>({ unreadCount: 0 });

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    return subscribeUnreadCount(user.uid, setUnreadCount);
  }, [user?.uid]);

  return (
    <NotificationsContext.Provider value={{ unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsBadge() {
  return React.useContext(NotificationsContext);
}