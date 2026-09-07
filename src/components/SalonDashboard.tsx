import React, { useState, useMemo } from 'react';
import {
  Appointment,
  AppointmentStatus,
  SalonService,
  StaffUser,
  Stylist,
  StylistStatus,
} from '../types';
import {
  formatDatePretty,
  formatTime12h,
  getTodayDateString,
  getTomorrowDateString,
  timeToMinutes,
  formatINR,
} from '../utils/timeUtils';
import {
  Scissors,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  X,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  DollarSign,
  Coffee,
  LogOut,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { RescheduleModal } from './RescheduleModal';

interface SalonDashboardProps {
  currentUser: StaffUser;
  stylists: Stylist[];
  appointments: Appointment[];
  services: SalonService[];
  onLogout: () => void;
  onSwitchToCustomerView: () => void;
  onUpdateAppointmentStatus: (
    appointmentId: string,
    status: AppointmentStatus,
    stylistId?: string
  ) => void;
  onUpdateStylistLiveStatus: (
    stylistId: string,
    status: StylistStatus,
    currentClient?: string,
    currentService?: string,
    nextFreeTime?: string
  ) => void;
  onAddAppointment: (
    appointmentData: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'status'>
  ) => Promise<Appointment>;
  onCancelAppointment: (appointmentId: string) => void;
  onRescheduleAppointment: (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => void;
}

export const SalonDashboard: React.FC<SalonDashboardProps> = ({
  currentUser,
  stylists,
  appointments,
  services,
  onLogout,
  onSwitchToCustomerView,
  onUpdateAppointmentStatus,
  onUpdateStylistLiveStatus,
  onAddAppointment,
  onCancelAppointment,
  onRescheduleAppointment,
}) => {
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  const [activeTab, setActiveTab] = useState<'schedule' | 'floor' | 'services'>('schedule');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [stylistFilter, setStylistFilter] = useState<string>('all');

  // Fast Walk-in Modal
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInClientName, setWalkInClientName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState(services[0]?.id || '');
  const [walkInStylistId, setWalkInStylistId] = useState(stylists[0]?.id || '');
  const [walkInStartTime, setWalkInStartTime] = useState('10:00');
  const [walkInNotes, setWalkInNotes] = useState('Front-Desk Walk-in / Direct check-in');
  const [isSeatingImmediately, setIsSeatingImmediately] = useState(true);

  // Reschedule state
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);

  // Manual stylist break modal / action
  const [activeStylistActionModal, setActiveStylistActionModal] = useState<Stylist | null>(null);

  // Filtered Appointments for schedule view
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((app) => {
        // Date match
        if (selectedDate && app.date !== selectedDate) return false;
        // Status match
        if (statusFilter !== 'all' && app.status !== statusFilter) return false;
        // Stylist match
        if (stylistFilter !== 'all' && app.stylistId !== stylistFilter) return false;
        // Search match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = app.code.toLowerCase().includes(q);
          const matchClient = app.customerName.toLowerCase().includes(q);
          const matchPhone = app.customerPhone.toLowerCase().includes(q);
          const serviceName = services.find((s) => s.id === app.serviceId)?.name.toLowerCase() || '';
          if (!matchCode && !matchClient && !matchPhone && !serviceName.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate, statusFilter, stylistFilter, searchQuery, services]);

  // Daily summary stats
  const todayAppointments = useMemo(() => {
    return appointments.filter((a) => a.date === selectedDate);
  }, [appointments, selectedDate]);

  const activeInChairCount = todayAppointments.filter((a) => a.status === 'in_progress').length;
  const completedTodayCount = todayAppointments.filter((a) => a.status === 'completed').length;
  const confirmedCount = todayAppointments.filter((a) => a.status === 'confirmed').length;

  const todayGrossRevenue = todayAppointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.price, 0);

  const availableStylistsCount = stylists.filter((s) => s.liveStatus === 'available').length;
  const inServiceStylistsCount = stylists.filter((s) => s.liveStatus === 'in_service').length;
  const onBreakStylistsCount = stylists.filter((s) => s.liveStatus === 'on_break').length;

  // Handle Seat Client / Start Service
  const handleSeatClient = (appointment: Appointment) => {
    onUpdateAppointmentStatus(appointment.id, 'in_progress', appointment.stylistId);
    const service = services.find((s) => s.id === appointment.serviceId);
    onUpdateStylistLiveStatus(
      appointment.stylistId,
      'in_service',
      appointment.customerName,
      service?.name,
      appointment.endTime
    );
  };

  // Handle Complete Service
  const handleCompleteService = (appointment: Appointment) => {
    onUpdateAppointmentStatus(appointment.id, 'completed', appointment.stylistId);
    // Free the stylist
    onUpdateStylistLiveStatus(appointment.stylistId, 'available', undefined, undefined, 'Now');
  };

  // Handle Walk-In Form Submission
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInClientName.trim()) return;

    const selectedService = services.find((s) => s.id === walkInServiceId) || services[0];
    const duration = selectedService.durationMinutes;

    // Calculate end time
    const [hStr, mStr] = walkInStartTime.split(':');
    const startMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
    const endMins = startMins + duration;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    const formattedPhone = walkInPhone.trim()
      ? (walkInPhone.startsWith('+91') ? walkInPhone : `+91 ${walkInPhone.replace(/\D/g, '').slice(-10)}`)
      : '+91 98000 11223';

    const newApp = await onAddAppointment({
      customerName: walkInClientName,
      customerPhone: formattedPhone,
      customerEmail: 'walkin@roopamsalon.com',
      notes: walkInNotes,
      stylistId: walkInStylistId,
      serviceId: walkInServiceId,
      date: selectedDate,
      startTime: walkInStartTime,
      endTime,
      durationMinutes: duration,
      price: selectedService.price,
    });

    if (isSeatingImmediately && selectedDate === today) {
      handleSeatClient(newApp);
    }

    // Reset & close
    setWalkInClientName('');
    setWalkInPhone('');
    setIsWalkInModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Staff Subheader & User Profile Bar */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-5 sm:p-6 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Scissors className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                  Salon Staff Portal
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  {currentUser.role === 'manager'
                    ? 'General Manager'
                    : currentUser.role === 'receptionist'
                    ? 'Front Desk Reception'
                    : 'Station Stylist'}
                </span>
              </div>
              <h2 className="text-xl font-bold font-serif text-white">
                Welcome back, {currentUser.name}
              </h2>
              <p className="text-xs text-stone-400">
                Live floor status active • Operations synchronized with customer booking
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="salon-switch-to-customer-view-btn"
              type="button"
              onClick={onSwitchToCustomerView}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview Customer View</span>
            </button>

            <button
              id="salon-add-walkin-btn"
              type="button"
              onClick={() => setIsWalkInModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Seat Walk-In / Book</span>
            </button>

            <button
              id="salon-logout-btn"
              type="button"
              onClick={onLogout}
              title="Sign out of salon staff session"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
            <span>Appointments ({selectedDate === today ? 'Today' : formatDatePretty(selectedDate)})</span>
            <Calendar className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-stone-900">
              {todayAppointments.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {confirmedCount} confirmed
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
            <span>Currently In Chair</span>
            <Scissors className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-amber-600">
              {activeInChairCount}
            </span>
            <span className="text-[11px] text-stone-500">active now</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-emerald-700">
              {completedTodayCount}
            </span>
            <span className="text-[11px] text-stone-500">clients served</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
            <span>Floor Stylists</span>
            <UserCheck className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-stone-900">
              {availableStylistsCount}
            </span>
            <span className="text-[11px] text-stone-500">
              avail of {stylists.length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
            <span>Scheduled Revenue</span>
            <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              ₹ INR
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-serif text-stone-900">
              {formatINR(todayGrossRevenue)}
            </span>
            <span className="text-[11px] text-stone-400">est. gross</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation for Salon Panel */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="salon-tab-schedule"
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule &amp; Appointments</span>
            <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-stone-700 text-stone-200">
              {filteredAppointments.length}
            </span>
          </button>

          <button
            id="salon-tab-floor"
            type="button"
            onClick={() => setActiveTab('floor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'floor'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Floor &amp; Stylist Stations</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          <button
            id="salon-tab-services"
            type="button"
            onClick={() => setActiveTab('services')}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'services'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Service Catalog ({services.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MASTER APPOINTMENT SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Filters and Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Date selection shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedDate === today
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Today ({today})
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(tomorrow)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedDate === tomorrow
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Tomorrow
              </button>
              <div className="relative inline-block">
                <input
                  id="salon-custom-date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border border-stone-300 bg-stone-50 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Search and drop-down filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="salon-search-input"
                  type="text"
                  placeholder="Search code, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Status Filter */}
              <select
                id="salon-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Stylist Filter */}
              <select
                id="salon-stylist-filter"
                value={stylistFilter}
                onChange={(e) => setStylistFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="all">All Stylists</option>
                {stylists.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointment List / Table */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-stone-200 text-center space-y-3">
              <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No appointments scheduled</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No bookings found for {formatDatePretty(selectedDate)} matching your active filters.
              </p>
              <button
                type="button"
                onClick={() => setIsWalkInModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Seat a Walk-In Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((app) => {
                const service = services.find((s) => s.id === app.serviceId);
                const stylist = stylists.find((s) => s.id === app.stylistId);

                return (
                  <div
                    key={app.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition shadow-2xs hover:border-stone-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      app.status === 'in_progress'
                        ? 'border-amber-400/80 bg-amber-50/20'
                        : app.status === 'completed'
                        ? 'border-stone-200 bg-stone-50/50 opacity-90'
                        : app.status === 'cancelled'
                        ? 'border-stone-200 bg-stone-50/30 opacity-60'
                        : 'border-stone-200'
                    }`}
                  >
                    {/* Time & Code */}
                    <div className="flex items-start sm:items-center gap-3 min-w-[200px]">
                      <div className="w-14 h-14 rounded-xl bg-stone-900 text-stone-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold font-mono">
                          {formatTime12h(app.startTime)}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {app.durationMinutes}m
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-stone-900">
                            {app.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              app.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : app.status === 'confirmed'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : app.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {app.status.replace('_', ' ')}
                          </span>

                          {app.upiPayment?.isPaid ? (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>UPI Paid ({formatINR(app.upiPayment.paidAmount)})</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                              {app.paymentPreference === 'upi_advance' ? 'UPI Advance Locked' : 'Pay at Counter'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {formatDatePretty(app.date)} • Ends ~{formatTime12h(app.endTime)}
                        </p>
                      </div>
                    </div>

                    {/* Client & Service Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">
                          {app.customerName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{app.customerPhone}</span>
                        </div>
                        {app.notes && (
                          <p className="text-[11px] text-stone-500 italic mt-1 bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                            &ldquo;{app.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-stone-800">
                          {service?.name || 'Salon Service'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-stone-600 mt-0.5">
                          <span>Stylist:</span>
                          <span className="font-semibold text-stone-900">
                            {stylist?.name || 'Assigned Stylist'}
                          </span>
                        </div>
                        <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                          {formatINR(app.price)}
                        </p>
                      </div>
                    </div>

                    {/* Staff Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                      {app.status === 'confirmed' && (
                        <button
                          id={`seat-client-btn-${app.id}`}
                          type="button"
                          onClick={() => handleSeatClient(app)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-2xs transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Seat Client</span>
                        </button>
                      )}

                      {app.status === 'in_progress' && (
                        <button
                          id={`complete-client-btn-${app.id}`}
                          type="button"
                          onClick={() => handleCompleteService(app)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete &amp; Free Chair</span>
                        </button>
                      )}

                      {app.status !== 'cancelled' && app.status !== 'completed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setReschedulingAppointment(app)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition cursor-pointer"
                          >
                            Reschedule
                          </button>

                          <button
                            type="button"
                            onClick={() => onCancelAppointment(app.id)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {app.status === 'completed' && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Finished</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LIVE SALON FLOOR (STATION CHAIRS) */}
      {activeTab === 'floor' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <div>
                <strong className="font-bold">Live Floor Controller:</strong> Stylist status updates
                here are instantly broadcast to the customer availability schedule in real-time.
              </div>
            </div>
            <div className="flex items-center gap-3 text-stone-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> In Chair
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> On Break
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stylists.map((st) => {
              const isCurrentUser = currentUser.stylistId === st.id;
              const activeAppointment = appointments.find(
                (a) => a.stylistId === st.id && a.date === today && a.status === 'in_progress'
              );

              return (
                <div
                  key={st.id}
                  className={`bg-white rounded-3xl p-5 border shadow-2xs transition ${
                    isCurrentUser
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : 'border-stone-200'
                  }`}
                >
                  {/* Stylist Station Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={st.avatar}
                          alt={st.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            st.liveStatus === 'available'
                              ? 'bg-emerald-500'
                              : st.liveStatus === 'in_service'
                              ? 'bg-amber-500'
                              : 'bg-purple-500'
                          }`}
                        ></span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-stone-900 font-serif">
                            {st.name}
                          </h3>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                              Your Station
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500">{st.role}</p>
                        <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                          Hours: {st.workingHours?.start || '10:00'} - {st.workingHours?.end || '21:00'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
                          st.liveStatus === 'available'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : st.liveStatus === 'in_service'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            st.liveStatus === 'available'
                              ? 'bg-emerald-500'
                              : st.liveStatus === 'in_service'
                              ? 'bg-amber-500'
                              : 'bg-purple-500'
                          }`}
                        ></span>
                        {st.liveStatus === 'available'
                          ? 'Available'
                          : st.liveStatus === 'in_service'
                          ? 'In Service'
                          : 'On Break'}
                      </span>
                    </div>
                  </div>

                  {/* Station State Box */}
                  <div className="my-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs">
                    {st.liveStatus === 'in_service' ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 font-medium">Currently In Chair:</span>
                          <span className="font-bold text-stone-900">
                            {st.currentClient || activeAppointment?.customerName || 'Walk-in Guest'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 font-medium">Service Performing:</span>
                          <span className="font-semibold text-amber-700">
                            {st.currentService || 'Precision Styling'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                          <span className="text-stone-500 font-medium">Est. Completion:</span>
                          <span className="font-mono font-bold text-stone-800">
                            ~{st.nextFreeTime || '11:00'}
                          </span>
                        </div>
                      </div>
                    ) : st.liveStatus === 'on_break' ? (
                      <div className="flex items-center gap-2 text-purple-800">
                        <Coffee className="w-4 h-4" />
                        <span>Stylist currently taking scheduled rest / lunch break.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-emerald-800">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Chair is sanitized and open for booking.</span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700">
                          Free Now
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Floor Control Buttons */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      Quick Status Overrides
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        id={`override-avail-${st.id}`}
                        type="button"
                        onClick={() =>
                          onUpdateStylistLiveStatus(st.id, 'available', undefined, undefined, 'Now')
                        }
                        className={`py-2 px-2 text-xs rounded-xl font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          st.liveStatus === 'available'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Available</span>
                      </button>

                      <button
                        id={`override-service-${st.id}`}
                        type="button"
                        onClick={() =>
                          onUpdateStylistLiveStatus(
                            st.id,
                            'in_service',
                            'Walk-in Client',
                            'Studio Service',
                            '12:30'
                          )
                        }
                        className={`py-2 px-2 text-xs rounded-xl font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          st.liveStatus === 'in_service'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200'
                        }`}
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>In Service</span>
                      </button>

                      <button
                        id={`override-break-${st.id}`}
                        type="button"
                        onClick={() =>
                          onUpdateStylistLiveStatus(st.id, 'on_break', undefined, undefined, 'Later')
                        }
                        className={`py-2 px-2 text-xs rounded-xl font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          st.liveStatus === 'on_break'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200'
                        }`}
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        <span>Break</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: SERVICE CATALOG */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-lg font-bold font-serif text-stone-900">
              Salon Service Master Menu
            </h3>
            <p className="text-xs text-stone-500">
              Services offered at L&apos;Atelier Salon with durations and price tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="p-4 rounded-2xl border border-stone-200 hover:border-stone-300 transition flex items-start justify-between gap-3 bg-stone-50/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">{srv.name}</h4>
                    {srv.popular && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{srv.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-stone-600">
                    <span className="font-mono font-medium">{srv.durationMinutes} min</span>
                    <span>•</span>
                    <span className="text-stone-500">{srv.category}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-bold font-mono text-emerald-700">
                    {formatINR(srv.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WALK-IN / FRONT-DESK BOOKING MODAL */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    Seat Walk-in / Add Booking
                  </h3>
                  <p className="text-xs text-stone-500">
                    Front-desk direct check-in and scheduling
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWalkInModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-4 text-xs">
              {/* Client Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={walkInClientName}
                    onChange={(e) => setWalkInClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Client Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 000-0000"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Service & Stylist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Service *
                  </label>
                  <select
                    value={walkInServiceId}
                    onChange={(e) => setWalkInServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} ({formatINR(srv.price)}, {srv.durationMinutes}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Assigned Stylist *
                  </label>
                  <select
                    value={walkInStylistId}
                    onChange={(e) => setWalkInStylistId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    {stylists.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.liveStatus})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time slot */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Start Time ({formatDatePretty(selectedDate)})
                </label>
                <input
                  type="time"
                  value={walkInStartTime}
                  onChange={(e) => setWalkInStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Service Notes
                </label>
                <input
                  type="text"
                  value={walkInNotes}
                  onChange={(e) => setWalkInNotes(e.target.value)}
                  placeholder="Styling preferences, allergy alerts, etc."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Immediate seating checkbox */}
              {selectedDate === today && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <input
                    id="immediate-seat-check"
                    type="checkbox"
                    checked={isSeatingImmediately}
                    onChange={(e) => setIsSeatingImmediately(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label
                    htmlFor="immediate-seat-check"
                    className="text-amber-950 font-medium cursor-pointer"
                  >
                    Seat immediately in chair (Mark appointment In-Progress and update stylist live status)
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Confirm &amp; Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppointment && (
        <RescheduleModal
          appointment={reschedulingAppointment}
          stylists={stylists}
          services={services}
          appointments={appointments}
          onClose={() => setReschedulingAppointment(null)}
          onConfirm={(newDate, newStart, newEnd) => {
            onRescheduleAppointment(
              reschedulingAppointment.id,
              newDate,
              newStart,
              newEnd
            );
            setReschedulingAppointment(null);
          }}
        />
      )}
    </div>
  );
};
