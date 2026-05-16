import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface Props {
  paymentId: string;
  amount: number;
  vehicleTitle: string;
  onClose: () => void;
}

export default function PaymentSuccessModal({
  paymentId,
  amount,
  vehicleTitle,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card border-2 border-brand-gold/50 max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-20 h-20 text-green-500 animate-pulse" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl text-white text-center mb-2">Payment Successful! 🎉</h2>
        <div className="space-y-2 text-sm text-gray-400 text-center mb-6">
          <p>
            <span className="text-gray-500">Payment ID:</span>{' '}
            <span className="text-brand-gold font-mono">{paymentId}</span>
          </p>
          <p>
            <span className="text-gray-500">Amount Paid:</span>{' '}
            <span className="text-white font-semibold">₹{amount.toFixed(2)} Lakhs</span>
          </p>
          <p>
            <span className="text-gray-500">Vehicle:</span>{' '}
            <span className="text-white">{vehicleTitle}</span>
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 mb-6 text-sm text-gray-300">
          <p className="font-semibold text-brand-gold mb-2">Next Steps</p>
          <ul className="space-y-1 text-left">
            <li>📞 Seller will contact you within 24 hours</li>
            <li>📄 Check your email for receipt</li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/dashboard"
            state={{ tab: 'payments' }}
            onClick={onClose}
            className="flex-1 text-center bg-brand-gold text-brand-black py-3 rounded font-bold text-sm"
          >
            View My Purchases
          </Link>
          <Link
            to="/marketplace"
            onClick={onClose}
            className="flex-1 text-center border border-brand-gold text-brand-gold py-3 rounded font-bold text-sm"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
