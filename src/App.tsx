/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Appointment,
  AppointmentReminder,
  AppointmentStatus,
  SalonService,
  Stylist,
  StylistStatus,
  StaffUser,
  UserPortalMode,
} from './types';
import { INITIAL_SERVICES, INITIAL_STYLISTS, getInitialAppointments } from './data/mockData';
import { Header } from './components/Header';
import { LiveAvailabilityMatrix } from './components/LiveAvailabilityMatrix';
import { BookingWizard } from './components/BookingWizard';
import { AppointmentList } from './components/AppointmentList';
import { ServicesCatalog } from './components/ServicesCatalog';
import { AboutSalon } from './components/AboutSalon';
import { SalonDashboard } from './components/SalonDashboard';
import { SalonLogin } from './components/SalonLogin';
import { StylistProfileModal } from './components/StylistProfileModal';
import { AppointmentReminderAlert } from './components/AppointmentReminderAlert';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { playSalonChime } from './utils/soundUtils';
import {
  formatDatePretty,
  formatTime12h,
  getTodayDateString,
  timeToMinutes,
} from './utils/timeUtils';
import {
  Check,
  Info,
  Sparkles,
  X,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  ShieldCheck,
  Coffee,
  CheckCircle2,
  Scissors,
  Shield,
  LogOut,
  ExternalLink,
} from 'lucide-react';

const STORAGE_KEYS = {
  APPOINTMENTS: 'salon_app_appointments_v1',
  STYLISTS: 'salon_app_stylists_v1',
  REMINDERS: 'salon_app_reminders_v1',
  PORTAL_MODE: 'salon_app_portal_mode_v1',
  STAFF_USER: 'salon_app_staff_user_v1',
};

