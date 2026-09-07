import React, { useState } from 'react';
import { Appointment, SalonService, Stylist } from '../types';
import {
  addMinutesToTime,
  formatDatePretty,
  formatTime12h,
  generateSalonSlots,
  getDaysArray,
  getStylistSlotAvailability,
} from '../utils/timeUtils';
import { AlertCircle, Calendar, CheckCircle2, Clock, X } from 'lucide-react';

interface RescheduleModalProps {
  appointment: Appointment;
  stylists: Stylist[];
  services: SalonService[];
  allAppointments: Appointment[];
  onClose: () => void;
  onConfirmReschedule: (appointmentId: string, newDate: string, newStartTime: string, newEndTime: string) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  stylists,
  services,
  allAppointments,
  onClose,
  onConfirmReschedule,
}) => {
  const days = getDaysArray(7);
  const stylist = stylists.find((s) => s.id === appointment.stylistId);
  const service = services.find((s) => s.id === appointment.serviceId);

  const [newDate, setNewDate] = useState<string>(appointment.date);
  const [newTime, setNewTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!stylist || !service) return null;

  // Calculate open slots for this stylist on selected new date
  const allSlots = generateSalonSlots(9, 19, 30);
  const slotsWithAvailability = allSlots.map((slot) => {
    const check = getStylistSlotAvailability(
      stylist,
      newDate,
      slot,
      service.durationMinutes,
      allAppointments,
      appointment.id // exclude current appointment so its old time is seen or not blocked if on same day
    );
    return {
      time: slot,
      endTime: addMinutesToTime(slot, service.durationMinutes),
      isAvailable: check.isAvailable,
    };
  });

  const handleSave = () => {
    if (!newTime) {
      setError('Please select a new time slot.');
      return;
    }

    const calculatedEndTime = addMinutesToTime(newTime, service.durationMinutes);
    onConfirmReschedule(appointment.id, newDate, newTime, calculatedEndTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-lg font-bold font-serif text-stone-900">
              Reschedule Appointment
            </h3>
            <p className="text-xs text-stone-500">
              Ref #{appointment.code} • {stylist.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-4">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
            <span className="text-stone-500 block">Current Schedule:</span>
            <span className="font-semibold text-stone-800">
              {formatDatePretty(appointment.date)} at {formatTime12h(appointment.startTime)} - {formatTime12h(appointment.endTime)}
            </span>
            <span className="text-stone-500 block mt-0.5">Service: {service.name} ({service.durationMinutes} min)</span>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Select New Date
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {days.slice(0, 4).map((d) => (
                <button
                  key={d.dateString}
                  type="button"
                  onClick={() => {
                    setNewDate(d.dateString);
                    setNewTime('');
                  }}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                    newDate === d.dateString
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200'
                  }`}
                >
                  <span className="text-[10px] block uppercase">{d.dayName}</span>
                  <span className="font-bold text-sm">{d.dayNumber}</span>
                </button>
              ))}
            </div>
          </div>

          {/* New Time Slots */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Available Slots with {stylist.name.split(' ')[0]} ({formatDatePretty(newDate)})
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-stone-50/60 rounded-xl border border-stone-200">
              {slotsWithAvailability.map((slot) => {
                if (!slot.isAvailable) {
                  return (
                    <div
                      key={slot.time}
                      className="p-2 text-center rounded-lg bg-stone-200/40 text-stone-400 text-xs cursor-not-allowed"
                    >
                      {formatTime12h(slot.time)}
                    </div>
                  );
                }
                const isSelected = newTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setNewTime(slot.time)}
                    className={`p-2 text-center rounded-lg border text-xs font-mono font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white hover:border-amber-400 border-stone-200 text-stone-800'
                    }`}
                  >
                    {formatTime12h(slot.time)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!newTime}
            onClick={handleSave}
            className={`px-5 py-2 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer ${
              newTime
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            Update Time Slot
          </button>
        </div>
      </div>
    </div>
  );
};
