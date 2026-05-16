import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-hero bg-cover bg-center">
      {/* Subtle particle effect placeholder */}
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-brand-gold rounded-full blur-[2px] animate-pulse"></div>
         <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-brand-gold rounded-full blur-[2px] animate-pulse delay-150"></div>
         <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-brand-gold rounded-full blur-[1px] animate-pulse delay-300"></div>
         <div className="absolute bottom-1/3 right-1/3 w-2.5 h-2.5 bg-brand-gold rounded-full blur-[2px] animate-pulse delay-700"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="font-serif text-5xl md:text-7xl font-bold mb-6 tracking-wide"
        >
          Discover Your Vehicle's <span className="gold-gradient-text">True Worth</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-light"
        >
          AI-powered price prediction for Cars & Bikes — trained on real market data for the ultimate precision.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 justify-center"
        >
          <a href="#predict" className="px-8 py-4 bg-brand-gold text-brand-black font-semibold uppercase tracking-widest rounded transition-all hover:bg-brand-goldLight hover:shadow-[0_0_20px_rgba(201,168,76,0.4)]">
            Predict Car Price
          </a>
          <a href="#predict" className="px-8 py-4 bg-transparent border border-brand-gold text-brand-gold font-semibold uppercase tracking-widest rounded transition-all hover:bg-brand-gold/10">
            Predict Bike Price
          </a>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-brand-gold/20 pt-10"
        >
          <div>
            <div className="text-3xl font-serif text-brand-gold mb-2">300+</div>
            <div className="text-sm uppercase tracking-widest text-gray-400">Cars Analyzed</div>
          </div>
          <div>
            <div className="text-3xl font-serif text-brand-gold mb-2">500+</div>
            <div className="text-sm uppercase tracking-widest text-gray-400">Bikes Analyzed</div>
          </div>
          <div>
            <div className="text-3xl font-serif text-brand-gold mb-2">4</div>
            <div className="text-sm uppercase tracking-widest text-gray-400">ML Models</div>
          </div>
          <div>
            <div className="text-3xl font-serif text-brand-teal mb-2">98%</div>
            <div className="text-sm uppercase tracking-widest text-gray-400">Top Accuracy</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
