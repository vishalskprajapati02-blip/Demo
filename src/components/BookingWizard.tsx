import React, { useMemo, useState } from 'react';
import {
  Appointment,
  PaymentPreference,
  SalonService,
  ServiceCategory,
  ServiceGender,
  Stylist,
  WelcomeBeverage,
} from '../types';
import {
  addMinutesToTime,
  formatDatePretty,
  formatINR,
  formatTime12h,
  generateSalonSlots,
  getDaysArray,
  getStylistSlotAvailability,
  getTodayDateString,
  timeToMinutes,
} from '../utils/timeUtils';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coffee,
  HeartHandshake,
  HelpCircle,
  MessageSquare,
  QrCode,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Zap,
  Bell,
} from 'lucide-react';
import { UPIPaymentModal } from './UPIPaymentModal';

interface BookingWizardProps {
  services: SalonService[];
  stylists: Stylist[];
  appointments: Appointment[];
  initialStylistId?: string;
  initialServiceId?: string;
  initialDate?: string;
  initialTime?: string;
  onBookAppointment: (
    appointment: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'status'>
  ) => Promise<Appointment>;
  onViewBookings: () => void;
  onViewMatrix: () => void;
  onTriggerReminderAlert?: (appointment: Appointment) => void;
  onUpdateAppointmentPayment?: (
    appointmentId: string,
    details: { transactionRef: string; paidAmount: number; paidAt: string }
  ) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  services,
  stylists,
  appointments,
  initialStylistId,
  initialServiceId,
  initialDate,
  initialTime,
  onBookAppointment,
  onViewBookings,
  onViewMatrix,
  onTriggerReminderAlert,
  onUpdateAppointmentPayment,
}) => {
  const days = getDaysArray(7);

  // Steps: 1: Service & Add-ons, 2: Stylist, 3: Date & Slot, 4: Indian Hospitality & Details
  const [currentStep, setCurrentStep] = useState<number>(
    initialTime ? 4 : initialServiceId ? 2 : 1
  );

  // Form selections
  const [selectedGender, setSelectedGender] = useState<ServiceGender>('all');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('All');
  const [selectedPrimaryServiceId, setSelectedPrimaryServiceId] = useState<string>(
    initialServiceId || services[0]?.id || 'srv-1'
  );
  const [additionalServiceIds, setAdditionalServiceIds] = useState<string[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>(initialStylistId || 'any');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || days[0].dateString);
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Indian Customer Details & Preferences
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [welcomeBeverage, setWelcomeBeverage] = useState<WelcomeBeverage>('Masala Chai');
  const [conversationPref, setConversationPref] = useState<'silent' | 'chat'>('chat');
  const [paymentPreference, setPaymentPreference] = useState<PaymentPreference>('pay_at_salon');
  const [whatsappOptIn, setWhatsappOptIn] = useState<boolean>(true);

  // Submission & UPI Payment State
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);

  const handlePaymentSuccess = (details: {
    transactionRef: string;
    paidAmount: number;
    paidAt: string;
  }) => {
    if (confirmedBooking) {
      const updated: Appointment = {
        ...confirmedBooking,
        upiPayment: {
          isPaid: true,
          transactionRef: details.transactionRef,
          paidAmount: details.paidAmount,
          paidAt: details.paidAt,
        },
      };
      setConfirmedBooking(updated);
      onUpdateAppointmentPayment?.(confirmedBooking.id, details);
    }
  };

  const primaryService = services.find((s) => s.id === selectedPrimaryServiceId) || services[0];
  const selectedStylist = stylists.find((s) => s.id === selectedStylistId);

  // Calculate total price & duration including add-ons
  const totalDurationMinutes = useMemo(() => {
    let dur = primaryService?.durationMinutes || 45;
    additionalServiceIds.forEach((addId) => {
      const s = services.find((srv) => srv.id === addId);
      if (s) dur += s.durationMinutes;
    });
    return dur;
  }, [primaryService, additionalServiceIds, services]);

  const totalPrice = useMemo(() => {
    let p = primaryService?.price || 0;
    additionalServiceIds.forEach((addId) => {
      const s = services.find((srv) => srv.id === addId);
      if (s) p += s.price;
    });
    return p;
  }, [primaryService, additionalServiceIds, services]);

  // Categories
  const categories: ServiceCategory[] = [
    'All',
    'Hair & Styling',
    'Beard & Men Grooming',
    'Facials & De-Tan',
    'Hair Spa & Ayurvedic Care',
    'Waxing & Threading',
    'Bridal & Festive Combos',
  ];

  // Filtered services for Step 1
  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      if (selectedGender !== 'all') {
        if (srv.gender !== 'unisex' && srv.gender !== selectedGender) return false;
      }
      if (selectedCategory !== 'All' && srv.category !== selectedCategory) return false;
      return true;
    });
  }, [services, selectedGender, selectedCategory]);

  // Suggested complementary add-ons (different from primary service)
  const availableAddOns = useMemo(() => {
    return services.filter((s) => s.id !== primaryService.id && s.durationMinutes <= 45);
  }, [services, primaryService]);

  const toggleAddOn = (serviceId: string) => {
    setAdditionalServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
    // Invalidate previously picked time slot as duration changed
    setSelectedTime('');
  };

  // Calculate real-time available time slots based on total duration (Indian hours: 10:00 - 21:00)
  const availableSlots = useMemo(() => {
    const allSlots = generateSalonSlots(10, 21, 30);

    return allSlots
      .map((slot) => {
        let isAvailable = false;
        let matchedStylist: Stylist | undefined;

        if (selectedStylistId === 'any') {
          // Check if ANY stylist is free for the full total duration
          for (const st of stylists) {
            const check = getStylistSlotAvailability(
              st,
              selectedDate,
              slot,
              totalDurationMinutes,
              appointments
            );
            if (check.isAvailable) {
              isAvailable = true;
              matchedStylist = st;
              break;
            }
          }
        } else if (selectedStylist) {
          const check = getStylistSlotAvailability(
            selectedStylist,
            selectedDate,
            slot,
            totalDurationMinutes,
            appointments
          );
          isAvailable = check.isAvailable;
          matchedStylist = selectedStylist;
        }

        const slotMinutes = timeToMinutes(slot);
        let timePeriod: 'morning' | 'afternoon' | 'evening' = 'morning';
        if (slotMinutes >= 13 * 60 && slotMinutes < 17 * 60) {
          timePeriod = 'afternoon';
        } else if (slotMinutes >= 17 * 60) {
          timePeriod = 'evening';
        }

        return {
          time: slot,
          endTime: addMinutesToTime(slot, totalDurationMinutes),
          isAvailable,
          matchedStylist,
          timePeriod,
        };
      })
      .filter((item) => {
        if (timeOfDayFilter === 'all') return true;
        return item.timePeriod === timeOfDayFilter;
      });
  }, [
    selectedStylistId,
    selectedStylist,
    selectedDate,
    totalDurationMinutes,
    appointments,
    stylists,
    timeOfDayFilter,
  ]);

  // Form Validation
  const validateStep4 = (): boolean => {
    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return false;
    }

    // Indian mobile number check (e.g. 10 digits)
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return false;
    }

    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setFormError('Please enter a valid email address for your appointment slip.');
      return false;
    }

    setFormError(null);
    return true;
  };

  // Submit Booking
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4()) return;

    // Verify a time slot was chosen
    if (!selectedTime) {
      setFormError('Please choose a valid time slot from Step 3.');
      setCurrentStep(3);
      return;
    }

    // Determine final stylist
    let finalStylistId = selectedStylistId;
    if (selectedStylistId === 'any') {
      const freeStylist = stylists.find((st) => {
        const check = getStylistSlotAvailability(
          st,
          selectedDate,
          selectedTime,
          totalDurationMinutes,
          appointments
        );
        return check.isAvailable;
      });

      if (!freeStylist) {
        setFormError(
          'That time slot just got reserved on the floor! Please choose another open time slot.'
        );
        setCurrentStep(3);
        return;
      }
      finalStylistId = freeStylist.id;
    }

    setIsSubmitting(true);
    setFormError(null);

    const formattedPhone = customerPhone.startsWith('+91')
      ? customerPhone
      : `+91 ${customerPhone.replace(/\D/g, '').slice(-10)}`;

    const notesSummary = [
      (customerNotes || '').trim(),
      welcomeBeverage ? `Welcome Drink: ${welcomeBeverage}` : '',
      conversationPref === 'silent' ? 'Prefers relaxing silent service' : '',
    ]
      .filter(Boolean)
      .join(' • ');

    try {
      const newBooking = await onBookAppointment({
        customerName: customerName.trim(),
        customerPhone: formattedPhone,
        customerEmail: customerEmail.trim(),
        notes: notesSummary || undefined,
        stylistId: finalStylistId,
        serviceId: primaryService.id,
        additionalServiceIds: additionalServiceIds.length > 0 ? additionalServiceIds : undefined,
        date: selectedDate,
        startTime: selectedTime,
        endTime: addMinutesToTime(selectedTime, totalDurationMinutes),
        durationMinutes: totalDurationMinutes,
        price: totalPrice,
        welcomeBeverage,
        paymentPreference,
        whatsappOptIn,
      });

      setConfirmedBooking(newBooking);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Failed to schedule appointment. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForNewBooking = () => {
    setConfirmedBooking(null);
    setSelectedTime('');
    setAdditionalServiceIds([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerNotes('');
    setCurrentStep(1);
  };

  // WhatsApp Share URL generator
  const getWhatsAppShareUrl = (booking: Appointment) => {
    const bookedStylist = stylists.find((s) => s.id === booking.stylistId);
    const text = encodeURIComponent(
      `*Namaste! My Roopam Salon Appointment is Confirmed* ✂️\n` +
      `• Booking Ref: ${booking.code}\n` +
      `• Date: ${formatDatePretty(booking.date)}\n` +
      `• Time: ${formatTime12h(booking.startTime)} - ${formatTime12h(booking.endTime)}\n` +
      `• Stylist: ${bookedStylist?.name}\n` +
      `• Service: ${primaryService.name}\n` +
      `• Welcome Drink: ${booking.welcomeBeverage || 'Masala Chai'}\n` +
      `• Total Amount: ${formatINR(booking.price)} (${booking.paymentPreference === 'upi_advance' ? '₹99 UPI Paid / Balance at Salon' : 'Pay at Salon'})\n` +
      `• Location: Roopam Luxury Salon, 100 Feet Road, Indiranagar, Bengaluru.`
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  // SUCCESS CONFIRMATION SCREEN
  if (confirmedBooking) {
    const bookedStylist = stylists.find((s) => s.id === confirmedBooking.stylistId);
    const bookedService = services.find((s) => s.id === confirmedBooking.serviceId);

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-md">
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            Booking Confirmed in Real-Time
          </span>
          <h2 className="text-2xl font-bold font-serif text-stone-900">
            Namaste {confirmedBooking.customerName}! You&apos;re Scheduled
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
            Your chair is reserved with {bookedStylist?.name}. A digital confirmation pass has been created.
          </p>
        </div>

        {/* Digital Indian Salon Pass */}
        <div className="my-6 p-5 sm:p-6 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <span className="text-[11px] text-stone-500 uppercase font-semibold block tracking-wider">
                Digital Salon Pass Ref
              </span>
              <span className="font-mono text-lg font-bold text-amber-700 tracking-wider">
                {confirmedBooking.code}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-2xs">
                Live Confirmed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-stone-500 block">Primary Service</span>
              <span className="font-bold text-stone-900 text-sm">{bookedService?.name}</span>
              {additionalServiceIds.length > 0 && (
                <span className="text-stone-500 block text-[11px] mt-0.5">
                  + {additionalServiceIds.length} Add-on(s) included
                </span>
              )}
            </div>

            <div>
              <span className="text-stone-500 block">Master Stylist</span>
              <div className="flex items-center gap-2 mt-0.5">
                <img
                  src={bookedStylist?.avatar}
                  alt={bookedStylist?.name}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-semibold text-stone-800">{bookedStylist?.name}</span>
              </div>
            </div>

            <div>
              <span className="text-stone-500 block">Date &amp; Slot</span>
              <span className="font-semibold text-stone-800">
                {formatDatePretty(confirmedBooking.date)}
              </span>
              <span className="text-amber-700 font-medium block">
                {formatTime12h(confirmedBooking.startTime)} - {formatTime12h(confirmedBooking.endTime)} ({confirmedBooking.durationMinutes} mins)
              </span>
            </div>

            <div>
              <span className="text-stone-500 block">Welcome Hospitality</span>
              <span className="font-semibold text-stone-800 flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                {confirmedBooking.welcomeBeverage || 'Masala Chai'}
              </span>
            </div>

            <div>
              <span className="text-stone-500 block">Payment Mode</span>
              {confirmedBooking.upiPayment?.isPaid ? (
                <div className="mt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>UPI Paid ({formatINR(confirmedBooking.upiPayment.paidAmount)})</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 block mt-0.5 truncate max-w-[200px]">
                    Ref: {confirmedBooking.upiPayment.transactionRef}
                  </span>
                </div>
              ) : (
                <>
                  <span className="font-semibold text-stone-800">
                    {confirmedBooking.paymentPreference === 'upi_advance'
                      ? '₹99 UPI Advance Token (Balance at Salon)'
                      : 'Pay at Salon (Cash / UPI / Cards)'}
                  </span>
                  <span className="text-emerald-700 font-bold block text-sm mt-0.5">
                    Total: {formatINR(confirmedBooking.price)}
                  </span>
                </>
              )}
            </div>

            <div>
              <span className="text-stone-500 block">Location</span>
              <span className="font-semibold text-stone-800 block">
                Roopam Indian Luxury Salon
              </span>
              <span className="text-[11px] text-stone-500 block">
                100 Feet Road, Indiranagar, Bengaluru
              </span>
            </div>
          </div>

          {confirmedBooking.whatsappOptIn && (
            <div className="pt-3 border-t border-stone-200/80 flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/80">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                WhatsApp notification enabled for <strong>{confirmedBooking.customerPhone}</strong>. You will receive real-time floor updates.
              </span>
            </div>
          )}
        </div>

        {/* Dummy 'Pay Now via UPI' Card & Button */}
        <div className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950 text-white border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                  Instant UPI Checkout
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
                  GPay • PhonePe • Paytm • BHIM
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                {confirmedBooking.upiPayment?.isPaid
                  ? `Payment of ${formatINR(confirmedBooking.upiPayment.paidAmount)} received! Ref: ${confirmedBooking.upiPayment.transactionRef}`
                  : `Scan QR code with your UPI app for zero-touch fast checkout`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {confirmedBooking.upiPayment?.isPaid ? (
              <button
                id="view-upi-receipt-btn"
                type="button"
                onClick={() => setShowUpiModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-emerald-400/40 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>View UPI Receipt</span>
              </button>
            ) : (
              <button
                id="pay-now-via-upi-btn"
                type="button"
                onClick={() => setShowUpiModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <QrCode className="w-4 h-4" />
                <span>Pay Now via UPI</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={getWhatsAppShareUrl(confirmedBooking)}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-1/2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onViewBookings}
              className="w-full sm:w-1/2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer text-center"
            >
              View in My Bookings
            </button>
          </div>

          {onTriggerReminderAlert && (
            <button
              type="button"
              onClick={() => onTriggerReminderAlert(confirmedBooking)}
              className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Test 15-Min Reminder Alert for this Visit</span>
            </button>
          )}

          <button
            type="button"
            onClick={resetForNewBooking}
            className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition cursor-pointer text-center"
          >
            Book Another Visit
          </button>
        </div>

        {/* UPI Payment QR Code Overlay Modal */}
        <UPIPaymentModal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          appointment={confirmedBooking}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs mb-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, label: 'Service', sub: primaryService.name.split(' ')[0] },
            {
              step: 2,
              label: 'Stylist',
              sub: selectedStylistId === 'any' ? 'Any Specialist' : selectedStylist?.name.split(' ')[0],
            },
            {
              step: 3,
              label: 'Date & Slot',
              sub: selectedTime ? formatTime12h(selectedTime) : 'Choose Slot',
            },
            { step: 4, label: 'Hospitality', sub: 'Details & UPI' },
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setCurrentStep(item.step)}
                className={`text-left p-2 rounded-xl transition cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-50/90 border border-amber-300'
                    : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : item.step}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-amber-900' : 'text-stone-700'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 truncate pl-6 hidden sm:block">
                  {item.sub}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Box */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200 shadow-xs">
        {/* STEP 1: SELECT SERVICE & COMPLEMENTARY ADD-ONS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Step 1 of 4
                </span>
                <h2 className="text-xl font-bold font-serif text-stone-900">
                  Choose Your Service &amp; Add-ons
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 block">Total Scheduled</span>
                <span className="text-sm font-bold text-stone-900">
                  {formatINR(totalPrice)} • {totalDurationMinutes} mins
                </span>
              </div>
            </div>

            {/* Gender Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-600">For:</span>
              <div className="flex bg-stone-100 p-1 rounded-xl text-xs">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'women', label: 'Women' },
                    { id: 'men', label: 'Men' },
                    { id: 'unisex', label: 'Unisex' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGender(g.id)}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      selectedGender === g.id
                        ? 'bg-stone-900 text-white font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Primary Services Cards */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Select Main Service
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredServices.map((service) => {
                  const isSelected = service.id === selectedPrimaryServiceId;
                  return (
                    <div
                      key={service.id}
                      id={`service-card-${service.id}`}
                      onClick={() => {
                        setSelectedPrimaryServiceId(service.id);
                        setSelectedTime(''); // invalidate slot
                      }}
                      className={`p-4 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-500/50'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <h4 className="font-semibold text-stone-900 text-sm">
                              {service.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-stone-500">
                                {service.durationMinutes} mins
                              </span>
                              {service.brandUsed && (
                                <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                                  {service.brandUsed}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-stone-900">
                            {formatINR(service.price)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                          {service.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-medium">
                          {isSelected ? '✓ Selected as Main Service' : 'Click to Select'}
                        </span>
                        {service.popular && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 font-medium">
                            Popular
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Indian Salon Add-Ons Bundle */}
            <div className="pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Frequently Added Indian Salon Rituals</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Add quick De-Tan, Champi head massage, or threading to your appointment
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {availableAddOns.slice(0, 6).map((addon) => {
                  const isAdded = additionalServiceIds.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddOn(addon.id)}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                        isAdded
                          ? 'bg-amber-100/70 border-amber-600 text-stone-900 font-semibold'
                          : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">{addon.name}</div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                          <span>{addon.durationMinutes}m</span>
                          <span>•</span>
                          <span className="text-amber-800 font-bold">{formatINR(addon.price)}</span>
                        </div>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          isAdded ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {isAdded ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 1 Footer Action */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500">Total duration: </span>
                <strong className="text-stone-900">{totalDurationMinutes} mins</strong>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Stylist</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT STYLIST / ARTIST */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Step 2 of 4
                </span>
                <h2 className="text-xl font-bold font-serif text-stone-900">
                  Choose Your Master Stylist
                </h2>
              </div>
              <span className="text-xs text-stone-500">
                Service: <strong>{primaryService.name}</strong> ({totalDurationMinutes} mins)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option A: Any Available Specialist */}
              <div
                id="stylist-card-any"
                onClick={() => {
                  setSelectedStylistId('any');
                  setSelectedTime('');
                }}
                className={`p-4 rounded-2xl border transition text-left cursor-pointer flex items-center gap-3.5 ${
                  selectedStylistId === 'any'
                    ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-500/50'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shrink-0 shadow-inner">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-stone-900 text-sm">
                      Any Available Specialist
                    </h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                      Fastest
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    We pair you with whichever certified master artist has the best immediate slot.
                  </p>
                </div>
              </div>

              {/* Individual Stylists */}
              {stylists.map((stylist) => {
                const isSelected = stylist.id === selectedStylistId;
                return (
                  <div
                    key={stylist.id}
                    id={`stylist-card-${stylist.id}`}
                    onClick={() => {
                      setSelectedStylistId(stylist.id);
                      setSelectedTime('');
                    }}
                    className={`p-4 rounded-2xl border transition text-left cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-500/50'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                    }`}
                  >
                    <img
                      src={stylist.avatar}
                      alt={stylist.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover shrink-0 border border-stone-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-stone-900 text-sm truncate">
                          {stylist.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{stylist.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-stone-500 truncate">{stylist.role}</p>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
                        <span className="bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                          {stylist.experienceYears}+ yrs exp
                        </span>
                        <span className="text-stone-400">•</span>
                        <span className="text-stone-500 truncate">
                          {(stylist.languages || ['Hindi', 'English']).join(', ')}
                        </span>
                      </div>

                      {/* Live floor status pill */}
                      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                        {stylist.liveStatus === 'available' ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Available on floor now
                          </span>
                        ) : (
                          <span className="text-amber-800 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Next chair opens at {stylist.nextFreeTime || 'soon'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                ← Back to Services
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Select Date &amp; Slot</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DATE & TIME SLOT */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Step 3 of 4
                </span>
                <h2 className="text-xl font-bold font-serif text-stone-900">
                  Select Date &amp; Real-Time Time Slot
                </h2>
              </div>
              <span className="text-xs text-stone-500">
                Indian Salon Hours: <strong>10:00 AM – 9:00 PM</strong>
              </span>
            </div>

            {/* 7-Day Date Carousel */}
            <div>
              <span className="text-xs font-semibold text-stone-700 block mb-2">
                Select Appointment Date
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {days.map((d) => {
                  const isSelected = d.dateString === selectedDate;
                  return (
                    <button
                      key={d.dateString}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d.dateString);
                        setSelectedTime(''); // reset slot
                      }}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      <span
                        className={`text-[11px] block font-semibold uppercase ${
                          isSelected ? 'text-amber-100' : 'text-stone-500'
                        }`}
                      >
                        {d.dayName}
                      </span>
                      <span className="text-base font-bold block">{d.dayNumber}</span>
                      <span
                        className={`text-[10px] block ${
                          isSelected ? 'text-amber-200' : 'text-stone-500'
                        }`}
                      >
                        {d.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time of Day Filter */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
              <span className="text-xs font-semibold text-stone-700">
                Available Slots for {formatDatePretty(selectedDate)}
              </span>

              <div className="flex bg-stone-100 p-1 rounded-xl text-xs">
                {(
                  [
                    { id: 'all', label: 'All Hours' },
                    { id: 'morning', label: 'Morning (10-1)' },
                    { id: 'afternoon', label: 'Afternoon (1-5)' },
                    { id: 'evening', label: 'Evening (5-9)' },
                  ] as const
                ).map((tof) => (
                  <button
                    key={tof.id}
                    type="button"
                    onClick={() => setTimeOfDayFilter(tof.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      timeOfDayFilter === tof.id
                        ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tof.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slots Grid */}
            <div className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200/90 max-h-72 overflow-y-auto">
              {availableSlots.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs">
                  No slots match your filter for this period. Try viewing All Hours.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        id={`slot-${slot.time}`}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer ${
                          !slot.isAvailable
                            ? 'bg-stone-100 text-stone-300 border border-stone-200 line-through cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white hover:bg-amber-50 text-stone-800 border border-stone-200'
                        }`}
                      >
                        <div>{formatTime12h(slot.time)}</div>
                        <span
                          className={`text-[9px] block font-normal ${
                            isSelected ? 'text-amber-100' : 'text-stone-500'
                          }`}
                        >
                          {slot.isAvailable ? 'Open' : 'Booked'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Slot Confirmation Bar */}
            {selectedTime && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Selected Slot: <strong>{formatTime12h(selectedTime)}</strong> to{' '}
                    <strong>{formatTime12h(addMinutesToTime(selectedTime, totalDurationMinutes))}</strong> ({totalDurationMinutes} mins)
                  </span>
                </div>
                <span className="font-semibold text-emerald-700">Verified Available</span>
              </div>
            )}

            {/* Step 3 Actions */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                ← Back to Stylist
              </button>
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setCurrentStep(4)}
                className={`px-6 py-2.5 text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
                  selectedTime
                    ? 'bg-stone-900 hover:bg-stone-800 text-white'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>Continue to Hospitality &amp; Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: INDIAN HOSPITALITY, DETAILS & PAYMENT PREFERENCE */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmitBooking} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Step 4 of 4
                </span>
                <h2 className="text-xl font-bold font-serif text-stone-900">
                  Guest Details &amp; Indian Hospitality
                </h2>
              </div>
              <span className="text-xs text-stone-500">
                Confirm your welcome chai &amp; payment mode
              </span>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="input-customer-name"
                  type="text"
                  required
                  placeholder="e.g. Ananya Iyer / Rohan Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Indian Mobile Number (+91) <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-300 bg-stone-100 text-stone-600 text-xs font-medium">
                    +91
                  </span>
                  <input
                    id="input-customer-phone"
                    type="tel"
                    required
                    placeholder="98765 43210"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-r-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  10 digits for instant WhatsApp booking slip
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  id="input-customer-email"
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Indian Hospitality: Complimentary Welcome Drink */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold text-stone-900">
                  Complimentary Welcome Beverage (Indian Hospitality)
                </h3>
              </div>
              <p className="text-[11px] text-stone-600">
                Freshly brewed upon your arrival at our Indiranagar lounge:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    'Masala Chai',
                    'Filter Coffee',
                    'Green Tea',
                    'Nimbu Paani',
                    'Mineral Water',
                    'No Beverage',
                  ] as WelcomeBeverage[]
                ).map((bev) => (
                  <button
                    key={bev}
                    type="button"
                    onClick={() => setWelcomeBeverage(bev)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition cursor-pointer flex items-center justify-between ${
                      welcomeBeverage === bev
                        ? 'bg-amber-700 text-white border-amber-700 font-semibold shadow-2xs'
                        : 'bg-white text-stone-700 border-amber-200/80 hover:bg-amber-100/50'
                    }`}
                  >
                    <span>{bev}</span>
                    {welcomeBeverage === bev && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Mode & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Service Conversation Mode
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setConversationPref('chat')}
                    className={`p-2.5 rounded-xl border text-center font-medium transition cursor-pointer ${
                      conversationPref === 'chat'
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    Friendly Chit-Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setConversationPref('silent')}
                    className={`p-2.5 rounded-xl border text-center font-medium transition cursor-pointer ${
                      conversationPref === 'silent'
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    Relaxing Silent Mode
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Special Notes or Concerns (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sensitive skin, pre-wedding event, dandruff"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Payment Choice (Indian Context) */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <label className="text-xs font-bold text-stone-800 block">
                Payment Option
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPaymentPreference('pay_at_salon')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    paymentPreference === 'pay_at_salon'
                      ? 'bg-white border-amber-600 ring-1 ring-amber-500/40 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">
                      Pay at Salon (Recommended)
                    </span>
                    <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-medium">
                      Zero Advance
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Pay {formatINR(totalPrice)} upon completion of your service via Cash, UPI (GPay, PhonePe, Paytm), or Cards.
                  </p>
                </div>

                <div
                  onClick={() => setPaymentPreference('upi_advance')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    paymentPreference === 'upi_advance'
                      ? 'bg-white border-amber-600 ring-1 ring-amber-500/40 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">
                      Lock Slot with ₹99 UPI Token
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      VIP Priority
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Instantly secure your chair with ₹99 advance. Deducted from your final bill at the salon.
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Updates Checkbox */}
            <div className="flex items-center gap-2 text-xs text-stone-700">
              <input
                id="checkbox-whatsapp"
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(e) => setWhatsappOptIn(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
              >
              </input>
              <label htmlFor="checkbox-whatsapp" className="cursor-pointer">
                Send appointment confirmation &amp; live floor updates on <strong>WhatsApp</strong>.
              </label>
            </div>

            {/* Step 4 Submit & Summary */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-stone-600">
                <span>Appointment on: </span>
                <strong className="text-stone-900">
                  {formatDatePretty(selectedDate)} at {formatTime12h(selectedTime)}
                </strong>
                <span className="block text-emerald-700 font-bold text-sm">
                  Total Payable: {formatINR(totalPrice)}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  id="confirm-booking-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Securing Slot...</span>
                  ) : (
                    <>
                      <span>Confirm Appointment</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
