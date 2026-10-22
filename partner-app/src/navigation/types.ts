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
  RegisterPhoto: { hallId: string };
  Items: undefined;
  AddItemChoice: undefined;
  ItemForm: { id?: string; initialName?: string; initialCat?: string; initialUnit?: string; initialSpecs?: string; initialPhotos?: string[] };
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
  Conversations: undefined;
};
