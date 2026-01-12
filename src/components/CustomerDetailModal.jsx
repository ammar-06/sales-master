import React, { useState, useMemo } from 'react';
// FIXED: Added 'collection' to the imports below
import { collection, doc, updateDoc, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Users, X, Receipt, ShoppingBag, Wallet, RefreshCcw, Undo2 } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, handleNumberInput, playSound } from '../utils/helpers';

export default function CustomerDetailModal({ activeCustomer, onClose, darkMode, user, payments, sales, showToast }) {
  const [customerModalTab, setCustomerModalTab] = useState('payments');
  const [modalAmount, setModalAmount] = useState('');

  // Sort history newest first
  const customerHistory = useMemo(() => {
      if (!activeCustomer) return [];
      return payments.filter(p => p.customerId === activeCustomer.id).sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
  }, [payments, activeCustomer]);

  const customerPurchases = useMemo(() => {
      if (!activeCustomer) return [];
      return sales.filter(s => s.customerId === activeCustomer.id).sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
  }, [sales, activeCustomer]);

  const handleModalPayment = async () => {
    if (!activeCustomer || !modalAmount || Number(modalAmount) <= 0) return;
    const amountToAdd = Number(modalAmount);
    const currentPaid = activeCustomer.totalPaid || 0;
    const pending = (activeCustomer.totalBill || 0) - currentPaid;

    if (amountToAdd > pending) { showToast(`Max payment allowed: Rs ${pending}`, 'error'); return; }

    try {
      // 1. Update Customer Balance
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, activeCustomer.id), {
        totalPaid: currentPaid + amountToAdd, 
        lastPaymentDate: serverTimestamp()
      });
      
      // 2. Add Payment Record (Yeh pehle fail ho raha tha kyunki 'collection' missing tha)
      await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), {
          customerId: activeCustomer.id,
          amount: amountToAdd,
          date: serverTimestamp(),
          type: 'Payment'
      });
      
      setModalAmount('');
      showToast("Payment Recorded!"); 
      playSound('success');
    } catch (err) { 
        console.error(err);
        showToast("Error adding payment", 'error'); 
    }
  };

  const handleModalRefund = async () => {
    if (!activeCustomer || !modalAmount || Number(modalAmount) <= 0) return;
    const amountToRefund = Number(modalAmount);
    const currentPaid = activeCustomer.totalPaid || 0;
    
    if (amountToRefund > currentPaid) { showToast("Cannot refund more than paid amount!", 'error'); return; }
    
    try {
      const newPaid = Math.max(0, currentPaid - amountToRefund);
      
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, activeCustomer.id), { totalPaid: newPaid });
      
      await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), {
          customerId: activeCustomer.id,
          amount: amountToRefund,
          date: serverTimestamp(),
          type: 'Refund'
      });
      
      setModalAmount('');
      showToast("Refund Processed!"); 
      playSound('delete');
    } catch (err) { showToast("Error processing refund", 'error'); }
  };

  const handleReturnItem = async (saleItem) => {
     if(!confirm("Are you sure you want to return this item?")) return;
     try {
        await runTransaction(db, async (t) => {
            const userRef = `artifacts/${appId}/users/${user.uid}`;
            const saleRef = doc(db, `${userRef}/sales`, saleItem.id);
            const invRef = doc(db, `${userRef}/inventory`, saleItem.dressDocId);
            const custRef = doc(db, `${userRef}/customers`, saleItem.customerId);
            
            const custSnap = await t.get(custRef);
            if (!custSnap.exists()) throw new Error("Customer not found!");

            const currentBill = custSnap.data().totalBill || 0;
            const newBill = Math.max(0, currentBill - saleItem.salePrice);

            t.update(invRef, { qty: 1 }); 
            t.update(custRef, { totalBill: newBill, lastUpdated: serverTimestamp() }); 
            t.delete(saleRef);
        });
        showToast("Item Returned & Stock Restored"); 
        playSound('delete');
     } catch(e) { showToast("Return Failed", 'error'); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fade-in overflow-hidden">
        <div className={`w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl shadow-2xl transform transition-all scale-100 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-start ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div><h2 className={`text-2xl font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}><Users className="text-blue-500"/> {activeCustomer.name}</h2><p className="text-xs opacity-50 font-bold uppercase tracking-wider mt-1">Customer Account History</p></div>
                <button onClick={onClose} className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className={`p-3 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}><p className="text-[10px] font-bold opacity-50 uppercase mb-1">Total Bill</p><p className="text-sm sm:text-lg font-black text-blue-500 whitespace-nowrap leading-tight">{formatCurrency(activeCustomer.totalBill)}</p></div>
                    <div className={`p-3 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}><p className="text-[10px] font-bold opacity-50 uppercase mb-1">Paid</p><p className="text-sm sm:text-lg font-black text-emerald-500 whitespace-nowrap leading-tight">{formatCurrency(activeCustomer.totalPaid)}</p></div>
                    <div className={`p-3 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}><p className="text-[10px] font-bold opacity-50 uppercase mb-1">Balance</p><p className="text-sm sm:text-lg font-black text-rose-500 whitespace-nowrap leading-tight">{formatCurrency((activeCustomer.totalBill||0) - (activeCustomer.totalPaid||0))}</p></div>
                </div>
                <div className={`p-4 mb-6 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <label className="text-xs font-bold opacity-50 uppercase mb-2 block">Quick Actions</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input inputMode="numeric" type="number" min="0" onKeyDown={handleNumberInput} placeholder="Amount" className={`w-full sm:flex-1 p-2 rounded-lg bg-transparent border text-sm focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'border-slate-600' : 'border-slate-300'}`} value={modalAmount} onChange={e=>setModalAmount(e.target.value)}/>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={handleModalPayment} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95">Pay</button>
                            <button onClick={handleModalRefund} className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95">Refund</button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mb-4">
                    <button onClick={() => setCustomerModalTab('payments')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${customerModalTab === 'payments' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}><Receipt size={14} /> Payments</button>
                    <button onClick={() => setCustomerModalTab('purchases')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${customerModalTab === 'purchases' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}><ShoppingBag size={14} /> Purchases</button>
                </div>
                <div className="space-y-3">
                    {customerModalTab === 'payments' ? (
                        customerHistory.length > 0 ? (
                            customerHistory.map((record) => (
                                <div key={record.id} className={`p-4 rounded-xl flex justify-between items-center border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${record.type === 'Refund' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{record.type === 'Refund' ? <RefreshCcw size={16}/> : <Receipt size={16}/>}</div>
                                        <div><p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{record.type || 'Payment'}</p><p className="text-xs opacity-50">{record.date ? new Date(record.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'}</p></div>
                                    </div>
                                    <span className={`font-bold ${record.type === 'Refund' ? 'text-rose-500' : 'text-emerald-500'}`}>{record.type === 'Refund' ? '-' : '+'}{formatCurrency(record.amount)}</span>
                                </div>
                            ))
                        ) : <div className="text-center py-8 opacity-40 text-sm border-2 border-dashed rounded-xl">No payment history found</div>
                    ) : (
                        customerPurchases.length > 0 ? (
                            customerPurchases.map((item) => (
                                <div key={item.id} className={`p-4 rounded-xl flex justify-between items-center border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-purple-500/10 text-purple-500"><ShoppingBag size={16}/></div>
                                        <div className="overflow-hidden"><p className={`font-bold text-sm truncate w-32 sm:w-auto ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.suitId} <span className="opacity-50 font-normal">({item.brand})</span></p><p className="text-xs opacity-50">{item.date ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2"><span className="font-bold text-purple-500">{formatCurrency(item.salePrice)}</span><button onClick={(e) => { e.stopPropagation(); handleReturnItem(item); }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors" title="Return Item"><Undo2 size={16}/></button></div>
                                </div>
                            ))
                        ) : <div className="text-center py-8 opacity-40 text-sm border-2 border-dashed rounded-xl">No purchases found</div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}