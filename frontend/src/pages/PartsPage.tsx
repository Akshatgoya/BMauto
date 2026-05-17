import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PartCard from '../components/PartCard';
import { fetchParts, fetchPartCategories, Part, PART_CATEGORIES } from '../api/parts';
import { APP_NAME } from '../config/brand';

export default function PartsPage() {
  const [vehicleType, setVehicleType] = useState<'all' | 'car' | 'bike'>('all');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [search, setSearch] = useState('');
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Part[]; pages: number } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartCategories().then((cats) => {
      const m: Record<string, number> = {};
      cats.forEach((c) => { m[c.category] = c.count; });
      setCounts(m);
    }).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchParts({
        ...(vehicleType !== 'all' && { type: vehicleType }),
        ...(category && { category }),
        ...(condition && { condition }),
        ...(search && { search }),
        negotiable_only: negotiableOnly,
        min_price: minPrice,
        max_price: maxPrice,
        sort,
        page,
        limit: 16,
      });
      setData(res);
    } catch {
      toast.error('Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [vehicleType, category, sort, page]);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-brand-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div>
            <p className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-1">{APP_NAME} Spare Parts</p>
            <h1 className="font-serif text-4xl text-white">Parts Marketplace</h1>
          </div>
          <Link to="/sell-part" className="bg-brand-gold text-brand-black px-6 py-3 rounded font-bold uppercase tracking-widest text-sm h-fit">
            Sell Parts
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" onClick={() => { setCategory(''); setPage(1); }} className={`px-3 py-1 rounded-full text-xs border ${!category ? 'bg-brand-gold text-brand-black border-brand-gold' : 'border-gray-700 text-gray-400'}`}>All</button>
          {PART_CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => { setCategory(c); setPage(1); }} className={`px-3 py-1 rounded-full text-xs border ${category === c ? 'bg-brand-gold text-brand-black border-brand-gold' : 'border-gray-700 text-gray-400'}`}>
              {c} {counts[c] ? `(${counts[c]})` : ''}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'car', 'bike'] as const).map((t) => (
            <button key={t} type="button" onClick={() => { setVehicleType(t); setPage(1); }} className={`px-4 py-2 rounded text-sm ${vehicleType === t ? 'bg-brand-gold text-brand-black' : 'border border-brand-gold/30 text-gray-400'}`}>
              {t === 'all' ? 'All' : t === 'car' ? 'Cars' : 'Bikes'}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-56 glass-card p-4 h-fit space-y-3 text-sm">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search parts…" className="w-full bg-[#111] border border-brand-gold/20 rounded px-2 py-2 text-white" />
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full bg-[#111] border border-brand-gold/20 rounded px-2 py-2 text-white">
              <option value="">Any condition</option>
              <option>New</option>
              <option>Used</option>
              <option>Refurbished</option>
            </select>
            <label className="flex items-center gap-2 text-gray-400">
              <input type="checkbox" checked={negotiableOnly} onChange={(e) => setNegotiableOnly(e.target.checked)} /> Negotiable only
            </label>
            <div className="flex gap-2">
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(+e.target.value)} className="w-full bg-[#111] border border-brand-gold/20 rounded px-2 py-1 text-white" />
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full bg-[#111] border border-brand-gold/20 rounded px-2 py-1 text-white" />
            </div>
            <button type="button" onClick={() => { setPage(1); load(); }} className="w-full bg-brand-gold text-brand-black py-2 rounded font-bold text-xs uppercase">Apply</button>
          </aside>

          <div className="flex-1">
            <div className="flex justify-end mb-4">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-[#111] border border-brand-gold/30 rounded px-3 py-1 text-white text-sm">
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <div key={i} className="glass-card h-48 animate-pulse bg-white/5" />)}</div>
            ) : !data?.items.length ? (
              <div className="glass-card p-12 text-center">
                <p className="text-gray-400 mb-4">No parts found.</p>
                <Link to="/sell-part" className="inline-block bg-brand-gold text-brand-black px-6 py-2 rounded font-bold">Sell a Part</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data.items.map((p) => <PartCard key={p.id} part={p} />)}
                </div>
                {data.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                      <button key={p} type="button" onClick={() => setPage(p)} className={`w-10 h-10 rounded ${page === p ? 'bg-brand-gold text-brand-black' : 'border border-brand-gold/30 text-gray-400'}`}>{p}</button>
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
