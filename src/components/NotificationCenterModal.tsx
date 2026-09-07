import React from 'react';
import { Appointment, AppointmentReminder, SalonService, Stylist } from '../types';
import { formatDatePretty, formatTime12h } from '../utils/timeUtils';
import {
  Bell,
  Check,
  Clock,
  Coffee,
  Play,
  Scissors,
  Trash2,
  X,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: AppointmentReminder[];
  onDismissReminder: (id: string) => void;
  onClearAllReminders: () => void;
  onTriggerTestAlert: (appointment?: Appointment) => void;
  onViewAppointmentPass: (code: string) => void;
  appointments: Appointment[];
  services: SalonService[];
  stylists: Stylist[];
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onDismissReminder,
  onClearAllReminders,
  onTriggerTestAlert,
  onViewAppointmentPass,
  appointments,
  services,
  stylists,
}) => {
  if (!isOpen) return null;

  const activeAppointments = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'in_progress'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 font-serif text-lg">
                Salon Notifications &amp; Reminders
              </h3>
              <p className="text-xs text-stone-500">
                15-Minute upcoming appointment alerts &amp; live floor pings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Simulation Bar */}
        <div className="my-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Test Notification System</span>
              </span>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Simulate the 15-minute pre-service alert with audio chime right now.
              </p>
            </div>
            <button
              id="simulate-15min-alert-btn"
              type="button"
              onClick={() => {
                onTriggerTestAlert();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shrink-0 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Trigger Alert</span>
            </button>
          </div>
        </div>

        {/* Reminders List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <Bell className="w-8 h-8 mx-auto mb-2 text-stone-300 stroke-1" />
              <p className="text-xs font-medium text-stone-600">No active alerts right now</p>
              <p className="text-[11px] text-stone-400 mt-1 max-w-xs mx-auto">
                The system automatically monitors your bookings and fires an alert 15 minutes before your service start time.
              </p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-300 transition space-y-2 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-xs font-bold text-stone-900">
                      15-Minute Pre-Service Alert
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                      #{reminder.appointmentCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDismissReminder(reminder.id)}
                    className="text-stone-400 hover:text-stone-600 p-1 rounded cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-stone-700 font-medium">
                  <span className="font-bold text-stone-900">{reminder.serviceName}</span> with{' '}
                  <span className="text-amber-800 font-semibold">{reminder.stylistName}</span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-stone-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Starts at {formatTime12h(reminder.startTime)}
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <Coffee className="w-3 h-3" />
                    {reminder.welcomeBeverage || 'Masala Chai'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                  <span className="text-[10px] text-stone-400">{reminder.timestamp}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onViewAppointmentPass(reminder.appointmentCode);
                      onClose();
                    }}
                    className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>View Booking Pass</span>
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Quick List of upcoming appointments to test with */}
          {activeAppointments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-stone-100">
              <h4 className="text-xs font-bold text-stone-700 mb-2">
                Upcoming Bookings Available for Simulation:
              </h4>
              <div className="space-y-1.5">
                {activeAppointments.slice(0, 3).map((app) => {
                  const srv = services.find((s) => s.id === app.serviceId);
                  const sty = stylists.find((s) => s.id === app.stylistId);
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-stone-900">{srv?.name}</span>
                        <span className="text-stone-500 text-[11px] block">
                          {formatDatePretty(app.date)} • {formatTime12h(app.startTime)} with {sty?.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onTriggerTestAlert(app);
                          onClose();
                        }}
                        className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 transition cursor-pointer"
                      >
                        Test Alert
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-3">
          {reminders.length > 0 ? (
            <button
              type="button"
              onClick={onClearAllReminders}
              className="text-xs text-stone-400 hover:text-rose-600 transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Reminders</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
