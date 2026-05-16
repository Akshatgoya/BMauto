import { Link } from 'react-router-dom';
import { Car, Bike, Heart } from 'lucide-react';
import { Listing } from '../api/listings';
import { useAuth } from '../context/AuthContext';

interface Props {
  listing: Listing;
  onSave?: () => void;
  showSave?: boolean;
}

export default function ListingCard({ listing, onSave, showSave = true }: Props) {
  const { user } = useAuth();
  const photo = listing.photos?.[0];
  const diff = listing.asking_price - listing.ai_predicted_price;
  const isSold = listing.status === 'sold';
  const isOwnListing = user?.id === listing.seller_id;
  const canBuy = !isSold && !isOwnListing;

  return (
    <div className="glass-card overflow-hidden group hover:border-brand-gold/50 transition-all flex flex-col">
      <div className="relative h-[200px] bg-[#111]">
        {photo ? (
          <img src={photo} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-gold/40">
            {listing.vehicle_type === 'bike' ? <Bike size={48} /> : <Car size={48} />}
          </div>
        )}
        {listing.status === 'sold' && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider z-10">
            SOLD
          </span>
        )}
        <span
          className={`absolute ${listing.status === 'sold' ? 'top-10' : 'top-2'} left-2 bg-brand-teal/90 text-brand-black text-xs font-bold px-2 py-1 rounded`}
        >
          AI: ₹{listing.ai_predicted_price.toFixed(2)}L
        </span>
        {showSave && onSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSave();
            }}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-brand-gold/20 z-10"
          >
            <Heart
              size={18}
              className={listing.is_saved ? 'fill-brand-gold text-brand-gold' : 'text-white'}
            />
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-white truncate">{listing.title}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {listing.year} • {listing.fuel_type} • {listing.transmission}
        </p>
        <p className="text-xs text-gray-500">
          {listing.kms_driven.toLocaleString()} km | {listing.city}
        </p>
        <p className="text-2xl font-bold text-brand-gold mt-2">
          ₹{listing.asking_price.toFixed(2)} <span className="text-sm">Lakhs</span>
        </p>
        <p className="text-xs text-brand-teal">
          AI Predicted: ₹{listing.ai_predicted_price.toFixed(2)}L
          {diff > 0 ? ` (+${diff.toFixed(2)} over)` : ` (${Math.abs(diff).toFixed(2)} under)`}
        </p>
        <span className="inline-block mt-2 text-[10px] uppercase tracking-widest px-2 py-0.5 border border-brand-gold/30 text-brand-gold rounded w-fit">
          {listing.seller_type}
        </span>

        <div className="mt-auto pt-4 flex flex-col gap-2">
          {canBuy && (
            <Link
              to={`/listing/${listing.id}#purchase`}
              className="block w-full text-center bg-brand-gold text-brand-black py-2.5 rounded font-bold text-xs uppercase tracking-wider hover:bg-brand-gold/90 transition-colors"
            >
              💳 Buy Now
            </Link>
          )}
          {isOwnListing && !isSold && (
            <span className="block w-full text-center text-gray-500 text-xs py-2 border border-white/10 rounded">
              Your listing
            </span>
          )}
          <Link
            to={`/listing/${listing.id}`}
            className="block w-full text-center text-sm uppercase tracking-widest text-brand-gold hover:text-white transition-colors border border-brand-gold/30 py-2 rounded"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
