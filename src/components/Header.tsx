import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  Scissors,
  UserCheck,
  Coffee,
  BookOpen,
  PhoneCall,
  MapPin,
  RefreshCw,
  Bell,
  HelpCircle,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { Stylist, StaffUser } from '../types';

interface HeaderProps {
  stylists: Stylist[];
  activeTab: 'book' | 'matrix' | 'my-appointments' | 'services' | 'about';
  setActiveTab: (tab: 'book' | 'matrix' | 'my-appointments' | 'services' | 'about') => void;
  myAppointmentsCount: number;
  remindersCount: number;
  currentStaffUser?: StaffUser | null;
  onSimulateRealtimeEvent: () => void;
  onTriggerTestAlert: () => void;
  onOpenNotifications: () => void;
  onOpenHelpModal?: () => void;
  onSwitchToSalonPortal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stylists,
  activeTab,
  setActiveTab,
  myAppointmentsCount,
  remindersCount,
  currentStaffUser,
  onSimulateRealtimeEvent,
  onTriggerTestAlert,
  onOpenNotifications,
  onOpenHelpModal,
  onSwitchToSalonPortal,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const availableStylistsCount = stylists.filter((s) => s.liveStatus === 'available').length;

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40 shadow-md">
      {/* Top Indian Salon Live Status & Amenities Micro-bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 border-b border-stone-800/80 flex flex-wrap items-center justify-between text-xs text-stone-400 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Floor Sync • Indiranagar, Bengaluru</span>
          </div>

          <span className="text-stone-700 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5 hidden sm:flex text-stone-300">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong className="text-stone-100 font-semibold">{availableStylistsCount}</strong> of {stylists.length} Master Stylists available right now
            </span>
          </div>

          <span className="text-stone-700 hidden md:inline">•</span>

          <div className="flex items-center gap-1.5 hidden md:flex text-amber-400/90">
            <Coffee className="w-3.5 h-3.5" />
            <span className="text-stone-300">Complimentary Masala Chai &amp; Filter Coffee Bar</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Direct 15-Minute Reminder Test Trigger Button */}
          <button
            id="trigger-15min-test-topbar-btn"
            type="button"
            onClick={onTriggerTestAlert}
            title="Test 15-minute appointment reminder alert in the UI"
            className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 bg-amber-950/80 hover:bg-amber-900/90 px-2.5 py-0.5 rounded transition border border-amber-700/70 font-medium cursor-pointer"
          >
            <Bell className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Test 15-Min Alert</span>
          </button>

          {/* Quick Helpline link */}
          <a
            href="tel:+919820012345"
            className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-amber-400 bg-stone-950/80 hover:bg-stone-800 px-2 py-0.5 rounded border border-stone-800 transition hidden sm:flex"
            title="Direct Reception Desk Helpline"
          >
            <PhoneCall className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">+91 98200 12345</span>
          </a>

          <div className="flex items-center gap-1.5 font-mono text-stone-300 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-800">
            <Clock className="w-3 h-3 text-stone-400" />
            <span>{currentTime || '10:00:00 AM IST'}</span>
          </div>

          <button
            id="simulate-realtime-btn"
            type="button"
            onClick={onSimulateRealtimeEvent}
            title="Simulate live salon booking or stylist chair update"
            className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-amber-300 bg-stone-800 hover:bg-stone-700 px-2 py-0.5 rounded transition border border-stone-700 cursor-pointer hidden md:flex"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span className="hidden lg:inline">Simulate Live Update</span>
            <span className="lg:hidden">Simulate</span>
          </button>

          {/* Direct Switch to Salon Portal Button */}
          <button
            id="switch-to-salon-portal-top-btn"
            type="button"
            onClick={onSwitchToSalonPortal}
            className="group flex items-center gap-1.5 text-[11px] text-amber-200 hover:text-white bg-gradient-to-r from-amber-800/90 via-amber-900 to-stone-900 hover:from-amber-700 hover:to-stone-800 px-2.5 py-0.5 rounded transition border border-amber-500/70 font-semibold cursor-pointer shadow-xs"
            title="Switch to Salon Operations & Staff Desk Portal"
          >
            <span className="relative flex items-center justify-center w-4 h-4 rounded-full transition-all duration-300 group-hover:bg-amber-400/30 group-hover:shadow-[0_0_8px_rgba(245,158,11,0.6)]">
              <ShieldCheck className="w-3 h-3 text-amber-300 group-hover:text-amber-100 transition-transform duration-300 group-hover:scale-110" />
            </span>
            <span>{currentStaffUser ? `Salon Staff Portal (${currentStaffUser.name.split(' ')[0]})` : 'Salon Staff Portal'}</span>
          </button>
        </div>
      </div>

      {/* Main Branding & Customer Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Salon Logo & Location */}
        <div className="flex items-center justify-between">
          <div
            onClick={() => setActiveTab('book')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-stone-900 border border-amber-500/40 flex items-center justify-center text-amber-100 shadow-inner group-hover:scale-105 transition">
              <Scissors className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-stone-50 font-serif">
                  Roopam
                </h1>
                <span className="text-[10px] tracking-wider uppercase font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
                  LUXURY INDIAN SALON &amp; SPA
                </span>
              </div>
              <p className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span>100 Feet Road, Indiranagar • Open Today 10:00 AM - 9:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer Navigation Tabs Only */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <nav className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              id="nav-tab-book"
              type="button"
              onClick={() => setActiveTab('book')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'book'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Book Appointment</span>
            </button>

            <button
              id="nav-tab-matrix"
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Live Stylist Grid</span>
            </button>

            <button
              id="nav-tab-services"
              type="button"
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Rate Card (₹)</span>
            </button>

            <button
              id="nav-tab-my-appointments"
              type="button"
              onClick={() => setActiveTab('my-appointments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'my-appointments'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>My Bookings</span>
              {myAppointmentsCount > 0 && (
                <span className="bg-amber-400 text-stone-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {myAppointmentsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-about"
              type="button"
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'about'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>Amenities</span>
            </button>
          </nav>

          {/* Notification Bell Button */}
          <button
            id="notification-bell-btn"
            type="button"
            onClick={onOpenNotifications}
            title="Appointment reminders & alerts"
            className="relative flex items-center justify-center p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 hover:text-amber-300 transition cursor-pointer shrink-0"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {remindersCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-amber-500 text-stone-950 font-bold text-[9px]">
                  {remindersCount}
                </span>
              </span>
            )}
          </button>

          {/* Quick Help / Call Desk button for customer */}
          {onOpenHelpModal && (
            <button
              type="button"
              onClick={onOpenHelpModal}
              title="Customer Support &amp; Concierge Desk"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 hover:text-amber-300 text-xs transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Concierge</span>
            </button>
          )}

          {/* Salon Operations Portal button */}
          <button
            id="switch-to-salon-portal-nav-btn"
            type="button"
            onClick={onSwitchToSalonPortal}
            title="Salon Operations & Staff Desk Portal"
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-100 border border-amber-500/40 hover:border-amber-400/70 text-xs font-semibold transition-all duration-300 cursor-pointer shrink-0 shadow-2xs hover:shadow-amber-500/20"
          >
            <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 transition-all duration-300 group-hover:bg-amber-400/35 group-hover:text-amber-100 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.55)]">
              <ShieldCheck className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
              <span className="absolute inset-0 rounded-full bg-amber-400/25 filter blur-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            </span>
            <span className="hidden sm:inline">Salon Staff Portal</span>
            <span className="sm:hidden">Staff</span>
          </button>
        </div>
      </div>
    </header>
  );
};
