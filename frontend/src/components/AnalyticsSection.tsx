import { useEffect, useState } from 'react';
import { getCarAnalytics, getBikeAnalytics } from '../api/predict';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function AnalyticsSection() {
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = vehicleType === 'car' ? await getCarAnalytics() : await getBikeAnalytics();
        setData(res);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [vehicleType]);

  const COLORS = ['#C9A84C', '#00CCBB', '#A333FF', '#FF6347'];

  let fuelData: { name: string; value: number }[] = [];
  if (data) {
    fuelData = Object.keys(data.fuel_distribution).map((key) => ({
      name: key,
      value: data.fuel_distribution[key]
    }));
  }

  return (
    <section id="analytics" className="py-24 bg-[#111111] border-t border-brand-gold/10">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold mb-4 text-white">Market Analytics</h2>
          <div className="w-24 h-1 bg-brand-gold mx-auto"></div>
        </div>

        <div className="flex justify-center mb-10">
          <div className="flex p-1 bg-white/5 rounded-lg border border-brand-gold/20">
            <button 
              className={`px-8 py-2 rounded-md transition-all uppercase tracking-widest text-sm font-semibold ${vehicleType === 'car' ? 'bg-brand-gold text-brand-black' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setVehicleType('car')}
            >
              Car Analytics
            </button>
            <button 
              className={`px-8 py-2 rounded-md transition-all uppercase tracking-widest text-sm font-semibold ${vehicleType === 'bike' ? 'bg-brand-gold text-brand-black' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setVehicleType('bike')}
            >
              Bike Analytics
            </button>
          </div>
        </div>

        {data ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card flex flex-col items-center">
              <h3 className="font-serif text-xl text-brand-gold mb-6">Fuel Type Distribution</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fuelData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {fuelData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#C9A84C' }} itemStyle={{ color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card flex flex-col items-center justify-center">
              <h3 className="font-serif text-xl text-brand-gold mb-6">Price Range Overview</h3>
              <div className="w-full space-y-6">
                <div>
                  <div className="text-gray-400 text-sm uppercase tracking-widest mb-1">Minimum Price</div>
                  <div className="text-2xl font-mono text-white">₹{data.price_ranges.min.toFixed(2)}L</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm uppercase tracking-widest mb-1">Average Price</div>
                  <div className="text-3xl font-mono text-brand-gold">₹{data.price_ranges.mean.toFixed(2)}L</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm uppercase tracking-widest mb-1">Maximum Price</div>
                  <div className="text-2xl font-mono text-brand-teal">₹{data.price_ranges.max.toFixed(2)}L</div>
                </div>
              </div>
            </div>

            <div className="glass-card flex flex-col items-center">
              <h3 className="font-serif text-xl text-brand-gold mb-6">Seller Type Analysis</h3>
              <div className="w-full flex-1 flex flex-col justify-center gap-6">
                 {Object.entries(data.seller_distribution).map(([key, value]: any) => (
                    <div key={key}>
                      <div className="flex justify-between mb-2">
                        <span className="capitalize">{key}</span>
                        <span className="font-mono text-brand-gold">{value}</span>
                      </div>
                      <div className="w-full bg-brand-black h-3 rounded-full overflow-hidden">
                        <div className="bg-brand-gold h-full" style={{ width: `${(value / Math.max(...(Object.values(data.seller_distribution) as number[]))) * 100}%` }}></div>
                      </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">Loading analytics...</div>
        )}
      </div>
    </section>
  );
}
