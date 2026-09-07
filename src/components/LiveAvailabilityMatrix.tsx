import React, { useState } from 'react';
import { Appointment, SalonService, Stylist } from '../types';
import {
  formatDatePretty,
  formatTime12h,
  getDaysArray,
  getStylistDaySchedule,
  getStylistSlotAvailability,
  getTodayDateString,
  timeToMinutes,
} from '../utils/timeUtils';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Coffee,
  Info,
  Sparkles,
  Star,
  User,
  Zap,
} from 'lucide-react';

interface LiveAvailabilityMatrixProps {
  stylists: Stylist[];
  appointments: Appointment[];
  services: SalonService[];
  onSelectSlotToBook: (stylistId: string, date: string, time: string) => void;
  onViewStylistProfile: (stylist: Stylist) => void;
}

export const LiveAvailabilityMatrix: React.FC<LiveAvailabilityMatrixProps> = ({
  stylists,
  appointments,
  services,
  onSelectSlotToBook,
  onViewStylistProfile,
}) => {
  const days = getDaysArray(7);
  const [selectedDate, setSelectedDate] = useState<string>(days[0].dateString);
  const [selectedStylistFilter, setSelectedStylistFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const filteredStylists = stylists.filter((s) => {
    if (selectedStylistFilter !== 'all' && s.id !== selectedStylistFilter) {
      return false;
    }
    return true;
  });

  const isToday = selectedDate === getTodayDateString();

  return (
    <div className="space-y-6">
      {/* Top Banner introducing Real-Time Availability */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 border border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Grid Feed
            </span>
            <span className="text-xs text-stone-400">Synced to Salon Booking Engine</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-stone-100">
            Real-Time Stylist Availability
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
            Browse our team&apos;s live schedules and booked services. Click any available time slot below to instantly reserve your appointment with your preferred stylist.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-stone-950/80 px-3.5 py-2.5 rounded-xl border border-stone-800 self-start md:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500 text-emerald-400 inline-block"></span>
            <span className="text-stone-300">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-stone-800 border border-stone-700 text-stone-400 inline-block"></span>
            <span className="text-stone-400">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-950/40 border border-amber-800/40 text-amber-400 inline-block"></span>
            <span className="text-stone-400">Break / Shift</span>
          </div>
        </div>
      </div>

      {/* Date Carousel Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <CalendarIcon className="w-4 h-4 text-amber-600" />
            <span>Select Date</span>
            <span className="text-xs font-normal text-stone-500">
              ({formatDatePretty(selectedDate)})
            </span>
          </div>
          {isToday && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Viewing Today&apos;s Live Slots
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {days.map((d) => {
            const isSelected = d.dateString === selectedDate;
            // Calculate total free slots for this day across all stylists
            let totalDaySlots = 0;
            let availableDaySlots = 0;
            stylists.forEach((stylist) => {
              const sched = getStylistDaySchedule(stylist, d.dateString, appointments);
              sched.forEach((s) => {
                totalDaySlots++;
                if (s.isAvailable) availableDaySlots++;
              });
            });

            return (
              <button
                key={d.dateString}
                id={`date-pill-${d.dateString}`}
                type="button"
                onClick={() => setSelectedDate(d.dateString)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-stone-50/70 hover:bg-stone-100 text-stone-800 border-stone-200'
                }`}
              >
                <span className={`text-[11px] font-medium uppercase tracking-wider ${isSelected ? 'text-amber-400' : 'text-stone-500'}`}>
                  {d.dayName}
                </span>
                <span className="text-lg font-bold my-0.5">{d.dayNumber}</span>
                <span className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-emerald-700 font-medium'}`}>
                  {availableDaySlots} slots open
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stylist Quick Cards & Live Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stylists.map((stylist) => {
          // Find next open slot today
          const schedule = getStylistDaySchedule(stylist, selectedDate, appointments);
          const nextSlot = schedule.find((s) => s.isAvailable);

          return (
            <div
              key={stylist.id}
              className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition"
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    <img
                      src={stylist.avatar}
                      alt={stylist.name}
                      referrerPolicy="no-referrer"
                      className="w-13 h-13 rounded-full object-cover border-2 border-stone-100 shadow-xs"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        stylist.liveStatus === 'available'
                          ? 'bg-emerald-500'
                          : stylist.liveStatus === 'in_service'
                          ? 'bg-amber-500'
                          : 'bg-stone-400'
                      }`}
                      title={`Status: ${stylist.liveStatus}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-stone-900 truncate text-sm">
                        {stylist.name}
                      </h3>
                      <div className="flex items-center gap-0.5 text-xs text-amber-600 font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{stylist.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 truncate">{stylist.role}</p>
                    
                    {/* Live status pill */}
                    <div className="mt-1">
                      {isToday ? (
                        stylist.liveStatus === 'available' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Available Now
                          </span>
                        ) : stylist.liveStatus === 'in_service' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            In Service (Free ~{formatTime12h(stylist.nextFreeTime || '10:30')})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                            <Coffee className="w-3 h-3 text-stone-500" />
                            On Break
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-stone-500">
                          Shift: {formatTime12h(stylist.workingHours.start)} - {formatTime12h(stylist.workingHours.end)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specialties chips */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(stylist.specialties || []).map((spec) => (
                    <span
                      key={spec}
                      className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onViewStylistProfile(stylist)}
                  className="text-xs text-stone-600 hover:text-stone-900 font-medium underline-offset-2 hover:underline cursor-pointer"
                >
                  View Profile
                </button>
                {nextSlot ? (
                  <button
                    type="button"
                    onClick={() => onSelectSlotToBook(stylist.id, selectedDate, nextSlot.time)}
                    className="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-2.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Next: {formatTime12h(nextSlot.time)}</span>
                  </button>
                ) : (
                  <span className="text-xs text-stone-400 font-medium">Fully booked</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Availability Matrix Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
          <div>
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <span>Time Slot Schedule for {formatDatePretty(selectedDate)}</span>
            </h3>
            <p className="text-xs text-stone-500">
              Showing 30-minute intervals. Click any green slot to schedule directly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Filter Stylist:</span>
            <select
              value={selectedStylistFilter}
              onChange={(e) => setSelectedStylistFilter(e.target.value)}
              className="text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Stylists ({stylists.length})</option>
              {stylists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Table Header with Stylist columns */}
            <div className="grid grid-cols-12 bg-stone-100/70 border-b border-stone-200 text-xs font-semibold text-stone-700">
              <div className="col-span-2 p-3 text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Time Slot</span>
              </div>
              <div
                className={`col-span-10 grid ${
                  filteredStylists.length === 1
                    ? 'grid-cols-1'
                    : filteredStylists.length === 2
                    ? 'grid-cols-2'
                    : filteredStylists.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-4'
                } divide-x divide-stone-200`}
              >
                {filteredStylists.map((stylist) => (
                  <div key={stylist.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={stylist.avatar}
                        alt={stylist.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover border border-stone-200"
                      />
                      <span className="font-semibold text-stone-900">{stylist.name}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 hidden sm:inline">
                      {formatTime12h(stylist.workingHours.start)} - {formatTime12h(stylist.workingHours.end)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Matrix Rows: 30-min increments */}
            <div className="divide-y divide-stone-100">
              {getStylistDaySchedule(stylists[0], selectedDate, appointments).map((slotInfo) => {
                const timeStr = slotInfo.time;
                const formattedTime = formatTime12h(timeStr);

                return (
                  <div key={timeStr} className="grid grid-cols-12 items-stretch hover:bg-stone-50/40 transition">
                    {/* Time Column */}
                    <div className="col-span-2 p-2.5 sm:p-3 text-xs font-medium text-stone-600 bg-stone-50/70 flex items-center border-r border-stone-100">
                      <span className="font-mono text-stone-700">{formattedTime}</span>
                    </div>

                    {/* Stylists Cells */}
                    <div
                      className={`col-span-10 grid ${
                        filteredStylists.length === 1
                          ? 'grid-cols-1'
                          : filteredStylists.length === 2
                          ? 'grid-cols-2'
                          : filteredStylists.length === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-4'
                      } divide-x divide-stone-100 p-1.5 gap-1.5`}
                    >
                      {filteredStylists.map((stylist) => {
                        const check = getStylistSlotAvailability(
                          stylist,
                          selectedDate,
                          timeStr,
                          30,
                          appointments
                        );

                        if (check.isAvailable) {
                          return (
                            <button
                              key={stylist.id}
                              id={`slot-${stylist.id}-${selectedDate}-${timeStr}`}
                              type="button"
                              onClick={() => onSelectSlotToBook(stylist.id, selectedDate, timeStr)}
                              className="w-full text-left py-2 px-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100/80 text-emerald-800 transition flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></span>
                                <span className="text-xs font-medium">Available</span>
                              </div>
                              <span className="text-[11px] font-semibold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                + Book
                              </span>
                            </button>
                          );
                        } else if (check.reason === 'booked') {
                          const bookedApp = check.conflictAppointment;
                          const service = services.find((s) => s.id === bookedApp?.serviceId);

                          return (
                            <div
                              key={stylist.id}
                              className="w-full py-2 px-2.5 rounded-lg bg-stone-100 text-stone-500 border border-stone-200/60 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                                <span className="text-xs font-medium text-stone-600 truncate">
                                  Booked ({service ? service.name.split(' ')[0] : 'Service'})
                                </span>
                              </div>
                              <span className="text-[10px] text-stone-400">Reserved</span>
                            </div>
                          );
                        } else if (check.reason === 'break') {
                          return (
                            <div
                              key={stylist.id}
                              className="w-full py-2 px-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1.5">
                                <Coffee className="w-3 h-3 text-amber-600" />
                                <span className="text-xs font-medium">Scheduled Break</span>
                              </div>
                            </div>
                          );
                        } else {
                          // Outside hours
                          return (
                            <div
                              key={stylist.id}
                              className="w-full py-2 px-2.5 rounded-lg bg-stone-50 text-stone-400 border border-dashed border-stone-200 flex items-center justify-center text-[11px]"
                            >
                              Off Shift
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
