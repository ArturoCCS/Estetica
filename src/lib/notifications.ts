import {
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
import { db } from "./firebase";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type?: string;
  data?: any;
  createdAt?: any;
  readAt?: any | null;
};

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

export async function markNotificationRead(userId: string, notificationId: string) {
  await updateDoc(doc(db, "users", userId, "notifications", notificationId), {
    readAt: serverTimestamp(),
  });
}

export async function markAllNotificationsRead(userId: string, ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id) => {
    batch.update(doc(db, "users", userId, "notifications", id), { readAt: serverTimestamp() });
  });
  await batch.commit();
}