/**
 * Derived notifications module - "Camino A"
 * 
 * Derives notification data from existing `appointments` collection
 * without creating a new notifications collection.
 * 
 * Works on free plan - no Cloud Functions required.
 */

import { collection, doc, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Appointment, AppointmentStatus } from "../types/domain";
import { db } from "./firebase";

/**
 * Safely parse mixed date formats to milliseconds
 * Handles: ISO strings, Firestore Timestamps, Date objects, and milliseconds
 */
export function parseToMillis(date: any): number {
  if (!date) return 0;
  
  // Already milliseconds
  if (typeof date === "number") return date;
  
  // Firestore Timestamp
  if (date && typeof date.toMillis === "function") {
    return date.toMillis();
  }
  
  // Date object
  if (date instanceof Date) {
    return date.getTime();
  }
  
  // ISO string or other parseable string
  if (typeof date === "string") {
    const parsed = new Date(date).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * Hook: Get count of pending appointments for admins
 * Returns count of appointments with status='requested'
 */
export function useAdminPendingCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "appointments"),
      where("status", "==", "requested")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    });

    return unsubscribe;
  }, []);

  return count;
}

/**
 * Hook: Get count of unread appointments for a user
 * Returns count of user's appointments where updatedAt > lastSeenNotificationsAt
 */
export function useUserUnreadCount(userId: string | null): number {
  const [count, setCount] = useState(0);
  const [lastSeen, setLastSeen] = useState<number>(0);

  // Subscribe to user's lastSeenNotificationsAt
  useEffect(() => {
    if (!userId) {
      setLastSeen(0);
      return;
    }

    const userDocRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      const data = snapshot.data();
      const lastSeenValue = data?.lastSeenNotificationsAt;
      setLastSeen(parseToMillis(lastSeenValue));
    });

    return unsubscribe;
  }, [userId]);

  // Subscribe to user's appointments and count unread
  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unreadCount = snapshot.docs.filter((doc) => {
        const data = doc.data();
        const updatedAtMillis = parseToMillis(data.updatedAt || data.createdAt);
        return updatedAtMillis > lastSeen;
      }).length;
      
      setCount(unreadCount);
    });

    return unsubscribe;
  }, [userId, lastSeen]);

  return count;
}

/**
 * Derived notification item for inbox display
 */
export type DerivedNotification = {
  id: string;
  type: "appointment_pending" | "appointment_status_change";
  title: string;
  message: string;
  timestamp: number;
  appointment: Appointment;
};

/**
 * Hook: Get list of derived notifications for inbox screen
 * For admins: pending appointments (status='requested')
 * For users: appointment updates where updatedAt > lastSeenNotificationsAt
 */
export function useDerivedNotifications(
  isAdmin: boolean,
  userId: string | null
): DerivedNotification[] {
  const [notifications, setNotifications] = useState<DerivedNotification[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(0);

  // Get lastSeen for non-admin users
  useEffect(() => {
    if (isAdmin || !userId) {
      setLastSeen(0);
      return;
    }

    const userDocRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      const data = snapshot.data();
      const lastSeenValue = data?.lastSeenNotificationsAt;
      setLastSeen(parseToMillis(lastSeenValue));
    });

    return unsubscribe;
  }, [isAdmin, userId]);

  // Subscribe to appointments
  useEffect(() => {
    let q;

    if (isAdmin) {
      // Admin: show all pending requested appointments
      q = query(
        collection(db, "appointments"),
        where("status", "==", "requested"),
        orderBy("createdAt", "desc")
      );
    } else if (userId) {
      // User: show their appointments
      q = query(
        collection(db, "appointments"),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc")
      );
    } else {
      setNotifications([]);
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: DerivedNotification[] = [];

      snapshot.docs.forEach((docSnap) => {
        const apt = { id: docSnap.id, ...docSnap.data() } as Appointment;
        const updatedAtMillis = parseToMillis(apt.updatedAt || apt.createdAt);

        // For admins: always show pending items
        if (isAdmin) {
          items.push({
            id: apt.id,
            type: "appointment_pending",
            title: "Nueva cita solicitada",
            message: `${apt.serviceName} • ${new Date(parseToMillis(apt.requestedStartAt)).toLocaleDateString("es-MX")}`,
            timestamp: parseToMillis(apt.createdAt),
            appointment: apt,
          });
        } else {
          // For users: only show if updated after lastSeen
          if (updatedAtMillis > lastSeen) {
            const statusMessage = getStatusMessage(apt.status);
            items.push({
              id: apt.id,
              type: "appointment_status_change",
              title: statusMessage.title,
              message: `${apt.serviceName} • ${statusMessage.body}`,
              timestamp: updatedAtMillis,
              appointment: apt,
            });
          }
        }
      });

      setNotifications(items);
    });

    return unsubscribe;
  }, [isAdmin, userId, lastSeen]);

  return notifications;
}

/**
 * Get user-friendly message for appointment status
 */
function getStatusMessage(status: AppointmentStatus): { title: string; body: string } {
  switch (status) {
    case "requested":
      return { title: "Cita solicitada", body: "Tu cita está pendiente de aprobación" };
    case "awaiting_payment":
      return { title: "Esperando pago", body: "Tu cita fue aprobada. Realiza el pago para confirmar" };
    case "confirmed":
      return { title: "Cita confirmada", body: "Tu cita ha sido confirmada" };
    case "cancelled":
      return { title: "Cita cancelada", body: "Tu cita fue cancelada" };
    case "expired":
      return { title: "Cita expirada", body: "El plazo de pago expiró" };
    default:
      return { title: "Actualización", body: "Tu cita fue actualizada" };
  }
}

/**
 * Update lastSeenNotificationsAt timestamp for a user
 * Call this when user opens notifications screen
 */
export async function updateLastSeen(userId: string): Promise<void> {
  if (!userId) return;
  
  try {
    const userDocRef = doc(db, "users", userId);
    // Use ISO string for consistency and web compatibility
    const now = new Date().toISOString();
    await updateDoc(userDocRef, {
      lastSeenNotificationsAt: now,
    });
  } catch (error) {
    console.error("Failed to update lastSeenNotificationsAt:", error);
  }
}
