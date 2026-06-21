import React, { useState, useMemo } from 'react';
import { AlertCircle, Trophy, CheckCircle, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const surface  = '#1C2530';
const elevated = '#222E3C';
const border   = '#2E3A47';
const primary  = '#F0F4F8';
const muted    = '#8D9BAA';
const faint    = '#5E7080';

export default function Insights({ customers, setViewingCustomer, setCustomerModalTab }) {
  const [insightView, setInsightView] = useState(null);

  const riskCustomers = useMemo(() => {
    const now = new Date();
    return customers.filter(c => {
      if (c.status === 'deleted') return false;
      const bal = (c.totalBill || 0) - (c.totalPaid || 0);
      if (bal <= 0) return false;
      const lastActivity = c.lastPaymentDate || c.lastUpdated || c.joinedAt;
      if (!lastActivity) return false;
      const diffDays = Math.ceil(Math.abs(now - new Date(lastActivity.seconds * 1000)) / (1000 * 60 * 60 * 24));
      return diffDays > 30;
    });
  }, [customers]);

  const highVolumeCustomers = useMemo(() =>
    customers.filter(c => c.status !== 'deleted' && ((c.totalBill || 0) - (c.totalPaid || 0)) > 10000),
    [customers]);

  const activeList  = insightView === 'risk' ? riskCustomers : highVolumeCustomers;
  const isRiskView  = insightView === 'risk';

  const insightCards = [
    {
      id: 'risk',
      icon: AlertCircle,
      iconColor: '#FC6B6B',
      iconBg: 'rgba(252,107,107,0.1)',
      hoverBorder: 'rgba(252,107,107,0.35)',
      count: riskCustomers.length,
      title: 'Payment Risk',
      desc: 'Customers with pending balance and no payment in the last 30 days.',
    },
    {
      id: 'highVol',
      icon: Trophy,
      iconColor: '#F5A623',
      iconBg: 'rgba(245,166,35,0.12)',
      hoverBorder: 'rgba(245,166,35,0.35)',
      count: highVolumeCustomers.length,
      title: 'High Debt Volume',
      desc: 'Customers with remaining balance greater than Rs 10,000.',
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden pb-20">
      <div className="p-4 sm:p-0 flex flex-col h-full">

        {/* Landing cards */}
        {!insightView && (
          <>
            <h2 className="text-xl font-bold mb-5" style={{ color: primary }}>Business Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              {insightCards.map(card => (
                <div
                  key={card.id}
                  onClick={() => setInsightView(card.id)}
                  className="p-6 rounded-card cursor-pointer transition-all duration-150"
                  style={{ background: surface, border: `0.5px solid ${border}` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = card.hoverBorder}
                  onMouseLeave={e => e.currentTarget.style.borderColor = border}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="p-3 rounded-xl" style={{ background: card.iconBg, color: card.iconColor }}>
                      <card.icon size={22}/>
                    </div>
                    <span className="text-4xl font-black" style={{ color: primary }}>{card.count}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: primary }}>{card.title}</h3>
                  <p className="text-sm" style={{ color: faint }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Detail view */}
        {insightView && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0 mb-4">
              <button
                onClick={() => setInsightView(null)}
                className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{ background: surface, color: muted, border: `0.5px solid ${border}` }}
                onMouseEnter={e => { e.currentTarget.style.color = primary; e.currentTarget.style.borderColor = '#4A5E72'; }}
                onMouseLeave={e => { e.currentTarget.style.color = muted;   e.currentTarget.style.borderColor = border; }}
              >
                <ArrowLeft size={15}/> Back to Insights
              </button>
              <h3 className="font-bold text-xl flex items-center gap-2" style={{ color: primary }}>
                {isRiskView
                  ? <AlertCircle size={20} style={{ color: '#FC6B6B' }}/>
                  : <Trophy size={20} style={{ color: '#F5A623' }}/>}
                {isRiskView ? 'Payment Risk List' : 'High Debt Customers'}
              </h3>
              <p className="text-sm mt-1" style={{ color: faint }}>
                {isRiskView ? "Customers who owe money and haven't paid in 30+ days." : 'Customers with pending balance exceeding Rs 10,000.'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
              {activeList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <div className="p-6 rounded-full mb-4" style={{ background: surface }}>
                    <CheckCircle size={56} style={{ color: isRiskView ? '#4ADE80' : '#60A5FA' }}/>
                  </div>
                  <h4 className="text-xl font-bold mb-1" style={{ color: primary }}>{isRiskView ? 'No Risk Customers' : 'No High Debt'}</h4>
                  <p className="text-sm" style={{ color: faint }}>{isRiskView ? 'Everyone has paid recently or has no due balance.' : 'No customer currently exceeds the high debt limit.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeList.map(c => {
                    const lastActivity = c.lastPaymentDate || c.lastUpdated || c.joinedAt;
                    const balance = (c.totalBill || 0) - (c.totalPaid || 0);
                    return (
                      <div
                        key={c.id}
                        onClick={() => { setViewingCustomer(c); setCustomerModalTab('payments'); }}
                        className="p-4 rounded-card cursor-pointer transition-all duration-150"
                        style={{ background: surface, border: `0.5px solid ${border}` }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#4A5E72'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = border}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <p className="font-bold text-base truncate pr-2" style={{ color: primary }}>{c.name}</p>
                          <span className="font-bold text-sm whitespace-nowrap" style={{ color: isRiskView ? '#FC6B6B' : '#F5A623' }}>{formatCurrency(balance)}</span>
                        </div>
                        <div className="space-y-1 mb-3 text-xs" style={{ color: faint }}>
                          <div className="flex justify-between"><span>Total Bill:</span><span>{formatCurrency(c.totalBill)}</span></div>
                          <div className="flex justify-between"><span>Last Active:</span><span>{lastActivity ? new Date(lastActivity.seconds * 1000).toLocaleDateString() : 'N/A'}</span></div>
                        </div>
                        <button className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: elevated, color: muted, border: `0.5px solid ${border}` }}
                        >View Details</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}