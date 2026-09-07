import React, { useState } from 'react';
import { SalonService, ServiceCategory, ServiceGender } from '../types';
import { formatINR } from '../utils/timeUtils';
import {
  Search,
  Sparkles,
  Clock,
  Check,
  ShieldCheck,
  Tag,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface ServicesCatalogProps {
  services: SalonService[];
  onSelectServiceToBook: (serviceId: string) => void;
}

export const ServicesCatalog: React.FC<ServicesCatalogProps> = ({
  services,
  onSelectServiceToBook,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<ServiceGender>('all');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('All');

  const categories: ServiceCategory[] = [
    'All',
    'Hair & Styling',
    'Beard & Men Grooming',
    'Facials & De-Tan',
    'Hair Spa & Ayurvedic Care',
    'Waxing & Threading',
    'Bridal & Festive Combos',
  ];

  const filteredServices = services.filter((srv) => {
    // Gender filter
    if (selectedGender !== 'all') {
      if (srv.gender !== 'unisex' && srv.gender !== selectedGender) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== 'All' && srv.category !== selectedCategory) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = srv.name.toLowerCase().includes(q);
      const matchDesc = srv.description.toLowerCase().includes(q);
      const matchBrand = srv.brandUsed?.toLowerCase().includes(q) || false;
      if (!matchName && !matchDesc && !matchBrand) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-md">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Official 2026 Rate Card
            </span>
            <span className="text-xs text-stone-400">All prices inclusive of GST</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-50">
            Indian Salon Services &amp; Wellness Rituals
          </h2>
          <p className="text-sm text-stone-300 mt-2">
            From classic haircuts and hot-towel royal shaves to award-winning O3+ bridal facials, Cheryl&apos;s De-Tan packs, and traditional warm-oil Ayurvedic Champi. We use 100% genuine sealed branded products.
          </p>
        </div>

        {/* Search & Gender Tabs */}
        <div className="mt-6 pt-5 border-t border-stone-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Gender Filter */}
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
            {(
              [
                { id: 'all', label: 'All Services' },
                { id: 'women', label: 'Women' },
                { id: 'men', label: 'Men' },
                { id: 'unisex', label: 'Unisex' },
              ] as const
            ).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGender(g.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  selectedGender === g.id
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Haircut, O3+ Facial, Beard, Rica Wax, Champi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition cursor-pointer shrink-0 font-medium ${
              selectedCategory === cat
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-10 border border-stone-200 text-center space-y-3">
            <p className="text-stone-500 text-sm">
              No services match your filters. Try clearing your search or switching categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedGender('all');
              }}
              className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl p-5 border border-stone-200/90 hover:border-amber-400/80 shadow-2xs hover:shadow-xs transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                        {service.category}
                      </span>
                      {service.gender !== 'all' && (
                        <span className="text-[10px] capitalize font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {service.gender}
                        </span>
                      )}
                      {service.popular && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-rose-600" />
                          Popular
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-stone-900 font-serif group-hover:text-amber-700 transition">
                      {service.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-stone-900 block">
                      {formatINR(service.price)}
                    </span>
                    <span className="text-[11px] text-stone-500 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {service.durationMinutes} mins
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mt-2 line-clamp-3">
                  {service.description}
                </p>

                {service.brandUsed && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-150 inline-flex">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Brand: <strong className="text-stone-700">{service.brandUsed}</strong></span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">
                  Pay at Salon or via UPI
                </span>

                <button
                  type="button"
                  onClick={() => onSelectServiceToBook(service.id)}
                  className="px-4 py-2 bg-stone-900 hover:bg-amber-700 text-stone-100 hover:text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Book This</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Indian Salon Hygiene & Amenities Trust Bar */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Single-use disposable capes, sterilized scissors &amp; sealed skincare sachets</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-600 shrink-0" />
          <span>No hidden taxes • GST included in all prices</span>
        </div>
      </div>
    </div>
  );
};
