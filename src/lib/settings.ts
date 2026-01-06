import { doc, onSnapshot } from "firebase/firestore";
import { GlobalSettings } from "../theme/types/settings";
import { db } from "./firebase";

export function subscribeGlobalSettings(
  onValue: (settings: GlobalSettings | null) => void,
  onError?: (err: unknown) => void
) {
  const ref = doc(db, "settings", "global");
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) return onValue(null);
      onValue(snap.data() as GlobalSettings);
    },
    (err) => onError?.(err)
  );
}