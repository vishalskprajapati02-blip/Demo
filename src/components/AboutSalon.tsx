import React from 'react';
import {
  Coffee,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Award,
  CheckCircle2,
  Car,
  Wifi,
  AirVent,
  HeartHandshake,
} from 'lucide-react';

interface AboutSalonProps {
  onBookNowClick: () => void;
}

export const AboutSalon: React.FC<AboutSalonProps> = ({ onBookNowClick }) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Atmosphere */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-stone-100 p-8 sm:p-12 border border-stone-800 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
            Namaste • Welcome to Roopam
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-50 leading-tight">
            The Indian Art of Hair, Grooming &amp; Ayurvedic Pampering
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Roopam brings together world-class master artistry, authentic Indian Ayurvedic head champis, O3+ glow facials, and genuine hospitality. Relax in our air-conditioned lounge with hot artisanal Masala Chai while our certified artists craft your signature look.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBookNowClick}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-xs transition cursor-pointer"
            >
              Book Your Appointment
            </button>
            <a
              href="https://api.whatsapp.com/send?phone=919820012345&text=Namaste%20Roopam%20Salon!%20I%20would%20like%20to%20inquire%20about%20appointments."
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Salon Desk</span>
            </a>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <Sparkles className="w-96 h-96 text-amber-500" />
        </div>
      </div>

      {/* Indian Hospitality Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 border border-amber-200">
            <Coffee className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-900 text-base font-serif mb-1">
            Artisanal Chai &amp; Filter Coffee
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Every guest is welcomed with their choice of freshly brewed Kadak Masala Chai, authentic South Indian Filter Coffee, Green Tea, or Fresh Nimbu Paani.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-900 text-base font-serif mb-1">
            Strict 5-Point Hygiene Protocol
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            100% single-use disposable capes, sanitized towels, UV-sterilized barber scissors, and freshly sealed single-application skincare packets.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4 border border-purple-200">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-900 text-base font-serif mb-1">
            100% Genuine Brands
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            We partner exclusively with verified Indian and global beauty leaders: L&apos;Oréal Professionnel, O3+, Cheryl&apos;s Cosmeceuticals, Rica Italy, and Kama Ayurveda.
          </p>
        </div>
      </div>

      {/* Salon Amenities Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs">
        <h3 className="text-lg font-bold font-serif text-stone-900 mb-4">
          Salon Studio Amenities
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-stone-700">
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-150 flex items-center gap-2.5">
            <AirVent className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="font-medium">Full AC Lounge</span>
          </div>
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-150 flex items-center gap-2.5">
            <Car className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Free Valet Parking</span>
          </div>
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-150 flex items-center gap-2.5">
            <Wifi className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-medium">High-Speed Wi-Fi</span>
          </div>
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-150 flex items-center gap-2.5">
            <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">UPI / GPay / Cards</span>
          </div>
        </div>
      </div>

      {/* Location & Contact */}
      <div className="bg-stone-50 rounded-3xl p-6 sm:p-8 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-base font-serif">
            <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Visit Our Indiranagar Flagship Studio</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 max-w-lg">
            #412, 100 Feet Road, Near HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              10:00 AM – 9:00 PM (All 7 Days)
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              +91 98200 12345
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBookNowClick}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};
