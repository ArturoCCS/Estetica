import { User } from "firebase/auth";

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user?.email) return false;

  const raw = process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? "";
  const admins = raw
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(user.email.toLowerCase());
}