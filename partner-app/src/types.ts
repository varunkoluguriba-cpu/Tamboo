export type PartnerRole = 'tent' | 'venue' | 'service' | 'farm';
export type ServiceCategory = 'priest' | 'catering' | 'decor' | 'music';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface PartnerUser {
  id: string;
  phone: string;
  authMethod: 'phone' | 'google';
  role: PartnerRole;
  businessName: string;
  ownerName: string;
  city: string;
  area: string;
  venueType: string;
  categories: string[];
  taxId: string;
  bankAccount: string;
  verificationStatus: VerificationStatus;
  registered: boolean;
  commissionPct?: number; // live Tamboo commission, from /me
  customersLive?: boolean; // false until the customer app/website is public (server decides)
  whatsappEnabled?: boolean; // WhatsApp Business is connected on the server (Insights has data to show)
  servicesEnabled?: boolean; // event services switched on for this partner (server decides)
  serviceCategory?: ServiceCategory | '';
  traditions?: string[];
  languages?: string[];
}

export interface RegisterPayload {
  role: PartnerRole;
  businessName: string;
  ownerName: string;
  city: string;
  area: string;
  venueType?: string;
  categories?: string[];
  taxId: string;
  bankAccount: string;
  photos?: string[];
  serviceCategory?: ServiceCategory;
  traditions?: string[];
  languages?: string[];
}
