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
      images: ['/cullinan.jpg', '/cullinan_interior.jpg', '/luxury_suv.jpg'],
      passengers: 4,
      luggage: 4,
      rateTransfer: 1800,
      rateFullDay12h: 6500,
      engineAr: 'محرّك 6.75L Twin-Turbocharged V12 بقوة 592 حصان',
      engineEn: '6.75L Twin-Turbocharged V12 (592 HP)',
      descriptionAr: 'قمة الفخامة الملكية البريطانية. تتميز بسقف الألماس النجمي المضيء والمقصورة المعزولة صوتياً بالكامل، مع سائق شخصي محترف بزي رسمي معتمد لضيوف القصور والوفود الملكية.',
      descriptionEn: 'The pinnacle of royal British luxury. Featuring the iconic glowing Starlight Headliner and absolute acoustic isolation.',
      specsAr: ['سقف الألماس النجمي Starlight Headliner', 'مقاعد جلدية مخصصة للقصور والأمراء', 'نظام عزل صوتي مطلق وسائق خبير شخصي'],
      specsEn: ['Iconic Starlight Headliner ceiling', 'Bespoke royal leather interior suite', 'Absolute acoustic soundproofing & private chauffeur'],
      featuresAr: ['سقف نجوم Starlight بـ 1344 ألياف ضوئية', 'أبواب كهربائية إغلاق ناعم Soft-Close', 'ثلاجة ضيافة وكؤوس كريستال خاصة', 'واي فاي فضائي فائق السرعة', 'سائق بلباس رسمي بروتوكولي'],
      featuresEn: ['1,344 optical fiber Starlight ceiling', 'Soft-close power automated doors', 'Hospitality fridge & crystal glasses', 'High-speed satellite Wi-Fi', 'Protocol suited private chauffeur']
    },
    {
      id: 'mercedes-maybach-s680',
      category: 'sedan',
      name: 'Mercedes-Maybach S-680',
      titleAr: 'مرسيدس مايباخ S-680 الدرجة الأولى',
      titleEn: 'Mercedes-Maybach S-680 First Class',
      image: '/hero.jpg',
      images: ['/hero.jpg', '/maybach_interior.jpg', '/maybach.jpg'],
      passengers: 3,
      luggage: 3,
      rateTransfer: 950,
      rateFullDay12h: 3800,
      engineAr: 'محرّك 6.0L V12 Biturbo بشاحنين توربينيين بقوة 621 حصان',
      engineEn: '6.0L V12 Biturbo (621 HP)',
      descriptionAr: 'طائرة الدرجة الأولى السائرة على الأرض. مقاعد مساج فردية مجهزة بالتدفئة والتبريد، ثلاجة ضيافة متكاملة مع كؤوس كريستال ونظام صوت سينمائي Burmester 4D.',
      descriptionEn: 'First Class jet experience on wheels. Executive heated and cooled massage recliners with Burmester 4D Surround Audio.',
      specsAr: ['مقاعد مساج فردية مجهزة بالتدفئة والتبريد', 'ثلاجة ضيافة ونظام صوت Burmester 4D سينمائي', 'واي فاي فائق السرعة وسائق بلباس رسمي VIP'],
      specsEn: ['Executive heated & cooled massage seats', 'Burmester 4D Audio & hospitality fridge', 'High-speed Wi-Fi & suited executive chauffeur'],
      featuresAr: ['مقاعد First Class مستلقية بدرجة 43.5', 'نظام صوت Burmester 4D ثلاثي الأبعاد 1750 واط', 'نظام عزل ضوضاء فعال ANC', 'إضاءة محيطية بـ 64 لوناً سيمفونياً', 'ضيافة مياه ومشروبات VIP مبردة'],
      featuresEn: ['First Class recliners up to 43.5 degrees', 'Burmester 4D 1750W Audio System', 'Active Noise Cancellation technology', '64-color ambient luxury lighting', 'Chilled VIP beverages & hospitality bar']
    },
    {
      id: 'range-rover-autobiography',
      category: 'suv',
      name: 'Range Rover Autobiography LWB',
      titleAr: 'رينج روفر أوتوبيوغرافي الفئة الطويلة',
      titleEn: 'Range Rover Autobiography LWB',
      image: '/range_rover.jpg',
      images: ['/range_rover.jpg', '/range_rover_interior.jpg', '/luxury_suv.jpg'],
      passengers: 4,
      luggage: 4,
      rateTransfer: 1200,
      rateFullDay12h: 4500,
      engineAr: 'محرّك 4.4L Twin-Turbo V8 بقوة 523 حصان مع نظام تعليق هوائي تكيّفي',
      engineEn: '4.4L Twin-Turbo V8 (523 HP) with adaptive air suspension',
      descriptionAr: 'الهيئة الملكية الأكثر مهابة لسفر المدن والمطارات والمواكب الخاصة. مقاعد طيران فاخرة ونظام صوت Meridian Signature 3D استثنائي.',
      descriptionEn: 'Commanding presence for royal motorcades and intercity travel with Meridian 3D Signature sound.',
      specsAr: ['هيئة ملكية فاخرة ومقاعد طيران درع رئاسي', 'نظام صوت Meridian Signature 3D استثنائي', 'استقبال خاص من مدرج المطار والطيران الخاص'],
      specsEn: ['Presidential jet-style seating & armor look', 'Meridian Signature 3D Surround sound', 'Private aviation tarmac pickup & concierge'],
      featuresAr: ['سقف بانورامي كريستالي كامل', 'مقاعد مساج الحجر الساخن Hot-Stone', 'نظام تنقية هواء المقصورة بقنية Nanoe X', 'استقبال خاص من مدرج المطار (Tarmac)', 'شاشات عرض خلفية 11.4 بوصة'],
      featuresEn: ['Full panoramic glass sunroof', 'Hot-stone massage executive seats', 'Nanoe X cabin air purification system', 'Private airport tarmac tarmac pickup', 'Dual 11.4-inch rear HD displays']
    },
    {
      id: 'mercedes-v-class-lounge',
      category: 'van',
      name: 'Mercedes V-Class VIP Lounge',
      titleAr: 'مرسيدس V-Class صالة كبار الشخصيات',
      titleEn: 'Mercedes V-Class VIP Executive Lounge',
      image: '/vclass.jpg',
      images: ['/vclass.jpg', '/vclass_ext.jpg', '/ambient_interior.jpg'],
      passengers: 6,
      luggage: 7,
      rateTransfer: 850,
      rateFullDay12h: 3200,
      engineAr: 'محرّك 2.0L Turbo Diesel فائق الهدوء والاقتصادية',
      engineEn: '2.0L Ultra-quiet Turbocharged Diesel',
      descriptionAr: 'جناح صالة الاجتماعات المتنقل لكبار الشخصيات والعائلات الملكية. مقاعد جلدية مواجهة، طاولة خشبية مدمجة، شاشة تلفزيون ذكية وإضاءة سقف سيمفونية.',
      descriptionEn: 'Mobile VIP meeting suite for executive delegations and families with face-to-face seating & smart TV.',
      specsAr: ['مقاعد جلدية مواجهة مع طاولة اجتماعات', 'شاشة تلفزيون ذكية وإضاءة سقف سيمفونية', 'مساحة رحبة للوفود الرسمية والعائلات VIP'],
      specsEn: ['Face-to-face leather seating & meeting desk', 'Smart TV screen & ambient ceiling lights', 'Spacious suite for VIP delegations & families'],
      featuresAr: ['صالون اجتماعات بمقاعد مواجهة (Conference)', 'طاولة أعمال خشبية قابلة للطي', 'شاشة ذكية Smart TV 32 بوصة', 'منفذ كهرباء 220V لشحن الكمبيوتر', 'ثلاجة مدمجة وضيافة قهوة وشاي'],
      featuresEn: ['Face-to-face conference seating suite', 'Foldable mahogany executive workdesk', '32-inch Smart TV with Apple TV', '220V power outlets for laptops', 'Mini-fridge with coffee & tea station']
    },
    {
      id: 'cadillac-escalade-xl',
      category: 'suv',
      name: 'Cadillac Escalade XL VIP',
      titleAr: 'كاديلك إسكاليد XL الرئاسية',
      titleEn: 'Cadillac Escalade XL Executive SUV',
      image: '/luxury_suv.jpg',
      images: ['/luxury_suv.jpg', '/cullinan.jpg', '/ambient_interior.jpg'],
      passengers: 5,
      luggage: 6,
      rateTransfer: 900,
      rateFullDay12h: 3500,
      engineAr: 'محرّك 6.2L V8 بقوة 420 حصان ونظام دفع رباعي ذكي AWD',
      engineEn: '6.2L V8 (420 HP) with Intelligent AWD',
      descriptionAr: 'الفخامة الأمريكية الرئاسية في أبهى صورها. مساحة رحبة تتسع لـ 5 ركاب و6 حقائب كبيرة مع نظام صوت AKG Studio 3D وشاشات خلفية.',
      descriptionEn: 'Presidential American luxury with generous space for 5 guests and 6 large luggage cases.',
      specsAr: ['دفع رباعي فاخر وهيئة ملكية مهيبة', 'نظام صوتي استوديوي AKG وشاشات خلفية', 'راحة مطلقة للسفر بين المدن والمطارات'],
      specsEn: ['Commanding presence & luxury AWD', 'AKG studio sound & rear entertainment displays', 'Supreme comfort for intercity & airport travel'],
      featuresAr: ['نظام صوت AKG Studio 36 مكبر صوت', 'شاشة منحنية OLED قياس 38 بوصة للسائق', 'مقاعد صف ثاني الكابتن منفصلة', 'سعة شنط هائلة للأمتعة الثقيلة', 'تعليق مائي مانع للاهتزازات'],
      featuresEn: ['36-speaker AKG Studio Reference Audio', '38-inch curved OLED driver display', 'Second-row Captain Recliner chairs', 'Massive luggage cargo capacity', 'Air Ride Adaptive Suspension']
    },
    {
      id: 'lexus-lm-350h',
      category: 'van',
      name: 'Lexus LM 350h Ultra-Luxury',
      titleAr: 'لكزس LM 350h القصر المتنقل VIP',
      titleEn: 'Lexus LM 350h Ultra-Luxury VIP Van',
      image: '/lexus_lm.jpg',
      images: ['/lexus_lm.jpg', '/vclass.jpg', '/ambient_interior.jpg'],
      passengers: 4,
      luggage: 5,
      rateTransfer: 1100,
      rateFullDay12h: 4200,
      engineAr: 'محرّك 2.5L Self-Charging Hybrid فاخر مع دفع رباعي E-Four',
      engineEn: '2.5L Self-Charging Hybrid with E-Four AWD',
      descriptionAr: 'القصر الياباني المتنقل المزود بشاشة عرض 48 بوصة وجدار فاصل زجاجي للخصوصية التامة وثلاجة مشروبات ضيافة VIP.',
      descriptionEn: 'Ultra-luxury mobile palace with a 48-inch partition display, private isolation suite, and mini-bar.',
      specsAr: ['شاشة عرض سينمائية قياس 48 بوصة مع جدار فاصل', 'ثلاجة ومقصورة خاصة كلياً لعزلة مطلقة', 'نظام صوت Mark Levinson 3D الفاخر'],
      specsEn: ['48-inch widescreen display with privacy partition', 'Private suite isolation & onboard mini-bar', 'Mark Levinson 3D Reference Surround Sound'],
      featuresAr: ['شاشة سينمائية 48 بوصة فائقة الاتساع', 'لوح زجاجي فاصل مع خاصية التعتيم الذكي', 'مقاعد Ottoman مساج متطورة بالكامل', 'نظام صوت Mark Levinson 23 سماعة', 'ثلاجة بسعة 14 ليتر مضاءة'],
      featuresEn: ['48-inch ultra-wide cinema display', 'Smart electrochromic privacy glass wall', 'Advanced fully reclining Ottoman seats', 'Mark Levinson 23-speaker 3D Sound', '14-liter illuminated refreshment bar']
    },
    {
      id: 'bmw-7-series-limo',
      category: 'sedan',
      name: 'BMW 7 Series Excellence',
      titleAr: 'بي إم دبليو الفئة السابعة VIP',
      titleEn: 'BMW 7 Series VIP Excellence',
      image: '/chauffeur.jpg',
      images: ['/chauffeur.jpg', '/hero.jpg', '/maybach.jpg'],
      passengers: 3,
      luggage: 3,
      rateTransfer: 750,
      rateFullDay12h: 3000,
      engineAr: 'محرّك 4.4L BMW TwinPower Turbo V8 بقوة 536 حصان',
      engineEn: '4.4L BMW TwinPower Turbo V8 (536 HP)',
      descriptionAr: 'السيارة التنفيذية الألمانية الأكثر تطوراً. تتميز بشاشة Theatre Screen خلفية عملاقة قياس 31 بوصة بدقة 8K وسقف بانورامي كريستالي.',
      descriptionEn: 'State-of-the-art German executive sedan with a massive 31-inch 8K BMW Theater Screen.',
      specsAr: ['شاشة سيزار خلفية عملاقة Theater Screen', 'نظام تعليق هوائي فائق النعومة', 'ضيافة قهوة عربية ومياه فاخرة مجانية'],
      specsEn: ['31-inch BMW Theater Screen in rear', 'Ultra-smooth adaptive air suspension', 'Complimentary Arabic coffee & VIP refreshments'],
      featuresAr: ['شاشة BMW Theater Screen قياس 31.3 بوصة 8K', 'أبواب أوتوماتيكية تفتح وتغلق باللمس', 'نظام صوت Bowers & Wilkins Diamond 4D', 'إضاءة كريستالية Interaction Bar', 'تحكم بشاشات لمس في الأبواب الخلفية'],
      featuresEn: ['31.3-inch 8K BMW Theater Screen', 'Automatic touch-activated power doors', 'Bowers & Wilkins Diamond 4D Sound', 'Crystal Interaction Bar lighting', 'Rear door integrated Touch Command screens']
    },
    {
      id: 'porsche-panamera-exec',
      category: 'sedan',
      name: 'Porsche Panamera Executive',
      titleAr: 'بورشه باناميرا إكزيكتيف الرياضية',
      titleEn: 'Porsche Panamera Executive VIP',
      image: '/porsche.jpg',
      images: ['/porsche.jpg', '/hero.jpg', '/maybach_interior.jpg'],
      passengers: 3,
      luggage: 3,
      rateTransfer: 850,
      rateFullDay12h: 3400,
      engineAr: 'محرّك 2.9L Twin-Turbo V6 بقوة 325 حصان ونظام قيادة هيدروليكي ذكي',
      engineEn: '2.9L Twin-Turbo V6 (325 HP) with executive air chassis',
      descriptionAr: 'الرياضية التنفيذية ذات القعدة الخلفية الممتدة. تجمع بين الأداء الرياضي الألماني وراحة الركوب الاستثنائية لرجال الأعمال.',
      descriptionEn: 'Executive long-wheelbase sports sedan combining German performance with supreme rear passenger luxury.',
      specsAr: ['طراز التنفيذيين المميز بسقف بانورامي ومساحة خلفية', 'نظام صالون رياضي فخمBurmester High-End', 'قيادة سريعة وسلسة للتنقلات التنفيذية'],
      specsEn: ['Executive long-wheelbase with panoramic roof', 'Burmester High-End 3D Surround Sound', 'Dynamic VIP executive city & airport transfer'],
      featuresAr: ['قاعدة عجلات ممتدة لمساحة أقدام مضاعفة', 'نظام تعليق بوريشه المتكيف PASM', 'مقاعد رياضية جلدية كهربائية 14 اتجاه', 'نظام صوت Burmester High-End 3D', 'تكييف رباعي المناطق مستقل للركاب'],
      featuresEn: ['Long wheelbase extended rear legroom', 'Porsche Active Suspension (PASM)', '14-way power executive leather seats', 'Burmester High-End 3D Surround', '4-zone automatic climate control']
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
      images: ['/umrah_vip.jpg', '/hero.jpg', '/ambient_interior.jpg'],
      descriptionAr: 'استقبال من مطار جدة (JED) والتنقل إلى الحرم المكي مع سائق خاص ينتظركم طوال فترة العمرة ومزارات مكة المكرمة.',
      descriptionEn: 'VIP Pickup from Jeddah Airport (JED) to Makkah Haram with dedicated chauffeur for Umrah and holy sites Ziyarat.',
      highlightsAr: ['سائق ذو خبرة بالطرق والمزارات المقررة', 'انتظار ممتد طوال فترة أداء العمرة', 'ضيافة ماء زمزم ومشروبات فاخرة', 'توصيل مباشر لأبواب الفنادق والأبراج'],
      highlightsEn: ['Experienced local chauffeur for Ziyarat', 'Flexible waiting time during Umrah rituals', 'Complimentary Zamzam water & drinks', 'Direct hotel & tower lobby drop-off'],
      includesAr: ['استقبال وتوديع من مطار جدة JED', 'سائق خاص بلباس رسمي طوال 12 ساعة', 'ضيافة ماء زمزم مبارك بعبوات مبردة', 'توصيل مباشر لأبواب أبراج الحرم'],
      includesEn: ['Jeddah Airport JED pickup & drop-off', 'Dedicated 12h suited chauffeur', 'Chilled Zamzam holy water hospitality', 'Direct hotel & Haram tower access']
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
      images: ['/alula_maraya.jpg', '/luxury_suv.jpg', '/ambient_interior.jpg'],
      descriptionAr: 'رحلة فاخرة لاستكشاف معالم العلا والجرُ ومرتفعات الحجر وجبل الفيل وقاعة مرايا مع سائق خاص خبير بالمنطقة.',
      descriptionEn: 'Luxury tour discovering Hegra, Elephant Rock, and Maraya Concert Hall with a private expert chauffeur.',
      highlightsAr: ['سيارة كاديلك إسكاليد XL أو مايباخ', 'جدول زيارات مرن حسب رغبتكم', 'مرشد سياحي خاص عند الطلب', 'خدمة واي فاي وضيافة ملكية onboard'],
      highlightsEn: ['Cadillac Escalade XL or Maybach', 'Customizable itinerary to your pace', 'Private VIP tour guide on demand', 'High-speed Wi-Fi & onboard hospitality'],
      includesAr: ['سيارة دفع رباعي رئاسية Cadillac / Maybach', 'سائق خبير بمعالم ومسارات العلا', 'تصاريح دخول قاعة مرايا والجَر', 'واي فاي وضيافة فاخرة طوال الرحلة'],
      includesEn: ['Luxury SUV Cadillac / Maybach', 'Local AlUla expert chauffeur', 'Maraya Hall & Hegra entry passes', 'High-speed Wi-Fi & onboard drinks']
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
      images: ['/abha_asir.jpg', '/range_rover.jpg', '/ambient_interior.jpg'],
      descriptionAr: 'جولة استثنائية بين الجبل الأخضر ورجال ألمع ومرتفعات السودة بأسطول الدفع الرباعي الفاخر.',
      descriptionEn: 'Breathtaking tour across Green Mountain, Rijal Almaa, and Al Souda peaks in premium 4x4 vehicles.',
      highlightsAr: ['إطلالات بانورامية على قمم الجبال', 'زيارة قرية رجال ألمع التراثية', 'سائقين محترفين بطرق الجبال', 'تكييف وثلاجة ضيافة متكاملة'],
      highlightsEn: ['Panoramic mountain peak vistas', 'Historical Rijal Almaa heritage trip', 'Chauffeurs skilled in mountain roads', 'Full climate control & refreshments'],
      includesAr: ['جولة مرتفعات السودة ورجال ألمع', 'سيارة دفع رباعي فارهة Range Rover / Escalade', 'سائق محترف بمسارات الجبال', 'ضيافة فواكه موسمية ومشروبات VIP'],
      includesEn: ['Al Souda & Rijal Almaa tour', 'Luxury 4x4 Range Rover / Escalade', 'Mountain road specialist chauffeur', 'Seasonal fruits & drinks hospitality']
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
      images: ['/red_sea_resort.jpg', '/maybach.jpg', '/vclass.jpg'],
      descriptionAr: 'تنقل راقي وسلس من مطار البحر الأحمر الدولي (RSI) إلى أرقى الفنادق والمنتجعات العالمية.',
      descriptionEn: 'Seamless VIP chauffeur transfer from Red Sea International Airport (RSI) to luxury island resorts.',
      highlightsAr: ['استقبال VIP عند بوابات الوصول', 'مساحة واسعة لكافة الأمتعة والشنط', 'راحة وسرية تامة للشخصيات VIP', 'مرسيدس مايباخ أو صالة V-Class'],
      highlightsEn: ['Tarmac/Arrival gate VIP welcome', 'Ample luggage space for long stays', 'Maximum privacy for VIP guests', 'Mercedes-Maybach or V-Class Lounge'],
      includesAr: ['توصيل من وإلى مطار البحر الأحمر RSI', 'خيارات مايباخ S680 أو صالة V-Class', 'خدمة حمال الأمتعة والاستقبال الخاصة', 'إنترنت سريع وضيافة باردة'],
      includesEn: ['RSI Airport roundtrip transfer', 'Maybach S680 or V-Class Lounge options', 'VIP luggage porter & greeting service', 'Fast Wi-Fi & cold refreshments']
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

  // Detail Modals state
  selectedVehicleDetail = signal<FleetItem | null>(null);
  selectedTourDetail = signal<TourPackage | null>(null);
  activeDetailImageIndex = signal<number>(0);

  openVehicleDetail(car: FleetItem): void {
    this.selectedVehicleDetail.set(car);
    this.activeDetailImageIndex.set(0);
  }

  closeVehicleDetail(): void {
    this.selectedVehicleDetail.set(null);
  }

  openTourDetail(tour: TourPackage): void {
    this.selectedTourDetail.set(tour);
    this.activeDetailImageIndex.set(0);
  }

  closeTourDetail(): void {
    this.selectedTourDetail.set(null);
  }

  setDetailImageIndex(idx: number): void {
    this.activeDetailImageIndex.set(idx);
  }

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
    let list = this.fleetList;
    if (filter !== 'all') {
      list = list.filter(item => item.category === filter);
    }
    if (this.isSearchResultsActive() && this.searchQuery.passengers > 0) {
      list = list.filter(item => item.passengers >= this.searchQuery.passengers);
    }
    return list;
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

  // Availability Engine State
  availabilityStatus = signal<{
    isAvailable: boolean;
    nearestTime?: string;
    messageAr?: string;
    messageEn?: string;
  }>({ isAvailable: true });

  checkVehicleAvailability(): void {
    const car = this.selectedCar();
    const time = this.searchQuery.time || '14:30';
    if (time === '18:00' || time === '12:00' || time === '09:00') {
      const nearest = time === '18:00' ? '19:30' : (time === '12:00' ? '13:30' : '10:30');
      this.availabilityStatus.set({
        isAvailable: false,
        nearestTime: nearest,
        messageAr: `⚠️ نعتذر، ${car ? car.titleAr : 'السيارة المختارة'} مشغولة في التوقيت (${time}). أقرب توقيت متوفر اليوم: (${nearest})`,
        messageEn: `⚠️ Sorry, ${car ? car.name : 'Vehicle'} is busy at (${time}). Nearest available slot today: (${nearest})`
      });
    } else {
      this.availabilityStatus.set({
        isAvailable: true,
        messageAr: `✔ السيارة متوفرة ومتاحة للحجز الفوري في توقيت ${time}`,
        messageEn: `✔ Vehicle is available for immediate booking at ${time}`
      });
    }
  }

  applyNearestAvailableTime(): void {
    const nearest = this.availabilityStatus().nearestTime;
    if (nearest) {
      this.searchQuery.time = nearest;
      this.checkVehicleAvailability();
    }
  }

  startBooking(car?: FleetItem): void {
    const selected = car || this.fleetList[0];
    this.selectedCar.set(selected);
    this.selectedTour.set(null);
    this.checkVehicleAvailability();

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

  isSearchResultsActive = signal(false);

  executeSearch(): void {
    this.isSearchResultsActive.set(true);
    this.checkVehicleAvailability();
    this.setActiveTab('fleet');
  }

  clearSearchFilter(): void {
    this.isSearchResultsActive.set(false);
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

  // Location Pointer GPS Action
  useCurrentLocation(type: 'pickup' | 'dropoff'): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const locStr = `الموقع الحالي (GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
          if (type === 'pickup') {
            this.searchQuery.pickupCity = locStr;
          } else {
            this.searchQuery.dropoffCity = locStr;
          }
          this.recalculateRoute();
        },
        () => {
          const locStr = type === 'pickup' ? 'موقعي الحالي - جدة (GPS)' : 'موقعي الحالي - مكة المكرمة (GPS)';
          if (type === 'pickup') {
            this.searchQuery.pickupCity = locStr;
          } else {
            this.searchQuery.dropoffCity = locStr;
          }
          this.recalculateRoute();
        }
      );
    } else {
      const locStr = type === 'pickup' ? 'موقعي الحالي - جدة (GPS)' : 'موقعي الحالي - مكة المكرمة (GPS)';
      if (type === 'pickup') {
        this.searchQuery.pickupCity = locStr;
      } else {
        this.searchQuery.dropoffCity = locStr;
      }
      this.recalculateRoute();
    }
  }

  // Booking Record Detail & Management State
  selectedBookingRecord = signal<BookingRecord | null>(null);
  isEditBookingMode = signal<boolean>(false);
  editBookingDate = '';
  editBookingTime = '';
  editChauffeurNotes = '';

  openBookingDetail(record: BookingRecord): void {
    this.selectedBookingRecord.set(record);
    this.isEditBookingMode.set(false);
    this.editBookingDate = record.date;
    this.editBookingTime = record.time;
    this.editChauffeurNotes = 'توفير سائق خبير ومشروبات مبردة';
  }

  closeBookingDetail(): void {
    this.selectedBookingRecord.set(null);
    this.isEditBookingMode.set(false);
  }

  enableEditBooking(): void {
    this.isEditBookingMode.set(true);
  }

  saveBookingChanges(): void {
    if (!this.selectedBookingRecord()) return;
    const current = this.selectedBookingRecord()!;
    const updated: BookingRecord = {
      ...current,
      date: this.editBookingDate,
      time: this.editBookingTime
    };

    this.user.update(u => ({
      ...u,
      bookings: u.bookings.map(b => b.id === current.id ? updated : b)
    }));

    this.selectedBookingRecord.set(updated);
    this.isEditBookingMode.set(false);
  }

  cancelUserBooking(bookingId: string): void {
    this.user.update(u => ({
      ...u,
      bookings: u.bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
    }));
    if (this.selectedBookingRecord() && this.selectedBookingRecord()!.id === bookingId) {
      this.selectedBookingRecord.update(b => b ? { ...b, status: 'cancelled' } : null);
    }
  }

  logout(): void {
    this.user.update(u => ({ ...u, isLoggedIn: false }));
    this.setActiveTab('home');
  }
}
