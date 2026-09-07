import React, { useEffect, useState } from 'react';
import { AppointmentReminder } from '../types';
import { formatTime12h } from '../utils/timeUtils';
import {
  Bell,
  Clock,
  Coffee,
  ExternalLink,
  MapPin,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Scissors,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { playSalonChime } from '../utils/soundUtils';

interface AppointmentReminderAlertProps {
  activeReminder: AppointmentReminder | null;
  onDismiss: (reminderId: string) => void;
  onSnooze: (reminderId: string, minutes: number) => void;
  onViewBookingPass: (appointmentCode: string) => void;
}

export const AppointmentReminderAlert: React.FC<AppointmentReminderAlertProps> = ({
  activeReminder,
  onDismiss,
  onSnooze,
  onViewBookingPass,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Play sound when new active reminder appears
  useEffect(() => {
    if (activeReminder && soundEnabled) {
      playSalonChime();
    }
  }, [activeReminder?.id, soundEnabled]);

  if (!activeReminder) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=100+Feet+Road+Indiranagar+Bengaluru`;

  return (
    <div
      id="upcoming-appointment-alert"
      role="alert"
      aria-live="assertive"
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-stone-900/95 backdrop-blur-md text-stone-100 rounded-3xl shadow-2xl border-2 border-amber-500/60 p-5 overflow-hidden relative">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Banner */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md animate-bounce">
                <Bell className="w-5 h-5 fill-stone-950" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                  Salon Reminder
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-semibold">
                  Starts in {activeReminder.minutesRemaining} mins
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-stone-50 leading-tight">
                Upcoming Appointment Alert
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playSalonChime();
              }}
              title={soundEnabled ? 'Mute alert sound' : 'Enable alert sound'}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onDismiss(activeReminder.id)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              title="Dismiss reminder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Appointment Card Details */}
        <div className="bg-stone-950/70 rounded-2xl p-3.5 border border-stone-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-stone-100 text-sm truncate max-w-[200px]">
                {activeReminder.serviceName}
              </span>
            </div>
            <span className="font-mono text-[11px] bg-stone-800 text-amber-300 px-2 py-0.5 rounded border border-stone-700">
              #{activeReminder.appointmentCode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-stone-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>{formatTime12h(activeReminder.startTime)}</strong> - {formatTime12h(activeReminder.endTime)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Stylist: <strong>{activeReminder.stylistName}</strong></span>
            </div>
          </div>

          {/* Hospitality Touch */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-200">
            <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="leading-tight">
              Complimentary <strong>{activeReminder.welcomeBeverage || 'Masala Chai'}</strong> is being prepared for your arrival.
            </span>
          </div>

          {/* Location details */}
          <div className="flex items-start gap-1.5 text-[11px] text-stone-400">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
            <span>100 Feet Road, Indiranagar • Valet Parking ready for you</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 mt-4 pt-1">
          <button
            type="button"
            onClick={() => onSnooze(activeReminder.id, 5)}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition cursor-pointer"
          >
            Snooze 5m
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>Directions</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onViewBookingPass(activeReminder.appointmentCode);
                onDismiss(activeReminder.id);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>View Pass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
