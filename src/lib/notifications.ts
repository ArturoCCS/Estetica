import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";

export type AppNotification = {
  id: string;
  recipientId: string;
  appointmentId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  route: {
    screen: string;
    params?: any;
  };
};

export function useNotifications(userId: string | null) {
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("deleted", "==", false),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as AppNotification
        )
      );
    });
  }, [userId]);

  return items;
}


export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, "notifications", id), {
    read: true,
  });
}

export async function deleteNotification(id: string) {
  await updateDoc(doc(db, "notifications", id), {
    deleted: true,
    deletedAt: serverTimestamp(),
  });
}

export async function createNotification(payload: Omit<AppNotification, "id">) {
  await addDoc(collection(db, "notifications"), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}


export function notificationsRef(userId: string) {
  return collection(db, "users", userId, "notifications");
}

export function subscribeUnreadCount(userId: string, cb: (count: number) => void) {
  const q = query(notificationsRef(userId), where("readAt", "==", null));
  return onSnapshot(q, (snap) => cb(snap.size));
}

export function subscribeNotifications(userId: string, cb: (items: AppNotification[]) => void) {
  const q = query(notificationsRef(userId), orderBy("createdAt", "desc"), limit(200));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AppNotification[];
    cb(items);
  });
}

export async function markAllNotificationsRead(userId: string, ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id) => {
    batch.update(doc(db, "users", userId, "notifications", id), { readAt: serverTimestamp() });
  });
  await batch.commit();
}