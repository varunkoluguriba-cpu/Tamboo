export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  email: string;
  city: string;
  area?: string; // Hyderabad locality the customer picked (optional)
  registered: boolean;
  authMethod?: 'phone' | 'google' | 'guest';
  isGuest?: boolean;
}
