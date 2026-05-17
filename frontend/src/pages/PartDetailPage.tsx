import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingCart, Phone } from 'lucide-react';
import { fetchPart, fetchParts, placePartOrder, Part, conditionBadgeClass } from '../api/parts';
import PartCard from '../components/PartCard';
import { useAuth } from '../context/AuthContext';

export default function PartDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuth();
  const [part, setPart] = useState<Part | null>(null);
  const [similar, setSimilar] = useState<Part[]>([]);
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const p = await fetchPart(+id, token || undefined);
        setPart(p);
        if (user) {
          setAddress(`${user.city} — `);
        }
        const simParams: Record<string, string | number | boolean> = { category: p.category, exclude_id: p.id, limit: 4 };
        if (p.vehicle_type !== 'both') simParams.type = p.vehicle_type;
        const sim = await fetchParts(simParams);
        setSimilar(sim.items);
      } catch {
        toast.error('Part not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token, user]);

  useEffect(() => {
    if (!loading && location.hash === '#buy') {
      document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.hash]);

  const buy = async () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/parts/${id}#buy` } });
      return;
    }
    if (!token || !id || address.trim().length < 10) {
      toast.error('Enter a valid shipping address (min 10 characters)');
      return;
    }
    if (!part || qty > part.quantity_available) {
      toast.error('Not enough stock');
      return;
    }
    setOrdering(true);
    try {
      await placePartOrder(token, +id, { quantity: qty, shipping_address: address.trim() });
      toast.success('Order placed!');
      navigate('/dashboard', { state: { tab: 'parts-orders' } });
    } catch {
      toast.error('Order failed');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-brand-black pt-24 flex justify-center"><div className="w-12 h-12 border-t-2 border-brand-gold rounded-full animate-spin" /></div>;
  }
  if (!part) {
    return <div className="min-h-screen bg-brand-black pt-24 text-center text-gray-400">Not found. <Link to="/parts" className="text-brand-gold">Back</Link></div>;
  }

  const imgs = part.images?.length ? part.images : [];
  const inStock = part.quantity_available > 0;
  const isOwn = user?.id === part.seller_id;

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-16">
      <div className="container mx-auto px-6">
        <Link to="/parts" className="text-brand-gold text-sm mb-6 inline-block">← Back to parts</Link>
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="grid grid-cols-2 gap-2">
            {imgs.length ? imgs.map((img, i) => (
              <img key={i} src={img} alt="" className={`rounded-lg object-cover bg-[#1E1E1E] ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`} />
            )) : <div className="col-span-2 aspect-video bg-[#1E1E1E] flex items-center justify-center text-gray-600">No images</div>}
          </div>
          <div className="glass-card p-8 border border-brand-gold/20">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded border ${conditionBadgeClass(part.condition)}`}>{part.condition}</span>
                <h1 className="font-serif text-3xl text-white mt-3">{part.title}</h1>
                <p className="text-gray-500">{part.brand} · {part.category}</p>
              </div>
              {inStock && !isOwn && (
                <a href="#buy" className="shrink-0 flex items-center justify-center gap-2 bg-brand-gold text-brand-black px-5 py-2.5 rounded font-bold uppercase tracking-widest text-sm hover:bg-brand-goldLight">
                  <ShoppingCart className="w-4 h-4" /> Buy Now
                </a>
              )}
            </div>
            <p className="text-3xl font-bold text-brand-gold mt-4">
              ₹{part.price.toLocaleString('en-IN')}
              {part.negotiable && <span className="text-sm text-amber-400 ml-2 font-normal">Negotiable</span>}
            </p>
            <p className="text-sm text-gray-400 mt-2">{part.quantity_available} in stock · {part.location}</p>
            {part.compatibility.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {part.compatibility.map((c) => <span key={c} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded">{c}</span>)}
              </div>
            )}
            <p className="text-gray-400 mt-6 text-sm">{part.description}</p>

            <div id="buy" className="mt-8 border-t border-brand-gold/20 pt-6 scroll-mt-28">
              <h3 className="text-brand-gold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Purchase this part
              </h3>
              {isOwn ? (
                <p className="text-gray-500 text-sm">This is your listing. Buyers will place orders from here.</p>
              ) : !inStock ? (
                <p className="text-red-400 text-sm">Out of stock</p>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <label className="text-sm text-gray-500">Quantity</label>
                    <input type="number" min={1} max={part.quantity_available} value={qty} onChange={(e) => setQty(+e.target.value)} className="w-24 bg-[#111] border border-brand-gold/30 rounded px-3 py-2 text-white" />
                    <span className="text-brand-gold font-bold">Total: ₹{(part.price * qty).toLocaleString('en-IN')}</span>
                  </div>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full shipping address (street, city, pincode)"
                    rows={3}
                    className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white text-sm"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button type="button" disabled={ordering} onClick={buy} className="flex-1 flex items-center justify-center gap-2 bg-brand-gold text-brand-black py-3 rounded font-bold uppercase tracking-widest disabled:opacity-50">
                      <ShoppingCart className="w-4 h-4" />
                      {ordering ? 'Placing order…' : isAuthenticated ? 'Buy Now' : 'Login to Buy'}
                    </button>
                    {part.seller?.phone && isAuthenticated && (
                      <a href={`tel:${part.seller.phone}`} className="flex-1 flex items-center justify-center gap-2 border border-brand-gold text-brand-gold py-3 rounded font-bold text-sm uppercase tracking-widest hover:bg-brand-gold/10">
                        <Phone className="w-4 h-4" /> Contact Seller
                      </a>
                    )}
                  </div>
                  {!isAuthenticated && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      <Link to="/auth" state={{ from: `/parts/${id}#buy` }} className="text-brand-gold hover:underline">Sign in</Link> to complete your purchase
                    </p>
                  )}
                </>
              )}
            </div>

            {part.seller && (
              <div className="mt-6 p-4 bg-white/5 rounded-lg text-sm">
                <p className="text-brand-gold text-xs uppercase tracking-widest">Seller</p>
                <p className="text-white font-semibold">{part.seller.full_name}</p>
                <p className="text-gray-500">{part.seller.city} · Member since {new Date(part.seller.created_at).getFullYear()}</p>
                <p className="text-gray-500">{part.seller_listing_count ?? 0} active listings</p>
              </div>
            )}
          </div>
        </div>
        {similar.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl text-white mb-6">Similar Parts</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{similar.map((p) => <PartCard key={p.id} part={p} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
