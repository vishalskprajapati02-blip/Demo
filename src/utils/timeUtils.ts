import { Appointment, Stylist, TimeSlot } from '../types';

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutesTotal: number): string {
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const total = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(total);
}

export function formatDatePretty(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
  const day = tomorrow.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysArray(numDays: number = 7): { dateString: string; label: string; dayName: string; dayNumber: number; isToday: boolean }[] {
  const today = new Date();
  const list = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    list.push({
      dateString,
      label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      dayName: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: i === 0,
    });
  }
  return list;
}

// Generate slots (e.g. every 30 mins) between Indian salon hours (10:00 - 21:00)
export function generateSalonSlots(startHour: number = 10, endHour: number = 21, intervalMinutes: number = 30): string[] {
  const slots: string[] = [];
  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (currentMinutes < endMinutes) {
    slots.push(minutesToTime(currentMinutes));
    currentMinutes += intervalMinutes;
  }
  return slots;
}

// Checks if a stylist is available at a given time and for a specific duration
export function getStylistSlotAvailability(
  stylist: Stylist,
  date: string,
  startTime: string,
  durationMinutes: number,
  allAppointments: Appointment[],
  excludeAppointmentId?: string
): { isAvailable: boolean; reason?: 'booked' | 'break' | 'outside_hours' | 'past'; conflictAppointment?: Appointment } {
  const requestedStart = timeToMinutes(startTime);
  const requestedEnd = requestedStart + durationMinutes;

  const stylistStart = timeToMinutes(stylist.workingHours.start);
  const stylistEnd = timeToMinutes(stylist.workingHours.end);

  // Outside shift hours
  if (requestedStart < stylistStart || requestedEnd > stylistEnd) {
    return { isAvailable: false, reason: 'outside_hours' };
  }

  // Check breaks
  for (const b of stylist.breaks) {
    const breakStart = timeToMinutes(b.start);
    const breakEnd = timeToMinutes(b.end);
    // Overlap check
    if (requestedStart < breakEnd && requestedEnd > breakStart) {
      return { isAvailable: false, reason: 'break' };
    }
  }

  // Check existing appointments on this date
  const activeAppointments = allAppointments.filter(
    (app) => app.stylistId === stylist.id && app.date === date && app.status !== 'cancelled' && app.id !== excludeAppointmentId
  );

  for (const app of activeAppointments) {
    const appStart = timeToMinutes(app.startTime);
    const appEnd = timeToMinutes(app.endTime);
    // Overlap check
    if (requestedStart < appEnd && requestedEnd > appStart) {
      return { isAvailable: false, reason: 'booked', conflictAppointment: app };
    }
  }

  return { isAvailable: true };
}

// Get day timeline for a stylist (all slots and their status)
export function getStylistDaySchedule(
  stylist: Stylist,
  date: string,
  allAppointments: Appointment[],
  intervalMinutes: number = 30
): TimeSlot[] {
  const slots = generateSalonSlots(10, 21, intervalMinutes);
  return slots.map((slot) => {
    const slotEnd = addMinutesToTime(slot, intervalMinutes);
    const check = getStylistSlotAvailability(stylist, date, slot, intervalMinutes, allAppointments);
    return {
      time: slot,
      endTime: slotEnd,
      isAvailable: check.isAvailable,
      reason: check.reason,
      occupyingAppointment: check.conflictAppointment,
    };
  });
}
