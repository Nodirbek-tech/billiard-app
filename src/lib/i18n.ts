// Uzbek Latin translations and status mappings
// Database values remain unchanged - this file only maps display text

export const translations = {
  // Navigation
  nav: {
    tables: 'Stollar',
    dashboard: 'Statistika',
    sessions: 'Sessiyalar',
    orders: 'Buyurtmalar',
    products: 'Mahsulotlar',
    payments: "To'lovlar",
    reports: 'Hisobotlar',
    settings: 'Sozlamalar',
  },

  // Status display (database values: available, occupied, active, completed, cancelled)
  status: {
    available: "BO'SH",
    occupied: 'BAND',
    active: 'FAOL',
    completed: 'YAKUNLANGAN',
    cancelled: 'BEKOR QILINDAN',
  },

  // Payment methods (database: cash, card, mixed)
  payment: {
    cash: 'Naqd',
    card: 'Karta',
    mixed: 'Aralash',
  },

  // Common actions
  actions: {
    start: 'Boshlash',
    stop: 'Yakunlash',
    nextRound: "Keyingi o'yin",
    addProduct: "Mahsulot qo'shish",
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    edit: 'Tahrirlash',
    delete: "O'chirish",
    print: 'Chop etish',
    close: 'Yopish',
    confirm: 'Tasdiqlash',
    add: 'Qo\'shish',
    search: 'Qidirish',
    back: 'Orqaga',
  },

  // Billings
  billing: {
    total: 'Jami',
    grandTotal: 'Umumiy jami',
    playCost: "O'yin narxi",
    productsCost: 'Mahsulotlar narxi',
    productsTotal: 'Mahsulotlar jami',
    barOrders: 'Bar buyurtmalari',
    duration: 'Davomiylik',
    startTime: 'Boshlanish vaqti',
    endTime: 'Yakunlanish vaqti',
    receipt: 'Chek',
    receiptNumber: 'Chek raqami',
    date: 'Sana',
    table: 'Stol',
    customer: 'Mijoz',
    paymentMethod: "To'lov turi",
  },

  // Rounds
  rounds: {
    round: "O'yin",
    rounds: "O'yinlar",
    currentRound: "Joriy o'yin",
    roundHistory: "O'yinlar tarixi",
  },

  // Common labels
  labels: {
    tables: 'Stollar',
    sessions: 'Sessiyalar',
    active: 'Faol',
    completed: 'Yakunlangan',
    manageTableSessions: 'Stol sessiyalarini boshqarish',
    sessionHistory: 'Sessiya tarixi',
    productOrders: "Mahsulot buyurtmalari",
    billingInfo: 'Toʻlov maʼlumotlari',
    businessSettings: 'Biznes sozlamalari',
    businessName: 'Biznes nomi',
    dayRate: 'Kunduzgi tariff (UZS/soat)',
    nightRate: 'Tungi tariff (UZS/soat)',
    currency: 'Valyuta',
    lowStockThreshold: 'Past zaxira chegarasi',
    receiptFooter: 'Chekka izoh',
  },

  // Empty states
  empty: {
    noSessions: 'Sessiyalar topilmadi',
    noOrders: 'Buyurtmalar topilmadi',
    noProducts: 'Mahsulotlar topilmadi',
    noPayments: "To'lovlar topilmadi",
  },

  // Messages
  messages: {
    sessionStarted: "Sessiya boshlab yuborildi - O'yin 1 faol",
    roundStarted: 'O\'yin boshlab yuborildi',
    processingStop: 'Qayta ishlash...',
    confirmGenerateReceipt: 'Tasdiqlash va chekni yaratish',
    backToTables: 'Stollariga qaytish',
    thankYou: 'Rahmat! Yana keling!',
  },

  // Rates
  rates: {
    dayRate: 'Kunduzgi tariff',
    nightRate: 'Tungi tariff',
  },

  // Status badges in tables
  badges: {
    active: 'FAOL',
    completed: 'YAKUNLANGAN',
    cancelled: 'BEKOR QILINDAN',
  },
} as const;

// Utility functions
export function getStatusDisplay(dbStatus: string): string {
  const status = dbStatus as keyof typeof translations.status;
  return translations.status[status] || dbStatus;
}

export function getPaymentMethodDisplay(method: string): string {
  const payment = method as keyof typeof translations.payment;
  return translations.payment[payment] || method;
}

export function getRoundLabel(roundNumber: number, isActive: boolean = false): string {
  if (isActive) {
    return `O'yin ${roundNumber} ●`;
  }
  return `O'yin ${roundNumber}`;
}
