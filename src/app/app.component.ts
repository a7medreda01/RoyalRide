import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LanguageService, COMPANY_INFO } from './services/language.service';
import { LocationPoint, FleetItem, TourPackage, SearchQuery, BookingRecord, UserState } from './models/royalride.models';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  readonly langService = inject(LanguageService);
  readonly sanitizer = inject(DomSanitizer);
  readonly companyInfo = COMPANY_INFO;

  @ViewChild('invoiceContainer') invoiceContainer!: ElementRef<HTMLDivElement>;

  activeTab = signal<'home' | 'about' | 'services' | 'fleet' | 'tours' | 'contact' | 'profile'>('home');
  fleetCategoryFilter = signal<'all' | 'sedan' | 'van' | 'suv'>('all');

  // Search State & Dynamic Service Type
  searchQuery: SearchQuery = {
    serviceType: 'airport',
    pickupCity: 'مطار الملك عبدالعزيز الدولي - جدة (JED)',
    dropoffCity: 'فندق فيرمونت برج الساعة - مكة المكرمة',
    date: '2026-09-15',
    time: '14:30',
    passengers: 2,
    flightNumber: 'SV-1024',
    terminal: 'صالة 1 الفرسان VIP',
    meetAndGreet: true,
    hourlyDuration: 8,
    includeGuide: true,
    distanceKm: 98,
    estimatedMinutes: 65
  };

  // Popular Saudi Landmarks for Google Maps Pin Selection
  popularLocations: LocationPoint[] = [
    { nameAr: 'مطار الملك عبدالعزيز الدولي - جدة (JED)', nameEn: 'Jeddah King Abdulaziz Airport (JED)', lat: 21.6796, lng: 39.1565, type: 'airport' },
    { nameAr: 'فندق فيرمونت برج الساعة - مكة المكرمة', nameEn: 'Fairmont Makkah Clock Royal Tower', lat: 21.4187, lng: 39.8256, type: 'hotel' },
    { nameAr: 'مطار الملك خالد الدولي - الرياض (RUH)', nameEn: 'Riyadh King Khalid Airport (RUH)', lat: 24.9576, lng: 46.6988, type: 'airport' },
    { nameAr: 'برج المملكة وفاصل فورسيزونز - الرياض', nameEn: 'Kingdom Tower & Four Seasons Riyadh', lat: 24.7116, lng: 46.6744, type: 'landmark' },
    { nameAr: 'مطار الأمير عبدالمجيد بن عبدالعزيز - العلا (ULH)', nameEn: 'AlUla Airport (ULH)', lat: 26.4842, lng: 38.1292, type: 'airport' },
    { nameAr: 'منتجع ومبنى مرايا - العلا', nameEn: 'Maraya Hall & Resort AlUla', lat: 26.6214, lng: 37.9255, type: 'hotel' },
    { nameAr: 'مطار أبها الدولي - عسير (AHB)', nameEn: 'Abha International Airport (AHB)', lat: 18.2404, lng: 42.6566, type: 'airport' },
    { nameAr: 'فندق قصر أبها - الجبل الأخضر', nameEn: 'Abha Palace Hotel - Green Mountain', lat: 18.2167, lng: 42.5000, type: 'hotel' }
  ];

  // Map Controls State
  isSatelliteMode = false;
  activeMapTab = signal<'pickup' | 'dropoff'>('pickup');
  mapRouteKm = signal(98);
  mapRouteMins = signal(65);

  setServiceType(type: 'airport' | 'hourly' | 'tours'): void {
    this.searchQuery.serviceType = type;
    if (type === 'airport') {
      this.searchQuery.pickupCity = 'مطار الملك عبدالعزيز الدولي - جدة (JED)';
      this.searchQuery.dropoffCity = 'فندق فيرمونت برج الساعة - مكة المكرمة';
      this.searchQuery.flightNumber = 'SV-1024';
      this.searchQuery.terminal = 'صالة 1 الفرسان VIP';
      this.searchQuery.meetAndGreet = true;
      this.mapRouteKm.set(98);
      this.mapRouteMins.set(65);
    } else if (type === 'hourly') {
      this.searchQuery.pickupCity = 'فندق فورسيزونز - برج المملكة (الرياض)';
      this.searchQuery.dropoffCity = 'خدمة سائق متاح بالكامل داخل المدينة';
      this.searchQuery.hourlyDuration = 8;
      this.mapRouteKm.set(120);
      this.mapRouteMins.set(480);
    } else if (type === 'tours') {
      const tour = this.selectedTour() || this.tourPackages[0];
      this.searchQuery.pickupCity = 'مكان الإقامة / الفندق المقيم به';
      this.searchQuery.dropoffCity = tour.nameAr;
      this.searchQuery.includeGuide = true;
      this.mapRouteKm.set(180);
      this.mapRouteMins.set(120);
    }
  }

  selectPickupLocation(loc: LocationPoint): void {
    this.searchQuery.pickupCity = loc.nameAr;
    this.recalculateRoute();
  }

  selectDropoffLocation(loc: LocationPoint): void {
    this.searchQuery.dropoffCity = loc.nameAr;
    this.recalculateRoute();
  }

  swapLocations(): void {
    const temp = this.searchQuery.pickupCity;
    this.searchQuery.pickupCity = this.searchQuery.dropoffCity;
    this.searchQuery.dropoffCity = temp;
    this.recalculateRoute();
  }

  recalculateRoute(): void {
    if (this.searchQuery.pickupCity.includes('جدة') && this.searchQuery.dropoffCity.includes('مكة')) {
      this.mapRouteKm.set(98);
      this.mapRouteMins.set(65);
    } else if (this.searchQuery.pickupCity.includes('الرياض') || this.searchQuery.dropoffCity.includes('الرياض')) {
      this.mapRouteKm.set(42);
      this.mapRouteMins.set(35);
    } else if (this.searchQuery.pickupCity.includes('العلا') || this.searchQuery.dropoffCity.includes('العلا')) {
      this.mapRouteKm.set(65);
      this.mapRouteMins.set(50);
    } else {
      this.mapRouteKm.set(75);
      this.mapRouteMins.set(55);
    }
    this.searchQuery.distanceKm = this.mapRouteKm();
    this.searchQuery.estimatedMinutes = this.mapRouteMins();
  }

  getGoogleMapEmbedUrl(): SafeResourceUrl {
    const pickup = this.searchQuery.pickupCity || 'جدة';
    const dropoff = this.searchQuery.dropoffCity || 'مكة المكرمة';
    const query = encodeURIComponent(`${pickup} to ${dropoff}`);
    const url = `https://maps.google.com/maps?q=${query}&t=m&z=10&output=embed&iwloc=near`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  calculateTotalPrice(): { base: number; tax: number; total: number; breakdown: string } {
    let base = 950;
    let breakdown = '';

    if (this.searchQuery.serviceType === 'airport') {
      const carPrice = this.selectedCar() ? this.selectedCar()!.rateTransfer : 950;
      const meetFee = this.searchQuery.meetAndGreet ? 150 : 0;
      base = carPrice + meetFee;
      breakdown = this.langService.isRtl() ? 'توصيل مطار VIP' : 'VIP Airport Chauffeur';
    } else if (this.searchQuery.serviceType === 'hourly') {
      const hours = this.searchQuery.hourlyDuration || 8;
      const fullDayRate = this.selectedCar() ? this.selectedCar()!.rateFullDay12h : 3800;
      base = Math.round((fullDayRate / 12) * hours);
      breakdown = this.langService.isRtl() ? `حجز بالساعة (${hours} ساعات)` : `Hourly Chauffeur (${hours}h)`;
    } else if (this.searchQuery.serviceType === 'tours') {
      const tourPrice = this.selectedTour() ? this.selectedTour()!.price : 2400;
      const guideFee = this.searchQuery.includeGuide ? 350 : 0;
      base = tourPrice + guideFee;
      breakdown = this.selectedTour() ? (this.langService.isRtl() ? this.selectedTour()!.nameAr : this.selectedTour()!.nameEn) : (this.langService.isRtl() ? 'باقة سياحية VIP' : 'VIP Tour Package');
    }

    const tax = Math.round(base * 0.15);
    const total = base + tax;
    return { base, tax, total, breakdown };
  }

  // Fleet Data (8 Executive Luxury Vehicles)
  fleetList: FleetItem[] = [
    {
      id: 'rolls-royce-cullinan-bb',
      category: 'suv',
      name: 'Rolls-Royce Cullinan Black Badge',
      titleAr: 'رولز رويس كولينان بلاك بادج الملكية',
      titleEn: 'Rolls-Royce Cullinan Black Badge VIP',
      image: '/cullinan.jpg',
      passengers: 4,
      luggage: 4,
      rateTransfer: 1800,
      rateFullDay12h: 6500,
      specsAr: ['سقف الألماس النجمي Starlight Headliner', 'مقاعد جلدية مخصصة للقصور والأمراء', 'نظام عزل صوتي مطلق وسائق خبير شخصي'],
      specsEn: ['Iconic Starlight Headliner ceiling', 'Bespoke royal leather interior suite', 'Absolute acoustic soundproofing & private chauffeur']
    },
    {
      id: 'mercedes-maybach-s680',
      category: 'sedan',
      name: 'Mercedes-Maybach S-680',
      titleAr: 'مرسيدس مايباخ S-680 الدرجة الأولى',
      titleEn: 'Mercedes-Maybach S-680 First Class',
      image: '/hero.jpg',
      passengers: 3,
      luggage: 3,
      rateTransfer: 950,
      rateFullDay12h: 3800,
      specsAr: ['مقاعد مساج فردية مجهزة بالتدفئة والتبريد', 'ثلاجة ضيافة ونظام صوت Burmester 4D سينمائي', 'واي فاي فائق السرعة وسائق بلباس رسمي VIP'],
      specsEn: ['Executive heated & cooled massage seats', 'Burmester 4D Audio & hospitality fridge', 'High-speed Wi-Fi & suited executive chauffeur']
    },
    {
      id: 'range-rover-autobiography',
      category: 'suv',
      name: 'Range Rover Autobiography LWB',
      titleAr: 'رينج روفر أوتوبيوغرافي الفئة الطويلة',
      titleEn: 'Range Rover Autobiography LWB',
      image: '/range_rover.jpg',
      passengers: 4,
      luggage: 4,
      rateTransfer: 1200,
      rateFullDay12h: 4500,
      specsAr: ['هيئة ملكية فاخرة ومقاعد طيران درع رئاسي', 'نظام صوت Meridian Signature 3D استثنائي', 'استقبال خاص من مدرج المطار والطيران الخاص'],
      specsEn: ['Presidential jet-style seating & armor look', 'Meridian Signature 3D Surround sound', 'Private aviation tarmac pickup & concierge']
    },
    {
      id: 'mercedes-v-class-lounge',
      category: 'van',
      name: 'Mercedes V-Class VIP Lounge',
      titleAr: 'مرسيدس V-Class صالة كبار الشخصيات',
      titleEn: 'Mercedes V-Class VIP Executive Lounge',
      image: '/vclass.jpg',
      passengers: 6,
      luggage: 7,
      rateTransfer: 850,
      rateFullDay12h: 3200,
      specsAr: ['مقاعد جلدية مواجهة مع طاولة اجتماعات', 'شاشة تلفزيون ذكية وإضاءة سقف سيمفونية', 'مساحة رحبة للوفود الرسمية والعائلات VIP'],
      specsEn: ['Face-to-face leather seating & meeting desk', 'Smart TV screen & ambient ceiling lights', 'Spacious suite for VIP delegations & families']
    },
    {
      id: 'cadillac-escalade-xl',
      category: 'suv',
      name: 'Cadillac Escalade XL VIP',
      titleAr: 'كاديلك إسكاليد XL الرئاسية',
      titleEn: 'Cadillac Escalade XL Executive SUV',
      image: '/luxury_suv.jpg',
      passengers: 5,
      luggage: 6,
      rateTransfer: 900,
      rateFullDay12h: 3500,
      specsAr: ['دفع رباعي فاخر وهيئة ملكية مهيبة', 'نظام صوتي استوديوي AKG وشاشات خلفية', 'راحة مطلقة للسفر بين المدن والمطارات'],
      specsEn: ['Commanding presence & luxury AWD', 'AKG studio sound & rear entertainment displays', 'Supreme comfort for intercity & airport travel']
    },
    {
      id: 'lexus-lm-350h',
      category: 'van',
      name: 'Lexus LM 350h Ultra-Luxury',
      titleAr: 'لكزس LM 350h القصر المتنقل VIP',
      titleEn: 'Lexus LM 350h Ultra-Luxury VIP Van',
      image: '/lexus_lm.jpg',
      passengers: 4,
      luggage: 5,
      rateTransfer: 1100,
      rateFullDay12h: 4200,
      specsAr: ['شاشة عرض سينمائية قياس 48 بوصة مع جدار فاصل', 'ثلاجة ومقصورة خاصة كلياً لعزلة مطلقة', 'نظام صوت Mark Levinson 3D الفاخر'],
      specsEn: ['48-inch widescreen display with privacy partition', 'Private suite isolation & onboard mini-bar', 'Mark Levinson 3D Reference Surround Sound']
    },
    {
      id: 'bmw-7-series-limo',
      category: 'sedan',
      name: 'BMW 7 Series Excellence',
      titleAr: 'بي إم دبليو الفئة السابعة VIP',
      titleEn: 'BMW 7 Series VIP Excellence',
      image: '/chauffeur.jpg',
      passengers: 3,
      luggage: 3,
      rateTransfer: 750,
      rateFullDay12h: 3000,
      specsAr: ['شاشة سيزار خلفية عملاقة Theater Screen', 'نظام تعليق هوائي فائق النعومة', 'ضيافة قهوة عربية ومياه فاخرة مجانية'],
      specsEn: ['31-inch BMW Theater Screen in rear', 'Ultra-smooth adaptive air suspension', 'Complimentary Arabic coffee & VIP refreshments']
    },
    {
      id: 'porsche-panamera-exec',
      category: 'sedan',
      name: 'Porsche Panamera Executive',
      titleAr: 'بورشه باناميرا إكزيكتيف الرياضية',
      titleEn: 'Porsche Panamera Executive VIP',
      image: '/porsche.jpg',
      passengers: 3,
      luggage: 3,
      rateTransfer: 850,
      rateFullDay12h: 3400,
      specsAr: ['طراز التنفيذيين المميز بسقف بانورامي ومساحة خلفية', 'نظام صالون رياضي فخمBurmester High-End', 'قيادة سريعة وسلسة للتنقلات التنفيذية'],
      specsEn: ['Executive long-wheelbase with panoramic roof', 'Burmester High-End 3D Surround Sound', 'Dynamic VIP executive city & airport transfer']
    }
  ];

  // Tour Packages Data
  tourPackages: TourPackage[] = [
    {
      id: 'umrah-vip-package',
      category: 'umrah',
      nameAr: 'باقة العمرة والزيارة VIP الملكية',
      nameEn: 'Royal VIP Umrah & Ziyarat Package',
      durationAr: 'يوم كامل (12 ساعة)',
      durationEn: 'Full Day (12 Hours)',
      price: 2400,
      image: '/umrah_vip.jpg',
      descriptionAr: 'استقبال من مطار جدة (JED) والتنقل إلى الحرم المكي مع سائق خاص ينتظركم طوال فترة العمرة ومزارات مكة المكرمة.',
      descriptionEn: 'VIP Pickup from Jeddah Airport (JED) to Makkah Haram with dedicated chauffeur for Umrah and holy sites Ziyarat.',
      highlightsAr: ['سائق ذو خبرة بالطرق والمزارات المقررة', 'انتظار ممتد طوال فترة أداء العمرة', 'ضيافة ماء زمزم ومشروبات فاخرة', 'توصيل مباشر لأبواب الفنادق والأبراج'],
      highlightsEn: ['Experienced local chauffeur for Ziyarat', 'Flexible waiting time during Umrah rituals', 'Complimentary Zamzam water & drinks', 'Direct hotel & tower lobby drop-off']
    },
    {
      id: 'alula-heritage-tour',
      category: 'tourism',
      nameAr: 'جولة العلا التاريخية ومبنى مرايا',
      nameEn: 'AlUla Heritage & Maraya Private Tour',
      durationAr: '12 ساعة شاملة',
      durationEn: '12 Hours Full Tour',
      price: 3600,
      image: '/alula_maraya.jpg',
      descriptionAr: 'رحلة فاخرة لاستكشاف معالم العلا والجرُ ومرتفعات الحجر وجبل الفيل وقاعة مرايا مع سائق خاص خبير بالمنطقة.',
      descriptionEn: 'Luxury tour discovering Hegra, Elephant Rock, and Maraya Concert Hall with a private expert chauffeur.',
      highlightsAr: ['سيارة كاديلك إسكاليد XL أو مايباخ', 'جدول زيارات مرن حسب رغبتكم', 'مرشد سياحي خاص عند الطلب', 'خدمة واي فاي وضيافة ملكية onboard'],
      highlightsEn: ['Cadillac Escalade XL or Maybach', 'Customizable itinerary to your pace', 'Private VIP tour guide on demand', 'High-speed Wi-Fi & onboard hospitality']
    },
    {
      id: 'abha-asir-tour',
      category: 'tourism',
      nameAr: 'جولة أبها وعسير الخضراء',
      nameEn: 'Abha & Asir Green Mountain Explorer',
      durationAr: '10 ساعات',
      durationEn: '10 Hours Tour',
      price: 2800,
      image: '/abha_asir.jpg',
      descriptionAr: 'جولة استثنائية بين الجبل الأخضر ورجال ألمع ومرتفعات السودة بأسطول الدفع الرباعي الفاخر.',
      descriptionEn: 'Breathtaking tour across Green Mountain, Rijal Almaa, and Al Souda peaks in premium 4x4 vehicles.',
      highlightsAr: ['إطلالات بانورامية على قمم الجبال', 'زيارة قرية رجال ألمع التراثية', 'سائقين محترفين بطرق الجبال', 'تكييف وثلاجة ضيافة متكاملة'],
      highlightsEn: ['Panoramic mountain peak vistas', 'Historical Rijal Almaa heritage trip', 'Chauffeurs skilled in mountain roads', 'Full climate control & refreshments']
    },
    {
      id: 'red-sea-vip-resort',
      category: 'tourism',
      nameAr: 'تنقلات منتجعات البحر الأحمر VIP',
      nameEn: 'Red Sea Luxury Resorts VIP Transfer',
      durationAr: 'حسب الطلب',
      durationEn: 'Custom Transfer',
      price: 3200,
      image: '/red_sea_resort.jpg',
      descriptionAr: 'تنقل راقي وسلس من مطار البحر الأحمر الدولي (RSI) إلى أرقى الفنادق والمنتجعات العالمية.',
      descriptionEn: 'Seamless VIP chauffeur transfer from Red Sea International Airport (RSI) to luxury island resorts.',
      highlightsAr: ['استقبال VIP عند بوابات الوصول', 'مساحة واسعة لكافة الأمتعة والشنط', 'راحة وسرية تامة للشخصيات VIP', 'مرسيدس مايباخ أو صالة V-Class'],
      highlightsEn: ['Tarmac/Arrival gate VIP welcome', 'Ample luggage space for long stays', 'Maximum privacy for VIP guests', 'Mercedes-Maybach or V-Class Lounge']
    }
  ];

  // User State
  user = signal<UserState>({
    isLoggedIn: false,
    name: 'سعادة الشيخ / عبدالله السعد',
    phone: '+966 50 123 4567',
    tier: 'عضوية VIP الذهبية',
    bookings: [
      {
        id: 'bk-101',
        ref: 'RR-2026-8812',
        carName: 'Mercedes-Maybach S-680',
        serviceName: 'استقبال مطار الملك عبدالعزيز - جدة',
        date: '2026-09-02',
        time: '18:00',
        pickup: 'مطار الملك عبدالعزيز الدولي (JED)',
        dropoff: 'فندق فيرمونت برج الساعة - مكة',
        status: 'completed',
        amount: 950,
        taxAmount: 142.5,
        customerName: 'سعادة الشيخ / عبدالله السعد',
        customerPhone: '+966 50 123 4567',
        paymentMethod: 'Apple Pay'
      }
    ]
  });

  // Modals & Mobile Menu state
  isMobileMenuOpen = signal(false);
  isBookingModalOpen = signal(false);
  showAuthModal = signal(false);
  bookingStep = signal<number>(1);
  selectedCar = signal<FleetItem | null>(null);
  selectedTour = signal<TourPackage | null>(null);

  // Pending selection if user triggers booking before login
  pendingCar = signal<FleetItem | null>(null);
  pendingTour = signal<TourPackage | null>(null);

  // Auth Inputs
  inputAuthName = 'سعادة الشيخ / عبدالله السعد';
  inputAuthPhone = '+966 50 123 4567';
  otpCode = ['1', '2', '3', '4'];
  otpStep = signal<'phone' | 'otp'>('phone');

  // Booking Form Details
  passengerName = '';
  passengerPhone = '';
  flightNumber = 'SV-1024';
  chauffeurNotes = 'نرجو توفير مقعد أطفال وضيافة قهوة عربية';
  selectedPaymentMethod = 'applepay';
  currentBookingRef = signal('RR-2026-9842');
  currentInvoiceDate = signal('');
  isDownloadingPng = signal(false);

  // Contact Form
  contactForm = {
    name: '',
    phone: '',
    email: '',
    message: ''
  };
  contactSubmitted = signal(false);

  setActiveTab(tab: 'home' | 'about' | 'services' | 'fleet' | 'tours' | 'contact' | 'profile'): void {
    this.activeTab.set(tab);
    this.isMobileMenuOpen.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  setFleetFilter(cat: 'all' | 'sedan' | 'van' | 'suv'): void {
    this.fleetCategoryFilter.set(cat);
  }

  getFilteredFleet(): FleetItem[] {
    const filter = this.fleetCategoryFilter();
    if (filter === 'all') return this.fleetList;
    return this.fleetList.filter(item => item.category === filter);
  }

  openAuthModal(): void {
    this.otpStep.set('phone');
    this.showAuthModal.set(true);
  }

  closeAuthModal(): void {
    this.showAuthModal.set(false);
  }

  sendAuthOtp(): void {
    this.otpStep.set('otp');
  }

  confirmAuthOtp(): void {
    this.user.update(u => ({
      ...u,
      isLoggedIn: true,
      name: this.inputAuthName || u.name,
      phone: this.inputAuthPhone || u.phone
    }));
    this.showAuthModal.set(false);

    // Auto open booking flow if user triggered booking prior to login!
    if (this.pendingCar()) {
      const car = this.pendingCar();
      this.pendingCar.set(null);
      this.startBooking(car!);
    } else if (this.pendingTour()) {
      const tour = this.pendingTour();
      this.pendingTour.set(null);
      this.startTourBooking(tour!);
    }
  }

  startBooking(car?: FleetItem): void {
    const selected = car || this.fleetList[0];
    this.selectedCar.set(selected);
    this.selectedTour.set(null);

    // Mandate Login FIRST before starting booking!
    if (!this.user().isLoggedIn) {
      this.pendingCar.set(selected);
      this.openAuthModal();
      return;
    }

    this.passengerName = this.user().name;
    this.passengerPhone = this.user().phone;
    this.bookingStep.set(1);
    this.isBookingModalOpen.set(true);
  }

  startTourBooking(tour: TourPackage): void {
    this.selectedTour.set(tour);
    this.selectedCar.set(null);

    // Mandate Login FIRST before starting booking!
    if (!this.user().isLoggedIn) {
      this.pendingTour.set(tour);
      this.openAuthModal();
      return;
    }

    this.passengerName = this.user().name;
    this.passengerPhone = this.user().phone;
    this.bookingStep.set(1);
    this.isBookingModalOpen.set(true);
  }

  executeSearch(): void {
    if (!this.user().isLoggedIn) {
      this.pendingCar.set(this.fleetList[0]);
      this.openAuthModal();
      return;
    }
    this.setActiveTab('fleet');
    this.startBooking(this.fleetList[0]);
  }

  closeBookingModal(): void {
    this.isBookingModalOpen.set(false);
  }

  nextBookingStep(): void {
    const current = this.bookingStep();
    if (current < 4) {
      this.bookingStep.set(current + 1);
    }
  }

  prevBookingStep(): void {
    const current = this.bookingStep();
    if (current > 1) {
      this.bookingStep.set(current - 1);
    }
  }

  confirmPayment(): void {
    const newRef = `RR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    this.currentBookingRef.set(newRef);
    const today = new Date().toISOString().split('T')[0];
    this.currentInvoiceDate.set(today);

    const priceInfo = this.calculateTotalPrice();

    let serviceTitle = 'تنقلات ليموزين VIP';
    if (this.searchQuery.serviceType === 'airport') {
      serviceTitle = 'توصيل واستقبال مطار VIP';
    } else if (this.searchQuery.serviceType === 'hourly') {
      serviceTitle = `تأجير ليموزين بالساعة (${this.searchQuery.hourlyDuration || 8} ساعات)`;
    } else if (this.searchQuery.serviceType === 'tours') {
      serviceTitle = this.selectedTour() ? this.selectedTour()!.nameAr : 'جولة سياحية VIP';
    }

    const newRecord: BookingRecord = {
      id: `bk-${Date.now()}`,
      ref: newRef,
      carName: this.selectedCar() ? this.selectedCar()!.name : (this.selectedTour() ? this.selectedTour()!.nameAr : 'مرسيدس مايباخ S-680'),
      serviceName: serviceTitle,
      serviceType: this.searchQuery.serviceType,
      date: this.searchQuery.date,
      time: this.searchQuery.time,
      pickup: this.searchQuery.pickupCity,
      dropoff: this.searchQuery.dropoffCity,
      status: 'confirmed',
      amount: priceInfo.base,
      taxAmount: priceInfo.tax,
      customerName: this.passengerName || this.user().name,
      customerPhone: this.passengerPhone || this.user().phone,
      paymentMethod: this.selectedPaymentMethod === 'applepay' ? 'Apple Pay' : (this.selectedPaymentMethod === 'mada' ? 'مدى Mada' : 'بطاقة ائتمان'),
      flightNumber: this.searchQuery.serviceType === 'airport' ? (this.searchQuery.flightNumber || 'SV-1024') : undefined,
      hourlyDuration: this.searchQuery.serviceType === 'hourly' ? this.searchQuery.hourlyDuration : undefined,
      distanceKm: this.mapRouteKm(),
      meetAndGreet: this.searchQuery.meetAndGreet
    };

    this.user.update(u => ({
      ...u,
      bookings: [newRecord, ...u.bookings]
    }));

    this.bookingStep.set(4); // Show Invoice (Step 4)
  }

  downloadInvoicePng(): void {
    if (!this.invoiceContainer || !this.invoiceContainer.nativeElement) return;
    this.isDownloadingPng.set(true);

    const el = this.invoiceContainer.nativeElement;
    html2canvas(el, {
      scale: 2,
      backgroundColor: '#0A0C10',
      useCORS: true
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `ROYALRIDE-Invoice-${this.currentBookingRef()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      this.isDownloadingPng.set(false);
    }).catch(err => {
      console.error('Invoice image generation error:', err);
      this.isDownloadingPng.set(false);
    });
  }

  submitContactForm(): void {
    this.contactSubmitted.set(true);
    setTimeout(() => {
      this.contactSubmitted.set(false);
      this.contactForm = { name: '', phone: '', email: '', message: '' };
    }, 4000);
  }

  logout(): void {
    this.user.update(u => ({ ...u, isLoggedIn: false }));
    this.setActiveTab('home');
  }
}
