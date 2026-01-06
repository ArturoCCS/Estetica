export type MainTabsParamList = {
  Home: undefined;
  Services: undefined;
  Bookings: undefined;
  Profile: undefined;
  Admin?: undefined;
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
  Login: undefined;
  Signup: undefined;
  BookService: { serviceId?: string };
  AdminAppointments: undefined;
  SettingsAdmin: undefined; // agregado
  ServiceDetail: { serviceId: string };
  Notifications: undefined; // agregado
};