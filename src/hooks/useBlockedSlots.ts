import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";

type Block = { start: Date; end: Date };

export function useBlockedSlots(dayKey: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (!dayKey) return;

    const q = query(collection(db, "appointments"));

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs
        .map((d) => d.data())
        .filter(
          (a) =>
            a.dayKey === dayKey &&
            !["cancelled", "expired"].includes(a.status)
        )
        .map((a) => ({
          start: new Date(a.finalStartAt ?? a.requestedStartAt),
          end: new Date(a.finalEndAt),
        }));

      setBlocks(items);
    });

    return unsub;
  }, [dayKey]);

  return blocks;
}
