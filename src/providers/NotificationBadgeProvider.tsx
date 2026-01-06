/**
 * NotificationBadgeProvider
 * 
 * Provides global access to notification badge count
 * Based on derived data from appointments collection
 */

import React, { createContext, useContext, useMemo } from "react";
import { useAdminPendingCount, useUserUnreadCount } from "../lib/notifications-derived";
import { useAuth } from "./AuthProvider";

type NotificationBadgeContextProps = {
  badgeCount: number;
};

const NotificationBadgeContext = createContext<NotificationBadgeContextProps>({
  badgeCount: 0,
});

export function NotificationBadgeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  
  const adminPendingCount = useAdminPendingCount();
  const userUnreadCount = useUserUnreadCount(user?.uid || null);
  
  const badgeCount = useMemo(() => {
    if (isAdmin) {
      return adminPendingCount;
    }
    return userUnreadCount;
  }, [isAdmin, adminPendingCount, userUnreadCount]);

  const value = useMemo(
    () => ({
      badgeCount,
    }),
    [badgeCount]
  );

  return (
    <NotificationBadgeContext.Provider value={value}>
      {children}
    </NotificationBadgeContext.Provider>
  );
}

export function useNotificationBadge() {
  return useContext(NotificationBadgeContext);
}
