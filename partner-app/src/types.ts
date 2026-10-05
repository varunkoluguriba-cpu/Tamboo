export type PartnerRole = 'tent' | 'venue';
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
}
