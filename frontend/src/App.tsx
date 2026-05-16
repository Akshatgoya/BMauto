import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { APP_TITLE } from './config/brand';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CustomCursor from './components/CustomCursor';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import MarketplacePage from './pages/MarketplacePage';
import ListingDetailPage from './pages/ListingDetailPage';
import SellPage from './pages/SellPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  useEffect(() => {
    document.title = APP_TITLE;
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="bg-brand-black min-h-screen text-gray-200 relative">
          <CustomCursor />
          <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #C9A84C' } }} />
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/listing/:id" element={<ListingDetailPage />} />
            <Route path="/sell" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
