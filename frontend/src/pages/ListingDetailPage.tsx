import { useEffect, useState } from "react";
import { Link as RouterLink, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchListing,
  toggleSaveListing,
  Listing,
  fetchListings,
} from "../api/listings";
import { useAuth } from "../context/AuthContext";
import ListingCard from "../components/ListingCard";
import PurchasePanel from "../components/PurchasePanel";
import { APP_NAME } from "../config/brand";

export default function ListingDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user, token, isAuthenticated } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const l = await fetchListing(+id, token || undefined, showPhone);
        setListing(l);
        const sim = await fetchListings(
          { type: l.vehicle_type, brand: l.brand, limit: 4 },
          token || undefined,
        );
        setSimilar(sim.items.filter((x) => x.id !== l.id).slice(0, 3));
      } catch {
        toast.error("Listing not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token, showPhone]);

  useEffect(() => {
    if (!loading && location.hash === "#purchase") {
      document
        .getElementById("purchase")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, location.hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black pt-24 flex justify-center">
        <div className="w-12 h-12 border-t-2 border-brand-gold rounded-full animate-spin" />
      </div>
    );
  }
  if (!listing) {
    return (
      <div className="min-h-screen bg-brand-black pt-24 text-center text-gray-400">
        Listing not found.{" "}
        <RouterLink to="/marketplace" className="text-brand-gold">
          Back
        </RouterLink>
      </div>
    );
  }

  const photos = listing.photos?.length ? listing.photos : [];
  const diff = listing.asking_price - listing.ai_predicted_price;
  const pct = listing.ai_predicted_price
    ? ((diff / listing.ai_predicted_price) * 100).toFixed(1)
    : "0";
  const isSold = listing.status === "sold";
  const isOwnListing = user?.id === listing.seller_id;
  const canBuy = !isSold && !isOwnListing;

  const revealPhone = async () => {
    if (!isAuthenticated) {
      toast.error("Login to view phone number");
      return;
    }
    setShowPhone(true);
    const l = await fetchListing(listing.id, token!, true);
    setListing(l);
  };

  const handleSave = async () => {
    if (!token) return toast.error("Login to save");
    await toggleSaveListing(token, listing.id);
    setListing({ ...listing, is_saved: !listing.is_saved });
  };

  const handlePaymentSuccess = () => {
    setListing({ ...listing, status: "sold" });
  };

  const panelProps = {
    listing,
    showPhone,
    onRevealPhone: revealPhone,
    onSave: handleSave,
    onPaymentSuccess: handlePaymentSuccess,
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-16">
      <div className="container mx-auto px-6">
        {isSold && (
          <div className="mb-6 bg-red-600/20 border border-red-500 text-red-400 text-center py-3 rounded-lg font-bold uppercase tracking-widest">
            This vehicle has been sold
          </div>
        )}
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-card overflow-hidden relative">
              {isSold && (
                <span className="absolute top-4 left-4 z-10 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded uppercase tracking-wider">
                  SOLD
                </span>
              )}
              <div className="relative h-80 bg-[#111] flex items-center justify-center">
                {photos[photoIdx] ? (
                  <img
                    src={photos[photoIdx]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl text-brand-gold/30">
                    {listing.vehicle_type === "bike" ? "🏍️" : "🚗"}
                  </span>
                )}
                {canBuy && (
                  <a
                    href="#purchase"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById("purchase")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-12 z-10"
                  >
                    <span className="block w-full text-center bg-brand-gold text-brand-black py-3 rounded font-bold text-sm shadow-lg">
                      💳 Buy Now — ₹{listing.asking_price.toFixed(2)} Lakhs
                    </span>
                  </a>
                )}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 p-2">
                  {photos.slice(0, 6).map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoIdx(i)}
                      className={`w-16 h-12 rounded overflow-hidden border ${
                        photoIdx === i
                          ? "border-brand-gold"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={p}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Buy panel directly under car photo — visible without scrolling to sidebar */}
            <div className="lg:hidden">
              <PurchasePanel {...panelProps} />
            </div>

            <div className="glass-card p-6">
              <h1 className="font-serif text-3xl text-white">
                {listing.title}
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                {[
                  ["Year", listing.year],
                  ["Brand", listing.brand],
                  ["Model", listing.model],
                  ["Color", listing.color],
                  ["Fuel", listing.fuel_type],
                  ["Transmission", listing.transmission],
                  ["KMs", listing.kms_driven.toLocaleString()],
                  ["Owners", listing.owner_count],
                  ["City", listing.city],
                  ["Listed", new Date(listing.created_at).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-gray-500 block text-xs">{k}</span>
                    <span className="text-white">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-gray-400 leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="glass-card p-6 border-2 border-brand-gold/40">
              <h3 className="text-brand-gold font-serif text-xl mb-4">
                🤖 {APP_NAME} Price Analysis
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-xs">Asking Price</span>
                  <p className="text-2xl text-white">
                    ₹{listing.asking_price.toFixed(2)}L
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">AI Predicted</span>
                  <p className="text-2xl text-brand-teal">
                    ₹{listing.ai_predicted_price.toFixed(2)}L
                  </p>
                </div>
              </div>
              <p
                className={`mt-3 text-sm ${diff > 0 ? "text-red-400" : "text-green-400"}`}
              >
                {diff > 0
                  ? `Overpriced by ₹${diff.toFixed(2)}L (${pct}%)`
                  : `Under market by ₹${Math.abs(diff).toFixed(2)}L`}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="hidden lg:block">
              <PurchasePanel {...panelProps} />
            </div>

            {similar.length > 0 && (
              <div>
                <h3 className="text-brand-gold uppercase text-xs tracking-widest mb-4">
                  Similar Listings
                </h3>
                <div className="space-y-4">
                  {similar.map((s) => (
                    <ListingCard key={s.id} listing={s} showSave={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
