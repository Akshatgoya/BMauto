import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createRental } from '../api/rentals';
import { useAuth } from '../context/AuthContext';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];

export default function AddRentalPage() {
  const { token } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: number; title: string } | null>(null);
  const [form, setForm] = useState({
    vehicle_type: 'car' as 'car' | 'bike',
    title: '',
    brand: '',
    model_name: '',
    year: 2022,
    fuel_type: 'Petrol',
    transmission: 'Manual',
    kms_driven: 10000,
    price_per_day: 800,
    price_per_week: 5000,
    price_per_month: 18000,
    location: 'Mumbai',
    description: '',
  });

  const fileToBase64 = (file: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const next = [...images];
    for (const f of Array.from(files).slice(0, 6 - next.length)) {
      next.push(await fileToBase64(f));
    }
    setImages(next.slice(0, 6));
  };

  const submit = async () => {
    if (!token) return;
    if (form.description.length < 30) {
      toast.error('Description must be at least 30 characters');
      return;
    }
    setSubmitting(true);
    try {
      const title = form.title || `${form.year} ${form.brand} ${form.model_name}`;
      const rental = await createRental(token, {
        ...form,
        title,
        images,
        price_per_week: form.price_per_week || null,
        price_per_month: form.price_per_month || null,
      });
      setDone({ id: rental.id, title: rental.title });
      toast.success('Rental listing created!');
    } catch {
      toast.error('Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-brand-black pt-24 flex items-center justify-center px-6">
        <div className="glass-card p-12 text-center max-w-lg border border-brand-rental/30">
          <h2 className="font-serif text-3xl text-brand-rental">Listed for rent!</h2>
          <p className="text-gray-400 mt-4">{done.title}</p>
          <div className="flex gap-4 mt-8 justify-center">
            <Link to={`/rentals/${done.id}`} className="bg-brand-rental text-brand-black px-6 py-2 rounded font-bold">View Listing</Link>
            <Link to="/dashboard" state={{ tab: 'my-rentals' }} className="border border-brand-rental text-brand-rental px-6 py-2 rounded">Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="font-serif text-4xl text-white mb-2">Rent Out Your Vehicle</h1>
        <p className="text-gray-500 mb-8">Set daily rates and availability for renters.</p>
        <div className="glass-card p-8 space-y-4 border border-brand-rental/20">
          <div className="flex gap-4">
            {(['car', 'bike'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, vehicle_type: t })} className={`flex-1 py-3 rounded border ${form.vehicle_type === t ? 'border-brand-rental bg-brand-rental/10 text-brand-rental' : 'border-gray-700'}`}>{t}</button>
            ))}
          </div>
          <input placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white" />
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white" />
            <input placeholder="Model" value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })} className="bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} className="bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white" />
            <input type="number" placeholder="KMs driven" value={form.kms_driven} onChange={(e) => setForm({ ...form, kms_driven: +e.target.value })} className="bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input type="number" placeholder="₹ / day" value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: +e.target.value })} className="bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white" />
            <input type="number" placeholder="₹ / week" value={form.price_per_week} onChange={(e) => setForm({ ...form, price_per_week: +e.target.value })} className="bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white" />
            <input type="number" placeholder="₹ / month" value={form.price_per_month} onChange={(e) => setForm({ ...form, price_per_month: +e.target.value })} className="bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white" />
          </div>
          <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <textarea placeholder="Description (min 30 chars)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-[#111] border border-brand-rental/30 rounded px-4 py-3 text-white" />
          <input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} className="text-sm text-gray-400" />
          <div className="flex gap-2 flex-wrap">{images.map((img, i) => <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded" />)}</div>
          <button type="button" disabled={submitting} onClick={submit} className="w-full bg-brand-rental text-brand-black py-4 rounded font-bold uppercase tracking-widest disabled:opacity-60">
            {submitting ? 'Publishing…' : 'Publish Rental'}
          </button>
        </div>
      </div>
    </div>
  );
}
