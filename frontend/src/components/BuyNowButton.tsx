import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Listing } from '../api/listings';
import { createPaymentOrder, verifyPayment } from '../api/payment';
import { APP_NAME } from '../config/brand';
import PaymentSuccessModal from './PaymentSuccessModal';

interface Props {
  listing: Listing;
  onPaymentSuccess?: () => void;
}

export default function BuyNowButton({ listing, onPaymentSuccess }: Props) {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    paymentId: string;
    amount: number;
  } | null>(null);

  const handleBuy = async () => {
    if (!isAuthenticated || !token) {
      toast.error('Please login to purchase');
      navigate('/auth');
      return;
    }

    if (typeof window.Razorpay === 'undefined') {
      toast.error('Payment gateway failed to load. Please refresh the page.');
      return;
    }

    setLoading(true);
    try {
      const orderData = await createPaymentOrder(token, listing.id, listing.asking_price);

      const options = {
        key: orderData.razorpay_key,
        amount: orderData.amount,
        currency: 'INR',
        name: APP_NAME,
        description: `Purchase: ${listing.title}`,
        image: '/logo.svg',
        order_id: orderData.order_id,
        theme: { color: '#C9A84C' },
        prefill: {
          name: user?.full_name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const result = await verifyPayment(token, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              listing_id: listing.id,
            });
            if (result.status === 'success') {
              setSuccess({
                paymentId: result.payment_id,
                amount: result.amount,
              });
              onPaymentSuccess?.();
              toast.success('Payment successful!');
            }
          } catch (err) {
            const msg = axios.isAxiosError(err)
              ? err.response?.data?.detail || 'Payment verification failed'
              : 'Payment verification failed';
            toast.error(typeof msg === 'string' ? msg : 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.detail || 'Could not start payment'
        : 'Could not start payment';
      toast.error(typeof msg === 'string' ? msg : 'Could not start payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className="w-full bg-brand-gold text-brand-black py-3 rounded font-bold text-sm hover:bg-brand-gold/90 transition-colors disabled:opacity-60"
      >
        {loading ? 'Processing…' : `💳 BUY NOW — ₹${listing.asking_price.toFixed(2)} Lakhs`}
      </button>

      {success && (
        <PaymentSuccessModal
          paymentId={success.paymentId}
          amount={success.amount}
          vehicleTitle={listing.title}
          onClose={() => setSuccess(null)}
        />
      )}
    </>
  );
}
