export type UserRole = "admin" | "client";


export type Service = {
  id: string;
  name: string;
  description?: string;

  // Hero/landing
  heroImageUrl?: string;     // imagen grande arriba
  imageUrl?: string;         // compat con lo viejo (portada)
  galleryUrls?: string[];    // ✅ galería propia por links

  // opcionales
  price?: number;
  durationMin?: number;
  durationMax?: number;

  active: boolean;
};

export type AppointmentStatus = 
  | "requested"       // User requested, waiting admin approval
  | "awaiting_payment" // Admin approved, user needs to pay
  | "confirmed"        // Payment received or admin confirmed without payment
  | "cancelled"        // Cancelled by user or admin
  | "expired";         // Payment deadline passed

export type Appointment = {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  price?: number;
  status: AppointmentStatus;
  
  // Initial request
  requestedStartAt: string; // ISO datetime
  
  // Admin-set final range (blocking)
  finalStartAt?: string;    // ISO datetime, set by admin
  finalEndAt?: string;      // ISO datetime, set by admin
  
  // Payment info
  depositAmount?: number;   // MXN, set by admin when requesting payment
  paymentDueAt?: string;    // ISO datetime, 24h from admin approval
  
  // Mercado Pago
  mpPreferenceId?: string;
  mpPaymentId?: string;
  mpStatus?: string;        // approved, pending, rejected, etc.
  
  // Metadata
  dayKey: string;           // YYYY-MM-DD for quick lookups
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}