export type AuthStackParamList = {
  Onboarding: undefined;
  Language: undefined;
  Login: undefined;
  Otp: { phone: string };
  Register: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  Event: undefined;
  Browse: { category?: string };
  Vendor: { id: string };
  Product: { id: string };
  Cart: undefined;
  Checkout: undefined;
  Pay: undefined;
  Confirm: { orders: Array<{ id: string; vendor: string; total: number }> };
};