export default function App() {
  // Customer Portal Appointments & Stylists State
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return getInitialAppointments();
  });

  const [stylists, setStylists] = useState<Stylist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STYLISTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((st: Partial<Stylist>) => {
            const base = INITIAL_STYLISTS.find((init) => init.id === st.id) || INITIAL_STYLISTS[0];
            return {
              ...base,
              ...st,
              languages: Array.isArray(st.languages) && st.languages.length > 0
                ? st.languages
                : (base?.languages || ['Hindi', 'English']),
              specialties: Array.isArray(st.specialties) && st.specialties.length > 0
                ? st.specialties
                : (base?.specialties || []),
              breaks: Array.isArray(st.breaks) ? st.breaks : (base?.breaks || []),
              workingHours: st.workingHours || base?.workingHours || { start: '10:00', end: '21:00' },
            };
          });
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_STYLISTS;
  });

  const [services] = useState<SalonService[]>(INITIAL_SERVICES);

  // Active Customer Tab: 'book' | 'matrix' | 'my-appointments' | 'services' | 'about'
  const [activeTab, setActiveTab] = useState<'book' | 'matrix' | 'my-appointments' | 'services' | 'about'>('book');
  
  // Portal Mode: 'customer' | 'salon'
  const [portalMode, setPortalMode] = useState<UserPortalMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PORTAL_MODE);
      if (saved === 'salon' || saved === 'customer') return saved;
    } catch {
      // ignore
    }
    return 'customer';
  });

  // Logged-in Staff User
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PORTAL_MODE, portalMode);
    } catch {
      // ignore
    }
  }, [portalMode]);

  useEffect(() => {
    try {
      if (currentStaffUser) {
        localStorage.setItem(STORAGE_KEYS.STAFF_USER, JSON.stringify(currentStaffUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.STAFF_USER);
      }
    } catch {
      // ignore
    }
  }, [currentStaffUser]);
  
  // Prefill state for deep links (e.g. from Rate Card or Live Matrix to Booking Wizard)
  const [bookingPrefill, setBookingPrefill] = useState<{
    stylistId?: string;
    serviceId?: string;
    date?: string;
    time?: string;
  }>({});

  const [viewingStylist, setViewingStylist] = useState<Stylist | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [liveNotification, setLiveNotification] = useState<{
    id: string;
    text: string;
    type?: 'info' | 'success';
  } | null>(null);

  // 15-Minute Appointment Reminder & Notification Center State
  const [reminders, setReminders] = useState<AppointmentReminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [activeAlertReminder, setActiveAlertReminder] = useState<AppointmentReminder | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [dismissedAppointmentIds, setDismissedAppointmentIds] = useState<string[]>([]);
  const [snoozeUntilMap, setSnoozeUntilMap] = useState<Record<string, number>>({});

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch {
      // ignore
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STYLISTS, JSON.stringify(stylists));
    } catch {
      // ignore
    }
  }, [stylists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch {
      // ignore
    }
  }, [reminders]);

  // Initial welcome toast
  useEffect(() => {
    const timer = setTimeout(() => {
      showLiveToast('Real-time floor sync connected: Indiranagar salon availability is live.');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const showLiveToast = (text: string, type: 'info' | 'success' = 'info') => {
    const id = Date.now().toString();
    setLiveNotification({ id, text, type });
    setTimeout(() => {
      setLiveNotification((current) => (current?.id === id ? null : current));
    }, 4500);
  };

  // Trigger 15-Minute Appointment Reminder Alert (both manual test and automatic schedule)
  const trigger15MinuteAlertForAppointment = (targetAppointment?: Appointment, customMinutes: number = 15) => {
    let app = targetAppointment;
    if (!app) {
      const today = getTodayDateString();
      const todayConfirmed = appointments.filter(
        (a) => a.date === today && (a.status === 'confirmed' || a.status === 'in_progress')
      );
      app = todayConfirmed[0] || appointments.find((a) => a.status === 'confirmed') || appointments[0];
    }

    if (!app) return;

    const stylist = stylists.find((s) => s.id === app.stylistId);
    const service = services.find((s) => s.id === app.serviceId);

    const newReminder: AppointmentReminder = {
      id: `rem-${app.id}-${Date.now()}`,
      appointmentId: app.id,
      appointmentCode: app.code,
      customerName: app.customerName,
      customerPhone: app.customerPhone,
      serviceName: service?.name || 'Luxury Salon Ritual',
      stylistName: stylist?.name || 'Master Stylist',
      date: app.date,
      startTime: app.startTime,
      endTime: app.endTime,
      minutesRemaining: customMinutes,
      welcomeBeverage: app.welcomeBeverage || 'Masala Chai',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      isRead: false,
    };

    setActiveAlertReminder(newReminder);
    setReminders((prev) => [newReminder, ...prev.filter((r) => r.appointmentId !== app!.id)]);
    playSalonChime();
    showLiveToast(`🔔 15-Minute Reminder Alert: #${app.code} starts in 15 mins!`, 'info');
  };

  // Automatic 15-minute interval checker
  useEffect(() => {
    const checkUpcomingAppointments = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const todayStr = getTodayDateString();

      const upcomingToday = appointments.filter(
        (a) => a.date === todayStr && (a.status === 'confirmed' || a.status === 'in_progress')
      );

      for (const app of upcomingToday) {
        const startMinutes = timeToMinutes(app.startTime);
        const minutesDiff = startMinutes - currentMinutes;

        // Within 15-minute reminder window (0 to 15 minutes before start)
        if (minutesDiff <= 15 && minutesDiff >= 0) {
          // Check snooze
          const snoozedUntil = snoozeUntilMap[app.id];
          if (snoozedUntil && Date.now() < snoozedUntil) {
            continue;
          }
          // Check if already dismissed in this session
          if (dismissedAppointmentIds.includes(app.id)) {
            continue;
          }
          // Check if already actively showing
          if (activeAlertReminder?.appointmentId === app.id) {
            continue;
          }

          trigger15MinuteAlertForAppointment(app, Math.max(1, minutesDiff));
          break;
        }
      }
    };

    checkUpcomingAppointments();
    const interval = setInterval(checkUpcomingAppointments, 15000);
    return () => clearInterval(interval);
  }, [appointments, dismissedAppointmentIds, snoozeUntilMap, activeAlertReminder, stylists, services]);

  const handleDismissReminder = (reminderId: string) => {
    if (activeAlertReminder?.id === reminderId) {
      setDismissedAppointmentIds((prev) => [...prev, activeAlertReminder.appointmentId]);
      setActiveAlertReminder(null);
    }
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
  };

  const handleSnoozeReminder = (reminderId: string, minutes: number = 5) => {
    if (activeAlertReminder?.id === reminderId) {
      const until = Date.now() + minutes * 60 * 1000;
      setSnoozeUntilMap((prev) => ({
        ...prev,
        [activeAlertReminder.appointmentId]: until,
      }));
      setActiveAlertReminder(null);
      showLiveToast(`Reminder snoozed for ${minutes} minutes.`, 'info');
    }
  };

  const handleClearAllReminders = () => {
    setActiveAlertReminder(null);
    setReminders([]);
    showLiveToast('All notifications and reminders cleared.', 'info');
  };

  const handleViewBookingPass = (code: string) => {
    setActiveTab('my-appointments');
    showLiveToast(`Viewing booking pass #${code}`, 'success');
  };

  // Booking action
  const handleBookAppointment = async (
    appointmentData: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'status'>
  ): Promise<Appointment> => {
    const randomCodeNum = Math.floor(1000 + Math.random() * 9000);
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `apt-${Date.now()}`,
      code: `IN-ROOP-${randomCodeNum}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // If booking is today and starts right now, update stylist live status
    const today = getTodayDateString();
    if (newAppointment.date === today) {
      setStylists((prevStylists) =>
        prevStylists.map((st) => {
          if (st.id === newAppointment.stylistId) {
            return {
              ...st,
              liveStatus: 'booked',
              currentService: services.find((s) => s.id === newAppointment.serviceId)?.name,
              currentClient: newAppointment.customerName,
              nextFreeTime: newAppointment.endTime,
            };
          }
          return st;
        })
      );
    }

    const stylist = stylists.find((s) => s.id === newAppointment.stylistId);
    showLiveToast(
      `Appointment ${newAppointment.code} scheduled with ${stylist?.name}! Slot locked.`,
      'success'
    );

    return newAppointment;
  };

  // Cancel action
  const handleCancelAppointment = (appointmentId: string) => {
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target) return;

    setAppointments((prev) =>
      prev.map((app) => (app.id === appointmentId ? { ...app, status: 'cancelled' } : app))
    );

    // If appointment was today, release stylist
    const today = getTodayDateString();
    if (target.date === today) {
      setStylists((prev) =>
        prev.map((st) => {
          if (st.id === target.stylistId) {
            return {
              ...st,
              liveStatus: 'available',
              currentClient: undefined,
              currentService: undefined,
              nextFreeTime: 'Now',
            };
          }
          return st;
        })
      );
    }

    showLiveToast(`Appointment #${target.code} cancelled. Slot released to live grid.`, 'info');
  };

  // Reschedule action
  const handleRescheduleAppointment = (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => {
    setAppointments((prev) =>
      prev.map((app) => {
        if (app.id === appointmentId) {
          return {
            ...app,
            date: newDate,
            startTime: newStartTime,
            endTime: newEndTime,
            status: 'confirmed',
          };
        }
        return app;
      })
    );

    showLiveToast(
      `Appointment rescheduled to ${formatDatePretty(newDate)} at ${formatTime12h(newStartTime)}.`,
      'success'
    );
  };

  // UPI payment update action
  const handleUpdateAppointmentPayment = (
    appointmentId: string,
    details: { transactionRef: string; paidAmount: number; paidAt: string }
  ) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === appointmentId
          ? {
              ...app,
              upiPayment: {
                isPaid: true,
                transactionRef: details.transactionRef,
                paidAmount: details.paidAmount,
                paidAt: details.paidAt,
              },
            }
          : app
      )
    );
    showLiveToast(
      `UPI payment of ₹${details.paidAmount} recorded! (Ref: ${details.transactionRef})`,
      'success'
    );
  };

  // Staff action: update appointment status (e.g. Seat Client / Complete Service)
  const handleUpdateAppointmentStatus = (
    appointmentId: string,
    status: AppointmentStatus,
    stylistId?: string
  ) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === appointmentId ? { ...app, status } : app))
    );

    const app = appointments.find((a) => a.id === appointmentId);
    const targetStylistId = stylistId || app?.stylistId;

    if (status === 'in_progress' && targetStylistId) {
      const srv = services.find((s) => s.id === app?.serviceId);
      setStylists((prev) =>
        prev.map((st) =>
          st.id === targetStylistId
            ? {
                ...st,
                liveStatus: 'in_service',
                currentClient: app?.customerName,
                currentService: srv?.name,
                nextFreeTime: app?.endTime || '30m',
              }
            : st
        )
      );
      showLiveToast(`Seated ${app?.customerName || 'Client'} in chair. Service started!`, 'success');
    } else if (status === 'completed' && targetStylistId) {
      setStylists((prev) =>
        prev.map((st) =>
          st.id === targetStylistId
            ? {
                ...st,
                liveStatus: 'available',
                currentClient: undefined,
                currentService: undefined,
                nextFreeTime: 'Now',
              }
            : st
        )
      );
      showLiveToast(`Service completed for ${app?.customerName || 'Client'}! Chair freed.`, 'success');
    } else if (status === 'cancelled') {
      showLiveToast(`Appointment #${app?.code || ''} marked cancelled.`, 'info');
    }
  };

  // Staff action: manually update stylist live floor status
  const handleUpdateStylistLiveStatus = (
    stylistId: string,
    status: StylistStatus,
    currentClient?: string,
    currentService?: string,
    nextFreeTime?: string
  ) => {
    setStylists((prev) =>
      prev.map((st) =>
        st.id === stylistId
          ? {
              ...st,
              liveStatus: status,
              currentClient: status === 'available' || status === 'on_break' ? undefined : (currentClient ?? st.currentClient),
              currentService: status === 'available' || status === 'on_break' ? undefined : (currentService ?? st.currentService),
              nextFreeTime: nextFreeTime ?? (status === 'available' ? 'Now' : st.nextFreeTime),
            }
          : st
      )
    );
    const target = stylists.find((s) => s.id === stylistId);
    showLiveToast(`Updated ${target?.name || 'Stylist'} status to ${status.replace('_', ' ').toUpperCase()}`, 'info');
  };

  // Select slot from matrix
  const handleSelectSlotFromMatrix = (stylistId: string, date: string, time: string) => {
    setBookingPrefill({
      stylistId,
      date,
      time,
    });
    setActiveTab('book');
    const stylist = stylists.find((s) => s.id === stylistId);
    showLiveToast(`Selected ${stylist?.name} at ${formatTime12h(time)} on ${formatDatePretty(date)}.`);
  };

  // Select service to book from Rate Card
  const handleSelectServiceFromCatalog = (serviceId: string) => {
    setBookingPrefill({
      serviceId,
    });
    setActiveTab('book');
    const srv = services.find((s) => s.id === serviceId);
    showLiveToast(`Selected "${srv?.name}". Please choose your stylist and time slot.`);
  };

  // Simulate real-time booking event or status change
  const handleSimulateRealtimeEvent = () => {
    const targetIndex = Math.floor(Math.random() * stylists.length);
    const targetStylist = stylists[targetIndex];

    const newStatus =
      targetStylist.liveStatus === 'available'
        ? 'in_service'
        : 'available';

    setStylists((prev) =>
      prev.map((st, idx) => {
        if (idx === targetIndex) {
          return {
            ...st,
            liveStatus: newStatus,
            currentService: newStatus === 'in_service' ? 'Ayurvedic Champi & Styling' : undefined,
            currentClient: newStatus === 'in_service' ? 'Walk-in Guest' : undefined,
            nextFreeTime: newStatus === 'in_service' ? '12:30' : 'Now',
          };
        }
        return st;
      })
    );

    showLiveToast(
      `Live Floor Update: ${targetStylist.name} is now ${
        newStatus === 'available' ? 'Available' : 'In Service'
      }!`,
      'info'
    );
  };

  const myActiveAppointmentsCount = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'in_progress'
  ).length;

  // SALON STAFF PORTAL VIEW
  if (portalMode === 'salon') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-900">
        {/* Real-time floating toast notice */}
        {liveNotification && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium ${
                liveNotification.type === 'success'
                  ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                  : 'bg-stone-900 text-stone-100 border-stone-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{liveNotification.text}</span>
              <button
                type="button"
                onClick={() => setLiveNotification(null)}
                className="text-stone-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {!currentStaffUser ? (
          <SalonLogin
            stylists={stylists}
            onLoginSuccess={(user) => {
              setCurrentStaffUser(user);
              showLiveToast(`Welcome back, ${user.name}! (${user.role.toUpperCase()})`, 'success');
            }}
            onBackToCustomer={() => setPortalMode('customer')}
          />
        ) : (
          <SalonDashboard
            currentUser={currentStaffUser}
            stylists={stylists}
            appointments={appointments}
            services={services}
            onLogout={() => {
              setCurrentStaffUser(null);
              showLiveToast('Signed out of salon operations desk.', 'info');
            }}
            onSwitchToCustomerView={() => setPortalMode('customer')}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onUpdateStylistLiveStatus={handleUpdateStylistLiveStatus}
            onAddAppointment={handleBookAppointment}
            onCancelAppointment={handleCancelAppointment}
            onRescheduleAppointment={handleRescheduleAppointment}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Customer Header */}
      <Header
        stylists={stylists}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myAppointmentsCount={myActiveAppointmentsCount}
        remindersCount={reminders.length}
        currentStaffUser={currentStaffUser}
        onSimulateRealtimeEvent={handleSimulateRealtimeEvent}
        onTriggerTestAlert={() => trigger15MinuteAlertForAppointment()}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenHelpModal={() => setShowHelpModal(true)}
        onSwitchToSalonPortal={() => {
          setPortalMode('salon');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 15-Minute Appointment Reminder Alert Banner */}
      <AppointmentReminderAlert
        activeReminder={activeAlertReminder}
        onDismiss={handleDismissReminder}
        onSnooze={handleSnoozeReminder}
        onViewBookingPass={handleViewBookingPass}
      />

      {/* Real-time floating toast notice */}
      {liveNotification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium ${
              liveNotification.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-stone-900 text-stone-100 border-stone-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{liveNotification.text}</span>
            <button
              type="button"
              onClick={() => setLiveNotification(null)}
              className="text-stone-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Customer Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6">
          {activeTab === 'book' && (
            <BookingWizard
              key={`${bookingPrefill.stylistId || 'any'}-${bookingPrefill.serviceId || ''}-${bookingPrefill.date || ''}-${bookingPrefill.time || ''}`}
              services={services}
              stylists={stylists}
              appointments={appointments}
              initialStylistId={bookingPrefill.stylistId}
              initialServiceId={bookingPrefill.serviceId}
              initialDate={bookingPrefill.date}
              initialTime={bookingPrefill.time}
              onBookAppointment={handleBookAppointment}
              onViewBookings={() => setActiveTab('my-appointments')}
              onViewMatrix={() => setActiveTab('matrix')}
              onTriggerReminderAlert={trigger15MinuteAlertForAppointment}
              onUpdateAppointmentPayment={handleUpdateAppointmentPayment}
            />
          )}

          {activeTab === 'matrix' && (
            <LiveAvailabilityMatrix
              stylists={stylists}
              appointments={appointments}
              services={services}
              onSelectSlotToBook={handleSelectSlotFromMatrix}
              onViewStylistProfile={(stylist) => setViewingStylist(stylist)}
            />
          )}

          {activeTab === 'services' && (
            <ServicesCatalog
              services={services}
              onSelectServiceToBook={handleSelectServiceFromCatalog}
            />
          )}

          {activeTab === 'my-appointments' && (
            <AppointmentList
              appointments={appointments}
              stylists={stylists}
              services={services}
              onCancelAppointment={handleCancelAppointment}
              onRescheduleAppointment={handleRescheduleAppointment}
              onNewBookingClick={() => {
                setBookingPrefill({});
                setActiveTab('book');
              }}
              onTriggerReminderAlert={trigger15MinuteAlertForAppointment}
              onUpdateAppointmentPayment={handleUpdateAppointmentPayment}
            />
          )}

          {activeTab === 'about' && (
            <AboutSalon
              onBookNowClick={() => {
                setBookingPrefill({});
                setActiveTab('book');
              }}
            />
          )}
        </div>
      </main>

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        reminders={reminders}
        onDismissReminder={handleDismissReminder}
        onClearAllReminders={handleClearAllReminders}
        onTriggerTestAlert={(app) => trigger15MinuteAlertForAppointment(app)}
        onViewAppointmentPass={handleViewBookingPass}
        appointments={appointments}
        services={services}
        stylists={stylists}
      />

      {/* Stylist Profile Modal */}
      {viewingStylist && (
        <StylistProfileModal
          stylist={viewingStylist}
          onClose={() => setViewingStylist(null)}
          onBookWithStylist={(stylistId) => {
            setBookingPrefill({ stylistId });
            setActiveTab('book');
          }}
        />
      )}

      {/* Customer Concierge & Reception Desk Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 font-serif text-base">
                    Salon Concierge Desk
                  </h3>
                  <p className="text-[11px] text-stone-500">Roopam Indiranagar • Open 10 AM - 9 PM IST</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 space-y-3.5 text-xs text-stone-600">
              <p className="leading-relaxed">
                Have a special request, bridal enquiry, or need to inform us about running late for your appointment? Reach our front desk team directly:
              </p>

              <div className="space-y-2">
                <a
                  href="tel:+919820012345"
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-950 hover:bg-amber-100 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="font-bold text-sm block">+91 98200 12345</span>
                      <span className="text-[10px] text-amber-700">Direct Reception Phone line</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                    Call Now
                  </span>
                </a>

                <a
                  href="https://wa.me/919820012345?text=Hi%20Roopam%20Salon,%20I%20have%20a%20query%20about%20booking%20an%20appointment."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-950 hover:bg-emerald-100 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-emerald-700" />
                    <div>
                      <span className="font-bold text-sm block">WhatsApp Concierge</span>
                      <span className="text-[10px] text-emerald-700">Instant chat &amp; photo consultation</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    Chat
                  </span>
                </a>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Salon Address &amp; Parking</span>
                </div>
                <p className="text-stone-500">
                  #412, 100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038.
                </p>
                <p className="text-emerald-700 font-medium">
                  ✓ Complimentary Valet Parking available for all salon guests.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cancellation &amp; Rescheduling</span>
                </div>
                <p className="text-stone-500">
                  You can cancel or reschedule anytime from "My Bookings" with no cancellation penalty.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Customer Luxury Salon Footer */}
      <footer className="border-t border-stone-200 bg-white py-8 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-serif font-bold text-stone-900 text-base">Roopam</span>
                <span className="text-[10px] tracking-wider uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                  Salon &amp; Spa
                </span>
              </div>
              <p className="text-stone-500 text-xs leading-relaxed">
                Experience world-class hair artistry, Cheryl's De-Tan rituals, O3+ facials, and authentic Ayurvedic scalp Champis.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-stone-900 mb-2">Salon Timings &amp; Location</h4>
              <p className="text-stone-600">Monday - Sunday: 10:00 AM – 9:00 PM IST</p>
              <p className="text-stone-500 mt-1">100 Feet Road, Indiranagar, Bengaluru</p>
              <p className="text-amber-700 font-medium mt-1">Valet Parking Available</p>
            </div>

            <div>
              <h4 className="font-semibold text-stone-900 mb-2">Guest Amenities</h4>
              <ul className="space-y-1 text-stone-600">
                <li>• Complimentary Masala Chai &amp; Filter Coffee</li>
                <li>• 100% Sanitized &amp; Single-Use Disposable Capes</li>
                <li>• High-Speed Salon Guest Wi-Fi</li>
                <li>• Silent Relaxation Mode available upon request</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-stone-900 mb-2">Instant Assistance</h4>
              <p className="text-stone-600">Helpline: +91 98200 12345</p>
              <p className="text-stone-600">WhatsApp: +91 98200 12345</p>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="mt-2 text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Concierge &amp; Map Info</span>
                <span>→</span>
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-400">
            <p>© 2026 Roopam Luxury Indian Salon &amp; Spa. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className="hover:text-stone-700 underline cursor-pointer"
              >
                Rate Card (₹)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveTab('my-appointments')}
                className="hover:text-stone-700 underline cursor-pointer"
              >
                My Bookings
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveTab('about')}
                className="hover:text-stone-700 underline cursor-pointer"
              >
                Amenities &amp; Hygiene
              </button>
              <span>•</span>
              <button
                id="footer-salon-staff-portal-btn"
                type="button"
                onClick={() => {
                  setPortalMode('salon');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-300/60 hover:border-amber-400/80 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-200/50 text-amber-800 transition-all duration-300 ease-out group-hover:bg-amber-300/80 group-hover:text-amber-900 group-hover:shadow-[0_0_14px_rgba(217,119,6,0.5)] group-hover:ring-2 group-hover:ring-amber-400/60">
                  <ShieldCheck className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="absolute inset-0 rounded-full bg-amber-400/25 filter blur-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
                </span>
                <span>Salon Staff Portal</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
