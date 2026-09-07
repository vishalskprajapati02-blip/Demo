import React, { useState } from 'react';
import { Appointment, SalonService, Stylist } from '../types';
import {
  formatDatePretty,
  formatINR,
  formatTime12h,
  getTodayDateString,
} from '../utils/timeUtils';
import {
  AlertTriangle,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Coffee,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Phone,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  User,
  XCircle,
  Bell,
} from 'lucide-react';
import { RescheduleModal } from './RescheduleModal';
import { UPIPaymentModal } from './UPIPaymentModal';

interface AppointmentListProps {
  appointments: Appointment[];
  stylists: Stylist[];
  services: SalonService[];
  onCancelAppointment: (appointmentId: string) => void;
  onRescheduleAppointment: (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => void;
  onNewBookingClick: () => void;
  onTriggerReminderAlert?: (appointment: Appointment) => void;
  onUpdateAppointmentPayment?: (
    appointmentId: string,
    details: { transactionRef: string; paidAmount: number; paidAt: string }
  ) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  stylists,
  services,
  onCancelAppointment,
  onRescheduleAppointment,
  onNewBookingClick,
  onTriggerReminderAlert,
  onUpdateAppointmentPayment,
}) => {
  const [filter, setFilter] = useState<'upcoming' | 'all' | 'cancelled'>('upcoming');
  const [searchPhone, setSearchPhone] = useState<string>('');
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [upiAppointment, setUpiAppointment] = useState<Appointment | null>(null);

  const today = getTodayDateString();

  const filteredAppointments = appointments.filter((app) => {
    // Phone number search
    if (searchPhone.trim()) {
      const cleanSearch = searchPhone.replace(/\D/g, '');
      const cleanAppPhone = app.customerPhone.replace(/\D/g, '');
      if (!cleanAppPhone.includes(cleanSearch) && !app.code.toLowerCase().includes(searchPhone.toLowerCase())) {
        return false;
      }
    }

    if (filter === 'cancelled') {
      return app.status === 'cancelled';
    }
    if (filter === 'upcoming') {
      return app.status !== 'cancelled' && (app.date >= today || app.status === 'in_progress');
    }
    return true; // 'all'
  });

  const generateGoogleCalendarUrl = (app: Appointment) => {
    const service = services.find((s) => s.id === app.serviceId);
    const stylist = stylists.find((s) => s.id === app.stylistId);
    const title = encodeURIComponent(
      `${service?.name || 'Salon Visit'} with ${stylist?.name || 'Stylist'}`
    );
    const details = encodeURIComponent(
      `Booking Ref: ${app.code}\nService: ${service?.name}\nStylist: ${stylist?.name}\nSalon: Roopam Luxury Indian Salon, 100 Feet Road, Indiranagar, Bengaluru\nWelcome Drink: ${app.welcomeBeverage || 'Masala Chai'}`
    );
    const location = encodeURIComponent(
      'Roopam Luxury Salon & Spa, 100 Feet Road, Indiranagar, Bengaluru, Karnataka, India'
    );

    const startIso = `${app.date.replace(/-/g, '')}T${app.startTime.replace(':', '')}00`;
    const endIso = `${app.date.replace(/-/g, '')}T${app.endTime.replace(':', '')}00`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  const getWhatsAppShareUrl = (app: Appointment) => {
    const service = services.find((s) => s.id === app.serviceId);
    const stylist = stylists.find((s) => s.id === app.stylistId);
    const text = encodeURIComponent(
      `*Roopam Salon Appointment Pass* ✂️\n` +
      `• Ref: ${app.code}\n` +
      `• Guest: ${app.customerName}\n` +
      `• Date: ${formatDatePretty(app.date)}\n` +
      `• Time: ${formatTime12h(app.startTime)} - ${formatTime12h(app.endTime)}\n` +
      `• Stylist: ${stylist?.name}\n` +
      `• Service: ${service?.name}\n` +
      `• Welcome Drink: ${app.welcomeBeverage || 'Masala Chai'}\n` +
      `• Status: ${app.status.toUpperCase()}\n` +
      `• Total: ${formatINR(app.price)}\n` +
      `• Salon: Roopam Luxury Salon, 100 Feet Road, Indiranagar, Bengaluru.`
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            Customer Dashboard
          </span>
          <h2 className="text-xl font-bold font-serif text-stone-900 mt-1">
            My Salon Appointments
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            View your scheduled visits, access digital passes, or reschedule with real-time floor verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-medium border border-stone-200">
            {(['upcoming', 'all', 'cancelled'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                  filter === tab
                    ? 'bg-stone-900 text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onNewBookingClick}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book New</span>
          </button>
        </div>
      </div>

      {/* Quick Lookup by Mobile Number (Indian Context) */}
      <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 shrink-0">
          <Search className="w-3.5 h-3.5 text-stone-500" />
          <span>Quick Lookup:</span>
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filter by 10-digit mobile number or Code (e.g. 98201 or ROOP)..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-600"
          />
          {searchPhone && (
            <button
              type="button"
              onClick={() => setSearchPhone('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Appointments Cards List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 text-base">
              No {filter} appointments found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              {searchPhone
                ? `No scheduled visits found matching "${searchPhone}".`
                : filter === 'upcoming'
                ? "You don't have any upcoming visits scheduled."
                : 'No visits match the current filter.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewBookingClick}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            Schedule Your Next Visit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => {
            const stylist = stylists.find((s) => s.id === app.stylistId);
            const service = services.find((s) => s.id === app.serviceId);
            const isConfirmed = app.status === 'confirmed';
            const isInProgress = app.status === 'in_progress';
            const isCompleted = app.status === 'completed';
            const isCancelled = app.status === 'cancelled';

            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl p-5 border transition ${
                  isInProgress
                    ? 'border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/30'
                    : isCancelled
                    ? 'border-stone-200 opacity-75'
                    : 'border-stone-200/90 shadow-2xs hover:border-stone-300'
                }`}
              >
                {/* Top Status & Code Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-stone-900">
                      {app.code}
                    </span>
                    {isInProgress && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        Currently In Chair
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Confirmed Slot
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                        Completed
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        Cancelled
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-stone-900">
                      {formatINR(app.price)}
                    </span>
                    {app.upiPayment?.isPaid ? (
                      <span className="text-[10px] text-emerald-700 font-bold block flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        UPI Paid
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 block">
                        {app.paymentPreference === 'upi_advance' ? 'UPI Advance Locked' : 'Pay at Salon'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Date &amp; Time</span>
                    <span className="font-semibold text-stone-800">
                      {formatDatePretty(app.date)}
                    </span>
                    <span className="text-amber-700 font-medium block">
                      {formatTime12h(app.startTime)} - {formatTime12h(app.endTime)} ({app.durationMinutes}m)
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[11px]">Master Stylist</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <img
                        src={stylist?.avatar}
                        alt={stylist?.name}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="font-semibold text-stone-800 truncate">
                        {stylist?.name || 'Assigned Stylist'}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 block truncate">
                      {stylist?.role}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[11px]">Primary Service</span>
                    <span className="font-semibold text-stone-800 block truncate">
                      {service?.name || 'Salon Treatment'}
                    </span>
                    {app.welcomeBeverage && (
                      <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1 mt-0.5">
                        <Coffee className="w-3 h-3 text-amber-600" />
                        {app.welcomeBeverage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Guest & Contact Info */}
                <div className="pt-2 text-xs text-stone-500 flex flex-wrap items-center gap-3">
                  <span>Guest: <strong className="text-stone-700">{app.customerName}</strong></span>
                  <span>•</span>
                  <span>Phone: <strong className="text-stone-700">{app.customerPhone}</strong></span>
                  {app.notes && (
                    <>
                      <span>•</span>
                      <span className="italic truncate max-w-xs">&ldquo;{app.notes}&rdquo;</span>
                    </>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={getWhatsAppShareUrl(app)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Pass</span>
                    </a>

                    {!isCancelled && (
                      <a
                        href={generateGoogleCalendarUrl(app)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                        <span>Add to Google Cal</span>
                      </a>
                    )}
                  </div>

                  {!isCancelled && !isCompleted && (
                    <div className="flex items-center gap-2">
                      {onTriggerReminderAlert && (
                        <button
                          type="button"
                          onClick={() => onTriggerReminderAlert(app)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-amber-200/80"
                          title="Simulate 15-minute alert in UI for this appointment"
                        >
                          <Bell className="w-3 h-3 text-amber-600" />
                          <span>Test 15m Alert</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setUpiAppointment(app)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                          app.upiPayment?.isPaid
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-2xs'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{app.upiPayment?.isPaid ? 'UPI Receipt' : 'Pay UPI'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReschedulingAppointment(app)}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reschedule</span>
                      </button>

                      {confirmCancelId === app.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onCancelAppointment(app.id);
                              setConfirmCancelId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
                          >
                            Confirm Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(null)}
                            className="px-2 py-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                          >
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(app.id)}
                          className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppointment && (
        <RescheduleModal
          appointment={reschedulingAppointment}
          stylist={stylists.find((s) => s.id === reschedulingAppointment.stylistId)!}
          service={services.find((s) => s.id === reschedulingAppointment.serviceId)!}
          allAppointments={appointments}
          onClose={() => setReschedulingAppointment(null)}
          onConfirm={(newDate, newStart, newEnd) => {
            onRescheduleAppointment(reschedulingAppointment.id, newDate, newStart, newEnd);
            setReschedulingAppointment(null);
          }}
        />
      )}

      {/* UPI Payment Modal */}
      {upiAppointment && (
        <UPIPaymentModal
          isOpen={true}
          onClose={() => setUpiAppointment(null)}
          appointment={upiAppointment}
          onPaymentSuccess={(details) => {
            onUpdateAppointmentPayment?.(upiAppointment.id, details);
            setUpiAppointment((prev) =>
              prev
                ? {
                    ...prev,
                    upiPayment: {
                      isPaid: true,
                      transactionRef: details.transactionRef,
                      paidAmount: details.paidAmount,
                      paidAt: details.paidAt,
                    },
                  }
                : null
            );
          }}
        />
      )}
    </div>
  );
};
