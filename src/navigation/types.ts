export type MainTabsParamList = {
  Inicio: undefined;
  Servicios: undefined;
  Agenda: undefined;
  Perfil: undefined;
  Admin?: undefined;
  Login?: undefined;
};


export type RootStackParamList = {
  
  Main: { screen?: keyof MainTabsParamList };
  PromoRoulette: { promoId: string; rewards: { code: string; label: string }[] };
  Admin: undefined;
  ServicesAdmin: undefined;
  CreateService: undefined;
  EditService: undefined;
  PromosAdmin: undefined;
  GalleryAdmin: undefined;
  Login: { redirectTo?: { name: string; params?: any } } | undefined;
  Signup: undefined;
  BookService: { serviceId?: string };
  AdminAppointments: { initialTab: string };
  SettingsAdmin: undefined;
  ServiceDetail: { serviceId: string };
  Notifications: undefined;
  Calendar: undefined;
  AppointmentDetail: { appointmentId: string };
  About: undefined;
  PromoCoupon: { promoId: string };
  PromoDetail: { promoId: string };
};

