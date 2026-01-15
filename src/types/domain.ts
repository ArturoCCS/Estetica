export type UserRole = "admin" | "client";

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

export type Service = {
  id: string;
  name: string;
  description?: string;

  category?: string;
  heroImageUrl?: string;
  imageUrl?: string;
  galleryUrls?: string[];

  price?: number;
  durationMin?: number;
  durationMax?: number;

  active: boolean;
};

export type AppointmentStatus = 
    | "requested"
    | "adjusted"
    | "awaiting_payment"
    | "confirmed"
    | "cancelled"
    | "expired";



export type Appointment = {
  requestedEndAt: string | undefined;
  adminNotes: any;
  cancelledBy: "admin" | "user"
  userName?: string; 
  durationMinutes: any;
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  price?: number;
  status: AppointmentStatus;
  
  requestedStartAt: string;
  
  finalStartAt?: string;
  finalEndAt?: string;
  
  depositAmount?: number;
  paymentDueAt?: string;
  
  mpPreferenceId?: string;
  mpPaymentId?: string;
  mpStatus?: string;

  dayKey: string;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

export type UserProfile = {
  uid: string;
  name: string;
  phone?: string;
  email?: string;
};
