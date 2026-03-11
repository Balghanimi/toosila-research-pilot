# Iraqi Data Reference

## Cities (المدن العراقية)

### All 18 Governorates
```javascript
export const IRAQI_GOVERNORATES = [
  { id: 1, ar: 'بغداد', en: 'Baghdad', lat: 33.3152, lng: 44.3661 },
  { id: 2, ar: 'البصرة', en: 'Basra', lat: 30.5085, lng: 47.7804 },
  { id: 3, ar: 'نينوى', en: 'Nineveh', lat: 36.3350, lng: 43.1189 },
  { id: 4, ar: 'أربيل', en: 'Erbil', lat: 36.1901, lng: 44.0091 },
  { id: 5, ar: 'السليمانية', en: 'Sulaymaniyah', lat: 35.5613, lng: 45.4306 },
  { id: 6, ar: 'دهوك', en: 'Duhok', lat: 36.8669, lng: 42.9503 },
  { id: 7, ar: 'كركوك', en: 'Kirkuk', lat: 35.4681, lng: 44.3922 },
  { id: 8, ar: 'ديالى', en: 'Diyala', lat: 33.7733, lng: 45.1456 },
  { id: 9, ar: 'الأنبار', en: 'Anbar', lat: 33.4256, lng: 43.2989 },
  { id: 10, ar: 'بابل', en: 'Babylon', lat: 32.4683, lng: 44.4203 },
  { id: 11, ar: 'كربلاء', en: 'Karbala', lat: 32.6160, lng: 44.0246 },
  { id: 12, ar: 'النجف', en: 'Najaf', lat: 31.9907, lng: 44.3148 },
  { id: 13, ar: 'واسط', en: 'Wasit', lat: 32.5000, lng: 45.8333 },
  { id: 14, ar: 'صلاح الدين', en: 'Saladin', lat: 34.4672, lng: 43.5833 },
  { id: 15, ar: 'ذي قار', en: 'Dhi Qar', lat: 31.0439, lng: 46.2581 },
  { id: 16, ar: 'المثنى', en: 'Muthanna', lat: 29.9394, lng: 45.2981 },
  { id: 17, ar: 'القادسية', en: 'Qadisiyah', lat: 31.9897, lng: 44.9267 },
  { id: 18, ar: 'ميسان', en: 'Maysan', lat: 31.8389, lng: 47.1456 },
];
```

### Major Cities (Popular for rides)
```javascript
export const MAJOR_CITIES = [
  { ar: 'بغداد', en: 'Baghdad' },
  { ar: 'البصرة', en: 'Basra' },
  { ar: 'أربيل', en: 'Erbil' },
  { ar: 'الموصل', en: 'Mosul' },
  { ar: 'كربلاء', en: 'Karbala' },
  { ar: 'النجف', en: 'Najaf' },
  { ar: 'السليمانية', en: 'Sulaymaniyah' },
  { ar: 'دهوك', en: 'Duhok' },
  { ar: 'كركوك', en: 'Kirkuk' },
  { ar: 'الحلة', en: 'Hillah' },
  { ar: 'الناصرية', en: 'Nasiriyah' },
  { ar: 'العمارة', en: 'Amarah' },
  { ar: 'الكوت', en: 'Kut' },
  { ar: 'السماوة', en: 'Samawah' },
  { ar: 'الديوانية', en: 'Diwaniyah' },
  { ar: 'الرمادي', en: 'Ramadi' },
  { ar: 'بعقوبة', en: 'Baqubah' },
  { ar: 'تكريت', en: 'Tikrit' },
];
```

### Popular Routes (Common intercity rides)
```javascript
export const POPULAR_ROUTES = [
  { from: 'بغداد', to: 'البصرة', distance: 545, duration: '6h' },
  { from: 'بغداد', to: 'أربيل', distance: 350, duration: '4h' },
  { from: 'بغداد', to: 'كربلاء', distance: 100, duration: '1.5h' },
  { from: 'بغداد', to: 'النجف', distance: 160, duration: '2h' },
  { from: 'بغداد', to: 'الموصل', distance: 400, duration: '5h' },
  { from: 'كربلاء', to: 'النجف', distance: 80, duration: '1h' },
  { from: 'أربيل', to: 'السليمانية', distance: 160, duration: '2h' },
  { from: 'أربيل', to: 'دهوك', distance: 150, duration: '2h' },
  { from: 'البصرة', to: 'الناصرية', distance: 180, duration: '2.5h' },
];
```

---

## Currency (العملة)

### Iraqi Dinar (IQD)
```javascript
// Format price
export const formatPrice = (amount, locale = 'ar') => {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-IQ' : 'en-IQ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return locale === 'ar' ? `${formatted} د.ع` : `${formatted} IQD`;
};

// Examples:
// formatPrice(25000) → "٢٥٬٠٠٠ د.ع"
// formatPrice(25000, 'en') → "25,000 IQD"

// Common prices for rides
export const PRICE_RANGES = {
  shortDistance: { min: 10000, max: 25000 },   // < 100km
  mediumDistance: { min: 25000, max: 50000 },  // 100-300km
  longDistance: { min: 50000, max: 100000 },   // > 300km
};
```

