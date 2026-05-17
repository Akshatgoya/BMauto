import { Link } from 'react-router-dom';
import { MapPin, Car } from 'lucide-react';
import type { Rental } from '../api/rentals';

export default function RentalCard({ rental }: { rental: Rental }) {
  const img = rental.images?.[0];

  return (
    <div className="glass-card overflow-hidden group hover:border-brand-rental/50 transition-all flex flex-col">
      <Link to={`/rentals/${rental.id}`} className="relative aspect-[4/3] bg-[#1A1A2E] block">
        {img ? (
          <img src={img} alt={rental.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-rental/40">
            <Car className="w-16 h-16" />
          </div>
        )}
        <span
          className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
            rental.is_available
              ? 'bg-brand-rental/90 text-brand-black'
              : 'bg-gray-600/90 text-gray-300'
          }`}
        >
          {rental.is_available ? 'Available' : 'Unavailable'}
        </span>
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link to={`/rentals/${rental.id}`}>
          <h3 className="font-serif text-lg text-white group-hover:text-brand-rental transition-colors line-clamp-1">
            {rental.title}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mt-1">
          {rental.brand} {rental.model_name} · {rental.year}
        </p>
        <p className="text-2xl font-bold text-brand-rental mt-2">
          ₹{rental.price_per_day.toLocaleString('en-IN')}
          <span className="text-sm font-normal text-gray-400"> / day</span>
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
          <MapPin className="w-3 h-3" /> {rental.location}
        </p>
        <div className="flex gap-2 mt-4">
          <Link
            to={`/rentals/${rental.id}#rent`}
            className="flex-1 text-center text-sm uppercase tracking-widest bg-brand-rental text-brand-black py-2.5 rounded font-bold hover:bg-brand-rentalLight transition-colors"
          >
            Rent Now
          </Link>
          <Link
            to={`/rentals/${rental.id}`}
            className="flex-1 text-center text-sm uppercase tracking-widest text-brand-rental border border-brand-rental/40 py-2.5 rounded hover:bg-brand-rental/10 transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
