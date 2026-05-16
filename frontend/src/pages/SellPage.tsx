import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { predictCarPrice, predictBikePrice, PredictionResponse } from '../api/predict';
import { createListing } from '../api/listings';
import { useAuth } from '../context/AuthContext';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Surat'];

export default function SellPage() {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [aiResult, setAiResult] = useState<PredictionResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [done, setDone] = useState<{ id: number; title: string } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const [form, setForm] = useState({
    vehicle_type: 'car' as 'car' | 'bike',
    brand: '', model: '', year: 2020, color: 'White',
    present_price: 5, asking_price: 4, kms_driven: 30000,
    fuel_type: 'Petrol', transmission: 'Manual', owner_count: 1,
    seller_type: 'Individual', city: 'Mumbai', description: '',
  });

  const fileToBase64 = (file: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const runAi = async () => {
    setAiLoading(true);
    try {
      const fuelMap: Record<string, number> = { Petrol: 0, Diesel: 1, CNG: 2, Electric: 3 };
      const payload = {
        year: form.year,
        present_price: form.present_price,
        kms_driven: form.kms_driven,
        fuel_type: fuelMap[form.fuel_type] ?? 0,
        seller_type: form.seller_type === 'Dealer' ? 0 : 1,
        transmission: form.transmission === 'Manual' ? 0 : 1,
        owner: form.owner_count,
      };
      const res = form.vehicle_type === 'bike' ? await predictBikePrice(payload) : await predictCarPrice(payload);
      setAiResult(res);
      setStep(3);
    } catch {
      toast.error('AI prediction failed. Is the API running?');
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async () => {
    if (!token) return;
    if (form.description.length < 50) {
      toast.error('Description must be at least 50 characters');
      return;
    }
    try {
      const title = `${form.year} ${form.brand} ${form.model} - ${form.owner_count === 0 ? 'First Owner' : `${form.owner_count} Owner`}`;
      const listing = await createListing(token, { ...form, title, photos });
      setDone({ id: listing.id, title: listing.title });
      toast.success('Your listing is live!');
    } catch {
      toast.error('Failed to post listing');
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-brand-black pt-24 flex items-center justify-center px-6">
        <div className="glass-card p-12 text-center max-w-lg">
          <h2 className="font-serif text-3xl text-brand-gold">Your listing is live! 🎉</h2>
          <p className="text-gray-400 mt-4">{done.title}</p>
          <div className="flex gap-4 mt-8 justify-center">
            <Link to={`/listing/${done.id}`} className="bg-brand-gold text-brand-black px-6 py-2 rounded font-bold">View My Listing</Link>
            <button onClick={() => { setDone(null); setStep(1); setPhotos([]); }} className="border border-brand-gold text-brand-gold px-6 py-2 rounded">Post Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="font-serif text-4xl text-white mb-2">Sell Your Vehicle</h1>
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded ${step >= s ? 'bg-brand-gold' : 'bg-gray-800'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="glass-card p-8 space-y-4">
            <div className="flex gap-4">
              {(['car', 'bike'] as const).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, vehicle_type: t })} className={`flex-1 py-8 text-2xl rounded border ${form.vehicle_type === t ? 'border-brand-gold bg-brand-gold/10' : 'border-gray-700'}`}>
                  {t === 'car' ? '🚗 CAR' : '🏍️ BIKE'}
                </button>
              ))}
            </div>
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" />
            <input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" />
            <select value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white">
              {Array.from({ length: 25 }, (_, i) => 2024 - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <input placeholder="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white" />
            <button onClick={() => setStep(2)} className="w-full bg-brand-gold text-brand-black py-3 rounded font-bold uppercase">Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="glass-card p-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-brand-gold">Showroom Price (L)</label><input type="number" step="0.1" value={form.present_price} onChange={(e) => setForm({ ...form, present_price: +e.target.value })} className="w-full mt-1 bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white" /></div>
              <div><label className="text-xs text-brand-gold">Asking Price (L)</label><input type="number" step="0.1" value={form.asking_price} onChange={(e) => setForm({ ...form, asking_price: +e.target.value })} className="w-full mt-1 bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white" /></div>
              <div><label className="text-xs text-brand-gold">KMs Driven</label><input type="number" value={form.kms_driven} onChange={(e) => setForm({ ...form, kms_driven: +e.target.value })} className="w-full mt-1 bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white" /></div>
              <div><label className="text-xs text-brand-gold">City</label><select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full mt-1 bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white">{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div className="flex gap-4 flex-wrap">
              {['Petrol', 'Diesel', 'CNG', 'Electric'].map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm"><input type="radio" checked={form.fuel_type === f} onChange={() => setForm({ ...form, fuel_type: f })} />{f}</label>
              ))}
            </div>
            <div className="flex gap-4">
              {['Manual', 'Automatic'].map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm"><input type="radio" checked={form.transmission === t} onChange={() => setForm({ ...form, transmission: t })} />{t}</label>
              ))}
            </div>
            <button onClick={() => { setStep(3); runAi(); }} disabled={aiLoading} className="w-full bg-brand-gold text-brand-black py-3 rounded font-bold">
              {aiLoading ? 'Checking AI estimate...' : 'Get AI Valuation →'}
            </button>
          </div>
        )}

        {step === 3 && aiResult && (
          <div className="glass-card p-8 border-2 border-brand-gold/40 text-center">
            <p className="text-brand-gold text-lg">🤖 AI estimates this vehicle at</p>
            <p className="text-4xl font-bold text-white mt-2">₹{aiResult.best_prediction.toFixed(2)} Lakhs</p>
            <p className="text-gray-400 mt-4">
              Your asking price is {((form.asking_price - aiResult.best_prediction) / aiResult.best_prediction * 100).toFixed(1)}%
              {form.asking_price > aiResult.best_prediction ? ' above' : ' below'} AI estimate
            </p>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-600 py-2 rounded">Adjust My Price</button>
              <button onClick={() => setStep(4)} className="flex-1 bg-brand-gold text-brand-black py-2 rounded font-bold">Keep My Price</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="glass-card p-8 space-y-4">
            <div
              className="border-2 border-dashed border-brand-gold/30 rounded-lg p-8 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).slice(0, 6 - photos.length);
                const b64 = await Promise.all(files.map(fileToBase64));
                setPhotos([...photos, ...b64].slice(0, 6));
              }}
            >
              <p className="text-gray-400">Upload up to 6 photos (drag & drop or click)</p>
              <input type="file" accept="image/*" multiple className="mt-4" onChange={async (e) => {
                const files = Array.from(e.target.files || []).slice(0, 6);
                setPhotos(await Promise.all(files.map(fileToBase64)));
              }} />
              <div className="flex gap-2 mt-4 flex-wrap justify-center">
                {photos.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p} alt="" className="w-20 h-20 object-cover rounded" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 text-xs">×</button>
                  </div>
                ))}
              </div>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your vehicle (min 50 characters)..."
              rows={5}
              className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-3 text-white"
            />
            <button onClick={submit} className="w-full bg-brand-gold text-brand-black py-4 rounded font-bold uppercase tracking-widest">
              🚀 POST MY AD
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
