export type UserRole = "admin" | "client";

export type Service = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  durationMin?: number;
  durationMax?: number;
  imageUrl?: string;
  rating?: number;
  active?: boolean;
}