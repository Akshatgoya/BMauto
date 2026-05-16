import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictCarPrice, predictBikePrice, PredictionResponse } from '../api/predict';
import toast from 'react-hot-toast';

export default function PredictionSection() {
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const [formData, setFormData] = useState({
    year: 2015,
    present_price: 5.0,
    kms_driven: 30000,
    owner: 0,
    fuel_type: 0, // Petrol
    seller_type: 0, // Dealer
    transmission: 0, // Manual
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: parseFloat(e.target.value)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let res;
      if (vehicleType === 'car') {
        res = await predictCarPrice(formData);
      } else {
        res = await predictBikePrice(formData);
      }
      setResult(res);
      toast.success('Prediction successful!');
    } catch (error) {
      toast.error('Failed to get prediction. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="predict" className="py-24 bg-brand-black">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">Precision Valuation</h2>
          <div className="w-24 h-1 bg-brand-gold mx-auto mb-8"></div>
        </div>

        <div className="flex justify-center mb-10">
          <div className="flex p-1 bg-white/5 rounded-lg border border-brand-gold/20">
            <button 
              className={`px-8 py-3 rounded-md transition-all uppercase tracking-widest text-sm font-semibold ${vehicleType === 'car' ? 'bg-brand-gold text-brand-black' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setVehicleType('car'); setResult(null); }}
            >
              🚗 Car
            </button>
            <button 
              className={`px-8 py-3 rounded-md transition-all uppercase tracking-widest text-sm font-semibold ${vehicleType === 'bike' ? 'bg-brand-gold text-brand-black' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setVehicleType('bike'); setResult(null); }}
            >
              🏍️ Bike
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2">Year</label>
                  <input type="number" name="year" value={formData.year} onChange={handleChange} min="2000" max="2025" className="w-full bg-brand-black/50 border border-brand-gold/30 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2">Original Price (Lakhs)</label>
                  <input type="number" step="0.01" name="present_price" value={formData.present_price} onChange={handleChange} className="w-full bg-brand-black/50 border border-brand-gold/30 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2">Kms Driven</label>
                  <input type="number" name="kms_driven" value={formData.kms_driven} onChange={handleChange} className="w-full bg-brand-black/50 border border-brand-gold/30 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2">Previous Owners</label>
                  <select name="owner" value={formData.owner} onChange={handleChange} className="w-full bg-brand-black/50 border border-brand-gold/30 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors">
                    <option value={0}>0 (First Owner)</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2">Fuel Type</label>
                <select name="fuel_type" value={formData.fuel_type} onChange={handleChange} className="w-full bg-brand-black/50 border border-brand-gold/30 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors">
                  <option value={0}>Petrol</option>
                  <option value={1}>Diesel</option>
                  <option value={2}>CNG</option>
                  <option value={3}>Electric</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2">Seller Type</label>
                  <select name="seller_type" value={formData.seller_type} onChange={handleChange} className="w-full bg-brand-black/50 border border-brand-gold/30 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors">
                    <option value={0}>Dealer</option>
                    <option value={1}>Individual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2">Transmission</label>
                  <select name="transmission" value={formData.transmission} onChange={handleChange} className="w-full bg-brand-black/50 border border-brand-gold/30 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors">
                    <option value={0}>Manual</option>
                    <option value={1}>Automatic</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-gold text-brand-black font-bold uppercase tracking-widest py-4 rounded transition-all hover:bg-brand-goldLight hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] mt-6 relative overflow-hidden group"
              >
                {loading ? 'Analyzing...' : 'Estimate Price'}
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shimmer"></div>
              </button>
            </form>
          </motion.div>

          <div className="flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold to-brand-goldLight"></div>
                  <h3 className="text-xl font-serif text-gray-300 mb-2">Estimated Market Value</h3>
                  <div className="text-5xl md:text-6xl font-bold gold-gradient-text mb-6">
                    ₹ {result.best_prediction.toFixed(2)} <span className="text-2xl text-brand-gold">Lakhs</span>
                  </div>
                  
                  <div className="inline-block px-4 py-1 bg-brand-gold/10 border border-brand-gold/30 rounded-full text-brand-gold text-sm tracking-widest uppercase mb-8">
                    Best Model: {result.best_model}
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Linear Regression</span>
                      <span className="font-mono">₹{result.linear_pred.toFixed(2)}L</span>
                    </div>
                    <div className="w-full bg-brand-black/50 h-2 rounded-full overflow-hidden">
                      <div className="bg-gray-600 h-full" style={{width: `${(result.linear_pred / result.best_prediction) * 50}%`}}></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Lasso Regression</span>
                      <span className="font-mono">₹{result.lasso_pred.toFixed(2)}L</span>
                    </div>
                    <div className="w-full bg-brand-black/50 h-2 rounded-full overflow-hidden">
                      <div className="bg-gray-600 h-full" style={{width: `${(result.lasso_pred / result.best_prediction) * 50}%`}}></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Random Forest</span>
                      <span className="font-mono text-brand-gold">₹{result.rf_pred.toFixed(2)}L</span>
                    </div>
                    <div className="w-full bg-brand-black/50 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-gold h-full" style={{width: `${(result.rf_pred / result.best_prediction) * 50}%`}}></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Neural Network</span>
                      <span className="font-mono text-brand-teal">₹{result.nn_pred.toFixed(2)}L</span>
                    </div>
                    <div className="w-full bg-brand-black/50 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-teal h-full" style={{width: `${(result.nn_pred / result.best_prediction) * 50}%`}}></div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-brand-gold/20 rounded-2xl opacity-50"
                >
                  <div className="w-16 h-16 rounded-full border border-brand-gold/30 flex items-center justify-center mb-4">
                    <span className="text-brand-gold text-2xl">?</span>
                  </div>
                  <p className="text-gray-400 font-light">Fill the details and click estimate to see AI predicted price.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
