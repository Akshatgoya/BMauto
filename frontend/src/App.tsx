import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import PredictionSection from './components/PredictionSection'
import AnalyticsSection from './components/AnalyticsSection'
import ModelPerformance from './components/ModelPerformance'
import Chatbot from './components/Chatbot'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import { Toaster } from 'react-hot-toast'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading sequence for luxury feel
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-t-2 border-brand-gold rounded-full animate-spin"></div>
          <h2 className="mt-8 font-serif text-2xl text-brand-gold tracking-widest uppercase">Initializing AI Engines</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-black min-h-screen text-gray-200 overflow-hidden relative">
      <CustomCursor />
      <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #C9A84C' } }} />
      <Navbar />
      <main>
        <Hero />
        <PredictionSection />
        <AnalyticsSection />
        <ModelPerformance />
      </main>
      <Footer />
      <Chatbot />
    </div>
  )
}

export default App
