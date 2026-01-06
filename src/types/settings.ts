export type BusinessDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type BusinessDay = {
  enabled: boolean;
  start: string;
  end: string;
};

export type GlobalSettings = {
  timezone: string;
  adminPhone: string;
  adminEmail?: string;
  slotIntervalMinutes?: number;
  businessHours: Record<BusinessDayKey, BusinessDay>;
  whatsApp?: {
    phone: string;
    defaultMessageTemplate?: string;
  };
  bookingMinLeadMinutes?: number;
  bookingMaxDays?: number;
  paymentsEnabled?: boolean; // Feature flag for payments
}