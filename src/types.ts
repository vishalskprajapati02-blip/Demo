export type StylistStatus = 'available' | 'in_service' | 'on_break' | 'booked';

export interface Stylist {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  languages: string[];
  specialties: string[];
  workingHours: {
    start: string; // e.g. "10:00"
    end: string;   // e.g. "21:00"
  };
  liveStatus: StylistStatus;
  currentService?: string;
  currentClient?: string;
  nextFreeTime?: string;
  breaks: {
    start: string;
    end: string;
    label: string;
  }[];
}

export type ServiceCategory =
  | 'All'
  | 'Hair & Styling'
  | 'Beard & Men Grooming'
  | 'Facials & De-Tan'
  | 'Hair Spa & Ayurvedic Care'
  | 'Waxing & Threading'
  | 'Bridal & Festive Combos';

export type ServiceGender = 'all' | 'women' | 'men' | 'unisex';

export interface SalonService {
  id: string;
  name: string;
  category: Exclude<ServiceCategory, 'All'>;
  gender: ServiceGender;
  durationMinutes: number;
  price: number; // in INR (₹)
  description: string;
  popular?: boolean;
  brandUsed?: string; // e.g., "L'Oréal Professionnel", "O3+", "Cheryl's", "Lotus Herbals"
}

export type AppointmentStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type StaffRole = 'manager' | 'receptionist' | 'stylist';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  stylistId?: string; // set if staff member is one of the stylists
  avatar?: string;
}

export type UserPortalMode = 'customer' | 'salon';

export type WelcomeBeverage =
  | 'Masala Chai'
  | 'Filter Coffee'
  | 'Green Tea'
  | 'Nimbu Paani'
  | 'Mineral Water'
  | 'No Beverage';

export type PaymentPreference =
  | 'pay_at_salon' // Cash / UPI (GPay/PhonePe) on visit
  | 'upi_advance'; // ₹99 Advance booking token via UPI

export interface Appointment {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
  stylistId: string;
  serviceId: string; // primary service ID
  additionalServiceIds?: string[]; // support multi-service booking
  date: string; // "YYYY-MM-DD"
  startTime: string; // "10:30"
  endTime: string; // "11:30"
  durationMinutes: number;
  price: number; // in INR (₹)
  status: AppointmentStatus;
  createdAt: string;
  // Indian hospitality & booking preferences:
  welcomeBeverage?: WelcomeBeverage;
  paymentPreference?: PaymentPreference;
  whatsappOptIn?: boolean;
  upiPayment?: {
    isPaid: boolean;
    transactionRef: string;
    paidAmount: number;
    paidAt: string;
  };
}

export interface TimeSlot {
  time: string; // "10:00"
  endTime: string; // "10:30"
  isAvailable: boolean;
  reason?: 'booked' | 'break' | 'outside_hours' | 'past';
  occupyingAppointment?: Appointment;
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  appointmentCode: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  stylistName: string;
  date: string;
  startTime: string;
  endTime: string;
  minutesRemaining: number;
  welcomeBeverage?: string;
  timestamp: string;
  isRead: boolean;
}
