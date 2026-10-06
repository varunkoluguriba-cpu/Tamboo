export type AuthStackParamList = {
  Onboarding: undefined;
  Language: undefined;
  Login: undefined;
  Otp: { phone: string };
  Register: undefined;
  PendingReview: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  Orders: undefined;
  Order: { id: string };
  Quote: { id: string };
  Calendar: undefined;
  Items: undefined;
  ItemForm: { id?: string };
  Packages: undefined;
  PackageForm: { id?: string };
  Shop: undefined;
  HHome: undefined;
  HTokens: undefined;
  HToken: { id: string };
  Halls: undefined;
  Hall: { hallId?: string };
  Earnings: undefined;
  Chat: { customerId?: string; customerName: string };
};
