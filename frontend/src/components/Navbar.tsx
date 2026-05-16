import { useState, useEffect } from 'react';
import { Car, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-brand-black/95 backdrop-blur-md py-4 border-b border-brand-gold/20' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Car className="text-brand-gold w-8 h-8" />
          <span className="font-serif text-2xl font-bold tracking-wider text-white">
            AutoValu<span className="text-brand-gold">AI</span>
          </span>
        </div>
        
        <div className="hidden md:flex gap-8 items-center text-sm uppercase tracking-widest font-semibold">
          <a href="#hero" className="hover:text-brand-gold transition-colors">Home</a>
          <a href="#predict" className="hover:text-brand-gold transition-colors">Predict</a>
          <a href="#analytics" className="hover:text-brand-gold transition-colors">Analytics</a>
          <a href="#about" className="hover:text-brand-gold transition-colors">About</a>
        </div>

        <button className="md:hidden text-white hover:text-brand-gold" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-brand-black border-b border-brand-gold/20 py-4 flex flex-col items-center gap-4 text-sm uppercase tracking-widest">
          <a href="#hero" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#predict" onClick={() => setMobileMenuOpen(false)}>Predict</a>
          <a href="#analytics" onClick={() => setMobileMenuOpen(false)}>Analytics</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
        </div>
      )}
    </nav>
  );
}
