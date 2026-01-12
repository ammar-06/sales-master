import React, { useState, useMemo } from 'react';
import { collection, doc, updateDoc, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Wallet, RefreshCcw, Archive, Users, Receipt, ShoppingBag, X, Undo2 } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, handleNumberInput, playSound } from '../utils/helpers';
import { ConfirmationModal } from '../components/ui/UIComponents';

export default function Customers({ customers, payments, sales, user, showToast, darkMode, setViewingCustomer, viewingCustomer, setCustomerModalTab, customerModalTab }) {
  const [paymentCustomerSearch, setPaymentCustomerSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ customerId: '', amount: '' });
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Local state for the modal inputs
  const [modalAmount, setModalAmount] = useState('');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null, extraData: null });

  // --- FILTERS & SEARCH ---
  const paymentCustomerMatches = useMemo(() => {
    if (!paymentCustomerSearch) return [];
    const lower = paymentCustomerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(lower) && c.status !== 'deleted').slice(0, 5);
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
    return customers.filter(c => c.status !== 'deleted' && (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()))
      .sort((a, b) => {
        const balA = (a.totalBill || 0) - (a.totalPaid || 0); const balB = (b.totalBill || 0) - (b.totalPaid || 0);
        if ((balA <= 0) !== (balB <= 0)) return (balA <= 0) ? 1 : -1;
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      });
  }, [customers, customerSearch]);

  // Derived state for the Modal
  const activeCustomer = useMemo(() => customers.find(c => c.id === viewingCustomer?.id) || viewingCustomer, [customers, viewingCustomer]);
  
  const customerHistory = useMemo(() => {
      if (!activeCustomer) return [];
      // Sort payments by date descending (newest first)
      return payments.filter(p => p.customerId === activeCustomer.id).sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
  }, [payments, activeCustomer]);

  const customerPurchases = useMemo(() => {
      if (!activeCustomer) return [];
      // Sort sales by date descending
      return sales.filter(s => s.customerId === activeCustomer.id).sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
  }, [sales, activeCustomer]);

  // --- ACTIONS ---
  // 1. Top Quick Payment Bar Logic
  const handleAddPayment = async () => {
      if (!user) return;
      const cust = customers.find(c => c.id === paymentForm.customerId);
      if (!cust) { showToast("Select a valid customer", 'error'); return; }
      const pending = (cust?.totalBill || 0) - (cust?.totalPaid || 0);
      const amountToAdd = Number(paymentForm.amount);
      if (!amountToAdd || amountToAdd <= 0) { showToast("Amount must be positive", 'error'); return; }
      if (amountToAdd > pending) { showToast(`Max payment allowed: Rs ${pending}`, 'error'); return; }
      try {
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, paymentForm.customerId), { totalPaid: (cust.totalPaid||0) + amountToAdd, lastPaymentDate: serverTimestamp() });
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), { customerId: paymentForm.customerId, amount: amountToAdd, date: serverTimestamp(), type: 'Payment' });
        setPaymentForm({ customerId: '', amount: '' }); setPaymentCustomerSearch(''); showToast("Payment Recorded!"); playSound('success');
      } catch (err) { showToast("Error adding payment", 'error'); }
  };

  const handleRefund = async () => {
      if (!user) return;
      const cust = customers.find(c => c.id === paymentForm.customerId);
      if (!cust) { showToast("Select a customer first", 'error'); return; }
      const amountToRefund = Number(paymentForm.amount);
      if (!amountToRefund || amountToRefund <= 0) { showToast("Amount must be positive", 'error'); return; }
      try {
        const newPaid = Math.max(0, (cust.totalPaid || 0) - amountToRefund);
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, paymentForm.customerId), { totalPaid: newPaid });
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), { customerId: paymentForm.customerId, amount: amountToRefund, date: serverTimestamp(), type: 'Refund' });
        setPaymentForm({ customerId: '', amount: '' }); setPaymentCustomerSearch(''); showToast("Refund Processed!"); playSound('delete');
      } catch (err) { showToast("Error processing refund", 'error'); }
  };

  // 2. Modal Quick Actions Logic (Inside the Customer Box)
  const handleModalPayment = async () => {
    if (!activeCustomer || !modalAmount || Number(modalAmount) <= 0) return;
    const amountToAdd = Number(modalAmount);
    const currentPaid = activeCustomer.totalPaid || 0;
    const pending = (activeCustomer.totalBill || 0) - currentPaid;

    if (amountToAdd > pending) { showToast(`Max payment allowed: Rs ${pending}`, 'error'); return; }

    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, activeCustomer.id), {
        totalPaid: currentPaid + amountToAdd, 
        lastPaymentDate: serverTimestamp()
      });
      await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), {
          customerId: activeCustomer.id,
          amount: amountToAdd,
          date: serverTimestamp(),
          type: 'Payment'
      });
      setModalAmount('');
      showToast("Payment Recorded!"); 
      playSound('success');
    } catch (err) { showToast("Error adding payment", 'error'); }
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

  const confirmAction = async () => {
      try {
          if(modalConfig.type === 'DELETE') {
             await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, modalConfig.id), { status: 'deleted' });
             showToast("Customer Removed"); playSound('delete');
          } else if (modalConfig.type === 'RETURN_ITEM') {
             const saleItem = modalConfig.extraData;
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
             showToast("Item Returned & Stock Restored"); playSound('delete');
          }
      } catch(e) { 
          console.error(e);
          showToast("Action Failed", 'error'); 
      }
      setModalConfig({isOpen:false, type:null, id: null, extraData: null});
  };

  return (
    <div className="flex flex-col h-full overflow-hidden gap-6 pb-20">
       <ConfirmationModal isOpen={modalConfig.isOpen} onClose={()=>setModalConfig({...modalConfig, isOpen:false})} onConfirm={confirmAction} title={modalConfig.type === 'DELETE' ? "Remove Customer?" : "Return Item?"} message={modalConfig.type === 'DELETE' ? "Customer will be moved to Deleted Customers." : "Item will be added back to stock and bill reduced."} isDanger={true} darkMode={darkMode} />
       
       {/* Top Quick Payment Bar */}
       <div className={`shrink-0 p-4 sm:p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-4 sm:gap-6 items-center ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
          <div className="flex-1 w-full">
             <h3 className={`font-bold mb-3 text-lg flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}><Wallet size={20} className="text-blue-500"/> Quick Payment</h3>
             <div className="flex gap-2 sm:gap-3 items-start flex-col sm:flex-row">
                <div className="relative flex-1 w-full">
                   <input type="text" placeholder="Search Customer..." className={`w-full p-3 rounded-xl bg-transparent border text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-slate-600 focus:bg-slate-900' : 'border-slate-200 focus:bg-gray-50'}`} value={paymentCustomerSearch} 
                     onChange={(e) => { const val = e.target.value; setPaymentCustomerSearch(val); setCustomerSearch(val); setShowCustomerSuggestions(true); setPaymentForm(prev => ({ ...prev, customerId: '' })); }} 
                     onFocus={() => setShowCustomerSuggestions(true)} onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)} />
                   {showCustomerSuggestions && paymentCustomerSearch && paymentCustomerMatches.length > 0 && (<div className={`absolute top-full left-0 w-full mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>{paymentCustomerMatches.map(c => (<div key={c.id} onMouseDown={() => selectPaymentCustomer(c)} className={`p-3 text-sm cursor-pointer hover:bg-blue-500 hover:text-white transition-colors ${darkMode ? 'border-slate-700' : 'border-slate-100'} border-b last:border-0`}>{c.name}</div>))}</div>)}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <input inputMode="numeric" type="number" onKeyDown={handleNumberInput} placeholder="Amount" className={`p-3 rounded-xl bg-transparent border w-full sm:w-32 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${darkMode ? 'border-slate-600 focus:bg-slate-900' : 'border-slate-200 focus:bg-gray-50'}`} value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm, amount:e.target.value})}/>
                    <button onClick={handleAddPayment} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 flex-1">Add</button>
                </div>
             </div>
          </div>
       </div>
       
       {/* Customer Grid */}
       <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
             {filteredCust.map(c => {
                const bal = (c.totalBill||0)-(c.totalPaid||0);
                return (<div key={c.id} className={`relative p-3 sm:p-5 rounded-2xl border shadow-sm h-fit transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg ${darkMode?'bg-slate-800 border-slate-700 hover:border-blue-500/50':'bg-white border-slate-200 shadow-slate-200/50 hover:border-blue-300'}`} onClick={() => {setViewingCustomer(c); setCustomerModalTab('payments');}}>
                      <div className="flex justify-between items-start mb-2 sm:mb-3"><h4 className={`font-bold text-sm sm:text-lg truncate w-full ${darkMode?'text-white':'text-gray-900'}`}>{c.name}</h4></div>
                      <div className="mb-3"><span className="text-[10px] sm:text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md font-bold">Total: {formatCurrency(c.totalBill||0)}</span></div>
                      <div className="text-[10px] sm:text-sm space-y-1.5 opacity-90"><div className="flex justify-between"><span>Rem:</span><b className={bal > 0 ? "text-amber-500" : "text-gray-500"}>{formatCurrency(bal)}</b></div><div className="flex justify-between"><span>Paid:</span><b className="text-emerald-500">{formatCurrency(c.totalPaid||0)}</b></div></div>
                      <div className="mt-3 flex gap-2 relative z-10"><button className="flex-1 py-1.5 bg-blue-500/10 text-blue-500 text-[10px] sm:text-xs font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors">View Details</button>{bal <= 0 && (<button onClick={(e)=>{e.stopPropagation(); setModalConfig({isOpen:true, type:'DELETE', id:c.id})}} className="flex-1 py-1.5 bg-red-500/10 text-red-500 text-[10px] sm:text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors">Remove</button>)}</div>
                   </div>)
             })}
          </div>
       </div>

       {/* Customer Detail Modal (Restored Quick Actions & History) */}

    </div>
  );
}