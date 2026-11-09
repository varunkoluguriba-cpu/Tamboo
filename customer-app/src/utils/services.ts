import type { IconName } from '../components/icons';
import type { LangStrings } from '../i18n';
import type { ServiceCategory } from '../context/ServicesContext';

export const SERVICE_CATEGORIES: ServiceCategory[] = ['priest', 'catering', 'decor', 'music'];

export function serviceCategoryInfo(c: string, t: LangStrings): { label: string; ex: string; icon: IconName } {
  switch (c) {
    case 'priest': return { label: t.svCatPriest, ex: t.svCatPriestEx, icon: 'flame' };
    case 'catering': return { label: t.svCatCatering, ex: t.svCatCateringEx, icon: 'utensils' };
    case 'decor': return { label: t.svCatDecor, ex: t.svCatDecorEx, icon: 'flower' };
    case 'music': return { label: t.svCatMusic, ex: t.svCatMusicEx, icon: 'music' };
    default: return { label: c, ex: '', icon: 'grid' };
  }
}

export function offerPriceText(o: { priceType: string; price: number }, t: LangStrings): string {
  const p = o.price.toLocaleString('en-IN');
  if (o.priceType === 'perPlate') return t.svPricePerPlate.replace('{price}', p);
  if (o.priceType === 'from') return t.svFrom.replace('{price}', p);
  return `₹${p}`;
}

export type PublicServiceVendor = {
  id: string;
  name: string;
  category: ServiceCategory;
  area: string;
  city: string;
  traditions: string[];
  languages: string[];
  about: string;
  areas: string[];
  experienceYears: number;
  photos: string[];
  verified: boolean;
  fromPrice: number | null;
  offers?: Array<{ id: string; title: string; priceType: 'fixed' | 'perPlate' | 'from'; price: number; description: string }>;
};

export type MyServiceRequest = {
  id: string;
  code: string;
  category: ServiceCategory;
  vendorId: string;
  vendorName: string;
  eventDate: string;
  eventType: string;
  guests: number;
  area: string;
  message: string;
  offerTitle: string;
  fee: number;
  status: 'NEW' | 'CONTACTED' | 'CLOSED' | 'NO_RESPONSE';
  createdAt: string;
  refundStatus: 'none' | 'pending' | 'refunded';
  refundAmount: number;
};
