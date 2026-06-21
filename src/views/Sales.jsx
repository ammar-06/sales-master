import React, { useState, useMemo } from 'react';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Search, MinusCircle } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, handleNumberInput } from '../utils/helpers';

const surface = '#1C2530';
const border  = '#2E3A47';
const subtle  = '#243040';
const primary = '#F0F4F8';
const muted   = '#8D9BAA';
const faint   = '#5E7080';

const inputCls = {
  background: surface,
  border: `1px solid ${border}`,
  borderRadius: 8,
  color: primary,
  outline: 'none',
  width: '100%',
  padding: '11px 14px',
  fontSize: 14,
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

function focusIn(e)  { e.target.style.borderColor = '#F5A623'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15)'; }
function focusOut(e) { e.target.style.borderColor = border;   e.target.style.boxShadow = 'none'; }

export default function Sales({ inventory, customers, user, showToast }) {
  const [cart, setCart] = useState([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [saleForm, setSaleForm] = useState({ customerName: '', paidAmount: '' });
  const [showSaleCustomerSuggestions, setShowSaleCustomerSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableItems = useMemo(() => {
    if (!itemSearchQuery) return [];
    const q = itemSearchQuery.toLowerCase();
    return inventory
      .filter(i => i.qty > 0 && !cart.some(c => c.id === i.id) && (i.suitId.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q)))
      .sort((a, b) => a.suitId.localeCompare(b.suitId, undefined, { numeric: true }))
      .slice(0, 5);
  }, [inventory, itemSearchQuery, cart]);

  const saleCustomerMatches = useMemo(() => {
    if (!saleForm.customerName) return [];
    const q = saleForm.customerName.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) && c.status !== 'deleted').slice(0, 5);
  }, [customers, saleForm.customerName]);

  const addToCart    = (item) => { setCart([...cart, item]); setItemSearchQuery(''); };
  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));

  const handleProcessSale = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    if (cart.length === 0) { showToast('Cart is empty!', 'error'); return; }
    if (!saleForm.customerName.trim()) { showToast('Customer name required', 'error'); return; }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (t) => {
        const userRef = `artifacts/${appId}/users/${user.uid}`;
        const itemsToSell = [];
        for (const cartItem of cart) {
          const itemRef  = doc(db, `${userRef}/inventory/${cartItem.id}`);
          const itemSnap = await t.get(itemRef);
          if (!itemSnap.exists() || itemSnap.data().qty < 1) throw new Error(`Item ${cartItem.suitId} no longer available!`);
          itemsToSell.push({ ref: itemRef, data: itemSnap.data(), id: cartItem.id });
        }
        let custRef;
        const existing = customers.find(c => c.name.toLowerCase().trim() === saleForm.customerName.trim().toLowerCase() && c.status !== 'deleted');
        if (existing) custRef = doc(db, `${userRef}/customers/${existing.id}`);
        else custRef = doc(collection(db, `${userRef}/customers`));
        const custSnap = await t.get(custRef);
        const totalSale = itemsToSell.reduce((s, i) => s + i.data.salePrice, 0);
        const paid = Number(saleForm.paidAmount) || 0;
        const updateData = {
          totalBill: (custSnap.exists() ? custSnap.data().totalBill || 0 : 0) + totalSale,
          totalPaid: (custSnap.exists() ? custSnap.data().totalPaid || 0 : 0) + paid,
          lastUpdated: serverTimestamp(), status: 'active'
        };
        if (paid > 0) updateData.lastPaymentDate = serverTimestamp();
        if (custSnap.exists()) t.update(custRef, updateData);
        else t.set(custRef, { name: saleForm.customerName, ...updateData, joinedAt: serverTimestamp() });
        if (paid > 0) {
          const payRef = doc(collection(db, `${userRef}/payments`));
          t.set(payRef, { customerId: custRef.id, amount: paid, date: serverTimestamp(), type: 'Sale Initial' });
        }
        for (const item of itemsToSell) {
          t.update(item.ref, { qty: 0 });
          const profit = item.data.salePrice - item.data.orgPrice;
          t.set(doc(collection(db, `${userRef}/sales`)), {
            customerId: custRef.id, customerName: saleForm.customerName, suitId: item.data.suitId,
            dressDocId: item.id, brand: item.data.brand, orgPrice: item.data.orgPrice,
            salePrice: item.data.salePrice, profit, mamaShare: Math.max(0, Math.round(profit * 0.2)),
            mamaPaid: false, date: serverTimestamp()
          });
        }
      });
      setCart([]);
      setSaleForm({ customerName: '', paidAmount: '' });
      showToast(`Sold ${cart.length} item${cart.length > 1 ? 's' : ''} successfully!`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartTotal = cart.reduce((s, i) => s + i.salePrice, 0);

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="rounded-card p-6" style={{ background: surface, border: `0.5px solid ${border}` }}>

        <h2 className="text-lg font-bold text-center mb-6 tracking-wider uppercase" style={{ color: primary }}>POS Terminal</h2>

        {/* Item search */}
        <div className="relative mb-6">
          <label className="block mb-2 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Search Product</label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: '#131920', border: `1px solid ${border}` }}>
            <Search size={16} style={{ color: faint }} />
            <input
              className="flex-1 bg-transparent outline-none font-medium"
              style={{ color: primary, fontSize: 14 }}
              placeholder="Type ID or brand..."
              value={itemSearchQuery}
              onChange={e => setItemSearchQuery(e.target.value)}
            />
          </div>
          {availableItems.length > 0 && (
            <div className="absolute w-full mt-1 rounded-lg overflow-hidden z-20" style={{ background: '#222E3C', border: `0.5px solid ${border}` }}>
              {availableItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="flex justify-between items-center px-4 py-3 cursor-pointer transition-colors duration-150"
                  style={{ borderBottom: idx < availableItems.length - 1 ? `0.5px solid ${subtle}` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="font-bold font-mono text-sm" style={{ color: '#F5A623' }}>{item.suitId}</span>
                  <span className="text-sm" style={{ color: muted }}>{item.brand}</span>
                  <span className="font-bold text-sm" style={{ color: '#4ADE80' }}>{formatCurrency(item.salePrice)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="mb-6 rounded-lg overflow-hidden" style={{ border: `0.5px solid ${border}` }}>
          <div className="flex justify-between px-4 py-2.5" style={{ background: '#131920', borderBottom: `0.5px solid ${border}` }}>
            <span className="uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Items ({cart.length})</span>
            <span className="uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Total</span>
          </div>
          {cart.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: faint }}>Cart is empty</p>
          ) : (
            <div>
              {cart.map((item, idx) => (
                <div key={item.id} className="flex justify-between items-center px-4 py-3 animate-slide-in" style={{ borderBottom: idx < cart.length - 1 ? `0.5px solid ${subtle}` : 'none' }}>
                  <div>
                    <p className="font-bold text-sm" style={{ color: primary }}>{item.suitId}</p>
                    <p className="text-xs mt-0.5" style={{ color: faint }}>{item.brand}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm" style={{ color: primary }}>{formatCurrency(item.salePrice)}</span>
                    <button onClick={() => removeFromCart(item.id)} className="transition-colors" style={{ color: '#FC6B6B' }}>
                      <MinusCircle size={17}/>
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-3" style={{ borderTop: `0.5px solid ${border}`, background: '#131920' }}>
                <span className="font-bold text-sm" style={{ color: primary }}>Total Bill</span>
                <span className="font-bold text-lg" style={{ color: '#4ADE80' }}>{formatCurrency(cartTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Customer & payment */}
        <div className="space-y-4">
          <div className="relative">
            <label className="block mb-2 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Customer Name</label>
            <input
              style={inputCls}
              placeholder="Type customer name..."
              value={saleForm.customerName}
              onChange={e => { setSaleForm({ ...saleForm, customerName: e.target.value }); setShowSaleCustomerSuggestions(true); }}
              onFocus={e => { focusIn(e); setShowSaleCustomerSuggestions(true); }}
              onBlur={e => { focusOut(e); setTimeout(() => setShowSaleCustomerSuggestions(false), 200); }}
            />
            {showSaleCustomerSuggestions && saleCustomerMatches.length > 0 && (
              <div className="absolute w-full mt-1 rounded-lg overflow-hidden z-50" style={{ background: '#222E3C', border: `0.5px solid ${border}` }}>
                {saleCustomerMatches.map((c, idx) => (
                  <div key={c.id} onMouseDown={() => { setSaleForm({ ...saleForm, customerName: c.name }); setShowSaleCustomerSuggestions(false); }}
                    className="px-4 py-2.5 text-sm cursor-pointer transition-colors"
                    style={{ borderBottom: idx < saleCustomerMatches.length - 1 ? `0.5px solid ${subtle}` : 'none', color: primary }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >{c.name}</div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block mb-2 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Paid Amount (optional)</label>
            <input
              inputMode="numeric" type="number"
              onKeyDown={handleNumberInput}
              style={inputCls}
              placeholder="0"
              value={saleForm.paidAmount}
              onChange={e => setSaleForm({ ...saleForm, paidAmount: e.target.value })}
              onFocus={focusIn} onBlur={focusOut}
            />
          </div>

          <button
            onClick={handleProcessSale}
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#F5A623', color: '#0F1520' }}
            onMouseEnter={e => { if (!isSubmitting && cart.length > 0) e.currentTarget.style.background = '#E09410'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F5A623'; }}
          >
            CONFIRM SALE
          </button>
        </div>
      </div>
    </div>
  );
}