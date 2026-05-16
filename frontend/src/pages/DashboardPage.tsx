import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/auth';
import { fetchMyListings, fetchSavedListings, deleteListing, updateListing, Listing } from '../api/listings';
import {
  fetchPaymentHistory,
  fetchPaymentsReceived,
  PaymentRecord,
} from '../api/payment';
import ListingCard from '../components/ListingCard';

type Tab = 'profile' | 'listings' | 'saved' | 'payments' | 'sales';

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === 'success') return 'border-green-500 text-green-400 bg-green-500/10';
  if (s === 'pending') return 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
  return 'border-red-500 text-red-400 bg-red-500/10';
}

export default function DashboardPage() {
  const { user, token, refreshUser } = useAuth();
  const location = useLocation();
  const initialTab = (location.state as { tab?: Tab })?.tab;
  const [tab, setTab] = useState<Tab>(initialTab || 'profile');
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [saved, setSaved] = useState<Listing[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [sales, setSales] = useState<PaymentRecord[]>([]);
  const [form, setForm] = useState({ full_name: '', phone: '', city: '' });

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name, phone: user.phone, city: user.city });
  }, [user]);

  useEffect(() => {
    if (!token) return;
    if (tab === 'listings') {
      fetchMyListings(token).then(setMyListings).catch(() => toast.error('Failed to load'));
    }
    if (tab === 'saved') {
      fetchSavedListings(token).then(setSaved).catch(() => toast.error('Failed to load'));
    }
    if (tab === 'payments') {
      fetchPaymentHistory(token).then(setPayments).catch(() => toast.error('Failed to load payments'));
    }
    if (tab === 'sales') {
      fetchPaymentsReceived(token).then(setSales).catch(() => toast.error('Failed to load sales'));
    }
  }, [tab, token]);

  const saveProfile = async () => {
    if (!token) return;
    try {
      await updateProfile(token, form);
      await refreshUser();
      toast.success('Profile updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const markSold = async (id: number) => {
    if (!token) return;
    await updateListing(token, id, { status: 'sold' });
    setMyListings(await fetchMyListings(token));
    toast.success('Marked as sold');
  };

  const removeListing = async (id: number) => {
    if (!token || !confirm('Delete this listing?')) return;
    await deleteListing(token, id);
    setMyListings(await fetchMyListings(token));
    toast.success('Deleted');
  };

  const navItems: { id: Tab; label: string }[] = [
    { id: 'profile', label: '👤 My Profile' },
    { id: 'listings', label: '📋 My Listings' },
    { id: 'saved', label: '❤️ Saved Vehicles' },
    { id: 'payments', label: '💳 My Payments' },
    { id: 'sales', label: '💰 Sales Received' },
  ];

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-16">
      <div className="container mx-auto px-6 flex flex-col md:flex-row gap-8">
        <aside className="md:w-64 glass-card p-4 h-fit">
          {navItems.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-4 py-3 rounded mb-1 text-sm ${
                tab === t.id ? 'bg-brand-gold/20 text-brand-gold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </aside>

        <div className="flex-1 min-w-0">
          {tab === 'profile' && user && (
            <div className="glass-card p-8">
              <h2 className="font-serif text-2xl text-white mb-6">My Profile</h2>
              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="bg-white/5 p-4 rounded">
                  <p className="text-2xl text-brand-gold">{myListings.length || '—'}</p>
                  <p className="text-xs text-gray-500">Listings</p>
                </div>
                <div className="bg-white/5 p-4 rounded">
                  <p className="text-2xl text-brand-gold">{saved.length || '—'}</p>
                  <p className="text-xs text-gray-500">Saved</p>
                </div>
                <div className="bg-white/5 p-4 rounded">
                  <p className="text-2xl text-brand-gold">{payments.length || '—'}</p>
                  <p className="text-xs text-gray-500">Purchases</p>
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white"
                  placeholder="Full Name"
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white"
                  placeholder="Phone"
                />
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full bg-[#111] border border-brand-gold/30 rounded px-4 py-2 text-white"
                  placeholder="City"
                />
                <button
                  onClick={saveProfile}
                  className="bg-brand-gold text-brand-black px-6 py-2 rounded font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {tab === 'listings' && (
            <div>
              <h2 className="font-serif text-2xl text-white mb-6">My Listings</h2>
              <div className="space-y-4">
                {myListings.map((l) => (
                  <div
                    key={l.id}
                    className="glass-card p-4 flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div>
                      <h3 className="text-white font-semibold">{l.title}</h3>
                      <span
                        className={`text-xs uppercase px-2 py-0.5 rounded border ${
                          l.status === 'active'
                            ? 'border-green-500 text-green-400'
                            : l.status === 'sold'
                              ? 'border-red-500 text-red-400'
                              : 'border-gray-500 text-gray-400'
                        }`}
                      >
                        {l.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{l.views} views</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {l.status === 'active' && (
                        <button
                          onClick={() => markSold(l.id)}
                          className="text-xs border border-brand-gold text-brand-gold px-3 py-1 rounded"
                        >
                          Mark Sold
                        </button>
                      )}
                      <button
                        onClick={() => removeListing(l.id)}
                        className="text-xs border border-red-500 text-red-400 px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {!myListings.length && (
                  <p className="text-gray-500">
                    No listings yet.{' '}
                    <a href="/sell" className="text-brand-gold">
                      Post an ad
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === 'saved' && (
            <div>
              <h2 className="font-serif text-2xl text-white mb-6">Saved Vehicles</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {saved.map((l) => (
                  <ListingCard key={l.id} listing={l} showSave={false} />
                ))}
                {!saved.length && <p className="text-gray-500 col-span-2">No saved vehicles.</p>}
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div>
              <h2 className="font-serif text-2xl text-white mb-6">💳 My Payments</h2>
              <div className="glass-card overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-left">
                      <th className="p-4 font-normal">Vehicle</th>
                      <th className="p-4 font-normal">Amount</th>
                      <th className="p-4 font-normal">Date</th>
                      <th className="p-4 font-normal">Payment ID</th>
                      <th className="p-4 font-normal">Status</th>
                      <th className="p-4 font-normal"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 text-white">{p.listing_title || `Listing #${p.listing_id}`}</td>
                        <td className="p-4 text-brand-gold">₹{p.amount.toFixed(2)}L</td>
                        <td className="p-4 text-gray-400">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-xs">
                          {p.razorpay_payment_id || p.razorpay_order_id}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs uppercase px-2 py-0.5 rounded border ${statusBadge(p.status)}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <Link
                            to={`/listing/${p.listing_id}`}
                            className="text-brand-gold text-xs hover:text-white"
                          >
                            View Listing
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!payments.length && (
                  <p className="p-8 text-center text-gray-500">No payments yet.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'sales' && (
            <div>
              <h2 className="font-serif text-2xl text-white mb-6">💰 Sales Received</h2>
              <div className="space-y-4">
                {sales.map((p) => (
                  <div key={p.id} className="glass-card p-6 border border-brand-gold/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-white font-semibold">{p.listing_title}</h3>
                        <p className="text-brand-gold text-lg mt-1">₹{p.amount.toFixed(2)} Lakhs received</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(p.created_at).toLocaleString()} · {p.payment_method || 'razorpay'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono mt-1">{p.razorpay_payment_id}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-sm">
                        <p className="text-brand-gold text-xs uppercase tracking-widest mb-2">Buyer Details</p>
                        <p className="text-white">{p.buyer_name}</p>
                        <p className="text-gray-400">{p.buyer_email}</p>
                        <p className="text-gray-400">{p.buyer_phone}</p>
                      </div>
                    </div>
                    <Link
                      to={`/listing/${p.listing_id}`}
                      className="inline-block mt-4 text-xs text-brand-gold hover:text-white"
                    >
                      View Listing →
                    </Link>
                  </div>
                ))}
                {!sales.length && (
                  <p className="text-gray-500">No sales yet. Payments appear here when a buyer completes checkout.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
