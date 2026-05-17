import { Link } from 'react-router-dom';

const options = [
  { emoji: '🚗', title: 'Sell a Vehicle', desc: 'List your car or bike for sale with AI pricing', to: '/sell', color: 'border-brand-gold hover:bg-brand-gold/10' },
  { emoji: '🔑', title: 'Rent Out a Vehicle', desc: 'Earn daily income from your idle vehicle', to: '/add-rental', color: 'border-brand-rental hover:bg-brand-rental/10' },
  { emoji: '🔧', title: 'Sell Spare Parts', desc: 'List engine, brakes, tyres and accessories', to: '/sell-part', color: 'border-brand-gold hover:bg-brand-gold/10' },
];

export default function SellHubPage() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-3">What do you want to sell?</h1>
        <p className="text-gray-400 mb-12">Choose how you want to list on BMauto</p>
        <div className="grid md:grid-cols-3 gap-6">
          {options.map((o) => (
            <Link key={o.to} to={o.to} className={`glass-card p-8 border-2 ${o.color} transition-all group`}>
              <span className="text-5xl block mb-4">{o.emoji}</span>
              <h2 className="font-serif text-xl text-white group-hover:text-brand-gold">{o.title}</h2>
              <p className="text-gray-500 text-sm mt-3">{o.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
