import React from 'react';
import { Stylist } from '../types';
import { formatTime12h } from '../utils/timeUtils';
import {
  Award,
  Clock,
  Coffee,
  Globe,
  Sparkles,
  Star,
  UserCheck,
  X,
  ShieldCheck,
} from 'lucide-react';

interface StylistProfileModalProps {
  stylist: Stylist;
  onClose: () => void;
  onBookWithStylist: (stylistId: string) => void;
}

export const StylistProfileModal: React.FC<StylistProfileModalProps> = ({
  stylist,
  onClose,
  onBookWithStylist,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={stylist.avatar}
                alt={stylist.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/40 shadow-xs"
              />
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  stylist.liveStatus === 'available'
                    ? 'bg-emerald-500'
                    : stylist.liveStatus === 'in_service'
                    ? 'bg-amber-500'
                    : 'bg-stone-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-serif text-stone-900">
                  {stylist.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{stylist.rating}</span>
                  <span className="text-stone-400 font-normal">({stylist.reviewCount})</span>
                </div>
              </div>
              <p className="text-xs text-stone-500">{stylist.role}</p>

              {/* Status */}
              <div className="mt-1">
                {stylist.liveStatus === 'available' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Available on Floor for Immediate Booking
                  </span>
                ) : stylist.liveStatus === 'in_service' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" />
                    In Chair Service (Next Free ~{formatTime12h(stylist.nextFreeTime || '10:30')})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    <Coffee className="w-3 h-3 text-stone-500" />
                    On Chai Break
                  </span>
                )}
              </div>
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

        <div className="my-5 space-y-3.5 text-xs">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-stone-500 mb-0.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Experience</span>
              </div>
              <span className="font-bold text-stone-900 text-sm">
                {stylist.experienceYears}+ Years Master Artistry
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-stone-500 mb-0.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Languages Spoken</span>
              </div>
              <span className="font-bold text-stone-900 text-xs truncate block">
                {(stylist.languages || ['Hindi', 'English']).join(', ')}
              </span>
            </div>
          </div>

          {/* Working Shift */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-700 font-medium">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Shift Timing</span>
            </div>
            <span className="font-mono text-stone-800 font-semibold">
              {formatTime12h(stylist.workingHours?.start || '10:00')} - {formatTime12h(stylist.workingHours?.end || '21:00')} IST
            </span>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-2">Signature Master Disciplines</h4>
            <div className="flex flex-wrap gap-1.5">
              {(stylist.specialties || []).map((spec) => (
                <span
                  key={spec}
                  className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-lg text-[11px] font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Bio & Approach */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-1.5">Styling &amp; Wellness Philosophy</h4>
            <p className="text-stone-600 leading-relaxed">
              Trained in premium European precision cut techniques and authentic Indian Ayurvedic scalp care. Specializes in customized consultations taking into account hair geometry, Indian weather conditions, wedding events, and personal lifestyle.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onBookWithStylist(stylist.id);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Book with {stylist.name.split(' ')[0]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
