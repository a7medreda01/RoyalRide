export interface FleetItem {
  id: string;
  category: 'sedan' | 'van' | 'suv';
  name: string;
  titleAr: string;
  titleEn: string;
  image: string;
  passengers: number;
  luggage: number;
  rateTransfer: number;
  rateFullDay12h: number;
  specsAr: string[];
  specsEn: string[];
}

export interface TourPackage {
  id: string;
  category: 'umrah' | 'tourism' | 'corporate';
  nameAr: string;
  nameEn: string;
  durationAr: string;
  durationEn: string;
  price: number;
  image: string;
  descriptionAr: string;
  descriptionEn: string;
  highlightsAr: string[];
  highlightsEn: string[];
}

export interface LocationPoint {
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  type: 'airport' | 'hotel' | 'landmark';
}

export interface SearchQuery {
  serviceType: 'airport' | 'hourly' | 'tours';
  pickupCity: string;
  dropoffCity: string;
  date: string;
  time: string;
  passengers: number;
  // Dynamic fields
  flightNumber?: string;
  terminal?: string;
  meetAndGreet?: boolean;
  hourlyDuration?: number; // 4, 8, 12, 24 hours
  selectedTourId?: string;
  includeGuide?: boolean;
  distanceKm?: number;
  estimatedMinutes?: number;
}

export interface BookingRecord {
  id: string;
  ref: string;
  carName: string;
  serviceName: string;
  serviceType?: 'airport' | 'hourly' | 'tours';
  date: string;
  time: string;
  pickup: string;
  dropoff: string;
  status: 'confirmed' | 'pending' | 'completed';
  amount: number;
  taxAmount: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  // Specific service details
  flightNumber?: string;
  hourlyDuration?: number;
  distanceKm?: number;
  meetAndGreet?: boolean;
}

export interface UserState {
  isLoggedIn: boolean;
  name: string;
  phone: string;
  tier: string;
  bookings: BookingRecord[];
}

export interface CompanyInfo {
  legalNameAr: string;
  legalNameEn: string;
  brandAr: string;
  brandEn: string;
  phone1: string;
  phone1Raw: string;
  phone2: string;
  phone2Raw: string;
  whatsapp: string;
  whatsappUrl: string;
  instagram: string;
  instagramUrl: string;
  tiktok: string;
  tiktokUrl: string;
  taxId: string;
  citiesAr: string[];
  citiesEn: string[];
}
