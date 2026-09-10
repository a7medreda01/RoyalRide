import { Injectable, signal, computed } from '@angular/core';
import { CompanyInfo } from '../models/royalride.models';

export const COMPANY_INFO: CompanyInfo = {
  legalNameAr: 'مؤسسة مزون خالد عبدالله محمد لخدمات النقل',
  legalNameEn: 'Mazon Khaled Abdullah Muhammad Transport Co.',
  brandAr: 'ROYALRIDE (الرحلة الملكية)',
  brandEn: 'ROYALRIDE (Royal Limousine & Chauffeur)',
  phone1: '+966 56 903 8515',
  phone1Raw: '966569038515',
  phone2: '+966 54 004 7550',
  phone2Raw: '966540047550',
  whatsapp: '+966 56 903 8515',
  whatsappUrl: 'https://wa.me/966569038515',
  instagram: 'royal_ride97',
  instagramUrl: 'https://www.instagram.com/royal_ride97',
  tiktok: 'royalride.',
  tiktokUrl: 'https://www.tiktok.com/@royalride.',
  taxId: '310984920400003',
  citiesAr: ['جدة', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'العلا', 'البحر الأحمر', 'أبها وعسير', 'الرياض'],
  citiesEn: ['Jeddah', 'Makkah', 'Madinah', 'Taif', 'AlUla', 'Red Sea Project', 'Abha & Asir', 'Riyadh']
};

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly currentLang = signal<'ar' | 'en'>('ar');

  readonly isRtl = computed(() => this.currentLang() === 'ar');
  readonly companyInfo = COMPANY_INFO;

  toggleLanguage(): void {
    const nextLang = this.currentLang() === 'ar' ? 'en' : 'ar';
    this.currentLang.set(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  }
}
