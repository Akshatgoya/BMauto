import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Calendar } from 'lucide-react';
import {
  bookRental,
  fetchRental,
  fetchRentalAvailability,
  Rental,
  BookedRange,
} from '../api/rentals';
import { useAuth } from '../context/AuthContext';

export default function RentalDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [rental, setRental] = useState<Rental | null>(null);
  const [booked, setBooked] = useState<BookedRange[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [booking, setBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [r, av] = await Promise.all([
          fetchRental(+id, token || undefined),
          fetchRentalAvailability(+id),
        ]);
        setRental(r);
        setBooked(av.booked_ranges);
      } catch {
        toast.error('Rental not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  useEffect(() => {
    if (!loading && location.hash === '#rent') {
      document.getElementById('rent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.hash]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const d = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return d > 0 ? d : 0;
  }, [startDate, endDate]);

  const totalPrice = useMemo(() => {
    if (!rental || !totalDays) return 0;
    if (totalDays >= 30 && rental.price_per_month) {
      const m = Math.floor(totalDays / 30);
      return m * rental.price_per_month + (totalDays % 30) * rental.price_per_day;
    }
    if (totalDays >= 7 && rental.price_per_week) {
      const w = Math.floor(totalDays / 7);
      return w * rental.price_per_week + (totalDays % 7) * rental.price_per_day;
    }
    return totalDays * rental.price_per_day;
  }, [rental, totalDays]);

  const handleBook = async () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/rentals/${id}#rent` } });
      return;
    }
    if (!token || !id || !startDate || !endDate) {
      toast.error('Select start and end dates');
      return;
    }
    setBooking(true);
    try {
      await bookRental(token, +id, {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      });
      toast.success('Booking request submitted!');
      navigate('/dashboard', { state: { tab: 'my-bookings' } });
    } catch (e: unknown) {
      const msg = axiosMsg(e);
      toast.error(msg || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black pt-24 flex justify-center">
        <div className="w-12 h-12 border-t-2 border-brand-rental rounded-full animate-spin" />
      </div>
    );
  }
  if (!rental) {
    return (
      <div className="min-h-screen bg-brand-black pt-24 text-center text-gray-400">
        Not found. <Link to="/rentals" className="text-brand-rental">Back</Link>
      </div>
    );
  }

  const photos = rental.images?.length ? rental.images : [];

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-16">
      <div className="container mx-auto px-6">
        <Link to="/rentals" className="text-brand-rental text-sm mb-6 inline-block">← Back to rentals</Link>
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <div className="aspect-video bg-[#1A1A2E] rounded-xl overflow-hidden">
              {photos[photoIdx] ? (
                <img src={photos[photoIdx]} alt={rental.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">No image</div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {photos.map((p, i) => (
                  <button key={i} type="button" onClick={() => setPhotoIdx(i)} className={`w-20 h-14 rounded border ${photoIdx === i ? 'border-brand-rental' : 'border-white/10'}`}>
                    <img src={p} alt="" className="w-full h-full object-cover rounded" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-8 border border-brand-rental/20">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <h1 className="font-serif text-3xl text-white">{rental.title}</h1>
              {rental.is_available && (
                <a href="#rent" className="shrink-0 text-center bg-brand-rental text-brand-black px-5 py-2.5 rounded font-bold uppercase tracking-widest text-sm hover:bg-brand-rentalLight">
                  Rent Now
                </a>
              )}
            </div>
            <p className="text-gray-400 mt-2">{rental.brand} {rental.model_name} · {rental.year}</p>
            <p className="text-3xl font-bold text-brand-rental mt-4">
              ₹{rental.price_per_day.toLocaleString('en-IN')} <span className="text-base font-normal text-gray-400">/ day</span>
            </p>
            {rental.price_per_week && <p className="text-sm text-gray-500">₹{rental.price_per_week}/week · ₹{rental.price_per_month || '—'}/month</p>}
            <p className="flex items-center gap-2 text-gray-400 mt-4 text-sm"><MapPin className="w-4 h-4 text-brand-rental" /> {rental.location}</p>

            <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
              <Spec label="Fuel" value={rental.fuel_type} />
              <Spec label="Transmission" value={rental.transmission} />
              <Spec label="KMs" value={rental.kms_driven.toLocaleString()} />
              <Spec label="Type" value={rental.vehicle_type} />
            </div>
            <p className="text-gray-400 mt-6 text-sm leading-relaxed">{rental.description}</p>

            <div id="rent" className="mt-8 border-t border-brand-rental/20 pt-6 scroll-mt-28">
              <h3 className="text-brand-rental uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Rent this vehicle</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs text-gray-500">Start<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 bg-[#111] border border-brand-rental/30 rounded px-3 py-2 text-white" /></label>
                <label className="text-xs text-gray-500">End<input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="w-full mt-1 bg-[#111] border border-brand-rental/30 rounded px-3 py-2 text-white" /></label>
              </div>
              {totalDays > 0 && (
                <p className="mt-4 text-white">
                  {totalDays} day{totalDays > 1 ? 's' : ''} · <span className="text-brand-rental font-bold">₹{totalPrice.toLocaleString('en-IN')}</span> total
                </p>
              )}
              <button type="button" disabled={booking || !rental.is_available} onClick={handleBook} className="w-full mt-4 bg-brand-rental text-brand-black py-3 rounded font-bold uppercase tracking-widest disabled:opacity-50">
                {booking ? 'Processing…' : 'Rent Now'}
              </button>
              {!isAuthenticated && (
                <p className="text-xs text-gray-500 mt-2 text-center">Login required to complete your rental</p>
              )}
            </div>

            {rental.owner && (
              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <p className="text-xs text-brand-rental uppercase tracking-widest">Owner</p>
                <p className="text-white font-semibold mt-1">{rental.owner.full_name}</p>
                <p className="text-gray-500 text-sm">{rental.owner.city}</p>
              </div>
            )}

            {booked.length > 0 && (
              <div className="mt-4 text-xs text-gray-500">
                <p className="text-gray-400 mb-1">Unavailable ranges:</p>
                {booked.map((b, i) => (
                  <p key={i}>{new Date(b.start_date).toLocaleDateString()} – {new Date(b.end_date).toLocaleDateString()} ({b.status})</p>
                ))}
              </div>
            )}

            <div className="mt-8 h-32 bg-[#1A1A2E] rounded-lg flex items-center justify-center text-gray-600 text-sm border border-dashed border-white/10">
              Map placeholder
            </div>
            <p className="mt-6 text-gray-600 text-sm italic">Reviews coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 p-3 rounded">
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className="text-white">{value}</p>
    </div>
  );
}

function axiosMsg(e: unknown): string | undefined {
  if (e && typeof e === 'object' && 'response' in e) {
    const r = (e as { response?: { data?: { detail?: string } } }).response;
    return typeof r?.data?.detail === 'string' ? r.data.detail : undefined;
  }
  return undefined;
}
