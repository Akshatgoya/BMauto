import { Link } from 'react-router-dom';
import { Listing } from '../api/listings';
import { useAuth } from '../context/AuthContext';
import BuyNowButton from './BuyNowButton';

interface Props {
  listing: Listing;
  showPhone: boolean;
  onRevealPhone: () => void;
  onSave: () => void;
  onPaymentSuccess?: () => void;
}

export default function PurchasePanel({
  listing,
  showPhone,
  onRevealPhone,
  onSave,
  onPaymentSuccess,
}: Props) {
  const { user, isAuthenticated } = useAuth();
  const isSold = listing.status === 'sold';
  const isOwnListing = user?.id === listing.seller_id;
  const canBuy = !isSold && !isOwnListing;

  const waLink = listing.seller?.phone
    ? `https://wa.me/${listing.seller.phone.replace(/\D/g, '')}?text=Hi, interested in ${listing.title}`
    : '#';

  return (
    <div id="purchase" className="glass-card p-6 border-2 border-brand-gold/60 scroll-mt-28">
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Asking Price</p>
      <p className="text-3xl font-bold text-brand-gold mb-4">
        ₹{listing.asking_price.toFixed(2)} <span className="text-lg">Lakhs</span>
      </p>

      {isSold && (
        <div className="mb-4 py-3 text-center bg-red-600/20 border border-red-500 text-red-400 rounded font-bold uppercase text-sm tracking-wider">
          Sold
        </div>
      )}

      {canBuy && (
        <>
          <BuyNowButton listing={listing} onPaymentSuccess={onPaymentSuccess} />
          <div className="mt-3 pt-3 border-t border-white/10 text-center text-xs text-gray-500 space-y-1">
            <p>🔒 Secured by Razorpay</p>
            <p className="text-brand-gold/80">✅ UPI | Cards | Net Banking | Wallets</p>
          </div>
        </>
      )}

      {isOwnListing && !isSold && (
        <p className="text-sm text-gray-400 text-center py-3 mb-2 border border-white/10 rounded">
          This is your listing — buyers will see Buy Now here
        </p>
      )}

      {!isAuthenticated && canBuy && (
        <p className="text-xs text-gray-500 text-center mt-2">
          <Link to="/auth" className="text-brand-gold hover:underline">
            Log in
          </Link>{' '}
          to complete purchase
        </p>
      )}

      <button
        type="button"
        onClick={onRevealPhone}
        className="w-full mt-3 border border-brand-gold text-brand-gold py-3 rounded font-bold text-sm hover:bg-brand-gold/10 transition-colors"
      >
        📞 {showPhone && listing.seller?.phone ? listing.seller.phone : 'Contact Seller'}
      </button>
      {listing.seller?.phone && showPhone && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="block w-full mt-2 border border-green-600 text-green-400 py-3 rounded font-bold text-sm text-center hover:bg-green-600/10"
        >
          💬 Chat on WhatsApp
        </a>
      )}
      <button
        type="button"
        onClick={onSave}
        className="w-full mt-2 border border-brand-gold/50 text-brand-gold py-3 rounded text-sm hover:bg-brand-gold/10"
      >
        ❤️ {listing.is_saved ? 'Saved' : 'Save Listing'}
      </button>

      {listing.seller && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold font-bold">
              {listing.seller.full_name.charAt(0)}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{listing.seller.full_name}</p>
              <p className="text-xs text-gray-500">{listing.seller.city}</p>
            </div>
          </div>
          <span className="inline-block mt-2 text-[10px] text-brand-gold border border-brand-gold/30 px-2 py-0.5 rounded">
            ⭐ Verified Seller
          </span>
        </div>
      )}
    </div>
  );
}
