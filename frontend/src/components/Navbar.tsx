import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Heart, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-brand-black/95 backdrop-blur-md py-4 border-b border-brand-gold/20' : 'bg-brand-black/80 backdrop-blur-sm py-5 border-b border-transparent'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <BrandLogo />

        <div className="hidden md:flex gap-6 items-center text-sm uppercase tracking-widest font-semibold">
          <a href="/#hero" className="hover:text-brand-gold transition-colors">Home</a>
          <a href="/#predict" className="hover:text-brand-gold transition-colors">Predict Price</a>
          <Link to="/marketplace" className="hover:text-brand-gold transition-colors">Marketplace</Link>
          <Link to="/sell" className="hover:text-brand-gold transition-colors">Sell</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <button className="text-gray-400 hover:text-brand-gold"><Bell size={20} /></button>
              <Link to="/dashboard" className="text-gray-400 hover:text-brand-gold"><Heart size={20} /></Link>
              <div className="relative">
                <button
                  onClick={() => setDropdown(!dropdown)}
                  className="w-9 h-9 rounded-full bg-brand-gold/20 border border-brand-gold text-brand-gold font-bold text-sm"
                >
                  {user?.full_name?.charAt(0) || 'U'}
                </button>
                {dropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-brand-gold/30 rounded-lg shadow-xl py-2 text-sm normal-case tracking-normal">
                    <Link to="/dashboard" className="block px-4 py-2 hover:bg-white/5" onClick={() => setDropdown(false)}>Dashboard</Link>
                    <Link to="/dashboard" className="block px-4 py-2 hover:bg-white/5" onClick={() => setDropdown(false)}>My Listings</Link>
                    <Link to="/sell" className="block px-4 py-2 hover:bg-white/5" onClick={() => setDropdown(false)}>Post Ad</Link>
                    <button onClick={() => { logout(); setDropdown(false); navigate('/'); }} className="block w-full text-left px-4 py-2 hover:bg-white/5 text-red-400">Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-gray-300 hover:text-white text-sm uppercase tracking-widest">Login</Link>
              <Link to="/auth" className="bg-brand-gold text-brand-black px-4 py-2 rounded text-sm font-bold uppercase tracking-widest">Register</Link>
            </>
          )}
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-black border-b border-brand-gold/20 py-4 px-6 flex flex-col gap-3 text-sm uppercase tracking-widest">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/marketplace" onClick={() => setMobileMenuOpen(false)}>Marketplace</Link>
          <Link to="/sell" onClick={() => setMobileMenuOpen(false)}>Sell</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left text-red-400">Logout</button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Login / Register</Link>
          )}
        </div>
      )}
    </nav>
  );
}
