import React from 'react';
import { Layers, TrendingUp, CreditCard, Wallet, Package } from 'lucide-react';
import { Card } from '../components/ui/UIComponents';
import { formatCurrency } from '../utils/helpers';

export default function Dashboard({ stats, sales, darkMode }) {
  return (
    <div className="space-y-6 pb-20">
      {/* Updated Grid with New Logic */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4"> 
        
        <Card 
            darkMode={darkMode} 
            title="Capital" 
            value={formatCurrency(stats.capital)} 
            subtext="Total Investment"
            icon={Layers} 
            colorClass="bg-blue-600/20 text-blue-500" 
            iconBgClass="bg-blue-50" 
            iconTextClass="text-blue-600" 
        />
        
        <Card 
            darkMode={darkMode} 
            title="Net Profit" 
            value={formatCurrency(stats.profit)} 
            subtext="After Partner Share"
            icon={TrendingUp} 
            colorClass="bg-emerald-600/20 text-emerald-500" 
            iconBgClass="bg-emerald-50" 
            iconTextClass="text-emerald-600" 
        />
        
        <Card 
            darkMode={darkMode} 
            title="Pending" 
            value={formatCurrency(stats.receivable)} 
            subtext="Customer Debt"
            icon={CreditCard} 
            colorClass="bg-amber-600/20 text-amber-500" 
            iconBgClass="bg-amber-50" 
            iconTextClass="text-amber-600" 
        />
        
        <Card 
            darkMode={darkMode} 
            title="Received" 
            value={formatCurrency(stats.received)} 
            subtext="Cash Collected"
            icon={Wallet} 
            colorClass="bg-teal-600/20 text-teal-500" 
            iconBgClass="bg-teal-50" 
            iconTextClass="text-teal-600" 
        />
        
        <Card 
            darkMode={darkMode} 
            title="Stock Available" 
            value={stats.stockCount + " Items"} 
            subtext={`Val: ${formatCurrency(stats.stockValue)}`}
            icon={Package} 
            colorClass="bg-purple-600/20 text-purple-500" 
            iconBgClass="bg-purple-50" 
            iconTextClass="text-purple-600" 
        />
      </div>

      <div className={`p-4 sm:p-6 rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
        <h3 className={`font-bold mb-4 sm:mb-6 text-lg tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Sales</h3>
        <div className="space-y-2">
            {sales.slice(0,5).map(s => (
              <div key={s.id} className={`flex justify-between items-center p-3 sm:p-4 rounded-xl transition-all duration-200 ${darkMode?'bg-slate-700/30 hover:bg-slate-700/50':'bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100'}`}>
                <div>
                    <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.customerName}</p>
                    <p className="text-xs opacity-50 font-mono">{s.suitId}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-emerald-500 text-sm">+{formatCurrency(s.salePrice)}</p>
                    <p className="text-[10px] opacity-50">Profit: {formatCurrency(s.profit - s.mamaShare)}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}