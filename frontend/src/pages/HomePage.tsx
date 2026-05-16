import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import PredictionSection from '../components/PredictionSection';
import AnalyticsSection from '../components/AnalyticsSection';
import ModelPerformance from '../components/ModelPerformance';
import Chatbot from '../components/Chatbot';
import Footer from '../components/Footer';

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-16 h-16 border-t-2 border-brand-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Hero />
      <PredictionSection />
      <AnalyticsSection />
      <ModelPerformance />
      <Footer />
      <Chatbot />
    </>
  );
}
