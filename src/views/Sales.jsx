import React, { useState, useMemo } from 'react';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Search, MinusCircle } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, handleNumberInput, playSound } from '../utils/helpers';

export default function Sales({ inventory, customers, user, showToast, darkMode }) {
  const [cart, setCart] = useState([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [saleForm, setSaleForm] = useState({ customerName: '', paidAmount: '' });
  const [showSaleCustomerSuggestions, setShowSaleCustomerSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableItems = useMemo(() => {
    if (!itemSearchQuery) return [];
    const lowerQuery = itemSearchQuery.toLowerCase();
    return inventory.filter(i => i.qty > 0 && !cart.some(c => c.id === i.id) && (i.suitId.toLowerCase().includes(lowerQuery) || i.brand.toLowerCase().includes(lowerQuery)))
      .sort((a, b) => a.suitId.localeCompare(b.suitId, undefined, { numeric: true, sensitivity: 'base' })).slice(0, 5);
  }, [inventory, itemSearchQuery, cart]);

  const saleCustomerMatches = useMemo(() => {
    if (!saleForm.customerName) return [];
    const lower = saleForm.customerName.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(lower) && c.status !== 'deleted').slice(0, 5);
  }, [customers, saleForm.customerName]);

  const addToCart = (item) => { setCart([...cart, item]); setItemSearchQuery(''); playSound('pop'); };
  const removeFromCart = (id) => { setCart(cart.filter(c => c.id !== id)); playSound('delete'); };

  const handleProcessSale = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    if (cart.length === 0) { showToast("Cart is empty!", 'error'); return; }
    if (!saleForm.customerName.trim()) { showToast("Customer name required", 'error'); return; }
    
    setIsSubmitting(true);
    try {
      await runTransaction(db, async (t) => {
        const userRef = `artifacts/${appId}/users/${user.uid}`;
        const itemsToSell = [];
        for (const cartItem of cart) {
           const itemRef = doc(db, `${userRef}/inventory/${cartItem.id}`);
           const itemSnap = await t.get(itemRef);
           if (!itemSnap.exists() || itemSnap.data().qty < 1) throw new Error(`Item ${cartItem.suitId} is no longer available!`);
           itemsToSell.push({ ref: itemRef, data: itemSnap.data(), id: cartItem.id });
        }
        let custRef, existing = customers.find(c => c.name.toLowerCase().trim() === saleForm.customerName.trim().toLowerCase() && c.status !== 'deleted'); 
        if (existing) custRef = doc(db, `${userRef}/customers/${existing.id}`);
        else custRef = doc(collection(db, `${userRef}/customers`));
        const custSnap = await t.get(custRef);
        const totalSale = itemsToSell.reduce((s, i) => s + i.data.salePrice, 0);
        const paid = Number(saleForm.paidAmount) || 0;
        let updateData = { 
            totalBill: (custSnap.exists() ? (custSnap.data().totalBill || 0) : 0) + totalSale, 
            totalPaid: (custSnap.exists() ? (custSnap.data().totalPaid || 0) : 0) + paid, 
            lastUpdated: serverTimestamp(),
            status: 'active'
        };
        if (paid > 0) { updateData.lastPaymentDate = serverTimestamp(); }
        if (custSnap.exists()) t.update(custRef, updateData);
        else t.set(custRef, { name: saleForm.customerName, ...updateData, joinedAt: serverTimestamp() });
        if (paid > 0) {
            const paymentRef = doc(collection(db, `${userRef}/payments`));
            t.set(paymentRef, { customerId: custRef.id, amount: paid, date: serverTimestamp(), type: 'Sale Initial' });
        }
        for (const item of itemsToSell) {
          t.update(item.ref, { qty: 0 });
          const profit = item.data.salePrice - item.data.orgPrice;
          t.set(doc(collection(db, `${userRef}/sales`)), {
            customerId: custRef.id, customerName: saleForm.customerName, suitId: item.data.suitId, dressDocId: item.id, brand: item.data.brand,
            orgPrice: item.data.orgPrice, salePrice: item.data.salePrice, profit, mamaShare: Math.max(0, Math.round(profit*0.2)), mamaPaid: false, date: serverTimestamp()
          });
        }
      });
      setCart([]); setSaleForm({ customerName: '', paidAmount: '' }); showToast(`Sold ${cart.length} items successfully!`); playSound('success');
    } catch (err) { showToast(err.message, 'error'); playSound('error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
       <div className={`p-6 sm:p-8 rounded-3xl shadow-xl border ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/60'}`}>
          <h2 className={`text-xl font-black text-center mb-8 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>POS TERMINAL</h2>
          <div className="relative mb-8">
             <label className="text-xs font-bold opacity-50 block mb-2 uppercase tracking-wider">Search Product</label>
             <div className={`flex items-center p-3 sm:p-4 border rounded-2xl transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode?'border-slate-600 bg-slate-900':'border-slate-200 bg-white'}`}>
                <Search size={20} className="opacity-50 mr-3"/>
                <input autoFocus className="bg-transparent outline-none flex-1 font-medium text-sm sm:text-base" placeholder="Type ID (e.g. A1)..." value={itemSearchQuery} onChange={e => setItemSearchQuery(e.target.value)}/>
             </div>
             {availableItems.length > 0 && (
               <div className={`absolute w-full mt-2 rounded-2xl border shadow-2xl z-20 overflow-hidden ${darkMode?'bg-slate-800 border-slate-600':'bg-white border-slate-100'}`}>
                  {availableItems.map(item => (
                    <div key={item.id} onClick={() => addToCart(item)} className={`p-4 flex justify-between items-center cursor-pointer hover:bg-blue-500 hover:text-white transition-colors border-b last:border-0 ${darkMode?'border-slate-700':'border-slate-50'}`}>
                       <span className="font-bold font-mono">{item.suitId}</span><span className="text-sm opacity-90">{item.brand}</span><span className="text-sm font-bold">{formatCurrency(item.salePrice)}</span>
                    </div>
                  ))}
               </div>
             )}
          </div>
          <div className={`mb-8 rounded-2xl border overflow-hidden ${darkMode?'border-slate-700 bg-slate-900/30':'border-slate-200 bg-gray-50'}`}>
             <div className={`p-4 border-b text-xs font-bold uppercase flex justify-between ${darkMode ? 'bg-black/20 text-slate-400 border-slate-700' : 'bg-gray-100 text-gray-500 border-gray-200'}`}><span>Items ({cart.length})</span><span>Total</span></div>
             {cart.length === 0 ? <div className="p-8 text-center opacity-40 text-sm font-medium">Cart is empty</div> : <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                  {cart.map(item => (
                    <div key={item.id} className="p-3 sm:p-4 flex justify-between items-center animate-slide-in">
                       <div><p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.suitId}</p><p className="text-[10px] sm:text-xs opacity-60">{item.brand}</p></div>
                       <div className="flex items-center gap-3"><span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.salePrice)}</span><button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-full transition-colors"><MinusCircle size={18}/></button></div>
                    </div>
                  ))}
             </div>}
             <div className={`p-4 sm:p-5 border-t flex justify-between items-center font-black text-lg sm:text-xl ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200'}`}><span className={darkMode ? 'text-white' : 'text-gray-900'}>Total Bill</span><span className="text-emerald-500">{formatCurrency(cart.reduce((s,i)=>s+i.salePrice,0))}</span></div>
          </div>
          <div className="space-y-5">
             <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">Customer Name</label><div className="relative">
                <input type="text" required className={`w-full p-4 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-white'}`} placeholder="Type name..." value={saleForm.customerName} onChange={(e) => { setSaleForm({...saleForm, customerName: e.target.value}); setShowSaleCustomerSuggestions(true); }} onFocus={() => setShowSaleCustomerSuggestions(true)} onBlur={() => setTimeout(() => setShowSaleCustomerSuggestions(false), 200)}/>
                {showSaleCustomerSuggestions && saleForm.customerName && saleCustomerMatches.length > 0 && (<div className={`absolute top-full left-0 w-full mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>{saleCustomerMatches.map(c => (<div key={c.id} onMouseDown={() => { setSaleForm({...saleForm, customerName: c.name}); setShowSaleCustomerSuggestions(false); }} className={`p-3 text-sm cursor-pointer hover:bg-blue-500 hover:text-white transition-colors ${darkMode ? 'border-slate-700' : 'border-slate-100'} border-b last:border-0`}>{c.name}</div>))}</div>)}
             </div></div>
             <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">Paid Amount</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-4 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-white'}`} value={saleForm.paidAmount} onChange={e=>setSaleForm({...saleForm, paidAmount:e.target.value})}/></div>
             <button onClick={handleProcessSale} disabled={isSubmitting || cart.length===0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">CONFIRM SALE</button>
          </div>
       </div>
    </div>
  );
}