import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function ModelPerformance() {
  const performanceData = [
    { name: 'Linear Regression', score: 0.82 },
    { name: 'Lasso Regression', score: 0.81 },
    { name: 'Random Forest', score: 0.94 },
    { name: 'Neural Network', score: 0.89 },
  ];

  return (
    <section className="py-24 bg-brand-black border-t border-brand-gold/10">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold mb-4 text-white">Engineered Precision</h2>
          <div className="w-24 h-1 bg-brand-gold mx-auto mb-8"></div>
          <p className="text-gray-400 max-w-2xl mx-auto">Our valuation engine runs your vehicle's profile through four distinct machine learning algorithms simultaneously, selecting the most accurate model based on real-time test performance.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {performanceData.map((model, i) => (
            <div key={i} className={`glass-card text-center ${model.name === 'Random Forest' ? 'border-brand-gold shadow-[0_0_15px_rgba(201,168,76,0.15)]' : ''}`}>
              <div className="text-sm uppercase tracking-widest text-gray-400 mb-4">{model.name}</div>
              <div className="text-4xl font-serif text-brand-gold">{(model.score * 100).toFixed(0)}%</div>
              <div className="text-xs text-gray-500 mt-2">Accuracy (R²)</div>
            </div>
          ))}
        </div>

        <div className="glass-card h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" domain={[0, 1]} hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#C9A84C', fontSize: 12 }} width={120} />
              <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#C9A84C' }} itemStyle={{ color: '#C9A84C' }} />
              <Bar dataKey="score" fill="#C9A84C" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
