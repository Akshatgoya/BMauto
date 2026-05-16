import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Eye, EyeOff, Check } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { APP_TAGLINE } from '../config/brand';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Pune', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Surat',
];

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    full_name: '', email: '', phone: '+91', password: '', confirm: '',
    city: 'Mumbai', role: 'both', terms: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!loginForm.email) return setErrors({ email: 'Email required' });
    if (!loginForm.password) return setErrors({ password: 'Password required' });
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
      navigate('/marketplace');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!regForm.full_name) err.full_name = 'Name required';
    if (!regForm.email) err.email = 'Email required';
    if (regForm.password.length < 6) err.password = 'Min 6 characters';
    if (regForm.password !== regForm.confirm) err.confirm = 'Passwords do not match';
    if (!regForm.terms) err.terms = 'Accept terms to continue';
    if (Object.keys(err).length) return setErrors(err);
    setLoading(true);
    try {
      await register({
        full_name: regForm.full_name,
        email: regForm.email,
        password: regForm.password,
        phone: regForm.phone,
        city: regForm.city,
        role: regForm.role,
      });
      toast.success('Account created!');
      navigate('/marketplace');
    } catch {
      toast.error('Registration failed. Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const passStrength = regForm.password.length >= 8 ? 'strong' : regForm.password.length >= 5 ? 'medium' : 'weak';

  return (
    <div className="min-h-screen bg-brand-black flex">
      <div className="hidden lg:flex lg:w-[40%] bg-[#0A0A0A] border-r border-brand-gold/10 flex-col justify-center p-12 relative overflow-hidden">
        <Car className="absolute -right-20 bottom-0 w-80 h-80 text-brand-gold/5" aria-hidden />
        <BrandLogo
          asLink={false}
          textClassName="brand-wordmark text-4xl md:text-5xl"
          iconClassName="w-14 h-14"
        />
        <p className="text-brand-gold mt-4 tracking-wide">{APP_TAGLINE}</p>
        <ul className="mt-10 space-y-4 text-gray-400">
          {['AI-Powered Price Predictions', 'Buy & Sell Verified Vehicles', 'Trusted by 10,000+ Users'].map((f) => (
            <li key={f} className="flex items-center gap-3">
              <Check className="text-brand-gold w-5 h-5" /> {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex mb-8 border border-brand-gold/20 rounded-lg overflow-hidden">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm uppercase tracking-widest ${
                  tab === t ? 'bg-brand-gold text-brand-black' : 'text-gray-400'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-brand-gold uppercase">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full bg-[#111] border border-brand-gold/30 rounded pl-10 pr-4 py-2 text-white"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs text-brand-gold uppercase">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-500">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-brand-gold text-brand-black font-bold py-3 rounded uppercase tracking-widest">
                Sign In
              </button>
              <button type="button" onClick={() => navigate('/marketplace')} className="w-full border border-gray-600 text-gray-400 py-2 rounded text-sm">
                Continue as Guest
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {[
                { key: 'full_name', label: 'Full Name', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Phone', type: 'tel' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-xs text-brand-gold uppercase">{label}</label>
                  <input
                    type={type}
                    value={regForm[key as keyof typeof regForm] as string}
                    onChange={(e) => setRegForm({ ...regForm, [key]: e.target.value })}
                    className="w-full mt-1 bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white"
                  />
                  {errors[key] && <p className="text-red-400 text-xs">{errors[key]}</p>}
                </div>
              ))}
              <div>
                <label className="text-xs text-brand-gold uppercase">City</label>
                <select
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  className="w-full mt-1 bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white"
                >
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-brand-gold uppercase">Password</label>
                <input
                  type="password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full mt-1 bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white"
                />
                <div className={`h-1 mt-1 rounded ${passStrength === 'strong' ? 'bg-green-500 w-full' : passStrength === 'medium' ? 'bg-yellow-500 w-2/3' : 'bg-red-500 w-1/3'}`} />
              </div>
              <div>
                <label className="text-xs text-brand-gold uppercase">Confirm Password</label>
                <input
                  type="password"
                  value={regForm.confirm}
                  onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })}
                  className="w-full mt-1 bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white"
                />
                {errors.confirm && <p className="text-red-400 text-xs">{errors.confirm}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: 'buyer', l: '🛒 Buy' },
                  { v: 'seller', l: '💰 Sell' },
                  { v: 'both', l: '🔄 Both' },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRegForm({ ...regForm, role: v })}
                    className={`flex-1 py-2 text-xs border rounded ${regForm.role === v ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-gray-700 text-gray-500'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input type="checkbox" checked={regForm.terms} onChange={(e) => setRegForm({ ...regForm, terms: e.target.checked })} />
                I agree to Terms & Privacy
              </label>
              {errors.terms && <p className="text-red-400 text-xs">{errors.terms}</p>}
              <button type="submit" disabled={loading} className="w-full bg-brand-gold text-brand-black font-bold py-3 rounded uppercase tracking-widest">
                Create Account
              </button>
            </form>
          )}
          <p className="text-center text-gray-500 text-sm mt-6">
            <Link to="/" className="text-brand-gold hover:underline">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
