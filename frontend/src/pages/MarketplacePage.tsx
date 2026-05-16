import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ListingCard from '../components/ListingCard';
import { fetchListings, toggleSaveListing, Listing } from '../api/listings';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../config/brand';

const CAR_BRANDS = ['Maruti', 'Hyundai', 'Honda', 'Toyota', 'Tata', 'Mahindra', 'Ford', 'Volkswagen', 'BMW', 'Mercedes', 'Audi'];
const BIKE_BRANDS = ['Hero', 'Honda', 'Bajaj', 'TVS', 'Yamaha', 'KTM', 'Royal Enfield', 'Kawasaki'];

export default function MarketplacePage() {
  const { token } = useAuth();
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);
  const [fuel, setFuel] = useState('');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Listing[]; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchListings(
        {
          type: vehicleType,
          ...(city && { city }),
          min_price: minPrice,
          max_price: maxPrice,
          ...(fuel && { fuel }),
          ...(brand && { brand }),
          sort,
          page,
          limit: 12,
        },
        token || undefined
      );
      setData(res);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [vehicleType, sort, page, token]);

  const handleSave = async (id: number) => {
    if (!token) {
      toast.error('Login to save listings');
      return;
    }
    try {
      await toggleSaveListing(token, id);
      load();
    } catch {
      toast.error('Could not save listing');
    }
  };

  const brands = vehicleType === 'car' ? CAR_BRANDS : BIKE_BRANDS;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-brand-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 h-[200px] md:h-auto justify-center">
          <div>
            <p className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-1">{APP_NAME} Marketplace</p>
            <h1 className="font-serif text-4xl text-white">Find Your Perfect Vehicle</h1>
            <div className="flex gap-2 mt-4">
              {(['car', 'bike'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setVehicleType(t); setPage(1); setBrand(''); }}
                  className={`px-4 py-2 rounded ${vehicleType === t ? 'bg-brand-gold text-brand-black' : 'border border-brand-gold/30 text-gray-400'}`}
                >
                  {t === 'car' ? '🚗 Cars' : '🏍️ Bikes'}
                </button>
              ))}
            </div>
          </div>
          <Link to="/sell" className="bg-brand-gold text-brand-black px-6 py-3 rounded font-bold uppercase tracking-widest text-sm">
            Post Your Ad Free
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4 glass-card p-6 space-y-4 h-fit">
            <h3 className="text-brand-gold uppercase text-xs tracking-widest">Filters</h3>
            <div>
              <label className="text-xs text-gray-500">Price (Lakhs)</label>
              <div className="flex gap-2 mt-1">
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(+e.target.value)} className="w-full bg-[#111] border border-brand-gold/20 rounded px-2 py-1 text-white text-sm" />
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full bg-[#111] border border-brand-gold/20 rounded px-2 py-1 text-white text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full mt-1 bg-[#111] border border-brand-gold/20 rounded px-2 py-1 text-white text-sm" placeholder="Mumbai" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Brand</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {brands.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm text-gray-400">
                    <input type="radio" name="brand" checked={brand === b} onChange={() => setBrand(b)} />
                    {b}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Fuel</label>
              {['Petrol', 'Diesel', 'CNG', 'Electric'].map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm text-gray-400">
                  <input type="checkbox" checked={fuel === f} onChange={() => setFuel(fuel === f ? '' : f)} />
                  {f}
                </label>
              ))}
            </div>
            <button onClick={() => { setPage(1); load(); }} className="w-full bg-brand-gold text-brand-black py-2 rounded font-bold text-sm uppercase">
              Apply Filters
            </button>
            <button onClick={() => { setCity(''); setBrand(''); setFuel(''); setMinPrice(0); setMaxPrice(50); setPage(1); load(); }} className="w-full text-gray-500 text-xs hover:text-brand-gold">
              Clear All
            </button>
          </aside>

          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-400 text-sm">
                {data ? `Showing ${data.items.length} of ${data.total} results` : 'Loading...'}
              </span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-[#111] border border-brand-gold/30 rounded px-3 py-1 text-white text-sm">
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="glass-card h-80 animate-pulse bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data?.items.map((l) => (
                  <ListingCard key={l.id} listing={l} onSave={() => handleSave(l.id)} />
                ))}
              </div>
            )}

            {data && data.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded ${page === p ? 'bg-brand-gold text-brand-black' : 'border border-brand-gold/30 text-gray-400'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
