import React, { useState } from 'react';
import { StaffUser, Stylist } from '../types';
import {
  Scissors,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowLeft,
  KeyRound,
  AlertCircle
} from 'lucide-react';

interface SalonLoginProps {
  stylists: Stylist[];
  onLoginSuccess: (user: StaffUser) => void;
  onBackToCustomer: () => void;
}

export const SalonLogin: React.FC<SalonLoginProps> = ({
  stylists,
  onLoginSuccess,
  onBackToCustomer,
}) => {
  const [selectedRole, setSelectedRole] = useState<'manager' | 'receptionist' | 'stylist'>('manager');
  const [selectedStylistId, setSelectedStylistId] = useState<string>(stylists[0]?.id || 'sty-1');
  const [pinCode, setPinCode] = useState<string>('1234');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickLogin = (role: 'manager' | 'receptionist' | 'stylist', stylistId?: string) => {
    let user: StaffUser;
    if (role === 'manager') {
      user = {
        id: 'staff-mgr',
        name: 'Meera Sen',
        email: 'meera.sen@roopamsalon.com',
        role: 'manager',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      };
    } else if (role === 'receptionist') {
      user = {
        id: 'staff-rec',
        name: 'Kavita Rao',
        email: 'concierge@roopamsalon.com',
        role: 'receptionist',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      };
    } else {
      const st = stylists.find((s) => s.id === (stylistId || selectedStylistId)) || stylists[0];
      user = {
        id: `staff-${st.id}`,
        name: st.name,
        email: `${st.name.toLowerCase().replace(/\s+/g, '.')}@roopamsalon.com`,
        role: 'stylist',
        stylistId: st.id,
        avatar: st.avatar,
      };
    }
    onLoginSuccess(user);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim()) {
      setErrorMsg('Please enter your staff PIN code.');
      return;
    }
    handleQuickLogin(selectedRole, selectedRole === 'stylist' ? selectedStylistId : undefined);
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Back button */}
      <button
        id="back-to-customer-portal-btn"
        type="button"
        onClick={onBackToCustomer}
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 mb-5 font-medium transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Customer Booking Portal</span>
      </button>

      {/* Main card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="bg-stone-900 text-stone-100 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase tracking-widest font-semibold text-amber-300">
                Staff &amp; Salon Operations
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-50">
              Salon Portal Sign In
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-md">
              Access real-time appointment control, floor seating, live stylist availability toggles, and front desk operations.
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Quick Demo Logins Bar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Quick Select Demo Role
              </span>
              <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                One-Click Access
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                id="quick-login-manager-btn"
                type="button"
                onClick={() => handleQuickLogin('manager')}
                className="p-3 text-left rounded-2xl border border-stone-200 hover:border-amber-500/60 hover:bg-amber-50/40 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-stone-900">Salon Manager</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  Full control &amp; floor oversight
                </p>
              </button>

              <button
                id="quick-login-reception-btn"
                type="button"
                onClick={() => handleQuickLogin('receptionist')}
                className="p-3 text-left rounded-2xl border border-stone-200 hover:border-amber-500/60 hover:bg-amber-50/40 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-stone-900">Front Desk</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  Walk-ins &amp; client check-ins
                </p>
              </button>

              <button
                id="quick-login-stylist-btn"
                type="button"
                onClick={() => handleQuickLogin('stylist', stylists[0]?.id)}
                className="p-3 text-left rounded-2xl border border-stone-200 hover:border-amber-500/60 hover:bg-amber-50/40 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Scissors className="w-4 h-4 text-stone-700 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-stone-900">Stylist Station</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  {stylists[0]?.name || 'Vikram Verma'} station
                </p>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] text-stone-400 uppercase tracking-widest font-medium absolute">
              Or Customize Sign-in
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Select Your Salon Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['manager', 'receptionist', 'stylist'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      setErrorMsg(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border capitalize text-center transition cursor-pointer ${
                      selectedRole === role
                        ? 'border-amber-600 bg-amber-50/80 text-amber-950 font-bold shadow-xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {role === 'stylist' ? 'Stylist' : role === 'manager' ? 'Manager' : 'Front Desk'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stylist selector if stylist role is active */}
            {selectedRole === 'stylist' && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Select Stylist Account
                </label>
                <select
                  id="salon-login-stylist-select"
                  value={selectedStylistId}
                  onChange={(e) => setSelectedStylistId(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                >
                  {stylists.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* PIN Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Staff Passcode / PIN
                </label>
                <span className="text-[11px] text-stone-400 font-mono">
                  Default: 1234
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="salon-staff-pin-input"
                  type="password"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 bg-stone-50/50 tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="salon-login-submit-btn"
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Sign In to Salon Operations</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          {/* Micro disclaimer */}
          <div className="pt-2 text-center text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Real-time floor changes immediately broadcast to customer booking view</span>
          </div>
        </div>
      </div>
    </div>
  );
};
