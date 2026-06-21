import React, { useState, useMemo } from 'react';
import { collection, doc, updateDoc, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Users, X, Receipt, ShoppingBag, RefreshCcw, Undo2 } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, handleNumberInput } from '../utils/helpers';

const elevated = '#222E3C';
const surface  = '#1C2530';
const border   = '#2E3A47';
const subtle   = '#243040';
const primary  = '#F0F4F8';
const muted    = '#8D9BAA';
const faint    = '#5E7080';

const inputCls = {
  background: surface,
  border: `1px solid ${border}`,
  borderRadius: 8,
  color: primary,
  outline: 'none',
  padding: '9px 12px',
  fontSize: 14,
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};
const fi = e => { e.target.style.borderColor = '#F5A623'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15)'; };
const fo = e => { e.target.style.borderColor = border;    e.target.style.boxShadow = 'none'; };

export default function CustomerDetailModal({ activeCustomer, onClose, user, payments, sales, showToast }) {
  const [customerModalTab, setCustomerModalTab] = useState('payments');
  const [modalAmount, setModalAmount] = useState('');

  const customerHistory = useMemo(() => {
    if (!activeCustomer) return [];
    return payments.filter(p => p.customerId === activeCustomer.id).sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
  }, [payments, activeCustomer]);

  const customerPurchases = useMemo(() => {
    if (!activeCustomer) return [];
    return sales.filter(s => s.customerId === activeCustomer.id).sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
  }, [sales, activeCustomer]);

  const handleModalPayment = async () => {
    if (!activeCustomer || !modalAmount || Number(modalAmount) <= 0) return;
    const amt = Number(modalAmount);
    const pending = (activeCustomer.totalBill || 0) - (activeCustomer.totalPaid || 0);
    if (amt > pending) { showToast(`Max payment: Rs ${pending}`, 'error'); return; }
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, activeCustomer.id), { totalPaid: (activeCustomer.totalPaid || 0) + amt, lastPaymentDate: serverTimestamp() });
      await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), { customerId: activeCustomer.id, amount: amt, date: serverTimestamp(), type: 'Payment' });
      setModalAmount('');
      showToast('Payment Recorded!');
    } catch { showToast('Error adding payment', 'error'); }
  };

  const handleModalRefund = async () => {
    if (!activeCustomer || !modalAmount || Number(modalAmount) <= 0) return;
    const amt = Number(modalAmount);
    if (amt > (activeCustomer.totalPaid || 0)) { showToast('Cannot refund more than paid!', 'error'); return; }
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, activeCustomer.id), { totalPaid: Math.max(0, (activeCustomer.totalPaid || 0) - amt) });
      await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), { customerId: activeCustomer.id, amount: amt, date: serverTimestamp(), type: 'Refund' });
      setModalAmount('');
      showToast('Refund Processed!');
    } catch { showToast('Error processing refund', 'error'); }
  };

  const handleReturnItem = async (saleItem) => {
    if (!confirm('Are you sure you want to return this item?')) return;
    try {
      await runTransaction(db, async (t) => {
        const base = `artifacts/${appId}/users/${user.uid}`;
        const custRef = doc(db, `${base}/customers`, saleItem.customerId);
        const custSnap = await t.get(custRef);
        if (!custSnap.exists()) throw new Error('Customer not found!');
        t.update(doc(db, `${base}/inventory`, saleItem.dressDocId), { qty: 1 });
        t.update(custRef, { totalBill: Math.max(0, (custSnap.data().totalBill || 0) - saleItem.salePrice), lastUpdated: serverTimestamp() });
        t.delete(doc(db, `${base}/sales`, saleItem.id));
      });
      showToast('Item Returned & Stock Restored');
    } catch { showToast('Return Failed', 'error'); }
  };

  const tabs = [
    { id: 'payments',  icon: Receipt,     label: 'Payments',  activeColor: '#F5A623', activeBg: 'rgba(245,166,35,0.12)', activeBorder: 'rgba(245,166,35,0.3)' },
    { id: 'purchases', icon: ShoppingBag, label: 'Purchases', activeColor: '#60A5FA', activeBg: 'rgba(96,165,250,0.12)',  activeBorder: 'rgba(96,165,250,0.3)' },
  ];

  const balance = (activeCustomer.totalBill || 0) - (activeCustomer.totalPaid || 0);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-fade-in overflow-hidden" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-modal" style={{ background: elevated, border: `0.5px solid ${border}` }}>

        {/* Header */}
        <div className="flex justify-between items-start p-5 shrink-0" style={{ borderBottom: `0.5px solid ${border}` }}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: primary }}>
              <Users size={18} style={{ color: '#F5A623' }}/>{activeCustomer.name}
            </h2>
            <p className="text-xs mt-0.5 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Customer Account History</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: faint }}
            onMouseEnter={e => e.currentTarget.style.color = primary}
            onMouseLeave={e => e.currentTarget.style.color = faint}
          ><X size={20}/></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total Bill', value: formatCurrency(activeCustomer.totalBill),  color: '#60A5FA' },
              { label: 'Paid',       value: formatCurrency(activeCustomer.totalPaid),   color: '#4ADE80' },
              { label: 'Balance',    value: formatCurrency(balance),                    color: balance > 0 ? '#FC6B6B' : '#4ADE80' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: surface, border: `0.5px solid ${border}` }}>
                <p className="uppercase font-semibold mb-1" style={{ fontSize: 10, letterSpacing: '0.06em', color: faint }}>{s.label}</p>
                <p className="font-bold text-sm leading-tight" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="p-4 rounded-lg" style={{ background: surface, border: `0.5px solid ${border}` }}>
            <label className="block mb-2 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Quick Actions</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                inputMode="numeric" type="number" min="0" onKeyDown={handleNumberInput}
                style={{ ...inputCls, flex: 1 }}
                placeholder="Amount"
                value={modalAmount}
                onChange={e => setModalAmount(e.target.value)}
                onFocus={fi} onBlur={fo}
              />
              <div className="flex gap-2">
                <button onClick={handleModalPayment}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95"
                  style={{ background: '#F5A623', color: '#0F1520' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#E09410'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F5A623'}
                >Pay</button>
                <button onClick={handleModalRefund}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95"
                  style={{ background: 'transparent', color: '#FC6B6B', border: '1px solid rgba(252,107,107,0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,107,107,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >Refund</button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map(tab => {
              const active = customerModalTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setCustomerModalTab(tab.id)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 uppercase transition-all"
                  style={active
                    ? { background: tab.activeBg, color: tab.activeColor, border: `0.5px solid ${tab.activeBorder}` }
                    : { background: surface, color: muted, border: `0.5px solid ${border}` }}
                >
                  <tab.icon size={13}/>{tab.label}
                </button>
              );
            })}
          </div>

          {/* History list */}
          <div className="space-y-2">
            {customerModalTab === 'payments' ? (
              customerHistory.length > 0 ? customerHistory.map(rec => (
                <div key={rec.id} className="flex justify-between items-center p-3 rounded-lg transition-colors duration-150" style={{ background: surface, border: `0.5px solid ${border}` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#4A5E72'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = border}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full" style={{ background: rec.type === 'Refund' ? 'rgba(252,107,107,0.1)' : 'rgba(74,222,128,0.1)', color: rec.type === 'Refund' ? '#FC6B6B' : '#4ADE80' }}>
                      {rec.type === 'Refund' ? <RefreshCcw size={14}/> : <Receipt size={14}/>}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: primary }}>{rec.type || 'Payment'}</p>
                      <p className="text-xs" style={{ color: faint }}>{rec.date ? new Date(rec.date.seconds * 1000).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: rec.type === 'Refund' ? '#FC6B6B' : '#4ADE80' }}>
                    {rec.type === 'Refund' ? '-' : '+'}{formatCurrency(rec.amount)}
                  </span>
                </div>
              )) : (
                <div className="text-center py-8 text-sm rounded-lg" style={{ color: faint, border: `0.5px dashed ${border}` }}>No payment history</div>
              )
            ) : (
              customerPurchases.length > 0 ? customerPurchases.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-lg transition-colors duration-150" style={{ background: surface, border: `0.5px solid ${border}` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#4A5E72'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = border}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full" style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }}>
                      <ShoppingBag size={14}/>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate" style={{ color: primary }}>{item.suitId} <span className="font-normal text-xs" style={{ color: faint }}>({item.brand})</span></p>
                      <p className="text-xs" style={{ color: faint }}>{item.date ? new Date(item.date.seconds * 1000).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: '#60A5FA' }}>{formatCurrency(item.salePrice)}</span>
                    <button onClick={e => { e.stopPropagation(); handleReturnItem(item); }} title="Return Item"
                      className="p-1.5 rounded-full transition-colors" style={{ color: '#FC6B6B' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,107,107,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    ><Undo2 size={14}/></button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-sm rounded-lg" style={{ color: faint, border: `0.5px dashed ${border}` }}>No purchases found</div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}