import { Link } from 'react-router-dom';
import { MapPin, Wrench, ShoppingCart } from 'lucide-react';
import type { Part } from '../api/parts';
import { conditionBadgeClass } from '../api/parts';

export default function PartCard({ part }: { part: Part }) {
  const img = part.images?.[0];
  const inStock = part.quantity_available > 0;

  return (
    <div className="glass-card overflow-hidden group hover:border-brand-gold/40 transition-all flex flex-col h-full">
      <Link to={`/parts/${part.id}`} className="relative aspect-square bg-[#1E1E1E] block">
        {img ? (
          <img src={img} alt={part.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-gold/30">
            <Wrench className="w-10 h-10" />
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${conditionBadgeClass(part.condition)}`}>
          {part.condition}
        </span>
        {part.negotiable && (
          <span className="absolute top-2 right-2 text-[10px] bg-brand-gold/20 text-brand-gold border border-brand-gold/40 px-2 py-0.5 rounded">
            Negotiable
          </span>
        )}
      </Link>
      <div className="p-3 flex-1 flex flex-col">
        <Link to={`/parts/${part.id}`}>
          <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-brand-gold">{part.title}</h3>
        </Link>
        <p className="text-xs text-gray-500 mt-1">{part.brand}</p>
        <p className="text-lg font-bold text-brand-gold mt-2">₹{part.price.toLocaleString('en-IN')}</p>
        {part.compatibility.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {part.compatibility.slice(0, 2).map((c) => (
              <span key={c} className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400">
                {c}
              </span>
            ))}
          </div>
        )}
        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-auto pt-2">
          <MapPin className="w-3 h-3" /> {part.location}
        </p>
        <div className="flex gap-2 mt-2">
          <Link
            to={`/parts/${part.id}#buy`}
            className={`flex-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest py-2 rounded font-bold ${
              inStock
                ? 'bg-brand-gold text-brand-black hover:bg-brand-goldLight'
                : 'bg-gray-700 text-gray-400 pointer-events-none'
            }`}
          >
            <ShoppingCart className="w-3 h-3" /> Buy
          </Link>
          <Link
            to={`/parts/${part.id}`}
            className="flex-1 text-center text-[10px] uppercase tracking-widest text-brand-gold border border-brand-gold/30 py-2 rounded hover:bg-brand-gold/10"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
