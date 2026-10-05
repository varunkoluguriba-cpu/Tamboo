export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  email: string;
  city: string;
  registered: boolean;
  authMethod?: 'phone' | 'google' | 'guest';
  isGuest?: boolean;
}
