import React from 'react';
import { Layers, TrendingUp, CreditCard, Wallet, Package, Users } from 'lucide-react';
import { Card } from '../components/ui/UIComponents';
import { formatCurrency } from '../utils/helpers';

export default function Dashboard({ stats, sales }) {
  return (
    <div className="space-y-5 pb-20">

      {/* Row 1 — 5 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card title="Capital"         value={formatCurrency(stats.capital)}       subtext="Total Investment"  icon={Layers}     />
        <Card title="Net Profit"      value={formatCurrency(stats.profit)}        subtext="After Partner Share" icon={TrendingUp} />
        <Card title="Pending"         value={formatCurrency(stats.receivable)}    subtext="Customer Debt"     icon={CreditCard} />
        <Card title="Received"        value={formatCurrency(stats.received)}      subtext="Cash Collected"    icon={Wallet}     />
        <Card title="Stock Available" value={`${stats.stockCount} Items`}         subtext={`Val: ${formatCurrency(stats.stockValue)}`} icon={Package} isAmber />
      </div>

      {/* Row 2 — Partner Share card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card
          title="Partner Share Given"
          value={formatCurrency(stats.mamaTotal)}
          subtext={`Paid: ${formatCurrency(stats.mamaPaid)}  ·  Due: ${formatCurrency(stats.mamaPending)}`}
          icon={Users}
        />
      </div>

      {/* Recent Sales */}
      <div className="rounded-card" style={{ background: '#1C2530', border: '0.5px solid #2E3A47' }}>
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #2E3A47' }}>
          <h3 className="font-semibold text-base" style={{ color: '#F0F4F8' }}>Recent Sales</h3>
        </div>
        <div>
          {sales.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: '#5E7080' }}>No sales yet</p>
          ) : (
            sales.slice(0, 5).map((s, idx) => (
              <div
                key={s.id}
                className="flex justify-between items-center px-5 py-3.5 transition-colors duration-150"
                style={{ borderBottom: idx < 4 ? '0.5px solid #243040' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#222E3C'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p className="font-medium text-sm" style={{ color: '#F0F4F8' }}>{s.customerName}</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: '#5E7080' }}>{s.suitId}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: '#4ADE80' }}>+{formatCurrency(s.salePrice)}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8D9BAA' }}>Profit: {formatCurrency(s.profit - s.mamaShare)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}