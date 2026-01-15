import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { Appointment } from "../types/domain";

export function useAdminDayAppointments(dayKey: string) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dayKey) return;

    const q = query(
      collection(db, "appointments"),
      where("dayKey", "==", dayKey)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Appointment)
      );
      setItems(rows);
      setLoading(false);
    });

    return unsub;
  }, [dayKey]);

  return { items, loading };
}
