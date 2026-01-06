import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function getAdminEmailsFromEnv(): string[] {
  const raw = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? "").toLowerCase();
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

export async function getAdminPushTokens(): Promise<string[]> {
  const allowedEmails = getAdminEmailsFromEnv();
  const snap = await getDocs(collection(db, "users"));
  const tokens: string[] = [];
  snap.docs.forEach(d => {
    const data = d.data() as any;
    const email = (data.email || "").toLowerCase();
    const isAdminByRole = data.role === "admin";
    const isAdminByEmail = allowedEmails.length > 0 ? allowedEmails.includes(email) : false;

    if ((isAdminByRole || isAdminByEmail) && typeof data.expoPushToken === "string" && data.expoPushToken.length > 5) {
      tokens.push(data.expoPushToken);
    }
  });
  return tokens;
}