import React, { useState, useMemo } from 'react';
import { collection, doc, updateDoc, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Wallet, Archive, Users, Receipt, ShoppingBag, Search } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, handleNumberInput } from '../utils/helpers';
import { ConfirmationModal } from '../components/ui/UIComponents';

const surface  = '#1C2530';
const elevated = '#222E3C';
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
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};
const fi  = e => { e.target.style.borderColor = '#F5A623'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15)'; };
const fo  = e => { e.target.style.borderColor = border;    e.target.style.boxShadow = 'none'; };

export default function Customers({ customers, payments, sales, user, showToast, setViewingCustomer, setCustomerModalTab }) {
  const [paymentCustomerSearch, setPaymentCustomerSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ customerId: '', amount: '' });
  const [customerSearch, setCustomerSearch] = useState('');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null, extraData: null });

  const paymentCustomerMatches = useMemo(() => {
    if (!paymentCustomerSearch) return [];
    const q = paymentCustomerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) && c.status !== 'deleted').slice(0, 5);
  }, [customers, paymentCustomerSearch]);

  const selectPaymentCustomer = (c) => {
    setPaymentForm({ ...paymentForm, customerId: c.id });
    setPaymentCustomerSearch(c.name);
    setCustomerSearch(c.name);
    setShowCustomerSuggestions(false);
    setViewingCustomer(c);
    setCustomerModalTab('payments');
  };

  const filteredCust = useMemo(() => {
    return customers
      .filter(c => c.status !== 'deleted' && (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()))
      .sort((a, b) => {
        const balA = (a.totalBill || 0) - (a.totalPaid || 0);
        const balB = (b.totalBill || 0) - (b.totalPaid || 0);
        if ((balA <= 0) !== (balB <= 0)) return balA <= 0 ? 1 : -1;
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      });
  }, [customers, customerSearch]);

  const handleAddPayment = async () => {
    const cust = customers.find(c => c.id === paymentForm.customerId);
    if (!cust) { showToast('Select a valid customer', 'error'); return; }
    const pending = (cust.totalBill || 0) - (cust.totalPaid || 0);
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) { showToast('Amount must be positive', 'error'); return; }
    if (amt > pending) { showToast(`Max payment: Rs ${pending}`, 'error'); return; }
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, paymentForm.customerId), { totalPaid: (cust.totalPaid || 0) + amt, lastPaymentDate: serverTimestamp() });
      await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), { customerId: paymentForm.customerId, amount: amt, date: serverTimestamp(), type: 'Payment' });
      setPaymentForm({ customerId: '', amount: '' });
      setPaymentCustomerSearch('');
      showToast('Payment Recorded!');
    } catch { showToast('Error adding payment', 'error'); }
  };

  const confirmAction = async () => {
    try {
      if (modalConfig.type === 'DELETE') {
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, modalConfig.id), { status: 'deleted' });
        showToast('Customer Removed');
      } else if (modalConfig.type === 'RETURN_ITEM') {
        const s = modalConfig.extraData;
        await runTransaction(db, async (t) => {
          const base = `artifacts/${appId}/users/${user.uid}`;
          const custRef = doc(db, `${base}/customers`, s.customerId);
          const custSnap = await t.get(custRef);
          if (!custSnap.exists()) throw new Error('Customer not found!');
          const newBill = Math.max(0, (custSnap.data().totalBill || 0) - s.salePrice);
          t.update(doc(db, `${base}/inventory`, s.dressDocId), { qty: 1 });
          t.update(custRef, { totalBill: newBill, lastUpdated: serverTimestamp() });
          t.delete(doc(db, `${base}/sales`, s.id));
        });
        showToast('Item Returned & Stock Restored');
      }
    } catch (e) { showToast('Action Failed', 'error'); }
    setModalConfig({ isOpen: false, type: null, id: null, extraData: null });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden gap-4 pb-20">
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmAction}
        title={modalConfig.type === 'DELETE' ? 'Remove Customer?' : 'Return Item?'}
        message={modalConfig.type === 'DELETE' ? 'Customer will be moved to Deleted Customers.' : 'Item will be added back to stock and bill reduced.'}
        isDanger
      />

      {/* Quick Payment Bar */}
      <div className="shrink-0 p-4 rounded-card" style={{ background: surface, border: `0.5px solid ${border}` }}>
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: primary }}>
          <Wallet size={16} style={{ color: '#F5A623' }}/> Quick Payment
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              style={inputCls}
              placeholder="Search customer..."
              value={paymentCustomerSearch}
              onChange={e => { setPaymentCustomerSearch(e.target.value); setCustomerSearch(e.target.value); setShowCustomerSuggestions(true); setPaymentForm(p => ({ ...p, customerId: '' })); }}
              onFocus={() => setShowCustomerSuggestions(true)}
              onBlur={e => { fo(e); setTimeout(() => setShowCustomerSuggestions(false), 200); }}
              onFocusCapture={fi}
            />
            {showCustomerSuggestions && paymentCustomerMatches.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 rounded-lg overflow-hidden z-50" style={{ background: elevated, border: `0.5px solid ${border}` }}>
                {paymentCustomerMatches.map((c, idx) => (
                  <div key={c.id} onMouseDown={() => selectPaymentCustomer(c)}
                    className="px-4 py-2.5 text-sm cursor-pointer transition-colors"
                    style={{ borderBottom: idx < paymentCustomerMatches.length - 1 ? `0.5px solid ${subtle}` : 'none', color: primary }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >{c.name}</div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              inputMode="numeric" type="number" onKeyDown={handleNumberInput}
              style={{ ...inputCls, width: '120px' }}
              placeholder="Amount"
              value={paymentForm.amount}
              onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              onFocus={fi} onBlur={fo}
            />
            <button onClick={handleAddPayment} className="px-4 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95" style={{ background: '#F5A623', color: '#0F1520' }}
              onMouseEnter={e => e.currentTarget.style.background = '#E09410'}
              onMouseLeave={e => e.currentTarget.style.background = '#F5A623'}
            >Add</button>
          </div>
        </div>
      </div>

      {/* Search customers */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: surface, border: `0.5px solid ${border}` }}>
        <Search size={16} style={{ color: faint }}/>
        <input
          className="bg-transparent outline-none flex-1 font-medium"
          style={{ color: primary, fontSize: 14 }}
          placeholder="Filter customers..."
          value={customerSearch}
          onChange={e => setCustomerSearch(e.target.value)}
        />
      </div>

      {/* Customer grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {filteredCust.map(c => {
            const bal = (c.totalBill || 0) - (c.totalPaid || 0);
            const cleared = bal <= 0;
            return (
              <div
                key={c.id}
                className="relative p-3 sm:p-4 rounded-card h-fit cursor-pointer transition-all duration-150"
                style={{ background: surface, border: `0.5px solid ${border}` }}
                onClick={() => { setViewingCustomer(c); setCustomerModalTab('payments'); }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cleared ? '#4A5E72' : 'rgba(252,107,107,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; }}
              >
                <h4 className="font-semibold text-sm truncate mb-2" style={{ color: primary }}>{c.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: '0.5px solid rgba(96,165,250,0.25)' }}>
                  Total: {formatCurrency(c.totalBill || 0)}
                </span>
                <div className="mt-2.5 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span style={{ color: faint }}>Remaining:</span>
                    <b style={{ color: bal > 0 ? '#FC6B6B' : '#5E7080' }}>{formatCurrency(bal)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: faint }}>Paid:</span>
                    <b style={{ color: '#4ADE80' }}>{formatCurrency(c.totalPaid || 0)}</b>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <button className="flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all"
                    style={{ background: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '0.5px solid rgba(245,166,35,0.25)' }}
                  >View Details</button>
                  {cleared && (
                    <button
                      onClick={e => { e.stopPropagation(); setModalConfig({ isOpen: true, type: 'DELETE', id: c.id }); }}
                      className="flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all"
                      style={{ background: 'rgba(252,107,107,0.08)', color: '#FC6B6B', border: '0.5px solid rgba(252,107,107,0.25)' }}
                    >Remove</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}