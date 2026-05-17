import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import RentalCard from '../components/RentalCard';
import { fetchRentals, Rental } from '../api/rentals';
import { APP_NAME } from '../config/brand';

export default function RentalsPage() {
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [fuel, setFuel] = useState('');
  const [transmission, setTransmission] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Rental[]; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchRentals({
        type: vehicleType,
        ...(location && { location }),
        min_price: minPrice,
        max_price: maxPrice,
        ...(fuel && { fuel }),
        ...(transmission && { transmission }),
        sort,
        page,
        limit: 12,
      });
      setData(res);
    } catch {
      toast.error('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [vehicleType, sort, page]);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-brand-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <p className="text-brand-rental text-xs uppercase tracking-[0.3em] mb-1">{APP_NAME} Rentals</p>
            <h1 className="font-serif text-4xl text-white">Rent Your Ride</h1>
            <div className="flex gap-2 mt-4">
              {(['car', 'bike'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setVehicleType(t); setPage(1); }}
                  className={`px-4 py-2 rounded ${vehicleType === t ? 'bg-brand-rental text-brand-black' : 'border border-brand-rental/30 text-gray-400'}`}
                >
                  {t === 'car' ? 'Cars' : 'Bikes'}
                </button>
              ))}
            </div>
          </div>
          <Link to="/add-rental" className="bg-brand-rental text-brand-black px-6 py-3 rounded font-bold uppercase tracking-widest text-sm">
            List for Rent
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 glass-card p-4 h-fit space-y-4">
            <h3 className="text-brand-rental uppercase text-xs tracking-widest">Filters</h3>
            <div>
              <label className="text-xs text-gray-500">Price / day (₹)</label>
              <div className="flex gap-2 mt-1">
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(+e.target.value)} className="w-full bg-[#111] border border-brand-rental/20 rounded px-2 py-1 text-white text-sm" />
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full bg-[#111] border border-brand-rental/20 rounded px-2 py-1 text-white text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full mt-1 bg-[#111] border border-brand-rental/20 rounded px-2 py-1 text-white text-sm" placeholder="Mumbai" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Fuel</label>
              <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="w-full mt-1 bg-[#111] border border-brand-rental/20 rounded px-2 py-1 text-white text-sm">
                <option value="">Any</option>
                <option>Petrol</option>
                <option>Diesel</option>
                <option>Electric</option>
                <option>CNG</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Transmission</label>
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="w-full mt-1 bg-[#111] border border-brand-rental/20 rounded px-2 py-1 text-white text-sm">
                <option value="">Any</option>
                <option>Manual</option>
                <option>Automatic</option>
              </select>
            </div>
            <button type="button" onClick={() => { setPage(1); load(); }} className="w-full bg-brand-rental text-brand-black py-2 rounded font-bold text-sm uppercase">
              Apply
            </button>
          </aside>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-500 text-sm">{data?.items.length ?? 0} rentals</p>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-[#111] border border-brand-rental/30 rounded px-3 py-1 text-white text-sm">
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card h-80 animate-pulse bg-white/5" />
                ))}
              </div>
            ) : !data?.items.length ? (
              <div className="glass-card p-12 text-center">
                <p className="text-gray-400 mb-4">No rentals match your filters.</p>
                <Link to="/add-rental" className="inline-block bg-brand-rental text-brand-black px-6 py-2 rounded font-bold">
                  List Your Vehicle
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data.items.map((r) => (
                    <RentalCard key={r.id} rental={r} />
                  ))}
                </div>
                {data.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded ${page === p ? 'bg-brand-rental text-brand-black' : 'border border-brand-rental/30 text-gray-400'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
