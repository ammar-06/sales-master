import React, { useState, useMemo } from 'react';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { AlertTriangle, History } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency } from '../utils/helpers';

const surface  = '#1C2530';
const elevated = '#222E3C';
const border   = '#2E3A47';
const subtle   = '#243040';
const primary  = '#F0F4F8';
const muted    = '#8D9BAA';
const faint    = '#5E7080';

function StatCard({ label, value, color }) {
  return (
    <div className="p-4 text-center rounded-card" style={{ background: surface, border: `0.5px solid ${border}` }}>
      <p className="uppercase font-semibold mb-1" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

export default function PartnerShare({ sales, stats, user, showToast }) {
  const [mamaTab, setMamaTab] = useState('pending');
  const [selectedMamaSales, setSelectedMamaSales] = useState([]);

  const sortedPending = useMemo(() => sales.filter(s => !s.mamaPaid).sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true })), [sales]);
  const sortedPaid    = useMemo(() => sales.filter(s =>  s.mamaPaid).sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true })), [sales]);

  const handleMarkPaid = async (status) => {
    try {
      const batch = writeBatch(db);
      selectedMamaSales.forEach(id => batch.update(doc(db, `artifacts/${appId}/users/${user.uid}/sales`, id), { mamaPaid: status, mamaPaidAt: status ? serverTimestamp() : null }));
      await batch.commit();
      setSelectedMamaSales([]);
      showToast('Payment Status Updated!');
    } catch { showToast('Error updating status', 'error'); }
  };

  const toggle = (id) => setSelectedMamaSales(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const pendingAll = sales.filter(s => !s.mamaPaid);
  const allSelected = pendingAll.length > 0 && pendingAll.every(s => selectedMamaSales.includes(s.id));

  const activeList = mamaTab === 'pending' ? sortedPending : sortedPaid;

  return (
    <div className="space-y-4 pb-20">

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total"   value={formatCurrency(stats.mamaTotal)}   color="#60A5FA" />
        <StatCard label="Pending" value={formatCurrency(stats.mamaPending)} color="#FC6B6B" />
        <StatCard label="Paid"    value={formatCurrency(stats.mamaPaid)}    color="#4ADE80" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'pending', label: 'Pending', icon: AlertTriangle, activeColor: '#FC6B6B', activeBg: 'rgba(252,107,107,0.12)', activeBorder: 'rgba(252,107,107,0.3)' },
          { id: 'paid',    label: 'History', icon: History,       activeColor: '#4ADE80',  activeBg: 'rgba(74,222,128,0.1)',   activeBorder: 'rgba(74,222,128,0.3)' },
        ].map(tab => {
          const active = mamaTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setMamaTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={active
                ? { background: tab.activeBg, color: tab.activeColor, border: `0.5px solid ${tab.activeBorder}` }
                : { background: surface, color: muted, border: `0.5px solid ${border}` }}
            >
              <tab.icon size={15}/> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <div className="rounded-card overflow-hidden" style={{ background: surface, border: `0.5px solid ${border}` }}>
        <div className="flex justify-between items-center px-5 py-3.5" style={{ borderBottom: `0.5px solid ${border}` }}>
          <h3 className="font-semibold flex items-center gap-2" style={{ color: primary, fontSize: 14 }}>
            {mamaTab === 'pending' ? <AlertTriangle size={15} style={{ color: '#FC6B6B' }}/> : <History size={15} style={{ color: '#4ADE80' }}/>}
            {mamaTab === 'pending' ? 'Pending Payments' : 'Payment History'}
          </h3>
          {mamaTab === 'pending' && selectedMamaSales.length > 0 && (
            <button onClick={() => handleMarkPaid(true)}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
              style={{ background: 'rgba(252,107,107,0.12)', color: '#FC6B6B', border: '0.5px solid rgba(252,107,107,0.3)' }}
            >Mark Paid ({selectedMamaSales.length})</button>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {activeList.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: faint }}>
              {mamaTab === 'pending' ? 'No pending payments' : 'No history'}
            </p>
          ) : activeList.map((s, idx) => (
            <div key={s.id}
              onClick={() => mamaTab === 'pending' && toggle(s.id)}
              className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 cursor-pointer"
              style={{ borderBottom: idx < activeList.length - 1 ? `0.5px solid ${subtle}` : 'none', background: selectedMamaSales.includes(s.id) ? 'rgba(252,107,107,0.06)' : 'transparent' }}
            >
              {mamaTab === 'pending' && <input type="checkbox" readOnly checked={selectedMamaSales.includes(s.id)} className="w-4 h-4 accent-red-400"/>}
              <div className="flex-1">
                <p className="font-medium text-sm" style={{ color: primary }}>{s.suitId}</p>
                <p className="text-xs" style={{ color: faint }}>{s.brand}</p>
              </div>
              <span className="font-bold text-sm" style={{ color: mamaTab === 'pending' ? '#FC6B6B' : '#4ADE80' }}>{s.mamaShare}</span>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full text-sm table-fixed">
            <thead style={{ background: '#131920' }}>
              <tr className="uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>
                {mamaTab === 'pending' && (
                  <th className="p-4 w-14 text-center">
                    <input type="checkbox" checked={allSelected} onChange={() => setSelectedMamaSales(allSelected ? [] : pendingAll.map(s => s.id))} className="w-4 h-4 accent-amber-400 cursor-pointer"/>
                  </th>
                )}
                <th className="p-4 text-left">Item Details</th>
                {mamaTab === 'paid' && <th className="text-center">Paid Date</th>}
                <th className="text-right p-4 w-32">Share Amount</th>
              </tr>
            </thead>
            <tbody>
              {activeList.length === 0 ? (
                <tr><td colSpan="3" className="text-center p-12 text-sm" style={{ color: faint }}>
                  {mamaTab === 'pending' ? 'No pending payments' : 'No history'}
                </td></tr>
              ) : activeList.map((s, idx) => (
                <tr key={s.id}
                  className="cursor-pointer transition-colors duration-150"
                  style={{ borderBottom: idx < activeList.length - 1 ? `0.5px solid ${subtle}` : 'none', background: selectedMamaSales.includes(s.id) ? 'rgba(252,107,107,0.06)' : 'transparent' }}
                  onClick={() => mamaTab === 'pending' && toggle(s.id)}
                  onMouseEnter={e => { if (!selectedMamaSales.includes(s.id)) e.currentTarget.style.background = elevated; }}
                  onMouseLeave={e => { if (!selectedMamaSales.includes(s.id)) e.currentTarget.style.background = 'transparent'; }}
                >
                  {mamaTab === 'pending' && (
                    <td className="p-4 text-center">
                      <input type="checkbox" readOnly checked={selectedMamaSales.includes(s.id)} className="w-4 h-4 accent-red-400 pointer-events-none"/>
                    </td>
                  )}
                  <td className="p-4 font-medium" style={{ color: muted }}>
                    {s.suitId} <span className="text-xs font-normal ml-1" style={{ color: faint }}>({s.brand})</span>
                  </td>
                  {mamaTab === 'paid' && (
                    <td className="text-center text-xs" style={{ color: faint }}>
                      {s.mamaPaidAt ? new Date(s.mamaPaidAt.seconds * 1000).toLocaleDateString() : '—'}
                    </td>
                  )}
                  <td className="text-right p-4 font-bold" style={{ color: mamaTab === 'pending' ? '#FC6B6B' : '#4ADE80' }}>{s.mamaShare}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}