import { useState, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createPart, PART_CATEGORIES } from '../api/parts';
import { useAuth } from '../context/AuthContext';

export default function SellPartPage() {
  const { token } = useAuth();
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: number; title: string } | null>(null);
  const [form, setForm] = useState({
    vehicle_type: 'both' as 'car' | 'bike' | 'both',
    category: 'Engine',
    title: '',
    brand: '',
    part_number: '',
    condition: 'Used' as 'New' | 'Used' | 'Refurbished',
    compatibility: [] as string[],
    price: 500,
    negotiable: false,
    quantity_available: 1,
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

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.compatibility.includes(t)) {
      setForm({ ...form, compatibility: [...form.compatibility, t] });
    }
    setTagInput('');
  };

  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const submit = async () => {
    if (!token) return;
    if (form.description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }
    setSubmitting(true);
    try {
      const part = await createPart(token, { ...form, images });
      setDone({ id: part.id, title: part.title });
      toast.success('Part listed!');
    } catch {
      toast.error('Failed to list part');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-brand-black pt-24 flex items-center justify-center px-6">
        <div className="glass-card p-12 text-center max-w-lg">
          <h2 className="font-serif text-3xl text-brand-gold">Part listed!</h2>
          <Link to={`/parts/${done.id}`} className="inline-block mt-6 bg-brand-gold text-brand-black px-6 py-2 rounded font-bold">View Part</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="font-serif text-4xl text-white mb-8">Sell Spare Parts</h1>
        <div className="glass-card p-8 space-y-4">
          <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value as typeof form.vehicle_type })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white">
            <option value="both">Cars & Bikes</option>
            <option value="car">Cars only</option>
            <option value="bike">Bikes only</option>
          </select>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white">
            {PART_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" />
          <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" />
          <input placeholder="Part number (optional)" value={form.part_number} onChange={(e) => setForm({ ...form, part_number: e.target.value })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" />
          <div className="flex gap-2">
            {(['New', 'Used', 'Refurbished'] as const).map((c) => (
              <button key={c} type="button" onClick={() => setForm({ ...form, condition: c })} className={`flex-1 py-2 rounded border text-sm ${form.condition === c ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-gray-700'}`}>{c}</button>
            ))}
          </div>
          <div>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={onTagKey} placeholder="Compatibility — type vehicle and press Enter" className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" />
            <div className="flex flex-wrap gap-2 mt-2">
              {form.compatibility.map((t) => (
                <span key={t} className="text-xs px-2 py-1 bg-brand-gold/10 text-brand-gold rounded flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => setForm({ ...form, compatibility: form.compatibility.filter((x) => x !== t) })}>×</button>
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" placeholder="Price ₹" />
            <input type="number" value={form.quantity_available} onChange={(e) => setForm({ ...form, quantity_available: +e.target.value })} className="bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" placeholder="Qty" />
          </div>
          <label className="flex items-center gap-2 text-gray-400 text-sm"><input type="checkbox" checked={form.negotiable} onChange={(e) => setForm({ ...form, negotiable: e.target.checked })} /> Price is negotiable</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" placeholder="Location" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" placeholder="Description" />
          <input type="file" accept="image/*" multiple onChange={async (e) => {
            if (!e.target.files) return;
            const next = [...images];
            for (const f of Array.from(e.target.files).slice(0, 8 - next.length)) next.push(await fileToBase64(f));
            setImages(next.slice(0, 8));
          }} className="text-sm text-gray-400" />
          <button type="button" disabled={submitting} onClick={submit} className="w-full bg-brand-gold text-brand-black py-4 rounded font-bold uppercase tracking-widest disabled:opacity-60">
            {submitting ? 'Listing…' : 'Publish Part'}
          </button>
        </div>
      </div>
    </div>
  );
}
