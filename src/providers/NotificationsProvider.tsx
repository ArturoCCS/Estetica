import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { AppNotification } from "../types/domain";
import { useAuth } from "./AuthProvider";


type NotificationsContextProps = {
  notifications: AppNotification[];
  unreadCount: number;
  deleteNotification: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

export const NotificationsContext = React.createContext<NotificationsContextProps>({
  notifications: [],
  unreadCount: 0,
  deleteNotification: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const uid = isAdmin ? "ADMIN" : user.uid;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", uid),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications(data);
    }, (err) => {
       console.log("Esperando a que el índice termine de construirse...");
    });
  }, [user, isAdmin]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length
  , [notifications]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) {
      console.error("Error al marcar como leída:", e);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      const batch = writeBatch(db); 
      
      unreadNotifications.forEach((n) => {
        const docRef = doc(db, "notifications", n.id);
        batch.update(docRef, { read: true });
      });

      await batch.commit();
    } catch (e) {
      console.error("Error al marcar todas como leídas:", e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (e) {
      console.error("Error al borrar notificación:", e);
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        deleteNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);