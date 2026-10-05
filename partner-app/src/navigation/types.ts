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
  Shop: undefined;
  HHome: undefined;
  HTokens: undefined;
  HToken: { id: string };
  Hall: undefined;
  Earnings: undefined;
  Chat: { customerId?: string; customerName: string };
};
