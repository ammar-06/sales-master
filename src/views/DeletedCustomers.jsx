import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Archive, RotateCcw } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, playSound } from '../utils/helpers';
import { ConfirmationModal } from '../components/ui/UIComponents';

export default function DeletedCustomers({ customers, user, showToast, darkMode, setViewingCustomer, setCustomerModalTab }) {
  const [modalConfig, setModalConfig] = useState({ isOpen: false, id: null });

  const deletedCust = useMemo(() => {
    return customers.filter(c => c.status === 'deleted');
  }, [customers]);

  const handleRestore = async () => {
      try {
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, modalConfig.id), {
            status: 'active'
        });
        showToast("Customer Restored");
        playSound('success');
      } catch (error) {
        showToast("Error restoring", 'error');
      }
      setModalConfig({ isOpen: false, id: null });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden pb-20"> {/* Fixed Layout Container */}
        <ConfirmationModal 
            isOpen={modalConfig.isOpen} 
            onClose={()=>setModalConfig({...modalConfig, isOpen:false})} 
            onConfirm={handleRestore} 
            title="Restore Customer?" 
            message="This customer will appear in the main list again." 
            isDanger={false} 
            darkMode={darkMode} 
        />
        
        <div className="p-4 sm:p-6 flex flex-col h-full">
            {/* Header - Fixed */}
            <h2 className={`shrink-0 text-xl sm:text-2xl font-black mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Archive className="text-red-500"/> Deleted Customers
            </h2>

            {/* List - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {deletedCust.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => {setViewingCustomer(c); setCustomerModalTab('payments');}}
                            // UPDATED BORDER: border-slate-300 for clearer visibility in Light Mode
                            className={`relative p-3 sm:p-5 rounded-2xl border opacity-75 hover:opacity-100 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300 shadow-sm'}`}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                                <p className={`font-bold text-sm sm:text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>{c.name}</p>
                                <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full font-bold">Deleted</span>
                            </div>
                            <div className="text-[10px] sm:text-sm opacity-60 mb-3">
                                <div className="flex justify-between"><span>Bal:</span><b>{formatCurrency((c.totalBill||0)-(c.totalPaid||0))}</b></div>
                            </div>
                            <div className="flex gap-1.5 relative z-10">
                                    <button className="flex-1 py-1.5 bg-slate-500/10 text-slate-500 text-[10px] sm:text-xs font-bold rounded-lg hover:bg-slate-500 hover:text-white transition-colors">View</button>
                                    <button onClick={(e) => { e.stopPropagation(); setModalConfig({isOpen:true, id:c.id}); }} className="flex-1 py-1.5 bg-blue-500/10 text-blue-500 text-[10px] sm:text-xs font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center gap-1"><RotateCcw size={12}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}