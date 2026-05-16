export default function Footer() {
  return (
    <footer id="about" className="bg-brand-black py-12 border-t border-brand-gold/20">
      <div className="container mx-auto px-6 max-w-5xl text-center">
        <h2 className="font-serif text-2xl font-bold text-white mb-6">
          AutoValu<span className="text-brand-gold">AI</span>
        </h2>
        
        <p className="text-gray-400 text-sm max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          The machine learning pipeline ingests historical automotive market data, applies rigorous preprocessing, and trains an ensemble of regressors—including Linear, Lasso, Random Forest, and a Multi-Layer Perceptron Neural Network—to output the most accurate market valuation possible.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-10 text-xs uppercase tracking-widest text-brand-gold font-bold">
          <span>Python</span>
          <span>•</span>
          <span>FastAPI</span>
          <span>•</span>
          <span>React</span>
          <span>•</span>
          <span>Scikit-Learn</span>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent mb-8"></div>
        
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} AutoValuAI. Built with precision.
        </p>
      </div>
    </footer>
  );
}