---

## Phone Numbers (أرقام الهواتف)

### Iraqi Phone Format
```javascript
// Country code: +964
// Mobile prefixes: 77, 78, 79, 75 (Kurdistan)

export const PHONE_REGEX = /^(\+964|00964|0)?7[5789]\d{8}$/;

export const formatPhone = (phone) => {
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  
  // Remove leading 00 or 0
  if (digits.startsWith('00964')) digits = digits.slice(5);
  else if (digits.startsWith('964')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  
  // Format: +964 7XX XXX XXXX
  if (digits.length === 10) {
    return `+964 ${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`;
  }
  
  return phone;
};

// Examples:
// formatPhone('07701234567') → "+964 770 123 4567"
// formatPhone('+9647801234567') → "+964 780 123 4567"

// Mobile operators
export const OPERATORS = {
  '77': 'Asiacell',
  '78': 'Zain Iraq',
  '79': 'Korek',
  '75': 'Korek (Kurdistan)',
};
```

---

## Date & Time (التاريخ والوقت)

### Iraqi Timezone
```javascript
// Iraq uses Arabia Standard Time (AST) UTC+3
// No daylight saving time

export const IRAQ_TIMEZONE = 'Asia/Baghdad';

export const formatDate = (date, locale = 'ar') => {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-IQ' : 'en-IQ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatTime = (date, locale = 'ar') => {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-IQ' : 'en-IQ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
};

// Examples:
// formatDate('2024-01-15') → "الإثنين، ١٥ يناير ٢٠٢٤"
// formatTime('2024-01-15T08:30:00') → "٠٨:٣٠ ص"
```

---

## Payment Methods (طرق الدفع)

### Supported Payment Options
```javascript
export const PAYMENT_METHODS = [
  {
    id: 'cash',
    ar: 'نقداً',
    en: 'Cash',
    icon: '💵',
    available: true,
  },
  {
    id: 'zaincash',
    ar: 'زين كاش',
    en: 'ZainCash',
    icon: '📱',
    available: false, // Coming soon
    apiUrl: 'https://api.zaincash.iq',
  },
  {
    id: 'fastpay',
    ar: 'فاست باي',
    en: 'FastPay',
    icon: '💳',
    available: false, // Coming soon
  },
  {
    id: 'qi_card',
    ar: 'كي كارد',
    en: 'Qi Card',
    icon: '💳',
    available: false, // Coming soon
  },
];
```

---

## Translations (UI Text)

### Common UI Strings
```javascript
export const TRANSLATIONS = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.find': 'ابحث عن رحلة',
    'nav.offer': 'أضف رحلة',
    'nav.myRides': 'رحلاتي',
    'nav.messages': 'الرسائل',
    'nav.profile': 'الملف الشخصي',
    
    // Offers
    'offer.from': 'من',
    'offer.to': 'إلى',
    'offer.date': 'التاريخ',
    'offer.time': 'الوقت',
    'offer.seats': 'المقاعد',
    'offer.price': 'السعر',
    'offer.ladiesOnly': 'للنساء فقط',
    
    // Actions
    'action.book': 'احجز',
    'action.cancel': 'إلغاء',
    'action.confirm': 'تأكيد',
    'action.send': 'إرسال',
    'action.search': 'بحث',
    
    // Status
    'status.pending': 'قيد الانتظار',
    'status.accepted': 'مقبول',
    'status.rejected': 'مرفوض',
    'status.completed': 'مكتمل',
    'status.cancelled': 'ملغي',
    
    // Errors
    'error.generic': 'حدث خطأ، يرجى المحاولة مرة أخرى',
    'error.network': 'لا يوجد اتصال بالإنترنت',
    'error.unauthorized': 'يرجى تسجيل الدخول',
  },
  en: {
    'nav.home': 'Home',
    'nav.find': 'Find a Ride',
    'nav.offer': 'Offer a Ride',
    'nav.myRides': 'My Rides',
    'nav.messages': 'Messages',
    'nav.profile': 'Profile',
    // ... etc
  },
};
```

---

## Validation Rules

```javascript
export const VALIDATION = {
  phone: {
    pattern: /^(\+964|0)?7[5789]\d{8}$/,
    message: 'رقم الهاتف غير صحيح',
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[\u0600-\u06FFa-zA-Z\s]+$/,
    message: 'الاسم يجب أن يحتوي على حروف فقط',
  },
  price: {
    min: 1000,
    max: 500000,
    message: 'السعر يجب أن يكون بين 1,000 و 500,000 دينار',
  },
  seats: {
    min: 1,
    max: 7,
    message: 'عدد المقاعد يجب أن يكون بين 1 و 7',
  },
  message: {
    maxLength: 2000,
    message: 'الرسالة طويلة جداً',
  },
};
```
